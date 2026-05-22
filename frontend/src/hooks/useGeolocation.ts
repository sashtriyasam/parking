import { useState, useEffect } from 'react';

const CACHED_LOCATION_KEY = 'parkeasy_last_location';

interface GeolocationState {
  coordinates: [number, number] | null;
  error: string | null;
  loading: boolean;
  /** true when the browser has explicitly blocked location access */
  permissionDenied: boolean;
}

function getCachedLocation(): [number, number] | null {
  try {
    const raw = sessionStorage.getItem(CACHED_LOCATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function setCachedLocation(coords: [number, number]) {
  try {
    sessionStorage.setItem(CACHED_LOCATION_KEY, JSON.stringify(coords));
  } catch { /* ignore */ }
}

/**
 * React hook to retrieve, cache, and track the user's geolocation coordinates.
 * Handles permission states and browser feature support, falling back to cached
 * session storage coordinates if access is denied.
 * 
 * @returns {GeolocationState} Object containing coordinates, errors, loading, and permission states.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => {
    const cached = getCachedLocation();
    return {
      coordinates: cached,
      error: null,
      loading: true,
      permissionDenied: false,
    };
  });

  useEffect(() => {
    let mounted = true;

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionDenied: false,
      }));
      return;
    }

    // Check permission state first (Chrome/Firefox) to avoid triggering a
    // blocked prompt and generating the console warning repeatedly.
    /**
     * Attempts to retrieve the user's current geolocation.
     * Caches successful location, updates state, and handles denial fallbacks.
     */
    const tryGetPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mounted) return;
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCachedLocation(coords);
          setState({
            coordinates: coords,
            error: null,
            loading: false,
            permissionDenied: false,
          });
        },
        (err) => {
          if (!mounted) return;
          const denied = err.code === err.PERMISSION_DENIED;
          const cached = getCachedLocation();
          setState({
            // Fall back to cached position when blocked so the map still works
            coordinates: denied ? cached : null,
            error: err.message,
            loading: false,
            permissionDenied: denied,
          });
        },
        {
          enableHighAccuracy: false, // less aggressive = fewer blocked prompts
          timeout: 8000,
          maximumAge: 60000, // accept a position up to 1 min old
        }
      );
    };

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (!mounted) return;
          if (result.state === 'denied') {
            // Already blocked — don't fire getCurrentPosition (avoids the console warning)
            const cached = getCachedLocation();
            setState({
              coordinates: cached,
              error: 'Location access is blocked. Reset it in browser Page Info (tune icon next to the URL).',
              loading: false,
              permissionDenied: true,
            });
          } else {
            tryGetPosition();
          }
        })
        .catch(() => tryGetPosition()); // Permissions API unavailable – fall through
    } else {
      tryGetPosition();
    }

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
