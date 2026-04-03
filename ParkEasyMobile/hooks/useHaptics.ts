import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const useHaptics = () => {
  const selection = () => {
    if (Platform.OS === 'web') return;
    Haptics.selectionAsync();
  };

  const impactLight = () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const impactMedium = () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const notificationSuccess = () => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const notificationError = () => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return {
    selection,
    impactLight,
    impactMedium,
    notificationSuccess,
    notificationError,
  };
};
