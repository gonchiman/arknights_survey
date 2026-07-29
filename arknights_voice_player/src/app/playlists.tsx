import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PlaylistVoiceItem, VoicePlaylist } from '@/models/playlist';
import {
  useAppAudioPlayer,
  type PlayableVoice,
} from '@/player/audio-player-provider';
import { usePlaylists } from '@/playlists/playlist-provider';
import { getVoiceLine } from '@/services/voice-line-repository';

type ActionButtonProps = {
  destructive?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  primary?: boolean;
};

function ActionButton({
  destructive = false,
  disabled = false,
  label,
  onPress,
  primary = false,
}: ActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: primary
            ? '#208AEF'
            : destructive
              ? '#FBE1DF'
              : theme.backgroundSelected,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={primary ? styles.primaryButtonText : destructive ? styles.destructiveText : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function PlaylistCard({
  onPress,
  playlist,
}: {
  onPress: () => void;
  playlist: VoicePlaylist;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.playlistCard}>
        <View style={styles.playlistCardText}>
          <ThemedText type="smallBold">{playlist.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {playlist.items.length}件のボイス
          </ThemedText>
        </View>
        <ThemedText type="linkPrimary">開く →</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

type ResolvedPlaylistItem = {
  entry: PlayableVoice | null;
  item: PlaylistVoiceItem;
};

function PlaylistVoiceCard({
  canMoveDown,
  canMoveUp,
  canPlay,
  onMoveDown,
  onMoveUp,
  onPlay,
  onRemove,
  resolvedItem,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  canPlay: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onPlay: () => void;
  onRemove: () => void;
  resolvedItem: ResolvedPlaylistItem;
}) {
  const { entry, item } = resolvedItem;

  return (
    <ThemedView type="backgroundElement" style={styles.voiceCard}>
      {entry ? (
        <>
          <View style={styles.voiceHeading}>
            <ThemedText type="smallBold" style={styles.voiceTitle}>
              {entry.voice.title || entry.voice.voiceId || entry.voice.id}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {entry.operator.name}
            </ThemedText>
          </View>
          <ThemedText>{entry.voice.text}</ThemedText>
          <ThemedText type="code" themeColor="textSecondary">
            {entry.voice.voiceId}
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText type="smallBold">ボイスデータが見つかりません</ThemedText>
          <ThemedText type="code" themeColor="textSecondary">
            {item.operatorId} / {item.voiceId}
          </ThemedText>
        </>
      )}

      <View style={styles.itemActions}>
        <ActionButton
          disabled={!canPlay}
          label={canPlay ? 'ここから再生' : '音声未配置'}
          onPress={onPlay}
          primary={canPlay}
        />
        <ActionButton disabled={!canMoveUp} label="↑" onPress={onMoveUp} />
        <ActionButton disabled={!canMoveDown} label="↓" onPress={onMoveDown} />
        <ActionButton destructive label="削除" onPress={onRemove} />
      </View>
    </ThemedView>
  );
}

export default function PlaylistsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { hasVoiceAudio, playVoiceQueue } = useAppAudioPlayer();
  const {
    createPlaylist,
    deletePlaylist,
    movePlaylistItem,
    playlists,
    removePlaylistItem,
    renamePlaylist,
    storageError,
    storageStatus,
  } = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const selectedPlaylist =
    playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  const resolvedItems = useMemo<ResolvedPlaylistItem[]>(
    () =>
      selectedPlaylist
        ? selectedPlaylist.items.map((item) => ({
            item,
            entry: getVoiceLine(item.operatorId, item.voiceId),
          }))
        : [],
    [selectedPlaylist]
  );
  const playableItems = useMemo(
    () =>
      resolvedItems.filter(
        (resolvedItem): resolvedItem is ResolvedPlaylistItem & { entry: PlayableVoice } =>
          resolvedItem.entry !== null && hasVoiceAudio(resolvedItem.entry.voice)
      ),
    [hasVoiceAudio, resolvedItems]
  );

  const createNewPlaylist = () => {
    if (storageStatus === 'loading') {
      return;
    }

    const playlistId = createPlaylist(newPlaylistName);

    if (!playlistId) {
      return;
    }

    setRenameValue(newPlaylistName.trim());
    setNewPlaylistName('');
    setSelectedPlaylistId(playlistId);
  };

  const playEntries = (entries: PlayableVoice[], startIndex = 0) => {
    if (!selectedPlaylist || !playVoiceQueue(selectedPlaylist.name, entries, startIndex)) {
      return;
    }

    router.navigate('/');
  };

  if (selectedPlaylist) {
    const renderPlaylistVoice = ({
      index,
      item,
    }: ListRenderItemInfo<ResolvedPlaylistItem>) => {
      const playableIndex = playableItems.findIndex(
        (playableItem) => playableItem.item.id === item.item.id
      );
      const canPlay = playableIndex >= 0;

      return (
        <PlaylistVoiceCard
          canMoveDown={index < resolvedItems.length - 1}
          canMoveUp={index > 0}
          canPlay={canPlay}
          onMoveDown={() => movePlaylistItem(selectedPlaylist.id, index, index + 1)}
          onMoveUp={() => movePlaylistItem(selectedPlaylist.id, index, index - 1)}
          onPlay={() =>
            playEntries(
              playableItems.map((playableItem) => playableItem.entry),
              playableIndex
            )
          }
          onRemove={() => removePlaylistItem(selectedPlaylist.id, item.item.id)}
          resolvedItem={item}
        />
      );
    };

    return (
      <FlatList
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.listContent}
        data={resolvedItems}
        keyExtractor={(resolvedItem) => resolvedItem.item.id}
        renderItem={renderPlaylistVoice}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <SafeAreaView style={styles.detailHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedPlaylistId(null)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="linkPrimary">← プレイリスト一覧</ThemedText>
            </Pressable>

            <View style={styles.heading}>
              <ThemedText type="subtitle">{selectedPlaylist.name}</ThemedText>
              <ThemedText themeColor="textSecondary">
                {selectedPlaylist.items.length}件中、{playableItems.length}件を再生できます。
              </ThemedText>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                accessibilityLabel="プレイリスト名"
                onChangeText={setRenameValue}
                placeholder="プレイリスト名"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                  },
                ]}
                value={renameValue}
              />
              <ActionButton
                disabled={!renameValue.trim() || renameValue.trim() === selectedPlaylist.name}
                label="名前を保存"
                onPress={() => renamePlaylist(selectedPlaylist.id, renameValue)}
              />
            </View>

            <View style={styles.detailActions}>
              <ActionButton
                disabled={playableItems.length === 0}
                label="先頭から連続再生"
                onPress={() =>
                  playEntries(playableItems.map((playableItem) => playableItem.entry))
                }
                primary
              />
              <ActionButton
                destructive
                label="プレイリストを削除"
                onPress={() => setIsConfirmingDelete(true)}
              />
            </View>

            {isConfirmingDelete && (
              <ThemedView type="backgroundElement" style={styles.deleteConfirmation}>
                <ThemedText type="smallBold">
                  「{selectedPlaylist.name}」と登録内容を削除しますか？
                </ThemedText>
                <View style={styles.detailActions}>
                  <ActionButton label="キャンセル" onPress={() => setIsConfirmingDelete(false)} />
                  <ActionButton
                    destructive
                    label="削除する"
                    onPress={() => {
                      deletePlaylist(selectedPlaylist.id);
                      setIsConfirmingDelete(false);
                      setSelectedPlaylistId(null);
                    }}
                  />
                </View>
              </ThemedView>
            )}

            <ThemedText type="small" themeColor="textSecondary">
              ↑↓で再生順を変更できます。登録内容はこの端末内へ自動保存されます。
            </ThemedText>
          </SafeAreaView>
        }
        ListEmptyComponent={
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText>このプレイリストにはまだボイスがありません。</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              「ボイス」画面でオペレーターを開き、追加先を選んで登録してください。
            </ThemedText>
          </ThemedView>
        }
      />
    );
  }

  const renderPlaylist = ({ item }: ListRenderItemInfo<VoicePlaylist>) => (
    <PlaylistCard
      onPress={() => {
        setRenameValue(item.name);
        setIsConfirmingDelete(false);
        setSelectedPlaylistId(item.id);
      }}
      playlist={item}
    />
  );

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.listContent}
      data={playlists}
      keyExtractor={(playlist) => playlist.id}
      renderItem={renderPlaylist}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <SafeAreaView style={styles.catalogHeader}>
          <View style={styles.heading}>
            <ThemedText type="subtitle">プレイリスト</ThemedText>
            <ThemedText themeColor="textSecondary">
              好きな英語ボイスをまとめて、登録順に連続再生できます。
            </ThemedText>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="新しいプレイリスト名"
              onChangeText={setNewPlaylistName}
              onSubmitEditing={createNewPlaylist}
              placeholder="新しいプレイリスト名"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                },
              ]}
              value={newPlaylistName}
            />
            <ActionButton
              disabled={storageStatus === 'loading' || !newPlaylistName.trim()}
              label="作成"
              onPress={createNewPlaylist}
              primary
            />
          </View>

          {storageStatus === 'loading' && (
            <ThemedText type="small" themeColor="textSecondary">
              保存済みプレイリストを読み込んでいます。
            </ThemedText>
          )}
          {storageError && (
            <ThemedView type="backgroundElement" style={styles.errorNotice}>
              <ThemedText type="small" style={styles.destructiveText}>
                {storageError}
              </ThemedText>
            </ThemedView>
          )}
        </SafeAreaView>
      }
      ListEmptyComponent={
        storageStatus !== 'loading' ? (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText>プレイリストはまだありません。</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              名前を入力して、最初のプレイリストを作成してください。
            </ThemedText>
          </ThemedView>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  catalogHeader: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  detailHeader: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  heading: {
    gap: Spacing.one,
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: Spacing.two,
  },
  textInput: {
    flexGrow: 1,
    minWidth: 220,
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  actionButton: {
    minWidth: 56,
    minHeight: 44,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  destructiveText: {
    color: '#A52822',
  },
  playlistCard: {
    minHeight: 72,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  playlistCardText: {
    flex: 1,
    gap: Spacing.one,
  },
  voiceCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  voiceHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  voiceTitle: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  detailActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  emptyState: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorNotice: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  deleteConfirmation: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  separator: {
    height: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
