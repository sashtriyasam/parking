const { Server } = require('socket.io');
let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join_facility', (facilityId) => {
            socket.join(`facility_${facilityId}`);
            console.log(`Socket ${socket.id} joined facility: ${facilityId}`);
        });

        socket.on('leave_facility', (facilityId) => {
            socket.leave(`facility_${facilityId}`);
            console.log(`Socket ${socket.id} left facility: ${facilityId}`);
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

module.exports = {
    initSocket,
    getIO,
    emitSlotUpdate
};
