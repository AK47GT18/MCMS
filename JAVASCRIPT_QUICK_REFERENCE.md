# JavaScript Components - Quick Reference Guide

## 1. Notifications Component

### Show Toast Notification
```javascript
NotificationComponent.success('Operation completed!');
NotificationComponent.error('Something went wrong');
NotificationComponent.warning('Please review this');
NotificationComponent.info('Information message');
```

### Show Notifications Panel
```javascript
NotificationComponent.openPanel();
NotificationComponent.closePanel();
```

### Clear All
```javascript
NotificationComponent.clearAll();
```

---

## 2. Calendar Component

### Initialize Calendar
```javascript
CalendarComponent.init('calendar-container', {
  initialDate: new Date(),
  selectedDate: new Date(),
  onSelect: (date) => {
    console.log('Selected:', date);
  }
});
```

### Get Selected Date
```javascript
const dateString = CalendarComponent.getSelectedDateString(); // "2024-02-15"
```

### Navigation
```javascript
CalendarComponent.previousMonth();
CalendarComponent.nextMonth();
```

---

## 3. Charts Component

### Create Bar Chart
```javascript
ChartComponent.createBarChart('chart-container', {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Sales',
    data: [100, 200, 150],
    backgroundColor: 'rgba(255, 138, 0, 0.8)'
  }]
});
```

### Create Line Chart
```javascript
ChartComponent.createLineChart('chart-container', {
  labels: ['Week 1', 'Week 2', 'Week 3'],
  datasets: [{
    label: 'Progress',
    data: [30, 50, 80],
    borderColor: 'rgba(255, 138, 0, 1)'
  }]
});
```

### Create Pie Chart
```javascript
ChartComponent.createPieChart('chart-container', {
  labels: ['Completed', 'Pending', 'Failed'],
  datasets: [{
    data: [65, 25, 10],
    backgroundColor: [
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ]
  }]
});
```

### Create Doughnut Chart
```javascript
ChartComponent.createDoughnutChart('chart-container', {
  labels: ['On Track', 'At Risk', 'Behind'],
  datasets: [{
    data: [60, 25, 15],
    backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
  }]
});
```

---

## 4. Data Tables Component

### Initialize Table
```javascript
DataTablesComponent.init('my-table', {
  data: [
    { id: 1, name: 'Project A', status: 'Active' },
    { id: 2, name: 'Project B', status: 'Pending' }
  ],
  pageSize: 10
});
```

### Filter Table
```javascript
DataTablesComponent.filterTable('my-table', 'search term');
```

### Sort by Column
```javascript
DataTablesComponent.sortTable('my-table', 0); // Column index
```

### Get Processed Data
```javascript
const data = DataTablesComponent.getProcessedData('my-table');
```

---

## 5. Commitments/Contracts Module

### Create Commitment
```javascript
CommitmentsModule.createCommitment();
```

### View Commitment
```javascript
CommitmentsModule.viewCommitment('CNT-2024-001');
```

### Edit Commitment
```javascript
CommitmentsModule.editCommitment('CNT-2024-001');
```

### Delete Commitment
```javascript
CommitmentsModule.deleteCommitment('CNT-2024-001');
```

### Filter Commitments
```javascript
CommitmentsModule.filterCommitments('status', 'Approved');
CommitmentsModule.filterCommitments('vendor', 'Malawi Cement Company');
```

---

## 6. Dashboard Module

### Initialize
```javascript
DashboardModule.init();
```

### Refresh Data
```javascript
DashboardModule.refresh();
```

### Destroy (Clean up charts)
```javascript
DashboardModule.destroy();
```

---

## 7. Equipment Module

### Load Equipment
```javascript
EquipmentModule.loadEquipment();
```

### Display Equipment
```javascript
EquipmentModule.displayEquipment();
```

### View Equipment Details
```javascript
EquipmentModule.viewEquipment('EQ-001');
```

### Schedule Maintenance
```javascript
EquipmentModule.scheduleMaintenance('EQ-001');
```

### Track Location
```javascript
EquipmentModule.trackLocation('EQ-001');
```

---

## 8. Projects Module

### Load Projects
```javascript
ProjectsModule.loadProjects();
```

### Display Projects
```javascript
ProjectsModule.displayProjects();
```

### View Project
```javascript
ProjectsModule.viewProject('PROJ-001');
```

### Create Project
```javascript
ProjectsModule.createProject();
```

### Edit Project
```javascript
ProjectsModule.editProject('PROJ-001');
```

### Archive Project
```javascript
ProjectsModule.archiveProject('PROJ-001');
```

---

## 9. Finance Module

### Load Transactions
```javascript
FinanceModule.loadTransactions();
```

### Display Transactions
```javascript
FinanceModule.displayTransactions();
```

### View Transaction
```javascript
FinanceModule.viewTransaction('TXN-2024-001');
```

### Generate Report
```javascript
FinanceModule.generateReport('monthly');
// Types: daily, weekly, monthly, quarterly, annual
```

### Export Transactions
```javascript
FinanceModule.exportTransactions('csv');
// Formats: csv, pdf, xlsx, json
```

---

## 10. GPS Service

### Initialize
```javascript
GPSService.init();
```

### Get Current Location
```javascript
GPSService.getCurrentLocation();
// Stored in: GPSService.currentLocation
```

### Start Tracking
```javascript
GPSService.startTracking('EQ-001');
```

### Stop Tracking
```javascript
GPSService.stopTracking();
```

### Check Tracking Status
```javascript
if (GPSService.isTracking) {
  console.log('Currently tracking');
}
```

### Calculate Distance
```javascript
const distance = GPSService.calculateDistance(
  -13.9626, 33.7741, // From coordinates
  -15.3875, 28.2883  // To coordinates
);
console.log(distance + ' km');
```

### Get Location Name
```javascript
GPSService.getLocationName(-13.9626, 33.7741).then(name => {
  console.log('Location:', name);
});
```

---

## 11. Offline Service

### Initialize
```javascript
OfflineService.init();
```

### Check Online Status
```javascript
if (OfflineService.isOnline) {
  console.log('Online');
} else {
  console.log('Offline');
}
```

### Cache Data
```javascript
OfflineService.cacheData('/api/projects', projectsData);
```

### Get Cached Data
```javascript
OfflineService.getCachedData('/api/projects').then(data => {
  console.log('Cached data:', data);
});
```

### Queue Request
```javascript
OfflineService.queueRequest('POST', '/api/projects', projectData);
```

### Clear Cache
```javascript
OfflineService.clearCache();
```

### Check Storage Usage
```javascript
OfflineService.getStorageUsage();
```

---

## 12. Sync Service

### Initialize
```javascript
SyncService.init();
```

### Add to Sync Queue
```javascript
SyncService.enqueue('create', 'projects', {
  name: 'New Project',
  description: 'Project description'
});
```

### Manual Sync
```javascript
SyncService.syncNow();
```

### Get Queue Status
```javascript
const status = SyncService.getStatus();
console.log('Online:', status.isOnline);
console.log('Syncing:', status.isSyncing);
console.log('Pending:', status.queueLength);
```

### Get Queue Items
```javascript
const queue = SyncService.getQueue();
console.log('Pending operations:', queue);
```

### Clear Queue
```javascript
SyncService.clearQueue();
```

---

## 13. Global UI Functions

### Toggle Sidebar
```javascript
toggleSidebar();
```

### Load Page
```javascript
loadPage('dashboard');
loadPage('projects');
loadPage('equipment');
loadPage('commitments');
```

### Switch Tab
```javascript
switchTab(element, 'commitments-list');
```

### Filter Table
```javascript
filterTable('status', 'Approved');
filterTable('vendor', 'Malawi Cement Company');
```

### Create Commitment
```javascript
createCommitment();
```

### View Commitment
```javascript
viewCommitment('CNT-2024-001');
```

### Close Modal
```javascript
closeModal();
```

---

## 14. Modal Management

### Open Modal
```javascript
ModalManager.open('my-modal');
```

### Close Modal
```javascript
ModalManager.close('my-modal');
```

### Close All Modals
```javascript
ModalManager.closeAll();
```

### Create Dynamic Modal
```javascript
ModalManager.create('Modal Title', '<p>Modal content</p>', {
  onClose: () => console.log('Modal closed')
});
```

---

## 15. Application Flow

### Page Load Sequence
1. App.init()
2. Router.init()
3. setupEventListeners()
4. NotificationManager.init()
5. initializeModules()
6. Module-specific init()

### Data Flow
1. UI Interaction
2. Module Method Called
3. AjaxHandler.post/get/put/delete()
4. API Response
5. OfflineService queues if offline
6. SyncService syncs when online
7. UI Updated

### Offline Flow
1. App goes offline
2. OfflineService caches data
3. SyncService queues operations
4. App goes back online
5. SyncService processes queue
6. Data synchronized

---

## 16. Error Handling

### Try/Catch Pattern
```javascript
try {
  await AjaxHandler.post('/api/endpoint', data);
  NotificationComponent.success('Success!');
} catch (error) {
  NotificationComponent.error(error.message);
  console.error('Error:', error);
}
```

### Promise Pattern
```javascript
AjaxHandler.post('/api/endpoint', data)
  .then(response => {
    NotificationComponent.success('Success!');
  })
  .catch(error => {
    NotificationComponent.error('Failed to save');
  });
```

---

## 17. Common Patterns

### Load Data and Display
```javascript
// In module
loadData() {
  this.data = [/* data from API */];
  this.display();
}

display() {
  const html = this.data.map(item => {
    return `<div>${item.name}</div>`;
  }).join('');
  document.getElementById('container').innerHTML = html;
}
```

### Modal Interactions
```javascript
// Create modal
const modal = document.createElement('div');
modal.id = 'my-modal';
modal.className = 'modal-overlay';
modal.innerHTML = `<div class="modal">...</div>`;
document.body.appendChild(modal);

// Open modal
modal.classList.add('show');

// Close modal
modal.classList.remove('show');
```

### Event Delegation
```javascript
document.addEventListener('click', (e) => {
  const button = e.target.closest('button.save');
  if (button) {
    // Handle click
  }
});
```

---

## 18. Data Storage

### LocalStorage
```javascript
// Save
localStorage.setItem('key', JSON.stringify(data));

// Get
const data = JSON.parse(localStorage.getItem('key'));

// Remove
localStorage.removeItem('key');

// Clear all
localStorage.clear();
```

### IndexedDB (Offline Service)
```javascript
OfflineService.cacheData('/api/endpoint', data);
OfflineService.getCachedData('/api/endpoint').then(data => {
  // Use cached data
});
```

---

## 19. API Integration

### Make Request
```javascript
AjaxHandler.get('/api/v1/projects')
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

### POST Data
```javascript
AjaxHandler.post('/api/v1/projects', {
  name: 'New Project',
  description: 'Description'
}).then(response => {
  NotificationComponent.success('Created!');
});
```

### Update Data
```javascript
AjaxHandler.put('/api/v1/projects/123', {
  name: 'Updated Name'
});
```

### Delete Data
```javascript
AjaxHandler.delete('/api/v1/projects/123');
```

---

## 20. Debugging

### Enable Console Logging
```javascript
// All modules log to console
console.log('Check browser console for debugging');
```

### Check Module State
```javascript
console.log('Projects:', ProjectsModule.projects);
console.log('Sync Queue:', SyncService.getQueue());
console.log('Online:', OfflineService.isOnline);
console.log('GPS:', GPSService.currentLocation);
```

### Monitor Network
```javascript
// Check Network tab in DevTools
// See all API calls and responses
```

---

**For more information, see JAVASCRIPT_IMPLEMENTATION.md**
