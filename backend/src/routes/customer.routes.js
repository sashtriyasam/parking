const express = require('express');
const customerController = require('../controllers/customer.controller');
const ticketController = require('../controllers/ticket.controller');
const passController = require('../controllers/pass.controller');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect ALL customer routes
router.use(protect);
router.use(restrictTo('CUSTOMER', 'ADMIN'));

// --- DISCOVERY & SEARCH ---
router.get('/parking/search', customerController.searchParking);
router.get('/parking/:facilityId/details', customerController.getFacilityDetails);
router.get('/parking/:facilityId/available-slots', customerController.getAvailableSlots);

// --- PROFILE ---
router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);

// --- VEHICLES ---
router.get('/vehicles', customerController.getVehicles);
router.post('/vehicles', customerController.addVehicle);
router.delete('/vehicles/:vehicleId', customerController.deleteVehicle);

// --- FAVORITES ---
router.post('/favorites/:facilityId', customerController.addFavorite);
router.delete('/favorites/:facilityId', customerController.removeFavorite);
router.get('/favorites', customerController.getFavorites);

// --- TICKETS ---
router.get('/tickets/active', ticketController.getActiveTickets);
router.get('/tickets/history', ticketController.getTicketHistory);
router.get('/tickets/:ticketId', ticketController.getTicketById);
router.post('/tickets/:ticketId/extend', ticketController.extendTicket);

// --- MONTHLY PASSES ---
router.get('/passes/available', passController.getAvailablePasses);
router.post('/passes/purchase', passController.purchasePass);
router.get('/passes/active', passController.getMyPasses);

module.exports = router;
