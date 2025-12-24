/**
 * Simple Router for SPA Navigation
 */
const Router = {
  routes: {},
  currentRoute: null,

  /**
   * Register a route
   */
  register(path, handler) {
    this.routes[path] = handler;
  },

  /**
   * Navigate to a route
   */
  navigate(path, data = {}) {
    if (this.routes[path]) {
      this.currentRoute = path;
      window.history.pushState({ path, data }, '', path);
      this.routes[path](data);
    } else {
      console.error(`Route not found: ${path}`);
    }
  },

  /**
   * Go back
   */
  back() {
    window.history.back();
  },

  /**
   * Initialize router
   */
  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.path) {
        const route = this.routes[e.state.path];
        if (route) {
          route(e.state.data || {});
        }
      }
    });

    // Handle initial route
    const path = window.location.pathname;
    if (this.routes[path]) {
      this.routes[path]({});
    }
  }
};