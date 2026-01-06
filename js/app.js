/**
 * Main Application Entry Point
 * Orchestrates module initialization.
 */

import { initNotifications } from './features/notifications/notification.ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('MCMS Application Initialized');
    
    // Initialize Feature Modules
    initNotifications();
    
    // Future: Init other modules like Navigation, Charts, etc.
});
