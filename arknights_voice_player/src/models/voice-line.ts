export type VoiceLine = {
  id: string;
  variantId: string;
  voiceId: string;
  title: string;
  text: string;
  index: number;
  assetPath: string;
};

export type VoiceOperator = {
  id: string;
  name: string;
  rarity: number | null;
  profession: string | null;
  voices: VoiceLine[];
};

export type VoiceCatalog = {
  operatorCount: number;
  voiceCount: number;
  operators: VoiceOperator[];
};
