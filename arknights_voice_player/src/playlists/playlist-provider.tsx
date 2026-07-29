import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { VoicePlaylist } from '@/models/playlist';
import { loadPlaylists, savePlaylists } from '@/storage/playlist-storage';

export type PlaylistStorageStatus = 'loading' | 'ready' | 'error';

type PlaylistContextValue = {
  addVoiceToPlaylist: (playlistId: string, operatorId: string, voiceId: string) => void;
  createPlaylist: (name: string) => string | null;
  deletePlaylist: (playlistId: string) => void;
  movePlaylistItem: (playlistId: string, fromIndex: number, toIndex: number) => void;
  playlists: VoicePlaylist[];
  removePlaylistItem: (playlistId: string, itemId: string) => void;
  renamePlaylist: (playlistId: string, name: string) => void;
  storageError: string | null;
  storageStatus: PlaylistStorageStatus;
};

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function updatePlaylist(
  playlists: VoicePlaylist[],
  playlistId: string,
  updater: (playlist: VoicePlaylist) => VoicePlaylist
) {
  return playlists.map((playlist) => (playlist.id === playlistId ? updater(playlist) : playlist));
}

export function PlaylistProvider({ children }: PropsWithChildren) {
  const [playlists, setPlaylists] = useState<VoicePlaylist[]>([]);
  const [storageStatus, setStorageStatus] = useState<PlaylistStorageStatus>('loading');
  const [storageError, setStorageError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isCancelled = false;

    void loadPlaylists()
      .then((storedPlaylists) => {
        if (isCancelled) {
          return;
        }

        setPlaylists(storedPlaylists);
        hasLoadedRef.current = true;
        setStorageStatus('ready');
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'プレイリストを読み込めませんでした。';
        hasLoadedRef.current = true;
        setStorageError(message);
        setStorageStatus('error');
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }

    writeChainRef.current = writeChainRef.current
      .catch(() => undefined)
      .then(() => savePlaylists(playlists))
      .then(() => {
        setStorageError(null);
        setStorageStatus('ready');
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'プレイリストを保存できませんでした。';
        setStorageError(message);
        setStorageStatus('error');
      });
  }, [playlists]);

  const createPlaylist = useCallback((name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return null;
    }

    const now = new Date().toISOString();
    const playlistId = createId('playlist');

    setPlaylists((currentPlaylists) => [
      ...currentPlaylists,
      {
        id: playlistId,
        name: trimmedName,
        items: [],
        createdAt: now,
        updatedAt: now,
      },
    ]);

    return playlistId;
  }, []);

  const renamePlaylist = useCallback((playlistId: string, name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    setPlaylists((currentPlaylists) =>
      updatePlaylist(currentPlaylists, playlistId, (playlist) => ({
        ...playlist,
        name: trimmedName,
        updatedAt: new Date().toISOString(),
      }))
    );
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((currentPlaylists) =>
      currentPlaylists.filter((playlist) => playlist.id !== playlistId)
    );
  }, []);

  const addVoiceToPlaylist = useCallback(
    (playlistId: string, operatorId: string, voiceId: string) => {
      setPlaylists((currentPlaylists) =>
        updatePlaylist(currentPlaylists, playlistId, (playlist) => {
          const now = new Date().toISOString();

          return {
            ...playlist,
            items: [
              ...playlist.items,
              {
                id: createId('playlist-item'),
                operatorId,
                voiceId,
                addedAt: now,
              },
            ],
            updatedAt: now,
          };
        })
      );
    },
    []
  );

  const removePlaylistItem = useCallback((playlistId: string, itemId: string) => {
    setPlaylists((currentPlaylists) =>
      updatePlaylist(currentPlaylists, playlistId, (playlist) => ({
        ...playlist,
        items: playlist.items.filter((item) => item.id !== itemId),
        updatedAt: new Date().toISOString(),
      }))
    );
  }, []);

  const movePlaylistItem = useCallback(
    (playlistId: string, fromIndex: number, toIndex: number) => {
      setPlaylists((currentPlaylists) =>
        updatePlaylist(currentPlaylists, playlistId, (playlist) => {
          if (
            fromIndex < 0 ||
            fromIndex >= playlist.items.length ||
            toIndex < 0 ||
            toIndex >= playlist.items.length ||
            fromIndex === toIndex
          ) {
            return playlist;
          }

          const nextItems = [...playlist.items];
          const [movedItem] = nextItems.splice(fromIndex, 1);
          nextItems.splice(toIndex, 0, movedItem);

          return {
            ...playlist,
            items: nextItems,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      addVoiceToPlaylist,
      createPlaylist,
      deletePlaylist,
      movePlaylistItem,
      playlists,
      removePlaylistItem,
      renamePlaylist,
      storageError,
      storageStatus,
    }),
    [
      addVoiceToPlaylist,
      createPlaylist,
      deletePlaylist,
      movePlaylistItem,
      playlists,
      removePlaylistItem,
      renamePlaylist,
      storageError,
      storageStatus,
    ]
  );

  return <PlaylistContext.Provider value={contextValue}>{children}</PlaylistContext.Provider>;
}

export function usePlaylists() {
  const context = useContext(PlaylistContext);

  if (!context) {
    throw new Error('usePlaylists must be used inside PlaylistProvider');
  }

  return context;
}
