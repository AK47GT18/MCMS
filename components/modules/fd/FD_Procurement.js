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
                        <button class="btn btn-primary" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.fmModule?.loadContractProjects(); window.app.fmModule?.initContractUpload(); }, 100)"><i class="fas fa-file-contract"></i> Procure Materials</button>
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
            
            if (!data.materials || data.materials.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);">No materials required for this project's current phase.</div>`;
                return;
            }

            const rows = data.materials.map(m => `
                <tr>
                    <td style="font-weight: 600;">${m.materialName}</td>
                    <td style="text-align: right;">${Number(m.requiredQuantity).toLocaleString()} ${m.unit}</td>
                    <td style="text-align: right; color: var(--emerald);">${Number(m.procuredQuantity).toLocaleString()} ${m.unit}</td><td style="text-align: right; color: var(--blue); font-weight: 600;">${Number(m.procuredQuantity * 0.85).toLocaleString()} ${m.unit}</td>
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
                  <div style="display:flex; gap:8px;">
                     <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filters</button>
                     <button class="btn btn-primary" onclick="window.toast.show('Processing batch...', 'info')">Bulk Approve</button>
                  </div>
               </div>
               <div id="fm-approvals-table">
                   <div style="padding: 24px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin"></i> Loading requisitions...</div>
               </div>
            </div>
        `;
    },

    async loadPendingRequisitions() {
        const container = document.getElementById('fm-approvals-table');
        if (!container) return;

        try {
            const [reqsRes, repsRes] = await Promise.all([
                requisitions.getPending(),
                client.get('/replenishment/pending')
            ]);

            const reqs = Array.isArray(reqsRes) ? reqsRes : (reqsRes.data || []);
            const reps = Array.isArray(repsRes) ? repsRes : (repsRes.data || []);
            
            // Map replenishments to a similar structure for unified display
            const mappedReps = reps.map(r => ({
                ...r,
                isReplenishment: true,
                totalAmount: r.estimatedCost || 0,
                submitter: r.requester,
                items: [{ itemName: r.materialName, quantity: r.quantityNeeded }]
            }));

            const allPending = [...reqs, ...mappedReps].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            this.data.requisitions = allPending;

            if (allPending.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i><div style="font-weight: 600;">No pending requisitions</div></div>`;
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr><th>Req ID</th><th>Project</th><th>Material Items</th><th>Requested By</th><th style="text-align:right">Value (MWK)</th><th>Budget Check</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${allPending.map(req => {
                            const items = req.items || [];
                            const desc = items.length ? items.map(i => `${i.itemName} x ${i.quantity}`).join(', ') : 'Resources';
                            const totalAmt = Number(req.totalAmount || 0);
                            const projBudget = Number(req.project?.budgetTotal || 0);
                            const projSpent = Number(req.project?.budgetSpent || 0);
                            const remaining = projBudget - projSpent;
                            const isOverBudget = totalAmt > remaining && projBudget > 0;
                            const isCritical = isOverBudget || (remaining < (projBudget * 0.1));
                            
                            return `
                                <tr onclick="(window.fmModule || window.app?.fmModule)?.openRequisitionReview('${req.id}', ${req.isReplenishment ? 'true' : 'false'})">
                                    <td>
                                        <span class="project-id">${req.reqCode || 'REQ-' + req.id}</span>
                                        ${req.isReplenishment ? '<span class="badge badge-primary" style="font-size: 9px; margin-left: 4px; background: var(--blue-light); color: var(--blue);">Stock</span>' : ''}
                                    </td>
                                    <td>${req.project?.name || req.project?.code || 'Project'}</td>
                                    <td>${desc}</td>
                                    <td>${req.submitter?.name || 'Field'}</td>
                                    <td style="text-align:right; font-family: 'JetBrains Mono'; font-weight: 700;">${totalAmt.toLocaleString()}</td>
                                    <td><span class="status ${isCritical ? 'delayed' : 'active'}" style="background: ${isCritical ? '#FEF2F2' : '#F0FDF4'}; color: ${isCritical ? 'var(--red)' : 'var(--emerald)'};">${isCritical ? 'Critical' : 'Healthy'} (${this.formatCurrency(remaining)} Rem)</span></td>
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
        } catch (error) {
            console.error('Failed to load requisitions:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    }
};
