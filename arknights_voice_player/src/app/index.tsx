import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppAudioPlayer } from '@/player/audio-player-provider';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

type PlayerButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void | Promise<void>;
  primary?: boolean;
};

function PlayerButton({ disabled = false, label, onPress, primary = false }: PlayerButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? '#208AEF' : theme.backgroundSelected,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}>
      <ThemedText style={primary && styles.primaryButtonText}>{label}</ThemedText>
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { player, status } = useAppAudioPlayer();

  const duration = status.duration || 0;
  const progress = duration > 0 ? Math.min(status.currentTime / duration, 1) : 0;
  const canControl = status.isLoaded && !status.error;

  const handlePlayPause = async () => {
    if (status.playing) {
      player.pause();
      return;
    }

    if (status.didJustFinish || (duration > 0 && status.currentTime >= duration)) {
      await player.seekTo(0);
    }

    player.play();
  };

  const handleReset = async () => {
    player.pause();
    await player.seekTo(0);
  };

  const playbackState = status.error
    ? '音声を読み込めませんでした'
    : status.isBuffering
      ? '読み込み中'
      : status.playing
        ? '再生中'
        : status.isLoaded
          ? '一時停止中'
          : '準備中';

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heading}>
          <ThemedText type="subtitle">Arknights Voice Player</ThemedText>
          <ThemedText themeColor="textSecondary">
            まずはテスト音声1件の再生機能を確認します。
          </ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.playerCard}>
          <View style={styles.trackInformation}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              TEST AUDIO
            </ThemedText>
            <ThemedText type="subtitle" style={styles.trackTitle}>
              Audio playback test
            </ThemedText>
            <ThemedText themeColor="textSecondary">assets/audio/test.wav</ThemedText>
          </View>

          <View style={styles.statusRow}>
            <ThemedText type="small">{playbackState}</ThemedText>
            <ThemedText type="code">
              {formatTime(status.currentTime)} / {formatTime(duration)}
            </ThemedText>
          </View>

          <View
            accessibilityLabel={`再生位置 ${formatTime(status.currentTime)} / ${formatTime(duration)}`}
            style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <View style={styles.controls}>
            <PlayerButton
              disabled={!canControl}
              label={status.playing ? '一時停止' : '再生'}
              onPress={handlePlayPause}
              primary
            />
            <PlayerButton disabled={!canControl} label="先頭に戻る" onPress={handleReset} />
          </View>

          {status.error && (
            <ThemedText type="small" style={styles.errorText}>
              {status.error}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          再生中にExplore画面へ移動しても、プレイヤーはレイアウト側で保持されます。
        </ThemedText>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.five,
  },
  heading: {
    gap: Spacing.two,
  },
  playerCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  trackInformation: {
    gap: Spacing.one,
  },
  trackTitle: {
    fontSize: 28,
    lineHeight: 36,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  progressTrack: {
    height: 8,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Spacing.two,
    backgroundColor: '#208AEF',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  button: {
    minWidth: 132,
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#C9342D',
  },
  note: {
    textAlign: 'center',
  },
});
