
import { toastService } from '../services/toast.service.js';

// --- NAV ---
const views = {
    'dashboard': { title: 'Fleet Overview', context: '45 Assets | 85% Utilization' },
    'registry': { title: 'Asset Registry', context: 'Master Database' },
    'tracking': { title: 'GPS Tracking', context: 'Real-Time Locations' },
    'maintenance': { title: 'Maintenance Schedule', context: 'Preventive & Corrective' },
    'costs': { title: 'Fleet Costs', context: 'Operating & Repair Expenses' },
    'utilization': { title: 'Utilization Analysis', context: 'Efficiency Reports' },
    'operators': { title: 'Operator Management', context: 'Drivers & Licenses' }
};

export function navigateTo(viewId, navElement) {
    if (navElement) { 
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active')); 
        navElement.classList.add('active'); 
    }
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');
    else {
         const dashboard = document.getElementById('view-dashboard');
         if(dashboard) dashboard.classList.add('active');
    }

    if (views[viewId]) {
        const titleEl = document.getElementById('header-title');
        const breadEl = document.getElementById('header-breadcrumb');
        const ctxEl = document.getElementById('header-context');
        
        if(titleEl) titleEl.innerText = views[viewId].title;
        if(breadEl) breadEl.innerText = views[viewId].title;
        if(ctxEl) ctxEl.innerHTML = `<span class="context-value">${views[viewId].context}</span>`;
    }
}

// --- DRAWER ---
export function openDrawer(type, id) {
    const overlay = document.getElementById('drawer-overlay');
    const title = document.getElementById('d-title');
    const sub = document.getElementById('d-sub');
    const body = document.getElementById('d-body');
    const footer = document.getElementById('d-footer');

    overlay.classList.add('show');

    if (type === 'checkout') {
        // --- CHECK-OUT ASSET ---
        if(sub) sub.innerText = "Operations";
        if(title) title.innerText = "Assign Equipment";
        if(body) body.innerHTML = `
    <div class="drawer-section">
        <div class="form-group"><label class="form-label">Select Equipment</label><select class="form-input"><option>EQP-045 Excavator</option><option>EQP-012 Tipper</option></select></div>
        <div class="form-group"><label class="form-label">Assign To (Project)</label><select class="form-input"><option>CEN-01 Unilia Library</option><option>MZ-05 Clinic</option></select></div>
        <div class="form-group"><label class="form-label">Responsible User</label><select class="form-input"><option>John Banda (PM)</option><option>Peter Phiri</option></select></div>
        <div class="form-group"><label class="form-label">Expected Return</label><input type="date" class="form-input"></div>
    </div>
    <div class="drawer-section" style="background: #F8FAFC;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: var(--slate-700);">GPS Validation</span>
            <span class="status active"><i class="fas fa-satellite-dish"></i> Signal Locked</span>
        </div>
        <div style="font-size: 11px; color: var(--slate-500); margin-top: 4px;">Current Loc: -13.9626, 33.7741 (HQ Yard)</div>
    </div>
`;
        if(footer) footer.innerHTML = `<button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button><button class="btn btn-primary" style="flex:2;" onclick="closeDrawer()">Confirm Handover</button>`;

    } else if (type === 'asset') {
        // --- ASSET DETAILS ---
        if(sub) sub.innerText = "Registry";
        if(title) title.innerText = id + ": Caterpillar 320D";
        if(body) body.innerHTML = `
    <div class="drawer-section">
        <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
            <div><div class="stat-label">Serial Number</div><div class="mono-val">CAT-8892-XJ</div></div>
            <div><div class="stat-label">Purchase Date</div><div style="font-weight:600;">Jan 2024</div></div>
            <div><div class="stat-label">Hours</div><div class="mono-val">248 Hrs</div></div>
            <div><div class="stat-label">Status</div><span class="status active">In Use</span></div>
        </div>
    </div>
    <div class="drawer-section">
        <div class="stat-label" style="margin-bottom: 8px;">Maintenance History</div>
        <table style="font-size: 11px;">
            <thead><tr><th>Date</th><th>Type</th><th>Cost</th></tr></thead>
            <tbody>
                <tr><td>Dec 10, 2025</td><td>Hydraulic Check</td><td>MWK 150,000</td></tr>
                <tr><td>Oct 05, 2025</td><td>500hr Service</td><td>MWK 450,000</td></tr>
            </tbody>
        </table>
    </div>
`;
        if(footer) footer.innerHTML = `<button class="btn btn-secondary" style="width:100%" onclick="closeDrawer()">View Full History</button>`;

    } else if (type === 'maintenance') {
        // --- SCHEDULE MAINTENANCE ---
        if(sub) sub.innerText = "Service";
        if(title) title.innerText = "Schedule Maintenance";
        if(body) body.innerHTML = `
    <div class="drawer-section">
        <div class="form-group"><label class="form-label">Equipment</label><select class="form-input"><option>EQP-045 Excavator</option></select></div>
        <div class="form-group"><label class="form-label">Service Type</label><select class="form-input"><option>Preventive (Scheduled)</option><option>Corrective (Repair)</option></select></div>
        <div class="form-group"><label class="form-label">Service Provider</label><input type="text" class="form-input" value="Malawi Equip. Services"></div>
        <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input"></div>
    </div>
`;
        if(footer) footer.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="closeDrawer()">Create Work Order</button>`;
    } else if (type === 'add_asset') {
        // --- ADD NEW ASSET ---
        if(sub) sub.innerText = "Registry";
        if(title) title.innerText = "Register New Asset";
        if(body) body.innerHTML = `
    <div class="drawer-section">
        <div class="form-group"><label class="form-label">Equipment Name</label><input type="text" class="form-input" placeholder="e.g. Komatsu Grader"></div>
        <div class="form-group"><label class="form-label">Category</label><select class="form-input"><option>Heavy Machinery</option><option>Vehicle</option><option>Generator</option></select></div>
        <div class="form-group"><label class="form-label">Serial Number</label><input type="text" class="form-input"></div>
        <div class="form-group"><label class="form-label">Purchase Date</label><input type="date" class="form-input"></div>
        <div class="form-group"><label class="form-label">Purchase Cost (MWK)</label><input type="number" class="form-input"></div>
    </div>
`;
        if(footer) footer.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="closeDrawer()">Save to Registry</button>`;
    }
}

export function closeDrawer() { 
    const overlay = document.getElementById('drawer-overlay');
    if(overlay) overlay.classList.remove('show'); 
}

// --- NOTIFICATION & PROFILE ---
export function toggleNotifications() {
     const dropdown = document.getElementById('notify-dropdown');
     if(dropdown) {
         dropdown.classList.toggle('show');
         const list = document.getElementById('notify-list');
         if(list && list.children.length === 0) list.innerHTML = '<div class="notify-item unread"><div class="notify-icon"><i class="fas fa-tools"></i></div><div class="notify-content"><div class="notify-title">Maintenance Due</div><div class="notify-desc">Excavator EQP-045 due for service.</div></div></div>';
     }
}

export function openProfileDrawer() {
    const el = document.getElementById('profile-overlay');
    if(el) el.classList.add('show');
}

export function closeProfileDrawer() {
    const el = document.getElementById('profile-overlay');
    if(el) el.classList.remove('show');
}

// Global Bindings
window.navigateTo = navigateTo;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.toggleNotifications = toggleNotifications;
window.openProfileDrawer = openProfileDrawer;
window.closeProfileDrawer = closeProfileDrawer;
window.toastService = toastService;

// Init
document.addEventListener('click', (e) => {
    // Drawer click outside (handled in HTML via onclick, but we can enforce)
    const overlay = document.getElementById('drawer-overlay');
    if(overlay && e.target === overlay) closeDrawer();
    
    // Notification click outside
    const wrapper = document.querySelector('.notification-wrapper');
    const dropdown = document.getElementById('notify-dropdown');
    if (wrapper && dropdown && dropdown.classList.contains('show') && !wrapper.contains(e.target)) {
         dropdown.classList.remove('show');
    }
});

// Seed badge
document.addEventListener('DOMContentLoaded', () => {
    const badge = document.getElementById('notify-badge');
    if(badge) {
        badge.classList.add('active');
        badge.innerText = '1';
    }
});
