import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });
    }
    return socket;
};

export const joinFacility = (facilityId: string) => {
    const s = getSocket();
    s.emit('join_facility', facilityId);
};

export const leaveFacility = (facilityId: string) => {
    const s = getSocket();
    s.emit('leave_facility', facilityId);
};
