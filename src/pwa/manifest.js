/**
 * MCMS PWA - Manifest Endpoint
 * Provides PWA manifest data
 */

const env = require('../config/env');

/**
 * Get PWA manifest data
 * @returns {Object} PWA manifest
 */
function getManifest() {
  return {
    name: 'MCMS - Construction Management System',
    short_name: 'MCMS',
    description: 'A comprehensive construction project management system',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['business', 'productivity'],
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false,
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard.png', sizes: '96x96' }],
      },
      {
        name: 'Projects',
        short_name: 'Projects',
        url: '/projects',
        icons: [{ src: '/icons/projects.png', sizes: '96x96' }],
      },
    ],
  };
}

/**
 * Get app configuration for frontend
 * @returns {Object} App config
 */
function getAppConfig() {
  return {
    name: 'MCMS',
    version: '1.0.0',
    apiUrl: `http://localhost:${env.PORT}/api/v1`,
    wsUrl: `ws://localhost:${env.PORT}`,
    features: {
      notifications: true,
      offlineMode: true,
      pushNotifications: false, // Requires VAPID setup
    },
  };
}

module.exports = {
  getManifest,
  getAppConfig,
};
