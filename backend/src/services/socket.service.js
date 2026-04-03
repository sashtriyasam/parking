const { Server } = require('socket.io');
let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: true, // Allow all origins for the socket to handle RN apps properly
            methods: ['GET', 'POST'],
            credentials: true
        },
        allowEIO3: true, // Support for older clients if needed
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join_facility', (facilityId) => {
            socket.join(`facility_${facilityId}`);
            console.log(`Socket ${socket.id} joined facility: ${facilityId}`);
        });

        socket.on('join_provider', (providerId) => {
            socket.join(`provider_${providerId}`);
            console.log(`Socket ${socket.id} joined provider room: ${providerId}`);
        });

        socket.on('leave_facility', (facilityId) => {
            socket.leave(`facility_${facilityId}`);
            console.log(`Socket ${socket.id} left facility: ${facilityId}`);
        });

        socket.on('leave_provider', (providerId) => {
            socket.leave(`provider_${providerId}`);
            console.log(`Socket ${socket.id} left provider room: ${providerId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitSlotUpdate = (facilityId, data) => {
    if (io) {
        io.to(`facility_${facilityId}`).emit('slot_updated', data);
    }
};

const emitToProvider = (providerId, event, data) => {
    if (io) {
        io.to(`provider_${providerId}`).emit(event, data);
    }
};

module.exports = {
    initSocket,
    getIO,
    emitSlotUpdate,
    emitToProvider
};
