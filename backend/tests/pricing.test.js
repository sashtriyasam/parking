const { calculateParkingFee } = require('../src/services/pricing.service');
const prisma = require('../src/config/db');

// Mock Prisma
jest.mock('../src/config/db', () => ({
    parkingFacility: {
        findUnique: jest.fn(),
    },
}));

describe('Pricing Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should calculate correct fee for 2 hours', async () => {
        // Mock Data
        const mockFacility = {
            id: 'fac-1',
            pricing_rules: [
                { vehicle_type: 'CAR', hourly_rate: 20, daily_max: 100 },
            ],
        };

        prisma.parkingFacility.findUnique.mockResolvedValue(mockFacility);

        const entryTime = new Date('2023-10-10T10:00:00Z');
        const exitTime = new Date('2023-10-10T12:00:00Z');

        const result = await calculateParkingFee(entryTime, exitTime, 'CAR', 'fac-1');

        expect(result.base_fee).toBe(40); // 2 * 20
        expect(result.hours_billed).toBe(2);
    });

    test('should apply daily max cap', async () => {
        const mockFacility = {
            id: 'fac-1',
            pricing_rules: [
                { vehicle_type: 'CAR', hourly_rate: 10, daily_max: 50 },
            ],
        };

        prisma.parkingFacility.findUnique.mockResolvedValue(mockFacility);

        // 10 hours * 10 = 100, but max is 50
        const entryTime = new Date('2023-10-10T10:00:00Z');
        const exitTime = new Date('2023-10-10T20:00:00Z');

        const result = await calculateParkingFee(entryTime, exitTime, 'CAR', 'fac-1');

        // Logic in service:
        // duration = 10 hours. 
        // days = 0. remaining = 10. 
        // dailyFee = 0. remainingFee = min(10*10, 50) = 50.
        expect(result.base_fee).toBe(50);
    });

    test('should throw if facility not found', async () => {
        prisma.parkingFacility.findUnique.mockResolvedValue(null);
        const entryTime = new Date();
        await expect(calculateParkingFee(entryTime, entryTime, 'CAR', 'bad-id'))
            .rejects.toThrow('Facility not found');
    });
});
