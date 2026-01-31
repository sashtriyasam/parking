const PDFDocument = require('pdfkit');
const { generateQRCodeBuffer } = require('./qrcode');

/**
 * Generate parking ticket PDF
 * @param {Object} ticketData - Complete ticket information
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateTicketPDF(ticketData) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Header
            doc.fontSize(24)
                .fillColor('#4F46E5')
                .text('ParkEase', { align: 'center' })
                .fontSize(16)
                .fillColor('#000000')
                .text('Parking Ticket', { align: 'center' })
                .moveDown();

            // Ticket ID
            doc.fontSize(12)
                .fillColor('#6B7280')
                .text('Ticket ID:', 50, doc.y)
                .fontSize(14)
                .fillColor('#000000')
                .text(ticketData.id.slice(0, 8).toUpperCase(), 150, doc.y - 14)
                .moveDown();

            // QR Code
            const qrBuffer = await generateQRCodeBuffer({
                ticketId: ticketData.id,
                slotId: ticketData.slot_id,
                vehicleNumber: ticketData.vehicle_number,
                entryTime: ticketData.entry_time,
                facilityId: ticketData.parking_facility?.id,
            });

            const qrX = (doc.page.width - 200) / 2;
            doc.image(qrBuffer, qrX, doc.y, { width: 200, height: 200 });
            doc.moveDown(12);

            // Facility Details
            doc.fontSize(14)
                .fillColor('#4F46E5')
                .text('Facility Details', { underline: true })
                .moveDown(0.5);

            doc.fontSize(12)
                .fillColor('#000000')
                .text(`Name: ${ticketData.parking_facility?.name || 'N/A'}`)
                .text(`Address: ${ticketData.parking_facility?.address || 'N/A'}`)
                .moveDown();

            // Parking Details
            doc.fontSize(14)
                .fillColor('#4F46E5')
                .text('Parking Details', { underline: true })
                .moveDown(0.5);

            doc.fontSize(12)
                .fillColor('#000000')
                .text(`Slot Number: ${ticketData.parking_slot?.slot_number || 'N/A'}`)
                .text(`Floor: ${ticketData.parking_slot?.floor?.floor_number || 'N/A'}`)
                .text(`Vehicle Number: ${ticketData.vehicle_number}`)
                .text(`Vehicle Type: ${ticketData.vehicle_type}`)
                .moveDown();

            // Booking Details
            doc.fontSize(14)
                .fillColor('#4F46E5')
                .text('Booking Details', { underline: true })
                .moveDown(0.5);

            const entryTime = new Date(ticketData.entry_time).toLocaleString('en-IN');
            const exitTime = ticketData.exit_time
                ? new Date(ticketData.exit_time).toLocaleString('en-IN')
                : 'Not exited yet';

            doc.fontSize(12)
                .fillColor('#000000')
                .text(`Entry Time: ${entryTime}`)
                .text(`Exit Time: ${exitTime}`)
                .text(`Status: ${ticketData.status}`)
                .moveDown();

            // Payment Details
            doc.fontSize(14)
                .fillColor('#4F46E5')
                .text('Payment Details', { underline: true })
                .moveDown(0.5);

            doc.fontSize(12)
                .fillColor('#000000')
                .text(`Total Fee: ₹${ticketData.total_fee?.toFixed(2) || '0.00'}`)
                .text(`Payment Status: ${ticketData.payment_status || 'Pending'}`)
                .moveDown();

            // Footer
            doc.fontSize(10)
                .fillColor('#6B7280')
                .text('Thank you for using ParkEase!', { align: 'center' })
                .text('For support, contact: support@parkease.com', { align: 'center' });

            doc.end();
        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(new Error('Failed to generate PDF'));
        }
    });
}

module.exports = {
    generateTicketPDF,
};
