import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
  type AudioSource,
  type AudioStatus,
} from 'expo-audio';
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
import { Platform } from 'react-native';

import type { VoiceLine, VoiceOperator } from '@/models/voice-line';

const testAudioSource = require('@/assets/audio/test.wav');
const voiceAudioManifestUrl = '/audio/voice_en/manifest.json';

export type VoiceAudioLibraryStatus = 'loading' | 'ready' | 'missing' | 'unsupported';

type VoiceAudioManifest = {
  assetPaths: string[];
};

function getWebVoiceAudioSource(assetPath: string): AudioSource {
  const encodedPath = assetPath.split('/').map(encodeURIComponent).join('/');

  return { uri: `/audio/voice_en/${encodedPath}.mp3` };
}

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  text: string;
  assetPath: string;
  isDemoAudio: boolean;
};

export type PlayableVoice = {
  operator: VoiceOperator;
  voice: VoiceLine;
};

const initialTrack: PlayerTrack = {
  id: 'audio-playback-test',
  title: 'Audio playback test',
  artist: 'Arknights Voice Player',
  text: 'Audio playback test.',
  assetPath: 'assets/audio/test.wav',
  isDemoAudio: true,
};

type AudioPlayerContextValue = {
  availableVoiceCount: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentQueueName: string;
  currentTrack: PlayerTrack;
  hasVoiceAudio: (voice: VoiceLine) => boolean;
  next: () => void;
  pause: () => void;
  play: () => Promise<void>;
  playVoice: (operator: VoiceOperator, voice: VoiceLine) => void;
  playVoiceQueue: (name: string, entries: PlayableVoice[], startIndex?: number) => boolean;
  previous: () => void;
  queueLength: number;
  queuePosition: number;
  reset: () => Promise<void>;
  status: AudioStatus;
  voiceAudioLibraryStatus: VoiceAudioLibraryStatus;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

function setLockScreenTrack(player: AudioPlayer, track: PlayerTrack) {
  if (Platform.OS === 'web') {
    return;
  }

  player.setActiveForLockScreen(true, {
    title: track.title,
    artist: track.artist,
    albumTitle: 'Arknights Voice Player',
  });
}

function createVoiceTrack(operator: VoiceOperator, voice: VoiceLine): PlayerTrack {
  return {
    id: voice.id,
    title: voice.title || voice.voiceId || voice.id,
    artist: operator.name,
    text: voice.text,
    assetPath: voice.assetPath,
    isDemoAudio: false,
  };
}

function getTrackSource(track: PlayerTrack) {
  return track.isDemoAudio ? testAudioSource : getWebVoiceAudioSource(track.assetPath);
}

export function AudioPlayerProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(testAudioSource, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [queue, setQueue] = useState<PlayerTrack[]>([initialTrack]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentQueueName, setCurrentQueueName] = useState('テスト音声');
  const [currentTrack, setCurrentTrack] = useState(initialTrack);
  const [availableVoiceAssets, setAvailableVoiceAssets] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [voiceAudioLibraryStatus, setVoiceAudioLibraryStatus] =
    useState<VoiceAudioLibraryStatus>(Platform.OS === 'web' ? 'loading' : 'unsupported');
  const handledFinishRef = useRef(false);
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const queueNameRef = useRef(currentQueueName);

  useEffect(() => {
    queueRef.current = queue;
    queueIndexRef.current = queueIndex;
    queueNameRef.current = currentQueueName;
  }, [currentQueueName, queue, queueIndex]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const controller = new AbortController();

    void fetch(voiceAudioManifestUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Voice audio manifest returned ${response.status}.`);
        }

        return (await response.json()) as VoiceAudioManifest;
      })
      .then((manifest) => {
        const assetPaths = Array.isArray(manifest.assetPaths)
          ? manifest.assetPaths.filter(
              (assetPath): assetPath is string => typeof assetPath === 'string'
            )
          : [];

        setAvailableVoiceAssets(new Set(assetPaths));
        setVoiceAudioLibraryStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        console.warn('Local voice audio is not ready.', error);
        setAvailableVoiceAssets(new Set());
        setVoiceAudioLibraryStatus('missing');
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((error: unknown) => {
      console.warn('Failed to configure audio playback mode.', error);
    });

    return () => {
      if (Platform.OS !== 'web') {
        player.clearLockScreenControls();
      }
    };
  }, [player]);

  const loadQueueTrack = useCallback(
    (tracks: PlayerTrack[], index: number, queueName: string) => {
      const track = tracks[index];

      if (!track) {
        return;
      }

      player.pause();
      player.replace(getTrackSource(track));
      setQueue(tracks);
      setQueueIndex(index);
      setCurrentQueueName(queueName);
      setCurrentTrack(track);
      setLockScreenTrack(player, track);
      player.play();
    },
    [player]
  );

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (nextStatus) => {
      if (!nextStatus.didJustFinish) {
        handledFinishRef.current = false;
        return;
      }

      if (handledFinishRef.current) {
        return;
      }

      handledFinishRef.current = true;

      if (queueIndexRef.current < queueRef.current.length - 1) {
        loadQueueTrack(
          queueRef.current,
          queueIndexRef.current + 1,
          queueNameRef.current
        );
      }
    });

    return () => subscription.remove();
  }, [loadQueueTrack, player]);

  const play = useCallback(async () => {
    if (status.didJustFinish && queueIndex < queue.length - 1) {
      loadQueueTrack(queue, queueIndex + 1, currentQueueName);
      return;
    }

    const duration = status.duration || 0;

    if (status.didJustFinish || (duration > 0 && status.currentTime >= duration)) {
      await player.seekTo(0);
    }

    setLockScreenTrack(player, currentTrack);
    player.play();
  }, [
    currentQueueName,
    currentTrack,
    loadQueueTrack,
    player,
    queue,
    queueIndex,
    status.currentTime,
    status.didJustFinish,
    status.duration,
  ]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const reset = useCallback(async () => {
    player.pause();
    await player.seekTo(0);
  }, [player]);

  const next = useCallback(() => {
    if (queueIndex < queue.length - 1) {
      loadQueueTrack(queue, queueIndex + 1, currentQueueName);
    }
  }, [currentQueueName, loadQueueTrack, queue, queueIndex]);

  const previous = useCallback(() => {
    if (queueIndex > 0) {
      loadQueueTrack(queue, queueIndex - 1, currentQueueName);
    }
  }, [currentQueueName, loadQueueTrack, queue, queueIndex]);

  const hasVoiceAudio = useCallback(
    (voice: VoiceLine) => availableVoiceAssets.has(voice.assetPath),
    [availableVoiceAssets]
  );

  const playVoiceQueue = useCallback(
    (name: string, entries: PlayableVoice[], startIndex = 0) => {
      if (Platform.OS !== 'web') {
        return false;
      }

      const playableTracks = entries
        .map((entry, sourceIndex) => ({ entry, sourceIndex }))
        .filter(({ entry }) => availableVoiceAssets.has(entry.voice.assetPath))
        .map(({ entry, sourceIndex }) => ({
          sourceIndex,
          track: createVoiceTrack(entry.operator, entry.voice),
        }));

      if (playableTracks.length === 0) {
        return false;
      }

      const requestedIndex = playableTracks.findIndex(
        ({ sourceIndex }) => sourceIndex === startIndex
      );
      const targetIndex = requestedIndex >= 0 ? requestedIndex : 0;
      const tracks = playableTracks.map(({ track }) => track);

      loadQueueTrack(tracks, targetIndex, name);
      return true;
    },
    [availableVoiceAssets, loadQueueTrack]
  );

  const playVoice = useCallback(
    (operator: VoiceOperator, voice: VoiceLine) => {
      playVoiceQueue(operator.name, [{ operator, voice }]);
    },
    [playVoiceQueue]
  );

  const contextValue = useMemo(
    () => ({
      availableVoiceCount: availableVoiceAssets.size,
      canGoNext: queueIndex < queue.length - 1,
      canGoPrevious: queueIndex > 0,
      currentQueueName,
      currentTrack,
      hasVoiceAudio,
      next,
      pause,
      play,
      playVoice,
      playVoiceQueue,
      previous,
      queueLength: queue.length,
      queuePosition: queueIndex + 1,
      reset,
      status,
      voiceAudioLibraryStatus,
    }),
    [
      availableVoiceAssets.size,
      currentQueueName,
      currentTrack,
      hasVoiceAudio,
      next,
      pause,
      play,
      playVoice,
      playVoiceQueue,
      previous,
      queue.length,
      queueIndex,
      reset,
      status,
      voiceAudioLibraryStatus,
    ]
  );

  return (
    <AudioPlayerContext.Provider value={contextValue}>{children}</AudioPlayerContext.Provider>
  );
}

export function useAppAudioPlayer() {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error('useAppAudioPlayer must be used inside AudioPlayerProvider');
  }

  return context;
}
