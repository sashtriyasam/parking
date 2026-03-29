const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { protect } = require('../middleware/auth');

// Note: authentication middleware added so only logged in users can verify their vehicles
router.post('/verify-rc', protect, verificationController.verifyVehicleRC);

module.exports = router;
