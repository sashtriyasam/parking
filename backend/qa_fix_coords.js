import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- UPDATING FACILITY COORDINATES ---');
  
  const facility = await prisma.parkingFacility.updateMany({
    where: { name: 'LOCAL TEST GARAGE' },
    data: {
      latitude: 19.0760,
      longitude: 72.8777,
      city: 'Mumbai'
    }
  });
  
  console.log(`✅ Updated ${facility.count} facilities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
