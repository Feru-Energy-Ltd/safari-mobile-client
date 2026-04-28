import 'react-native-reanimated';
import '../global.css';

import { toastConfig } from '@/components/ToastConfig';
import { checkAuthStatus, getAccessToken } from '@/services/auth.service';
import { connectStomp, disconnectStomp } from '@/services/stomp.service';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';

import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen';
import { logger } from '@/utils/logger';
import * as Sentry from '@sentry/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

Sentry.init({
  dsn: 'https://7a0fd882d38ab132af72269a90607853@o4511251760087040.ingest.de.sentry.io/4511251773653072',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'onboarding',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (!isAnimationComplete) {
    return (
      <CustomSplashScreen
        onAnimationComplete={() => setIsAnimationComplete(true)}
      />
    );
  }

  return <RootLayoutNav />;
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        await checkAuthStatus();
      } catch (e) {
        logger.error('Auth check failed', e);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  // Connect STOMP globally as soon as we have a valid access token
  useEffect(() => {
    if (!authChecked) return;

    let mounted = true;
    async function connectGlobalStomp() {
      try {
        const token = await getAccessToken();
        if (!token || !mounted) return;
        await connectStomp(token);
        logger.info('Global STOMP: connected ✓');
      } catch (e: any) {
        logger.warn('Global STOMP: could not connect', { reason: e.message });
      }
    }
    connectGlobalStomp();

    return () => {
      mounted = false;
      disconnectStomp();
    };
  }, [authChecked]);

  if (!authChecked) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="wallet/topup" />
          <Stack.Screen name="wallet/transactions" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="terms" />
        </Stack>
        <Toast config={toastConfig} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
