import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';
import inventoryApi from '../../../src/api/inventory.api.js';

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
                                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                            <button class="btn btn-secondary btn-sm" onclick="window.drawer.open('Log Burn', window.DrawerTemplates.logMaterialBurn(${JSON.stringify({ name, ...data }).replace(/"/g, '&quot;')}))" ${data.qty === 0 ? 'disabled' : ''}>Log Consumption</button>
                                            <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.openReturnDrawer('${name}')" style="color: var(--orange); border-color: var(--orange-light);" ${data.qty === 0 ? 'disabled' : ''}>
                                                <i class="fas fa-undo"></i> Return
                                            </button>
                                        </div>
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
        const btnMachinery = document.getElementById('fs_btn_machinery');
        const btnMaterials = document.getElementById('fs_btn_materials');

        if (!machView || !matView) return;

        // Reset both buttons to inactive state (slate/transparent)
        [btnMachinery, btnMaterials].forEach(b => {
            if (b) {
                b.style.background = 'transparent';
                b.style.color = 'var(--slate-600)';
                b.classList.remove('active');
            }
        });

        // Set active state (orange/white)
        btn.style.background = 'var(--orange)';
        btn.style.color = 'white';
        btn.classList.add('active');

        if (type === 'machinery') {
            machView.style.display = 'block';
            matView.style.display = 'none';
        } else {
            machView.style.display = 'none';
            matView.style.display = 'block';
        }
    },

    // Initialize requisition cart
    requisitionCart: [],

    addItemToRequisition(type) {
        const selectId = type === 'machinery' ? 'fs_mac_select' : 'fs_mat_select';
        const qtyId = type === 'machinery' ? 'fs_mac_qty' : 'fs_mat_qty';
        
        const selectEl = document.getElementById(selectId);
        const qtyInput = document.getElementById(qtyId);
        
        if (!selectEl || !selectEl.value || !qtyInput || !qtyInput.value) {
            if (window.toast) window.toast.show('Please select an item and quantity', 'warning');
            return;
        }

        const qty = parseFloat(qtyInput.value);
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        
        const item = {
            category: type,
            itemName: selectEl.value,
            quantity: qty,
            unit: selectedOption.dataset.unit || (type === 'machinery' ? 'units' : ''),
            available: selectedOption.dataset.available !== 'false',
            type: selectedOption.dataset.type || '',
            source: selectedOption.dataset.source || 'inventory',
            approvedQty: selectedOption.dataset.approved || null
        };

        // Add to cart
        this.requisitionCart.push(item);
        
        // Refresh UI
        this._renderRequisitionCart();
        
        // Feedback
        if (window.toast) window.toast.show(`Added ${item.itemName} to list`, 'success');
        
        // Reset qty
        qtyInput.value = type === 'machinery' ? '1' : '';
    },

    removeItemFromRequisition(index) {
        this.requisitionCart.splice(index, 1);
        this._renderRequisitionCart();
    },

    _renderRequisitionCart() {
        const container = document.getElementById('fs_items_container');
        const countLabel = document.querySelector('#fs_requisition_items_list label');
        const messageArea = document.getElementById('fs_req_message_area');
        
        if (!container) return;

        if (this.requisitionCart.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 12px; color: var(--slate-400); font-size: 12px; font-style: italic;">No items added yet.</div>';
            if (countLabel) countLabel.innerText = 'Selected Items (0)';
            if (messageArea) messageArea.style.display = 'none';
            return;
        }

        if (countLabel) countLabel.innerText = `Selected Items (${this.requisitionCart.length})`;

        // Check for unavailable items to show inline warning
        const hasUnavailable = this.requisitionCart.some(item => item.category === 'machinery' && !item.available);
        if (messageArea) {
            if (hasUnavailable) {
                messageArea.style.display = 'block';
                messageArea.innerHTML = `
                    <div style="padding: 12px; background: #FFF1F2; border-left: 4px solid var(--red); border-radius: 8px; display: flex; gap: 10px; align-items: flex-start; animation: fadeIn 0.3s ease;">
                        <i class="fas fa-exclamation-circle" style="color: var(--red); margin-top: 2px;"></i>
                        <div style="font-size: 12px; color: #991B1B; font-weight: 500; line-height: 1.4;">
                            <strong style="display: block; margin-bottom: 2px;">Availability Notice</strong>
                            One or more selected machines are currently on a waitlist. Requesting them will alert the EC to provide an ETA.
                        </div>
                    </div>
                `;
            } else {
                messageArea.style.display = 'none';
            }
        }

        container.innerHTML = this.requisitionCart.map((item, index) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: white; border: 1px solid var(--slate-200); border-radius: 10px; animation: slideIn 0.2s ease;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; background: ${item.category === 'machinery' ? '#EFF6FF' : '#F0FDF4'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${item.category === 'machinery' ? 'var(--blue)' : 'var(--emerald)'}; font-size: 14px;">
                        <i class="fas ${item.category === 'machinery' ? 'fa-tractor' : 'fa-boxes'}"></i>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 13px; color: var(--slate-900);">${item.itemName}</div>
                        <div style="font-size: 11px; color: var(--slate-500);">${item.quantity} ${item.unit} ${item.category === 'machinery' && !item.available ? '• <span style="color:var(--red); font-weight:700;">Waitlist</span>' : ''}</div>
                    </div>
                </div>
                <button onclick="window.app.fsModule.removeItemFromRequisition(${index})" style="border: none; background: transparent; color: var(--slate-400); padding: 8px; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--slate-400)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    async handleSubmitRequisition() {
        if (this.requisitionCart.length === 0) {
            if (window.toast) window.toast.show('Please add at least one item to your request.', 'warning');
            return;
        }

        const urgency = document.getElementById('fs_req_urgency')?.value || 'normal';

        // Format items for API
        const formattedItems = this.requisitionCart.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: 0 // Will be filled by EC/Finance
        }));

        try {
            if (window.toast) window.toast.show('Submitting requisition...', 'info');
            
            const payload = {
                projectId: this.assignedProject?.id || 1,
                items: formattedItems,
                requestDate: new Date().toISOString(),
                urgency: urgency,
                status: 'pending',
                notes: `Batch request from Field Supervisor for ${this.assignedProject?.name || 'Site'}`,
                vendorName: 'Equipment Coordinator',
                totalAmount: 0
            };

            const result = await client.post('/requisitions', payload);

            const summary = this.requisitionCart.map(i => `${i.quantity}x ${i.itemName}`).join(', ');
            if (window.toast) {
                window.toast.show(`Requisition sent for: ${summary}`, 'success');
            }

            // Clear cart
            this.requisitionCart = [];

            setTimeout(() => {
                window.drawer.close();
                console.log(`[FS] Requisition submitted:`, result);
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
    },

    openReturnDrawer(materialName) {
        const data = this.siteInventory[materialName];
        if (!data) return;

        window.drawer.open('Initiate Reverse Dispatch (Return)', `
            <div class="p-6">
                <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--slate-200);">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Material for Recovery</div>
                    <div style="font-size: 18px; font-weight: 800; color: var(--slate-900);">${materialName}</div>
                    <div style="font-size: 13px; color: var(--slate-600); margin-top: 4px;">Current Site Balance: <strong>${data.qty} ${data.unit}</strong></div>
                </div>

                <div class="form-group">
                    <label class="form-label">Quantity to Return</label>
                    <input type="number" id="return_qty" class="form-input" placeholder="0.00" value="${data.qty}">
                    <div style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">Enter the exact quantity being loaded back for the Yard.</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Return Reason</label>
                    <select id="return_reason" class="form-input">
                        <option value="surplus">Surplus Materials (Phase Complete)</option>
                        <option value="wrong_spec">Wrong Specification Delivered</option>
                        <option value="quality_issue">Quality/Damage Issues</option>
                        <option value="reallocation">Strategic Reallocation</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea id="return_notes" class="form-input" placeholder="Details about the return conditions..."></textarea>
                </div>

                <button class="btn btn-primary" style="width: 100%; background: var(--orange); border: none; margin-top: 12px;" 
                    onclick="window.app.fsModule.handleExecuteReturn('${materialName}')">
                    <i class="fas fa-truck-ramp-box"></i> Confirm Reverse Dispatch
                </button>
            </div>
        `);
    },

    async handleExecuteReturn(name) {
        const qty = Number(document.getElementById('return_qty')?.value);
        const reason = document.getElementById('return_reason')?.value;
        const notes = document.getElementById('return_notes')?.value;

        if (!qty || qty <= 0) {
            window.toast.show('Please specify a valid quantity.', 'warning');
            return;
        }

        const material = this.siteInventory[name];
        if (!material || material.qty < qty) {
            window.toast.show('Insufficient site stock for this return.', 'error');
            return;
        }

        window.toast.show('Processing resource recovery…', 'info');

        try {
            await client.post('/inventory/return', {
                fromSectorId: material.sectorId,
                toSectorId: 1, 
                materialName: name,
                quantity: qty,
                notes: `[RECOVERY] Reason: ${reason}. ${notes}`
            });

            window.toast.show(`${qty} ${material.unit} of ${name} returned to Yard.`, 'success');
            window.drawer.close();
            await this._loadSiteInventory();
        } catch (error) {
            console.error('[FS] Return failed:', error);
            window.toast.show('Return failed: ' + (error.message || 'Server error'), 'error');
        }
    }
};
