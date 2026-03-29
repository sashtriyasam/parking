/**
 * Geocoding Service - Converts addresses to lat/lng using Google Maps API
 */

const logger = require('../utils/logger');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocode an address to latitude/longitude
 * @param {string} address - Full address string
 * @param {string} city - City name (appended to address for better accuracy)
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
const geocodeAddress = async (address, city = '') => {
    if (!GOOGLE_MAPS_API_KEY) {
        logger.warn('GOOGLE_MAPS_API_KEY not set, skipping geocoding');
        return null;
    }

    const fullAddress = city ? `${address}, ${city}` : address;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            logger.info(`Geocoded "${fullAddress}" to (${location.lat}, ${location.lng})`);
            return {
                latitude: location.lat,
                longitude: location.lng
            };
        } else {
            logger.warn(`Geocoding failed for "${fullAddress}": ${data.status}`);
            return null;
        }
    } catch (error) {
        logger.error('Geocoding error:', error.message);
        return null;
    }
};

module.exports = {
    geocodeAddress
};
