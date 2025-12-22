# Frontend Integration Guide

Complete examples for integrating each frontend library with the MCMS APIs.

---

## 1. DHTMLX Gantt Chart Integration

### HTML Setup
```html
<div id="gantt_here" class="gantt-container"></div>
```

### JavaScript Integration
```javascript
// Load the progress endpoint
async function initGantt(projectId) {
    // Load Gantt styles & scripts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/dhtmlx-gantt/9.1.1/dhtmlxgantt.min.css';
    document.head.appendChild(link);
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dhtmlx-gantt/9.1.1/dhtmlxgantt.min.js';
    script.onload = async () => {
        // Configure Gantt
        gantt.config.date_format = "%Y-%m-%d";
        gantt.config.readonly = false;
        gantt.config.show_progress = true;
        
        // Fetch data from API
        const response = await fetch(`/api/v1/projects/${projectId}/progress.php`);
        const data = await response.json();
        
        // Format for Gantt
        const ganttData = {
            data: data.tasks.map(task => ({
                id: task.id,
                text: task.name,
                start_date: new Date(task.start_date),
                duration: Math.ceil((new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60 * 24)),
                progress: task.progress / 100,
                type: task.status === 'completed' ? 'project' : 'task',
                parent: task.parent_id || 0,
                open: true
            })),
            links: []
        };
        
        // Add milestones
        if (data.milestones && data.milestones.length > 0) {
            ganttData.data.push(...data.milestones.map(m => ({
                id: m.id,
                text: m.name,
                type: 'milestone',
                start_date: new Date(m.date),
                duration: 1,
                parent: 0
            })));
        }
        
        // Initialize Gantt
        gantt.init("gantt_here", new Date(data.project.start_date), gantt.config.scales);
        gantt.parse(ganttData);
        
        // Handle task updates
        gantt.attachEvent("onAfterTaskUpdate", (id, item) => {
            updateTask(projectId, id, item);
        });
    };
    document.head.appendChild(script);
}

// Call on page load
initGantt(document.querySelector('[data-project-id]').dataset.projectId);
```

### API Response Format
```json
{
  "success": true,
  "project": {
    "id": 1,
    "name": "Build Foundation",
    "start_date": "2024-01-15",
    "end_date": "2024-06-30"
  },
  "tasks": [
    {
      "id": 1,
      "name": "Excavation",
      "start_date": "2024-01-15",
      "end_date": "2024-02-01",
      "progress_percent": 75,
      "status": "in_progress",
      "priority": "high",
      "assigned_user_name": "John Doe"
    }
  ],
  "milestones": [
    {
      "id": "m_1",
      "name": "Foundation Complete",
      "date": "2024-02-15",
      "type": "milestone",
      "contract_name": "Foundation Work"
    }
  ]
}
```

---

## 2. Leaflet Map Integration

### HTML Setup
```html
<div id="map" style="height: 600px;"></div>
```

### JavaScript Integration
```javascript
// Initialize map
const map = L.map('map').setView([-13.5, 34.5], 10);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Fetch reports with GPS data
async function loadReports(projectId) {
    const response = await fetch(`/api/v1/reports/site-reports.php?project_id=${projectId}`);
    const data = await response.json();
    
    // Add report markers
    data.data.forEach(report => {
        if (report.gps_latitude && report.gps_longitude) {
            // Determine marker color based on validation
            const markerColor = report.gps_validated ? 'green' : 'red';
            
            L.circleMarker([report.gps_latitude, report.gps_longitude], {
                radius: 6,
                fillColor: markerColor,
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(`
                <strong>${report.title}</strong><br/>
                Type: ${report.report_type}<br/>
                Created: ${new Date(report.created_at).toLocaleDateString()}<br/>
                Photos: ${report.photo_count}<br/>
                ${report.gps_validated ? '✓ GPS Validated' : '✗ GPS Not Validated'}
            `).addTo(map);
        }
    });
}

// Validate GPS coordinates before upload
async function validateGPS(latitude, longitude, projectId) {
    const response = await fetch('/api/v1/reports/gps-validate.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            latitude: latitude,
            longitude: longitude,
            project_id: projectId,
            radius: 500 // 500 meters
        })
    });
    
    const data = await response.json();
    
    if (data.valid) {
        if (data.within_boundaries) {
            console.log(`✓ Within project boundaries (${data.distance_meters}m)`);
        } else {
            console.warn(`⚠ Outside project boundaries (${data.distance_meters}m)`);
        }
    } else {
        console.error('✗ Invalid coordinates for Malawi');
    }
    
    return data;
}

// Load on page load
const projectId = document.querySelector('[data-project-id]')?.dataset.projectId;
if (projectId) {
    loadReports(projectId);
}
```

### Project Site Boundaries (Optional)
```javascript
// Get project details with site location
async function drawProjectBoundary(projectId) {
    const response = await fetch(`/api/v1/modal-data/project-details?id=${projectId}`);
    const data = await response.json();
    
    const project = data.project;
    
    // Draw circle representing project site (500m radius)
    if (project.site_latitude && project.site_longitude) {
        L.circle([project.site_latitude, project.site_longitude], {
            color: 'blue',
            fillColor: 'lightblue',
            fillOpacity: 0.2,
            radius: 500,
            weight: 2
        }).bindPopup(project.name).addTo(map);
        
        // Center map on project
        map.setView([project.site_latitude, project.site_longitude], 13);
    }
}
```

---

## 3. OnlyOffice Document Integration

### HTML Setup
```html
<div id="onlyoffice-editor"></div>
```

### JavaScript Integration
```javascript
// Get document editor configuration from backend
async function initOnlyOffice(contractId, documentPath) {
    // Call backend to get editor config with JWT
    const response = await fetch('/api/v1/contracts/get-document-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contract_id: contractId,
            document_path: documentPath
        })
    });
    
    const config = await response.json();
    
    // Load OnlyOffice JS
    const script = document.createElement('script');
    script.src = 'https://onlyoffice.example.com/web-apps/apps/api/documents/api.js';
    script.onload = () => {
        // Create editor with JWT-signed config
        new DocsAPI.DocEditor('onlyoffice-editor', config);
    };
    document.head.appendChild(script);
}

// Example: Open contract document
initOnlyOffice(1, '/uploads/contracts/contract-001.docx');
```

### Backend Configuration (PHP)
```php
// In service layer
$onlyOfficeService = new OnlyOfficeService();
$config = $onlyOfficeService->generateEditorConfig(
    $contractId,
    $documentPath,
    Authentication::user()['id']
);

return json_encode($config);
```

---

## 4. Real-Time Notifications (SSE)

### JavaScript Integration
```javascript
// Connect to notification stream
function connectToNotifications() {
    const eventSource = new EventSource('/api/v1/notifications/subscribe.php');
    
    eventSource.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        console.log('Connected to notification stream', data);
    });
    
    eventSource.addEventListener('notification_created', (e) => {
        const notification = JSON.parse(e.data);
        
        // Show toast notification
        showNotification(notification.title, notification.message, notification.type);
        
        // Update badge count
        updateNotificationBadge();
        
        // Optional: Open modal for certain types
        if (notification.related_entity === 'report') {
            openReportModal(notification.related_entity_id);
        }
    });
    
    eventSource.addEventListener('error', (e) => {
        console.error('Notification stream error', e);
        // Attempt reconnect after 5 seconds
        setTimeout(connectToNotifications, 5000);
    });
    
    eventSource.addEventListener('connection_closed', (e) => {
        console.log('Notification stream closed');
        // Reconnect
        setTimeout(connectToNotifications, 2000);
    });
}

// Start listening on page load
document.addEventListener('DOMContentLoaded', connectToNotifications);
```

---

## 5. Modal Data for AJAX Dialogs

### Modal Trigger
```html
<button class="btn-view-details" data-entity="project" data-id="1">
    View Details
</button>
```

### JavaScript Modal Handler
```javascript
// Generic modal loader
class ModalLoader {
    constructor() {
        this.modal = document.querySelector('.modal');
        this.attachListeners();
    }
    
    attachListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-view-details')) {
                const entity = e.target.dataset.entity;
                const id = e.target.dataset.id;
                this.load(entity, id);
            }
        });
    }
    
    async load(entity, id) {
        try {
            const response = await fetch(`/api/v1/modal-data/${entity}-details?id=${id}`);
            const data = await response.json();
            
            if (data.success) {
                this.render(entity, data);
            }
        } catch (error) {
            console.error('Failed to load modal data:', error);
        }
    }
    
    render(entity, data) {
        const content = this.buildContent(entity, data);
        this.modal.innerHTML = content;
        this.modal.classList.add('active');
    }
    
    buildContent(entity, data) {
        switch(entity) {
            case 'project':
                return this.buildProjectModal(data);
            case 'transaction':
                return this.buildTransactionModal(data);
            case 'equipment':
                return this.buildEquipmentModal(data);
            case 'contract':
                return this.buildContractModal(data);
            case 'report':
                return this.buildReportModal(data);
        }
    }
    
    buildProjectModal(data) {
        const p = data.project;
        return `
            <div class="modal-header">
                <h2>${p.name}</h2>
                <button class="close">×</button>
            </div>
            <div class="modal-body">
                <p>${p.description}</p>
                <div class="project-meta">
                    <span>Status: <strong>${p.status}</strong></span>
                    <span>Start: ${p.start_date}</span>
                    <span>End: ${p.end_date}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${data.progress.overall_progress_percent}%"></div>
                </div>
                <p>Progress: ${data.progress.overall_progress_percent}% 
                   (${data.progress.completed_tasks}/${data.progress.total_tasks} tasks)</p>
            </div>
        `;
    }
    
    buildEquipmentModal(data) {
        const e = data.equipment;
        return `
            <div class="modal-header">
                <h2>${e.name}</h2>
                <button class="close">×</button>
            </div>
            <div class="modal-body">
                <table class="equipment-table">
                    <tr><td>Type:</td><td>${e.equipment_type}</td></tr>
                    <tr><td>Serial:</td><td>${e.serial_number}</td></tr>
                    <tr><td>Status:</td><td><span class="badge ${e.status}">${e.status}</span></td></tr>
                    <tr><td>Purchase Cost:</td><td>$${e.purchase_cost}</td></tr>
                </table>
                
                ${data.current_location ? `
                    <div class="current-location">
                        <h4>Current Location</h4>
                        <p>${data.current_location.user_name}</p>
                        <p>Expected Return: ${data.current_location.expected_return}</p>
                    </div>
                ` : ''}
                
                <h4>Maintenance History</h4>
                <ul class="maintenance-list">
                    ${data.maintenance_history.map(m => `
                        <li>${m.date}: ${m.type} - $${m.cost}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ModalLoader();
});
```

---

## 6. Photo Upload with Validation

### HTML Form
```html
<form id="report-form" enctype="multipart/form-data">
    <input type="hidden" name="report_id" value="1">
    <div class="form-group">
        <label>Photos (Max 5, 5MB each)</label>
        <input type="file" name="photos" multiple accept="image/*" required>
        <small>Supported: JPEG, PNG, WebP</small>
    </div>
    <button type="submit">Upload</button>
</form>
```

### JavaScript Handler
```javascript
document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(this);
    const reportId = formData.get('report_id');
    
    // Validate files
    const files = formData.getAll('photos');
    if (files.length > 5) {
        alert('Maximum 5 photos allowed');
        return;
    }
    
    for (let file of files) {
        if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} exceeds 5MB limit`);
            return;
        }
        
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert(`${file.name} must be JPEG, PNG, or WebP`);
            return;
        }
    }
    
    // Upload
    try {
        const response = await fetch(`/api/v1/reports/${reportId}/upload-photo.php`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`${data.photos.length} photo(s) uploaded successfully`);
            this.reset();
            
            // Reload report preview
            loadReportPreview(reportId);
        } else {
            alert('Upload failed: ' + data.error);
        }
    } catch (error) {
        console.error('Upload error:', error);
    }
});

// Load and display uploaded photos
async function loadReportPreview(reportId) {
    const response = await fetch(`/api/v1/modal-data/report-preview?id=${reportId}`);
    const data = await response.json();
    
    const photoContainer = document.querySelector('.photo-gallery');
    photoContainer.innerHTML = data.photos.map(photo => `
        <div class="photo-item">
            <img src="${photo.file_path}" alt="Report photo">
            <p>${photo.description || 'No description'}</p>
        </div>
    `).join('');
}
```

---

## 7. Finance Approval Workflow

### List Transactions
```javascript
async function loadPendingTransactions() {
    const response = await fetch('/api/v1/finance/transactions.php?status=pending&per_page=50');
    const data = await response.json();
    
    const table = document.querySelector('.transactions-table tbody');
    table.innerHTML = data.data.map(t => `
        <tr>
            <td>${t.description}</td>
            <td>$${t.amount.toFixed(2)}</td>
            <td>${t.category}</td>
            <td><span class="badge">${t.status}</span></td>
            <td>
                <button onclick="approveTransaction(${t.id})">Approve</button>
                <button onclick="rejectTransaction(${t.id})">Reject</button>
            </td>
        </tr>
    `).join('');
}

// Approve transaction
async function approveTransaction(transactionId) {
    const response = await fetch(`/api/v1/finance/approve.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transaction_id: transactionId,
            notes: 'Approved'
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert('Transaction approved');
        loadPendingTransactions(); // Reload list
    }
}

// Reject transaction
async function rejectTransaction(transactionId) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    const response = await fetch(`/api/v1/finance/reject.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transaction_id: transactionId,
            rejection_reason: reason
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert('Transaction rejected');
        loadPendingTransactions(); // Reload list
    }
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadPendingTransactions);
```

---

## 8. Equipment Checkout/Checkin

### Checkout Form
```html
<form id="checkout-form">
    <div class="form-group">
        <label>User</label>
        <select name="user_id" required>
            <option value="">Select user...</option>
            <!-- Populated from API -->
        </select>
    </div>
    <div class="form-group">
        <label>Checkout Date</label>
        <input type="date" name="checkout_date" value="2024-01-15" required>
    </div>
    <div class="form-group">
        <label>Expected Return Date</label>
        <input type="date" name="expected_return_date" required>
    </div>
    <button type="submit">Checkout</button>
</form>
```

### JavaScript Handler
```javascript
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const equipmentId = document.querySelector('[data-equipment-id]').dataset.equipmentId;
    const formData = new FormData(this);
    
    const response = await fetch(`/api/v1/equipment/${equipmentId}/checkout.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert('Equipment checked out successfully');
        // Update equipment status display
        loadEquipmentStatus(equipmentId);
    } else {
        alert('Checkout failed: ' + data.error);
    }
});

// Checkin handler
async function checkinEquipment(equipmentId) {
    const condition = prompt('Equipment condition (good/fair/damaged/non-functional):');
    if (!condition) return;
    
    const response = await fetch(`/api/v1/equipment/${equipmentId}/checkin.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            checkin_date: new Date().toISOString().split('T')[0],
            condition: condition,
            notes: prompt('Additional notes (optional):')
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert('Equipment checked in successfully');
        loadEquipmentStatus(equipmentId);
    }
}
```

---

## 9. Data Tables with Pagination

### HTML Table
```html
<table class="data-table">
    <thead>
        <tr>
            <th>Name <span class="sort-icon">↕</span></th>
            <th>Status <span class="sort-icon">↕</span></th>
            <th>Date <span class="sort-icon">↕</span></th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody id="table-body"></tbody>
</table>

<nav class="pagination">
    <button id="prev-page" disabled>Previous</button>
    <span id="page-info">Page 1</span>
    <button id="next-page">Next</button>
</nav>
```

### JavaScript Pagination
```javascript
class DataTable {
    constructor(endpoint, tableSelector, pageSize = 20) {
        this.endpoint = endpoint;
        this.tableBody = document.querySelector(tableSelector);
        this.pageSize = pageSize;
        this.currentPage = 1;
        this.totalPages = 1;
        this.loadPage(1);
    }
    
    async loadPage(page) {
        const response = await fetch(`${this.endpoint}?page=${page}&per_page=${this.pageSize}`);
        const data = await response.json();
        
        this.currentPage = page;
        this.totalPages = data.pagination.total_pages;
        
        this.render(data.data);
        this.updatePagination();
    }
    
    render(items) {
        this.tableBody.innerHTML = items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td><span class="badge">${item.status}</span></td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td>
                    <button onclick="viewDetails('${item.id}')">View</button>
                    <button onclick="editItem('${item.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }
    
    updatePagination() {
        document.getElementById('page-info').textContent = 
            `Page ${this.currentPage} of ${this.totalPages}`;
        
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('prev-page').onclick = () => 
            this.loadPage(this.currentPage - 1);
        
        document.getElementById('next-page').disabled = 
            this.currentPage >= this.totalPages;
        document.getElementById('next-page').onclick = () => 
            this.loadPage(this.currentPage + 1);
    }
}

// Initialize
const projectsTable = new DataTable('/api/v1/projects', '#table-body');
```

---

## Complete Integration Example

### Full Dashboard Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>MCMS Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>
    <!-- Real-time Notifications -->
    <div id="notification-badge" class="notification-badge">0</div>
    
    <!-- Map Section -->
    <section class="section-map">
        <h2>Project Sites</h2>
        <div id="map" style="height: 500px;"></div>
    </section>
    
    <!-- Gantt Section -->
    <section class="section-gantt">
        <h2>Project Timeline</h2>
        <div id="gantt_here" class="gantt-container"></div>
    </section>
    
    <!-- Projects Table -->
    <section class="section-table">
        <h2>Projects</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="projects-table"></tbody>
        </table>
    </section>
    
    <!-- Modal -->
    <div id="modal" class="modal"></div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <script src="/js/integrations/gantt.js"></script>
    <script src="/js/integrations/map.js"></script>
    <script src="/js/integrations/modals.js"></script>
    <script src="/js/integrations/notifications.js"></script>
    <script src="/js/app.js"></script>
</body>
</html>
```

---

## Summary

All APIs are production-ready for integration with:
- ✅ DHTMLX Gantt 9.1+
- ✅ Leaflet 1.9+
- ✅ OnlyOffice Document Server
- ✅ Modern browsers with ES6+
- ✅ Mobile-responsive layouts

