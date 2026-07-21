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
import type { VoiceLine, VoiceOperator } from '@/models/voice-line';
import { useAppAudioPlayer } from '@/player/audio-player-provider';
import {
  getVoiceCatalog,
  searchVoiceLines,
  searchVoiceOperators,
} from '@/services/voice-line-repository';

const catalog = getVoiceCatalog();

function OperatorCard({ operator, onPress }: { operator: VoiceOperator; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.operatorCard}>
        <View style={styles.cardText}>
          <ThemedText type="smallBold">{operator.name}</ThemedText>
          <ThemedText type="code" themeColor="textSecondary">
            {operator.id}
          </ThemedText>
        </View>
        <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">{operator.voices.length}</ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

function VoiceCard({
  operator,
  voice,
}: {
  operator: VoiceOperator;
  voice: VoiceLine;
}) {
  const theme = useTheme();
  const { playVoiceDemo } = useAppAudioPlayer();
  const title = voice.title || voice.voiceId || voice.id;

  return (
    <ThemedView type="backgroundElement" style={styles.voiceCard}>
      <View style={styles.voiceHeading}>
        <ThemedText type="smallBold" style={styles.voiceTitle}>
          {title}
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          {voice.voiceId}
        </ThemedText>
      </View>
      <ThemedText>{voice.text}</ThemedText>
      <ThemedText type="code" themeColor="textSecondary">
        {voice.assetPath}
      </ThemedText>
      <Pressable
        accessibilityHint="実際のゲーム音声ではなく、動作確認用音声を再生します"
        accessibilityRole="button"
        onPress={() => playVoiceDemo(operator, voice)}
        style={({ pressed }) => [
          styles.demoButton,
          {
            backgroundColor: theme.backgroundSelected,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="smallBold">テスト音声で再生</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

export default function VoiceCatalogScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<VoiceOperator | null>(null);
  const filteredOperators = useMemo(() => searchVoiceOperators(query), [query]);
  const filteredVoices = useMemo(
    () => (selectedOperator ? searchVoiceLines(selectedOperator, voiceQuery) : []),
    [selectedOperator, voiceQuery]
  );

  if (selectedOperator) {
    return (
      <FlatList
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.listContent}
        data={filteredVoices}
        keyExtractor={(voice) => voice.id}
        renderItem={({ item }) => <VoiceCard operator={selectedOperator} voice={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <SafeAreaView style={styles.detailHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedOperator(null)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="linkPrimary">← オペレーター一覧</ThemedText>
            </Pressable>
            <View style={styles.heading}>
              <ThemedText type="subtitle">{selectedOperator.name}</ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {selectedOperator.id}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {selectedOperator.voices.length}件の英語ボイステキスト
              </ThemedText>
            </View>
            <TextInput
              accessibilityLabel="ボイスを検索"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setVoiceQuery}
              placeholder="タイトル・本文・IDで検索"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="search"
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                },
              ]}
              value={voiceQuery}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {filteredVoices.length}件を表示
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.notice}>
              <ThemedText type="small">
                実音声は未配置です。「テスト音声で再生」は、選択内容がプレイヤーへ渡ることを確認する機能です。
              </ThemedText>
            </ThemedView>
          </SafeAreaView>
        }
      />
    );
  }

  const renderOperator = ({ item }: ListRenderItemInfo<VoiceOperator>) => (
    <OperatorCard
      operator={item}
      onPress={() => {
        setVoiceQuery('');
        setSelectedOperator(item);
      }}
    />
  );

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.listContent}
      data={filteredOperators}
      keyExtractor={(operator) => operator.id}
      renderItem={renderOperator}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <SafeAreaView style={styles.catalogHeader}>
          <View style={styles.heading}>
            <ThemedText type="subtitle">ボイス一覧</ThemedText>
            <ThemedText themeColor="textSecondary">
              {catalog.operatorCount}オペレーター・{catalog.voiceCount.toLocaleString()}件
            </ThemedText>
          </View>
          <TextInput
            accessibilityLabel="オペレーターを検索"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="名前またはIDで検索"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
              },
            ]}
            value={query}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {filteredOperators.length}件を表示
          </ThemedText>
        </SafeAreaView>
      }
      ListEmptyComponent={
        <ThemedView type="backgroundElement" style={styles.emptyState}>
          <ThemedText>条件に一致するオペレーターはありません。</ThemedText>
        </ThemedView>
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
  searchInput: {
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  operatorCard: {
    minHeight: 72,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cardText: {
    flex: 1,
    gap: Spacing.one,
  },
  countBadge: {
    minWidth: 44,
    minHeight: 36,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  voiceCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  voiceHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  voiceTitle: {
    flex: 1,
  },
  demoButton: {
    minHeight: 44,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  notice: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  emptyState: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
  },
  separator: {
    height: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
