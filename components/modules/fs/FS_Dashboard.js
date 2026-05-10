import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';
import WeatherService from './WeatherService.js';

export const FS_Dashboard = {
    getDashboardView() {
        const inventoryEntries = Object.entries(this.siteInventory);
        const lowStock = inventoryEntries.some(([, i]) => i.qty === 0);
        const inTransitCount = this.siteAssets.filter(a => a.status === 'in_transit').length;
        const isCompleted = this.assignedProject?.status === 'completed';
        const notificationsEnabled = window.Notification && Notification.permission === 'granted';

        return `
            ${!notificationsEnabled ? `
                <div style="background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; animation: slideDown 0.4s ease-out;">
                    <div style="width: 40px; height: 40px; background: var(--blue-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--blue-600); flex-shrink: 0;">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 800; font-size: 14px; color: var(--blue-900);">Enable Real-Time Alerts</div>
                        <div style="font-size: 12px; color: var(--blue-700);">Receive instant notifications for material dispatches and emergency SOS alerts from your site.</div>
                    </div>
                    <button class="btn btn-primary" style="padding: 8px 16px; font-size: 12px;" onclick="window.requestNotificationPermission()">
                        Enable Now
                    </button>
                </div>
            ` : ''}
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


            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 24px;">
                <div class="data-card" style="grid-column: 1 / -1;">
                    <div class="data-card-header"><div class="card-title">Live Site Activity</div></div>
                    <div style="padding: 24px;">
                        <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                            <div style="flex: 1; padding: 12px; background: var(--slate-50); border-radius: 12px; border: 1px solid var(--slate-100);">
                                <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Current Workstation</div>
                                <div style="font-size: 13px; font-weight: 800; margin-top: 4px; color: var(--slate-900);">${this.assignedProject?.name || 'Loading…'}</div>
                            </div>
                            <div style="flex: 1; padding: 12px; background: var(--slate-50); border-radius: 12px; border: 1px solid var(--slate-100);">
                                <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Project Status</div>
                                <div style="font-size: 13px; font-weight: 800; margin-top: 4px; color: ${isCompleted ? 'var(--emerald)' : 'var(--blue)'};">${(this.assignedProject?.status || 'Loading').toUpperCase()}</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                            ${(() => {
                                const phases = this.phases || this.taskConfig?.phases || [];
                                const phaseNum = Number(this.assignedProject?.currentPhase || 1);
                                const currentPhaseIdx = Math.min(phaseNum - 1, Math.max(0, phases.length - 1));
                                const currentPhase = phases[currentPhaseIdx];
                                const phaseName = currentPhase?.name || 'Syncing...';
                                const progress = this.assignedProject?.progress || 0;
                                
                                // Calculate dates for current phase
                                const currentPhaseStats = this.phaseStats ? this.phaseStats[currentPhaseIdx] : null;
                                const dateStr = currentPhaseStats?.startDate ? 
                                    `${new Date(currentPhaseStats.startDate).toLocaleDateString()} - ${new Date(currentPhaseStats.endDate).toLocaleDateString()}` : 
                                    'Schedule pending';

                                return currentPhase ? `
                                    <div style="background: white; padding: 16px; border-radius: 12px; color: var(--slate-900); border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: center;">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                            <div>
                                                <div style="font-size: 10px; text-transform: uppercase; color: var(--slate-500); font-weight: 700; letter-spacing: 0.5px;">Active Phase</div>
                                                <div style="font-size: 15px; font-weight: 800; margin-top: 2px; color: var(--slate-900);">${phaseName}</div>
                                                <div style="font-size: 10px; color: var(--blue-600); margin-top: 4px; font-weight: 600;">
                                                    <i class="far fa-calendar-alt"></i> ${dateStr}
                                                </div>
                                            </div>
                                            <div style="text-align: right;">
                                                <div style="font-size: 10px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Overall</div>
                                                <div style="font-size: 18px; font-weight: 900; color: var(--emerald);">${progress}%</div>
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
                                            ${phases.map((p, i) => `<div style="flex:1; height:6px; border-radius:3px; background:${i < currentPhaseIdx ? 'var(--emerald)' : i === currentPhaseIdx ? 'var(--orange)' : 'var(--slate-200)'};"></div>`).join('')}
                                        </div>
                                        <div style="font-size: 10px; color: var(--slate-500); font-weight: 600;">
                                            Phase ${currentPhaseIdx + 1} of ${phases.length}
                                        </div>
                                    </div>
                                ` : '';
                            })()}
                            
                            <!-- Live Weather Mini-Card (Integrated) -->
                            <div class="data-card" id="weather-card" style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                                <div class="data-card-header" style="padding: 12px 16px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
                                    <div class="card-title" style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;"><i class="fas fa-cloud-sun" style="color: var(--blue); margin-right: 6px;"></i>Site Weather</div>
                                    <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 10px;" onclick="window.app.fsModule._loadWeather(true)">
                                        <i class="fas fa-sync"></i>
                                    </button>
                                </div>
                                <div id="fs-weather-widget" style="padding: 16px; flex: 1; display: flex; align-items: center; justify-content: center;">
                                    <div style="text-align: center; color: var(--slate-400); font-size: 11px;">
                                        <i class="fas fa-circle-notch fa-spin" style="margin-bottom: 4px; display: block;"></i>
                                        Loading...
                                    </div>
                                </div>
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
                <div class="data-card ${this.isExpanded ? 'expanded-map-card' : ''}" id="map-card" style="grid-column: span 2;">
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
                    <div id="fs-geofence-map" style="height: ${this.isExpanded ? '600px' : '400px'}; transition: height 0.3s ease; background: var(--slate-100); position: relative; z-index: 1;">
                        <div id="map-loading-overlay" style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--slate-500);">
                            <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Initializing Map...
                        </div>
                        <div id="map-sync-overlay" style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 900; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; gap: 12px; display: none;">
                            <i class="fas fa-satellite-dish fa-spin" style="font-size: 32px;"></i>
                            <div style="font-weight: 700; font-size: 14px;">Syncing High-Precision GPS...</div>
                            <div style="font-size: 11px; opacity: 0.8;">Refining coordinates (up to 45s)</div>
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
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--slate-100); padding-top: 8px; margin-top: 4px;">
                            <span><i class="fas fa-info-circle"></i> Verify location before submitting logs.</span>
                            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px;" onclick="window.app.fsModule.initGeofenceMap()"><i class="fas fa-undo"></i> Reset View</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async _loadWeather(forceRefresh = false) {
        const project = this.assignedProject;
        if (!project?.lat || !project?.lng) {
            const widget = document.getElementById('fs-weather-widget');
            if (widget) widget.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--slate-400); font-size: 12px;"><i class="fas fa-map-marker-alt" style="display: block; font-size: 20px; margin-bottom: 8px; opacity: 0.5;"></i>No project coordinates set</div>';
            return;
        }

        try {
            if (forceRefresh) WeatherService._cache = null;
            const weather = await WeatherService.fetchWeather(Number(project.lat), Number(project.lng));
            const widget = document.getElementById('fs-weather-widget');
            if (widget) {
                widget.innerHTML = WeatherService.renderWidget(weather);
            }
        } catch (err) {
            console.error('[FS] Weather load failed:', err);
        }
    },

    async _loadDashboardStats() {
        if (this._fetchingDashboardStats) return;
        this._fetchingDashboardStats = true;

        try {
            const projectId = this.assignedProject?.id || 1;
            const [logsResult, tasksResult] = await Promise.all([
                client.get('/daily-logs', { projectId, date: new Date().toISOString().split('T')[0] }),
                tasksApi.getByProject(projectId)
            ]);
            
            const logs = Array.isArray(logsResult) ? logsResult : (logsResult.data || []);
            this.dailyLogsCount = logs.length;
            
            const tasksData = tasksResult.data || tasksResult;
            this.projectTasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
            
            // Calculate phase summary dates and progress
            this._calculatePhaseStats();
            
            this._refreshCurrentView();

            // Render chart if on dashboard
            if (this.currentView === 'dashboard') {
                setTimeout(() => this._renderProgressChart(), 300);
            }
        } catch (error) {
            console.error('[FS] Failed to load dashboard stats:', error);
        } finally {
            this._fetchingDashboardStats = false;
        }
    },

    _calculatePhaseStats() {
        if (!this.projectTasks || this.projectTasks.length === 0) {
            this.phaseStats = [];
            this.phases = [];
            return;
        }
        
        // Group tasks by phaseNumber
        const phaseMap = {};
        this.projectTasks.forEach(t => {
            const pNum = t.phaseNumber || 1;
            if (!phaseMap[pNum]) phaseMap[pNum] = [];
            phaseMap[pNum].push(t);
        });
        
        const phaseNums = Object.keys(phaseMap).sort((a, b) => parseInt(a) - parseInt(b));
        
        this.phaseStats = phaseNums.map(pNum => {
            const phaseTasks = phaseMap[pNum];
            const startDates = phaseTasks.map(t => t.startDate ? new Date(t.startDate).getTime() : null).filter(d => d);
            const endDates = phaseTasks.map(t => t.endDate ? new Date(t.endDate).getTime() : null).filter(d => d);
            
            // Prioritize the task name from the DB for accuracy
            const primaryTask = phaseTasks[0];
            const phaseName = `Phase ${pNum}: ${primaryTask.name}`;
            
            return {
                id: `PHASE_${pNum}`,
                name: phaseName,
                startDate: startDates.length ? new Date(Math.min(...startDates)) : null,
                endDate: endDates.length ? new Date(Math.max(...endDates)) : null,
                avgProgress: Math.round(phaseTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / phaseTasks.length)
            };
        });
        
        // Expose phases for rendering
        this.phases = this.phaseStats;
    },

    _renderProgressChart() {
        const ctx = document.getElementById('fs-progress-chart');
        if (!ctx || !window.Chart) return;

        if (this.progressChart) this.progressChart.destroy();

        const phases = this.taskConfig?.phases || [];
        const labels = phases.map(p => p.name.split(':')[0]);
        const data = (this.phaseStats || []).map(s => s.avgProgress || 0);

        this.progressChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Phase Progress %',
                    data: data,
                    backgroundColor: 'rgba(249, 116, 21, 0.8)',
                    borderColor: 'rgb(249, 116, 21)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
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
            
            // Load tasks config for phase tracking
            if (!this.taskConfig) {
                try {
                    const config = await client.get('/tasks/config');
                    this.taskConfig = config.data || config;
                    console.log('[FS] Tasks config loaded:', this.taskConfig?.phases?.length, 'phases');
                } catch (cfgErr) {
                    console.error('[FS] Failed to load tasks config:', cfgErr);
                    this.taskConfig = { phases: [] };
                }
            }

            // Load site resources (Inventory & Assets) for logs
            await Promise.all([
                this._loadSiteInventory ? this._loadSiteInventory() : Promise.resolve(),
                this._loadSiteAssets ? this._loadSiteAssets() : Promise.resolve()
            ]);
            
            // Re-cache requisition mapping data whenever the project is loaded/updated
            if (this.assignedProject && typeof this._cacheRequisitionData === 'function') {
                await this._cacheRequisitionData();
            }

            this._refreshCurrentView();

            // Initialize map if on dashboard
            if (this.currentView === 'dashboard') {
                setTimeout(() => this.initGeofenceMap(), 800);
                // Secondary check for slow loads
                setTimeout(() => {
                    const mapContainer = document.getElementById('fs-geofence-map');
                    if (mapContainer && !mapContainer.querySelector('.leaflet-container')) {
                        console.log('[FS Map] Retrying initialization...');
                        this.initGeofenceMap();
                    }
                }, 2000);
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
        
        // Final layout sync to prevent gray tiles/blank map
        setTimeout(() => {
            if (this.geofenceMap) {
                this.geofenceMap.invalidateSize();
            }
        }, 300);
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
        
        console.log('[FS GPS] Starting verification window...');

        // 1. Primary: Native Hardware Bridge (Bypasses Browser/IP routing)
        try {
            console.log('[FS GPS] Requesting hardware-level lock via bridge...');
            const response = await fetch('/api/v1/system/precise-location');
            const result = await response.json();
            
            if (result.success && result.data) {
                const nativePos = {
                    coords: {
                        latitude: result.data.Latitude,
                        longitude: result.data.Longitude,
                        accuracy: result.data.Accuracy
                    },
                    timestamp: Date.now()
                };
                
                console.log('[FS GPS] Native Bridge result:', nativePos.coords.accuracy, 'm');
                
                // If native is highly accurate (likely Wi-Fi/GPS), use it immediately
                if (nativePos.coords.accuracy <= 100) {
                    this.bestPosition = nativePos;
                    this.updateUserPosition(nativePos);
                    this._finalizeVerification(btn, overlay);
                    return nativePos;
                }
                
                // Otherwise, store as current best and continue to browser watch
                this.bestPosition = nativePos;
                this.updateUserPosition(nativePos);
            }
        } catch (e) {
            console.warn('[FS GPS] Native bridge unavailable, falling back to browser:', e.message);
        }

        // 2. Secondary: Standard Browser Geolocation
        return new Promise((resolve) => {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const elapsed = Date.now() - this.verificationStartTime;
                    console.log(`[FS GPS] Browser Reading: ${Math.round(pos.coords.accuracy)}m (${elapsed}ms)`);
                    
                    if (!this.bestPosition || pos.coords.accuracy < this.bestPosition.coords.accuracy) {
                        this.bestPosition = pos;
                        this.updateUserPosition(pos);
                    }

                    // Early exit if we hit perfect precision
                    if (pos.coords.accuracy < 25 && elapsed > 2000) {
                        cleanup();
                    }
                },
                (err) => {
                    console.warn('[FS GPS] Browser watch error:', err);
                    if (!this.bestPosition && err.code === 3) {
                        window.toast?.show('GPS signal weak. Still trying... Please wait.', 'warning');
                    }
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 40000 } // Increased to 40s
            );

            const timeoutId = setTimeout(cleanup, 45000); // Wait up to 45s for best reading

            const self = this;
            function cleanup() {
                navigator.geolocation.clearWatch(watchId);
                clearTimeout(timeoutId);
                self._finalizeVerification(btn, overlay);
                resolve(self.bestPosition);
            }
        });
    },

    _finalizeVerification(btn, overlay) {
        if (btn) {
            btn.innerHTML = '<i class="fas fa-sync"></i> Sync Location';
            btn.disabled = false;
        }
        if (overlay) overlay.style.display = 'none';

        if (this.bestPosition) {
            const acc = this.bestPosition.coords.accuracy;
            const status = this.classifyAccuracy(acc);
            
            // Visual Update
            const badge = document.getElementById('gps-status-badge');
            if (badge) {
                badge.innerHTML = `<i class="fas fa-check-circle" style="color: ${status.color}"></i> ${status.label} (±${Math.round(acc)}m)`;
                badge.style.background = status.bg;
            }

            window.toast?.show(`Location Verified: ${status.label} (±${Math.round(acc)}m)`, status.toastType);
            
            // Re-center map on new accurate position
            if (this.geofenceMap) {
                this.geofenceMap.setView([this.bestPosition.coords.latitude, this.bestPosition.coords.longitude], 16);
            }
        } else {
            window.toast?.show('Verification failed. Check device GPS.', 'error');
        }
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

    async viewLogHistory() {
        window.drawer.open('Log History', window.DrawerTemplates.dailyProgressLogHistory([]));
        
        try {
            const logs = await client.get('/daily-logs', { 
                projectId: this.assignedProject?.id,
                limit: 10 
            });
            const logArray = Array.isArray(logs) ? logs : (logs.data || []);
            this.historicalLogs = logArray;
            window.drawer.updateContent(window.DrawerTemplates.dailyProgressLogHistory(logArray));
        } catch (error) {
            console.error('[FS] Failed to load history:', error);
        }
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
            this.historicalLogs = logArray;
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

    openHistoricalLogDetails(logId) {
        const log = this.historicalLogs?.find(l => String(l.id) === String(logId));
        if (log) {
            window.drawer.open("Log Details", window.DrawerTemplates.dailyLogDetails(log));
        } else {
            window.toast?.show('Log details not found.', 'warning');
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
                            <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px; padding: 8px;" onclick="window.app.fsModule.openDailyLogDrawer()">
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

    viewIssues() {
        // ... implementation from above ...
    },

    showPCLocationGuidance() {
        window.drawer.open('Desktop Location Fix', `
            <div class="p-6">
                <div style="text-align: center; margin-bottom: 24px;">
                    <i class="fas fa-desktop" style="font-size: 48px; color: var(--blue); margin-bottom: 16px;"></i>
                    <h3 style="font-weight: 800; margin-bottom: 8px;">Using a PC on Site?</h3>
                    <p style="color: var(--slate-500); font-size: 13px;">Desktop browsers often default to your ISP's routing center (e.g., Lilongwe) instead of your actual site coordinates.</p>
                </div>

                <div style="background: #EFF6FF; border-left: 4px solid var(--blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="font-size: 13px; font-weight: 700; color: var(--blue); margin-bottom: 8px;">Required Settings:</h4>
                    <ul style="font-size: 12px; line-height: 1.6; color: var(--slate-700); padding-left: 18px;">
                        <li><strong>Wi-Fi Must Be ON:</strong> Even if using a LAN cable, turn on Wi-Fi so Windows can see nearby signals to triangulate.</li>
                        <li><strong>Windows Privacy:</strong> Search for "Location Privacy Settings" and ensure "Allow desktop apps to access your location" is <strong>ON</strong>.</li>
                        <li><strong>Browser:</strong> Click the padlock icon in the URL bar and ensure "Location" is set to <strong>Allow</strong>.</li>
                    </ul>
                </div>

                <div style="background: #FFF7ED; border-left: 4px solid var(--orange); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <h4 style="font-size: 13px; font-weight: 700; color: var(--orange); margin-bottom: 8px;">Still in Lilongwe?</h4>
                    <p style="font-size: 12px; color: var(--slate-700);">If your hardware doesn't have a GPS chip, use the <strong>"Manual Pin"</strong> feature on the dashboard to manually mark your location relative to the project site.</p>
                </div>

                <button class="btn btn-primary" style="width: 100%;" onclick="window.drawer.close()">Understood</button>
            </div>
        `);
    },

    openManualLocationDrawer() {
        if (!this.assignedProject) return;
        const { lat, lng, name } = this.assignedProject;
        
        window.drawer.open('Manual Site Pin', `
            <div class="p-6">
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Project Context</div>
                    <div style="font-size: 15px; font-weight: 800; color: var(--slate-900);">${name}</div>
                    <div style="font-size: 12px; color: var(--slate-500);">Site Center: ${lat}, ${lng}</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Manual Latitude</label>
                    <input type="number" id="manual_lat" class="form-input" value="${lat}" step="0.000001">
                </div>

                <div class="form-group">
                    <label class="form-label">Manual Longitude</label>
                    <input type="number" id="manual_lng" class="form-input" value="${lng}" step="0.000001">
                </div>

                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; font-size: 11px; color: var(--slate-600); margin-bottom: 20px;">
                    <i class="fas fa-info-circle"></i> Use your phone's Google Maps app to find your coordinates if your PC is stuck in Lilongwe.
                </div>

                <button class="btn btn-primary" style="width: 100%; background: var(--orange); border-color: var(--orange);" 
                    onclick="window.app.fsModule.handleManualLocationSubmit()">
                    <i class="fas fa-check-circle"></i> Apply Manual Coordinates
                </button>
            </div>
        `);
    },

    handleManualLocationSubmit() {
        const lat = parseFloat(document.getElementById('manual_lat')?.value);
        const lng = parseFloat(document.getElementById('manual_lng')?.value);

        if (isNaN(lat) || isNaN(lng)) {
            window.toast?.show('Please enter valid numeric coordinates.', 'error');
            return;
        }

        const manualPos = {
            coords: {
                latitude: lat,
                longitude: lng,
                accuracy: 10 // Forced high accuracy for manual pin
            },
            timestamp: Date.now(),
            isManual: true
        };

        this.bestPosition = manualPos;
        this.updateUserPosition(manualPos);
        
        // Re-center map
        if (this.geofenceMap) {
            this.geofenceMap.setView([lat, lng], 16);
        }

        const badge = document.getElementById('gps-status-badge');
        if (badge) {
            badge.innerHTML = `<i class="fas fa-map-pin" style="color: var(--orange)"></i> Manual Override (Active)`;
            badge.style.background = 'var(--orange-light)';
        }

        window.toast?.show('Location overridden manually. You can now submit logs.', 'success');
        window.drawer.close();
    }
};

