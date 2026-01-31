const prisma = require('../config/db');

const getDashboardStats = async (providerId) => {
    // 1. Get Provider Facilities IDs
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId, is_active: true },
        select: { id: true }
    });

    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
        return {
            revenue: { today: 0, week: 0, month: 0 },
            occupancy: 0,
            active_bookings: 0,
            top_vehicles: []
        };
    }

    // 2. Revenue (Completed tickets)
    // Ideally, use SQL aggregations for speed, but Prisma aggregations work too
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(); monthStart.setMonth(monthStart.getMonth() - 1);

    // We need to query tickets linked to slots in these facilities.
    // Prisma relation filtering:
    const getRevenue = async (dateFrom) => {
        const agg = await prisma.ticket.aggregate({
            where: {
                slot: { floor: { facility_id: { in: facilityIds } } },
                status: 'COMPLETED',
                exit_time: { gte: dateFrom }
            },
            _sum: { total_fee: true }
        });
        return Number(agg._sum.total_fee || 0);
    };

    const [revenueToday, revenueWeek, revenueMonth] = await Promise.all([
        getRevenue(todayStart),
        getRevenue(weekStart),
        getRevenue(monthStart)
    ]);

    // 3. Active Bookings
    const activeBookings = await prisma.ticket.count({
        where: {
            slot: { floor: { facility_id: { in: facilityIds } } },
            status: 'ACTIVE'
        }
    });

    // 4. Occupancy Rate
    // Total Slots
    const totalSlots = await prisma.parkingSlot.count({
        where: { floor: { facility_id: { in: facilityIds } }, is_active: true }
    });

    // Occupied Slots (Active Tickets or Slot Status OCCUPIED)
    const occupiedSlots = await prisma.parkingSlot.count({
        where: {
            floor: { facility_id: { in: facilityIds } },
            is_active: true,
            status: 'OCCUPIED'
        }
    });

    const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

    return {
        revenue: {
            today: revenueToday,
            week: revenueWeek,
            month: revenueMonth
        },
        occupancy: Math.round(occupancyRate * 10) / 10,
        active_bookings: activeBookings
    };
};

module.exports = {
    getDashboardStats
};
