import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const useHaptics = () => {
  const selection = useCallback(() => {
    if (Platform.OS === 'web') return;
    Haptics.selectionAsync();
  }, []);

  const impactLight = useCallback(() => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const impactMedium = useCallback(() => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const notificationSuccess = useCallback(() => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const notificationError = useCallback(() => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const notificationWarning = useCallback(() => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const impactHeavy = useCallback(() => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  return {
    selection,
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationError,
    notificationWarning,
  };
};
