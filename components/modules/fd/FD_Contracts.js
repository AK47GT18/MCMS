import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';
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
                    ${this.currentContractTab === 'project' 
                        ? `<button class="btn btn-primary" onclick="window.app.fmModule?.openNewProjectContract()"><i class="fas fa-file-signature"></i> New Project Master</button>`
                        : `<button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange);" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.fmModule?.loadContractProjects(); window.app.fmModule?.initContractUpload(); }, 100)"><i class="fas fa-plus"></i> New Vendor Contract</button>`
                    }
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

            // Load contracts
            const response = await contracts.getAll({ limit: 100 });
            const data = response.data || response;
            const allContracts = Array.isArray(data) ? data : data.contracts || [];
            
            // Store raw contracts
            this.allContracts = allContracts;
            this._contractsMap = allContracts; // For legacy methods
            
            // Populate vendor filter dynamically from contracts
            if (this.currentContractTab === 'vendor') {
                const vendorSelect = document.getElementById('contract-vendor-filter');
                if (vendorSelect) {
                    const uniqueVendors = new Map();
                    allContracts.forEach(c => {
                        if (c.vendorId) {
                            uniqueVendors.set(c.vendorId, c.vendor?.name || c.vendorName || `Vendor ${c.vendorId}`);
                        }
                    });
                    vendorSelect.innerHTML = '<option value="">All Vendors</option>';
                    uniqueVendors.forEach((name, id) => {
                        const opt = document.createElement('option');
                        opt.value = id;
                        opt.textContent = name;
                        if (this.vendorFilter == id) opt.selected = true;
                        vendorSelect.appendChild(opt);
                    });
                }
            }
            
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
        
                const rows = filtered.map(item => {
            const endDate = item.endDate ? new Date(item.endDate) : null;
            const today = new Date();
            const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
            const isExpired = daysLeft !== null && daysLeft <= 0;
            const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
            
            let statusClass = item.status === 'Active' ? 'active' : 'locked';
            if (isExpired) statusClass = 'delayed';
            if (isExpiringSoon) statusClass = 'locked';

            return `
                <tr onclick="window.app.fmModule.viewContract(${item.id})">
                    <td><span class="project-id">${item.contractCode || 'CON-' + item.id}</span></td>
                    <td>
                        <div style="font-weight: 600;">${item.title}</div>
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 500;">${item.vendor?.name || item.vendorName || 'General'}</div>
                    </td>
                    <td>${item.project?.name || 'Multi-Project'}</td>
                    <td style="font-family:'JetBrains Mono'; font-weight: 700;">${formatValue(item.value)}</td>
                    <td>
                        <span class="status ${statusClass}">${isExpired ? 'EXPIRED' : (item.status || 'Draft').toUpperCase()}</span>
                        ${isExpiringSoon ? `<div style="font-size: 10px; color: var(--orange); font-weight: 600; margin-top: 4px;">Expires in ${daysLeft} days</div>` : ''}
                        ${isExpired ? `<div style="font-size: 10px; color: var(--red); font-weight: 600; margin-top: 4px;">Action Required</div>` : ''}
                    </td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">View</button>
                    </td>
                </tr>
            `;
        }).join('');

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

    async onProjectContractSelected(projectId) {
        if (!projectId) return;
        
        try {
            window.toast.show('Fetching project baselines...', 'info');
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch(`/api/v1/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            const project = result.data || result;

            // Pre-fill values
            const valInput = document.getElementById('contract_value');
            if (valInput) valInput.value = project.budgetTotal || 0;

            const startInput = document.getElementById('contract_start');
            if (startInput && project.startDate) startInput.value = project.startDate.split('T')[0];

            const endInput = document.getElementById('contract_end');
            if (endInput && project.endDate) endInput.value = project.endDate.split('T')[0];

            // Random Code Generation
            const refInput = document.getElementById('contract_ref');
            if (refInput) {
                const random = Math.floor(1000 + Math.random() * 9000);
                refInput.value = `MOW-${project.code || 'PRJ'}-${random}`;
            }

            window.toast.show('Project timelines & values synced.', 'success');
        } catch (err) {
            console.error('Error fetching project for contract', err);
        }
    },

    openNewProjectContract() {
        window.drawer.open('Archive Project Master Contract', window.DrawerTemplates.newProjectContract);
        setTimeout(() => {
            this.loadContractProjects();
            this.initContractUpload(); // Reuse existing upload init
        }, 100);
    },

    async submitProjectContract() {
        // Document upload validation
        const fileInput = document.getElementById('contract_document');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            window.toast.show('Please upload the signed master agreement document.', 'error');
            const dropZone = document.getElementById('contract-drop-zone');
            if (dropZone) {
                dropZone.style.borderColor = 'var(--red)';
                dropZone.style.background = '#fef2f2';
                dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => { dropZone.style.borderColor = ''; dropZone.style.background = ''; }, 3000);
            }
            return;
        }

        const startDateRaw = document.getElementById('contract_start')?.value;
        const endDateRaw = document.getElementById('contract_end')?.value;

        const data = {
            projectId: parseInt(document.getElementById('contract_project')?.value, 10),
            refCode: document.getElementById('contract_ref')?.value,
            title: 'Project Master Agreement',
            value: parseFloat(document.getElementById('contract_value')?.value),
            startDate: startDateRaw ? new Date(startDateRaw).toISOString() : undefined,
            endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
            contractType: 'project'
        };

        if (!data.projectId || isNaN(data.projectId) || !data.refCode || !data.value) {
            window.toast.show('Please fill all required project contract fields', 'warning');
            return;
        }

        window.toast.show('Archiving master agreement...', 'info');

        try {
            const token = localStorage.getItem('mcms_auth_token');

            // Upload document first
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            const uploadRes = await fetch('/api/v1/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!uploadRes.ok) throw new Error('File upload failed');
            const uploadResult = await uploadRes.json();
            const uploadData = uploadResult.data || uploadResult;
            data.documentUrl = uploadData.url;
            data.fileName = uploadData.originalName;

            const res = await fetch('/api/v1/contracts', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) {
                const errMsg = result?.error?.details?.map(d => `${d.field}: ${d.message}`).join(', ') || result?.error?.message || 'Failed to archive project contract';
                throw new Error(errMsg);
            }
            
            window.toast.show('Project Master Contract Archived successfully', 'success');
            window.drawer.close();
            this.loadContractsData();
        } catch (err) {
            window.toast.show(err.message, 'error');
        }
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

    // Using global window.viewDocument and window.downloadDocument instead
    
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

        const valueInput = document.getElementById('contract_value');
        if (valueInput) {
            valueInput.oninput = () => this.calculateContractValue(true);
        }
    },

    async onContractProjectSelected(projectId) {
        const list = document.getElementById('contract-materials-list');
        const section = document.getElementById('contract-materials-section');
        if (!list || !projectId) return;
        section.style.display = 'block';
        list.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
                <i class="fas fa-circle-notch fa-spin" style="margin-right: 8px; color: var(--orange);"></i>
                <span style="font-size: 13px; color: var(--slate-500);">Fetching project requirements & budget...</span>
            </div>
        `;
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch(`/api/v1/projects/${projectId}/materials`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            const data = result.data || result;
            const materials = data.materials || [];
            const budget = data.budgetSummary || {};
            
            // Store budget for submission check
            this.currentProjectBudget = budget;

            // Update Budget Display
            const budgetDisplay = document.getElementById('contract-budget-status');
            if (budgetDisplay) {
                const remaining = Number(budget.remaining || 0);
                const percent = Number(budget.percentUsed || 0);
                budgetDisplay.innerHTML = `
                    <div style="background: ${remaining < 1000000 ? '#fef2f2' : 'var(--slate-50)'}; border: 1px solid ${remaining < 1000000 ? '#fee2e2' : 'var(--slate-200)'}; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Available Project Funds</span>
                            <span style="font-size: 14px; font-weight: 800; color: ${remaining < 1000000 ? 'var(--red)' : 'var(--slate-900)'};">MWK ${remaining.toLocaleString()}</span>
                        </div>
                        <div style="height: 6px; background: var(--slate-200); border-radius: 3px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: ${percent > 90 ? 'var(--red)' : 'var(--emerald) track'};"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 6px;">
                            <span style="font-size: 10px; color: var(--slate-400);">${percent}% Budget Utilized</span>
                            ${remaining < 1000000 ? '<span style="font-size: 10px; color: var(--red); font-weight: 700;"><i class="fas fa-exclamation-triangle"></i> CRITICAL BALANCE</span>' : ''}
                        </div>
                    </div>
                `;
            }

            if (materials.length === 0) { 
                list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--slate-400); font-size: 12px;">No specifications found for this project.</div>'; 
                return; 
            }

            // Check if any materials already have contracted quantities
            const hasExistingContracts = materials.some(m => m.contractedQuantity > 0);
            if (hasExistingContracts) {
                const titleInput = document.getElementById('contract_title');
                if (titleInput && !titleInput.value.includes('Extension')) {
                    titleInput.value = `[EXTENSION] ` + titleInput.value;
                }
                const submitBtn = document.querySelector('button[onclick*="submitContract"]');
                if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Update/Extend Contract';
            }

            list.innerHTML = `
                <div style="padding: 8px 12px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">
                    <div style="flex: 2;">Material Name</div>
                    <div style="flex: 1; text-align: right;">Total Required</div>
                    <div style="flex: 1; text-align: right;">Already Contracted</div>
                    <div style="flex: 1.2; text-align: right;">New Qty</div>
                </div>
                ${materials.map((m, i) => {
                    const remainingNeeded = Math.max(0, m.quantity - m.contractedQuantity);
                    return `
                        <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid var(--slate-100);">
                            <div style="flex: 2; display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" name="contract_material" id="m_cb_${i}" value="${i}" 
                                    data-name="${m.name}" data-unit="${m.unit}" data-price="${m.unitCostHigh || 0}"
                                    onchange="window.app.fmModule?.calculateContractValue(); document.getElementById('m_qty_${i}').disabled = !this.checked">
                                <div>
                                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-800);">${m.name}</div>
                                    <div style="font-size: 11px; color: var(--slate-500);">${m.unit} • Est. MWK ${Number(m.unitCostHigh || 0).toLocaleString()}/unit</div>
                                </div>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 12px; font-weight: 600; color: var(--slate-600);">${m.quantity}</div>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 12px; font-weight: 600; color: ${m.contractedQuantity > 0 ? 'var(--orange)' : 'var(--slate-400)'};">${m.contractedQuantity}</div>
                            </div>
                            <div style="flex: 1.2; text-align: right;">
                                <input type="number" id="m_qty_${i}" class="form-input" disabled value="${remainingNeeded > 0 ? remainingNeeded : 0}" 
                                    min="1" oninput="window.app.fmModule?.calculateContractValue()"
                                    style="width: 80px; padding: 4px 8px; font-size: 12px; text-align: right; border-radius: 6px;">
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
            this.calculateContractValue();
        } catch (err) { 
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444; font-size: 12px;">Error loading materials list.</div>'; 
        }
    },

    calculateContractValue(fromManualInput = false) {
        const checkboxes = document.querySelectorAll('input[name="contract_material"]:checked');
        let total = 0;
        
        if (fromManualInput) {
            total = parseFloat(document.getElementById('contract_value')?.value || 0);
        } else {
            checkboxes.forEach(cb => {
                const index = cb.value;
                const price = parseFloat(cb.dataset.price || 0);
                const qtyInput = document.getElementById(`m_qty_${index}`);
                const qty = parseFloat(qtyInput?.value || 0);
                total += (price * qty);
            });
        }
        
        const valueInput = document.getElementById('contract_value');
        if (valueInput) {
            if (!fromManualInput) {
                valueInput.value = total;
                // Visual feedback that it auto-calculated
                valueInput.style.backgroundColor = '#fff7ed';
                setTimeout(() => { valueInput.style.backgroundColor = ''; }, 500);
            }

            // Real-time Budget Validation
            const remainingBudget = this.currentProjectBudget?.remaining || 0;
            const submitBtn = document.querySelector('button[onclick*="submitContract"]');
            
            if (total > remainingBudget) {
                const deficit = total - remainingBudget;
                valueInput.style.color = 'var(--red)';
                valueInput.style.borderColor = 'var(--red)';
                
                // Show warning in budget status area
                const budgetDisplay = document.getElementById('contract-budget-status');
                if (budgetDisplay) {
                    // Update the label to reflect uplift state
                    const budgetLabel = budgetDisplay.querySelector('span[style*="text-transform: uppercase"]');
                    if (budgetLabel) {
                        budgetLabel.innerHTML = 'Budget Uplift Required';
                        budgetLabel.style.color = 'var(--red)';
                    }

                    if (!document.getElementById('budget-deficit-warning')) {
                        const warning = document.createElement('div');
                        warning.id = 'budget-deficit-warning';
                        warning.style.cssText = 'background: #fef2f2; border: 1px solid #fee2e2; padding: 10px; border-radius: 8px; margin-top: 10px; color: #991b1b; font-size: 11px; font-weight: 600;';
                        warning.innerHTML = `<i class="fas fa-exclamation-circle"></i> BUDGET EXCEEDED: You are over by MWK ${deficit.toLocaleString()}. An uplift request will be required.`;
                        budgetDisplay.appendChild(warning);
                    }
                }
                
                if (submitBtn) {
                    submitBtn.style.opacity = '0.7';
                    submitBtn.innerHTML = `<i class="fas fa-lock"></i> Budget Exceeded (Deficit: ${deficit.toLocaleString()})`;
                }
            } else {
                valueInput.style.color = 'var(--slate-900)';
                valueInput.style.borderColor = 'var(--slate-300)';
                const warning = document.getElementById('budget-deficit-warning');
                if (warning) warning.remove();

                // Restore the label
                const budgetDisplay = document.getElementById('contract-budget-status');
                if (budgetDisplay) {
                    const budgetLabel = budgetDisplay.querySelector('span[style*="text-transform: uppercase"]');
                    if (budgetLabel) {
                        budgetLabel.innerHTML = 'Available Project Funds';
                        budgetLabel.style.color = 'var(--slate-500)';
                    }
                }
                
                if (submitBtn) {
                    submitBtn.style.opacity = '1';
                    submitBtn.innerHTML = '<i class="fas fa-file-contract"></i> Create Contract';
                }
            }
        }
    },

    async submitContract() {
        // Document upload validation - require a file before submission
        const fileInput = document.getElementById('contract_document');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            window.toast.show('Please upload a signed contract document before submitting.', 'error');
            const dropZone = document.getElementById('contract-upload-zone');
            if (dropZone) {
                dropZone.style.borderColor = 'var(--red)';
                dropZone.style.background = '#fef2f2';
                dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => { dropZone.style.borderColor = ''; dropZone.style.background = ''; }, 3000);
            }
            return;
        }

        const startDateRaw = document.getElementById('contract_start')?.value;
        const endDateRaw = document.getElementById('contract_end')?.value;

        const data = {
            projectId: parseInt(document.getElementById('contract_project')?.value, 10),
            vendorName: document.getElementById('contract_vendor')?.value,
            title: document.getElementById('contract_title')?.value,
            value: parseFloat(document.getElementById('contract_value')?.value),
            startDate: startDateRaw ? new Date(startDateRaw).toISOString() : undefined,
            endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
            retentionPercentage: parseFloat(document.getElementById('contract_retention')?.value || 0),
            isTaxInclusive: document.getElementById('contract_tax_inclusive')?.checked || false,
            advancePaymentAmount: parseFloat(document.getElementById('contract_advance')?.value || 0),
            guaranteeExpiry: document.getElementById('contract_guarantee_expiry')?.value || null
        };

        // Basic field validation
        if (!data.projectId || isNaN(data.projectId)) {
            window.toast.show('Please select a project.', 'error');
            return;
        }
        if (!data.title) {
            window.toast.show('Please enter a contract title.', 'error');
            return;
        }
        if (!data.value || isNaN(data.value) || data.value <= 0) {
            window.toast.show('Please enter a valid contract value.', 'error');
            return;
        }

        // Calculate financial breakdown
        data.retentionAmount = (data.value * (data.retentionPercentage / 100));
        if (data.isTaxInclusive) {
            data.vatAmount = data.value * (16.5 / 116.5);
            const netBeforeTax = data.value - data.vatAmount;
            data.whtAmount = netBeforeTax * 0.03;
        } else {
            data.vatAmount = data.value * 0.165;
            data.whtAmount = data.value * 0.03;
        }
        const checkboxes = document.querySelectorAll('input[name="contract_material"]:checked');
        const materials = Array.from(checkboxes).map(cb => {
            const index = cb.value;
            const qtyInput = document.getElementById(`m_qty_${index}`);
            return { 
                name: cb.dataset.name, 
                quantity: parseFloat(qtyInput?.value || 0), 
                unit: cb.dataset.unit,
                unitPrice: parseFloat(cb.dataset.price || 0)
            };
        });

        // Budget Validation
        const remainingBudget = this.currentProjectBudget?.remaining || 0;
        if (data.value > remainingBudget) {
            const deficit = data.value - remainingBudget;
            window.toast.show(`Insufficient budget! Deficit: MWK ${deficit.toLocaleString()}`, 'error');
            
            // Auto-redirect to Uplift Drawer
            setTimeout(() => {
                const projectSelect = document.getElementById('contract_project');
                const projectText = projectSelect?.options[projectSelect.selectedIndex]?.text || 'Selected Project';
                const [pCode, pName] = projectText.split(' – ');
                
                window.drawer.open('Request Budget Uplift', window.DrawerTemplates.initiateBCR([
                    { id: data.projectId, code: pCode || 'PRJ', name: pName || 'Project' }
                ], data.projectId));
                
                // Pre-fill deficit
                const bcrAmount = document.getElementById('bcr_amount');
                if (bcrAmount) bcrAmount.value = deficit;
                const bcrReason = document.getElementById('bcr_reason');
                const contractTitle = data.title || 'New Vendor Procurement';
                const materialSummary = materials.map(m => `${m.name} (${m.quantity} ${m.unit})`).join(', ');
                
                if (bcrReason) {
                    bcrReason.value = `Budget uplift required for contract "${contractTitle}". \n\nMaterials to be procured: ${materialSummary}. \n\nThe contract value exceeds current balance by MWK ${deficit.toLocaleString()}.`;
                }
            }, 1000);
            return;
        }

        window.toast.show('Establishing contract...', 'info');

        try {
            const token = localStorage.getItem('mcms_auth_token');

            // File Upload Logic
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            const uploadRes = await fetch('/api/v1/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!uploadRes.ok) throw new Error('File upload failed');
            const uploadResult = await uploadRes.json();
            const uploadData = uploadResult.data || uploadResult;
            data.documentUrl = uploadData.url;
            data.fileName = uploadData.originalName;

            const res = await fetch('/api/v1/contracts', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, materialsList: JSON.stringify(materials), refCode: 'CON-' + Date.now().toString(36).toUpperCase() })
            });
            
            const result = await res.json();
            if (!res.ok) {
                const errMsg = result?.error?.details?.map(d => `${d.field}: ${d.message}`).join(', ') || result?.error?.message || 'System error creating contract';
                throw new Error(errMsg);
            }
            
            const contract = result.data || result;
            
            window.toast.show('Contract established successfully', 'success');
            
            // Automatically notify Logistics
            if (contract && contract.id) {
                this.notifyLogistics(contract.id, contract.refCode || ('CON-' + contract.id));
            }
            
            window.drawer.close();
            if (this.currentView === 'contracts') this.loadContractsData();
        } catch (err) { window.toast.show(err.message, 'error'); }
    },

    async handleSubmitUplift() {
        const data = {
            projectId: parseInt(document.getElementById('bcr_project')?.value),
            amount: parseFloat(document.getElementById('bcr_amount')?.value),
            reason: document.getElementById('bcr_reason')?.value,
            requesterId: window.app.currentUser?.id
        };

        if (!data.projectId || !data.amount || !data.reason) {
            window.toast.show('Please provide project, amount and justification.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch('/api/v1/budget-changes', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) throw new Error('Failed to submit uplift request');
            
            window.toast.show('Budget Uplift Request sent to PM for approval', 'success');
            window.drawer.close();
            
            // Optionally refresh view or dashboard
            if (this.currentView === 'procurement') this.loadProcurementData();
        } catch (err) {
            window.toast.show(err.message, 'error');
        }
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
