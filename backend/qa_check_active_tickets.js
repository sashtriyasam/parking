import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activeTickets = await prisma.ticket.findMany({
    where: { status: 'ACTIVE' },
    include: { 
      customer: { select: { id: true, email: true, full_name: true, role: true } }, 
      facility: { select: { id: true, name: true } } 
    }
  });
  console.log('Active Tickets in DB:', JSON.stringify(activeTickets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
