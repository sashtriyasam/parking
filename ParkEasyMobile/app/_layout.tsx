import React, { useEffect } from 'react';
import { Redirect, Slot, useSegments, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { ToastContainer } from '../components/Toast';
import { useOTAUpdate } from '../hooks/useOTAUpdate';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initReporting } from '../utils/reporting';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function InitialLayout() {
  const { isInitialized, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const colors = useThemeColors();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup && segments.length > 0) {
      router.replace('/(auth)/login');
    } else if (user) {
      const role = user.role?.toLowerCase();
      if (inAuthGroup || !segments[0]) {
        if (role === 'customer') {
          router.replace('/(customer)');
        } else if (role === 'provider') {
          router.replace('/(provider)/(tabs)');
        }
      }
    }
  }, [user, isInitialized, segments, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const { loadFromStorage, isInitialized } = useAuthStore();

  useEffect(() => {
    initReporting();
    loadFromStorage();
  }, []);

  useOTAUpdate();
  usePushNotifications();

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  if (!isInitialized) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <InitialLayout />
          <ToastContainer />
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

