import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const FD_Contracts = {
    getContractsView() {
        // Trigger async load
        setTimeout(() => this.loadContractsFromAPI(), 0);
        
        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Vendor Contracts</div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filters</button>
                    <button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange);" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.fmModule?.loadContractProjects(); window.app.fmModule?.initContractUpload(); }, 100)"><i class="fas fa-plus"></i> New Contract</button>
                </div>
              </div>
              <div id="contracts-table-container">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div>Loading contracts...</div>
                </div>
              </div>
            </div>
        `;
    },

    async loadContractsFromAPI() {
        const container = document.getElementById('contracts-table-container');
        if (!container) return;

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/contracts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load contracts');
            const result = await response.json();
            const contracts = result.data || result.items || result || [];

            if (contracts.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-file-contract" style="font-size: 32px; margin-bottom: 12px;"></i><div>No contracts found.</div></div>`;
                return;
            }
            container.innerHTML = this.renderContractsTable(contracts);
        } catch (error) {
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    },

    renderContractsTable(contracts) {
        // Store contracts for later lookup
        this._contractsMap = contracts;

        const formatValue = (v) => v ? (Number(v) / 1000000).toFixed(1) + 'M' : '-';
        const rows = contracts.map(c => `
            <tr>
                <td><span class="project-id">${c.refCode || 'CON-'+c.id}</span></td>
                <td style="font-weight:600;">${c.title}</td>
                <td>${c.vendorName || '-'}</td>
                <td style="font-family:'JetBrains Mono';">${formatValue(c.value)}</td>
                <td><span class="status active">${c.status || 'Active'}</span></td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn btn-secondary" style="padding:4px 8px;" onclick="window.app.fmModule?.viewContract(${c.id})">View</button>
                        <button class="btn btn-action" style="padding:4px 8px; background: var(--slate-100); color: var(--slate-600);" onclick="window.app.fmModule?.notifyLogistics(${c.id}, '${c.refCode}')">
                            <i class="fas fa-shipping-fast"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        return `<table><thead><tr><th>Ref</th><th>Title</th><th>Vendor</th><th>Value</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>`;
    },

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
    },

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
    },

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
            this.loadContractsFromAPI();
        } catch (error) {
            window.toast.show('Failed to upload version: ' + error.message, 'error');
        }
    },

    viewDocument(url) {
        if (!url) {
            window.toast.show('No document URL available for this version.', 'warning');
            return;
        }
        window.open(url, '_blank');
    },

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
    },

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
    },

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
    },

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
    },

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
            if (this.currentView === 'contracts') this.loadContractsFromAPI();
        } catch (err) { window.toast.show(err.message, 'error'); }
    },

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
    },

    loadContractsView() {
        this.currentView = 'contracts';
        this.switchView('contracts');
    }
};
