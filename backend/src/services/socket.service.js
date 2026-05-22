const { Server } = require('socket.io');
let io;

const initSocket = (server, allowedOrigins = []) => {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins.length > 0 
                ? (origin, callback) => {
                    if (!origin || allowedOrigins.some(o => origin === o || origin.endsWith('.onrender.com'))) {
                        callback(null, true);
                    } else {
                        callback(new Error('Socket CORS: origin not allowed'));
                    }
                }
                : true, // Fallback to true only if no origins provided (dev mode)
            methods: ['GET', 'POST'],
            credentials: true
        },
        allowEIO3: true, // Support for older clients if needed
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        const isValidId = (id) => (typeof id === 'string' && id.trim() !== '' && id !== 'undefined') || (typeof id === 'number' && Number.isFinite(id));
        const sanitizeId = (id) => String(id).trim();

        socket.on('join_facility', (facilityId) => {
            if (!isValidId(facilityId)) return socket.emit('error', { message: 'Invalid facility ID' });
            const id = sanitizeId(facilityId);
            socket.join(`facility_${id}`);
            console.log(`Socket ${socket.id} joined facility: ${id}`);
        });

        socket.on('join_provider', (providerId) => {
            if (!isValidId(providerId)) return socket.emit('error', { message: 'Invalid provider ID' });
            const id = sanitizeId(providerId);
            socket.join(`provider_${id}`);
            console.log(`Socket ${socket.id} joined provider room: ${id}`);
        });

        socket.on('leave_facility', (facilityId) => {
            if (!isValidId(facilityId)) return;
            const id = sanitizeId(facilityId);
            socket.leave(`facility_${id}`);
            console.log(`Socket ${socket.id} left facility: ${id}`);
        });

        socket.on('leave_provider', (providerId) => {
            if (!isValidId(providerId)) return;
            const id = sanitizeId(providerId);
            socket.leave(`provider_${id}`);
            console.log(`Socket ${socket.id} left provider room: ${id}`);
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
