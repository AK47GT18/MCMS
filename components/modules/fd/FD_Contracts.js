import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';
import contracts from '../../../src/api/contracts.api.js';

export const FD_Contracts = {
    getContractsView() {
        this.currentContractTab = this.currentContractTab || 'project';
        this.projectFilter = '';
        this.vendorFilter = '';
        
        setTimeout(() => this.loadContractsData(), 0);
        
        return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Contract Registry & Legal Repository</div>
                    <button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange);" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.fmModule?.loadContractProjects(); window.app.fmModule?.initContractUpload(); }, 100)"><i class="fas fa-plus"></i> New Contract</button>
                </div>
                
                <div class="tabs" style="margin-bottom: 0; padding: 0 24px; border-bottom: 1px solid var(--slate-200);">
                    <div class="tab ${this.currentContractTab === 'project' ? 'active' : ''}" data-tab="project" onclick="window.app.fmModule.switchContractTab('project')">Project Contracts</div>
                    <div class="tab ${this.currentContractTab === 'vendor' ? 'active' : ''}" data-tab="vendor" onclick="window.app.fmModule.switchContractTab('vendor')">Vendor Contracts</div>
                </div>
                
                <div style="padding: 16px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; gap: 16px;">
                    <select id="contract-project-filter" class="form-input" style="max-width: 250px;" onchange="window.app.fmModule.handleContractFilterChange()">
                        <option value="">All Projects</option>
                        <!-- Projects loaded dynamically -->
                    </select>
                    ${this.currentContractTab === 'vendor' ? `
                    <select id="contract-vendor-filter" class="form-input" style="max-width: 250px;" onchange="window.app.fmModule.handleContractFilterChange()">
                        <option value="">All Vendors</option>
                        <!-- Vendors loaded dynamically -->
                    </select>
                    ` : ''}
                </div>

                <div id="contracts-table-container">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                        <div>Loading contracts...</div>
                    </div>
                </div>
            </div>
        `;
    },

    switchContractTab(tab) {
        this.currentContractTab = tab;
        this.projectFilter = '';
        this.vendorFilter = '';
        if (window.app) window.app.loadPage('contracts');
    },
    
    handleContractFilterChange() {
        this.projectFilter = document.getElementById('contract-project-filter')?.value || '';
        if (this.currentContractTab === 'vendor') {
            this.vendorFilter = document.getElementById('contract-vendor-filter')?.value || '';
        }
        this.renderContractsTable();
    },

    async loadContractsData() {
        const container = document.getElementById('contracts-table-container');
        if (!container) return;

        try {
            // Load filters data
            client.get('/projects?limit=50').then(res => {
                const projectsData = Array.isArray(res) ? res : (res.data || []);
                const select = document.getElementById('contract-project-filter');
                if (select) {
                    projectsData.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = p.name;
                        if (this.projectFilter == p.id) opt.selected = true;
                        select.appendChild(opt);
                    });
                }
            }).catch(e => console.error('Error loading projects for filter', e));

            if (this.currentContractTab === 'vendor') {
                client.get('/vendors?limit=50').then(res => {
                    const vendorsData = Array.isArray(res) ? res : (res.data || []);
                    const select = document.getElementById('contract-vendor-filter');
                    if (select) {
                        vendorsData.forEach(v => {
                            const opt = document.createElement('option');
                            opt.value = v.id;
                            opt.textContent = v.name;
                            if (this.vendorFilter == v.id) opt.selected = true;
                            select.appendChild(opt);
                        });
                    }
                }).catch(e => console.error('Error loading vendors for filter', e));
            }

            // Load contracts
            const response = await contracts.getAll({ limit: 100 });
            const data = response.data || response;
            const allContracts = Array.isArray(data) ? data : data.contracts || [];
            
            // Store raw contracts
            this.allContracts = allContracts;
            this._contractsMap = allContracts; // For legacy methods
            
            this.renderContractsTable();

        } catch (error) {
            console.error('Failed to load contracts:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">Failed to load contract registry.</div>`;
        }
    },

    renderContractsTable() {
        const container = document.getElementById('contracts-table-container');
        if (!container) return;
        
        if (!this.allContracts || this.allContracts.length === 0) {
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-file-contract" style="font-size: 32px; margin-bottom: 12px;"></i><div>No contracts found in the repository.</div></div>`;
            return;
        }

        // Filter by tab type
        let filtered = this.allContracts.filter(c => {
            if (this.currentContractTab === 'vendor') {
                return c.contractType === 'supply' || c.contractType === 'vendor' || c.vendorId != null;
            } else {
                return c.contractType === 'project' || c.contractType === 'client' || (c.vendorId == null && c.projectId != null);
            }
        });

        // Filter by project
        if (this.projectFilter) {
            filtered = filtered.filter(c => c.projectId == this.projectFilter);
        }
        
        // Filter by vendor
        if (this.currentContractTab === 'vendor' && this.vendorFilter) {
            filtered = filtered.filter(c => c.vendorId == this.vendorFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-filter" style="font-size: 32px; margin-bottom: 12px;"></i><div>No contracts match the selected filters.</div></div>`;
            return;
        }

        const formatValue = (v) => v ? (Number(v) / 1000000).toFixed(1) + 'M' : '-';
        
        const rows = filtered.map(item => `
            <tr>
                <td><span class="project-id">${item.code || item.refCode || 'CNT-' + item.id}</span></td>
                <td style="font-weight:600;">${item.title}</td>
                ${this.currentContractTab === 'vendor' ? `<td>${item.vendorName || item.vendor?.name || '-'}</td>` : ''}
                <td style="font-family:'JetBrains Mono';">${formatValue(item.value)}</td>
                <td><span class="status active">${item.status || 'Active'}</span></td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Contract Viewer', window.DrawerTemplates.contractViewer(${JSON.stringify(item).replace(/"/g, '&quot;')}))"><i class="fas fa-eye"></i> View</button>
                        <button class="btn btn-action" style="padding:4px 8px; background: var(--slate-100); color: var(--slate-600);" onclick="window.app.fmModule?.notifyLogistics(${item.id}, '${item.refCode || item.code}')" title="Notify Logistics">
                            <i class="fas fa-shipping-fast"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Ref</th>
                        <th>Title</th>
                        ${this.currentContractTab === 'vendor' ? '<th>Vendor</th>' : ''}
                        <th>Value</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    },

    async viewContract(id) {
        window.toast.show('Fetching contract details...', 'info');
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch(`/api/v1/contracts/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch full contract details');
            const result = await response.json();
            const contract = result.data || result;
            
            window.drawer.open('Contract Details', window.DrawerTemplates.contractView(contract));
        } catch (error) {
            console.error('View contract error:', error);
            // Fallback to local data if API fails
            const contract = this._contractsMap?.find(c => c.id === id);
            if (contract) {
                window.drawer.open('Contract Details', window.DrawerTemplates.contractView(contract));
            } else {
                window.toast.show('Could not load contract details.', 'error');
            }
        }
    },

    openUploadNewVersion(contractId) {
        window.drawer.open('New Contract Version', window.DrawerTemplates.contractUploadVersion(contractId));
        
        // Initialize file upload logic for the new drawer content
        setTimeout(() => {
            const dropZone = document.getElementById('v-drop-zone');
            const fileInput = document.getElementById('v-file-input');
            const status = document.getElementById('v-file-status');
            
            if (dropZone && fileInput) {
                dropZone.onclick = () => fileInput.click();
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        status.innerHTML = `<span style="color: var(--emerald);"><i class="fas fa-check-circle"></i> ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)</span>`;
                        dropZone.style.borderColor = 'var(--emerald)';
                        dropZone.style.background = '#F0FDF4';
                    }
                };
            }
        }, 100);
    },

    async submitNewVersion(contractId) {
        const notes = document.getElementById('v-change-notes')?.value;
        const fileInput = document.getElementById('v-file-input');
        const file = fileInput?.files[0];

        if (!notes || notes.length < 5) {
            window.toast.show('Please provide descriptive change notes.', 'error');
            return;
        }

        if (!file) {
            window.toast.show('Please select a contract document (PDF).', 'error');
            return;
        }

        window.toast.show('Uploading new version...', 'info');

        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('changeNotes', notes);

            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch(`/api/v1/contracts/${contractId}/versions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            
            window.toast.show('New version uploaded successfully!', 'success');
            window.drawer.close();
            // Refresh the view
            this.viewContract(contractId);
            this.loadContractsData();
        } catch (error) {
            window.toast.show('Failed to upload version: ' + error.message, 'error');
        }
    },

    viewDocument(url) {
        if (!url) {
            window.toast.show('No document URL available for this version.', 'warning');
            return;
        }
        window.open(url, '_blank');
    },

    downloadDocument(url, filename) {
        if (!url) {
            window.toast.show('No document available for download.', 'warning');
            return;
        }
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async loadContractProjects() {
        const select = document.getElementById('contract_project');
        if (!select) return;
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch('/api/v1/projects?status=active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            const projects = result.data || result.items || [];
            select.innerHTML = '<option value="">Select a project...</option>' + projects.map(p => `<option value="${p.id}">${p.code} – ${p.name}</option>`).join('');
        } catch (err) { console.error(err); }
    },

    initContractUpload() {
        const dropZone = document.getElementById('contract-drop-zone');
        const fileInput = document.getElementById('contract_document');
        const status = document.getElementById('contract-file-status');
        if (!dropZone || !fileInput) return;
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if (e.target.files[0]) {
                status.innerHTML = `<span style="color: var(--emerald); font-size: 12px;"><i class="fas fa-check-circle"></i> ${e.target.files[0].name}</span>`;
                dropZone.style.borderColor = 'var(--emerald)';
            }
        };
    },

    async onContractProjectSelected(projectId) {
        const list = document.getElementById('contract-materials-list');
        const section = document.getElementById('contract-materials-section');
        if (!list || !projectId) return;
        section.style.display = 'block';
        list.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
                <i class="fas fa-circle-notch fa-spin" style="margin-right: 8px; color: var(--orange);"></i>
                <span style="font-size: 13px; color: var(--slate-500);">Fetching project requirements...</span>
            </div>
        `;
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch(`/api/v1/projects/${projectId}/materials`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            const materials = result.data?.materials || result.materials || [];
            
            if (materials.length === 0) { 
                list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--slate-400); font-size: 12px;">No specifications found for this project.</div>'; 
                return; 
            }

            list.innerHTML = `
                <div style="padding: 8px 12px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">
                    <div style="flex: 2;">Material Name</div>
                    <div style="flex: 1; text-align: right;">Available</div>
                    <div style="flex: 1.2; text-align: right;">Contract Qty</div>
                </div>
                ${materials.map((m, i) => {
                    const isAvailable = m.remainingQuantity > 0;
                    return `
                        <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid var(--slate-100); opacity: ${isAvailable ? 1 : 0.6}; background: ${isAvailable ? 'transparent' : 'var(--slate-50)'}">
                            <div style="flex: 2; display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" name="contract_material" id="m_cb_${i}" value="${i}" 
                                    ${isAvailable ? '' : 'disabled'}
                                    data-name="${m.name}" data-unit="${m.unit}"
                                    onchange="document.getElementById('m_qty_${i}').disabled = !this.checked">
                                <div>
                                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-800);">${m.name}</div>
                                    <div style="font-size: 11px; color: var(--slate-500);">Req: ${m.quantity} ${m.unit}</div>
                                </div>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 12px; font-weight: 600; color: ${isAvailable ? 'var(--slate-700)' : 'var(--slate-400)'};">${m.remainingQuantity} ${m.unit}</div>
                            </div>
                            <div style="flex: 1.2; text-align: right;">
                                <input type="number" id="m_qty_${i}" class="form-input" disabled value="${m.remainingQuantity}" 
                                    min="1" max="${m.remainingQuantity}"
                                    style="width: 80px; padding: 4px 8px; font-size: 12px; text-align: right; border-radius: 6px;">
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        } catch (err) { 
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444; font-size: 12px;">Error loading materials list.</div>'; 
        }
    },

    async submitContract() {
        const data = {
            projectId: document.getElementById('contract_project')?.value,
            vendorName: document.getElementById('contract_vendor')?.value,
            title: document.getElementById('contract_title')?.value,
            value: parseFloat(document.getElementById('contract_value')?.value),
            startDate: document.getElementById('contract_start')?.value,
            endDate: document.getElementById('contract_end')?.value
        };
        const checkboxes = document.querySelectorAll('input[name="contract_material"]:checked');
        const materials = Array.from(checkboxes).map(cb => {
            const index = cb.value;
            const qtyInput = document.getElementById(`m_qty_${index}`);
            return { 
                name: cb.dataset.name, 
                quantity: parseFloat(qtyInput?.value || 0), 
                unit: cb.dataset.unit 
            };
        });

        if (!data.projectId || !data.vendorName || !data.title || materials.length === 0) {
            window.toast.show('Please fill required fields and select materials', 'warning');
            return;
        }

        window.toast.show('Establishing contract...', 'info');

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch('/api/v1/contracts', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, materialsList: JSON.stringify(materials), refCode: 'CON-' + Date.now().toString(36).toUpperCase() })
            });
            if (!res.ok) throw new Error('System error creating contract');
            window.toast.show('Contract established successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'contracts') this.loadContractsData();
        } catch (err) { window.toast.show(err.message, 'error'); }
    },

    async notifyLogistics(contractId, refCode) {
        window.toast.show(`Notifying Logistics about ${refCode}...`, 'info');
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch('/api/v1/notifications', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetRole: 'Equipment_Coordinator',
                    type: 'PROCUREMENT_READY',
                    title: 'New Procurement Ready',
                    message: `Contract ${refCode} has been finalized. Materials are now ready for intake and logistics planning.`,
                    contractId: contractId
                })
            });
            if (!res.ok) throw new Error('Failed to send notification');
            window.toast.show('Logistics department notified', 'success');
        } catch (err) {
            window.toast.show('Error notifying logistics: ' + err.message, 'error');
        }
    },

    loadContractsView() {
        this.currentView = 'contracts';
        this.switchView('contracts');
    }
};
