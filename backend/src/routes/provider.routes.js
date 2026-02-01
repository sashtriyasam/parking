const express = require('express');
const providerController = require('../controllers/provider.controller');
const parkingController = require('../controllers/parking.controller'); // Reuse creating facilities
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect ALL provider routes
router.use(protect);
router.use(restrictTo('PROVIDER', 'ADMIN'));


// Analytics & Dashboard
router.get('/dashboard/stats', providerController.getStats);
router.get('/dashboard/revenue', providerController.getRevenueData);
router.get('/dashboard/occupancy', providerController.getOccupancyData);
router.get('/dashboard/recent-bookings', providerController.getRecentBookings);
router.get('/reports/revenue', providerController.getRevenueReport);
router.get('/facilities/:facilityId/live-status', providerController.getLiveStatus);

// Facilities
router.post('/facilities', parkingController.createFacility); // Reusing existing logic
router.get('/facilities', parkingController.getMyFacilities); // Reusing existing logic
router.get('/facilities/:id', providerController.getFacilityDetails);
router.put('/facilities/:id', providerController.updateFacility);
router.delete('/facilities/:id', providerController.deleteFacility);

// Slots & Floors
router.post('/facilities/:facilityId/floors', parkingController.addFloor);
router.post('/facilities/:facilityId/slots/bulk', providerController.bulkCreateSlotsByFacility);
router.post('/floors/:floorId/slots/bulk', providerController.bulkCreateSlots); // Keep old route for compatibility
router.put('/slots/:slotId', providerController.updateSlot);
router.delete('/slots/:id', providerController.deleteSlot);
router.get('/facilities/:facilityId/slots', providerController.getFacilitySlots);

// Pricing
router.post('/pricing-rules', providerController.setPricingRule);
router.get('/facilities/:facilityId/pricing', providerController.getFacilityPricing);
router.put('/facilities/:id/pricing', providerController.updateFacilityPricing);

// Bookings
router.get('/bookings', providerController.getAllBookings);

module.exports = router;

