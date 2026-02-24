import contracts from '../../src/api/contracts.api.js';
import contractVersions from '../../src/api/contractVersions.api.js';
import insurancePolicies from '../../src/api/insurancePolicies.api.js';
import projects from '../../src/api/projects.api.js';
import client from '../../src/api/client.js';

export class ContractAdminDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.data = {
            contracts: [],
            milestones: [],
            versions: [],
            policies: [],
            stats: {
                activeContracts: 0,
                totalValue: 0,
                upcomingDeadlines: 0,
                pendingAmendments: 0,
                complianceAlerts: 0
            }
        };
    }

    async init() {
        await this.loadAllData();
    }

    async loadAllData() {
        try {
            const [contractsRes, policiesRes] = await Promise.all([
                contracts.getAll(),
                insurancePolicies.getAll()
            ]);

            this.data.contracts = contractsRes.data || [];
            this.data.policies = policiesRes.data || [];
            
            // Extract milestones from contracts
            this.data.milestones = this.data.contracts.flatMap(c => 
                (c.milestones || []).map(m => ({ ...m, contractRef: c.refCode, projectName: c.project?.name || 'Unknown' }))
            ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            // Calculate Stats
            this.data.stats.activeContracts = this.data.contracts.filter(c => c.status === 'active').length;
            this.data.stats.totalValue = this.data.contracts.reduce((sum, c) => sum + parseFloat(c.value || 0), 0);
            
            const today = new Date();
            const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            this.data.stats.upcomingDeadlines = this.data.milestones.filter(m => 
                m.status !== 'verified' && m.status !== 'paid' && 
                new Date(m.dueDate) <= sevenDaysLater
            ).length;

            this.data.stats.complianceAlerts = this.data.policies.filter(p => 
                new Date(p.expiryDate) <= today || (new Date(p.expiryDate) <= sevenDaysLater && p.status !== 'Expired')
            ).length;

            // Fetch versions for all contracts (ideally this would be a single call or batched)
            // For now, let's just fetch them if we are in the amendments view or skip for overview
            
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        }
    }

    async render() {
        return `
            <div id="ca-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${await this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    async getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'documents': return await this.getDocumentsView();
            case 'milestones': return this.getMilestonesView();
            case 'amendments': return await this.getAmendmentsView();
            case 'compliance': return this.getComplianceView();
            case 'reports': return this.getReportsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getHeaderHTML() {
        const stats = this.data.stats;
        const headers = {
            'dashboard': { title: 'Dashboard', context: `${stats.activeContracts} Active Contracts | ${stats.complianceAlerts > 0 ? 'Action Required' : '100% Compliance'}` },
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
                      ${this.currentView === 'dashboard' && stats.upcomingDeadlines > 0 ? `
                           <div class="context-dot"></div>
                           <span style="color: var(--orange); font-weight: 600;">${stats.upcomingDeadlines} Approaching Deadlines</span>
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
        const stats = this.data.stats;
        return `
            <div class="stats-grid">
               <div class="stat-card" style="border-color: var(--orange-light); background: #fffbf7;">
                  <div class="stat-header"><span class="stat-label" style="color: var(--orange);">Upcoming Deadlines</span><i class="fas fa-clock" style="color: var(--orange);"></i></div>
                  <div class="stat-value" style="color: var(--orange);">${stats.upcomingDeadlines}</div>
                  <div class="stat-sub">Milestones due < 7 days</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Active Contracts</span><i class="fas fa-file-contract" style="color: var(--blue);"></i></div>
                  <div class="stat-value">${stats.activeContracts}</div>
                  <div class="stat-sub">Total Value: MWK ${(stats.totalValue / 1000000).toFixed(0)}M</div>
               </div>
               <div class="stat-card">
                  <div class="stat-header"><span class="stat-label">Pending Amendments</span><i class="fas fa-file-pen" style="color: var(--slate-600);"></i></div>
                  <div class="stat-value">${stats.pendingAmendments}</div>
                  <div class="stat-sub">Awaiting PM Approval</div>
               </div>
               <div class="stat-card" style="${stats.complianceAlerts > 0 ? 'border-color: var(--red-light); background: #fff5f5;' : ''}">
                  <div class="stat-header"><span class="stat-label" style="${stats.complianceAlerts > 0 ? 'color: var(--red);' : ''}">Compliance Alerts</span><i class="fas fa-triangle-exclamation" style="color: ${stats.complianceAlerts > 0 ? 'var(--red)' : 'var(--emerald)'};"></i></div>
                  <div class="stat-value" style="${stats.complianceAlerts > 0 ? 'color: var(--red);' : 'color: var(--emerald);'}">${stats.complianceAlerts}</div>
                  <div class="stat-sub">${stats.complianceAlerts > 0 ? 'Expired/Expiring Policies' : 'All policies valid'}</div>
               </div>
            </div>
        `;
    }

    getDataCardHTML() {
        const upcoming = this.data.milestones.slice(0, 5);
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Immediate Attention Required (7-Day Lookahead)</div>
                <button class="btn btn-secondary">View Calendar</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Ref Code</th>
                    <th>Project</th>
                    <th>Milestone</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${upcoming.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">No upcoming deadlines</td></tr>' : 
                    upcoming.map(m => `
                    <tr>
                        <td><span class="mono-val">${m.refCode || m.contractRef}</span></td>
                        <td style="font-weight: 600;">${m.projectName}</td>
                        <td>${m.description}</td>
                        <td class="mono-val" style="color: ${new Date(m.dueDate) < new Date() ? 'var(--red)' : 'var(--orange)'}; font-weight: 700;">
                            ${new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td><span class="status ${m.status.toLowerCase()}">${m.status}</span></td>
                        <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.caModule.openMilestoneDetails(${m.id})">Track</button></td>
                    </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>

            <div class="data-card" style="margin-top:24px;">
              <div class="data-card-header">
                <div class="card-title">Pending Contract Approvals (PM Workflow)</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Ref Code</th>
                    <th>Linked Project</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${(this.data.contracts || []).filter(c => c.status === 'draft' || c.status === 'pending_approval').length === 0 ? 
                    '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--slate-400);">No contracts awaiting approval</td></tr>' : 
                    this.data.contracts.filter(c => c.status === 'draft' || c.status === 'pending_approval').map(c => `
                    <tr>
                        <td><span class="mono-val">${c.refCode}</span></td>
                        <td style="font-weight: 600;">${c.project?.name || 'N/A'}</td>
                        <td class="mono-val">${parseFloat(c.value || 0).toLocaleString()} MWK</td>
                        <td><span class="status draft">${c.status}</span></td>
                        <td>
                            <div style="display:flex; gap:4px;">
                                <button class="btn btn-primary" style="padding: 4px 12px; font-size: 11px; background: var(--emerald); border:none;" onclick="window.app.caModule.handleApproveContract(${c.id})">Approve</button>
                                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.caModule.openEditContractDrawer(${c.id})">Edit</button>
                            </div>
                        </td>
                    </tr>
                    `).join('')}
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
                            <th>Contract Value</th>
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
                                <td class="mono-val">${doc.contractValue ? parseFloat(doc.contractValue).toLocaleString() + ' MWK' : 'N/A'}</td>
                                <td><span class="version-tag">v${doc.versions[0]?.versionNumber || 1}</span></td>
                                <td>${new Date(doc.updatedAt).toLocaleDateString()}</td>
                                <td>${doc.uploadedBy?.name || 'N/A'}</td>
                                <td>
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.app.caModule.openVersionDrawer(${JSON.stringify(doc).replace(/"/g, '&quot;')})">Update</button>
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.app.caModule.openEditDocumentDrawer(${JSON.stringify(doc).replace(/"/g, '&quot;')})">Edit</button>
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
            const res = await contracts.getAll(); // Or use documents API if specific to CA
            // Assuming documents are part of contracts or projects
            // For now, let's use the actual documents API if it's what's intended
            // Checking src/api/documents.api.js earlier...
            const docsRes = await client.get('/documents'); 
            return docsRes.data || [];
        } catch (error) {
            console.error('Failed to load documents', error);
            return [];
        }
    }

    async openUploadDrawer() {
        try {
            const res = await projects.getAll();
            const projectList = res.data || [];
            window.drawer.open('Upload New Document', window.DrawerTemplates.uploadDocument(projectList));
        } catch (error) {
            window.toast.show('Failed to load projects', 'error');
        }
    }

    openVersionDrawer(doc) {
        window.drawer.open(`Upload New Version: ${doc.title}`, window.DrawerTemplates.uploadDocumentVersion(doc));
    }

    // --- Dynamic UI Helpers ---
    openMilestoneDetails(id) {
        const milestone = this.data.milestones.find(m => m.id === id);
        if (milestone) {
            window.drawer.open('Milestone Details', window.DrawerTemplates.milestoneDetails(milestone));
        }
    }

    openCertifyDrawer(id) {
        const milestone = this.data.milestones.find(m => m.id === id);
        if (milestone) {
            window.drawer.open('Certify Milestone', window.DrawerTemplates.certifyMilestone(milestone));
        }
    }

    openMilestoneCertificate(id) {
        const milestone = this.data.milestones.find(m => m.id === id);
        if (milestone) {
            window.drawer.open('Milestone Certificate', window.DrawerTemplates.milestoneCertificate(milestone));
        }
    }

    openPolicyDrawer() {
        window.drawer.open('Log New Policy', window.DrawerTemplates.policyForm());
    }

    openPolicyDetails(id) {
        const policy = this.data.policies.find(p => p.id === id);
        if (policy) {
            window.drawer.open('Policy Details', window.DrawerTemplates.policyDetails(policy));
        }
    }

    async handleUploadDocument() {
        const title = document.getElementById('doc_title').value;
        const projectId = document.getElementById('doc_project_id').value;
        const description = document.getElementById('doc_description').value;
        const fileInput = document.getElementById('doc_file');
        const errorEl = document.getElementById('upload-doc-error');

        const contractValue = document.getElementById('doc_contract_value').value;

        if (!title || !projectId || !fileInput.files[0]) {
            errorEl.innerText = 'Please fill required fields and select a file.';
            errorEl.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('projectId', projectId);
        formData.append('description', description);
        formData.append('contractValue', contractValue);
        formData.append('file', fileInput.files[0]);

        try {
            const result = await client.post('/documents', formData);
            if (result.success !== false) {
                window.toast.show('Document uploaded and PM notified', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Upload failed';
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

        const contractValue = document.getElementById('doc_contract_value')?.value;

        if (!fileInput.files[0]) {
            errorEl.innerText = 'Please select a file.';
            errorEl.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('changeNotes', notes);
        if (contractValue) formData.append('contractValue', contractValue);
        formData.append('file', fileInput.files[0]);

        try {
            const result = await client.post(`/documents/${docId}/versions`, formData);
            if (result.success !== false) {
                window.toast.show('Document version updated', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Update failed';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during upload.';
            errorEl.style.display = 'block';
        }
    }

    async handleApproveContract(contractId) {
        try {
            const result = await client.post(`/contracts/${contractId}/approve`, {});
            if (result.success !== false) {
                window.toast.show('Contract approved and activated', 'success');
                window.app.caModule.refresh();
            } else {
                window.toast.show(result.error?.message || 'Approval failed', 'error');
            }
        } catch (error) {
            window.toast.show('Server error during approval.', 'error');
        }
    }

    async openEditContractDrawer(contractId) {
        const contract = this.data.contracts.find(c => c.id === contractId);
        if (contract) {
            window.drawer.open(`Edit Contract: ${contract.refCode}`, window.DrawerTemplates.editContract(contract));
        } else {
            window.toast.show('Contract not found', 'error');
        }
    }

    async handleUpdateContract(contractId) {
        // ... (existing code)
        const value = document.getElementById('edit_contract_value').value;
        const vendorName = document.getElementById('edit_contract_vendor').value;
        const startDate = document.getElementById('edit_contract_start').value;
        const endDate = document.getElementById('edit_contract_end').value;
        const status = document.getElementById('edit_contract_status').value;
        const errorEl = document.getElementById('edit-contract-error');

        try {
            const result = await client.put(`/contracts/${contractId}`, {
                value: value ? parseFloat(value) : null,
                vendorName,
                startDate: startDate || null,
                endDate: endDate || null,
                status
            });

            if (result.success !== false) {
                window.toast.show('Contract updated successfully', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Update failed';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during update.';
            errorEl.style.display = 'block';
        }
    }

    openEditDocumentDrawer(doc) {
        window.drawer.open(`Edit Document: ${doc.title}`, window.DrawerTemplates.editDocument(doc));
    }

    async handleUpdateDocumentDetails(docId) {
        const title = document.getElementById('edit_doc_title').value;
        const description = document.getElementById('edit_doc_description').value;
        const contractValue = document.getElementById('edit_doc_contract_value').value;
        const errorEl = document.getElementById('edit-doc-error');

        try {
            const result = await client.put(`/documents/${docId}`, {
                title,
                description,
                contractValue: contractValue ? parseFloat(contractValue) : null
            });

            if (result.success !== false) {
                window.toast.show('Document details updated', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Update failed';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during update.';
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
        const milestones = this.data.milestones;
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
                            <th>Ref Code</th>
                            <th>Project</th>
                            <th>Milestone</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Certify</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${milestones.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:20px;">No milestones found</td></tr>' : 
                          milestones.map(m => `
                          <tr>
                              <td style="font-weight:700; color:${new Date(m.dueDate) < new Date() ? 'var(--red)' : 'var(--orange)'};">${new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td class="project-id">${m.refCode || 'N/A'}</td>
                              <td>${m.projectName}</td>
                              <td>${m.description}</td>
                              <td class="mono-val">${parseFloat(m.value || 0).toLocaleString()} MWK</td>
                              <td><span class="status ${m.status.toLowerCase()}">${m.status}</span></td>
                              <td>
                                ${m.status === 'verified' || m.status === 'paid' ? 
                                    `<button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.app.caModule.openMilestoneCertificate(${m.id})">View Cert</button>` :
                                    `<button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.app.caModule.openCertifyDrawer(${m.id})">Verify</button>`
                                }
                              </td>
                          </tr>
                          `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async getAmendmentsView() {
        // Load versions if not loaded
        if (this.data.versions.length === 0 && this.data.contracts.length > 0) {
            try {
                const versionPromises = this.data.contracts.slice(0, 5).map(c => contractVersions.getByContract(c.id));
                const results = await Promise.all(versionPromises);
                this.data.versions = results.flatMap(r => r.data || []);
            } catch (error) {
                console.error('Failed to load versions', error);
            }
        }

        const versions = this.data.versions;
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
                            <th>Title</th>
                            <th>Change Notes</th>
                            <th>Cost Impact</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${versions.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">No variations logged yet</td></tr>' : 
                          versions.map(v => `
                          <tr>
                              <td>${new Date(v.createdAt).toLocaleDateString()}</td>
                              <td class="project-id">${v.refCode}</td>
                              <td style="font-weight:600;">${v.title}</td>
                              <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${v.changeNotes || ''}</td>
                              <td class="mono-val" style="color:${parseFloat(v.value) > 0 ? 'var(--red)' : 'var(--emerald)'};">${parseFloat(v.value) > 0 ? '+' : ''}${parseFloat(v.value || 0).toLocaleString()}</td>
                              <td><span class="status ${v.status.toLowerCase()}">${v.status}</span></td>
                          </tr>
                          `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getComplianceView() {
        const policies = this.data.policies;
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Insurance & Bonds Tracking</div>
                    <button class="btn btn-primary" onclick="window.app.caModule.openPolicyDrawer()"><i class="fas fa-plus"></i> Log New Policy</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Entity/Contractor</th>
                            <th>Document Type</th>
                            <th>Policy Number</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${policies.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">No policies tracked yet</td></tr>' : 
                          policies.map(p => {
                            const expiry = new Date(p.expiryDate);
                            const today = new Date();
                            const isExpiring = expiry > today && expiry < new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
                            const isExpired = expiry <= today;
                            
                            return `
                              <tr>
                                  <td style="font-weight:600;">${p.entityName}</td>
                                  <td>${p.documentType}</td>
                                  <td>${p.policyNumber}</td>
                                  <td class="mono-val" style="color:${isExpired ? 'var(--red)' : isExpiring ? 'var(--orange)' : 'var(--slate-600)'};">${expiry.toLocaleDateString()}</td>
                                  <td>
                                    <span class="status ${p.status.toLowerCase()}" style="${isExpired ? 'background: #FEE2E2; color: #991B1B;' : isExpiring ? 'background: #FEF3C7; color: #92400E;' : ''}">
                                        ${isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : p.status}
                                    </span>
                                  </td>
                                  <td><button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.app.caModule.openPolicyDetails(${p.id})">Details</button></td>
                              </tr>
                            `;
                          }).join('')}
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
                                <div style="font-weight:600; font-size:14px;">Contractor Performance Review</div>
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
