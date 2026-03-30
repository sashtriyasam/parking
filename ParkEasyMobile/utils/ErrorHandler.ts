import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

/**
 * Production-ready Global Error Handler
 */
export class ErrorHandler {
  /**
   * Log error to monitoring service (Sentry/LogRocket in future)
   */
  private static log(error: any, context?: string) {
    if (__DEV__) {
      console.warn(`[ERROR][${context || 'Global'}]:`, error);
    }
  }

  /**
   * Handle API specific errors
   */
  public static handleApiError(error: any, customTitle?: string) {
    this.log(error, 'API');
    
    let message = 'Something went wrong. Please try again.';
    let title = customTitle || 'Error';

    if (error.response) {
      // Server responded with a status code outside the 2xx range
      const { status, data } = error.response;
      
      if (status === 404) {
        title = 'Not Found';
        message = 'The requested resource was not found. (404)';
      } else if (status === 401) {
        title = 'Session Expired';
        message = 'Please log in again.';
      } else if (status === 403) {
        title = 'Access Denied';
        message = 'You do not have permission to view this.';
      } else if (status >= 500) {
        title = 'Server Error';
        message = 'The server is having a bad day. We are on it!';
      } else if (data?.message) {
        message = data.message;
      }
    } else if (error.request) {
      // Request was made but no response received
      title = 'Network Error';
      message = 'Please check your internet connection.';
    }

    this.showToast(title, message, 'error');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  /**
   * Handle generic app errors
   */
  public static handleGeneralError(error: any) {
    this.log(error, 'General');
    this.showToast('Oops!', 'An unexpected error occurred.', 'error');
  }

  /**
   * Standard Toast feedback
   */
  public static showToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  }

  /**
   * Success feedback with haptics
   */
  public static showSuccess(title: string, message: string) {
    this.showToast(title, message, 'success');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }
}
