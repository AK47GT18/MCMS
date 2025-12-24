# HTML Integration Guide

## Script Loading Order

The following is the CORRECT order to load JavaScript files in your HTML:

```html
<!-- ============================================== -->
<!-- STEP 1: Core Configuration (MUST BE FIRST) -->
<!-- ============================================== -->
<script src="/public/js/core/config.js"></script>

<!-- ============================================== -->
<!-- STEP 2: Core Application & Infrastructure -->
<!-- ============================================== -->
<script src="/public/js/core/auth.js"></script>
<script src="/public/js/core/ajax-handler.js"></script>
<script src="/public/js/core/modal-manager.js"></script>
<script src="/public/js/core/router.js"></script>

<!-- ============================================== -->
<!-- STEP 3: Components (UI Elements) -->
<!-- ============================================== -->
<script src="/public/js/components/notifications.js"></script>
<script src="/public/js/components/calendar.js"></script>
<script src="/public/js/components/charts.js"></script>
<script src="/public/js/components/data-tables.js"></script>
<script src="/public/js/components/modals.js"></script>
<script src="/public/js/components/gantt.js"></script>
<script src="/public/js/components/leaflet.js"></script>
<script src="/public/js/components/map.js"></script>

<!-- ============================================== -->
<!-- STEP 4: Services (Business Logic) -->
<!-- ============================================== -->
<script src="/public/js/services/api.js"></script>
<script src="/public/js/services/gps.js"></script>
<script src="/public/js/services/offline.js"></script>
<script src="/public/js/services/sync.js"></script>
<script src="/public/js/services/notifications.js"></script>

<!-- ============================================== -->
<!-- STEP 5: Modules (Feature Modules) -->
<!-- ============================================== -->
<script src="/public/js/modules/dashboard.js"></script>
<script src="/public/js/modules/projects.js"></script>
<script src="/public/js/modules/equipment.js"></script>
<script src="/public/js/modules/contracts.js"></script>
<script src="/public/js/modules/finance.js"></script>
<script src="/public/js/modules/reports.js"></script>

<!-- ============================================== -->
<!-- STEP 6: Utilities (Helper Functions) -->
<!-- ============================================== -->
<script src="/public/js/utils/formatter.js"></script>
<script src="/public/js/utils/helpers.js"></script>
<script src="/public/js/utils/storage.js"></script>
<script src="/public/js/utils/validation.js"></script>

<!-- ============================================== -->
<!-- STEP 7: Main Application (MUST BE LAST) -->
<!-- ============================================== -->
<script src="/public/js/core/app.js"></script>

<!-- ============================================== -->
<!-- OPTIONAL: External Libraries -->
<!-- ============================================== -->
<!-- Chart.js for charts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- Leaflet for maps -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>

<!-- Font Awesome for icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

---

## Minimal HTML Structure

Here's the minimal HTML structure needed to use all JavaScript modules:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCMS - Construction Management System</title>
    
    <!-- External Libraries -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
    
    <!-- Application CSS -->
    <link rel="stylesheet" href="/public/css/main.css">
</head>
<body>
    <!-- Main Application -->
    <div class="app" id="app">
        <!-- Header -->
        <header class="top-bar">
            <div class="hamburger" onclick="toggleSidebar()">
                <i class="fas fa-bars"></i>
            </div>
            <div class="logo">
                <i class="fas fa-hard-hat"></i>
                <span>MKAKA</span>
            </div>
            <div class="project-switcher" onclick="openProjectSwitcher()">
                <i class="fas fa-building" style="color: var(--orange);"></i>
                <span id="current-project">Project Name</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="top-actions">
                <div class="icon-btn" onclick="openSearch()">
                    <i class="fas fa-search"></i>
                </div>
                <div class="icon-btn" onclick="openNotifications()">
                    <i class="fas fa-bell"></i>
                    <span class="badge">0</span>
                </div>
                <div class="user-avatar" onclick="openUserMenu()">AK</div>
            </div>
        </header>

        <!-- Workspace -->
        <div class="workspace">
            <!-- Sidebar Overlay -->
            <div class="sidebar-overlay" onclick="toggleSidebar()"></div>
            
            <!-- Sidebar Navigation -->
            <aside class="sidebar" id="sidebar">
                <!-- Sidebar content here -->
                <div class="sidebar-header">
                    <div class="user-profile" onclick="openUserProfile()">
                        <div class="profile-avatar">AK</div>
                        <div class="profile-info">
                            <div class="profile-name">User Name</div>
                            <div class="profile-role">User Role</div>
                        </div>
                    </div>
                </div>
                
                <nav class="sidebar-nav" id="sidebar-nav">
                    <!-- Navigation items here -->
                </nav>
            </aside>

            <!-- Main Content -->
            <main class="main-content">
                <div class="page-header" id="page-header">
                    <div class="breadcrumb">
                        <span id="breadcrumb-0">Dashboard</span>
                    </div>
                    <div class="page-title-row">
                        <h1 class="page-title" id="page-title">Dashboard</h1>
                        <button class="btn btn-primary" id="page-action" onclick="loadPage('dashboard')">
                            <i class="fas fa-plus"></i>
                            <span>Create</span>
                        </button>
                    </div>
                </div>

                <div class="content" id="page-content">
                    <!-- Page content dynamically loaded here -->
                    <div class="loading">
                        <i class="fas fa-spinner"></i>
                        <div>Loading...</div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Modal Overlay (for global modals) -->
    <div class="modal-overlay" id="modal-overlay">
        <div class="modal" id="modal-content">
            <!-- Modal content here -->
        </div>
    </div>

    <!-- ============================================== -->
    <!-- JAVASCRIPT LOADING (IN CORRECT ORDER) -->
    <!-- ============================================== -->
    
    <!-- Configuration -->
    <script src="/public/js/core/config.js"></script>
    
    <!-- Core Infrastructure -->
    <script src="/public/js/core/auth.js"></script>
    <script src="/public/js/core/ajax-handler.js"></script>
    <script src="/public/js/core/modal-manager.js"></script>
    <script src="/public/js/core/router.js"></script>
    
    <!-- Components -->
    <script src="/public/js/components/notifications.js"></script>
    <script src="/public/js/components/calendar.js"></script>
    <script src="/public/js/components/charts.js"></script>
    <script src="/public/js/components/data-tables.js"></script>
    <script src="/public/js/components/modals.js"></script>
    <script src="/public/js/components/gantt.js"></script>
    <script src="/public/js/components/leaflet.js"></script>
    <script src="/public/js/components/map.js"></script>
    
    <!-- Services -->
    <script src="/public/js/services/api.js"></script>
    <script src="/public/js/services/gps.js"></script>
    <script src="/public/js/services/offline.js"></script>
    <script src="/public/js/services/sync.js"></script>
    <script src="/public/js/services/notifications.js"></script>
    
    <!-- Modules -->
    <script src="/public/js/modules/dashboard.js"></script>
    <script src="/public/js/modules/projects.js"></script>
    <script src="/public/js/modules/equipment.js"></script>
    <script src="/public/js/modules/contracts.js"></script>
    <script src="/public/js/modules/finance.js"></script>
    <script src="/public/js/modules/reports.js"></script>
    
    <!-- Utilities -->
    <script src="/public/js/utils/formatter.js"></script>
    <script src="/public/js/utils/helpers.js"></script>
    <script src="/public/js/utils/storage.js"></script>
    <script src="/public/js/utils/validation.js"></script>
    
    <!-- Main Application (LAST) -->
    <script src="/public/js/core/app.js"></script>
    
    <!-- External Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
</body>
</html>
```

---

## Element Requirements

For the JavaScript to work properly, your HTML must have these elements:

### Essential Elements
- `<div class="app">` - Main app container
- `<header class="top-bar">` - Top navigation bar
- `<div class="workspace">` - Main workspace container
- `<aside class="sidebar">` - Left sidebar
- `<main class="main-content">` - Main content area
- `<div class="page-header">` - Page header area
- `<div class="content" id="page-content">` - Page content area
- `<div class="modal-overlay" id="modal-overlay">` - Modal container

### Optional but Recommended
- `<div id="notifications-container">` - Notifications area
- `<div id="sidebar-nav">` - Navigation container
- `<div id="page-header">` - Page header container
- `<canvas id="budget-chart">` - Chart containers
- `<table id="data-table">` - Data table
- `<tbody id="table-body">` - Table body

---

## CSS Classes Required

### Layout Classes
```css
.app
.top-bar
.workspace
.sidebar
.main-content
.page-header
.content
.modal-overlay
.modal
.sidebar-overlay
```

### Component Classes
```css
.btn
.btn-primary
.btn-secondary
.icon-btn
.tab
.tab.active
.nav-link
.nav-link.active
.status
.status.approved
.status.pending
.status.completed
.status.rejected
.progress-bar
.progress-fill
```

### Data Table Classes
```css
table
thead
tbody
th
td
tr
```

### Form Classes
```css
.form-group
.form-label
.form-input
.form-select
.form-textarea
```

---

## JavaScript Variable Requirements

Your config.js should define:

```javascript
const AppConfig = {
  app: {
    name: 'MKAKA Construction Management System',
    version: '1.0.0'
  },
  api: {
    baseURL: 'http://localhost:8000',
    timeout: 30000
  },
  routes: {
    login: '/login',
    dashboard: '/dashboard',
    projects: '/projects',
    equipment: '/equipment',
    commitments: '/commitments'
  }
};
```

---

## Initialization Flow

1. **Browser Loads HTML**
   - Parses DOM
   - Loads stylesheets

2. **JavaScript Loading (In Order)**
   - Config.js loads first
   - Core infrastructure loads
   - Components load
   - Services load
   - Modules load
   - Utilities load
   - app.js loads last

3. **App Initialization**
   - App.init() is called
   - initializeModules() is called
   - All components are initialized
   - Event listeners are set up

4. **Ready for User Interaction**
   - UI is fully functional
   - All modules are ready
   - Services are monitoring

---

## Common Issues & Solutions

### Issue: "Module not defined"
**Solution:** Check script loading order. Ensure dependencies load before modules.

### Issue: "Cannot read property of undefined"
**Solution:** Make sure required HTML elements exist in DOM.

### Issue: Charts not rendering
**Solution:** Ensure Chart.js library is loaded and container exists.

### Issue: Notifications not showing
**Solution:** Check if NotificationComponent.init() is called.

### Issue: Offline features not working
**Solution:** Ensure offline.js and sync.js are loaded before app.js.

### Issue: GPS not tracking
**Solution:** Check browser permissions and ensure HTTPS in production.

---

## Best Practices

1. **Always load scripts in the specified order**
2. **Use event delegation for dynamic elements**
3. **Always check if module exists before calling**
4. **Use try/catch for error handling**
5. **Log to console for debugging**
6. **Test in browser DevTools console**
7. **Check network tab for API calls**
8. **Verify element IDs match in HTML and JS**

---

## Testing

### Test Notifications
```javascript
NotificationComponent.success('Test notification');
```

### Test Module Loading
```javascript
console.log('Dashboard:', typeof DashboardModule);
console.log('Projects:', typeof ProjectsModule);
```

### Test API
```javascript
AjaxHandler.get('/api/v1/health')
  .then(response => console.log('API OK', response))
  .catch(error => console.error('API Error', error));
```

### Test Services
```javascript
console.log('GPS:', GPSService.isTracking);
console.log('Online:', OfflineService.isOnline);
console.log('Sync Queue:', SyncService.getQueue());
```

---

For full integration examples, see the mockup HTML file in the project root.
