import client from '../../../src/api/client.js';
import projects from '../../../src/api/projects.api.js';
import users from '../../../src/api/users.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';

export const PM_MissingHandlers = {
    escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    validateInline(id) {
        const input = document.getElementById(id);
        if (!input) return;
        
        const errorEl = document.getElementById(id + '-error');
        let errorMsg = '';
        const value = input.value;

        if (input.type === 'number') {
            const num = parseFloat(value);
            if (isNaN(num)) {
                errorMsg = 'Please enter a valid number';
            } else if (num < 0) {
                errorMsg = 'Negative values are not allowed';
                input.value = 0;
                input.classList.add('v-shake'); 
                setTimeout(() => input.classList.remove('v-shake'), 400);
            } else if (id === 'proj_budget' && num === 0) {
                errorMsg = 'Allocated budget cannot be zero';
                input.classList.add('v-shake');
                setTimeout(() => input.classList.remove('v-shake'), 400);
            }
        } else if (input.type === 'date') {
            const today = new Date().toISOString().split('T')[0];
            if (value < today && id === 'proj_start') {
                errorMsg = 'Start date cannot be in the past';
            } else if (id === 'proj_end') {
                const start = document.getElementById('proj_start')?.value;
                if (start && value < start) {
                    errorMsg = 'End date cannot be before start date';
                }
            }
        } else if (input.type === 'text' && value.trim()) {
            // Check if input is just numbers (for name-like fields)
            const nameFields = ['proj_name', 'proj_client', 'road_zone', 'road_town_dist_text']; 
            if ((nameFields.includes(id) || id.includes('name')) && /^\d+$/.test(value.trim())) {
                errorMsg = 'This field cannot be composed solely of numbers';
                input.classList.add('v-shake');
                setTimeout(() => input.classList.remove('v-shake'), 400);
            }
        } else if (!value.trim() && input.hasAttribute('required')) {
            errorMsg = 'This field is required';
        }

        if (errorEl) {
            errorEl.textContent = errorMsg;
            errorEl.style.display = errorMsg ? 'block' : 'none';
        }
        
        input.style.borderColor = errorMsg ? 'var(--red)' : 'var(--slate-300)';
        input.style.background = errorMsg ? 'var(--red-light)' : 'white';
    },

    updateCoords(lat, lng, containerId = 'project-map') {
        const prefix = containerId === 'edit-project-map' ? 'edit_proj_' : 'proj_';
        const latEl = document.getElementById(prefix + 'lat');
        const lngEl = document.getElementById(prefix + 'lng');
        if (latEl) latEl.textContent = lat.toFixed(6);
        if (lngEl) lngEl.textContent = lng.toFixed(6);
        
        if (prefix === 'proj_') {
            if (this.wizardState) this.wizardState.locationSet = true;
            this.saveWizardCache();
        }
    },

    updateMapRadius(radius, containerId = 'project-map') {
        const prefix = containerId === 'edit-project-map' ? 'edit_proj_' : 'proj_';
        const valEl = document.getElementById(prefix + 'radius_val');
        if (valEl) valEl.innerText = radius + 'm';
        
        if (this.geofenceCircle) {
            this.geofenceCircle.setRadius(radius);
        }
        if (prefix === 'proj_') {
            this.saveWizardCache();
        }
    },

    getAnalyticsView() {
        return `
            <div class="data-card" style="padding: 40px; text-align: center;">
                <i class="fas fa-chart-pie" style="font-size: 48px; color: var(--slate-300); margin-bottom: 16px;"></i>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--slate-700);">Analytics Module</h3>
                <p style="color: var(--slate-500); margin-top: 8px;">Detailed analytics are currently being configured.</p>
            </div>
        `;
    },

    updateBudgetSummary(transactions) {
        const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const el = document.getElementById('budget-total-spend');
        if (el) el.textContent = `MWK ${(total / 1000000).toFixed(1)}M`;
    },

    async loadSiteActivityFromAPI() {
        const container = document.getElementById('site-activity-container');
        if (!container) return;

        try {
            // Get all projects and their latest logs
            const [projectsResponse, logsResponse] = await Promise.all([
                projects.getAll(),
                dailyLogs.getAll({ limit: 100 })
            ]);

            const projectsList = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse.data || []);
            const logsList = Array.isArray(logsResponse) ? logsResponse : (logsResponse.data || []);

            if (projectsList.length === 0) {
                container.innerHTML = this.renderEmptyState('No active project sites found.');
                return;
            }

            container.innerHTML = projectsList.map(project => {
                const projectLogs = logsList.filter(l => l.projectId === project.id || l.project_id === project.id);
                const latestLog = projectLogs[0]; // Assuming sorted by date descending from API
                const attendance = latestLog ? (latestLog.attendanceCount || latestLog.attendance || '0') : '--';
                const statusIcon = latestLog ? 'fa-satellite-dish' : 'fa-ellipsis-h';
                const statusClass = latestLog ? 'active' : 'pending';
                const statusLabel = latestLog ? 'Live' : 'Offline';

                return `
                    <div style="border:1px solid var(--slate-200); border-radius:8px; padding:16px; background: white;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <div style="font-weight:700;">${this.escapeHTML(project.name)}</div>
                            <span class="status ${statusClass}"><i class="fas ${statusIcon}"></i> ${this.escapeHTML(statusLabel)}</span>
                        </div>
                        <div style="display:flex; gap:12px; margin-bottom:16px;">
                            <div class="profile-avatar" style="width:32px; height:32px; font-size:12px;">${this.escapeHTML((project.manager?.name || 'U').substring(0, 2).toUpperCase())}</div>
                            <div>
                                <div style="font-size:12px; font-weight:600;">${this.escapeHTML(project.manager?.name || 'Unassigned')}</div>
                                <div style="font-size:11px; color:var(--slate-500);">Site Supervisor</div>
                            </div>
                        </div>
                        <div style="background:var(--slate-50); padding:10px; border-radius:6px; font-size:11px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Worker Attendance</span>
                                <strong>${this.escapeHTML(attendance)} Present</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Last Sync</span>
                                <strong>${latestLog ? new Date(latestLog.createdAt || latestLog.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No recent logs'}</strong>
                            </div>
                        </div>
                        <button class="btn btn-secondary" style="width:100%; font-size:11px;" onclick="window.app.pmModule.openSiteLogVerification(${JSON.stringify(project).replace(/"/g, '&quot;')}, ${latestLog ? JSON.stringify(latestLog).replace(/"/g, '&quot;') : 'null'})">View Site Details</button>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Failed to load site activity:', error);
            container.innerHTML = this.renderEmptyState('Failed to connect to field sites.');
        }
    },

    async loadReportsData() {
        const container = document.getElementById('reports-grid-container');
        if (!container) return;
        
        const filterEl = document.getElementById('report-project-filter');
        const selectedProject = filterEl ? filterEl.value : 'all';

        try {
            // Configured to map directly to the newly built MCMS Reporting APIs
            const reportTypes = [
                { id: 'pm/portfolio', title: 'Global Portfolio Snapshot', icon: 'fa-project-diagram', bg: 'var(--blue-light)', color: 'var(--blue)', desc: 'Holistic cross-project execution pacing and active bottlenecks.' },
                { id: 'pm/project-health', title: 'Deep Project Health', icon: 'fa-heartbeat', bg: 'var(--emerald-light)', color: 'var(--emerald)', desc: 'Milestone adherence mapping against timeline baselines.' },
                { id: 'pm/timeline', title: 'Schedule & Delays', icon: 'fa-calendar-alt', bg: 'var(--indigo-light)', color: 'var(--indigo-dark)', desc: 'Timeline impact analysis, trailing tasks and upcoming deliverables.' },
                { id: 'finance/budget', title: 'Financial Expenditure', icon: 'fa-coins', bg: 'var(--orange-light)', color: 'var(--orange-dark)', desc: 'Cross-functional budget utilization and labor cost burn rate analysis.' },
                { id: 'field/daily-logs', title: 'Site Activity Log', icon: 'fa-hard-hat', bg: 'var(--slate-100)', color: 'var(--slate-700)', desc: 'Consolidated field reports, delays, headcounts and site climate.' },
                { id: 'ops/safety', title: 'HSE & Incident Audit', icon: 'fa-shield-alt', bg: '#FFF1F2', color: '#E11D48', desc: 'Centralized Health, Safety, and Environment incident audit.' }
            ];

            container.innerHTML = reportTypes.map(report => {
                const apiPath = `/api/v1/reports/${report.id}?${selectedProject !== 'all' ? 'projectId=' + selectedProject + '&' : ''}`;
                return `
                <div class="data-card" style="padding:0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);">
                    <div style="padding: 24px; text-align:center; border-bottom: 1px solid var(--slate-100); flex: 1;">
                        <div style="width: 56px; height: 56px; background: ${report.bg}; color: ${report.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px;">
                            <i class="fas ${report.icon}"></i>
                        </div>
                        <div style="font-weight:700; font-size: 16px; margin-bottom:8px; color: var(--slate-900);">${report.title}</div>
                        <p style="font-size:13px; color:var(--slate-500); line-height: 1.5; padding: 0 10px;">${report.desc}</p>
                    </div>
                    <div style="padding: 16px; background: #fafafa; display: flex; gap: 12px; justify-content: center;">
                        <a href="${apiPath}format=pdf" target="_blank" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; flex: 1; justify-content: center; text-decoration: none;">
                            <i class="fas fa-file-pdf" style="color: #ef4444;"></i> Download PDF
                        </a>
                        <a href="${apiPath}format=csv" target="_blank" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; flex: 1; justify-content: center; text-decoration: none;">
                            <i class="fas fa-file-excel" style="color: #10b981;"></i> Download CSV
                        </a>
                    </div>
                </div>
            `}).join('');

        } catch (error) {
            console.error('Failed to load reports:', error);
            container.innerHTML = this.renderEmptyState('Failed to format reporting modules safely.');
        }
    },

    async loadInventoryData() {
        const container = document.getElementById('inventory-table-container');
        if (!container) return;

        try {
            // Fetch assets/inventory from API
            const result = await assets.getAll({ limit: 10 });
            const data = result.data || result;
            const items = Array.isArray(data) ? data : data.assets || [];

            if (items.length === 0) {
                container.innerHTML = this.renderEmptyState('No inventory data tracked at this level.');
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Asset / Resource</th>
                            <th>Status</th>
                            <th>Current Location</th>
                            <th>Health</th>
                            <th>Last Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td style="font-weight:600;">${this.escapeHTML(item.name)}</td>
                                <td><span class="status ${item.status === 'active' ? 'active' : 'pending'}">${this.escapeHTML(item.status)}</span></td>
                                <td>${this.escapeHTML(item.location || 'Central Store')}</td>
                                <td>
                                    <div style="width:100px; height:6px; background:var(--slate-100); border-radius:3px;">
                                        <div style="width:${item.health || 100}%; height:100%; background:var(--emerald); border-radius:3px;"></div>
                                    </div>
                                </td>
                                <td>${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Never'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Inventory load error:', error);
            container.innerHTML = this.renderEmptyState('Failed to load real-time inventory.');
        }
    },

    async openDailyLogReviewDrawer(logId, projectId) {
        window.toast.show('Loading site records...', 'info');
        try {
            // Fetch the specific log and recent historical logs for comparison
            const [currentLog, historicalLogs] = await Promise.all([
                client.get(`/daily-logs/${logId}`),
                client.get(`/daily-logs?projectId=${projectId}&limit=10`)
            ]);

            const log = currentLog.data || currentLog;
            const history = Array.isArray(historicalLogs) ? historicalLogs : (historicalLogs.data || []);
            
            // Sort history by date descending
            history.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

            window.drawer.open('Review Progress Report', window.DrawerTemplates.dailyLogReview(log, history));
        } catch (error) {
            console.error('Failed to open log review:', error);
            window.toast.show('Failed to load log details', 'error');
        }
    },

    initializeProjectMap(retryCount = 0, containerId = 'project-map', initialCoords = null) {
        // Wait for drawer animation and DOM rendering
        setTimeout(() => {
            const mapContainer = document.getElementById(containerId);
            if (!mapContainer) return;

            // Use the isolated Leaflet engine
            const LeafletEngine = window.MKAKA_L || window.L;

            if (!LeafletEngine || typeof LeafletEngine.map !== 'function') {
                if (retryCount < 5) {
                    console.log(`[Map] Leaflet engine (MKAKA_L) not ready (Attempt ${retryCount + 1}), retrying...`);
                    return this.initializeProjectMap(retryCount + 1, containerId, initialCoords);
                }
                console.error("Leaflet engine failure.", { 
                    MKAKA_L: !!window.MKAKA_L, 
                    L: !!window.L,
                    hasMap: LeafletEngine ? typeof LeafletEngine.map : 'engine missing'
                });
                mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Error: Map engine collision or load failure. Please reload.</div>';
                return;
            }

            console.log(`[Map] Using isolated Leaflet engine for ${containerId}:`, LeafletEngine.version);
            // Clear loading state
            mapContainer.innerHTML = '';

            // Default center or passed center
            const defaultCoords = initialCoords ? [initialCoords.lat, initialCoords.lng] : [-13.9626, 33.7741];
            
            try {
                // Initialize map using isolated engine
                const map = LeafletEngine.map(containerId).setView(defaultCoords, initialCoords ? 15 : 13);

                // Add OpenStreetMap tiles
                LeafletEngine.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);

                // Add initial marker
                let marker = LeafletEngine.marker(defaultCoords, {
                    draggable: true
                }).addTo(map);

                // Add Circle for Geofence/Radius
                let circle = LeafletEngine.circle(defaultCoords, {
                    color: 'var(--orange)',
                    fillColor: 'var(--orange)',
                    fillOpacity: 0.15,
                    radius: initialCoords && initialCoords.radius ? initialCoords.radius : 500
                }).addTo(map);

                // Add Search Control (Geocoder)
                const geocoder = LeafletEngine.Control.geocoder({
                    defaultMarkGeocode: false,
                    placeholder: "Search for a location...",
                    errorMessage: "Location not found."
                })
                .on('markgeocode', function(e) {
                    const latlng = e.geocode.center;
                    map.setView(latlng, 16);
                    marker.setLatLng(latlng);
                    circle.setLatLng(latlng);
                    this.updateCoords(latlng.lat, latlng.lng);
                }.bind(this))
                .addTo(map);

                // Expose circle and update functions to the instance for radius changes
                this.projectMap = map;
                this.geofenceCircle = circle;
                this.locationMarker = marker;

                // Force refresh
                setTimeout(() => map.invalidateSize(), 100);

                // Add CSS overrides for Geocoder within the map container
                const geocoderStyle = document.createElement('style');
                geocoderStyle.innerHTML = `
                    .leaflet-control-geocoder { 
                        box-shadow: var(--shadow-sm) !important; 
                        border-radius: 6px !important; 
                        border: 1px solid var(--slate-200) !important;
                    }
                    .leaflet-control-geocoder-form input { 
                        font-size: 12px !important; 
                        padding: 6px !important; 
                        outline: none !important;
                    }
                    .leaflet-control-geocoder-icon { 
                        width: 30px !important; 
                        height: 30px !important; 
                    }
                `;
                mapContainer.appendChild(geocoderStyle);

                // Handle map click
                // Handle map click
                map.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    marker.setLatLng(e.latlng);
                    circle.setLatLng(e.latlng);
                    this.updateCoords(lat, lng, containerId);
                });

                // Handle marker drag
                marker.on('dragend', (e) => {
                    const { lat, lng } = marker.getLatLng();
                    circle.setLatLng(marker.getLatLng());
                    this.updateCoords(lat, lng, containerId);
                });

                // Force layout recalculation after various delays to ensure visibility
                map.invalidateSize();
                setTimeout(() => map.invalidateSize(), 100);
                setTimeout(() => map.invalidateSize(), 500);
            } catch (e) {
                console.error("Map Init Error:", e);
                mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Failed to initialize map.</div>';
            }
        }, 500);
    },

    initializeVerificationMap(lat, lng, projectLat = null, projectLng = null, projectRadius = 500) {
        setTimeout(() => {
            const mapContainer = document.getElementById('verification-map');
            if (!mapContainer) return;

            const LeafletEngine = window.MKAKA_L || window.L;
            if (!LeafletEngine) {
                console.error("[Map] Leaflet engine missing for verification.");
                return;
            }

            mapContainer.innerHTML = '';
            const coords = [lat || -13.9626, lng || 33.7741];
            
            try {
                const map = LeafletEngine.map('verification-map').setView(coords, 15);
                LeafletEngine.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                }).addTo(map);

                // Worker Location
                LeafletEngine.marker(coords).addTo(map).bindPopup("<b>Worker Reported Location</b>").openPopup();

                // Project Boundary
                if (projectLat && projectLng) {
                    const projectCoords = [parseFloat(projectLat), parseFloat(projectLng)];
                    LeafletEngine.circle(projectCoords, {
                        color: 'var(--orange, #f97316)',
                        fillColor: 'var(--orange, #f97316)',
                        fillOpacity: 0.15,
                        radius: parseFloat(projectRadius) || 500
                    }).addTo(map).bindPopup("<b>Project Authorized Boundary</b>");
                    
                    // Show both if different
                    const bounds = LeafletEngine.latLngBounds([coords, projectCoords]);
                    map.fitBounds(bounds, { padding: [30, 30] });
                }
                
                map.invalidateSize();
                setTimeout(() => map.invalidateSize(), 200);
            } catch (e) {
                console.error("Verification Map Error:", e);
                mapContainer.innerHTML = `<div style="padding:20px; color:var(--red); font-size:12px;">Map initialization failed. Coords: ${lat},${lng}</div>`;
            }
        }, 350); 
    },

    openSiteLogVerification(project, log) {
        window.drawer.open('Review Daily Log', window.DrawerTemplates.siteLogVerification(project, log));
        
        // Pass project context for geo-validation
        let lat = -13.9626;
        let lng = 33.7741;

        if (log?.gpsCoords) {
            const coordsStr = typeof log.gpsCoords === 'string' ? log.gpsCoords : '';
            const parts = coordsStr.split(',').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                lat = parts[0];
                lng = parts[1];
            }
        }

        this.initializeVerificationMap(lat, lng, project?.lat, project?.lng, project?.radius);
    },

    validateRoadSpecForm() {
        const fields = ['road_length', 'road_width', 'road_zone', 'road_town_dist'];
        let isValid = true;

        fields.forEach(id => {
            this.validateInline(id);
            const errorEl = document.getElementById(id + '-error');
            if (errorEl && errorEl.style.display !== 'none') {
                isValid = false;
            }
        });

        if (!isValid) {
            window.toast.show('Please correct the specifications in Step 2', 'warning');
        }
        return isValid;
    },

    async handleWizardNav(direction) {
        // Validate current pane before leaving
        if (direction > 0) {
            const currentPane = document.getElementById(`wizard-pane-${this.wizardState.currentStep}`);
            if (currentPane && window.V && !window.V.validateForm(currentPane)) {
                return;
            }
        }

        const newStep = this.wizardState.currentStep + direction;
        
        // If moving to step 4 (Budget Receipt), run estimation ONLY if no preview exists or if data changed
        if (newStep === 4 && direction > 0) {
            const currentSpec = JSON.stringify({
                type: document.getElementById('road_type').value,
                len: document.getElementById('road_length').value,
                width: document.getElementById('road_width').value,
                terrain: document.getElementById('road_terrain').value
            });
            
            if (!this.wizardState.roadEstimatePreview || this.wizardState.lastEstimatedSpec !== currentSpec) {
                await this.generateEstimatedReceipt();
                this.wizardState.lastEstimatedSpec = currentSpec;
            }
        }

        if (newStep >= 1 && newStep <= 5) {
            this.switchWizardStep(newStep);
            this.saveWizardCache(); // Persist step change
        }
    },

    switchWizardStep(stepNum) {
        // Hide all panes
        document.querySelectorAll('.wizard-pane').forEach(p => p.style.display = 'none');
        // Show target pane
        const targetPane = document.getElementById(`wizard-pane-${stepNum}`);
        if(targetPane) {
            targetPane.style.display = 'block';
            // Force map refresh if Step 1 is re-entered
            if (stepNum === 1 && this.projectMap) {
                setTimeout(() => this.projectMap.invalidateSize(), 50);
            }
        }

        // Update progress bar
        const totalSteps = 5; 
        const progressPercentage = ((stepNum - 1) / (totalSteps - 1)) * 100;
        document.getElementById('progress-bar-fill').style.width = `${progressPercentage}%`;

        // Update step UI
        document.querySelectorAll('.wizard-step').forEach((el, idx) => {
            const stepIndex = idx + 1;
            const circle = el.querySelector('.step-circle');

            let visualStep = stepIndex === 5 ? totalSteps : stepIndex;
            
            if (visualStep < stepNum || (stepNum === 5 && stepIndex === 5)) {
                // Completed
                el.style.opacity = '1';
                circle.style.background = 'var(--emerald)';
                circle.style.borderColor = 'white';
                circle.style.color = 'white';
                circle.innerHTML = '&#10003;';
            } else if (visualStep === stepNum) {
                // Active
                el.style.opacity = '1';
                circle.style.background = 'var(--orange)';
                circle.style.borderColor = 'var(--orange-light)';
                circle.style.color = 'white';
                circle.innerHTML = stepIndex === 5 ? '&#10003;' : stepIndex;
            } else {
                // Future
                el.style.opacity = '0.4';
                circle.style.background = 'var(--slate-200)';
                circle.style.borderColor = 'white';
                circle.style.color = 'var(--slate-500)';
                circle.innerHTML = stepIndex === 5 ? '&#10003;' : stepIndex;
            }
        });

        // Update buttons
        const btnPrev = document.getElementById('wizard-prev');
        const btnNext = document.getElementById('wizard-next');
        const btnSubmit = document.getElementById('wizard-submit');

        btnPrev.style.display = stepNum === 1 ? 'none' : 'flex';
        
        if (stepNum === 5) {
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'flex';
            this.updateFinalSummary();
        } else if (stepNum === 4) {
            btnNext.style.display = 'flex';
            btnSubmit.style.display = 'none';
            // Sync Step 4 budget input from Step 1
            const mainBudget = document.getElementById('proj_budget');
            const step4Budget = document.getElementById('step4_budget');
            if (step4Budget && mainBudget) {
                step4Budget.value = mainBudget.value;
            }
            // Disable next until budget is reconciled
            this.checkBudgetReconciliation();
        } else {
            btnNext.style.display = 'flex';
            btnSubmit.style.display = 'none';
            btnNext.disabled = false;
        }

        this.wizardState.currentStep = stepNum;
    },

    async generateEstimatedReceipt() {
        document.getElementById('estimation-loader').style.display = 'block';
        document.getElementById('estimation-receipt-container').innerHTML = '';
        document.getElementById('wizard-next').disabled = true;

        const accBoxes = document.querySelectorAll('input[name="road_acc"]:checked');
        const accessories = Array.from(accBoxes).map(cb => cb.value);
        if (document.getElementById('acc_lighting').value) {
            accessories.push(document.getElementById('acc_lighting').value);
        }

        const payload = {
            roadType: document.getElementById('road_type').value,
            lengthKm: parseFloat(document.getElementById('road_length').value),
            widthM: parseFloat(document.getElementById('road_width').value),
            lanes: parseInt(document.getElementById('road_lanes').value),
            terrain: document.getElementById('road_terrain').value,
            geographicZone: document.getElementById('road_zone').value,
            nearestTownKm: parseFloat(document.getElementById('road_town_dist').value),
            accessories
        };

        try {
            const response = await client.post('/road-estimation/calculate', payload);
            const result = response.data;
            
            // Add UI state tracking
            this.wizardState.roadEstimatePreview = {
                ...result,
                layers: (result.layers || []).map(l => ({...l, approved: true})),
                accessories: (result.accessories || []).map(a => ({...a, approved: true}))
            };

            this.renderBudgetReceipt();
            this.saveWizardCache(); // Save preview data to cache
        } catch (error) {
            console.error('Estimation generation failed:', error);
            window.toast.show('Failed to run parametric estimation', 'error');
        } finally {
            document.getElementById('estimation-loader').style.display = 'none';
        }
    },
    
    formatMWK(value) {
        if (value === undefined || value === null || isNaN(value)) return 'MWK 0';
        
        const formatter = new Intl.NumberFormat('en-MW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        
        if (value >= 1_000_000_000) {
            return `MWK ${(value / 1_000_000_000).toFixed(2)}B`;
        } else if (value >= 1_000_000) {
            return `MWK ${(value / 1_000_000).toFixed(2)}M`;
        } else if (value >= 1_000) {
            return `MWK ${(value / 1_000).toFixed(1)}Th`;
        } else {
            return `MWK ${formatter.format(value)}`;
        }
    },

    formatMWKFull(value) {
        if (value === undefined || value === null || isNaN(value)) return 'MWK 0';
        return 'MWK ' + new Intl.NumberFormat('en-MW', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    },

    renderBudgetReceipt() {
        const container = document.getElementById('estimation-receipt-container');
        if (!container || !this.wizardState.roadEstimatePreview) return;

        const est = this.wizardState.roadEstimatePreview;
        
        // Calculate dynamic approved total based on toggles
        let currentlyApprovedHigh = 0;
        let currentlyApprovedLow = 0;
        
        const renderRow = (item, index, type) => {
            if (item.approved) {
                currentlyApprovedLow += parseFloat(item.totalCostLow);
                currentlyApprovedHigh += parseFloat(item.totalCostHigh);
            }
            
            const formatter = new Intl.NumberFormat('en-MW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            
            return `
                <tr style="opacity: ${item.approved ? '1' : '0.5'}; transition: opacity 0.2s;">
                    <td>
                        <div style="font-weight:600; font-size:12px; color:var(--slate-800);">${this.escapeHTML(item.itemName || item.materialType)}</div>
                        <div style="font-size:10px; color:var(--slate-500);">${type === 'layer' ? 'Phase ' + item.phaseNumber : 'Accessory'}</div>
                    </td>
                    <td style="font-family:'JetBrains Mono'; font-size:11px;">
                        <input type="number" step="any" value="${item.totalQuantity}" 
                            style="width:80px; padding:4px 8px; border:1px solid var(--slate-300); border-radius:4px; font-weight:700; font-family:'JetBrains Mono'; font-size:11px; position:relative; z-index:5;"
                            onclick="event.stopPropagation()"
                            onchange="(window.app.pmModule || window.app.fsModule || window.app.caModule).updateItemQuantity('${type}', ${index}, this.value)">
                        ${item.unit}
                    </td>
                    <td style="font-family:'JetBrains Mono'; font-size:11px; font-weight:700; text-align:right;">
                        <span style="color:var(--slate-400); font-size:10px;">${formatter.format(item.totalCostLow)} -</span> 
                        <span style="font-weight:700; margin-left:4px;">${formatter.format(item.totalCostHigh)}</span>
                    </td>
                    <td style="text-align:right;">
                        <input type="checkbox" ${item.approved ? 'checked' : ''} 
                            style="width:18px; height:18px; accent-color:var(--emerald); cursor:pointer; position:relative; z-index:5;"
                            onclick="event.stopPropagation()"
                            onchange="(window.app.pmModule || window.app.fsModule || window.app.caModule).toggleReceiptItem('${type}', ${index})">
                    </td>
                </tr>
            `;
        };

        const layersRows = est.layers.map((l, i) => renderRow(l, i, 'layer')).join('');
        const accRows = est.accessories.map((a, i) => renderRow(a, i, 'accessory')).join('');

        this.wizardState.currentlyApprovedHigh = currentlyApprovedHigh;

        const lengthKm = est.lengthKm || parseFloat(document.getElementById('road_length')?.value) || 1;
        const dynamicCostPerMeter = currentlyApprovedHigh / (lengthKm * 1000);

        container.innerHTML = `
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--slate-200); border-radius: 8px; margin-bottom: 16px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead style="background: var(--slate-50); position: sticky; top: 0; z-index: 1; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <tr>
                            <th style="padding: 12px; text-align: left; color: var(--slate-500); font-weight: 700; font-size: 11px; text-transform: uppercase;">Line Item</th>
                            <th style="padding: 12px; text-align: left; color: var(--slate-500); font-weight: 700; font-size: 11px; text-transform: uppercase;">Quantity</th>
                            <th style="padding: 12px; text-align: right; color: var(--slate-500); font-weight: 700; font-size: 11px; text-transform: uppercase;">Est. MWK</th>
                            <th style="padding: 12px; text-align: right; color: var(--slate-500); font-weight: 700; font-size: 11px; text-transform: uppercase;">Inc.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${layersRows}
                        ${accRows}
                    </tbody>
                </table>
            </div>
            
            <div style="background: var(--slate-900); padding: 16px; border-radius: 8px; color: white; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 11px; color: var(--slate-400); text-transform: uppercase; font-weight: 700;">Approved Total (High End)</div>
                    <div id="receipt-total-high" style="font-size: 20px; font-weight: 700; font-family: 'JetBrains Mono';">${this.formatMWKFull(currentlyApprovedHigh)}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; color: var(--slate-400); text-transform: uppercase; font-weight: 700;">Cost per meter</div>
                    <div id="receipt-cost-meter" style="font-size: 14px; font-weight: 600; font-family: 'JetBrains Mono';">${this.formatMWKFull(dynamicCostPerMeter)}</div>
                </div>
            </div>
        `;

        this.checkBudgetReconciliation();
    },

    toggleReceiptItem(type, index) {
        if (!this.wizardState.roadEstimatePreview) return;
        
        const list = type === 'layer' ? this.wizardState.roadEstimatePreview.layers : this.wizardState.roadEstimatePreview.accessories;
        list[index].approved = !list[index].approved;
        
        this.renderBudgetReceipt();
    },

    updateItemQuantity(type, index, value) {
        if (!this.wizardState.roadEstimatePreview) return;
        const est = this.wizardState.roadEstimatePreview;
        const list = type === 'layer' ? est.layers : est.accessories;
        const item = list[index];
        const qty = parseFloat(value) || 0;
        
        item.totalQuantity = qty;
        item.totalCostLow = qty * (item.unitCostLow || (item.unitCostHigh * 0.7));
        item.totalCostHigh = qty * item.unitCostHigh;
        item.isManualOverride = true;
        
        // Update ONLY the cost cell for this row (don't re-render the whole table)
        const formatter = new Intl.NumberFormat('en-MW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const rowIndex = type === 'layer' ? index : est.layers.length + index;
        const rows = document.querySelectorAll('#estimation-receipt-container tbody tr');
        if (rows[rowIndex]) {
            const costCell = rows[rowIndex].querySelectorAll('td')[2]; // 3rd column = Est. MWK
            if (costCell) {
                costCell.innerHTML = `
                    <span style="color:var(--slate-400); font-size:10px;">${formatter.format(item.totalCostLow)} -</span> 
                    <span style="font-weight:700; margin-left:4px;">${formatter.format(item.totalCostHigh)}</span>
                `;
            }
        }
        
        // Recalculate approved totals without re-rendering
        let totalHigh = 0;
        let totalLow = 0;
        est.layers.forEach(l => { if (l.approved) { totalHigh += l.totalCostHigh; totalLow += l.totalCostLow; } });
        est.accessories.forEach(a => { if (a.approved) { totalHigh += a.totalCostHigh; totalLow += a.totalCostLow; } });
        
        this.wizardState.currentlyApprovedHigh = totalHigh;
        
        // Update the totals display directly by ID
        const totalDisplay = document.getElementById('receipt-total-high');
        if (totalDisplay) totalDisplay.textContent = this.formatMWKFull(totalHigh);

        const costMeterDisplay = document.getElementById('receipt-cost-meter');
        if (costMeterDisplay && est.lengthKm > 0) {
            const costPerMeter = totalHigh / (est.lengthKm * 1000);
            costMeterDisplay.textContent = this.formatMWKFull(costPerMeter);
        }
        
        this.checkBudgetReconciliation();
        this.saveWizardCache();
    },

    checkBudgetReconciliation() {
        // Prefer the Step 4 inline budget input, fall back to Step 1
        const step4Budget = document.getElementById('step4_budget');
        const projBudget = document.getElementById('proj_budget');
        const allocatedBudget = parseFloat(step4Budget?.value || projBudget?.value) || 0;
        const currentEst = this.wizardState.currentlyApprovedHigh || 0;
        const gap = currentEst - allocatedBudget;

        // Update the Approved Total display with the allocated budget
        const totalDisplay = document.getElementById('receipt-total-high');
        if (totalDisplay) totalDisplay.textContent = this.formatMWKFull(allocatedBudget);
        
        const banner = document.getElementById('budget_recon_banner');
        const icon = document.getElementById('budget_recon_icon');
        const title = document.getElementById('budget_recon_title');
        const hint = document.getElementById('budget_recon_hint');
        const indicator = document.getElementById('budget_gap_indicator');
        const nextBtn = document.getElementById('wizard-next');

        if (gap > 0) {
            // OVER BUDGET - Red styling
            if (banner) {
                banner.style.background = 'var(--red-light)';
                banner.style.borderColor = 'var(--red-hover)';
            }
            if (icon) icon.style.color = 'var(--red)';
            if (title) title.style.color = 'var(--red-dark)';
            if (hint) {
                hint.textContent = 'Toggle items off if the estimate exceeds your allocated budget.';
                hint.style.color = 'var(--red)';
            }
            if (indicator) {
                indicator.textContent = `${this.formatMWK(gap)} OVER BUDGET`;
                indicator.style.color = 'white';
                indicator.style.background = 'var(--red)';
                indicator.style.padding = '2px 8px';
                indicator.style.borderRadius = '4px';
                indicator.style.fontWeight = '700';
            }
            if (nextBtn) nextBtn.disabled = true;
        } else {
            // WITHIN BUDGET - Green styling
            if (banner) {
                banner.style.background = 'var(--emerald-light)';
                banner.style.borderColor = 'var(--emerald-hover)';
            }
            if (icon) {
                icon.className = 'fas fa-check-circle';
                icon.style.color = 'var(--emerald)';
            }
            if (title) title.style.color = 'var(--emerald-dark)';
            if (hint) {
                hint.textContent = 'The current estimate is optimized within your allocated project budget.';
                hint.style.color = 'var(--emerald-dark)';
            }
            if (indicator) {
                indicator.textContent = `WITHIN BUDGET (${this.formatMWK(Math.abs(gap))} buffer)`;
                indicator.style.color = 'white';
                indicator.style.background = 'var(--emerald)';
                indicator.style.padding = '2px 8px';
                indicator.style.borderRadius = '4px';
                indicator.style.fontWeight = '700';
            }
            if (nextBtn) nextBtn.disabled = false;
        }
    },

    updateFinalSummary() {
        const name = document.getElementById('proj_name').value;
        const typeStr = 'Road Works';
        const budget = this.wizardState.currentlyApprovedHigh || this.wizardState.formData?.budget;

        const summaryName = document.getElementById('summary_name');
        if (summaryName) summaryName.textContent = name;
        
        const summaryType = document.getElementById('summary_type');
        if (summaryType) summaryType.textContent = typeStr;
        
        const summaryBudget = document.getElementById('summary_budget');
        if (summaryBudget) summaryBudget.textContent = `MWK ${new Intl.NumberFormat().format(budget || 0)}`;

        // Smart Visibility for Edit Mode
        const btnSubmit = document.getElementById('wizard-submit');
        if (btnSubmit && this.wizardState.isEditMode) {
            btnSubmit.innerHTML = '<span>Save Changes</span> <i class="fas fa-save"></i>';
            
            // Check if anything actually changed
            const currentSnapshot = JSON.stringify(this.wizardState.formData);
            const hasChanges = currentSnapshot !== this.wizardState.originalSnapshot;
            
            btnSubmit.style.display = hasChanges ? 'flex' : 'none';
        }
    },

    async fetchSupervisors(selectId = 'proj_supervisor') {
        const select = document.getElementById(selectId);
        if (!select) return;

        try {
            select.innerHTML = '<option value="">Searching for supervisors...</option>';
            // Fetch only unassigned field supervisors
            const response = await users.getAll({ role: 'Field_Supervisor', unassigned: true });
            const data = response.data || response;
            const supervisors = Array.isArray(data) ? data : data.users || [];

            if (supervisors.length > 0) {
                select.innerHTML = '<option value="">Select Supervisor</option>' + 
                    supervisors.map(s => `<option value="${s.id}">(Available) ${s.name}</option>`).join('');
            } else {
                select.innerHTML = '<option value="">No unassigned supervisors available</option>';
            }
            
        } catch (error) {
            console.error('[DEBUG] Error fetching supervisors:', error);
            select.innerHTML = '<option value="">Error loading supervisors</option>';
        }
    },

    async handleCreateProject() {
        if (!this.validateProjectForm()) return;

        const btn = document.getElementById('wizard-submit') || document.getElementById('btn-create-project');
        const originalContent = btn ? btn.innerHTML : 'Submit';
        if(btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing...';
        }

        const data = {
            name: document.getElementById('proj_name').value,
            client: document.getElementById('proj_client').value,
            projectType: 'road_works',
            budgetTotal: this.wizardState?.currentlyApprovedHigh || parseFloat(document.getElementById('proj_budget').value),
            startDate: new Date(document.getElementById('proj_start').value).toISOString(),
            endDate: new Date(document.getElementById('proj_end').value).toISOString(),
            managerId: parseInt(document.getElementById('proj_supervisor').value),
            lat: parseFloat(document.getElementById('proj_lat').textContent),
            lng: parseFloat(document.getElementById('proj_lng').textContent),
            radius: parseInt(document.getElementById('proj_radius_input')?.value || 500)
        };

        if (!this.wizardState?.isEditMode) {
            data.status = 'planning';
            data.code = 'PROJ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        }

        try {
            let projectId;
            if (this.wizardState?.isEditMode && this.wizardState.projectId) {
                await projects.update(this.wizardState.projectId, data);
                projectId = this.wizardState.projectId;
            } else {
                const response = await client.post('/projects', data);
                projectId = response.data?.id || response.id;
            }

            
            if (this.wizardState?.isRoad && this.wizardState?.roadEstimatePreview && projectId) {
                const accBoxes = document.querySelectorAll('input[name="road_acc"]:checked');
                const accessories = Array.from(accBoxes).map(cb => cb.value);
                if (document.getElementById('acc_lighting').value) {
                    accessories.push(document.getElementById('acc_lighting').value);
                }

                const estPayload = {
                    projectId,
                    approvedTotal: this.wizardState.currentlyApprovedHigh,
                    roadType: document.getElementById('road_type').value,
                    lengthKm: parseFloat(document.getElementById('road_length').value),
                    widthM: parseFloat(document.getElementById('road_width').value),
                    lanes: parseInt(document.getElementById('road_lanes').value),
                    terrain: document.getElementById('road_terrain').value,
                    geographicZone: document.getElementById('road_zone').value,
                    nearestTownKm: parseFloat(document.getElementById('road_town_dist').value),
                    layers: this.wizardState.roadEstimatePreview.layers,
                    accessories: this.wizardState.roadEstimatePreview.accessories
                };
                
                await client.post('/road-estimation/save', estPayload);
            }

            window.toast.show(this.wizardState?.isEditMode ? 'Project updated successfully' : 'Project initialized successfully', 'success');
            this.clearWizardCache(); // Clear cache on success
            window.drawer.close();
            this.loadProjectsFromAPI(); // Refresh the list
            
        } catch (error) {
            console.error('Project creation error:', error);
            const globalErr = document.getElementById('project-form-error');
            if (globalErr) {
                globalErr.style.display = 'block';
                globalErr.textContent = error.message;
            }
            window.toast.show(error.message, 'error');
        } finally {
            if(btn) {
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        }
    }
};
