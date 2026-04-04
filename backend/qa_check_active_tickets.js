import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activeTickets = await prisma.ticket.findMany({
    where: { status: 'ACTIVE' },
    include: { 
      customer: { select: { id: true, full_name: true, role: true } }, 
      facility: { select: { id: true, name: true } } 
    }
  });

  // Log active tickets without PII (email removed from query above)
  const maskedTickets = activeTickets.map(ticket => ({
    ...ticket,
    customer: {
      ...ticket.customer,
      full_name: ticket.customer.full_name.replace(/(?<=.).(?=.*@)/g, '*')
    }
  }));
  console.log('Active Tickets in DB:', JSON.stringify(maskedTickets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
