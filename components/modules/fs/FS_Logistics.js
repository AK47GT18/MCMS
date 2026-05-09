import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';
import inventoryApi from '../../../src/api/inventory.api.js';

export const FS_Logistics = {
    getLogisticsView() {
        // Default tab if not set
        if (!this.activeLogisticsTab) this.activeLogisticsTab = 'materials';

        // Trigger refresh only if not currently fetching
        if (!this._fetchingLogistics) {
            this._fetchingLogistics = true;
            setTimeout(() => {
                Promise.all([
                    this._loadSiteInventory(), 
                    this._loadInTransit(),
                    this._loadSiteAssets()
                ]).finally(() => { this._fetchingLogistics = false; });
            }, 0);
        }

        const entries = Object.entries(this.siteInventory || {});
        const activeTab = this.activeLogisticsTab;

        return `
            ${this._renderInTransit()}
            
            <div class="data-card">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Site Resource Center</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="window.app.fsModule._loadSiteInventory()" title="Sync Records">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>

                <!-- Registry-style Tabs -->
                <div class="tabs" style="margin-bottom: 0; padding: 0 20px; border-bottom: 1px solid var(--slate-200);">
                    <div class="tab ${activeTab === 'materials' ? 'active' : ''}" onclick="window.app.fsModule.switchLogisticsTab('materials')">
                        <i class="fas fa-boxes" style="margin-right: 8px;"></i> Materials
                    </div>
                    <div class="tab ${activeTab === 'equipment' ? 'active' : ''}" onclick="window.app.fsModule.switchLogisticsTab('equipment')">
                        <i class="fas fa-truck-monster" style="margin-right: 8px;"></i> Equipment & Fleet
                    </div>
                </div>

                <div id="logistics-tab-content">
                    ${activeTab === 'materials' ? this._renderMaterialsTable(entries) : this._renderEquipmentTable()}
                </div>
            </div>
        `;
    },

    switchLogisticsTab(tab) {
        this.activeLogisticsTab = tab;
        this._refreshCurrentView();
    },

    _renderMaterialsTable(entries) {
        if (!this.inventoryLoaded) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading site inventory…</div></div>';
        }
        if (entries.length === 0) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-box-open" style="font-size:32px; margin-bottom:16px; display:block; opacity: 0.5;"></i><div>No materials currently assigned to this site.</div></div>';
        }

        // Pagination Logic
        this.materialsPage = this.materialsPage || 1;
        const perPage = 10;
        const totalPages = Math.ceil(entries.length / perPage);
        const startIdx = (this.materialsPage - 1) * perPage;
        const paginatedEntries = entries.slice(startIdx, startIdx + perPage);

        let tableHTML = `
            <table>
                <thead>
                    <tr><th>Material</th><th>Sector</th><th>On-Site Stock</th><th style="text-align: right;">Action</th></tr>
                </thead>
                <tbody>
                    ${paginatedEntries.map(([name, data]) => `
                        <tr>
                            <td>
                                <div style="font-weight: 700; color: var(--slate-900);">${name}</div>
                                <div style="font-size: 11px; color: var(--slate-500);">Inventory ID: <span class="project-id">${data.inventoryId || 'INV-00'}</span></div>
                            </td>
                            <td>
                                <div style="font-size: 13px; font-weight: 500;">${data.sectorName || 'Main Site'}</div>
                            </td>
                            <td>
                                <div style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 15px; color: ${data.qty === 0 ? 'var(--red)' : 'var(--slate-900)'};">
                                    ${data.qty.toLocaleString()} <span style="font-size: 11px; font-weight: 600; color: var(--slate-500);">${data.unit}</span>
                                </div>
                            </td>
                            <td style="text-align: right;">
                                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                    ${(() => {
                                        const incoming = (this.inTransitItems || []).filter(req => 
                                            req.items.some(i => i.itemName.toLowerCase() === name.toLowerCase())
                                        );
                                        const now = new Date();
                                        
                                        const hasIncoming = incoming.length > 0;
                                        const hasPendingSchedule = incoming.some(req => req.estimatedArrival && new Date(req.estimatedArrival) > now);
                                        const canReceive = incoming.length === 0 || incoming.some(req => !req.estimatedArrival || new Date(req.estimatedArrival) <= now);
                                        
                                        let buttons = '';
                                        
                                        if (hasPendingSchedule) {
                                            buttons += `
                                                <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.openMaterialScheduleDrawer('${name.replace(/'/g, "\\'")}')" style="color: var(--blue); border-color: var(--blue-light);">
                                                    <i class="fas fa-calendar-alt"></i> Schedule
                                                </button>
                                            `;
                                        }
                                        
                                        if (canReceive) {
                                            buttons += `
                                                <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.openManualIntakeDrawer('${name.replace(/'/g, "\\'")}', '${data.unit}')" style="color: var(--emerald); border-color: var(--emerald-light);">
                                                    <i class="fas fa-box-open"></i> Receive Goods
                                                </button>
                                            `;
                                        }
                                        
                                        return buttons;
                                    })()}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        if (totalPages > 1) {
            tableHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid var(--slate-200); background: var(--slate-50); border-radius: 0 0 8px 8px;">
                    <span style="font-size: 12px; color: var(--slate-500);">Page ${this.materialsPage} of ${totalPages}</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.changeMaterialsPage(${this.materialsPage - 1})" ${this.materialsPage === 1 ? 'disabled' : ''}>Previous</button>
                        <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.changeMaterialsPage(${this.materialsPage + 1})" ${this.materialsPage === totalPages ? 'disabled' : ''}>Next</button>
                    </div>
                </div>
            `;
        }

        return tableHTML;
    },

    changeMaterialsPage(page) {
        this.materialsPage = page;
        this._refreshCurrentView();
    },

    changeEquipmentPage(page) {
        this.equipmentPage = page;
        this._refreshCurrentView();
    },

    openMaterialScheduleDrawer(materialName) {
        const incoming = (this.inTransitItems || []).filter(req => 
            req.items.some(i => i.itemName.toLowerCase() === materialName.toLowerCase())
        );

        let contentHTML = '';
        if (incoming.length === 0) {
            contentHTML = `
                <div style="padding: 32px; text-align: center; border: 1px dashed var(--slate-200); border-radius: 8px;">
                    <div style="font-size: 13px; color: var(--slate-500);">No incoming shipments.</div>
                </div>
            `;
        } else {
            contentHTML = incoming.map(req => {
                const item = req.items.find(i => i.itemName.toLowerCase() === materialName.toLowerCase());
                const arrivalDate = req.estimatedArrival ? new Date(req.estimatedArrival) : null;
                const now = new Date();
                const isArrived = !arrivalDate || arrivalDate <= now;
                const eta = arrivalDate ? arrivalDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending ETA';
                
                return `
                    <div style="padding: 16px; background: var(--slate-50); border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--slate-100);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                            <div style="font-weight: 700; font-size: 15px;">${item.quantity} ${item.unit}</div>
                            <span class="status ${isArrived ? 'active' : 'pending'}" style="font-size: 10px; padding: 2px 8px;">
                                ${isArrived ? 'READY' : 'IN TRANSIT'}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: var(--slate-500); margin-bottom: 16px; line-height: 1.5;">
                            <strong>ETA:</strong> ${eta}<br>
                            <strong>Ref:</strong> ${req.reqCode || 'REQ-'+req.id}<br>
                            ${req.dispatchedBy ? `<strong>Sender:</strong> ${req.dispatchedBy} ${req.dispatchedPhone ? `(<a href="tel:${req.dispatchedPhone}" style="color: var(--blue); text-decoration: none;">${req.dispatchedPhone}</a>)` : ''}` : ''}
                        </div>
                        ${isArrived ? `
                            <button class="btn btn-primary btn-sm" style="width: 100%; background: var(--emerald); border-color: var(--emerald); justify-content: center;" onclick="window.app.fsModule.handleConfirmArrival('${req.id}')">
                                Mark as Received
                            </button>
                        ` : `
                            <div style="text-align: center; font-size: 11px; color: var(--slate-400); font-style: italic;">
                                <i class="fas fa-lock" style="margin-right: 4px;"></i> Available upon arrival
                            </div>
                        `}
                    </div>
                `;
            }).join('');
        }

        window.drawer.open(`Schedule: ${materialName}`, `
            <div style="padding: 24px;">
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${materialName}</h3>
                    <div style="font-size: 12px; color: var(--slate-500); margin-top: 4px;">Logistics & Arrival Timeline</div>
                </div>
                ${contentHTML}
            </div>
        `);
    },

    openManualIntakeDrawer(materialName, unit) {
        window.drawer.open('Receive Goods', `
            <div style="padding: 24px;">
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${materialName}</h3>
                    <div style="font-size: 12px; color: var(--slate-500); margin-top: 4px;">Direct Site Intake (${unit})</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Quantity Received</label>
                    <input type="number" id="manual_intake_qty" class="form-input" placeholder="0.00" min="0.1" step="0.1">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Delivery Note / ID</label>
                    <input type="text" id="manual_intake_ref" class="form-input" placeholder="e.g. DN-10234">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Observations</label>
                    <textarea id="manual_intake_notes" class="form-input" placeholder="Any damage or notes..." style="height: 100px;"></textarea>
                </div>
                
                <div style="margin-top: 32px;">
                    <button class="btn btn-primary" style="width: 100%; background: var(--emerald); border-color: var(--emerald); justify-content: center; height: 48px;" 
                        onclick="window.app.fsModule.executeManualIntake('${materialName.replace(/'/g, "\\'")}', '${unit}')">
                        <i class="fas fa-check-circle"></i> Log Site Receipt
                    </button>
                </div>
            </div>
        `);
    },

    async executeManualIntake(materialName, unit) {
        const qty = parseFloat(document.getElementById('manual_intake_qty')?.value);
        const ref = document.getElementById('manual_intake_ref')?.value;
        const notes = document.getElementById('manual_intake_notes')?.value;

        if (!qty || qty <= 0) {
            window.toast?.show('Please enter a valid quantity.', 'warning');
            return;
        }

        try {
            window.toast?.show('Updating site inventory...', 'info');
            // Using the inventory distribute endpoint which adds to a sector's stock
            await inventoryApi.distribute({
                sectorId: this.siteInventory[materialName]?.sectorId || 1,
                materialName: materialName,
                unit: unit,
                quantity: qty,
                reference: ref || 'Direct Site Intake',
                notes: notes
            });

            window.toast?.show(`Successfully received ${qty} ${unit} of ${materialName}.`, 'success');
            window.drawer.close();
            await this._loadSiteInventory();
            this._refreshCurrentView();
        } catch (error) {
            console.error('[FS] Manual intake failed:', error);
            window.toast?.show('Failed to log intake. Server error.', 'error');
        }
    },

    _renderEquipmentTable() {
        if (!this.assetsLoaded) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Syncing site fleet status…</div></div>';
        }
        if (this.siteAssets.length === 0) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-pickup" style="font-size:32px; margin-bottom:16px; display:block; opacity: 0.5;"></i>No equipment currently assigned to site.</div>';
        }

        // Pagination Logic
        this.equipmentPage = this.equipmentPage || 1;
        const perPage = 10;
        const totalPages = Math.ceil(this.siteAssets.length / perPage);
        const startIdx = (this.equipmentPage - 1) * perPage;
        const paginatedAssets = this.siteAssets.slice(startIdx, startIdx + perPage);

        let tableHTML = `
            <table>
                <thead><tr><th>Asset</th><th>Reg Code</th><th>Fleet Status</th><th style="text-align: right;">Action</th></tr></thead>
                <tbody>
                    ${paginatedAssets.map(asset => `
                        <tr>
                            <td>
                                <div style="font-weight: 700; color: var(--slate-900);">${asset.name}</div>
                                <div style="font-size: 11px; color: var(--slate-500);">${asset.category || 'General Machinery'}</div>
                            </td>
                            <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                            <td>
                                <span class="status ${asset.status === 'maintenance' ? 'locked' : (asset.status === 'checked_out' ? 'active' : 'pending')}" 
                                    style="${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">
                                    ${(asset.status || '').replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </td>
                            <td style="text-align: right;">
                                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                    ${asset.status !== 'maintenance' ? `
                                        <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.openAssetIncidentDrawer('${asset.id}')" style="color: var(--red); border-color: var(--red-light);">
                                            <i class="fas fa-triangle-exclamation"></i> Breakdown
                                        </button>
                                    ` : `<span style="font-size: 11px; color: var(--slate-400); font-weight: 600;">OFFLINE (MAINTENANCE)</span>`}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        if (totalPages > 1) {
            tableHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid var(--slate-200); background: var(--slate-50); border-radius: 0 0 8px 8px;">
                    <span style="font-size: 12px; color: var(--slate-500);">Page ${this.equipmentPage} of ${totalPages}</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.changeEquipmentPage(${this.equipmentPage - 1})" ${this.equipmentPage === 1 ? 'disabled' : ''}>Previous</button>
                        <button class="btn btn-secondary btn-sm" onclick="window.app.fsModule.changeEquipmentPage(${this.equipmentPage + 1})" ${this.equipmentPage === totalPages ? 'disabled' : ''}>Next</button>
                    </div>
                </div>
            `;
        }

        return tableHTML;
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
                                    <div style="font-size: 11px; color: var(--slate-500);">ETA: ${eta} | ID: ${item.reqCode || 'REQ-' + item.id}</div>
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
        const req = this.inTransitItems.find(r => String(r.id) === String(reqId));
        if (!req) return;
        
        window.drawer.open('Material Intake', window.DrawerTemplates.confirmMaterialArrival(req));
    },

    async submitMaterialArrival(reqId) {
        const req = this.inTransitItems.find(r => String(r.id) === String(reqId));
        if (!req) return;

        const receivedBy = document.getElementById('arrival_received_by').value;
        const dispatchedBy = document.getElementById('arrival_dispatched_by').value;
        const notes = document.getElementById('arrival_notes').value;
        const inputs = document.querySelectorAll('.received-qty-input');
        
        const receivedItems = Array.from(inputs).map(input => ({
            id: input.dataset.itemId,
            itemName: input.dataset.itemName,
            expectedQty: Number(input.dataset.expectedQty),
            receivedQty: Number(input.value)
        }));

        if (!receivedBy) {
            window.toast.show('Please enter the name of the Receiving Officer.', 'warning');
            return;
        }

        try {
            window.toast.show('Processing site intake...', 'info');
            
            // Use variance API if any quantity differs, otherwise use standard confirm
            const hasDiscrepancy = receivedItems.some(i => i.receivedQty !== i.expectedQty);
            
            if (hasDiscrepancy) {
                await client.post(`/dispatch/${reqId}/variance`, {
                    receivedItems,
                    receivedBy,
                    dispatchedBy,
                    notes
                });
                window.toast.show('Intake completed with variance. Incidents logged.', 'warning');
            } else {
                await client.post(`/dispatch/${reqId}/confirm`, {
                    receivedBy,
                    dispatchedBy,
                    notes
                });
                window.toast.show('Full delivery confirmed. Inventory updated.', 'success');
            }

            window.drawer.close();
            
            // Refresh logistics view
            await this._loadSiteInventory();
            await this._loadInTransit();
            this._refreshCurrentView();
        } catch (error) {
            console.error('[FS] Intake failed:', error);
            window.toast.show('Failed to complete resource intake.', 'error');
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
