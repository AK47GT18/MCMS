export class ContractAdminDashboard {
    constructor() {
        this.currentView = 'dashboard';
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="ca-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'documents': return this.getDocumentsView();
            case 'milestones': return this.getMilestonesView();
            case 'amendments': return this.getAmendmentsView();
            case 'compliance': return this.getComplianceView();
            case 'reports': return this.getReportsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getHeaderHTML() {
        // Dynamic Header Content
        const headers = {
            'dashboard': { title: 'Dashboard', context: '4 Active Contracts | 98% Compliance' },
            'documents': { title: 'Document Repository', context: 'Centralized Project Documents' },
            'milestones': { title: 'Milestone Tracking', context: 'Deliverables & Deadlines' },
            'amendments': { title: 'Amendments & Variations', context: 'Change Control Log' },
            'compliance': { title: 'Insurance & Bonds', context: 'Risk Management' },
            'reports': { title: 'Performance Reporting', context: 'KPIs & Analytics' }
        };
        const current = headers[this.currentView] || { title: 'Overview', context: '' };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Contract Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${current.title}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${current.title}</h1>
                    <div class="context-strip">
                      <span class="context-value">${current.context}</span>
                      ${this.currentView === 'dashboard' ? `
                           <div class="context-dot"></div>
                           <span style="color: var(--orange); font-weight: 600;">3 Approaching Deadlines</span>
                      ` : ''}
                    </div>
                  </div>
                  ${this.currentView === 'documents' || this.currentView === 'dashboard' ? `
                      <button class="btn btn-action" onclick="window.app.caModule.openUploadDrawer()">
                        <i class="fas fa-file-arrow-up"></i>
                        <span>Upload Document</span>
                      </button>
                  ` : ''}
                </div>
            </div>
        `;
    }

    getDashboardView() {
        return `
            ${this.getStatsGridHTML()}
            ${this.getDataCardHTML()}
        `;
    }

    getStatsGridHTML() {
        return `
            <div class="stats-grid">
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Upcoming Deadlines</span><i class="fas fa-clock" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="color: var(--orange);">3</div>
                  <div class="stat-sub">Milestones due < 7 days</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Active Contracts</span><i class="fas fa-file-contract" style="color: var(--blue);"></i></div>
                  <div class="stat-value">4</div>
                  <div class="stat-sub">Total Value: MWK 890M</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Pending Amendments</span><i class="fas fa-file-pen" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value">1</div>
                  <div class="stat-sub">Awaiting PM Approval</div>
               </div>
               <div class="stat-card" style="border-color: var(--red-light); background: #fff5f5;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--red);">Compliance Alerts</span><i class="fas fa-triangle-exclamation" style="color: var(--red);"></i></div>
                  <div class="stat-value" style="color: var(--red);">1</div>
                  <div class="stat-sub">Expired Insurance (VEN-012)</div>
               </div>
            </div>
        `;
    }

    getDataCardHTML() {
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Immediate Attention Required (7-Day Lookahead)</div>
                <button class="btn btn-secondary">View Calendar</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Contract ID</th>
                    <th>Project</th>
                    <th>Milestone</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr onclick="window.drawer.open('Contract Details', window.DrawerTemplates.contractDetails)">
                    <td><span class="mono-val">CNT-045</span></td>
                    <td style="font-weight: 600;">CEN-01 Unilia</td>
                    <td>Foundation Complete</td>
                    <td class="mono-val" style="color: var(--red); font-weight: 700;">Jan 07 (4 Days)</td>
                    <td><span class="status expiring" style="background: #FEF3C7; color: #92400E; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">At Risk</span></td>
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Contract Details', window.DrawerTemplates.contractDetails)">Track</button></td>
                  </tr>
                  <tr onclick="window.drawer.open('Contract Details', window.DrawerTemplates.contractDetails)">
                    <td><span class="mono-val">CNT-052</span></td>
                    <td style="font-weight: 600;">MZ-05 Clinic</td>
                    <td>Ins. Renewal</td>
                    <td class="mono-val" style="color: var(--orange); font-weight: 700;">Jan 10 (7 Days)</td>
                    <td><span class="status expiring" style="background: #FEF3C7; color: #92400E; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">Warning</span></td>
                    <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Upload Amendment', window.DrawerTemplates.uploadAmendment)">Renew</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
        `;
    }

    async getDocumentsView() {
        const docs = await this.loadDocuments();
        
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Project Documents & Versions</div>
                    <div style="display:flex; gap:8px;">
                        <input type="text" placeholder="Search documents..." style="padding:6px 12px; border:1px solid var(--slate-300); border-radius:4px; font-size:13px;">
                        <button class="btn btn-secondary"><i class="fas fa-filter"></i> Project</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Linked Project</th>
                            <th>Latest Version</th>
                            <th>Last Updated</th>
                            <th>Uploaded By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${docs.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--slate-400);">No documents uploaded yet.</td></tr>` : 
                          docs.map(doc => `
                            <tr>
                                <td style="font-weight:600;">${doc.title}</td>
                                <td><span class="project-id">${doc.project?.code || 'PRJ'}</span> ${doc.project?.name || 'Unknown'}</td>
                                <td><span class="version-tag">v${doc.versions[0]?.versionNumber || 1}</span></td>
                                <td>${new Date(doc.updatedAt).toLocaleDateString()}</td>
                                <td>${doc.uploadedBy?.name || 'N/A'}</td>
                                <td>
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.app.caModule.openVersionDrawer(${JSON.stringify(doc).replace(/"/g, '&quot;')})">Update</button>
                                        <a href="${doc.currentVersionUrl}" target="_blank" class="btn btn-secondary" style="padding:4px 8px; font-size:11px;"><i class="fas fa-download"></i></a>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async loadDocuments() {
        try {
            const res = await fetch('/api/v1/documents');
            const data = await res.json();
            return data.data || [];
        } catch (error) {
            console.error('Failed to load documents', error);
            return [];
        }
    }

    async openUploadDrawer() {
        try {
            const res = await fetch('/api/v1/projects');
            const data = await res.json();
            const projects = data.data || [];
            window.drawer.open('Upload New Document', window.DrawerTemplates.uploadDocument(projects));
        } catch (error) {
            window.toast.show('Failed to load projects', 'error');
        }
    }

    openVersionDrawer(doc) {
        window.drawer.open(`Upload New Version: ${doc.title}`, window.DrawerTemplates.uploadDocumentVersion(doc));
    }

    async handleUploadDocument() {
        const title = document.getElementById('doc_title').value;
        const projectId = document.getElementById('doc_project_id').value;
        const description = document.getElementById('doc_description').value;
        const fileInput = document.getElementById('doc_file');
        const errorEl = document.getElementById('upload-doc-error');

        if (!title || !projectId || !fileInput.files[0]) {
            errorEl.innerText = 'Please fill required fields and select a file.';
            errorEl.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('projectId', projectId);
        formData.append('description', description);
        formData.append('file', fileInput.files[0]);

        try {
            const res = await fetch('/api/v1/documents', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            if (result.status === 'success') {
                window.toast.show('Document uploaded and PM notified', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.message;
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during upload.';
            errorEl.style.display = 'block';
        }
    }

    async handleUploadVersion(docId) {
        const notes = document.getElementById('ver_notes').value;
        const fileInput = document.getElementById('ver_file');
        const errorEl = document.getElementById('upload-ver-error');

        if (!fileInput.files[0]) {
            errorEl.innerText = 'Please select a file.';
            errorEl.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('changeNotes', notes);
        formData.append('file', fileInput.files[0]);

        try {
            const res = await fetch(`/api/v1/documents/${docId}/versions`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            if (result.status === 'success') {
                window.toast.show('Document version updated', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.message;
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during upload.';
            errorEl.style.display = 'block';
        }
    }

    refresh() {
        // Simple re-render of current view
        const content = document.querySelector('#ca-module .content');
        if (content) {
            this.getCurrentViewHTML().then(html => content.innerHTML = html);
        }
    }

    // Replace render with async version to handle fetching
    async render() {
        const html = await this.getTemplateAsync();
        return html;
    }

    async getTemplateAsync() {
        const viewHtml = await this.getCurrentViewHTML();
        return `
            <div id="ca-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${viewHtml}
                </div>
            </div>
        `;
    }

    async getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'documents': return await this.getDocumentsView();
            case 'milestones': return this.getMilestonesView();
            case 'amendments': return this.getAmendmentsView();
            case 'compliance': return this.getComplianceView();
            case 'reports': return this.getReportsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getMilestonesView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Deliverables & Payment Milestones</div>
                    <button class="btn btn-secondary"><i class="fas fa-calendar-alt"></i> View Timeline</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Due Date</th>
                            <th>Ref</th>
                            <th>Project</th>
                            <th>Milestone</th>
                            <th>Values</th>
                            <th>Status</th>
                            <th>Certify</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:700; color:var(--orange);">Jan 15, 2025</td>
                            <td class="project-id">MS-101</td>
                            <td>CEN-01 Unilia</td>
                            <td>Foundation Completion</td>
                            <td class="mono-val">120,000,000 MWK</td>
                            <td><span class="status pending">Pending Pymt</span></td>
                            <td><button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.drawer.open('Certify Milestone', window.DrawerTemplates.certifyMilestone)">Verify</button></td>
                        </tr>
                         <tr>
                            <td style="font-weight:700; color:var(--slate-600);">Feb 28, 2025</td>
                            <td class="project-id">MS-102</td>
                            <td>CEN-01 Unilia</td>
                            <td>Wall Plate Level</td>
                            <td class="mono-val">85,000,000 MWK</td>
                            <td><span class="status locked">Scheduled</span></td>
                            <td><button class="btn btn-secondary" disabled style="padding:2px 8px; font-size:11px; opacity:0.5;">Verify</button></td>
                        </tr>
                        <tr>
                            <td style="font-weight:700; color:var(--emerald);"><i class="fas fa-check"></i> Dec 15, 2024</td>
                            <td class="project-id">MS-100</td>
                            <td>CEN-01 Unilia</td>
                            <td>Site Establishment</td>
                            <td class="mono-val">45,000,000 MWK</td>
                            <td><span class="status active">Paid</span></td>
                            <td><button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.drawer.open('Milestone Certificate', window.DrawerTemplates.milestoneCertificate)">View Cert</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getAmendmentsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Amendments & Variations Log</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Upload Amendment', window.DrawerTemplates.uploadAmendment)"><i class="fas fa-plus"></i> New Variation</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>VO Ref</th>
                            <th>Contract</th>
                            <th>Description</th>
                            <th>Cost Impact</th>
                            <th>Time Impact</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr>
                            <td>Jan 05, 2025</td>
                            <td class="project-id">VO-003</td>
                            <td>CEN-01 Main</td>
                            <td>Additional drainage channel</td>
                            <td class="mono-val" style="color:var(--red);">+ 4,500,000</td>
                            <td style="font-size:12px;">+ 5 Days</td>
                            <td><span class="status pending">PM Review</span></td>
                        </tr>
                        <tr>
                            <td>Dec 12, 2024</td>
                            <td class="project-id">VO-002</td>
                            <td>CEN-01 Main</td>
                            <td>Change of floor tile spec</td>
                            <td class="mono-val" style="color:var(--emerald);">- 1,200,000</td>
                            <td style="font-size:12px;">0 Days</td>
                            <td><span class="status active">Approved</span></td>
                        </tr>
                         <tr>
                            <td>Nov 20, 2024</td>
                            <td class="project-id">VO-001</td>
                            <td>CEN-01 Main</td>
                            <td>Revised foundation depth</td>
                            <td class="mono-val">0.00</td>
                            <td style="font-size:12px;">+ 2 Days</td>
                            <td><span class="status active">Approved</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getComplianceView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Insurance & Bonds Tracking</div>
                    <button class="btn btn-secondary" onclick="window.drawer.open('Send Reminders', window.DrawerTemplates.sendReminders)"><i class="fas fa-envelope"></i> Send Reminders</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Vendor/Entity</th>
                            <th>Document Type</th>
                            <th>Policy Number</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr>
                            <td style="font-weight:600;">Unilia Construction</td>
                            <td>Performance Bond</td>
                            <td>NB-BND-2024-889</td>
                            <td class="mono-val">Jun 30, 2026</td>
                            <td><span class="status active">Valid</span></td>
                            <td><button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.drawer.open('Policy Details', window.DrawerTemplates.viewPolicy)">View</button></td>
                        </tr>
                        <tr>
                            <td style="font-weight:600;">Unilia Construction</td>
                            <td>All Risk Insurance</td>
                            <td>NICO-CAR-992</td>
                            <td class="mono-val" style="color:var(--orange);">Feb 28, 2025</td>
                            <td><span class="status expiring" style="background:var(--orange-light); color:var(--orange-dark); padding:4px 10px; border-radius:12px;">Expiring Soon</span></td>
                            <td><button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.drawer.open('Request Renewal', window.DrawerTemplates.requestRenewal)">Request Renewal</button></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">Apex Security</td>
                            <td>Workers Comp</td>
                            <td>WCA-221-002</td>
                            <td class="mono-val" style="color:var(--red);">Dec 31, 2024</td>
                            <td><span class="status rejected">Expired</span></td>
                            <td><button class="btn btn-danger" style="padding:2px 8px; font-size:11px;" onclick="window.drawer.open('Regulatory Breach', window.DrawerTemplates.flagBreach)">Flag Breach</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }



    getReportsView() {
         return `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                         <div class="card-title">Contract Analytics</div>
                    </div>
                     <div style="padding:24px; text-align:center; color:var(--slate-500);">
                        <i class="fas fa-chart-pie" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i>
                        <p>Contract Value Distribution</p>
                    </div>
                </div>
                <div class="data-card">
                    <div class="data-card-header">
                         <div class="card-title">Available Reports</div>
                    </div>
                    <ul style="list-style:none; padding:0; margin:0;">
                        <li style="padding:16px; border-bottom:1px solid var(--slate-100); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600; font-size:14px;">Contract Expiry Schedule</div>
                                <div style="font-size:12px; color:var(--slate-500);">PDF • Generated Weekly</div>
                            </div>
                            <button class="btn btn-secondary">Download</button>
                        </li>
                         <li style="padding:16px; border-bottom:1px solid var(--slate-100); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600; font-size:14px;">Compliance Audit Log</div>
                                <div style="font-size:12px; color:var(--slate-500);">Excel • Live Data</div>
                            </div>
                            <button class="btn btn-secondary">Download</button>
                        </li>
                         <li style="padding:16px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600; font-size:14px;">Vendor Performance Review</div>
                                <div style="font-size:12px; color:var(--slate-500);">PDF • Q3 2025</div>
                            </div>
                            <button class="btn btn-secondary">Download</button>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }
}
