import rawCatalog from '@/assets/data/voice_catalog.json';
import type { VoiceCatalog, VoiceLine, VoiceOperator } from '@/models/voice-line';

const catalog = rawCatalog as VoiceCatalog;

function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function getVoiceCatalog() {
  return catalog;
}

export function searchVoiceOperators(query: string): VoiceOperator[] {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return catalog.operators;
  }

  return catalog.operators.filter((operator) =>
    [operator.name, operator.id].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery)
    )
  );
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
