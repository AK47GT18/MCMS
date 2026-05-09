/**
 * High-Accuracy Windows Location Retrieval for Node.js
 * ---------------------------------------------------
 * Uses native Windows.Devices.Geolocation API
 * NO IP-based geolocation
 * Forces Wi-Fi triangulation / GPS hardware usage
 * Returns precise coordinates + accuracy radius
 *
 * REQUIREMENTS:
 * npm install @nodert-win11/windows.devices.geolocation
 */

async function getPreciseLocation() {
    try {
        // We use a dynamic require so we can catch the error if the native module isn't installed
        const Geolocation = require("@nodert-win11/windows.devices.geolocation");
        
        // Create native Windows geolocator
        const geolocator = new Geolocation.Geolocator();
        
        // Force highest possible accuracy
        geolocator.desiredAccuracy = Geolocation.PositionAccuracy.high;
        
        // Optional: reduce stale cache usage
        geolocator.movementThreshold = 1;
        
        // Check if Windows Location Services are enabled
        const accessStatus = await Geolocation.Geolocator.requestAccessAsync();
        
        switch (accessStatus) {
            case Geolocation.GeolocationAccessStatus.allowed:
                break;
            case Geolocation.GeolocationAccessStatus.denied:
                throw new Error("Location access denied. Enable Location Services in Windows Settings.");
            case Geolocation.GeolocationAccessStatus.unspecified:
                throw new Error("Location access unavailable or not configured.");
            default:
                throw new Error("Unknown geolocation permission state.");
        }
        
        // Get actual hardware-assisted position
        const position = await geolocator.getGeopositionAsync();
        const coord = position.coordinate;
        
        const result = {
            Latitude: coord.point.position.latitude,
            Longitude: coord.point.position.longitude,
            Accuracy: coord.accuracy, // meters
            Timestamp: coord.timestamp,
            Source: "Native-NodeRT"
        };
        
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch (err) {
        console.error(JSON.stringify({
            error: true,
            message: err.message,
            code: err.code || "NATIVE_ERROR"
        }, null, 2));
        process.exit(1);
    }
}

getPreciseLocation();
