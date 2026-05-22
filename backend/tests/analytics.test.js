const { getDashboardStats } = require('../src/services/analytics.service');
const prisma = require('../src/config/db');

// Mock Prisma
jest.mock('../src/config/db', () => ({
    parkingFacility: {
        findMany: jest.fn(),
    },
    ticket: {
        aggregate: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    parkingSlot: {
        count: jest.fn(),
    }
}));

describe('Analytics Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return zero stats when no facilities found', async () => {
        prisma.parkingFacility.findMany.mockResolvedValue([]);

        const result = await getDashboardStats('provider-1');

        expect(result.revenue.today).toBe(0);
        expect(result.occupancy).toBe(0);
        expect(result.active_bookings).toBe(0);
    });

    test('should calculate stats correctly', async () => {
        // Mock Data
        prisma.parkingFacility.findMany.mockResolvedValue([{ id: 'fac-1' }]);

        // Revenue mocks (Today, Week, Month called sequentially)
        prisma.ticket.aggregate
            .mockResolvedValueOnce({ _sum: { total_fee: 100 } }) // Today
            .mockResolvedValueOnce({ _sum: { total_fee: 500 } }) // Week
            .mockResolvedValueOnce({ _sum: { total_fee: 2000 } }); // Month

        // Active Bookings (online/offline breakdown)
        prisma.ticket.groupBy.mockResolvedValue([
            { booking_type: 'ONLINE', _count: { _all: 3 } },
            { booking_type: 'OFFLINE', _count: { _all: 2 } }
        ]);

        // Occupancy (Total, Occupied)
        prisma.parkingSlot.count
            .mockResolvedValueOnce(20) // Total
            .mockResolvedValueOnce(10); // Occupied

        const result = await getDashboardStats('provider-1');

        expect(result.revenue.today).toBe(100);
        expect(result.revenue.week).toBe(500);
        expect(result.revenue.month).toBe(2000);
        expect(result.active_bookings).toBe(5);
        expect(result.online_bookings).toBe(3);
        expect(result.offline_bookings).toBe(2);
        expect(result.occupancy).toBe(50); // 10/20 * 100
    });

    test('should handle empty active bookings groupBy response', async () => {
        // Mock Data
        prisma.parkingFacility.findMany.mockResolvedValue([{ id: 'fac-1' }]);

        // Revenue mocks (Today, Week, Month called sequentially)
        prisma.ticket.aggregate
            .mockResolvedValueOnce({ _sum: { total_fee: 100 } }) // Today
            .mockResolvedValueOnce({ _sum: { total_fee: 500 } }) // Week
            .mockResolvedValueOnce({ _sum: { total_fee: 2000 } }); // Month

        // Empty active bookings
        prisma.ticket.groupBy.mockResolvedValue([]);

        // Occupancy (Total, Occupied)
        prisma.parkingSlot.count
            .mockResolvedValueOnce(20) // Total
            .mockResolvedValueOnce(10); // Occupied

        const result = await getDashboardStats('provider-1');

        expect(result.revenue.today).toBe(100);
        expect(result.revenue.week).toBe(500);
        expect(result.revenue.month).toBe(2000);
        expect(result.active_bookings).toBe(0);
        expect(result.online_bookings).toBe(0);
        expect(result.offline_bookings).toBe(0);
        expect(result.occupancy).toBe(50);
    });

    test('should handle partial active bookings groupBy response with only ONLINE bookings', async () => {
        // Mock Data
        prisma.parkingFacility.findMany.mockResolvedValue([{ id: 'fac-1' }]);

        // Revenue mocks (Today, Week, Month called sequentially)
        prisma.ticket.aggregate
            .mockResolvedValueOnce({ _sum: { total_fee: 100 } }) // Today
            .mockResolvedValueOnce({ _sum: { total_fee: 500 } }) // Week
            .mockResolvedValueOnce({ _sum: { total_fee: 2000 } }); // Month

        // Partial active bookings (only ONLINE)
        prisma.ticket.groupBy.mockResolvedValue([
            { booking_type: 'ONLINE', _count: { _all: 3 } }
        ]);

        // Occupancy (Total, Occupied)
        prisma.parkingSlot.count
            .mockResolvedValueOnce(20) // Total
            .mockResolvedValueOnce(10); // Occupied

        const result = await getDashboardStats('provider-1');

        expect(result.revenue.today).toBe(100);
        expect(result.revenue.week).toBe(500);
        expect(result.revenue.month).toBe(2000);
        expect(result.active_bookings).toBe(3);
        expect(result.online_bookings).toBe(3);
        expect(result.offline_bookings).toBe(0);
        expect(result.occupancy).toBe(50);
    });
});
