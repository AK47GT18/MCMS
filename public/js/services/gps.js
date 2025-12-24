/**
 * GPS Service
 * Handles GPS tracking and location services
 */
const GPSService = {
  isTracking: false,
  watchId: null,
  currentLocation: null,
  markers: [],
  map: null,

  /**
   * Initialize GPS service
   */
  init() {
    console.log('GPS Service initialized');
    if (navigator.geolocation) {
      this.getCurrentLocation();
    } else {
      console.warn('Geolocation not supported');
    }
  },

  /**
   * Get current location
   */
  getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        console.log('Current location:', this.currentLocation);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  },

  /**
   * Start tracking
   */
  startTracking(equipmentId) {
    if (this.isTracking) return;

    this.isTracking = true;
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
          equipmentId: equipmentId
        };

        // Send to server
        this.sendTrackingData();
      },
      (error) => {
        console.error('Tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    NotificationComponent.success(`Started tracking equipment ${equipmentId}`);
  },

  /**
   * Stop tracking
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      NotificationComponent.info('Tracking stopped');
    }
  },

  /**
   * Send tracking data to server
   */
  sendTrackingData() {
    if (!this.currentLocation) return;

    AjaxHandler.post('/api/v1/gps/track', {
      equipmentId: this.currentLocation.equipmentId,
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
      accuracy: this.currentLocation.accuracy,
      timestamp: this.currentLocation.timestamp
    }).then(response => {
      // Handle response
      console.log('Tracking data sent:', response);
    }).catch(error => {
      console.error('Error sending tracking data:', error);
    });
  },

  /**
   * Add marker to map
   */
  addMarker(lat, lng, label = '') {
    if (!this.map) return;

    const marker = {
      latitude: lat,
      longitude: lng,
      label: label
    };

    this.markers.push(marker);
    console.log('Marker added:', marker);
  },

  /**
   * Clear markers
   */
  clearMarkers() {
    this.markers = [];
  },

  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Get location name (reverse geocoding)
   */
  async getLocationName(lat, lng) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await response.json();
      return data.address?.city || data.address?.town || 'Unknown Location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown Location';
    }
  }
};
