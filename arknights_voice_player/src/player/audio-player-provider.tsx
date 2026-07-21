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
  currentTrack: PlayerTrack;
  hasVoiceAudio: (voice: VoiceLine) => boolean;
  pause: () => void;
  play: () => Promise<void>;
  playVoice: (operator: VoiceOperator, voice: VoiceLine) => void;
  player: AudioPlayer;
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

export function AudioPlayerProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(testAudioSource, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [currentTrack, setCurrentTrack] = useState(initialTrack);
  const [availableVoiceAssets, setAvailableVoiceAssets] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [voiceAudioLibraryStatus, setVoiceAudioLibraryStatus] =
    useState<VoiceAudioLibraryStatus>(Platform.OS === 'web' ? 'loading' : 'unsupported');

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
          ? manifest.assetPaths.filter((assetPath): assetPath is string => typeof assetPath === 'string')
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

  const play = useCallback(async () => {
    const duration = status.duration || 0;

    if (status.didJustFinish || (duration > 0 && status.currentTime >= duration)) {
      await player.seekTo(0);
    }

    setLockScreenTrack(player, currentTrack);
    player.play();
  }, [currentTrack, player, status.currentTime, status.didJustFinish, status.duration]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const reset = useCallback(async () => {
    player.pause();
    await player.seekTo(0);
  }, [player]);

  const hasVoiceAudio = useCallback(
    (voice: VoiceLine) => availableVoiceAssets.has(voice.assetPath),
    [availableVoiceAssets]
  );

  const playVoice = useCallback(
    (operator: VoiceOperator, voice: VoiceLine) => {
      if (Platform.OS !== 'web' || !availableVoiceAssets.has(voice.assetPath)) {
        return;
      }

      const track: PlayerTrack = {
        id: voice.id,
        title: voice.title || voice.voiceId || voice.id,
        artist: operator.name,
        text: voice.text,
        assetPath: voice.assetPath,
        isDemoAudio: false,
      };

      player.pause();
      player.replace(getWebVoiceAudioSource(voice.assetPath));
      setCurrentTrack(track);
      setLockScreenTrack(player, track);
      player.play();
    },
    [availableVoiceAssets, player]
  );

  const contextValue = useMemo(
    () => ({
      availableVoiceCount: availableVoiceAssets.size,
      currentTrack,
      hasVoiceAudio,
      pause,
      play,
      playVoice,
      player,
      reset,
      status,
      voiceAudioLibraryStatus,
    }),
    [
      availableVoiceAssets.size,
      currentTrack,
      hasVoiceAudio,
      pause,
      play,
      playVoice,
      player,
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
