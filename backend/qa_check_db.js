const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ 
    select: { id: true, email: true, role: true, full_name: true } 
  });
  const tickets = await prisma.ticket.findMany({
    select: { id: true, status: true, vehicle_number: true, facility_id: true }
  });
  const facilities = await prisma.parkingFacility.findMany({
    select: { id: true, name: true, provider_id: true }
  });
  
  console.log('--- DB DIAGNOSTIC ---');
  console.log('USERS:', JSON.stringify(users, null, 2));
  console.log('FACILITIES:', JSON.stringify(facilities, null, 2));
  console.log('TICKETS:', JSON.stringify(tickets, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
