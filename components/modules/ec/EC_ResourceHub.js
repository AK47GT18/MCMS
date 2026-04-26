import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const EC_ResourceHub = {
    getResourceHubView() {
        const activeTab = this.hubActiveTab || 'field';

        const fieldCount = this.requisitionQueue.length;
        const fmCount = this.pendingReceipts.length;

        return `
            <div class="hub-filter-bar" style="display: flex; gap: 12px; margin-bottom: 24px; background: var(--slate-100); padding: 6px; border-radius: 12px; width: fit-content;">
                <button class="btn ${activeTab === 'field' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.ecModule?.switchHubTab('field')">Field Requisitions (${fieldCount})</button>
                <button class="btn ${activeTab === 'fm' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.ecModule?.switchHubTab('fm')">FM Receipts (${fmCount})</button>
            </div>

            ${activeTab === 'fm' ? this._renderFMReceiptsTable() : this._renderRequisitionsTable()}
        `;
    },

    switchHubTab(tabId) {
        this.hubActiveTab = tabId;
        if (tabId === 'fm') {
            this._loadProcurementReceipts();
        } else {
            this._loadRequisitions();
        }
        window.app.loadPage(this.currentView);
    },

    _renderFMReceiptsTable() {
        if (this.pendingReceipts.length === 0) {
            return `<div class="data-card"><div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i><div style="font-weight: 600;">No pending receipts</div></div></div>`;
        }
        return `
            <div class="data-card animate-slide-up" style="border: 1px solid var(--blue-border); background: #f8fafc;">
                <div class="data-card-header">
                    <div class="card-title">Pending Receipts from FM</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Contract</th><th>Material</th><th>Project</th><th>Supplier</th><th>Pending Qty</th><th style="text-align: right;">Action</th></tr>
                    </thead>
                    <tbody>
                        ${this.pendingReceipts.map(item => `
                            <tr>
                                <td><span class="project-id">${item.contractRef}</span></td>
                                <td style="font-weight: 700;">${item.name}</td>
                                <td>${item.projectName || '--'}</td>
                                <td>${item.vendor}</td>
                                <td style="font-weight: 800; color: var(--blue);">${item.qty} ${item.unit}</td>
                                <td style="text-align: right;">
                                    <button class="btn btn-primary" onclick="window.drawer.open('Receipt Confirmation', window.DrawerTemplates.receiveProcurement(${JSON.stringify(item).replace(/"/g, '&quot;')}))">Receive Goods</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    _renderRequisitionsTable() {
        if (this.requisitionQueue.length === 0) {
            return `<div class="data-card"><div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px;"></i><div style="font-weight: 600;">No approved requisitions ready for Intake</div><div style="font-size: 13px;">Waiting for Finance approval</div></div></div>`;
        }
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Approved Requisitions (Pending Intake)</div>
                </div>
                <table>
                    <thead>
                        <tr><th>Req ID</th><th>Project</th><th>Resource</th><th>Total Cost</th><th style="text-align: right;">Action</th></tr>
                    </thead>
                    <tbody>
                        ${this.requisitionQueue.map(req => {
                            const items = req.items || [];
                            const desc = items.length ? items.map(i => `${i.quantity} ${i.itemName}`).join(', ') : 'Resources';
                            return `
                            <tr>
                                <td><span class="project-id">${req.reqCode || 'REQ-' + req.id}</span></td>
                                <td style="font-weight: 600;">${req.project?.name || req.project?.code || 'Project'}</td>
                                <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${desc}</td>
                                <td>K${Number(req.totalAmount || 0).toLocaleString()}</td>
                                <td style="text-align: right;">
                                    <button class="btn btn-primary" onclick="window.app.ecModule.handleIntake('${req.id}')"><i class="fas fa-box-open"></i> Intake (GRN)</button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async _loadRequisitions() {
        if (this.isLoadingRequisitions) return;
        this.isLoadingRequisitions = true;
        try {
            // Load approved requisitions ready for GRN/Intake
            const result = await requisitions.getAll({ status: 'approved' });
            const data = result.data || result;
            this.requisitionQueue = Array.isArray(data) ? data : (data.items || data.requisitions || []);
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load requisitions:', error);
        } finally {
            this.isLoadingRequisitions = false;
        }
    },

    async _loadProcurementReceipts() {
        if (this.isLoadingProc) return;
        this.isLoadingProc = true;
        try {
            const result = await inventoryApi.getIncomingShipments();
            const items = Array.isArray(result) ? result : (result.data || []);
            this.pendingReceipts = items.map(p => ({
                id: p.id, // ContractItem ID
                contractRef: p.contractRef,
                name: p.materialName,
                qty: p.pendingQty,
                totalQty: p.totalQty,
                unit: p.unit,
                vendor: p.vendorName,
                projectName: p.projectName
            }));
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load procurement receipts:', error);
        } finally {
            this.isLoadingProc = false;
        }
    }
};
