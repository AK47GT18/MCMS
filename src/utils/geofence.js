/**
 * Geofencing Utilities
 * Handles spatial calculations for location verification
 */

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Checks if a user's location is within a project's geofence.
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} projectLat - Project's latitude
 * @param {number} projectLng - Project's longitude
 * @param {number} radius - Geofence radius in meters
 * @returns {Object} { isWithin: boolean, distanceMeters: number }
 */
function checkGeofence(userLat, userLng, projectLat, projectLng, radius = 500) {
  // If coordinates are missing, we cannot verify. 
  // Depending on strictness, we might reject. Here we return false to enforce strict checks.
  if (!userLat || !userLng || !projectLat || !projectLng) {
    return { isWithin: false, distanceMeters: null, error: "Missing coordinates" };
  }

  const distanceMeters = calculateDistanceMeters(userLat, userLng, projectLat, projectLng);
  return {
    isWithin: distanceMeters <= radius,
    distanceMeters: Math.round(distanceMeters)
  };
}

module.exports = {
  calculateDistanceMeters,
  checkGeofence
};
