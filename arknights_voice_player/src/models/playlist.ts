export type PlaylistVoiceItem = {
  id: string;
  operatorId: string;
  voiceId: string;
  addedAt: string;
};

export type VoicePlaylist = {
  id: string;
  name: string;
  items: PlaylistVoiceItem[];
  createdAt: string;
  updatedAt: string;
};
