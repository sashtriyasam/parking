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

        // Active Bookings
        prisma.ticket.count.mockResolvedValue(5);

        // Occupancy (Total, Occupied)
        prisma.parkingSlot.count
            .mockResolvedValueOnce(20) // Total
            .mockResolvedValueOnce(10); // Occupied

        const result = await getDashboardStats('provider-1');

        expect(result.revenue.today).toBe(100);
        expect(result.revenue.week).toBe(500);
        expect(result.revenue.month).toBe(2000);
        expect(result.active_bookings).toBe(5);
        expect(result.occupancy).toBe(50); // 10/20 * 100
    });
});
