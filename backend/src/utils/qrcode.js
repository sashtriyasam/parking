const QRCode = require('qrcode');

/**
 * Generate QR code for parking ticket
 * @param {Object} ticketData - Ticket information
 * @returns {Promise<string>} Base64 encoded QR code image
 */
async function generateTicketQRCode(ticketData) {
    try {
        const qrData = JSON.stringify({
            ticketId: ticketData.ticketId,
            slotId: ticketData.slotId,
            vehicleNumber: ticketData.vehicleNumber,
            entryTime: ticketData.entryTime,
            facilityId: ticketData.facilityId,
        });

        // Generate QR code as data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 1,
            margin: 2,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate QR code as buffer for PDF embedding
 * @param {Object} ticketData - Ticket information
 * @returns {Promise<Buffer>} QR code image buffer
 */
async function generateQRCodeBuffer(ticketData) {
    try {
        const qrData = JSON.stringify({
            ticketId: ticketData.ticketId,
            slotId: ticketData.slotId,
            vehicleNumber: ticketData.vehicleNumber,
            entryTime: ticketData.entryTime,
            facilityId: ticketData.facilityId,
        });

        const buffer = await QRCode.toBuffer(qrData, {
            errorCorrectionLevel: 'H',
            type: 'png',
            quality: 1,
            margin: 2,
            width: 300,
        });

        return buffer;
    } catch (error) {
        console.error('Error generating QR code buffer:', error);
        throw new Error('Failed to generate QR code buffer');
    }
}

/**
 * Verify QR code data
 * @param {string} qrData - Scanned QR code data
 * @returns {Object} Parsed ticket data
 */
function verifyQRCode(qrData) {
    try {
        const ticketData = JSON.parse(qrData);

        // Validate required fields
        if (!ticketData.ticketId || !ticketData.slotId || !ticketData.vehicleNumber) {
            throw new Error('Invalid QR code data');
        }

        return ticketData;
    } catch (error) {
        console.error('Error verifying QR code:', error);
        throw new Error('Invalid QR code');
    }
}

module.exports = {
    generateTicketQRCode,
    generateQRCodeBuffer,
    verifyQRCode,
};
