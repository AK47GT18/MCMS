import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';

export const FS_Logistics = {
    getLogisticsView() {
        // Trigger refresh
        setTimeout(() => {
            this._loadSiteInventory();
            this._loadInTransit();
        }, 0);

        const entries = Object.entries(this.siteInventory || {});

        return `
            ${this._renderInTransit()}
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header">
                    <div class="card-title">Site Material Inventory</div>
                    <button class="btn btn-secondary" onclick="window.app.fsModule._loadSiteInventory()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                ${!this.inventoryLoaded 
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading site inventory from server…</div></div>'
                : (entries.length === 0 
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-box-open" style="font-size:24px; margin-bottom:12px; display:block;"></i><div>No materials currently assigned to this site.</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Material</th><th>On-Site Stock</th><th>Sector</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            ${entries.map(([name, data]) => `
                                <tr>
                                    <td style="font-weight: 700;">${name}</td>
                                    <td style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px; color: ${data.qty === 0 ? 'var(--red)' : 'var(--slate-900)'};">${data.qty} ${data.unit}</td>
                                    <td style="font-size: 12px; color: var(--slate-500);">${data.sectorName || '--'}</td>
                                    <td style="text-align: right;">
                                        <button class="btn btn-secondary" onclick="window.drawer.open('Log Burn', window.DrawerTemplates.logMaterialBurn(${JSON.stringify({ name, ...data }).replace(/"/g, '&quot;')}))" ${data.qty === 0 ? 'disabled' : ''}>Log Consumption</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                )
            }
            </div>

            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title" style="color: var(--blue);">Site Equipment</div>
                </div>
                ${!this.assetsLoaded
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Checking site equipment fleet…</div></div>'
                : (this.siteAssets.length === 0
                    ? '<div style="padding: 32px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-pickup" style="font-size:24px; margin-bottom:12px; display:block; opacity: 0.5;"></i>No equipment currently assigned to site.</div>'
                    : `<table>
                        <thead><tr><th>Asset</th><th>Code</th><th>Status</th><th style="text-align: right;">Action</th></tr></thead>
                        <tbody>
                            ${this.siteAssets.map(asset => `
                                <tr>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                                    <td>
                                        <span class="status ${asset.status === 'maintenance' ? 'locked' : (asset.status === 'checked_out' ? 'active' : 'pending')}" style="${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">${(asset.status || '').replace(/_/g, ' ')}</span>
                                    </td>
                                    <td style="text-align: right;">
                                        ${asset.status !== 'maintenance' ?
                        `<button class="btn btn-secondary" onclick="window.app.fsModule.handleReportBreakdown('${asset.id}', '${asset.name}')" style="color: var(--red); border-color: var(--red-light);">
                                             <i class="fas fa-triangle-exclamation"></i> Report Breakdown
                                           </button>` : `<span style="font-size: 12px; color: var(--slate-400);">In Maintenance</span>`
                    }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                )
            }
        `;
    },

    async _loadSiteInventory() {
        try {
            const projectId = this.assignedProject?.id || 1;
            const result = await client.get(`/inventory/project/${projectId}`);
            const items = Array.isArray(result) ? result : (result.data || []);

            this.siteInventory = {};
            items.forEach(item => {
                this.siteInventory[item.materialName] = {
                    qty: Number(item.quantityOnHand || 0),
                    unit: item.unit,
                    sectorId: item.sectorId,
                    sectorName: item.sectorName,
                    inventoryId: item.id
                };
            });
            this.inventoryLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            this.inventoryLoaded = true;
            console.error('[FS] Failed to load site inventory:', error);
        }
    },

    async _loadInTransit() {
        try {
            const result = await client.get('/requisitions', { 
                projectId: this.assignedProject?.id || 1,
                status: 'approved'
            });
            const items = Array.isArray(result) ? result : (result.data || result.requisitions || []);
            this.inTransitItems = items.filter(r => r.dispatchStatus === 'in_transit');
            this._refreshCurrentView();
        } catch (error) {
            console.error('[FS] Failed to load in-transit items:', error);
        }
    },

    _renderInTransit() {
        if (!this.inTransitItems || this.inTransitItems.length === 0) return '';

        return `
            <div class="data-card animate-pulse" style="margin-bottom: 24px; border: 2px solid var(--blue-light); background: #f0f9ff;">
                <div class="data-card-header">
                    <div class="card-title" style="color: var(--blue);"><i class="fas fa-truck-moving"></i> Incoming Shipments</div>
                    <span class="badge badge-primary">${this.inTransitItems.length} En-Route</span>
                </div>
                <div style="padding: 16px;">
                    ${this.inTransitItems.map(item => {
                        const eta = item.estimatedArrival ? new Date(item.estimatedArrival).toLocaleString() : 'TBD';
                        const items = item.items.map(i => `${i.quantity} x ${i.itemName}`).join(', ');
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--blue-border);">
                                <div>
                                    <div style="font-weight: 700; font-size: 14px;">${items}</div>
                                    <div style="font-size: 11px; color: var(--slate-500);">ETA: ${eta} | ID: ${item.reqCode || 'REQ-'+item.id}</div>
                                </div>
                                <button class="btn btn-primary" style="background: var(--blue); border-color: var(--blue);" onclick="window.app.fsModule.handleConfirmArrival('${item.id}')">
                                    <i class="fas fa-check-circle"></i> Confirm Arrival
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    async handleConfirmArrival(reqId) {
        if (!confirm('Confirm that these resources have arrived physically at the site?')) return;

        try {
            window.toast.show('Confirming arrival...', 'info');
            await client.post(`/dispatch/${reqId}/confirm`);
            window.toast.show('Arrival confirmed. Site inventory updated.', 'success');
            await this._loadSiteInventory();
            await this._loadInTransit();
        } catch (error) {
            console.error('Arrival confirmation failed:', error);
            window.toast.show('Failed to confirm arrival.', 'error');
        }
    },

    toggleRequestType(type, btn) {
        const machView = document.getElementById('fs_machinery_req_view');
        const matView = document.getElementById('fs_material_req_view');
        if (!machView || !matView) return;

        if (type === 'machinery') {
            machView.style.display = 'block';
            matView.style.display = 'none';
        } else {
            machView.style.display = 'none';
            matView.style.display = 'block';
        }

        document.querySelectorAll('.active-resource').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    async handleSubmitRequisition() {
        const isMachinery = document.getElementById('fs_btn_machinery')?.classList.contains('active');
        const item = isMachinery ? document.getElementById('fs_req_asset')?.value : document.getElementById('fs_req_material')?.value;
        const qty = isMachinery ? 1 : document.getElementById('fs_req_qty')?.value;
        
        // Frontend Validation
        if (!item || ( !isMachinery && !qty)) {
            if (window.toast) window.toast.show('Please select a material/asset and specify quantity.', 'warning');
            return;
        }

        console.log('[FS] Transmitting request to Equipment Coordinator…');

        try {
            // Submit via API
            const result = await client.post('/requisitions', {
                projectId: this.assignedProject?.id || 1,
                totalAmount: 0,
                vendorName: 'Internal Request',
                items: [{ itemName: item, quantity: Number(qty) || 1, unitPrice: 0 }]
            });

            if (window.toast) {
                window.toast.show(`Request for ${item} sent to Finance Director for approval.`, 'success');
            }

            setTimeout(() => {
                window.drawer.close();
                console.log(`[FS] Request for ${item} submitted:`, result);
            }, 800);
        } catch (error) {
            console.error('[FS] Request failed:', error);
            if (window.toast) {
                window.toast.show('Failed to submit request. Please try again.', 'error');
            }
        }
    },

    handleConfirmIntake(id) {
        // This is now handled via the inventory API
        const item = this.incomingLogistics.find(i => i.id === id);
        if (!item) return;

        console.log(`[FS] Acknowledging receipt of ${item.item}…`);

        // Update via API
        if (item.type !== 'Machinery' && item.qty) {
            inventoryApi.distribute({
                sectorId: 1,
                materialName: item.item,
                unit: item.unit || 'Units',
                quantity: item.qty,
                reference: `Intake: ${id}`,
                notes: 'Confirmed arrival at site'
            }).then(() => {
                this.incomingLogistics = this.incomingLogistics.filter(i => i.id !== id);
                this._loadSiteInventory();
                console.log('[FS] Logistics intake complete. Inventory updated.');
            }).catch(err => {
                console.error('[FS] Intake failed:', err);
            });
        }
    },

    async handleExecuteBurn(name) {
        const qty = Number(document.getElementById('burn_qty')?.value);
        if (!qty) return;

        const material = this.siteInventory[name];
        if (!material || material.qty < qty) return;

        console.log('[FS] Recording material consumption…');

        try {
            await inventoryApi.consume({
                sectorId: material.sectorId || 1,
                materialName: name,
                quantity: qty,
                roadLayerId: document.getElementById('burn_layer')?.value,
                progressPercent: document.getElementById('burn_progress')?.value,
                reference: 'Site Activity Log',
                notes: `Consumed at site by Field Supervisor`
            });

            setTimeout(() => {
                window.drawer.close();
                this._loadSiteInventory();
                console.log(`[FS] Consumed ${qty} units. Stock updated.`);
            }, 600);
        } catch (error) {
            console.error('[FS] Consumption failed:', error);
        }
    }
};
