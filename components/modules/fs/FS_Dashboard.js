import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';

export const FS_Dashboard = {
    getDashboardView() {
        const inventoryEntries = Object.entries(this.siteInventory);
        const lowStock = inventoryEntries.some(([, i]) => i.qty === 0);
        const inTransitCount = this.siteAssets.filter(a => a.status === 'in_transit').length;
        const isCompleted = this.assignedProject?.status === 'completed';

        return `
            ${isCompleted ? `
                <div style="background: #FFFBEB; border: 1px solid #FEF3C7; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 40px; height: 40px; background: #FEF3C7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #D97706; flex-shrink: 0;">
                        <i class="fas fa-clock-rotate-left"></i>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 14px; color: #92400E;">Grace Period Active</div>
                        <div style="font-size: 12px; color: #B45309;">This project is marked as COMPLETED. You have a 48-hour grace period to finalize site logs and return excess inventory.</div>
                    </div>
                </div>
            ` : ''}
            <div class="stats-grid">
               <div class="stat-card" style="cursor: pointer;" onclick="window.app.fsModule.switchView('logistics')">
                  <div class="stat-header"><span class="stat-label" style="color: var(--blue);">Site Stock</span><i class="fas fa-cubes" style="color: var(--blue);"></i></div>
                  <div class="stat-value">${inventoryEntries.length}</div>
                  <div class="stat-sub">Tracked materials</div>
               </div>
               <div class="stat-card" style="cursor: pointer;" onclick="window.app.fsModule.switchView('logistics')">
                  <div class="stat-header"><span class="stat-label" style="color: ${lowStock ? 'var(--red)' : 'var(--emerald)'};">Stock Health</span><i class="fas fa-${lowStock ? 'exclamation-triangle' : 'check-circle'}" style="color: ${lowStock ? 'var(--red)' : 'var(--emerald)'};"></i></div>
                  <div class="stat-value" style="font-size: 16px;">${lowStock ? 'Stock Alert' : 'Healthy'}</div>
                  <div class="stat-sub">${lowStock ? 'Depleted materials detected' : 'All resources on hand'}</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Site Equipment</span><i class="fas fa-truck-monster" style="color: var(--blue);"></i></div>
                  <div class="stat-value">${this.siteAssets.length}</div>
                  <div class="stat-sub">Assigned to site</div>
               </div>
               <div class="stat-card" style="border-color: var(--emerald-light); background: #f0fdf4;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--emerald);">Site Logs</span><i class="fas fa-clipboard-check" style="color: var(--emerald);"></i></div>
                  <div class="stat-value">${this.dailyLogsCount}</div>
                  <div class="stat-sub">Submitted Today</div>
               </div>
            </div>

            <div class="stats-grid action-tiles" style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                <div class="stat-card" style="border: 1px solid var(--slate-200); cursor: pointer;" 
                    onclick="window.app.fsModule.switchView('daily_progress')">
                    <div style="color: var(--orange); margin-bottom: 12px; font-size: 20px;"><i class="fas fa-clipboard-check"></i></div>
                    <div style="font-weight: 800; font-size: 13px;">Daily Progress</div>
                </div>
                <div class="stat-card" style="border: 1px solid var(--slate-200); ${isCompleted ? 'opacity: 0.6; cursor: not-allowed;' : 'cursor: pointer;'}" 
                    onclick="${isCompleted ? "window.toast.show('New requests are disabled for completed projects.', 'warning')" : "window.app.fsModule.openResourceRequestDrawer()"}">
                    <div style="color: var(--blue); margin-bottom: 12px; font-size: 20px;"><i class="fas fa-plus-circle"></i></div>
                    <div style="font-weight: 800; font-size: 13px;">Request</div>
                </div>
                <div class="stat-card" style="border: 1px solid var(--slate-200); cursor: pointer;" onclick="window.app.fsModule.switchView('reporting')">
                    <div style="color: var(--red); margin-bottom: 12px; font-size: 20px;"><i class="fas fa-helmet-safety"></i></div>
                    <div style="font-weight: 800; font-size: 13px;">Safety & Issues</div>
                </div>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 24px;">
                <div class="data-card">
                    <div class="data-card-header"><div class="card-title">Live Site Activity</div></div>
                    <div style="padding: 24px;">
                        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                            <div style="flex: 1; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Current Workstation</div>
                                <div style="font-size: 14px; font-weight: 800; margin-top: 4px;">${this.assignedProject?.name || 'Loading…'}</div>
                            </div>
                            <div style="flex: 1; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Project Status</div>
                                <div style="font-size: 14px; font-weight: 800; margin-top: 4px; color: ${isCompleted ? 'var(--emerald)' : 'var(--blue)'};">${(this.assignedProject?.status || 'Loading').toUpperCase()}</div>
                            </div>
                        </div>
                        <div style="height: 12px; background: var(--slate-100); border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
                            <div style="width: ${this.assignedProject?.progress || 0}%; background: var(--emerald); height: 100%; transition: width 0.5s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--slate-500);">
                            <span>Execution Progress</span>
                            <span>${this.assignedProject?.progress || 0}% Complete</span>
                        </div>
                    </div>
                </div>

                <div class="data-card ${this.isExpanded ? 'expanded-map-card' : ''}" id="map-card">
                    <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="card-title">Project Work Zone (Geofence)</div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="window.app.fsModule.panToSiteLocation()" title="Center on Site">
                                <i class="fas fa-crosshairs" style="color: var(--emerald)"></i> Site
                            </button>
                            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="window.app.fsModule.panToUserLocation()" title="Center on My Location">
                                <i class="fas fa-street-view" style="color: var(--blue)"></i> Me
                            </button>
                             <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="window.app.fsModule.toggleAutoTrack()">
                                <i class="fas fa-location-arrow" style="color: ${this.isTracking ? 'var(--blue)' : 'inherit'}"></i> ${this.isTracking ? 'Tracking' : 'Follow'}
                            </button>
                            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="window.app.fsModule.toggleMapExpand()">
                                <i class="fas fa-${this.isExpanded ? 'compress' : 'expand-alt'}"></i>
                            </button>
                        </div>
                    </div>
                    <div id="fs-geofence-map" style="height: ${this.isExpanded ? '600px' : '350px'}; transition: height 0.3s ease; background: var(--slate-100); position: relative; z-index: 1;">
                        <div id="map-loading-overlay" style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--slate-500);">
                            <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Initializing Map...
                        </div>
                        <div id="map-sync-overlay" style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 900; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; gap: 12px; display: none;">
                            <i class="fas fa-satellite-dish fa-spin" style="font-size: 32px;"></i>
                            <div style="font-weight: 700; font-size: 14px;">Syncing High-Precision GPS...</div>
                            <div style="font-size: 11px; opacity: 0.8;">Refining coordinates (8s window)</div>
                        </div>
                        <div id="distance-indicator" style="position: absolute; bottom: 10px; left: 10px; z-index: 1000; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; display: none;">
                            Distance to Site: <span id="site-distance-val">--</span>
                        </div>
                    </div>
                    <div style="padding: 12px; font-size: 11px; color: var(--slate-500); display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span id="gps-status-badge" style="padding: 4px 8px; background: var(--slate-100); border-radius: 4px; font-weight: 700; font-size: 10px; color: var(--slate-600);">
                                <i class="fas fa-satellite-dish"></i> GPS Standby
                            </span>
                            <div style="display: flex; gap: 6px;">
                                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px; color: var(--blue);" onclick="window.app.fsModule.showPCLocationGuidance()" title="PC Location Help">
                                    <i class="fas fa-question-circle"></i> Desktop Fix
                                </button>
                                <button id="btn-refresh-gps" class="btn btn-primary" style="padding: 4px 12px; font-size: 10px;" onclick="window.app.fsModule.verifyLocation()">
                                    <i class="fas fa-sync"></i> Sync Location
                                </button>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--slate-100); pt-2; margin-top: 4px; padding-top: 8px;">
                            <span><i class="fas fa-info-circle"></i> Verify location before submitting logs.</span>
                            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="window.app.fsModule.initGeofenceMap()"><i class="fas fa-undo"></i> Reset View</button>
                        </div>
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header"><div class="card-title">Quick Tasks</div></div>
                    <div style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn btn-secondary" onclick="window.drawer.open('Attendance', window.DrawerTemplates.attendanceLog)">Mark Site Attendance</button>
                        <button class="btn btn-secondary" onclick="window.app.fsModule.switchView('logistics')">View Site Inventory</button>
                        <button class="btn btn-secondary" onclick="window.app.fsModule.switchView('tasks')">View Work Orders</button>
                    </div>
                </div>
            </div>
        `;
    },

    async _loadDashboardStats() {
        try {
            const result = await client.get('/daily-logs', {
                projectId: this.assignedProject?.id,
                date: new Date().toISOString().split('T')[0]
            });
            const logs = Array.isArray(result) ? result : (result.data || []);
            this.dailyLogsCount = logs.length;
            // Update the stat counter in-place to avoid destroying the map DOM
            const statEl = document.querySelector('.stat-card .stat-value');
            if (statEl && this.currentView === 'dashboard') {
                // Find the "Site Logs" stat card and update its value
                const statCards = document.querySelectorAll('.stat-card');
                statCards.forEach(card => {
                    const label = card.querySelector('.stat-label');
                    if (label && label.textContent.trim() === 'Site Logs') {
                        const val = card.querySelector('.stat-value');
                        if (val) val.textContent = this.dailyLogsCount;
                    }
                });
            } else {
                this._refreshCurrentView();
            }
        } catch (error) {
            console.error('[FS] Failed to load dashboard stats:', error);
        }
    },

    async _loadAssignedProject() {
        try {
            console.log('[FS] Loading assigned projects...');
            const result = await client.get('/projects');
            console.log('[FS] Projects result:', result);
            const projects = Array.isArray(result) ? result : (result.projects || result.data || []);
            console.log('[FS] Found projects:', projects.length);

            // Get the first project assigned to this supervisor
            this.assignedProject = projects[0] || null;
            console.log('[FS] Assigned project:', this.assignedProject);
            
            // Re-cache requisition mapping data whenever the project is loaded/updated
            if (this.assignedProject && typeof this._cacheRequisitionData === 'function') {
                await this._cacheRequisitionData();
            }

            this._refreshCurrentView();

            // Initialize map if on dashboard
            if (this.currentView === 'dashboard') {
                setTimeout(() => this.initGeofenceMap(), 500);
            }
        } catch (error) {
            console.error('[FS] Failed to load assigned project:', error);
        }
    },

    initGeofenceMap() {
        const mapContainer = document.getElementById('fs-geofence-map');
        if (!mapContainer || !this.assignedProject) {
            console.log('[FS Map] Skipping init: container or project missing');
            return;
        }

        // Prevent duplicate initialization when map is already live on this container
        if (this.geofenceMap && mapContainer.querySelector('.leaflet-container, .leaflet-pane')) {
            console.log('[FS Map] Already initialized, skipping.');
            return;
        }

        // Clear existing map instance if any
        if (this.geofenceMap) {
            try { this.geofenceMap.remove(); } catch(e) {}
            this.geofenceMap = null;
        }

        const { lat, lng, radius, name } = this.assignedProject;
        const projectLat = parseFloat(lat);
        const projectLng = parseFloat(lng);

        if (isNaN(projectLat) || isNaN(projectLng)) {
            console.warn('[FS Map] Invalid coordinates:', lat, lng);
            mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Project coordinates not configured.</div>';
            return;
        }

        // Use the aliased Leaflet if standard L is not available or corrupted
        const Leaflet = window.MKAKA_L || window.L;
        if (!Leaflet || typeof Leaflet.map !== 'function') {
            console.error('[FS Map] Leaflet library not found or corrupted!', Leaflet);
            mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Map library failed to load.</div>';
            return;
        }

        console.log('[FS Map] Initializing for:', name, projectLat, projectLng);

        // Initialize map
        this.geofenceMap = Leaflet.map('fs-geofence-map', {
            zoomControl: false,
            attributionControl: false
        }).setView([projectLat, projectLng], 15);

        Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.geofenceMap);

        // Add Geofence Circle
        Leaflet.circle([projectLat, projectLng], {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            radius: radius || 500
        }).addTo(this.geofenceMap);

        // Add Project Marker
        Leaflet.marker([projectLat, projectLng]).addTo(this.geofenceMap)
            .bindPopup(`<b>${name}</b><br>Work Zone`)
            .openPopup();

        // Hide loading overlay
        const overlay = document.getElementById('map-loading-overlay');
        if (overlay) overlay.style.display = 'none';

        // NOTE: Auto-watching removed in favor of manual verifyLocation()
    },

    async verifyLocation() {
        if (!navigator.geolocation) {
            window.toast?.show('Geolocation not supported.', 'error');
            return;
        }

        const badge = document.getElementById('gps-status-badge');
        const btn = document.getElementById('btn-refresh-gps');
        const overlay = document.getElementById('map-sync-overlay');
        
        if (badge) badge.innerHTML = '<i class="fas fa-satellite-dish fa-spin"></i> Syncing...';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verifying...';
            btn.disabled = true;
        }
        if (overlay) overlay.style.display = 'flex';

        this.bestPosition = null;
        this.verificationStartTime = Date.now();
        
        console.log('[FS GPS] Starting 8s verification window...');

        return new Promise((resolve) => {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const elapsed = Date.now() - this.verificationStartTime;
                    console.log(`[FS GPS] Reading: ${Math.round(pos.coords.accuracy)}m (${elapsed}ms)`);
                    
                    if (!this.bestPosition || pos.coords.accuracy < this.bestPosition.coords.accuracy) {
                        this.bestPosition = pos;
                        this.updateUserPosition(pos);
                    }

                    // Early exit if we hit perfect precision
                    if (pos.coords.accuracy < 10 && elapsed > 2000) {
                        cleanup();
                    }
                },
                (err) => {
                    console.warn('[FS GPS] Watch error:', err);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );

            const timeoutId = setTimeout(cleanup, 8000);

            function cleanup() {
                navigator.geolocation.clearWatch(watchId);
                clearTimeout(timeoutId);
                
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-sync"></i> Sync Location';
                    btn.disabled = false;
                }
                if (overlay) overlay.style.display = 'none';

                if (window.app.fsModule.bestPosition) {
                    const acc = window.app.fsModule.bestPosition.coords.accuracy;
                    const status = window.app.fsModule.classifyAccuracy(acc);
                    window.toast?.show(`Location Verified: ${status.label} (±${Math.round(acc)}m)`, status.toastType);
                } else {
                    window.toast?.show('Verification failed. Check device GPS.', 'error');
                }
                resolve(window.app.fsModule.bestPosition);
            }
        });
    },

    classifyAccuracy(accuracy) {
        if (accuracy <= 25) return { label: 'Excellent', color: 'var(--emerald)', bg: 'var(--emerald-light)', toastType: 'success' };
        if (accuracy <= 75) return { label: 'Good', color: 'var(--blue)', bg: 'var(--blue-light)', toastType: 'success' };
        if (accuracy <= 150) return { label: 'Moderate', color: 'var(--amber)', bg: 'var(--amber-light)', toastType: 'success' }; // Success, but warn label
        if (accuracy <= 500) return { label: 'Poor', color: 'var(--orange)', bg: 'var(--orange-light)', toastType: 'success' }; // Success, but warn label
        return { label: 'IP-Based', color: 'var(--red)', bg: 'var(--red-light)', toastType: 'error' };
    },

    updateUserPosition(pos) {
        const { latitude, longitude, accuracy } = pos.coords;
        const Leaflet = window.MKAKA_L || window.L;
        if (!Leaflet || !this.geofenceMap) return;

        // Create or update marker
        if (!this.userMarker) {
            this.userMarker = Leaflet.circleMarker([latitude, longitude], {
                radius: 8,
                fillColor: '#3b82f6',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(this.geofenceMap).bindTooltip("You are here");
        } else {
            this.userMarker.setLatLng([latitude, longitude]);
        }

        // Create or update accuracy circle
        if (!this.accuracyCircle) {
            this.accuracyCircle = Leaflet.circle([latitude, longitude], {
                radius: accuracy,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 1
            }).addTo(this.geofenceMap);
        } else {
            this.accuracyCircle.setLatLng([latitude, longitude]);
            this.accuracyCircle.setRadius(accuracy);
        }

        // Auto-pan if tracking is enabled
        if (this.isTracking) {
            this.geofenceMap.panTo([latitude, longitude]);
        }

        // Calculate distance to site center
        const { lat, lng } = this.assignedProject;
        const dist = this.calculateDistance(latitude, longitude, parseFloat(lat), parseFloat(lng));
        
        const distEl = document.getElementById('distance-indicator');
        const valEl = document.getElementById('site-distance-val');
        if (distEl && valEl) {
            distEl.style.display = 'block';
            valEl.textContent = dist > 1000 ? (dist/1000).toFixed(2) + ' km' : Math.round(dist) + ' m';
        }

        // Update status badge
        const badge = document.getElementById('gps-status-badge');
        if (badge) {
            const status = this.classifyAccuracy(accuracy);
            badge.innerHTML = `<i class="fas fa-location-crosshairs"></i> ${status.label} Precision (±${Math.round(accuracy)}m)`;
            badge.style.background = status.bg;
            badge.style.color = status.color;
        }

        // Store sync time
        this.lastLocationSync = new Date();
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // meters
        const phi1 = lat1 * Math.PI/180;
        const phi2 = lat2 * Math.PI/180;
        const dphi = (lat2-lat1) * Math.PI/180;
        const dlambda = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(dphi/2) * Math.sin(dphi/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(dlambda/2) * Math.sin(dlambda/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // in meters
    },

    toggleAutoTrack() {
        this.isTracking = !this.isTracking;
        this._refreshCurrentView();
    },

    panToSiteLocation() {
        if (!this.geofenceMap || !this.assignedProject) return;
        const { lat, lng } = this.assignedProject;
        const projectLat = parseFloat(lat);
        const projectLng = parseFloat(lng);
        if (!isNaN(projectLat) && !isNaN(projectLng)) {
            this.geofenceMap.panTo([projectLat, projectLng]);
            this.geofenceMap.setZoom(15);
            if (window.toast) window.toast.show('Centered on Project Site', 'success');
        }
    },

    panToUserLocation() {
        if (!this.geofenceMap || !this.userMarker) {
            if (window.toast) window.toast.show('User location not available yet.', 'warning');
            return;
        }
        this.geofenceMap.panTo(this.userMarker.getLatLng());
        this.geofenceMap.setZoom(17);
        if (window.toast) window.toast.show('Centered on Your Location', 'success');
    },

    toggleMapExpand() {
        this.isExpanded = !this.isExpanded;
        this._refreshCurrentView();
    },

    refreshGPS() {
        this.verifyLocation();
    },

    showPCLocationGuidance() {
        window.drawer.open('Desktop Location Help', `
            <div style="padding: 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <i class="fas fa-laptop-code" style="font-size: 48px; color: var(--blue);"></i>
                    <h3 style="margin-top: 16px; font-weight: 800;">Desktop Geolocation</h3>
                </div>
                
                <p style="font-size: 14px; color: var(--slate-600); line-height: 1.6; margin-bottom: 20px;">
                    Unlike phones, desktop PCs often lack GPS hardware. Browsers estimate your location using your IP address, which in Malawi often defaults to <strong>Lilongwe</strong>.
                </p>

                <div style="background: var(--slate-50); border-radius: 12px; padding: 16px; border: 1px solid var(--slate-200); margin-bottom: 24px;">
                    <div style="font-weight: 700; font-size: 13px; margin-bottom: 12px; color: var(--slate-800);">How to improve accuracy:</div>
                    <ul style="padding-left: 20px; font-size: 13px; color: var(--slate-600); display: flex; flex-direction: column; gap: 10px;">
                        <li><strong>Enable Wi-Fi:</strong> Even if using Ethernet, keeping Wi-Fi "On" allows the browser to see nearby networks for triangulation.</li>
                        <li><strong>OS Location Services:</strong> Ensure "Location" is ON in Windows/macOS privacy settings.</li>
                        <li><strong>Move Near a Window:</strong> If using a laptop, this helps capture satellite signals.</li>
                    </ul>
                </div>

                <button class="btn btn-primary" style="width: 100%;" onclick="window.drawer.close()">Got it</button>
            </div>
        `);
    },

    viewLogHistory() {
        window.drawer.open('Log History', window.DrawerTemplates.dailyProgressLogHistory());
    },

    async loadHistoricalLog(date) {
        const container = document.getElementById('history-content-area');
        if (!container) return;

        container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--slate-500);"><i class="fas fa-spinner fa-spin"></i> Fetching log...</div>';

        try {
            const logs = await client.get('/daily-logs', {
                projectId: this.assignedProject?.id,
                startDate: date,
                endDate: date
            });
            
            const logArray = Array.isArray(logs) ? logs : (logs.data || []);
            const log = logArray[0];

            if (!log) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--slate-400);">
                        <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                        <div>No log found for ${new Date(date).toLocaleDateString()}</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; border: 1px solid var(--slate-200);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Status</span>
                        <span class="badge ${log.status === 'approved' ? 'badge-success' : log.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">${log.status.toUpperCase()}</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Narrative</div>
                        <div style="font-size: 13px; color: var(--slate-900); margin-top: 4px;">${log.narrative || 'No narrative provided'}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Headcount</div>
                            <div style="font-size: 14px; font-weight: 700;">${log.headcount || 0} Men</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Weather</div>
                            <div style="font-size: 14px; font-weight: 700;">${log.weather || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('[FS] Failed to load historical log:', error);
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--red);">Error loading log details.</div>';
        }
    },

    async viewRejectedLogs() {
        try {
            const logs = await client.get('/daily-logs', {
                projectId: this.assignedProject?.id,
                status: 'rejected'
            });
            const logArray = Array.isArray(logs) ? logs : (logs.data || []);
            
            let content = `
                <div class="drawer-section" style="padding-top: 12px;">
                    <h3 style="margin: 0 0 20px; font-size: 16px; font-weight: 800;">Rejected Reviews</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
            `;

            if (logArray.length === 0) {
                content += `
                    <div style="text-align: center; padding: 40px 20px; color: var(--slate-400);">
                        <i class="fas fa-check-double" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                        <div>No rejected logs found. You are all caught up!</div>
                    </div>
                `;
            } else {
                logArray.forEach(log => {
                    content += `
                        <div style="background: white; border: 1px solid var(--red-light); padding: 16px; border-radius: 12px; box-shadow: var(--shadow-sm);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-weight: 700; font-size: 13px;">${new Date(log.logDate).toLocaleDateString()}</span>
                                <span class="badge badge-danger">REJECTED</span>
                            </div>
                            <div style="font-size: 12px; color: var(--red); background: #FEF2F2; padding: 8px; border-radius: 6px; margin-bottom: 12px;">
                                <strong>Reason:</strong> ${log.rejectionReason || 'No reason specified'}
                            </div>
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px; padding: 8px;" onclick="window.drawer.open('Daily Progress', window.DrawerTemplates.dailyProgressLog())">
                                <i class="fas fa-edit"></i> Edit & Resubmit
                            </button>
                        </div>
                    `;
                });
            }

            content += `
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 24px;" onclick="window.drawer.close()">Close</button>
                </div>
            `;

            window.drawer.open('Rejected Reviews', content);
        } catch (error) {
            console.error('[FS] Failed to load rejected logs:', error);
            window.toast.show('Failed to load rejected logs', 'error');
        }
    },

    async handleSafetyReply(incidentId) {
        const textInput = document.getElementById('safety-reply-text');
        if (!textInput || !textInput.value.trim()) return;

        if (!incidentId) {
            window.toast?.show('Cannot reply to an unsaved incident. Submit first.', 'warning');
            return;
        }

        const btn = textInput.nextElementSibling;
        const origHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            await client.post(`/safety-incidents/${incidentId}/reply`, {
                content: textInput.value.trim()
            });

            window.toast?.show('Reply added.', 'success');
            
            // Reload the drawer with updated data
            // To do this properly, we'd refetch the incident and call DrawerTemplates.safetyIncident(incident)
            // For now, we will just close it or clear the input
            textInput.value = '';
            window.drawer?.close();
        } catch (error) {
            console.error('[FS] Error adding safety reply:', error);
            window.toast?.show('Failed to add reply.', 'error');
        } finally {
            if (btn) {
                btn.innerHTML = origHtml;
                btn.disabled = false;
            }
        }
    },

    triggerSafetyCamera() {
        if (window.toast) {
            window.toast.show('Camera launched', 'info');
        }
        
        // This simulates a native camera trigger or file input click
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                const previewDiv = document.getElementById('safety-photo-preview');
                if (previewDiv) {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.style.cssText = 'width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 1px solid var(--slate-200);';
                    previewDiv.appendChild(img);
                    
                    // Hide placeholder text if it exists
                    const emptyText = previewDiv.querySelector('div[style*="text-align:center"]');
                    if (emptyText) emptyText.style.display = 'none';

                    // Attach to global gallery for submission
                    window.photoGalleries = window.photoGalleries || {};
                    window.photoGalleries['safetyIncident'] = window.photoGalleries['safetyIncident'] || [];
                    window.photoGalleries['safetyIncident'].push({
                        dataUrl: ev.target.result,
                        timestamp: Date.now(),
                        name: file.name
                    });
                }
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    },

    async viewSafetyIncidents() {
        try {
            // Fetch safety incidents using raw client to the correct endpoint
            const res = await client.get('/safety-incidents', { projectId: this.assignedProject?.id });
            const incidents = Array.isArray(res) ? res : (res.data || []);
            
            window.drawer.open('Safety Log', window.DrawerTemplates.safetyIncidentTable(incidents));
        } catch (err) {
            console.error('[FS] Error fetching safety incidents:', err);
            window.toast?.show('Failed to load safety incidents', 'error');
            // Fallback to empty table
            window.drawer.open('Safety Log', window.DrawerTemplates.safetyIncidentTable([]));
        }
    },

    async viewIssues() {
        try {
            const res = await client.get('/issues', { projectId: this.assignedProject?.id });
            const issues = Array.isArray(res) ? res : (res.data || []);
            
            window.drawer.open('Site Issues', window.DrawerTemplates.issueTable(issues));
        } catch (err) {
            console.error('[FS] Error fetching issues:', err);
            window.toast?.show('Failed to load issues', 'error');
            // Fallback to empty table
            window.drawer.open('Site Issues', window.DrawerTemplates.issueTable([]));
        }
    }
};

