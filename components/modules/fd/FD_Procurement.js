import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';
import requisitions from '../../../src/api/requisitions.api.js';

export const FD_Procurement = {
    getProcurementView() {
        setTimeout(() => this.loadProcurementData(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Project Procurement Status</div>
                    <div style="display:flex; gap:8px;">
                        <select id="procurement_project_select" class="form-input" style="width: 250px;" onchange="window.app.fmModule.loadProcurementData()">
                            <option value="">Select Project...</option>
                        </select>
                        <button class="btn btn-primary" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newVendorContract, 'lg'); setTimeout(() => { (window.app.fmModule || window.app.pmModule)?.loadContractProjects(true); (window.app.fmModule || window.app.pmModule)?.initContractUpload(); }, 100)"><i class="fas fa-file-contract"></i> Procure Materials</button>
                    </div>
                </div>
                <div id="fm-procurement-content">
                    <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-box-open" style="font-size: 32px; margin-bottom: 12px;"></i>
                        <div>Select a project to view its material requirements and procurement status.</div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadProcurementData() {
        // Load projects if not loaded
        const select = document.getElementById('procurement_project_select');
        if (select && select.options.length <= 1) {
            try {
                const res = await client.get('/projects?status=active');
                const projects = res.data?.data || res.data || [];
                projects.forEach(p => {
                    select.add(new Option(p.name, p.id));
                });
            } catch (e) { console.error('Failed to load projects', e); }
        }

        const projectId = select?.value;
        const container = document.getElementById('fm-procurement-content');
        if (!projectId || !container) return;

        container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading procurement status...</div>`;

        try {
            const res = await client.get(`/procurement/project-status/${projectId}`);
            const data = res.data;

            if (data.missingSpec) {
                container.innerHTML = `
                    <div style="padding: 60px 40px; text-align: center;">
                        <div style="width: 80px; height: 80px; background: var(--slate-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: var(--slate-400);">
                            <i class="fas fa-drafting-compass" style="font-size: 32px;"></i>
                        </div>
                        <h3 style="font-size: 18px; font-weight: 700; color: var(--slate-900); margin-bottom: 12px;">Project Specification Required</h3>
                        <p style="max-width: 450px; margin: 0 auto 24px; color: var(--slate-500); line-height: 1.6;">
                            This project has not been initialized with a technical road specification. Material procurement needs cannot be calculated until the Project Manager saves an approved technical estimate.
                        </p>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button class="btn btn-secondary" onclick="window.app.fmModule.loadProcurementData()">
                                <i class="fas fa-sync"></i> Check Again
                            </button>
                            <button class="btn btn-primary" style="background: var(--slate-800); border: none;" onclick="window.toast.show('Notification sent to PM', 'info')">
                                <i class="fas fa-bell"></i> Notify PM
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            if (!data.materials || data.materials.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);">No materials required for this project's current phase.</div>`;
                return;
            }

            const rows = data.materials.map(m => `
                <tr>
                    <td style="font-weight: 600;">${m.materialName}</td>
                    <td style="text-align: right; font-weight: 600;">${Number(m.requiredQuantity).toLocaleString()} ${m.unit}</td>
                    <td style="text-align: right; color: var(--emerald); font-weight: 700;">${Number(m.procuredQuantity).toLocaleString()} ${m.unit}</td>
                    <td style="text-align: right; color: var(--blue); font-weight: 700;">${Number(m.receivedQuantity || 0).toLocaleString()} ${m.unit}</td>
                    <td style="text-align: right; color: ${m.remainingQuantity > 0 ? 'var(--red)' : 'var(--slate-500)'};">${Number(m.remainingQuantity).toLocaleString()} ${m.unit}</td>
                    <td style="width: 200px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="flex:1; height:8px; background:var(--slate-200); border-radius:4px; overflow:hidden;">
                                <div style="height:100%; width:${m.percentComplete}%; background: ${m.percentComplete >= 100 ? 'var(--emerald)' : 'var(--orange)'};"></div>
                            </div>
                            <span style="font-size:11px; font-weight:600; width:40px;">${m.percentComplete}%</span>
                        </div>
                    </td>
                </tr>
            `).join('');

            container.innerHTML = `
                <div style="padding: 16px; background: var(--slate-50); border-bottom: 1px solid var(--border); display: flex; gap: 24px;">
                    <div>
                        <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Active Contracts</div>
                        <div style="font-size: 18px; font-weight: 800;">${data.totalContracts}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th style="text-align: right;">Required (Budget)</th>
                            <th style="text-align: right;">Procured</th>
                            <th style="text-align: right;">Received</th>
                            <th style="text-align: right;">Remaining</th>
                            <th>Fulfillment Progress</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } catch (error) {
            console.error('Failed to load procurement status:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.response?.data?.message || error.message}</div>`;
        }
    },

    getResourceApprovalsView() {
        setTimeout(() => this.loadPendingRequisitions(), 0);
        return `
            <div class="data-card">
               <div class="data-card-header">
                  <div class="card-title">Resource Requisition Queue (EC Forwarded)</div>
                  <div style="display:flex; gap:8px; align-items: center;">
                     <div class="dropdown" style="position: relative;">
                        <button class="btn btn-secondary" onclick="window.fmModule.toggleDropdown(this)"><i class="fas fa-filter"></i> Filters</button>
                        <div class="dropdown-content" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); z-index: 100; min-width: 320px; margin-top: 8px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--slate-100); padding-bottom: 12px;">
                                <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--slate-800);">Filter Requisitions</h4>
                                <button class="btn-text" style="font-size: 11px; color: var(--orange); font-weight: 600;" onclick="window.fmModule.resetRequisitionFilters()">Reset All</button>
                            </div>
                            
                            <div style="display: grid; gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 10px; font-weight: 800; color: var(--slate-400); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Project Context</label>
                                    <div style="position: relative;">
                                        <i class="fas fa-project-diagram" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--slate-400); font-size: 12px;"></i>
                                        <select id="filter_req_project" class="form-input" style="padding-left: 36px; border-radius: 8px;" onchange="window.fmModule.applyRequisitionFilters()">
                                            <option value="">All Active Projects</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div>
                                        <label style="display: block; font-size: 10px; font-weight: 800; color: var(--slate-400); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Source Type</label>
                                        <select id="filter_req_type" class="form-input" style="border-radius: 8px;" onchange="window.fmModule.applyRequisitionFilters()">
                                            <option value="">All Types</option>
                                            <option value="site">Site Req</option>
                                            <option value="stock">Stock Replen</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 10px; font-weight: 800; color: var(--slate-400); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Financial Risk</label>
                                        <select id="filter_req_budget" class="form-input" style="border-radius: 8px;" onchange="window.fmModule.applyRequisitionFilters()">
                                            <option value="">All Risks</option>
                                            <option value="healthy">Healthy</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                     <button class="btn btn-primary" onclick="window.fmModule.handleBulkApprove()" style="background: var(--emerald); border-color: var(--emerald);"><i class="fas fa-check-double"></i> Bulk Approve</button>
                  </div>
               </div>
               <div id="fm-approvals-table">
                   <div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading requisitions...</div>
               </div>
            </div>
        `;
    },

    resetRequisitionFilters() {
        const p = document.getElementById('filter_req_project');
        const t = document.getElementById('filter_req_type');
        const b = document.getElementById('filter_req_budget');
        if (p) p.value = '';
        if (t) t.value = '';
        if (b) b.value = '';
        this.applyRequisitionFilters();
    },

    applyRequisitionFilters() {
        this.requisitionFilters = {
            project: document.getElementById('filter_req_project')?.value || '',
            type: document.getElementById('filter_req_type')?.value || '',
            budget: document.getElementById('filter_req_budget')?.value || ''
        };
        this.renderFilteredRequisitions();
    },

    async loadPendingRequisitions() {
        const container = document.getElementById('fm-approvals-table');
        if (!container) return;

        try {
            const [reqsRes, repsRes, projectsRes] = await Promise.all([
                requisitions.getPending(),
                client.get('/replenishment/pending'),
                client.get('/projects?status=active')
            ]);

            const reqs = Array.isArray(reqsRes) ? reqsRes : (reqsRes.data || []);
            const reps = Array.isArray(repsRes) ? repsRes : (repsRes.data || []);
            const projects = projectsRes.data?.data || projectsRes.data || [];

            // Update project filter options
            const projectSelect = document.getElementById('filter_req_project');
            if (projectSelect && projectSelect.options.length <= 1) {
                projects.forEach(p => projectSelect.add(new Option(p.name, p.id)));
            }

            // Map replenishments to a similar structure for unified display
            const mappedReps = reps.map(r => ({
                ...r,
                isReplenishment: true,
                totalAmount: r.estimatedCost || 0,
                submitter: r.requester,
                items: [{ itemName: r.materialName, quantity: r.quantityNeeded }]
            }));

            this.data.requisitions = [...reqs, ...mappedReps].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            this.renderFilteredRequisitions();
        } catch (error) {
            console.error('Failed to load requisitions:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    },

    renderFilteredRequisitions() {
        const container = document.getElementById('fm-approvals-table');
        if (!container) return;

        const filters = this.requisitionFilters || { project: '', type: '', budget: '' };

        const filtered = this.data.requisitions.filter(req => {
            if (filters.project && String(req.projectId) !== String(filters.project)) return false;
            if (filters.type === 'site' && req.isReplenishment) return false;
            if (filters.type === 'stock' && !req.isReplenishment) return false;

            if (filters.budget) {
                const totalAmt = Number(req.totalAmount || 0);
                const projBudget = Number(req.project?.budgetTotal || 0);
                const projSpent = Number(req.project?.budgetSpent || 0);
                const remaining = projBudget - projSpent;
                const isCritical = (totalAmt > remaining && projBudget > 0) || (remaining < (projBudget * 0.1));
                if (filters.budget === 'healthy' && isCritical) return false;
                if (filters.budget === 'critical' && !isCritical) return false;
            }
            return true;
        });

        this.data.filteredRequisitions = filtered;

        if (filtered.length === 0) {
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px;"></i><div style="font-weight: 600;">No matches found for active filters</div></div>`;
            return;
        }

        container.innerHTML = `
            <div style="padding: 12px 16px; background: var(--slate-50); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 12px; font-weight: 600; color: var(--slate-600);">${filtered.length} requests showing</div>
            </div>
            <table>
                <thead>
                    <tr><th>Req ID</th><th>Project</th><th>Material Items</th><th>Requested By</th><th style="text-align:right">Value (MWK)</th><th>Budget Check</th><th>Action</th></tr>
                </thead>
                <tbody>
                    ${filtered.map(req => {
            const items = req.items || [];
            const desc = items.length ? items.map(i => `${i.itemName} x ${i.quantity}`).join(', ') : 'Resources';
            const totalAmt = Number(req.totalAmount || 0);
            const projBudget = Number(req.project?.budgetTotal || 0);
            const projSpent = Number(req.project?.budgetSpent || 0);
            const remaining = projBudget - projSpent;
            const isOverBudget = totalAmt > remaining && projBudget > 0;
            const isCritical = isOverBudget || (remaining < (projBudget * 0.1));

            return `
                            <tr onclick="window.fmModule.openRequisitionReview('${req.id}')">
                                <td>
                                    <span class="project-id">${req.reqCode || 'REQ-' + req.id}</span>
                                    ${req.isReplenishment ? '<span class="badge badge-primary" style="font-size: 9px; margin-left: 4px; background: var(--blue-light); color: var(--blue);">Stock</span>' : ''}
                                </td>
                                <td>${req.project?.name || req.project?.code || 'Project'}</td>
                                <td>${desc}</td>
                                <td>${req.submitter?.name || 'Field'}</td>
                                <td style="text-align:right; font-family: 'JetBrains Mono'; font-weight: 700;">${totalAmt.toLocaleString()}</td>
                                <td><span class="status ${isCritical ? 'delayed' : 'active'}" style="background: ${isCritical ? '#FEF2F2' : '#F0FDF4'}; color: ${isCritical ? 'var(--red)' : 'var(--emerald)'};">${isCritical ? 'Critical' : 'Healthy'} (${(remaining / 1000000).toFixed(1)}M Rem)</span></td>
                                <td>${isOverBudget
                    ? `<button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">Exceeds Budget</button>`
                    : `<button class="btn btn-action" style="padding: 4px 8px; font-size: 11px;">Review & Approve</button>`
                }</td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    }
};
