import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const facilityId = 'a04cba03-5688-4441-a746-4b62e70a3d83';
  
  // Get latest ticket
  const ticket = await prisma.ticket.findFirst({
    where: { facility_id: facilityId },
    orderBy: { entry_time: 'desc' },
    select: { id: true, slot_id: true, vehicle_number: true, status: true, payment_status: true, qr_code: true }
  });
  console.log('✅ Latest Ticket:', JSON.stringify(ticket, null, 2));
  
  // Show all slot statuses
  const slots = await prisma.parkingSlot.findMany({
    where: { floor: { facility_id: facilityId } },
    select: { id: true, slot_number: true, status: true },
    orderBy: { slot_number: 'asc' }
  });
  console.log('\nAll Slots:');
  slots.forEach(s => console.log(`  ${s.slot_number}: ${s.status}`));
  
  // Reset ALL occupied slots to FREE (for testing)
  const reset = await prisma.parkingSlot.updateMany({
    where: { floor: { facility_id: facilityId }, status: 'OCCUPIED' },
    data: { status: 'FREE' }
  });
  console.log(`\n♻️  Reset ${reset.count} occupied slot(s) back to FREE for re-testing.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
