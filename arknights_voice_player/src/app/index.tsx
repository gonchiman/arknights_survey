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
  const { currentTrack, pause, play, reset, status } = useAppAudioPlayer();

  const duration = status.duration || 0;
  const progress = duration > 0 ? Math.min(status.currentTime / duration, 1) : 0;
  const canControl = status.isLoaded && !status.error;

  const handlePlayPause = () => {
    if (status.playing) {
      pause();
      return;
    }

    return play();
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
          <ThemedText type="subtitle">再生中</ThemedText>
          <ThemedText themeColor="textSecondary">
            ボイス一覧で選択した内容は、このプレイヤーに反映されます。
          </ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.playerCard}>
          <View style={styles.trackInformation}>
            <View style={styles.badgeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {currentTrack.artist}
              </ThemedText>
              {currentTrack.isDemoAudio && (
                <View style={styles.demoBadge}>
                  <ThemedText type="smallBold" style={styles.demoBadgeText}>
                    テスト音声
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText type="subtitle" style={styles.trackTitle}>
              {currentTrack.title}
            </ThemedText>
            <ThemedText>{currentTrack.text}</ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              {currentTrack.assetPath}
            </ThemedText>
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
            <PlayerButton disabled={!canControl} label="先頭に戻る" onPress={reset} />
          </View>

          {status.error && (
            <ThemedText type="small" style={styles.errorText}>
              {status.error}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          現在は実ボイス未配置のため、一覧から選んだ場合も「Audio playback test.」が再生されます。
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
    gap: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  demoBadge: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: '#FFF0C2',
  },
  demoBadgeText: {
    color: '#714B00',
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
