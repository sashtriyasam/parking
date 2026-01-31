const express = require('express');
const parkingController = require('../controllers/parking.controller');
const customerController = require('../controllers/customer.controller');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/search', customerController.searchParking);
router.get('/:facilityId/details', customerController.getFacilityDetails);
router.get('/:facilityId/available-slots', customerController.getAvailableSlots);
router.get('/', parkingController.getAllFacilities);
router.get('/:id', parkingController.getFacility);
router.get('/floors/:floorId/slots', parkingController.getFloorSlots);

// Provider routes
router.use(protect);
router.use(restrictTo('PROVIDER', 'ADMIN'));

router.post('/', parkingController.createFacility);
router.get('/me/facilities', parkingController.getMyFacilities);
router.post('/floors', parkingController.addFloor);
router.post('/slots', parkingController.addSlots);

module.exports = router;
