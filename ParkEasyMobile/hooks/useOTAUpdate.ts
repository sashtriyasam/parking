import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';
import { useToast } from '../components/Toast';

const UPDATE_FLAG_KEY = 'parkeasy_just_updated';

export const useOTAUpdate = () => {
  const { showToast } = useToast();

  useEffect(() => {
    async function checkJustUpdated() {
      try {
        const justUpdated = await SecureStore.getItemAsync(UPDATE_FLAG_KEY);
        if (justUpdated === 'true') {
          // Show toast for a few seconds
          showToast('App updated to the latest version!', 'success');
          // Clear the flag
          await SecureStore.deleteItemAsync(UPDATE_FLAG_KEY);
        }
      } catch (error) {
        console.error('Error checking update flag:', error);
      }
    }

    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          Alert.alert(
            'Update Available',
            'A new version of ParkEasy is available with latest features and fixes. Update now?',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'Update Now', 
                onPress: async () => {
                  try {
                    // Set flag before reloading
                    await SecureStore.setItemAsync(UPDATE_FLAG_KEY, 'true');
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (error) {
                    // Clear flag if update failed
                    await SecureStore.deleteItemAsync(UPDATE_FLAG_KEY);
                    Alert.alert('Error', 'Failed to download the update. Please try again later.');
                  }
                } 
              },
            ]
          );
        }
      } catch (error) {
        console.warn('OTA check failed:', error);
      }
    }

    // Always check if we just updated on boot
    checkJustUpdated();

    // Only run OTA background check in production/preview builds
    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);
};
