import rawOperatorProfessions from '@/assets/data/operator_professions.json';
import rawOperatorRarities from '@/assets/data/operator_rarities.json';
import rawCatalog from '@/assets/data/voice_catalog.json';
import type { VoiceCatalog, VoiceLine, VoiceOperator } from '@/models/voice-line';

type VoiceOperatorWithoutMetadata = Omit<VoiceOperator, 'profession' | 'rarity'>;
type VoiceCatalogWithoutMetadata = Omit<VoiceCatalog, 'operators'> & {
  operators: VoiceOperatorWithoutMetadata[];
};

const sourceCatalog = rawCatalog as VoiceCatalogWithoutMetadata;
const operatorRarities = rawOperatorRarities as Record<string, number>;
const operatorProfessions = rawOperatorProfessions as Record<string, string>;
const catalog: VoiceCatalog = {
  ...sourceCatalog,
  operators: sourceCatalog.operators.map((operator) => ({
    ...operator,
    rarity: operatorRarities[operator.id] ?? null,
    profession: operatorProfessions[operator.id] ?? null,
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
  rarity: number | null = null,
  profession: string | null = null
): VoiceOperator[] {
  const normalizedQuery = normalizeQuery(query);

  return catalog.operators.filter((operator) => {
    const matchesRarity = rarity === null || operator.rarity === rarity;
    const matchesProfession = profession === null || operator.profession === profession;
    const matchesQuery =
      !normalizedQuery ||
      [operator.name, operator.id].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery)
      );

    return matchesRarity && matchesProfession && matchesQuery;
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
