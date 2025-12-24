/**
 * Main Application Entry Point
 * 
 * This file orchestrates the loading and initialization of all application modules.
 * The order of script loading matters - dependencies must be loaded first.
 */

console.log('MCMS Application v1.0.0 initializing...');

/**
 * Script Loading Order:
 * 1. Config (must be first - contains all settings)
 * 2. Core modules (router, auth, modal-manager, app)
 * 3. Services (API, notifications, etc.)
 * 4. Components (modals, data-tables, etc.)
 * 5. Modules (finance, projects, equipment, etc.)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Log that DOM is ready
  console.log('DOM Content Loaded - Initializing modules...');

  // Verify critical components are loaded
  const requiredModules = ['App', 'Router', 'ModalManager'];
  
  for (const module of requiredModules) {
    if (typeof window[module] === 'undefined') {
      console.error(`Critical module not loaded: ${module}`);
    }
  }

  // Initialize optional modules if available
  const optionalModules = ['DataTables', 'ModalsComponent', 'FinanceModule'];
  
  for (const module of optionalModules) {
    if (typeof window[module] !== 'undefined') {
      console.log(`Module loaded: ${module}`);
    }
  }

  console.log('Application initialization complete');
});

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

/**
 * Global unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
