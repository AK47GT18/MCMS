
import { toastService } from '../services/toast.service.js';

// --- STATE ---
let gpsFailMode = false;
let currentStep = 1;
const totalSteps = 5;

// --- NAVIGATION ---
export function navigateTo(viewId, navElement) {
    // 1. Sidebar Active State
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    if (navElement) {
        navElement.classList.add('active');
    } else {
        // Try to find sidebar link matching this view
        const sidebarItem = document.getElementById('sidebar-' + viewId);
        if (sidebarItem) sidebarItem.classList.add('active');
    }

    // 2. View Switching
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none'); // fs.html uses display:none/block
    const target = document.getElementById('view-' + viewId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active'); // Keep class for consistency
    }

    // 3. Mobile Bottom Nav (Specific to Field Page)
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const bottomNavItem = document.getElementById('nav-' + viewId);
    if (bottomNavItem) bottomNavItem.classList.add('active');
}

// --- DRAWER LOGIC ---
export function openDrawer(type, id) {
    const overlay = document.getElementById('drawer-overlay');
    const title = document.getElementById('d-title');
    const body = document.getElementById('d-body');

    overlay.classList.add('show');

    if (type === 'report') {
        if(title) title.innerText = "Daily Site Report";
        if(body) body.innerHTML = `
            <!-- WIZARD HEADER -->
            <div class="step-indicator">
                <div class="step-dot active" id="dot-1"></div>
                <div class="step-dot" id="dot-2"></div>
                <div class="step-dot" id="dot-3"></div>
                <div class="step-dot" id="dot-4"></div>
                <div class="step-dot" id="dot-5"></div>
            </div>

            <!-- STEP 1: PROGRESS -->
            <div class="wizard-step active" id="step-1">
                <div class="form-group">
                    <label class="form-label">Step 1: Work Progress</label>
                    <textarea class="form-input" rows="5" placeholder="Detailed description of works (e.g., Excavated trenches A1-A4)..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Completion Estimate (%)</label>
                    <input type="range" style="width: 100%; margin-top: 8px;" oninput="document.getElementById('pct-val').innerText = this.value + '%'">
                    <div style="text-align: right; font-weight: 700; color: var(--orange);" id="pct-val">50%</div>
                </div>
            </div>

            <!-- STEP 2: RESOURCES -->
            <div class="wizard-step" id="step-2">
                <label class="form-label">Step 2: Material Usage</label>
                <div class="form-group" style="background:var(--slate-50); padding:8px; border-radius:6px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Cement (Bags)</span><input type="number" class="form-input" style="width:60px; padding:4px;" value="0"></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Sand (Tons)</span><input type="number" class="form-input" style="width:60px; padding:4px;" value="0"></div>
                    <div style="display:flex; justify-content:space-between;"><span>Aggregates</span><input type="number" class="form-input" style="width:60px; padding:4px;" value="0"></div>
                </div>
                <label class="form-label">Equipment Hours</label>
                <div class="form-group" style="background:var(--slate-50); padding:8px; border-radius:6px;">
                     <div style="font-size:11px; color:var(--slate-500); margin-bottom:4px;">Excavator (CAT-320)</div>
                     <input type="number" class="form-input" placeholder="Hours Run">
                </div>
            </div>

            <!-- STEP 3: TEAM -->
            <div class="wizard-step" id="step-3">
                 <label class="form-label">Step 3: Labor Attendance</label>
                 <div class="form-group">
                    <label class="form-label">Skilled Labor</label>
                    <input type="number" class="form-input" value="4">
                </div>
                <div class="form-group">
                    <label class="form-label">General Labor</label>
                    <input type="number" class="form-input" value="12">
                </div>
                <div class="form-group">
                    <label class="form-label">Safety Incident?</label>
                    <select class="form-input"><option>No Incidents</option><option>Minor Injury</option><option>Near Miss</option></select>
                </div>
            </div>

            <!-- STEP 4: CONDITIONS -->
            <div class="wizard-step" id="step-4">
                 <label class="form-label">Step 4: Site Conditions</label>
                 <div class="form-group">
                    <label class="form-label">Weather</label>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary active" style="flex:1;">Sunny</button>
                        <button class="btn btn-secondary" style="flex:1;">Rain</button>
                        <button class="btn btn-secondary" style="flex:1;">Cloudy</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Delays / Issues</label>
                    <textarea class="form-input" rows="3" placeholder="Any blockers?"></textarea>
                </div>
            </div>

            <!-- STEP 5: VERIFY -->
            <div class="wizard-step" id="step-5">
                 <label class="form-label">Step 5: Validation</label>
                 <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 6px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;" id="gps-status-box">
                    <span style="font-weight: 600; color: var(--slate-600); font-size: 12px;">GPS Check</span>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-secondary" style="padding: 2px 6px; font-size:9px; height:20px;" onclick="toggleGPSFail()">Simulate Error</button>
                        <span class="gps-badge" id="gps-badge"><i class="fas fa-check"></i> -13.98, 33.78</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Photo Evidence</label>
                    <div class="photo-zone" onclick="alert('Camera Launched')">
                        <i class="fas fa-camera" style="font-size: 24px; margin-bottom: 8px;"></i>
                        <div style="font-weight: 600;">Tap to Capture</div>
                    </div>
                </div>
            </div>

            <!-- NAVIGATION -->
            <div class="wizard-nav">
                <button class="btn btn-secondary" id="prev-btn" style="visibility:hidden;" onclick="changeStep(-1)">Back</button>
                <button class="btn btn-primary" id="next-btn" onclick="changeStep(1)">Next: Resources</button>
                <button class="btn btn-primary" id="submit-btn" style="display:none;" onclick="submitReport()">Submit Report</button>
            </div>
        `;
        // Reset Wizard State
        currentStep = 1;
        
    } else if (type === 'material') {
        if(title) title.innerText = "Material Log";
        if(body) body.innerHTML = `
            <div class="form-group">
                <label class="form-label">Action Type</label>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary" style="flex:1;">Usage (Consumed)</button>
                    <button class="btn btn-secondary" style="flex:1;">Delivery (Received)</button>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Material Category</label>
                <select class="form-input"><option>Cement (Bags)</option><option>Sand (Tons)</option></select>
            </div>
            <div class="form-group">
                <label class="form-label">Quantity</label>
                <input type="number" class="form-input" placeholder="0">
            </div>
            <button class="btn btn-primary" onclick="closeDrawer()">Save Record</button>
        `;
    } else if (type === 'attendance') {
        if(title) title.innerText = "Worker Attendance";
        if(body) body.innerHTML = `
            <div class="form-group"><label class="form-label">General Labor</label><input type="number" class="form-input" value="12"></div>
            <div class="form-group"><label class="form-label">Skilled Labor</label><input type="number" class="form-input" value="2"></div>
            <div class="form-group"><label class="form-label">Absentee Notes</label><input type="text" class="form-input" placeholder="Name/Reason"></div>
            <button class="btn btn-primary" onclick="closeDrawer()">Update Register</button>
        `;
    } else if (type === 'incident') {
        if(title) title.innerText = "Report Incident";
        if(body) body.innerHTML = `
            <div style="background: #FEF2F2; color: #B91C1C; padding: 12px; border-radius: 6px; font-size: 12px; margin-bottom: 16px;">
                <i class="fas fa-triangle-exclamation"></i> This will immediately alert the Project Manager and Safety Officer.
            </div>
            <div class="form-group"><label class="form-label">Type</label><select class="form-input"><option>Injury</option><option>Near Miss</option><option>Property Damage</option></select></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-input" rows="3"></textarea></div>
            <div class="form-group"><label class="form-label">Witnesses</label><input class="form-input" type="text" placeholder="Names / Contact"></div>
            <div class="photo-zone"><i class="fas fa-camera"></i> Capture Scene</div>
            <button class="btn btn-primary" style="background: var(--red); border-color: var(--red);" onclick="closeDrawer()">Submit Alert</button>
        `;
    }
}

export function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('show');
}

// --- WIZARD LOGIC ---
export function changeStep(dir) {
    // Hide current
    const currStepEl = document.getElementById('step-' + currentStep);
    const currDotEl = document.getElementById('dot-' + currentStep);
    if(currStepEl) currStepEl.classList.remove('active');
    if(currDotEl) currDotEl.classList.remove('active');
    
    // Mark completed if moving forward
    if(currDotEl && dir > 0) currDotEl.classList.add('completed');
    
    currentStep += dir;
    
    // Show new
    const nextStepEl = document.getElementById('step-' + currentStep);
    const nextDotEl = document.getElementById('dot-' + currentStep);
    if(nextStepEl) nextStepEl.classList.add('active');
    if(nextDotEl) nextDotEl.classList.add('active');

    // Update Buttons
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    const sub = document.getElementById('submit-btn');

    if(prev) prev.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';

    if(currentStep === totalSteps) {
        if(next) next.style.display = 'none';
        if(sub) sub.style.display = 'block';
    } else {
        if(next) {
            next.style.display = 'block';
            // Dynamic button text
            const labels = ['', 'Resources', 'Team', 'Conditions', 'Verify'];
            if(labels[currentStep]) next.innerText = 'Next: ' + labels[currentStep];
        }
        if(sub) sub.style.display = 'none';
    }
}

// --- GPS LOGIC ---
export function toggleGPSFail() {
    gpsFailMode = !gpsFailMode;
    const badge = document.getElementById('gps-badge');
    if(!badge) return;

    if(gpsFailMode) {
        badge.style.background = '#FEE2E2';
        badge.style.color = '#991B1B';
        badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> No Signal';
    } else {
        badge.style.background = '#DCFCE7';
        badge.style.color = '#166534';
        badge.innerHTML = '<i class="fas fa-check"></i> -13.98, 33.78';
    }
}

export function submitReport() {
    if(gpsFailMode) {
        toastService.add('error', 'GPS Validation Failed', 'Coordinates are missing or outside project boundaries.');
    } else {
        toastService.add('success', 'Report Submitted', 'Daily log uploaded securely with verified geotag.');
        closeDrawer();
    }
}

// --- NOTIFICATION & PROFILE ---
export function toggleNotifications() {
     const dropdown = document.getElementById('notification-dropdown'); // Updated ID in standardization
     if(dropdown) dropdown.classList.toggle('show');
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
window.navigateTo = navigateTo;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.changeStep = changeStep;
window.toggleGPSFail = toggleGPSFail;
window.submitReport = submitReport;
window.toggleNotifications = toggleNotifications;
window.openProfileDrawer = openProfileDrawer;
window.closeProfileDrawer = closeProfileDrawer;
window.toastService = toastService;

// --- INIT ---
document.addEventListener('click', (e) => {
    // Close notifications on click outside
    const wrapper = document.querySelector('.notification-wrapper');
    const dropdown = document.getElementById('notification-dropdown');
    if (wrapper && dropdown && dropdown.classList.contains('show') && !wrapper.contains(e.target)) {
         dropdown.classList.remove('show');
    }
});
