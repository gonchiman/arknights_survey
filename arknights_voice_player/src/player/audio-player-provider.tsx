import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { createContext, type PropsWithChildren, useContext, useEffect } from 'react';

const testAudioSource = require('@/assets/audio/test.wav');

type AudioPlayerContextValue = {
  player: AudioPlayer;
  status: AudioStatus;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(testAudioSource, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ player, status }}>
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
