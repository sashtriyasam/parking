const prisma = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Get available monthly pass options for a facility
 */
const getAvailablePasses = async (facilityId, vehicleType) => {
    const facility = await prisma.parkingFacility.findUnique({
        where: { id: facilityId },
        include: {
            pricing_rules: {
                where: vehicleType ? { vehicle_type: vehicleType } : {}
            }
        }
    });

    if (!facility) {
        throw new AppError('Facility not found', 404);
    }

    // Return pass options based on pricing rules
    return facility.pricing_rules.map(rule => {
        // Calculate monthly price with proper null handling (BUG-011 fix)
        let monthlyPrice = rule.monthly_pass_price;
        if (!monthlyPrice) {
            monthlyPrice = rule.daily_max ? rule.daily_max * 30 : rule.hourly_rate * 24 * 30;
        }

        return {
            facility_id: facilityId,
            facility_name: facility.name,
            vehicle_type: rule.vehicle_type,
            monthly_price: monthlyPrice,
            hourly_rate: rule.hourly_rate,
            daily_max: rule.daily_max
        };
    });
};

/**
 * Purchase a monthly pass
 */
const purchasePass = async (customerId, facilityId, vehicleType) => {
    // Get pricing
    const pricingRule = await prisma.pricingRule.findFirst({
        where: { facility_id: facilityId, vehicle_type: vehicleType }
    });

    if (!pricingRule) {
        throw new AppError('Pricing not configured for this vehicle type', 404);
    }

    const price = pricingRule.monthly_pass_price || pricingRule.daily_max * 30;

    // Calculate dates (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create pass
    const pass = await prisma.monthlyPass.create({
        data: {
            customer_id: customerId,
            facility_id: facilityId,
            vehicle_type: vehicleType,
            start_date: startDate,
            end_date: endDate,
            price,
            status: 'ACTIVE'
        },
        include: {
            facility: { select: { name: true, address: true } }
        }
    });

    return pass;
};

/**
 * Get user's active passes
 */
const getActivePasses = async (customerId) => {
    const passes = await prisma.monthlyPass.findMany({
        where: {
            customer_id: customerId,
            status: 'ACTIVE',
            end_date: { gte: new Date() }
        },
        include: {
            facility: {
                select: { name: true, address: true, city: true }
            }
        },
        orderBy: { end_date: 'asc' }
    });

    return passes;
};

module.exports = {
    getAvailablePasses,
    purchasePass,
    getActivePasses
};
