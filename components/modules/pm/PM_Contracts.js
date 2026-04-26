import client from '../../../src/api/client.js';
import projects from '../../../src/api/projects.api.js';
import users from '../../../src/api/users.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import requisitions from '../../../src/api/requisitions.api.js';
import audit from '../../../src/api/audit.api.js';
import procurement from '../../../src/api/procurement.api.js';
import assets from '../../../src/api/assets.api.js';
import issues from '../../../src/api/issues.api.js';
import tasks from '../../../src/api/tasks.api.js';
import contracts from '../../../src/api/contracts.api.js';

export const PM_Contracts = {
    getContractsView() {
        this.currentContractTab = this.currentContractTab || 'project';
        this.projectFilter = '';
        this.vendorFilter = '';
        
        setTimeout(() => this.loadContractsData(), 0);
        
        return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Contract Registry & Legal Repository</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('New Contract', window.DrawerTemplates.newContract)"><i class="fas fa-upload"></i> Upload Contract</button>
                </div>
                
                <div class="tabs" style="margin-bottom: 0; padding: 0 24px; border-bottom: 1px solid var(--slate-200);">
                    <div class="tab ${this.currentContractTab === 'project' ? 'active' : ''}" data-tab="project" onclick="window.app.pmModule.switchContractTab('project')">Project Contracts</div>
                    <div class="tab ${this.currentContractTab === 'vendor' ? 'active' : ''}" data-tab="vendor" onclick="window.app.pmModule.switchContractTab('vendor')">Vendor Contracts</div>
                </div>
                
                <div style="padding: 16px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; gap: 16px;">
                    <select id="contract-project-filter" class="form-input" style="max-width: 250px;" onchange="window.app.pmModule.handleContractFilterChange()">
                        <option value="">All Projects</option>
                        <!-- Projects loaded dynamically -->
                    </select>
                    ${this.currentContractTab === 'vendor' ? `
                    <select id="contract-vendor-filter" class="form-input" style="max-width: 250px;" onchange="window.app.pmModule.handleContractFilterChange()">
                        <option value="">All Vendors</option>
                        <!-- Vendors loaded dynamically -->
                    </select>
                    ` : ''}
                </div>

                <div id="contracts-table-container">
                    ${this.renderLoadingState()}
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
            
            this.renderContractsTable();

        } catch (error) {
            console.error('Failed to load contracts:', error);
            container.innerHTML = this.renderEmptyState('Failed to load contract registry.');
        }
    },

    renderContractsTable() {
        const container = document.getElementById('contracts-table-container');
        if (!container) return;
        
        if (!this.allContracts || this.allContracts.length === 0) {
            container.innerHTML = this.renderEmptyState('No contracts found in the repository.');
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
            container.innerHTML = this.renderEmptyState('No contracts match the selected filters.');
            return;
        }

        const rows = filtered.map(item => `
            <tr>
                <td><span class="project-id">${this.escapeHTML(item.code || item.refCode || 'CNT-' + item.id)}</span></td>
                <td style="font-weight:600;">${this.escapeHTML(item.title)}</td>
                ${this.currentContractTab === 'vendor' ? `<td>${this.escapeHTML(item.vendorName || item.vendor?.name || 'N/A')}</td>` : ''}
                <td><span class="status active" style="background:var(--slate-100); color:var(--slate-600);">${this.escapeHTML((item.type || item.contractType || 'Service').replace(/_/g, ' '))}</span></td>
                <td>v${this.escapeHTML(item.version || '1.0')}</td>
                <td>${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Contract Viewer', window.DrawerTemplates.contractViewer(${JSON.stringify(item).replace(/"/g, '&quot;')}))"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Contract ID</th>
                        <th>Title</th>
                        ${this.currentContractTab === 'vendor' ? '<th>Vendor</th>' : ''}
                        <th>Type</th>
                        <th>Version</th>
                        <th>Expiry Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
};
