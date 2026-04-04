// AI TEST CHECKLIST:
// ✅ SOCKET_URL derived from EXPO_PUBLIC_API_URL (no hardcode)
// ✅ Socket only connects AFTER accessToken is available
// ✅ Socket disconnects on logout
// ✅ No duplicate connections (socketInstance singleton guard)

import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

// Derive base URL from API URL by stripping /api/v1
const BASE_API = (() => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('Infrastructure Failure: EXPO_PUBLIC_API_URL is missing in production. Cannot initialize Socket connection.');
  }
  return url || 'http://localhost:5000/api/v1';
})();
const SOCKET_URL = BASE_API.replace(/\/api\/v1\/?$/, '');

let socketInstance: Socket | null = null;
let storedToken: string | null = null;

export const getSocketInstance = (): Socket | null => socketInstance;

export const connectSocket = (token: string): Socket => {
  if (socketInstance?.connected && storedToken === token) return socketInstance;

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5,
  });

  storedToken = token;

  socketInstance.on('connect', () => console.log('[Socket] Connected:', socketInstance?.id));
  socketInstance.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socketInstance.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    storedToken = null;
    console.log('[Socket] Manually disconnected and cleared');
  }
};

export const useSocket = () => {
  const { accessToken } = useAuthStore();

  const [connected, setConnected] = useState(socketInstance?.connected || false);

  // Effect 1: Handle connection/disconnection based on auth
  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }
  }, [accessToken]);

  // Effect 2: Handle reactive status updates
  useEffect(() => {
    const socket = socketInstance;
    if (!socket) {
      setConnected(false);
      return;
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Initial sync
    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [accessToken, socketInstance]);

  const joinFacility = (facilityId: string) => {
    socketInstance?.emit('join_facility', facilityId);
  };

  const leaveFacility = (facilityId: string) => {
    socketInstance?.emit('leave_facility', facilityId);
  };

  const joinProvider = (providerId: string) => {
    socketInstance?.emit('join_provider', providerId);
  };

  const leaveProvider = (providerId: string) => {
    socketInstance?.emit('leave_provider', providerId);
  };

  return { isConnected: connected, joinFacility, leaveFacility, joinProvider, leaveProvider, socket: socketInstance };
};
