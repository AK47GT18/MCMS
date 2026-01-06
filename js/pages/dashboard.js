/**
 * Dashboard Page Logic
 * Handles View Switching, Charts, Drawer Interaction, and Gantt
 */

import { notificationService } from '../services/notification.service.js';

// State
const views = {
    'portfolio': { title: 'Project Controls', context: '4 Active Projects' },
    'gantt': { title: 'Master Schedule', context: 'Timeline View (CEN-01 Focus)' },
    'budget': { title: 'Budget Control', context: 'Financial Variance Analysis' },
    'teams': { title: 'Field Personnel', context: '3 Active Sites | 42 Total Staff' },
    'risks': { title: 'Risk Management', context: 'Active Risk Register' },
    'requests': { title: 'Resource Requests', context: 'Budget & Equipment' },

    'reports': { title: 'Documents & Reports', context: 'Repository' },
    'analytics': { title: 'Analytics Dashboard', context: 'Real-time Performance Metrics' }
};

const logData = {
    'LOG-001': {
        project: 'Unilia Library Complex',
        supervisor: 'John Banda',
        date: 'Today, 08:30 AM',
        location: 'Sector 4 (-13.98, 33.78)',
        summary: 'Excavated 50 meters of trenching. Encountered minor rock obstruction but cleared. 15 bags cement received.',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000&auto=format&fit=crop',
        materials: ['Cement: 15 Bags', 'Sand: 2 Tons'],
        labor: '12 General, 2 Skilled'
    }
};

// --- NAVIGATION ---
export function navigateTo(viewId, navElement) {
    // 1. Sidebar Active State
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    if (navElement) navElement.classList.add('active');
    // If called without element (programmatically), find it by onclick attr containing the viewId
    else {
        const link = document.querySelector(`.nav-link[onclick*="'${viewId}'"]`);
        if(link) link.classList.add('active');
    }

    // 2. Show View
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');

    // 3. Update Header
    if (views[viewId]) {
        const titleEl = document.getElementById('header-title');
        const breadEl = document.getElementById('header-breadcrumb');
        const ctxEl = document.getElementById('header-context');
        
        if(titleEl) titleEl.innerText = views[viewId].title;
        if(breadEl) breadEl.innerText = views[viewId].title;
        if(ctxEl) ctxEl.innerHTML = `<span class="context-value">${views[viewId].context}</span>`;
    }

    // Analytics Hook
    if (viewId === 'analytics') {
        setTimeout(renderAnalytics, 50);
    }
}

// --- DRAWER ---
export function openDrawer(id) {
    const overlay = document.getElementById('drawer-overlay');
    const dBody = document.getElementById('drawer-body');
    const dTitle = document.getElementById('d-title');
    const dFooter = document.getElementById('drawer-footer');
    const dId = document.getElementById('d-id');

    if(!overlay || !dBody) return;

    overlay.classList.add('show');

    if (id === 'new_project') {
        // WIZARD
        if(dTitle) dTitle.innerText = "Initialize New Project";
        if(dId) dId.innerText = "WIZARD";
        
        // Render Wizard HTML
        dBody.innerHTML = `
            <div class="wizard-stepper">
                <div class="step-dot active" id="dot-1"></div>
                <div class="step-dot" id="dot-2"></div>
                <div class="step-dot" id="dot-3"></div>
            </div>

            <div id="step-1" class="step-content active">
                <div class="form-group"><label class="form-label">Project Name</label><input class="form-input" id="wiz-name" type="text" placeholder="e.g. Unilia Library Complex"></div>
                <div class="form-group"><label class="form-label">Project Code</label><input class="form-input" id="wiz-code" type="text" placeholder="e.g. CEN-01"></div>
                <div class="form-group"><label class="form-label">Client / Beneficiary</label><select class="form-input"><option>Ministry of Education</option><option>Private Sector</option></select></div>
                <div class="form-group"><label class="form-label">Project Manager</label><input class="form-input" type="text" value="Arthony (You)" disabled style="background:var(--slate-50);"></div>
            </div>

            <div id="step-2" class="step-content">
                <div class="form-group">
                    <label class="form-label">Project Location (Click Map)</label>
                    <div class="map-container" id="wiz-map" onclick="placePin(event)">
                        <div class="map-bg"></div>
                        <i class="fas fa-map-marker-alt map-pin" id="wiz-pin" style="display:none; top:50%; left:50%;"></i>
                    </div>
                </div>
                <div style="display:flex; gap:12px;">
                    <div class="form-group" style="flex:1;"><label class="form-label">Latitude</label><input class="form-input" id="wiz-lat" type="text" readonly placeholder="-13.98"></div>
                    <div class="form-group" style="flex:1;"><label class="form-label">Longitude</label><input class="form-input" id="wiz-long" type="text" readonly placeholder="33.78"></div>
                </div>
                <div class="form-group"><label class="form-label">Site Address</label><input class="form-input" type="text" placeholder="Nearest landmark..."></div>
            </div>

            <div id="step-3" class="step-content">
                <div class="form-group"><label class="form-label">Total Grant / Budget (MWK)</label><input class="form-input" type="number" placeholder="500,000,000"></div>
                <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" type="date"></div>
                <div style="background:var(--orange-light); padding:16px; border-radius:6px; border:1px solid var(--orange); color:var(--orange-dark); font-size:12px;">
                    <i class="fas fa-info-circle"></i> Initial budget lines will be auto-generated based on the 'Standard Construction' template.
                </div>
            </div>
        `;
        
        updateFooter(1);

    } else if (id === 'risk_log') {
        if(dTitle) dTitle.innerText = "Log New Risk";
        if(dId) dId.innerText = "RSK-NEW";
        if(dFooter) dFooter.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="closeDrawer()">Save Risk</button>`;
        dBody.innerHTML = `
            <div class="drawer-section">
                <div class="form-group"><label class="form-label">Risk Description</label><input class="form-input" type="text" placeholder="Short description of risk"></div>
                <div class="form-group"><label class="form-label">Impact Level</label><select class="form-input"><option>High</option><option>Medium</option><option>Low</option></select></div>
                <div class="form-group"><label class="form-label">Probability</label><select class="form-input"><option>High</option><option>Medium</option><option>Low</option></select></div>
                <div class="form-group"><label class="form-label">Mitigation Strategy</label><input class="form-input" type="text" placeholder="Plan to reduce impact"></div>
            </div>`;
    } else if (id === 'request_budget') {
        // ... (Omitting full copy for brevity, same pattern)
        if(dTitle) dTitle.innerText = "Budget Reallocation Request";
        if(dId) dId.innerText = "REQ-NEW";
        if(dFooter) dFooter.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="closeDrawer()">Submit Request</button>`;
        dBody.innerHTML = `<div class="drawer-section"><p>Budget request form here...</p></div>`; // Simplified for now
    } else if (id === 'budget_variation') {
        if(dTitle) dTitle.innerText = "Request Budget Variation";
        if(dId) dId.innerText = "VAR-REQ";
        if(dFooter) dFooter.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="submitVariation()">Send to Finance</button>`;
        dBody.innerHTML = `
            <div class="drawer-section">
                <div class="form-group"><label class="form-label">Variation Amount (MWK)</label><input class="form-input" type="number" placeholder="5,000,000"></div>
                <div class="form-group"><label class="form-label">Reason</label><textarea class="form-input" rows="3" placeholder="Explain cost overrun..."></textarea></div>
            </div>`;
    } else {
        // LOG VERIFICATION (Default)
        const data = logData['LOG-001'];
        if(dId) dId.innerText = id;
        if(dTitle) dTitle.innerText = "Daily Log Review";
        if(dFooter) dFooter.innerHTML = `
             <button class="btn btn-secondary" style="flex: 1; color: var(--red); border-color: var(--slate-200);" onclick="closeDrawer()">Reject</button>
             <button class="btn btn-primary" style="flex: 1;" onclick="closeDrawer()">Approve Progress</button>
        `;

        dBody.innerHTML = `
            <div class="drawer-section">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <div><div style="font-size:11px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Supervisor</div><div style="font-weight:600;">${data.supervisor}</div></div>
                    <div style="text-align:right;"><div style="font-size:11px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Timestamp</div><div style="font-weight:600;">${data.date}</div></div>
                </div>
                <div class="evidence-photo"><img src="${data.photoUrl}" alt="Site Evidence" style="width:100%; border-radius:6px; margin-bottom:8px;"></div>
                <p style="font-size:13px; color:var(--slate-600); line-height:1.5; background:var(--slate-50); padding:12px; border-radius:6px;">"${data.summary}"</p>
            </div>
        `;
    }
}

export function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('show');
}

// --- WIZARD LOGIC ---
function updateFooter(step) {
    const dFooter = document.getElementById('drawer-footer');
    if(!dFooter) return;
    
    let btns = '';
    if(step === 1) {
        btns = `<button class="btn btn-secondary" onclick="closeDrawer()">Cancel</button>
                <button class="btn btn-primary" onclick="nextStep(2)">Next: Location <i class="fas fa-arrow-right"></i></button>`;
    } else if(step === 2) {
        btns = `<button class="btn btn-secondary" onclick="nextStep(1)">Back</button>
                <button class="btn btn-primary" onclick="nextStep(3)">Next: Budget <i class="fas fa-arrow-right"></i></button>`;
    } else {
        btns = `<button class="btn btn-secondary" onclick="nextStep(2)">Back</button>
                <button class="btn btn-primary" onclick="closeDrawer()">Create Project <i class="fas fa-check"></i></button>`;
    }
    dFooter.innerHTML = btns;
}

export function nextStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('step-' + step).classList.add('active');
    
    document.querySelectorAll('.step-dot').forEach((el, idx) => {
        el.className = 'step-dot';
        if(idx + 1 === step) el.classList.add('active');
        if(idx + 1 < step) el.classList.add('completed');
    });
    updateFooter(step);
}

export function placePin(e) {
    if (e.target.id === 'wiz-pin') return; 
    const rect = e.currentTarget.getBoundingClientRect(); // Use currentTarget for container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const pin = document.getElementById('wiz-pin');
    pin.style.display = 'block';
    pin.style.left = x + 'px';
    pin.style.top = y + 'px';
    
    // Mock coords
    const lat = (-13.98).toFixed(4);
    const long = (33.78).toFixed(4);
    
    document.getElementById('wiz-lat').value = lat;
    document.getElementById('wiz-long').value = long;
}

// --- GANTT & ACTIONS ---
export function addTaskToGantt() {
    notificationService.add('success', 'Task Created', 'Gantt chart updated.');
    closeDrawer();
}

export function submitVariation() {
    notificationService.add('success', 'Request Sent', 'Variation Request (VAR-REQ) forwarded to Finance Director.');
    closeDrawer();
}

export function switchTab(el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

export function openProfileDrawer() {
    const el = document.getElementById('profile-overlay');
    if(el) el.classList.add('show');
}

export function closeProfileDrawer() {
    const el = document.getElementById('profile-overlay');
    if(el) el.classList.remove('show');
}


// --- GLOBAL BINDINGS ---
// Critical for HTML onclick attributes to work with Modules
window.navigateTo = navigateTo;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.nextStep = nextStep;
window.placePin = placePin;
window.addTaskToGantt = addTaskToGantt;
window.submitVariation = submitVariation;
window.switchTab = switchTab;
window.openProfileDrawer = openProfileDrawer;
window.closeProfileDrawer = closeProfileDrawer;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Bind overlays closing
    const dO = document.getElementById('drawer-overlay');
    if(dO) dO.addEventListener('click', (e) => { if(e.target===dO) closeDrawer(); });

    const pO = document.getElementById('profile-overlay');
    if(pO) pO.addEventListener('click', (e) => { if(e.target===pO) closeProfileDrawer(); });

    // Profile triggers
    document.querySelectorAll('.user-profile').forEach(el => {
        el.addEventListener('click', openProfileDrawer);
    });

    // Init Logic (Budget Health etc)
    updateBudgetHealth();
});

function updateBudgetHealth() {
    document.querySelectorAll('.progress-bar').forEach(bar => {
        const widthStyle = bar.style.width;
        if(!widthStyle) return;
        const pct = parseInt(widthStyle);
        if(pct >= 90) bar.style.backgroundColor = 'var(--red)';
        else if(pct >= 80) bar.style.backgroundColor = 'var(--orange)';
        else bar.style.backgroundColor = 'var(--emerald)';
    });
}

// --- CHARTS ---
let charts = {};

function renderAnalytics() {
    console.log("Rendering Analytics...");

    // Return if Chart.js is not loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }

    // Common Config
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748B';
    
    // 1. Budget Variance (Bar)
    renderChart('chart-budget', 'bar', {
        labels: ['CEN-01', 'MZ-05', 'LIL-02', 'SAL-09'],
        datasets: [
            { label: 'Budget', data: [450, 120, 85, 200], backgroundColor: '#E2E8F0' },
            { label: 'Actual', data: [145, 110, 60, 45], backgroundColor: '#0F172A' }
        ]
    }, { scales: { y: { beginAtZero: true } } });

    // 2. Project Progress (Doughnut)
    renderChart('chart-progress', 'doughnut', {
        labels: ['Complete', 'In Progress', 'Delayed', 'Not Started'],
        datasets: [{
            data: [15, 35, 10, 40],
            backgroundColor: ['#10B981', '#3B82F6', '#EF4444', '#E2E8F0'],
            borderWidth: 0
        }]
    }, { cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } });

    // 3. Resource Allocation (Pie/Polar)
    renderChart('chart-resources', 'polarArea', {
        labels: ['Labor', 'Materials', 'Equipment', 'Services'],
        datasets: [{
            data: [45, 30, 15, 10],
            backgroundColor: ['#F97316', '#3B82F6', '#8B5CF6', '#10B981']
        }]
    }, { plugins: { legend: { display: false } } });

    // 4. Risks (Radar)
    renderChart('chart-risks', 'radar', {
        labels: ['Safety', 'Cost', 'Schedule', 'Quality', 'Env'],
        datasets: [{
            label: 'Risk Exposure',
            data: [2, 4, 3, 1, 2],
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: '#EF4444',
            pointBackgroundColor: '#EF4444'
        }]
    }, { scales: { r: { beginAtZero: true, suggestedMax: 5 } } });
    
    // 5. Trend Line
    renderChart('chart-trends', 'line', {
        labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            { 
                label: 'Efficiency Index', 
                data: [85, 88, 87, 92, 90, 94],
                borderColor: '#10B981',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            },
            { 
                label: 'Cost Variance', 
                data: [5, 4, 6, 3, 5, 2],
                borderColor: '#F97316',
                tension: 0.4,
                borderDash: [5, 5]
            }
        ]
    }, { maintainAspectRatio: false });
}

function renderChart(id, type, data, options = {}) {
    const ctx = document.getElementById(id);
    if(!ctx) return;
    
    // Destroy existing
    if(charts[id]) charts[id].destroy();

    charts[id] = new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            ...options
        }
    });
}
