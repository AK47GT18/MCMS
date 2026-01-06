
import { toastService } from '../services/toast.service.js';

// --- DRAWER LOGIC ---
export function openDrawer(type, id) {
    const overlay = document.getElementById('drawer-overlay');
    const title = document.getElementById('d-title');
    const sub = document.getElementById('d-sub');
    const body = document.getElementById('d-body');
    const footer = document.getElementById('d-footer');

    overlay.classList.add('show');

    if (type === 'approval') {
        // --- APPROVAL DRAWER ---
        sub.innerText = "Requisition Review";
        title.innerText = "REQ-089: Cement Purchase";

        body.innerHTML = `
            <div class="drawer-section">
                <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
                    <div><div class="stat-label">Project</div><div style="font-weight:600;">CEN-01 Unilia</div></div>
                    <div><div class="stat-label">Vendor</div><div style="font-weight:600;">Malawi Cement Co.</div></div>
                    <div><div class="stat-label">Category</div><div class="project-id">02-MAT</div></div>
                    <div><div class="stat-label">Amount</div><div class="stat-value" style="font-size:16px;">MWK 4,500,000</div></div>
                </div>
            </div>

            <div class="drawer-section">
                <div class="stat-label" style="margin-bottom:8px;">Budget Impact Analysis</div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                   <span>Current Utilization</span>
                   <span>92% -> <strong style="color:var(--red)">94.5%</strong></span>
                </div>
                <div class="budget-bar-bg">
                   <div class="budget-bar-fill" style="width:92%; float:left; border-right:2px solid white;"></div>
                   <div class="budget-bar-fill warn" style="width:2.5%; float:left;"></div>
                </div>
                <div style="font-size:11px; color:var(--slate-500); margin-top:8px;">
                   Approving this will leave <strong>MWK 11.5M</strong> remaining in this category.
                </div>
            </div>
            
            <div class="drawer-section">
                <div class="stat-label">Documents</div>
                <button class="btn btn-secondary" style="width:100%; justify-content:flex-start; margin-top:8px;"><i class="fas fa-file-pdf"></i> View Invoice #8821</button>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Request Info</button>
            <button class="btn btn-danger" style="flex:1;" onclick="closeDrawer()">Reject</button>
            <button class="btn btn-primary" style="flex:2;" onclick="closeDrawer(); toastService.add('success', 'Requisition Approved', 'Payment process initiated.');">Approve & Pay</button>
        `;

    } else if (type === 'new_bcr') {
        // --- NEW BUDGET REQUEST ---
        sub.innerText = "Governance";
        title.innerText = "Initiate Budget Change";

        body.innerHTML = `
            <div class="drawer-section">
                 <div style="background: #FFF7ED; border: 1px solid #FED7AA; color: #9A3412; padding: 12px; border-radius: 6px; font-size: 12px; margin-bottom: 20px;">
                    <strong>System Enforcer:</strong> Finance cannot modify budgets directly. This request locks the budget line until PM Approval.
                </div>
                <div class="form-group">
                    <label class="form-label">Project</label>
                    <select class="form-input"><option>CEN-01 Unilia Library</option></select>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input"><option>02-MAT Materials</option></select>
                </div>
                <div class="form-group">
                    <label class="form-label">Proposed Budget</label>
                    <input class="form-input" type="number">
                </div>
                 <div class="form-group">
                    <label class="form-label">Justification</label>
                    <textarea class="form-input" rows="3"></textarea>
                </div>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button>
            <button class="btn btn-primary" style="flex:2;" onclick="submitProposal()">Submit for Approval</button>
        `;

    } else if (type === 'transaction') {
        // --- TRANSACTION ENTRY ---
        sub.innerText = "Accounting";
        title.innerText = "Record Financial Transaction";

        body.innerHTML = `
            <div class="drawer-section">
                 <div class="form-group">
                    <label class="form-label">Transaction Type</label>
                    <div style="display:flex; gap:12px;">
                        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="radio" name="tt" checked> Expense</label>
                        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="radio" name="tt"> Income</label>
                        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="radio" name="tt"> Transfer</label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input class="form-input" type="date" value="2026-01-04">
                </div>

                <div class="form-group">
                    <label class="form-label">Project / Cost Center</label>
                    <select class="form-input"><option>CEN-01 Unilia Library</option><option>HQ Operations</option></select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Expense Category</label>
                    <select class="form-input"><option>02-MAT Materials</option><option>05-EQUIP Equipment</option></select>
                </div>

                <div class="form-group">
                    <label class="form-label">Vendor / Payee</label>
                    <select class="form-input"><option>Malawi Cement Co.</option><option>ESCOM</option><option>Lilongwe Water Board</option></select>
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input class="form-input" type="text" placeholder="e.g. Invoice #9921 Payment">
                </div>

                <div class="form-group">
                    <label class="form-label">Amount (MWK)</label>
                    <input class="form-input" type="number" placeholder="0.00">
                </div>
                 
                <div class="form-group">
                    <label class="form-label">Supporting Documents (Invoice/Receipt)</label>
                    <div class="photo-zone" style="padding:32px;">
                        <i class="fas fa-cloud-upload-alt" style="font-size:24px; margin-bottom:8px;"></i>
                        <div>Click to Upload or Drag Files</div>
                        <div style="font-size:11px; margin-top:4px;">PDF, JPG, PNG accepted</div>
                    </div>
                </div>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button>
            <button class="btn btn-primary" style="flex:2;" onclick="closeDrawer(); toastService.add('success', 'Transaction Recorded', 'General Ledger updated.');">Record Transaction</button>
        `;
    } else if (type === 'fraud') {
        // --- FRAUD INVESTIGATION ---
        sub.innerText = "Fraud Detection";
        title.innerText = "Investigation: Duplicate Payment";

        body.innerHTML = `
            <div class="drawer-section">
                <div style="background: #FEF2F2; padding:16px; border-radius:6px; margin-bottom:16px;">
                    <div style="color:var(--red); font-weight:700; margin-bottom:4px;">High Risk Alert</div>
                    <div style="color:var(--slate-700);">REQ-095 matches transaction TRX-9885 from 3 days ago exactly (Amount & Vendor).</div>
                </div>
                <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="data-card" style="margin:0; border:1px solid var(--red);">
                        <div class="data-card-header">Current</div>
                        <div style="padding:16px;">
                            <div style="font-weight:700;">REQ-095</div>
                            <div>MWK 850,000</div>
                            <div>Jan 03, 2026</div>
                        </div>
                    </div>
                     <div class="data-card" style="margin:0;">
                        <div class="data-card-header">Previous</div>
                        <div style="padding:16px;">
                            <div style="font-weight:700;">TRX-9885</div>
                            <div>MWK 850,000</div>
                            <div>Dec 30, 2025</div>
                        </div>
                    </div>
                </div>
                 <div class="form-group" style="margin-top:16px;">
                    <label class="form-label">Investigation Notes</label>
                    <textarea class="form-input" rows="3"></textarea>
                </div>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">False Positive</button>
            <button class="btn btn-danger" style="flex:1;" onclick="closeDrawer(); toastService.add('success', 'Vendor Blocked', 'Security protocols enforced.');">Block Vendor</button>
        `;
    } else if (type === 'payment_execution') {
        // --- PAYMENT EXECUTION ---
        sub.innerText = "Treasury";
        title.innerText = "Execute Payment: " + (id || 'REQ-085');

        body.innerHTML = `
            <div class="drawer-section">
                <div class="form-group">
                    <label class="form-label">Payment Source</label>
                    <select class="form-input">
                        <option>Main Operating Account (FDH Bank - *9921)</option>
                        <option>Project Account (Standard Bank - *4421)</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label class="form-label">Beneficiary</label>
                    <div style="background:var(--slate-50); padding:10px; border-radius:4px; font-size:13px; font-weight:600;">
                        ESCOM CORPORATION<br>
                        <span style="font-weight:400; color:var(--slate-500);">Acct: 1000299281 | National Bank</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input class="form-input" type="text" value="MWK 1,200,000" readonly style="background:var(--slate-100);">
                </div>
                <div class="form-group">
                    <label class="form-label">Transaction Reference</label>
                    <input class="form-input" type="text" value="UTIL-JAN-26">
                </div>
            </div>
        `;
        footer.innerHTML = `
             <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button>
             <button class="btn btn-primary" style="flex:2;" onclick="closeDrawer(); toastService.add('success', 'Payment Sent', 'Transfer submitted to bank interface.');"><i class="fas fa-paper-plane"></i> Confirm Transfer</button>
        `;
    } else if (type === 'vendor_onboard') {
        // --- VENDOR ONBOARDING ---
        sub.innerText = "Vendor Management";
        title.innerText = "New Vendor Registration";

        body.innerHTML = `
            <div class="drawer-section">
                <div class="form-group">
                    <label class="form-label">Business Name</label>
                    <input class="form-input" type="text" placeholder="Registered Name">
                </div>
                 <div class="form-group">
                    <label class="form-label">Trading As</label>
                    <input class="form-input" type="text">
                </div>
                 <div class="form-group">
                    <label class="form-label">Service Category</label>
                    <select class="form-input"><option>Materials Supply</option><option>Construction Services</option><option>Transport</option></select>
                </div>
                 <div class="form-group">
                    <label class="form-label">Tax ID (TPIN)</label>
                    <input class="form-input" type="text">
                </div>
                 <div class="form-group">
                    <label class="form-label">Compliance Documents</label>
                     <div class="photo-zone" style="padding:20px;">
                        <i class="fas fa-file-contract" style="font-size:24px; margin-bottom:8px;"></i>
                        <div>Upload Certificate of Inc, TPIN, Tax Clearance</div>
                    </div>
                </div>
            </div>
        `;
        footer.innerHTML = `
             <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Cancel</button>
             <button class="btn btn-primary" style="flex:2;" onclick="closeDrawer(); toastService.add('success', 'Vendor Registered', 'Awaiting compliance check.');">Register Vendor</button>
        `;
    } else if (type === 'contract_detail') {
        // --- CONTRACT DETAILS ---
        sub.innerText = "Contract Management";
        title.innerText = "Contract: " + (id || 'CON-01');

        body.innerHTML = `
            <div class="drawer-section">
               <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                   <div><div class="stat-label">Total Value</div><div style="font-weight:700;">120,000,000</div></div>
                   <div><div class="stat-label">Paid</div><div style="color:var(--emerald); font-weight:700;">45,000,000</div></div>
               </div>
               <div style="margin-top:16px;">
                   <div class="stat-label">Progress</div>
                   <div class="budget-bar-bg" style="margin-bottom:4px;"><div class="budget-bar-fill" style="width:37%"></div></div>
                   <div style="font-size:11px; color:var(--slate-500);">37% Financial Completion</div>
               </div>
            </div>
             <div class="drawer-section">
                <div class="card-title" style="font-size:14px; margin-bottom:12px;">Milestones</div>
                <table style="font-size:12px;">
                    <tbody>
                        <tr>
                            <td>Mobilization</td>
                            <td style="text-align:right;">20%</td>
                            <td><span class="status active" style="font-size:10px;">Paid</span></td>
                        </tr>
                         <tr>
                            <td>Foundation</td>
                            <td style="text-align:right;">25%</td>
                            <td><span class="status active" style="font-size:10px;">Paid</span></td>
                        </tr>
                         <tr>
                            <td>Superstructure</td>
                            <td style="text-align:right;">30%</td>
                            <td><span class="status pending" style="font-size:10px;">Pending</span></td>
                        </tr>
                    </tbody>
                </table>
             </div>
        `;
        footer.innerHTML = `
             <button class="btn btn-secondary" style="flex:1;" onclick="closeDrawer()">Close</button>
             <button class="btn btn-primary" style="flex:1;" onclick="closeDrawer()">View Full Contract</button>
        `;
    }
}

export function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('show');
}

export function submitProposal() {
    toastService.add('success', 'Proposal Sent', 'Budget Allocation Proposal sent back to Project Manager for final acceptance.');
    closeDrawer();
}

// --- PROFILE DRAWER ---
export function openProfileDrawer() {
    document.getElementById('profile-overlay').classList.add('show');
}

export function closeProfileDrawer() {
    document.getElementById('profile-overlay').classList.remove('show');
}

// --- NAVIGATION LOGIC ---
const views = {
    'dashboard': { title: 'Financial Overview', context: 'FY 2025-26 | Cash Position: Strong' },
    'analytics': { title: 'Analytics', context: 'Burn Rate & Forecasting' },
    'approvals': { title: 'Requisition Queue', context: 'Operational Gatekeeping' },
    'ledger': { title: 'General Ledger', context: 'Master Record' },
    'reconciliation': { title: 'Bank Reconciliation', context: 'Statement Matching' },
    'bcr': { title: 'Budget Control', context: 'Governance & Change Requests' },
    'audit': { title: 'Audit Log', context: 'Immutable System Record' },
    'fraud': { title: 'Fraud Detection', context: 'Active Alerts & Rules' },
    'contracts': { title: 'Contract Management', context: 'Milestones & Deadlines' },
    'vendors': { title: 'Vendor Registry', context: 'Compliance & Performance' },
    'reports': { title: 'Reporting', context: 'Export & Print' },
    'documents': { title: 'Document Repository', context: 'Centralized File Storage' }
};

export function navigateTo(viewId, navElement) {
    // 1. Sidebar Active State
    if (navElement) {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    }

    // 2. View Switching
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');

    // 3. Header Text
    if (views[viewId]) {
        document.getElementById('header-title').innerText = views[viewId].title;
        document.getElementById('header-breadcrumb').innerText = views[viewId].title;
        document.getElementById('header-context').innerHTML = `<span class="context-value">${views[viewId].context}</span>`;
    }
}

// Global Bindings
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.submitProposal = submitProposal;
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


});
