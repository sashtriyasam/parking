const PDFDocument = require('pdfkit');

/**
 * Generates a PDF buffer for a ticket invoice
 * @param {Object} ticket - Ticket object with related data
 * @returns {Promise<Buffer>}
 */
const generateTicketPDF = (ticket) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- Header Decorative Stripe ---
            doc.rect(0, 0, 612, 40).fill('#6366f1'); // Indigo-600
            doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('PARKEASY - DIGITAL PARKING TICKET', 50, 15);

            // --- Brand Header ---
            doc.fillColor('#1f2937') // Gray-800
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('ParkEasy', 50, 60)
                .fontSize(10)
                .font('Helvetica')
                .fillColor('#6b7280') // Gray-500
                .text('Smart Parking Management System', 50, 85)
                .moveDown();

            doc.fillColor('#111827') // Gray-900
                .fontSize(10)
                .text('Official Parking Invoice', 400, 60, { align: 'right' })
                .text(`Issue Date: ${new Date().toLocaleDateString()}`, 400, 75, { align: 'right' })
                .text(`Issue Time: ${new Date().toLocaleTimeString()}`, 400, 90, { align: 'right' });

            // --- Ticket Info ---
            doc.fontSize(14).text('Ticket Information', 50, 110);
            doc.fontSize(10).font('Helvetica-Bold');

            const startY = 140;
            const leftX = 50;
            const rightX = 300;

            // Row 1
            doc.text('Ticket ID:', leftX, startY).font('Helvetica').text(ticket.id.toUpperCase(), leftX + 80, startY);
            doc.font('Helvetica-Bold').text('Vehicle:', rightX, startY).font('Helvetica').text(`${ticket.vehicle_number} (${ticket.vehicle_type})`, rightX + 60, startY);

            // Row 2
            const facilityName = (ticket.facility?.name || ticket.parking_facility?.name || 'ParkEasy Facility');
            doc.font('Helvetica-Bold').text('Facility:', leftX, startY + 20).font('Helvetica').text(facilityName, leftX + 80, startY + 20);
            
            const slotNumber = (ticket.slot?.slot_number || ticket.slot?.slotNumber || ticket.parking_slot?.slot_number || 'N/A');
            doc.font('Helvetica-Bold').text('Slot:', rightX, startY + 20).font('Helvetica').text(slotNumber, rightX + 60, startY + 20);

            // --- Time Table ---
            const tableTop = 200;
            doc.font('Helvetica-Bold');
            doc.text('Description', 50, tableTop);
            doc.text('Time', 300, tableTop);
            doc.text('Date', 450, tableTop);

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            doc.font('Helvetica');
            doc.text('Entry Time', 50, tableTop + 30);
            doc.text(new Date(ticket.entry_time).toLocaleTimeString(), 300, tableTop + 30);
            doc.text(new Date(ticket.entry_time).toLocaleDateString(), 450, tableTop + 30);

            if (ticket.exit_time) {
                doc.text('Exit Time', 50, tableTop + 50);
                doc.text(new Date(ticket.exit_time).toLocaleTimeString(), 300, tableTop + 50);
                doc.text(new Date(ticket.exit_time).toLocaleDateString(), 450, tableTop + 50);
            }

            // --- Payment Details ---
            const paymentTop = 300;
            doc.rect(50, paymentTop, 500, 100).fill('#f9f9f9').stroke('#eeeeee');
            doc.fillColor('#444444');

            doc.fontSize(14).text('Payment Summary', 70, paymentTop + 20);
            doc.fontSize(10);

            doc.text('Total Amount Paid:', 70, paymentTop + 50);
            doc.fontSize(18).font('Helvetica-Bold').text(`Rs. ${ticket.total_fee || 0}.00`, 400, paymentTop + 45, { align: 'right' });

            doc.fontSize(10).font('Helvetica').text(`Status: ${ticket.payment_status || 'PENDING'}`, 70, paymentTop + 70);
            doc.text(`Method: ${ticket.payment_method || 'N/A'}`, 250, paymentTop + 70);

            // --- Footer ---
            doc.fontSize(10)
                .text('Thank you for parking with us.', 50, 700, { align: 'center', width: 500 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateTicketPDF };
