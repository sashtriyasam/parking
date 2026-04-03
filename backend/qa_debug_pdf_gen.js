const { PrismaClient } = require('@prisma/client');
const { generateTicketPDF } = require('./src/utils/pdfGenerator');
const fs = require('fs');
const prisma = new PrismaClient();

async function debugPDF() {
    try {
        const ticketId = '812877d2-1915-49ce-9d40-0edbe1a0da10'; // Using known active ticket
        console.log('Fetching ticket:', ticketId);
        
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                slot: {
                    include: {
                        floor: {
                            include: {
                                facility: true
                            }
                        }
                    }
                },
                facility: true,
            }
        });

        if (!ticket) {
            console.error('Ticket not found!');
            return;
        }

        console.log('Generating PDF...');
        const buffer = await generateTicketPDF(ticket);
        console.log('PDF Generated. Buffer Result:', buffer ? `Length: ${buffer.length}` : 'NULL');
        
        fs.writeFileSync('debug_ticket.pdf', buffer);
        console.log('File saved to debug_ticket.pdf');

    } catch (error) {
        console.error('Error during PDF debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugPDF();
