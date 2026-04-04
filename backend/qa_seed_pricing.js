import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check pricing rules for the target facility
  const facilityId = 'a04cba03-5688-4441-a746-4b62e70a3d83';
  const facility = await prisma.parkingFacility.findUnique({
    where: { id: facilityId },
    include: { pricing_rules: true }
  });
  
  console.log('Facility:', facility?.name);
  console.log('Existing pricing rules:', JSON.stringify(facility?.pricing_rules, null, 2));
  
  // Add pricing rules if missing
  if (!facility?.pricing_rules?.length) {
    console.log('No pricing rules found. Creating them...');
    await prisma.pricingRule.createMany({
      data: [
        { facility_id: facilityId, vehicle_type: 'CAR', hourly_rate: 60, daily_max: 500, monthly_pass_price: 3000 },
        { facility_id: facilityId, vehicle_type: 'BIKE', hourly_rate: 30, daily_max: 250, monthly_pass_price: 1500 },
        { facility_id: facilityId, vehicle_type: 'TRUCK', hourly_rate: 100, daily_max: 800, monthly_pass_price: 5000 },
      ],
      skipDuplicates: true,
    });
    console.log('✅ Pricing rules created!');
  }
  
  // Also seed pricing for LOCAL TEST GARAGE
  const garages = await prisma.parkingFacility.findMany({
    where: { name: { contains: 'LOCAL', mode: 'insensitive' } },
    select: { id: true, name: true }
  });
  
  for (const g of garages) {
    const existing = await prisma.pricingRule.count({ where: { facility_id: g.id } });
    if (existing === 0) {
      await prisma.pricingRule.createMany({
        data: [
          { facility_id: g.id, vehicle_type: 'CAR', hourly_rate: 60, daily_max: 500, monthly_pass_price: 3000 },
          { facility_id: g.id, vehicle_type: 'BIKE', hourly_rate: 30, daily_max: 250, monthly_pass_price: 1500 },
          { facility_id: g.id, vehicle_type: 'TRUCK', hourly_rate: 100, daily_max: 800, monthly_pass_price: 5000 },
        ],
        skipDuplicates: true,
      });
      console.log(`✅ Pricing rules seeded for ${g.name}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
