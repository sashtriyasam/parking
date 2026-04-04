// Error Reporting Utility
// This encapsulates the logic for sending uncaught errors to a production provider
// (e.g. Sentry, Crashlytics, etc.)

/**
 * Capture and report an exception to the production monitoring service.
 * @param error The error object to report.
 * @param extra Any extra context information (e.g. componentStack).
 */
export const captureException = (error: Error, extra?: any) => {
  if (__DEV__) {
    // In development, we just log to console to avoid noise
    console.error('[Reporting] DEV: Skipping remote report for:', error.message, extra);
    return;
  }

  try {
    /** 
     * PRODUCTION INTEGRATION POINT:
     * To enable remote crash monitoring, integrate a provider here.
     * Example (Sentry): Sentry.Native.captureException(error, { extra });
     */
    if (process.env.NODE_ENV === 'production') {
      console.info('[Reporting] PROD_SIGNAL: Intercepted system exception for monitoring:', error.message);
    }
  } catch (reportingError) {
    console.error('[Reporting] Failed to send error to provider:', reportingError);
  }
};

export const initReporting = () => {
  if (__DEV__) return;

  /** 
   * PRODUCTION INITIALIZATION POINT:
   * Initialize monitoring services (e.g. Sentry.init()) here.
   */
};
