import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AudioPlayerProvider } from '@/player/audio-player-provider';
import { PlaylistProvider } from '@/playlists/playlist-provider';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <PlaylistProvider>
        <AudioPlayerProvider>
          <AppTabs />
        </AudioPlayerProvider>
      </PlaylistProvider>
    </ThemeProvider>
  );
}
