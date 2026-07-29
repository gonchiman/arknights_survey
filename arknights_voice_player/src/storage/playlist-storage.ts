import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PlaylistVoiceItem, VoicePlaylist } from '@/models/playlist';

const playlistStorageKey = 'arknights_voice_player.playlists.v1';

type StoredPlaylists = {
  version: 1;
  playlists: VoicePlaylist[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readPlaylistItem(value: unknown): PlaylistVoiceItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.operatorId !== 'string' ||
    typeof value.voiceId !== 'string' ||
    typeof value.addedAt !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    operatorId: value.operatorId,
    voiceId: value.voiceId,
    addedAt: value.addedAt,
  };
}

function readPlaylist(value: unknown): VoicePlaylist | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !Array.isArray(value.items)
  ) {
    return null;
  }

  const items = value.items
    .map(readPlaylistItem)
    .filter((item): item is PlaylistVoiceItem => item !== null);

  return {
    id: value.id,
    name: value.name,
    items,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export async function loadPlaylists(): Promise<VoicePlaylist[]> {
  const storedValue = await AsyncStorage.getItem(playlistStorageKey);

  if (!storedValue) {
    return [];
  }

  const parsedValue: unknown = JSON.parse(storedValue);

  if (
    !isRecord(parsedValue) ||
    parsedValue.version !== 1 ||
    !Array.isArray(parsedValue.playlists)
  ) {
    throw new Error('保存されているプレイリストの形式を読み取れません。');
  }

  return parsedValue.playlists
    .map(readPlaylist)
    .filter((playlist): playlist is VoicePlaylist => playlist !== null);
}

export async function savePlaylists(playlists: VoicePlaylist[]): Promise<void> {
  const storedPlaylists: StoredPlaylists = {
    version: 1,
    playlists,
  };

  await AsyncStorage.setItem(playlistStorageKey, JSON.stringify(storedPlaylists));
}
