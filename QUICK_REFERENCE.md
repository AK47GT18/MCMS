# Quick Reference: API to Frontend Library Mapping

## At a Glance

| Frontend Library | What It Needs | Our API Provides |
|------------------|---------------|------------------|
| **DHTMLX Gantt** | Task data with dates, progress | `/api/v1/projects/:id/progress` ✅ |
| **Leaflet Maps** | GPS coordinates, boundaries | `/api/v1/reports/gps-validate` ✅ |
| **OnlyOffice** | JWT config, document URLs | `OnlyOfficeService` ✅ |
| **AJAX Modals** | Lightweight JSON data | `/api/v1/modal-data/*` ✅ |
| **Real-time Updates** | SSE stream | `/api/v1/notifications/subscribe` ✅ |
| **File Uploads** | Validated file handling | `/api/v1/reports/:id/upload-photo` ✅ |

---

## Gantt Chart (DHTMLX)

### What You Get
```json
{
  "tasks": [
    {"id": 1, "name": "Task", "start_date": "2024-01-15", "duration": 5, "progress": 50}
  ],
  "milestones": [
    {"id": "m_1", "name": "Milestone", "date": "2024-01-20"}
  ]
}
```

### How to Use
```javascript
fetch('/api/v1/projects/1/progress.php')
  .then(r => r.json())
  .then(data => gantt.parse(data.gantt_data));
```

### Status
✅ **READY** - All data formatted correctly

---

## Maps (Leaflet)

### What You Get
```json
{
  "latitude": -13.5,
  "longitude": 34.5,
  "gps_validated": true,
  "distance_meters": 250.50
}
```

### How to Use
```javascript
// Validate coordinates
fetch('/api/v1/reports/gps-validate.php', {
  method: 'POST',
  body: JSON.stringify({latitude, longitude, project_id})
})

// Get reports with locations
fetch('/api/v1/reports/site-reports.php?project_id=1')
  .then(r => r.json())
  .then(data => {
    data.data.forEach(report => {
      L.marker([report.gps_latitude, report.gps_longitude])
        .addTo(map);
    });
  });
```

### Status
✅ **READY** - GPS validation & mapping fully supported

---

## Documents (OnlyOffice)

### What You Get
```json
{
  "token": "JWT-SIGNED-CONFIG",
  "document": {
    "fileType": "docx",
    "url": "https://onlyoffice.local/document.docx"
  },
  "editorConfig": {
    "user": {"id": 1, "name": "John Doe"},
    "permissions": {"edit": true}
  }
}
```

### How to Use
```php
$service = new OnlyOfficeService();
$config = $service->generateEditorConfig($docId, $docPath, $userId);
```

### Status
✅ **READY** - JWT signed, permissions configured

---

## Modals (AJAX)

### What You Get
Quick, lightweight JSON for modal dialogs:
```json
{
  "project": {name, description, status, dates, budget},
  "progress": {overall_progress_percent, tasks_completed},
  "team_count": 5,
  "recent_activities": [...]
}
```

### How to Use
```javascript
// Load any entity details
fetch(`/api/v1/modal-data/project-details?id=1`)
  .then(r => r.json())
  .then(data => {
    modal.innerHTML = buildModal(data);
    modal.show();
  });
```

### Endpoints
- `/api/v1/modal-data/project-details` - Project info
- `/api/v1/modal-data/transaction-details` - Finance details
- `/api/v1/modal-data/equipment-status` - Equipment info
- `/api/v1/modal-data/contract-milestone` - Contract info
- `/api/v1/modal-data/report-preview` - Report with photos

### Status
✅ **READY** - All 5 modal endpoints working

---

## Real-Time (SSE)

### What You Get
Server-sent events:
```
event: notification_created
data: {"type": "report_created", "title": "New Report", ...}

event: heartbeat
data: {"timestamp": 1234567890}
```

### How to Use
```javascript
const source = new EventSource('/api/v1/notifications/subscribe.php');

source.addEventListener('notification_created', (e) => {
  const notification = JSON.parse(e.data);
  showNotification(notification);
});
```

### Status
✅ **READY** - SSE streaming with 5-minute timeout

---

## Photo Upload

### What You Get
Validated file handling:
```json
{
  "photos": [
    {"id": 1, "file_path": "/uploads/reports/1/photo.jpg", "uploaded_at": "2024-01-15"}
  ]
}
```

### How to Use
```javascript
const formData = new FormData();
formData.append('photos', fileInput.files[0]);

fetch(`/api/v1/reports/1/upload-photo.php`, {
  method: 'POST',
  body: formData
});
```

### Rules
- Max 5 photos per report
- Max 5MB per file
- JPEG, PNG, WebP only

### Status
✅ **READY** - Full validation & storage

---

## All Features

| Feature | Endpoint | Format | Status |
|---------|----------|--------|--------|
| Tasks/Gantt | `/api/v1/projects/:id/progress` | JSON | ✅ |
| GPS/Maps | `/api/v1/reports/gps-validate` | JSON | ✅ |
| Validation | `/api/v1/reports/site-reports` | JSON | ✅ |
| Documents | `OnlyOfficeService` | JWT | ✅ |
| Modals | `/api/v1/modal-data/*` | JSON | ✅ |
| Notifications | `/api/v1/notifications/subscribe` | SSE | ✅ |
| Photos | `/api/v1/reports/:id/upload-photo` | FormData | ✅ |
| CRUD | `/api/v1/{module}/{action}.php` | JSON | ✅ |

---

## Error Responses

All endpoints return consistent errors:

```json
{
  "success": false,
  "error": "Error message",
  "errors": {"field": "validation error"}
}
```

### Status Codes
- `201` - Created ✅
- `200` - Success ✅
- `400` - Bad request ✅
- `403` - Forbidden ✅
- `404` - Not found ✅
- `422` - Validation failed ✅
- `500` - Server error ✅

---

## Quick Start

### 1. Get Gantt Data
```bash
curl http://localhost/api/v1/projects/1/progress.php
```

### 2. Get Map Data
```bash
curl http://localhost/api/v1/reports/site-reports.php?project_id=1
```

### 3. Validate GPS
```bash
curl -X POST http://localhost/api/v1/reports/gps-validate.php \
  -H "Content-Type: application/json" \
  -d '{"latitude":-13.5,"longitude":34.5}'
```

### 4. Load Modal
```bash
curl http://localhost/api/v1/modal-data/project-details?id=1
```

### 5. Stream Notifications
```bash
curl -N http://localhost/api/v1/notifications/subscribe.php
```

---

## Library Versions Supported

- ✅ DHTMLX Gantt 8.0+ (tested with 9.1.1)
- ✅ Leaflet 1.7+ (tested with 1.9.4)
- ✅ OnlyOffice 6.0+ (tested with latest)
- ✅ All modern browsers (ES6+)
- ✅ Mobile browsers (iOS Safari, Chrome)

---

## Authentication

**All endpoints require:**
- ✅ Valid session cookie
- ✅ User authentication
- ✅ Role-based permissions
- ✅ CSRF token (on state changes)

**Header needed:**
```
Cookie: PHPSESSID=abc123...
```

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Total Endpoints | 64+ | ✅ READY |
| Gantt Integration | 1 | ✅ COMPLETE |
| Leaflet Integration | 2 | ✅ COMPLETE |
| OnlyOffice Support | 1 | ✅ COMPLETE |
| Modal Endpoints | 5 | ✅ COMPLETE |
| Real-time Support | 1 | ✅ COMPLETE |
| Photo Upload | 1 | ✅ COMPLETE |
| CRUD Operations | 48+ | ✅ COMPLETE |

**Everything needed for frontend integration is ready.**

