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
  
  // --- SAFETY GUARDS ---
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: This script CANNOT be run in production mode.');
    process.exit(1);
  }

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirm = await new Promise(resolve => {
    readline.question('\n⚠️  WARNING: This will reset ALL occupied slots and cancel active tickets. Type "YES" to proceed: ', resolve);
  });
  readline.close();

  if (confirm !== 'YES') {
    console.log('Aborting reset.');
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Reset ALL occupied slots to FREE
      const reset = await tx.parkingSlot.updateMany({
        where: { floor: { facility_id: facilityId }, status: 'OCCUPIED' },
        data: { status: 'FREE' }
      });

      // 2. Cancel any ACTIVE tickets for this facility to avoid orphaned entries
      const tickets = await tx.ticket.updateMany({
        where: { facility_id: facilityId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' }
      });

      return { resetCount: reset.count, ticketCount: tickets.count };
    });

    console.log(`\n♻️  Reset ${result.resetCount} occupied slot(s) to FREE.`);
    console.log(`✅ Cancelled ${result.ticketCount} active ticket(s) for data consistency.`);
    console.log('Re-testing can now proceed with a clean state.');
  } catch (error) {
    console.error('❌ Transaction failed:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
