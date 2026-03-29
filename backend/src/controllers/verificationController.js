const axios = require('axios');
const prisma = require('../config/db');

// Default export
exports.verifyVehicleRC = async (req, res) => {
  try {
    const { vehicleId, regNo } = req.body;
    const userId = req.user.id;

    if (!vehicleId || !regNo) {
      return res.status(400).json({ error: 'Vehicle ID and Registration Number are required' });
    }

    // Ensure the vehicle belongs to the exact user
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle || vehicle.user_id !== userId) {
      return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
    }

    // Use API KEY from environment or fallback to empty
    const apiKey = process.env.API_SETU_KEY || 'MISSING_API_KEY';
    
    // Call the API Setu TransportMH RVCER endpoint
    // Endpoint: POST https://sandbox.api-setu.in/api-collection/transportmh/0/certificate/v3/transportmh/rvcer
    // Based on standard API Setu docs
    
    // Optional: We can wrap this in a block that simulates success if the key is missing in demo mode
    if (apiKey === 'MISSING_API_KEY') {
      console.warn("API Setu Key is missing, simulating success for demo purposes.");
      
      const mockRcDetails = {
        status: "success",
        registration_number: regNo,
        owner_name: req.user.full_name || "MOCK OWNER",
        vehicle_class: vehicle.vehicle_type,
        registration_date: "2020-01-01"
      };

      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          is_verified: true,
          rc_details: JSON.stringify(mockRcDetails),
        }
      });

      return res.json({ message: 'RC successfully verified (Mocked)', vehicle: updatedVehicle });
    }

    // Actual API Call (sandbox)
    try {
      const response = await axios.post(
        'https://sandbox.api-setu.in/api-collection/transportmh/0/certificate/v3/transportmh/rvcer',
        {
          "txnId": `txn_${Date.now()}`,
          "format": "json",
          "certificateParameters": {
            "reg_no": regNo
          }
        },
        {
          headers: {
            'X-APISETU-APIKEY': apiKey,
            // 'X-APISETU-CLIENTID': process.env.API_SETU_CLIENT_ID, // usually requires client ID too
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract details from API Setu response
      const apiData = response.data;
      
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          is_verified: true,
          rc_details: JSON.stringify(apiData)
        }
      });

      res.json({ message: 'RC successfully verified', vehicle: updatedVehicle });
    } catch (apiError) {
      console.error('API Setu Error:', apiError.response?.data || apiError.message);
      res.status(502).json({ error: 'Failed to verify RC with the transport authority', details: apiError.response?.data || apiError.message });
    }

  } catch (error) {
    console.error('Verification Controller Error:', error);
    res.status(500).json({ error: 'Internal server error while verifying vehicle' });
  }
};
