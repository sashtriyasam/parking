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

            // --- Header ---
            doc.fillColor('#444444')
                .fontSize(20)
                .text('PARKING THING', 50, 50)
                .fontSize(10)
                .text('Official Parking Invoice', 200, 50, { align: 'right' })
                .text(`Date: ${new Date().toLocaleDateString()}`, 200, 65, { align: 'right' })
                .moveDown();

            // --- Divider ---
            doc.strokeColor('#aaaaaa')
                .lineWidth(1)
                .moveTo(50, 90)
                .lineTo(550, 90)
                .stroke();

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
            doc.font('Helvetica-Bold').text('Facility:', leftX, startY + 20).font('Helvetica').text(ticket.parking_facility?.name || 'N/A', leftX + 80, startY + 20);
            doc.font('Helvetica-Bold').text('Slot:', rightX, startY + 20).font('Helvetica').text(ticket.parking_slot?.slot_number || 'N/A', rightX + 60, startY + 20);

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
