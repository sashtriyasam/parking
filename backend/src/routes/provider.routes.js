const express = require('express');
const providerController = require('../controllers/provider.controller');
const parkingController = require('../controllers/parking.controller'); // Reuse creating facilities
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect ALL provider routes
router.use(protect);
router.use(restrictTo('PROVIDER', 'ADMIN'));

// Analytics
router.get('/dashboard/stats', providerController.getStats);
router.get('/reports/revenue', providerController.getRevenueReport);
router.get('/facilities/:facilityId/live-status', providerController.getLiveStatus);

// Facilities
router.post('/facilities', parkingController.createFacility); // Reusing existing logic
router.get('/facilities', parkingController.getMyFacilities); // Reusing existing logic
router.put('/facilities/:id', providerController.updateFacility);
router.delete('/facilities/:id', providerController.deleteFacility);

// Slots & Floors
router.post('/facilities/:facilityId/floors', parkingController.addFloor);
router.post('/floors/:floorId/slots/bulk', providerController.bulkCreateSlots);
router.put('/slots/:slotId', providerController.updateSlot);
router.get('/facilities/:facilityId/slots', providerController.getFacilitySlots);

// Pricing
router.post('/pricing-rules', providerController.setPricingRule);
router.get('/facilities/:facilityId/pricing', providerController.getFacilityPricing);

module.exports = router;
