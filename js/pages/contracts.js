
import { toastService } from '../services/toast.service.js';

// --- DRAWER LOGIC ---
export function openDrawer(type, id) {
    const overlay = document.getElementById('drawer-overlay');
    const title = document.getElementById('d-title');
    const sub = document.getElementById('d-id');
    const body = document.getElementById('drawer-body');
    const footer = document.getElementById('drawer-footer');

    overlay.classList.add('show');
    sub.innerText = id || "NEW";

    if (type === 'create_contract') {
        // --- CREATE CONTRACT ---
        sub.innerText = "Lifecycle Management";
        title.innerText = "Create New Contract";

        body.innerHTML = `
            <div class="drawer-section">
                <div class="form-group"><label class="form-label">Project</label><select class="form-input"><option>CEN-01 Unilia</option></select></div>
                <div class="form-group"><label class="form-label">Vendor/Client</label><select class="form-input"><option>Mkaka Ltd</option></select></div>
                <div class="form-group"><label class="form-label">Contract Type</label><select class="form-input"><option>Main Works</option><option>Supply</option></select></div>
                <div class="form-group"><label class="form-label">Value (MWK)</label><input class="form-input" type="number"></div>
                <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" type="date"></div>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button>
            <button class="btn btn-primary" style="flex:2;" onclick="closeDrawer(); toastService.add('success', 'Contract Created', 'New contract record has been initialized.');">Create Record</button>
        `;

    } else if (type === 'upload') {
        // --- UPLOAD AMENDMENT ---
        sub.innerText = "Version Control";
        title.innerText = "Upload Amendment for " + id;

        body.innerHTML = `
            <div class="drawer-section">
                <div class="form-group"><label class="form-label">Amendment Type</label><select class="form-input"><option>Variation Order</option><option>Addendum</option></select></div>
                <div class="form-group"><label class="form-label">Change Description</label><textarea class="form-input" rows="3"></textarea></div>
                <div class="form-group"><label class="form-label">Financial Impact</label><input class="form-input" type="number" placeholder="+/- Amount"></div>
                 <div class="form-group">
                    <label class="form-label">Document Upload</label>
                    <div style="border:2px dashed var(--slate-300); padding:20px; text-align:center; border-radius:6px; color:var(--slate-500);">
                       <i class="fas fa-file-pdf" style="font-size:24px; margin-bottom:8px;"></i><br>Drag PDF here
                    </div>
                </div>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button>
            <button class="btn btn-primary" style="flex:2;" onclick="closeDrawer(); toastService.add('success', 'Amendment Uploaded', 'New version has been saved.');">Save New Version</button>
        `;
    } else if (type === 'milestone_add') {
        // --- ADD MILESTONE ---
        sub.innerText = "Tracker";
        title.innerText = "Add Critical Milestone";

        body.innerHTML = `
            <div class="drawer-section">
                <div class="form-group"><label class="form-label">Contract</label><select class="form-input"><option>CEN-01 Unilia</option></select></div>
                <div class="form-group"><label class="form-label">Milestone Name</label><input type="text" class="form-input" placeholder="e.g. Structure Complete"></div>
                <div class="form-group"><label class="form-label">Due Date</label><input type="date" class="form-input"></div>
                <div class="form-group"><label class="form-label">Linked Payment (%)</label><input type="number" class="form-input" placeholder="10"></div>
                <div class="form-group"><label class="form-label">Deliverables</label><textarea class="form-input" rows="2"></textarea></div>
            </div>
        `;
        footer.innerHTML = `
            <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button>
            <button class="btn btn-primary" style="flex:2;" onclick="closeDrawer(); toastService.add('success', 'Milestone Added', 'Payment tracking updated.');">Set Milestone</button>
        `;
    }
}

export function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('show');
}

// --- PROFILE DRAWER ---
export function openProfileDrawer() {
    document.getElementById('profile-overlay').classList.add('show');
}

export function closeProfileDrawer() {
    document.getElementById('profile-overlay').classList.remove('show');
}

// --- NAVIGATION ---
export function navigateTo(viewId, navElement) {
    // 1. Update Sidemenu
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    if (navElement) {
        navElement.classList.add('active');
    }

    // 2. Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

    // 3. Show target view
    const target = document.getElementById('view-' + viewId);
    if (target) {
        target.classList.add('active');
        // Update Header
        const headerTitle = document.getElementById('header-title');
        const headerBread = document.getElementById('header-breadcrumb');

        if (viewId === 'contracts') {
            headerTitle.innerText = "Contract Management";
            headerBread.innerText = "Contracts";
        } else if (viewId === 'compliance') {
            headerTitle.innerText = "Compliance & Insurance";
            headerBread.innerText = "Compliance";
        } else if (viewId === 'milestones') {
            headerTitle.innerText = "Milestone Tracker";
            headerBread.innerText = "Milestones";
        }
    }
}

// Global Bindings
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.openProfileDrawer = openProfileDrawer;
window.closeProfileDrawer = closeProfileDrawer;
window.navigateTo = navigateTo;
window.toastService = toastService;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Close Drawer when clicking outside
    document.getElementById('drawer-overlay').addEventListener('click', function (e) {
        if (e.target === this) closeDrawer();
    });

    // Initialize Notifications


    // Close notifications on click outside

});
