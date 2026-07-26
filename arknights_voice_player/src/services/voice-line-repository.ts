import rawOperatorRarities from '@/assets/data/operator_rarities.json';
import rawCatalog from '@/assets/data/voice_catalog.json';
import type { VoiceCatalog, VoiceLine, VoiceOperator } from '@/models/voice-line';

type VoiceOperatorWithoutRarity = Omit<VoiceOperator, 'rarity'>;
type VoiceCatalogWithoutRarity = Omit<VoiceCatalog, 'operators'> & {
  operators: VoiceOperatorWithoutRarity[];
};

const sourceCatalog = rawCatalog as VoiceCatalogWithoutRarity;
const operatorRarities = rawOperatorRarities as Record<string, number>;
const catalog: VoiceCatalog = {
  ...sourceCatalog,
  operators: sourceCatalog.operators.map((operator) => ({
    ...operator,
    rarity: operatorRarities[operator.id] ?? null,
  })),
};

function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function getVoiceCatalog() {
  return catalog;
}

export function searchVoiceOperators(
  query: string,
  rarity: number | null = null
): VoiceOperator[] {
  const normalizedQuery = normalizeQuery(query);

  return catalog.operators.filter((operator) => {
    const matchesRarity = rarity === null || operator.rarity === rarity;
    const matchesQuery =
      !normalizedQuery ||
      [operator.name, operator.id].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery)
      );

    return matchesRarity && matchesQuery;
  });
}

export function searchVoiceLines(operator: VoiceOperator, query: string): VoiceLine[] {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return operator.voices;
  }

  return operator.voices.filter((voice) =>
    [voice.title, voice.text, voice.voiceId, voice.id].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery)
    )
  );
}
