const express = require('express');
const customerController = require('../controllers/customer.controller');
const ticketController = require('../controllers/ticket.controller');
const passController = require('../controllers/pass.controller');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// PUBLIC ROUTES (no auth required) - Must be BEFORE protect middleware
router.get('/search', customerController.searchParking);
router.get('/facility/:facilityId', customerController.getFacilityDetails);
router.get('/facility/:facilityId/slots', customerController.getAvailableSlots);
router.get('/facility/:facilityId/slots/:slotId/availability', customerController.getSlotAvailability);

// Protect ALL routes below this point
router.use(protect);
// REMOVED global restrictTo('CUSTOMER', 'ADMIN') to allow shared endpoints like cancellation

// --- AUTHENTICATED CUSTOMER ROUTES ---

// --- PROFILE & ANALYTICS (Customer Only) ---
router.get('/profile', restrictTo('CUSTOMER', 'ADMIN'), customerController.getProfile);
router.put('/profile', restrictTo('CUSTOMER', 'ADMIN'), customerController.updateProfile);
router.get('/stats', restrictTo('CUSTOMER', 'ADMIN'), customerController.getStats);

// --- VEHICLES (Customer Only) ---
router.get('/vehicles', restrictTo('CUSTOMER', 'ADMIN'), customerController.getVehicles);
router.post('/vehicles', restrictTo('CUSTOMER', 'ADMIN'), customerController.addVehicle);
router.delete('/vehicles/:vehicleId', restrictTo('CUSTOMER', 'ADMIN'), customerController.deleteVehicle);

// --- FAVORITES (Customer Only) ---
router.post('/favorites/:facilityId', restrictTo('CUSTOMER', 'ADMIN'), customerController.addFavorite);
router.delete('/favorites/:facilityId', restrictTo('CUSTOMER', 'ADMIN'), customerController.removeFavorite);
router.get('/favorites', restrictTo('CUSTOMER', 'ADMIN'), customerController.getFavorites);

// --- TICKETS ---
router.get('/tickets/active', restrictTo('CUSTOMER', 'ADMIN'), ticketController.getActiveTickets);
router.get('/tickets/history', restrictTo('CUSTOMER', 'ADMIN'), ticketController.getTicketHistory);
router.get('/tickets/:ticketId', restrictTo('CUSTOMER', 'ADMIN'), ticketController.getTicketById);
router.post('/tickets/:ticketId/extend', restrictTo('CUSTOMER', 'ADMIN'), ticketController.extendTicket);

// --- BOOKING FLOW (NEW) ---
const bookingController = require('../controllers/booking.controller');
router.post('/booking/confirm', restrictTo('CUSTOMER', 'ADMIN'), bookingController.createBookingWithPayment);
router.post('/tickets/:ticketId/cancel', restrictTo('CUSTOMER', 'PROVIDER', 'ADMIN'), bookingController.cancelBooking);
router.get('/booking/:ticketId/pdf', restrictTo('CUSTOMER', 'ADMIN'), bookingController.downloadTicketPDF);
router.get('/booking/:ticketId/invoice.pdf', restrictTo('CUSTOMER', 'ADMIN'), bookingController.downloadTicketPDF);

// --- MONTHLY PASSES ---
router.get('/passes/available', restrictTo('CUSTOMER', 'ADMIN'), passController.getAvailablePasses);
router.post('/passes/purchase', restrictTo('CUSTOMER', 'ADMIN'), passController.purchasePass);
router.get('/passes/active', restrictTo('CUSTOMER', 'ADMIN'), passController.getMyPasses);

module.exports = router;
