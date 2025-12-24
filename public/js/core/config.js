/**
 * Application Configuration
 */
const AppConfig = {
  // API Configuration
  api: {
    baseUrl: '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  // App Settings
  app: {
    name: 'Mkaka Construction Management',
    version: '1.0.0',
    debug: true,
    locale: 'en'
  },

  // Routes
  routes: {
    login: '/login.php',
    dashboard: '/dashboard.php',
    logout: '/logout.php'
  },

  // Storage Keys
  storage: {
    token: 'mkaka_auth_token',
    user: 'mkaka_user_data',
    settings: 'mkaka_settings',
    offline: 'mkaka_offline_data'
  },

  // Pagination
  pagination: {
    defaultPageSize: 25,
    pageSizes: [10, 25, 50, 100]
  },

  // Date Format
  dateFormat: 'YYYY-MM-DD',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',

  // Map Configuration
  map: {
    defaultCenter: { lat: -13.9626, lng: 33.7741 }, // Lilongwe
    defaultZoom: 13,
    apiKey: '' // Add your Google Maps API key
  },

  // File Upload
  upload: {
    maxSize: 10485760, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword']
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConfig;
}