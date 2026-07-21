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
  useState,
} from 'react';
import { Platform } from 'react-native';

import type { VoiceLine, VoiceOperator } from '@/models/voice-line';

const testAudioSource = require('@/assets/audio/test.wav');
const voiceAudioSources: Record<string, AudioSource> = {
  'char_002_amiya/CN_001': require('@/assets/audio/voice_en/char_002_amiya/CN_001.mp3'),
};

export function hasVoiceAudio(voice: VoiceLine) {
  return voice.assetPath in voiceAudioSources;
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
  currentTrack: PlayerTrack;
  pause: () => void;
  play: () => Promise<void>;
  playVoice: (operator: VoiceOperator, voice: VoiceLine) => void;
  player: AudioPlayer;
  reset: () => Promise<void>;
  status: AudioStatus;
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

  const playVoice = useCallback(
    (operator: VoiceOperator, voice: VoiceLine) => {
      const audioSource = voiceAudioSources[voice.assetPath];

      if (!audioSource) {
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
      player.replace(audioSource);
      setCurrentTrack(track);
      setLockScreenTrack(player, track);
      player.play();
    },
    [player]
  );

  return (
    <AudioPlayerContext.Provider
      value={{ currentTrack, pause, play, playVoice, player, reset, status }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAppAudioPlayer() {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error('useAppAudioPlayer must be used inside AudioPlayerProvider');
  }

  return context;
}
