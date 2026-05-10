import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';
import inventoryApi from '../../../src/api/inventory.api.js';
import replenishmentApi from '../../../src/api/replenishment.api.js';
import { notificationService } from '../../../src/services/notifications.service.js';

export const FS_Logistics = {
    getLogisticsView() {
        const entries = Object.entries(this.siteInventory || {});
        const activeTab = this.activeLogisticsTab || 'materials';

        return `
            <div class="data-card">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Site Resource Center</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="window.app.fsModule.refreshLogistics()" title="Sync Records">
                            <i class="fas fa-sync ${this._fetchingLogistics ? 'fa-spin' : ''}"></i> Refresh
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
        if (this.activeLogisticsTab === tab) return;
        this.activeLogisticsTab = tab;
        this._refreshCurrentView();
    },

    async refreshLogistics() {
        if (this._fetchingLogistics) return;
        this._fetchingLogistics = true;
        this._refreshCurrentView(); // Show loading state on button if possible

        try {
            await Promise.all([
                this._loadSiteInventory(),
                this._loadInTransit(),
                this._loadSiteAssets()
            ]);
        } catch (error) {
            console.error('[FS] Logistics refresh failed:', error);
        } finally {
            this._fetchingLogistics = false;
            this._refreshCurrentView();
        }
    },

    _renderMaterialsTable(entries) {
        if (!this.inventoryLoaded) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading site inventory…</div></div>';
        }
        // Filter out items that are actually assets (measured in Days/Hours)
        const materialEntries = entries.filter(([name, data]) => {
            const unit = (data.unit || '').toLowerCase();
            return unit !== 'day' && unit !== 'hour';
        });

        if (materialEntries.length === 0) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-box-open" style="font-size:32px; margin-bottom:16px; display:block; opacity: 0.5;"></i><div>No materials currently assigned to this site.</div></div>';
        }

        // Pagination Logic
        this.materialsPage = this.materialsPage || 1;
        const perPage = 10;
        const totalPages = Math.ceil(materialEntries.length / perPage);
        const startIdx = (this.materialsPage - 1) * perPage;
        const paginatedEntries = materialEntries.slice(startIdx, startIdx + perPage);

        const buildActionButtons = (name, unit, qty = 0) => {
            const localReceipts = this._getReceiptHistory(name);
            const backendLogs = (this.siteInventoryLogs?.[name] || []).filter(l => l.type === 'IN');
            const hasBeenReceived = localReceipts.length > 0 || backendLogs.length > 0;
            
            const incoming = (this.inTransitItems || []).filter(req => 
                req.items.some(i => i.itemName.toLowerCase() === name.toLowerCase())
            );
            const now = new Date();
            
            const hasPendingSchedule = incoming.some(req => req.estimatedArrival && new Date(req.estimatedArrival) > now);
            const canReceive = incoming.length === 0 || incoming.some(req => !req.estimatedArrival || new Date(req.estimatedArrival) <= now);
            
            let receivableReqId = '';
            if (canReceive && incoming.length > 0) {
                const receivableReq = incoming.find(req => !req.estimatedArrival || new Date(req.estimatedArrival) <= now);
                if (receivableReq) receivableReqId = receivableReq.id;
            }

            let buttons = '';
            
            // Only show Schedule if there's NO en-route shipment already visible in the table
            if (hasPendingSchedule && incoming.length === 0) {
                buttons += `
                    <button class="btn btn-secondary btn-sm" style="padding: 0 16px; height: 36px; font-size: 11px; color: var(--blue); border-color: var(--blue-light);" onclick="window.app.fsModule.openMaterialScheduleDrawer('${name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-calendar-alt" style="margin-right: 4px;"></i> Schedule
                    </button>
                `;
            }
            
            if (canReceive && incoming.length === 0 && !hasBeenReceived) {
                buttons += `
                    <button class="btn btn-secondary btn-sm" style="padding: 0 16px; height: 36px; font-size: 11px; color: var(--emerald); border-color: var(--emerald-light);" onclick="window.app.fsModule.openManualIntakeDrawer('${name.replace(/'/g, "\\'")}', '${unit}', '${receivableReqId}', ${qty})">
                        <i class="fas fa-box-open" style="margin-right: 4px;"></i> Receive
                    </button>
                `;
            }

            // Always show History button if there are past receipts or backend logs
            const hasLogs = (this.siteInventoryLogs?.[name] || []).length > 0;
            if (hasBeenReceived || hasLogs) {
                buttons += `
                    <button class="btn btn-secondary btn-sm" style="padding: 0 16px; height: 36px; font-size: 11px; color: var(--blue); border-color: var(--blue-light);" onclick="window.app.fsModule.viewReceiptHistory('${name.replace(/'/g, "\\'")}', '${unit}')">
                        <i class="fas fa-history" style="margin-right: 4px;"></i> History
                    </button>
                `;
            }
            return buttons;
        };

        const formatInventoryId = (id) => {
            if (!id) return 'INV-00';
            const num = Number(id);
            if (!isNaN(num)) return `INV-${num.toString().padStart(3, '0')}`;
            return id;
        };

        const tableRows = paginatedEntries.map(([name, data]) => {
            // Check for matching incoming shipments
            const incoming = (this.inTransitItems || []).filter(req => 
                (req.items || []).some(i => i.itemName.toLowerCase() === name.toLowerCase())
            );

            let rows = `
                <tr>
                    <td style="font-weight: 700; white-space: nowrap;">${name}</td>
                    <td style="white-space: nowrap;"><span class="project-id">${formatInventoryId(data.inventoryId)}</span></td>
                    <td style="white-space: nowrap;"><span style="font-weight: 600; color: var(--slate-700);"><i class="fas fa-map-marker-alt" style="color: var(--slate-400); margin-right: 4px;"></i> ${data.sectorName || 'Main Site'}</span></td>
                    <td style="text-align: right; white-space: nowrap;">
                        <div style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 16px; color: ${data.qty === 0 ? 'var(--red)' : 'var(--emerald)'}; display: inline-block;">
                            ${data.qty.toLocaleString()} <span style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">${data.unit}</span>
                        </div>
                    </td>
                    <td style="text-align: right; min-width: 150px; white-space: nowrap;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            ${buildActionButtons(name, data.unit, data.qty)}
                        </div>
                    </td>
                </tr>
            `;

            // Append shipment rows if any
            incoming.forEach(ship => {
                const item = ship.items.find(i => i.itemName.toLowerCase() === name.toLowerCase());
                const driver = ship.dispatchedBy || ship.transporterName || 'Yard Team';
                const phone = ship.dispatchedPhone || ship.driverPhone || 'N/A';
                const time = ship.dispatchDate || ship.createdAt;
                const formattedTime = time ? new Date(time).toLocaleString() : 'N/A';
                const remarks = ship.remarks || ship.justification || ship.notes || 'Scheduled fulfillment';

                rows += `
                    <tr style="border-left: 3px solid var(--blue);">
                        <td style="padding: 8px 16px; font-weight: 700; color: var(--blue); font-size: 12px; white-space: nowrap;">
                            <i class="fas fa-truck-moving" style="margin-right: 6px;"></i>${item.quantity.toLocaleString()} ${item.unit || data.unit || ''} EN-ROUTE
                        </td>
                        <td style="padding: 8px 12px; font-size: 11px; color: var(--slate-600); white-space: nowrap;">
                            <i class="fas fa-user" style="color: var(--slate-400); margin-right: 4px;"></i>${driver}
                        </td>
                        <td style="padding: 8px 12px; font-size: 11px; color: var(--blue); white-space: nowrap;">
                            <i class="fas fa-phone" style="margin-right: 4px;"></i>${phone}
                        </td>
                        <td style="padding: 8px 12px; font-size: 10px; color: var(--slate-500); white-space: nowrap;">
                            <i class="fas fa-clock" style="margin-right: 4px;"></i>${formattedTime}
                        </td>
                        <td style="text-align: right; padding: 8px 12px; white-space: nowrap;">
                            <button class="btn btn-primary btn-sm" style="background: var(--blue); border-color: var(--blue); padding: 4px 12px; font-size: 11px;" 
                                onclick="window.app.fsModule.openManualIntakeDrawer('${name.replace(/'/g, "\\'")}'  , '${data.unit || ''}', '${ship.id}', ${data.qty || 0})">
                                <i class="fas fa-check-circle" style="margin-right: 4px;"></i>Confirm Arrival
                            </button>
                        </td>
                    </tr>
                `;
            });

            return rows;
        }).join('');

        const cardRows = paginatedEntries.map(([name, data]) => `
            <div class="resource-card" style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-weight: 800; font-size: 15px; color: var(--slate-900);">${name}</div>
                        <div style="font-size: 11px; color: var(--slate-500);">ID: <span class="project-id">${data.inventoryId || 'INV-00'}</span></div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-family: 'JetBrains Mono'; font-weight: 800; font-size: 16px; color: ${data.qty === 0 ? 'var(--red)' : 'var(--emerald)'};">
                            ${data.qty.toLocaleString()}
                        </div>
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">${data.unit}</div>
                    </div>
                </div>

                <div style="padding: 8px 12px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-100); font-size: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-map-marker-alt" style="color: var(--slate-400);"></i>
                    <span style="font-weight: 600; color: var(--slate-700);">${data.sectorName || 'Main Site'}</span>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 4px;">
                    ${buildActionButtons(name, data.unit, data.qty)}
                </div>
            </div>
        `).join('');

        let tableHTML = `
            <div class="hidden-mobile">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Inventory ID</th>
                                <th>Location</th>
                                <th style="text-align: right;">Quantity</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="hidden-desktop">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 20px;">
                    ${cardRows}
                </div>
            </div>
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
    async openManualIntakeDrawer(materialName, unit, reqId = '', inventoryQty = 0) {
        let expectedQty = 0;
        let dispatchInfoHTML = '';
        let drawerSubtitle = `Direct Site Intake (${unit})`;
        let dispatcherName = '';
        let dispatcherPhone = '';
        let dispatchEta = '';

        if (reqId && this.inTransitItems) {
            const specificReq = this.inTransitItems.find(r => String(r.id) === String(reqId));
            if (specificReq && specificReq.items) {
                const searchName = (materialName || '').trim().toLowerCase();
                const item = specificReq.items.find(i => (i.itemName || '').trim().toLowerCase() === searchName);
                if (item) {
                    expectedQty = Number(item.quantity) || 0;
                    drawerSubtitle = `EC Distribution: ${specificReq.reqCode || 'SHIP-' + specificReq.id}`;
                    dispatcherName = specificReq.dispatchedBy || 'Yard Manager';
                    dispatcherPhone = specificReq.dispatchedPhone || 'Not provided';
                    dispatchEta = specificReq.eta ? new Date(specificReq.eta).toLocaleString() : 'Pending ETA';
                    
                    dispatchInfoHTML = `
                        <div style="background: #f0fdf4; border: 1px solid var(--emerald-light); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                            <div style="font-size: 11px; font-weight: 800; color: var(--emerald); text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-truck-loading"></i> Active Distribution Data
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div>
                                    <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">Driver / Transporter</div>
                                    <div style="font-size: 13px; font-weight: 800; color: var(--slate-900);">${specificReq.dispatchedBy || dispatcherName}</div>
                                </div>
                                <div>
                                    <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">Contact</div>
                                    <div style="font-size: 12px; font-weight: 700; color: var(--blue);"><i class="fas fa-phone-alt"></i> ${specificReq.dispatchedPhone || dispatcherPhone}</div>
                                </div>
                                <div>
                                    <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">Dispatch Time</div>
                                    <div style="font-size: 12px; font-weight: 700; color: var(--slate-700);">${specificReq.dispatchDate ? new Date(specificReq.dispatchDate).toLocaleString() : dispatchEta}</div>
                                </div>
                                <div style="grid-column: span 2; border-top: 1px dashed rgba(16, 185, 129, 0.2); padding-top: 8px; margin-top: 4px;">
                                    <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">JUSTIFICATION / REMARKS</div>
                                    <div style="font-size: 11px; color: var(--slate-600); line-height: 1.4; font-style: italic;">"${specificReq.remarks || 'Standard fulfillment'}"</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // Determine absolute intake limit: Specific Dispatch > Total Pending Dispatches > Project Total
        let pendingDispatchQty = 0;
        let matchedShipments = [];

        if (this.inTransitItems && this.inTransitItems.length > 0) {
            // Use extremely aggressive name matching
            const clean = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '').trim();
            const searchName = clean(materialName);
            
            matchedShipments = this.inTransitItems.filter(r => 
                (r.items || []).some(i => {
                    const itemName = clean(i.itemName);
                    return itemName === searchName || itemName.includes(searchName) || searchName.includes(itemName);
                })
            );
            
            matchedShipments.forEach(r => {
                const item = r.items.find(i => {
                    const itemName = clean(i.itemName);
                    return itemName === searchName || itemName.includes(searchName) || searchName.includes(itemName);
                });
                if (item) pendingDispatchQty += Number(item.quantity || 0);
            });
        }

        // If we found matched shipments but no specific reqId was passed, show the first one's metadata as context
        if (!reqId && matchedShipments.length > 0) {
            const firstMatch = matchedShipments[0];
            dispatcherName = firstMatch.dispatchedBy || 'Yard Manager';
            dispatcherPhone = firstMatch.dispatchedPhone || 'Not provided';
            dispatchEta = firstMatch.eta ? new Date(firstMatch.eta).toLocaleString() : 'Pending ETA';
            
            dispatchInfoHTML = `
                <div style="background: #f0fdf4; border: 1px solid var(--emerald-light); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 800; color: var(--emerald); text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-truck-loading"></i> Active Distribution Data
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">Driver / Transporter</div>
                            <div style="font-size: 13px; font-weight: 800; color: var(--slate-900);">${firstMatch.dispatchedBy || dispatcherName}</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">Contact</div>
                            <div style="font-size: 12px; font-weight: 700; color: var(--blue);"><i class="fas fa-phone-alt"></i> ${firstMatch.dispatchedPhone || dispatcherPhone}</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">Dispatch Time</div>
                            <div style="font-size: 12px; font-weight: 700; color: var(--slate-700);">${firstMatch.dispatchDate ? new Date(firstMatch.dispatchDate).toLocaleString() : dispatchEta}</div>
                        </div>
                        <div style="grid-column: span 2; border-top: 1px dashed rgba(16, 185, 129, 0.2); padding-top: 8px; margin-top: 4px;">
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">JUSTIFICATION / REMARKS</div>
                            <div style="font-size: 11px; color: var(--slate-600); line-height: 1.4; font-style: italic;">"${firstMatch.remarks || 'Standard fulfillment'}"</div>
                        </div>
                    </div>
                </div>
            `;
        }

        let projectTotalQty = 0;
        let isVehicle = unit.toLowerCase() === 'day' || unit.toLowerCase() === 'hour';
        
        if (this.assignedProject) {
            // Scan Materials
            const matMatches = (this.assignedProject.recommendedMaterials || []).filter(m => (m.name || m.materialName || '').toLowerCase() === materialName.toLowerCase());
            projectTotalQty += matMatches.reduce((sum, m) => sum + Number(m.approvedQty || m.quantity || 0), 0);
            
            // Scan Equipment/Machinery
            const macMatches = (this.assignedProject.recommendedMachines || []).filter(m => (m.name || '').toLowerCase() === materialName.toLowerCase());
            projectTotalQty += macMatches.reduce((sum, m) => sum + Number(m.days || m.quantity || 0), 0);
            if (macMatches.length > 0) isVehicle = true;
        }

        // Determine the intake limit:
        // Priority: specific dispatch qty > pending dispatch total > inventory qty from the table
        const hasDispatchLimit = expectedQty > 0 || pendingDispatchQty > 0;
        let strictLimit = expectedQty > 0
            ? expectedQty
            : (pendingDispatchQty > 0 ? pendingDispatchQty : (Number(inventoryQty) || 0));

        // If we have a pending dispatch but no specific expectedQty yet (e.g. from generic Receive button),
        // we use the pending dispatch total as the expected quantity for validation.
        if (expectedQty === 0 && pendingDispatchQty > 0) {
            expectedQty = pendingDispatchQty;
        }
        
        // Validation message
        const limitSource = hasDispatchLimit ? 'Authorized Dispatch' : 'Inventory Record';
        let validationMessage = '';
        if (strictLimit > 0) {
            validationMessage = `Rule: Intake must not exceed <strong>${strictLimit.toLocaleString()} ${unit}</strong> (${limitSource}).`;
        } else {
            validationMessage = `<i class="fas fa-box-open"></i> Direct Site Intake — enter the quantity received.`;
        }

        // Fetch Vehicle Contract if applicable
        let contractInfoHTML = '';
        if (isVehicle) {
            try {
                const rentals = await window.vehicleRentalsApi.getAll({ active: true });
                const contract = (rentals.data || rentals || []).find(c => 
                    (c.vehicleName || '').toLowerCase().includes(materialName.toLowerCase()) ||
                    (c.assetId || '').toLowerCase().includes(materialName.toLowerCase())
                );
                if (contract) {
                    contractInfoHTML = `
                        <div style="background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid var(--blue);">
                            <div style="font-size: 11px; font-weight: 800; color: var(--blue-700); text-transform: uppercase; margin-bottom: 8px;">Vehicle Rental Contract Info</div>
                            <div style="font-size: 13px; font-weight: 700; color: var(--slate-900);">Agreement: ${contract.days || 0} Days Utilization</div>
                            <div style="font-size: 11px; color: var(--slate-500); margin-top: 4px;">Availability starts immediately upon site arrival confirmation.</div>
                        </div>
                    `;
                }
            } catch (err) {
                console.warn('[FS] Failed to fetch contract:', err);
            }
        }
        // Register a clean validation function on window to avoid inline HTML escaping issues
        const _vLimit = strictLimit;
        const _vDispatchQty = pendingDispatchQty;
        const _vUnit = unit;
        const _vExpected = expectedQty || pendingDispatchQty;
        window._refValidate = function(input) {
            const msg = document.getElementById('ref_validation_msg');
            const btn = document.getElementById('submit_intake_btn');
            if (!input.value.trim()) {
                input.style.borderColor = 'var(--red)';
                if (msg) {
                    msg.style.color = 'var(--red)';
                    msg.style.display = 'block';
                    msg.innerHTML = '<i class="fas fa-circle-exclamation"></i> Reference ID is required for audit.';
                }
            } else {
                input.style.borderColor = 'var(--slate-200)';
                if (msg) {
                    msg.style.display = 'none';
                }
            }
        };

        window._intakeValidate = function(input) {
            const raw = input.value.replace(/[^0-9.]/g, '').replace(/(\..0*?)\..*_/g, '$1').replace(/^(\d{10})\d+/, '$1');
            input.value = raw;
            const val = Number(raw);
            const limit = _vLimit;
            const dispatchQty = _vDispatchQty;
            const expected = _vExpected;
            const unitLabel = _vUnit;
            const msg = document.getElementById('qty_validation_msg');
            const btn = document.getElementById('submit_intake_btn');
            const shortagePanel = document.getElementById('shortage_panel');
            const shortageQtyEl = document.getElementById('shortage_qty_display');

            // Hard-block if the value exceeds the limit (from dispatch OR inventory record)
            const hasRealLimit = limit > 0;
            const srcLabel = (dispatchQty > 0 && limit === dispatchQty) ? 'Authorized Dispatch' : 'Inventory Record';

            if (hasRealLimit && val > limit) {
                input.style.borderColor = 'var(--red)';
                input.style.background = '#FFF5F5';
                if (msg) {
                    msg.style.color = 'var(--red)';
                    msg.style.background = '#FFF5F5';
                    msg.style.borderColor = 'var(--red)';
                    msg.textContent = 'VALIDATION ERROR: Value exceeds ' + limit.toLocaleString() + ' ' + unitLabel + ' (' + srcLabel + ').';
                }
                if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
                if (shortagePanel) shortagePanel.style.display = 'none';
            } else {
                input.style.borderColor = 'var(--slate-200)';
                input.style.background = 'white';
                if (msg) {
                    msg.style.color = 'var(--slate-600)';
                    msg.style.background = 'var(--slate-50)';
                    msg.style.borderColor = 'var(--slate-200)';
                    if (hasRealLimit) {
                        msg.innerHTML = '<i class="fas fa-info-circle"></i> Intake Limit: <strong>' + limit.toLocaleString() + ' ' + unitLabel + '</strong> (' + srcLabel + ')';
                    } else {
                        msg.innerHTML = '<i class="fas fa-box-open"></i> Direct Site Intake — enter the quantity received.';
                    }
                }
                if (btn) { btn.disabled = false; btn.style.opacity = '1'; }

                // Show shortage panel if received < expected
                if (expected > 0 && val > 0 && val < expected) {
                    const deficit = expected - val;
                    if (shortagePanel) shortagePanel.style.display = 'block';
                    if (shortageQtyEl) shortageQtyEl.textContent = deficit.toLocaleString() + ' ' + unitLabel + ' short';
                } else {
                    if (shortagePanel) shortagePanel.style.display = 'none';
                }
            }

        };

        window.drawer.open(isVehicle ? 'Confirm Vehicle Arrival' : 'Receive Goods', `
            <div style="padding: 24px;">
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${materialName}</h3>
                    <div style="font-size: 12px; color: var(--slate-500); margin-top: 4px;">${drawerSubtitle}</div>
                </div>

                ${isVehicle ? contractInfoHTML : dispatchInfoHTML}
                
                ${!isVehicle ? `
                <div class="form-group">
                    <label class="form-label" style="font-weight: 700;">Quantity Received</label>
                    <input type="text" inputmode="decimal" id="manual_intake_qty" class="form-input" placeholder="0.00" value="${expectedQty || ''}"
                        oninput="window._intakeValidate(this)">
                    <div id="qty_validation_msg" style="font-size: 11px; margin-top: 8px; padding: 10px; border-radius: 8px; background: var(--slate-50); border: 1px solid var(--slate-200); color: var(--slate-600); transition: all 0.3s ease; line-height: 1.4;">
                        ${validationMessage}
                    </div>
                </div>
                ` : `
                <div style="padding: 16px; background: var(--slate-50); border-radius: 12px; border: 1px dashed var(--slate-300); text-align: center; margin-bottom: 24px;">
                    <i class="fas fa-calendar-check" style="font-size: 24px; color: var(--blue); margin-bottom: 12px; display: block;"></i>
                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-700);">Arrival Confirmation Required</div>
                    <div style="font-size: 11px; color: var(--slate-500); margin-top: 4px;">Confirming this arrival will activate the site rental contract and begin utilization logs.</div>
                </div>
                <input type="hidden" id="manual_intake_qty" value="${expectedQty || 1}">
                `}
                
                <div class="form-group" style="margin-top: 20px;">
                    <label class="form-label" style="font-weight: 700;">Delivery Note / ID <span style="color: var(--red);">*</span></label>
                    <input type="text" id="manual_intake_ref" class="form-input" placeholder="Enter ID from paper document..."
                        oninput="window._refValidate(this)" onblur="window._refValidate(this)">
                    <div id="ref_validation_msg" style="font-size: 10px; margin-top: 4px; display: none;"></div>
                </div>
                
                <!-- Shortage Panel: only visible when qty < dispatched -->
                <div id="shortage_panel" style="display: none; margin-top: 20px; background: #FFF5F5; border: 1px solid var(--red-light); border-radius: 12px; padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i class="fas fa-exclamation-triangle" style="color: var(--red); font-size: 16px;"></i>
                        <div style="font-weight: 800; font-size: 13px; color: var(--red);">Shortage Detected</div>
                        <span id="shortage_qty_display" style="font-size: 11px; font-weight: 700; color: var(--red); background: rgba(239,68,68,0.1); padding: 2px 8px; border-radius: 6px;"></span>
                    </div>
                    <div style="font-size: 11px; color: var(--slate-600); margin-bottom: 12px; line-height: 1.4;">This discrepancy will be reported to the EC who may request replacement stock from Finance. Please provide details below.</div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label class="form-label" style="font-weight: 700; font-size: 11px;">Reason for Shortage</label>
                        <select id="shortage_reason" class="form-input" style="font-size: 12px;">
                            <option value="">Select reason...</option>
                            <option value="damaged">Damaged in Transit</option>
                            <option value="missing">Missing / Lost</option>
                            <option value="spillage">Spillage</option>
                            <option value="supplier_short">Supplier Short-Delivered</option>
                            <option value="measurement_diff">Measurement Difference</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight: 700; font-size: 11px;">Explain Discrepancy (Required)</label>
                        <textarea id="shortage_explanation" class="form-input" placeholder="Describe what happened — e.g. 2 drums leaked during transport..." style="height: 70px; resize: none; font-size: 12px;"></textarea>
                    </div>
                </div>

                <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label">General Notes (Optional)</label>
                    <textarea id="manual_intake_notes" class="form-input" placeholder="Any other observations..." style="height: 60px; resize: none;"></textarea>
                </div>
                
                <div style="margin-top: 32px;">
                    <button id="submit_intake_btn" class="btn btn-primary" style="width: 100%; background: var(--orange); border-color: var(--orange); justify-content: center; height: 48px; box-shadow: 0 4px 10px rgba(249, 115, 22, 0.2);" 
                        onclick="window.app.fsModule.executeManualIntake('${materialName.replace(/'/g, "\\'")}', '${unit}', '${reqId}', ${strictLimit})">
                        <i class="fas fa-${isVehicle ? 'check-double' : 'check-circle'}" style="margin-right: 6px;"></i> ${isVehicle ? 'Confirm Arrival & Start Contract' : 'Log Site Receipt'}
                    </button>
                </div>
            </div>
        `);
    },

    async executeManualIntake(materialName, unit, reqId = '', strictLimit = 0) {
        const qty = parseFloat(document.getElementById('manual_intake_qty')?.value);
        const ref = document.getElementById('manual_intake_ref')?.value;
        const notes = document.getElementById('manual_intake_notes')?.value;
        const shortageReason = document.getElementById('shortage_reason')?.value || '';
        const shortageExplanation = document.getElementById('shortage_explanation')?.value || '';

        const reasonLabels = {
            damaged: 'Damaged in Transit',
            missing: 'Missing / Lost',
            spillage: 'Spillage',
            supplier_short: 'Supplier Short-Delivered',
            measurement_diff: 'Measurement Difference',
            other: 'Other'
        };

        if (!qty || qty <= 0) {
            window.toast?.show('Please enter a valid quantity.', 'warning');
            return;
        }

        if (!ref || !ref.trim()) {
            window.toast?.show('Delivery Note / ID is required to log receipt.', 'warning');
            const refInput = document.getElementById('manual_intake_ref');
            if (refInput) {
                refInput.style.borderColor = 'var(--red)';
                refInput.focus();
            }
            return;
        }

        // If shortage panel is visible, require reason and explanation
        const shortagePanel = document.getElementById('shortage_panel');
        if (shortagePanel && shortagePanel.style.display !== 'none') {
            if (!shortageReason) {
                window.toast?.show('Please select a reason for the shortage.', 'warning');
                return;
            }
            if (!shortageExplanation.trim()) {
                window.toast?.show('Please explain the discrepancy before logging receipt.', 'warning');
                return;
            }
        }

        // Final Validation against strict limit (phase req or dispatch)
        if (strictLimit > 0 && qty > strictLimit) {
            window.toast?.show(`Cannot exceed limit of ${strictLimit} ${unit}.`, 'error');
            return;
        }

        // Combine notes for audit log
        let finalNotes = notes || '';
        if (shortagePanel && shortagePanel.style.display !== 'none') {
            const reasonLabel = reasonLabels[shortageReason] || shortageReason;
            const shortageInfo = `SHORTAGE [${reasonLabel}]: ${shortageExplanation}`;
            finalNotes = finalNotes ? `${shortageInfo} | General: ${finalNotes}` : shortageInfo;
        }

        try {
            window.toast?.show('Updating site inventory...', 'info');
            
            // Workflow: Trigger EC Deficit Alert if shortage
            if (strictLimit > 0 && qty < strictLimit) {
                const deficit = strictLimit - qty;
                const reasonLabel = reasonLabels[shortageReason] || shortageReason;

                if (window.app.notificationService) {
                    window.app.notificationService.notify('ec', {
                        title: `Material Shortage: ${materialName}`,
                        message: `Site received ${qty.toLocaleString()} of ${strictLimit.toLocaleString()} ${unit} dispatched.\n` +
                            `Deficit: ${deficit.toLocaleString()} ${unit}\n` + 
                            `Reason: ${reasonLabel}\n` +
                            `Details: ${shortageExplanation}\n` +
                            `Action Required: Review shortage and submit replacement requisition to Finance if budget permits.`,
                        type: 'warning'
                    });
                }
            }

            // Using the inventory distribute endpoint which adds to a sector's stock
            await inventoryApi.distribute({
                sectorId: this.siteInventory[materialName]?.sectorId || 1,
                materialName: materialName,
                unit: unit,
                quantity: qty,
                reference: reqId ? `REQ-${reqId} (${ref || 'Intake'})` : (ref || 'Direct Site Intake'),
                notes: finalNotes,
                reqId: reqId ? parseInt(reqId, 10) : undefined
            });

            window.toast?.show(`Successfully received ${qty} ${unit} of ${materialName}.`, 'success');

            // Save receipt to local history
            this._saveReceiptRecord(materialName, {
                qty,
                unit,
                ref,
                notes: finalNotes,
                receivedBy: this.currentUser?.name || 'Field Supervisor',
                reqId: reqId || null,
                timestamp: new Date().toISOString()
            });

            window.drawer.close();
            await this._loadSiteInventory();
            this._refreshCurrentView();
        } catch (error) {
            console.error('[FS] Manual intake failed:', error);
            window.toast?.show('Failed to log intake. Server error.', 'error');
        }
    },

    _renderEquipmentTable() {
        if (!this.assetsLoaded || !this.inventoryLoaded) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Syncing site fleet status…</div></div>';
        }

        // Merge physical assets with inventory-based allocations (Days/Hours)
        const inventoryEquipment = Object.entries(this.siteInventory || {})
            .filter(([name, data]) => {
                const unit = (data.unit || '').toLowerCase();
                const isEqp = unit === 'day' || unit === 'hour';
                if (!isEqp) return false;
                
                // Avoid showing allocation row if the physical asset/rental is already on site
                return !(this.siteAssets || []).some(a => 
                    (a.name || '').toLowerCase() === name.toLowerCase() || 
                    (a.assetCode || '').toLowerCase() === (data.inventoryId || '').toString().toLowerCase()
                );
            })
            .map(([name, data]) => ({
                id: data.inventoryId || `INV-${name}`,
                name: name,
                assetCode: data.inventoryId ? `INV-${data.inventoryId}` : 'ALLOC',
                category: 'Contracted Allocation',
                status: 'pending_intake',
                isInventoryItem: true,
                unit: data.unit,
                qty: data.qty
            }));

        const combinedAssets = [...(this.siteAssets || []), ...inventoryEquipment];

        // Enrichment: Calculate remaining days for rentals
        combinedAssets.forEach(asset => {
            if (asset.isRental && asset.endDate && !asset.daysRemaining) {
                asset.daysRemaining = Math.ceil((new Date(asset.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            }
        });

        if (combinedAssets.length === 0) {
            return '<div style="padding: 60px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-pickup" style="font-size:32px; margin-bottom:16px; display:block; opacity: 0.5;"></i>No equipment currently assigned to site.</div>';
        }

        // Pagination Logic
        this.equipmentPage = this.equipmentPage || 1;
        const perPage = 10;
        const totalPages = Math.ceil(combinedAssets.length / perPage);
        const startIdx = (this.equipmentPage - 1) * perPage;
        const paginatedAssets = combinedAssets.slice(startIdx, startIdx + perPage);

        const tableRows = paginatedAssets.map(asset => {
            // Check for matching incoming shipments for this asset
            const incoming = (this.inTransitItems || []).filter(req => 
                (req.items || []).some(i => i.itemName.toLowerCase() === asset.name.toLowerCase())
            );
            
            // Find first receivable shipment ID for the "Confirm Arrival" button
            const firstShip = incoming.find(s => !s.estimatedArrival || new Date(s.estimatedArrival) <= new Date());
            const activeReqId = firstShip ? firstShip.id : '';

            let rows = `
                <tr>
                    <td style="font-weight: 700;">
                        ${asset.name}
                        ${asset.daysRemaining !== undefined ? `
                            <div style="font-size: 10px; color: ${asset.daysRemaining < 3 ? 'var(--red)' : 'var(--emerald)'}; font-weight: 600;">
                                <i class="fas fa-calendar-day"></i> ${asset.daysRemaining} days left in rental
                            </div>
                        ` : ''}
                    </td>
                    <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                    <td>${asset.category || 'Machinery'}</td>
                    <td>
                        <span class="status ${asset.status === 'maintenance' ? 'locked' : (asset.status === 'checked_out' ? 'active' : 'pending')}" 
                            style="font-size: 10px; ${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">
                            ${(asset.status || '').replace(/_/g, ' ').toUpperCase()}
                        </span>
                    </td>
                    <td style="text-align: right; min-width: 150px;">
                        ${asset.isInventoryItem ? `
                            <button class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 11px; background: var(--blue); border-color: var(--blue);" 
                                onclick="window.app.fsModule.openManualIntakeDrawer('${asset.name.replace(/'/g, "\\'")}', '${asset.unit || 'Day'}', '${activeReqId}')">
                                <i class="fas fa-truck-loading"></i> Confirm Arrival
                            </button>
                        ` : (asset.status !== 'maintenance' ? `
                            <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px; color: var(--red); border-color: var(--red-light);" onclick="window.app.fsModule.openAssetIncidentDrawer('${asset.id}')">
                                <i class="fas fa-triangle-exclamation"></i> Log Breakdown
                            </button>
                        ` : `<span style="font-size: 11px; font-weight: 700; color: var(--slate-400);">UNDER MAINTENANCE</span>`)}
                    </td>
                </tr>
            `;

            // Append shipment rows for en-route equipment
            incoming.forEach(ship => {
                const item = ship.items.find(i => i.itemName.toLowerCase() === asset.name.toLowerCase());
                const driver = ship.dispatchedBy || ship.transporterName || 'Yard Team';
                const phone = ship.dispatchedPhone || ship.driverPhone || 'N/A';
                const remarks = ship.remarks || ship.justification || ship.notes || 'Scheduled delivery';

                rows += `
                    <tr style="background: #f0fdf4; border-left: 4px solid var(--emerald);">
                        <td colspan="5" style="padding: 10px 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; gap: 20px; align-items: center;">
                                    <div style="color: var(--emerald); display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-truck" style="font-size: 16px;"></i>
                                        <div style="font-weight: 800; font-size: 12px;">${item.quantity} ${item.unit} SHIPMENT EN-ROUTE</div>
                                    </div>
                                    <div style="font-size: 11px; line-height: 1.4; color: var(--slate-600);">
                                        <span style="font-weight: 700;">Driver: ${driver} (${phone})</span> | <span style="font-style: italic;">"${remarks}"</span>
                                    </div>
                                </div>
                                <button class="btn btn-primary btn-sm" style="background: var(--emerald); border-color: var(--emerald); padding: 4px 10px; font-size: 10px;" 
                                    onclick="window.app.fsModule.handleConfirmArrival('${ship.id}')">
                                    Confirm Arrival
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            return rows;
        }).join('');

        const cardRows = paginatedAssets.map(asset => {
            const incoming = (this.inTransitItems || []).filter(req => 
                (req.items || []).some(i => i.itemName.toLowerCase() === asset.name.toLowerCase())
            );
            const firstShip = incoming.find(s => !s.estimatedArrival || new Date(s.estimatedArrival) <= new Date());
            const activeReqId = firstShip ? firstShip.id : '';

            return `
                <div class="asset-card" style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-weight: 800; font-size: 15px; color: var(--slate-900);">${asset.name}</div>
                            <div style="font-size: 11px; color: var(--slate-500);">${asset.category || 'Machinery'} | <span class="project-id">${asset.assetCode || asset.id}</span></div>
                        </div>
                        <span class="status ${asset.status === 'maintenance' ? 'locked' : (asset.status === 'checked_out' ? 'active' : 'pending')}" 
                            style="font-size: 10px; ${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">
                            ${(asset.status || '').replace(/_/g, ' ').toUpperCase()}
                        </span>
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 4px;">
                        ${asset.isInventoryItem ? `
                            <button class="btn btn-primary btn-sm" style="flex: 1; height: 36px; font-size: 11px; background: var(--blue); border-color: var(--blue);" 
                                onclick="window.app.fsModule.openManualIntakeDrawer('${asset.name.replace(/'/g, "\\'")}', '${asset.unit || 'Day'}', '${activeReqId}')">
                                <i class="fas fa-truck-loading"></i> Confirm Arrival
                            </button>
                        ` : (asset.status !== 'maintenance' ? `
                            <button class="btn btn-secondary btn-sm" style="flex: 1; height: 36px; font-size: 11px; color: var(--red); border-color: var(--red-light);" onclick="window.app.fsModule.openAssetIncidentDrawer('${asset.id}')">
                                <i class="fas fa-triangle-exclamation"></i> Log Breakdown
                            </button>
                        ` : `<div style="flex: 1; padding: 10px; text-align: center; background: var(--slate-50); color: var(--slate-400); font-size: 11px; font-weight: 700; border-radius: 8px;">UNDER MAINTENANCE</div>`)}
                    </div>
                </div>
            `;
        }).join('');

        let tableHTML = `
            <div class="hidden-mobile">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Asset ID</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="hidden-desktop">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 20px;">
                    ${cardRows}
                </div>
            </div>
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
            this.siteInventoryLogs = {};
            items.forEach(item => {
                this.siteInventory[item.materialName] = {
                    qty: Number(item.quantityOnHand || 0),
                    unit: item.unit,
                    sectorId: item.sectorId,
                    sectorName: item.sectorName,
                    inventoryId: item.id
                };
                // Store backend logs per material for history view
                if (item.logs && item.logs.length > 0) {
                    this.siteInventoryLogs[item.materialName] = item.logs;
                }
            });
            this.inventoryLoaded = true;
        } catch (error) {
            this.inventoryLoaded = true;
            console.error('[FS] Failed to load site inventory:', error);
        }
    },

    async _loadInTransit() {
        try {
            const projectId = this.assignedProject?.id || 1;
            const sectorId = this.assignedProject?.sectorId || this.assignedProject?.sector_id;

            const [requisitionsRes, incomingRes, sectorShipsRes, rentalsRes] = await Promise.all([
                client.get(`/requisitions?projectId=${projectId}`),
                client.get(`/inventory/incoming-shipments?projectId=${projectId}`).catch(() => ({ data: [] })),
                sectorId ? client.get(`/inventory/incoming-shipments?sectorId=${sectorId}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                client.get(`/vehicle-rentals?projectId=${projectId}&status=active`).catch(() => ({ data: [] }))
            ]);

            const reqItems = (Array.isArray(requisitionsRes) ? requisitionsRes : (requisitionsRes.data || requisitionsRes.requisitions || [])).filter(r => {
                const status = (r.status || '').toLowerCase();
                const dispStatus = (r.dispatchStatus || '').toLowerCase();
                // Include if status is approved/fulfilled AND dispatchStatus indicates in-transit
                return (status === 'approved' || status === 'fulfilled') && 
                       (dispStatus === 'in_transit' || dispStatus === 'dispatched' || dispStatus === 'partially_received');
            });
            const projectShips = Array.isArray(incomingRes) ? incomingRes : (incomingRes.data || incomingRes.shipments || []);
            const sectorShips = Array.isArray(sectorShipsRes) ? (sectorShipsRes.data || sectorShipsRes) : (sectorShipsRes.data || []);
            const rentals = Array.isArray(rentalsRes.data || rentalsRes) ? (rentalsRes.data || rentalsRes) : (rentalsRes.data?.contracts || []);
            
            const shipItems = [...projectShips, ...sectorShips];

            // Merge formal requisitions and direct inventory dispatches with full metadata
            const normalizedShips = shipItems.map(s => ({
                id: `SHIP-${s.id}`,
                reqCode: s.dispatchCode || s.reference || `DISP-${s.id}`,
                dispatchedBy: s.driverName || s.transporterName || s.senderName || 'Yard Manager',
                dispatchedPhone: s.driverPhone || s.transporterPhone || s.senderPhone || '',
                dispatchDate: s.dispatchDate || s.createdAt || '',
                remarks: s.remarks || s.justification || s.notes || 'No remarks provided.',
                eta: s.eta || s.estimatedArrival || 'TBD',
                items: s.items || [{
                    itemName: s.itemName || s.materialName,
                    quantity: s.quantity,
                    unit: s.unit
                }],
                dispatchStatus: 'in_transit'
            }));

            // Normalize rentals as en-route shipments
            const normalizedRentals = rentals.map(r => ({
                id: `RENT-${r.id}`,
                reqCode: r.refCode,
                dispatchedBy: r.vendorName || 'Vendor Delivery',
                dispatchedPhone: '',
                dispatchDate: r.startDate,
                remarks: `Rental Contract: ${r.machineType}. Period: ${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}`,
                eta: r.startDate,
                items: [{
                    itemName: r.machineType,
                    quantity: 1,
                    unit: 'Unit'
                }],
                dispatchStatus: 'in_transit'
            }));

            this.inTransitItems = [
                ...reqItems,
                ...normalizedShips,
                ...normalizedRentals
            ];
        } catch (error) {
            console.error('[FS] Failed to load in-transit items:', error);
            this.inTransitItems = this.inTransitItems || [];
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
            const items = (item.items || []).map(i => `${i.quantity} x ${i.itemName}`).join(', ');
            const driver = item.dispatchedBy || item.transporterName || 'Yard Team';
            const phone = item.dispatchedPhone || item.driverPhone || 'N/A';
            const dispatchTime = item.dispatchDate || item.createdAt;
            const formattedDispatchTime = dispatchTime ? new Date(dispatchTime).toLocaleString() : 'N/A';
            const justification = item.remarks || item.justification || item.notes || 'Scheduled fulfillment';

            return `
                <div style="padding: 16px; background: white; border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--blue-border); box-shadow: var(--shadow-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 800; font-size: 15px; color: var(--slate-900);">${items}</div>
                            <div style="font-size: 11px; color: var(--blue); font-weight: 700; margin-top: 2px;">
                                <i class="fas fa-barcode"></i> ${item.reqCode || 'REQ-' + item.id}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" style="background: var(--blue); border-color: var(--blue); padding: 8px 16px;" onclick="window.app.fsModule.handleConfirmArrival('${item.id}')">
                            <i class="fas fa-check-circle"></i> Confirm Arrival
                        </button>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-100);">
                        <div>
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Driver / Transporter</div>
                            <div style="font-size: 12px; font-weight: 700; color: var(--slate-700);">${driver}</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Driver Phone</div>
                            <div style="font-size: 12px; font-weight: 700; color: var(--blue);">${phone}</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Dispatch Time</div>
                            <div style="font-size: 11px; font-weight: 600; color: var(--slate-600);">${formattedDispatchTime}</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">ETA (Arrival)</div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--emerald);">${eta}</div>
                        </div>
                        <div style="grid-column: span 2; border-top: 1px dashed var(--slate-200); padding-top: 8px;">
                            <div style="font-size: 10px; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Justification / Remarks</div>
                            <div style="font-size: 11px; color: var(--slate-600); font-style: italic; line-height: 1.4;">"${justification}"</div>
                        </div>
                    </div>
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
            qtySent: Number(input.dataset.expectedQty),
            qtyReceived: Number(input.value)
        }));

        if (!receivedBy) {
            window.toast.show('Please enter the name of the Receiving Officer.', 'warning');
            return;
        }

        try {
            window.toast.show('Processing site intake...', 'info');
            
            const shortages = receivedItems.filter(i => i.qtyReceived < i.qtySent);
            const hasDiscrepancy = shortages.length > 0 || receivedItems.some(i => i.qtyReceived > i.qtySent);
            
            if (hasDiscrepancy) {
                // Validation: Disallow exceeding limit
                for (const item of receivedItems) {
                    const limit = item.qtySent > 0 ? item.qtySent : 999999999; // Fallback to a very high number if no specific dispatch (handled by project check if needed)
                    
                    if (item.qtyReceived > limit) {
                        window.toast.show(`ERROR: Received quantity for ${item.itemName} cannot exceed the authorized dispatch of ${limit.toLocaleString()}.`, 'error');
                        return;
                    }
                }

                // If shortage, reason is mandatory
                if (shortages.length > 0 && (!notes || notes.length < 10)) {
                    window.toast.show('Shortage detected: Please provide a detailed reason in the notes (min 10 chars).', 'warning');
                    return;
                }

                // Handle shortages: Audit, Notify, and Auto-Procure
                for (const item of shortages) {
                    const missingQty = item.qtySent - item.qtyReceived;
                    
                    // 1. Create replenishment request for FD to procure more
                    await replenishmentApi.createRequest({
                        projectId: this.assignedProject?.id || 1,
                        materialName: item.itemName,
                        quantity: missingQty,
                        reason: `Shortage during intake: ${notes}`,
                        priority: 'high',
                        status: 'pending_procurement'
                    });

                    // 2. Create Audit Log
                    await client.post('/audit-logs', {
                        action: 'MATERIAL_INTAKE_SHORTAGE',
                        targetType: 'INVENTORY',
                        targetId: item.id || item.itemName,
                        details: {
                            itemName: item.itemName,
                            sent: item.qtySent,
                            received: item.qtyReceived,
                            missing: missingQty,
                            reason: notes,
                            supervisor: receivedBy
                        }
                    });

                    // 3. Notify FD and EC
                    await notificationService.sendEmail({
                        to: 'Finance Director & EC',
                        subject: `ALERT: Material Shortage Detected - ${item.itemName}`,
                        body: `Field Supervisor ${receivedBy} reported a shortage of ${missingQty} units for ${item.itemName} at Project ${this.assignedProject?.id}. A new procurement request has been auto-generated.`,
                        description: notes
                    });
                }

                await client.post(`/dispatch/${reqId}/variance`, {
                    receivedItems,
                    receivedBy,
                    dispatchedBy,
                    notes
                });
                window.toast.show('Intake completed with variance. Replenishment triggered.', 'warning');
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
            window.toast.show('Failed to complete resource intake: ' + (error.message || 'Server error'), 'error');
        }
    },

    toggleRequestType(type, btn) {
        const btnMachinery = document.getElementById('fs_btn_machinery');
        const btnMaterials = document.getElementById('fs_btn_materials');

        if (!btnMachinery || !btnMaterials) return;

        // Reset both buttons to inactive state
        [btnMachinery, btnMaterials].forEach(b => {
            if (b) {
                b.style.background = 'transparent';
                b.style.color = 'var(--slate-600)';
                b.classList.remove('active');
            }
        });

        // Set active state
        btn.style.background = 'var(--orange)';
        btn.style.color = 'white';
        btn.classList.add('active');

        // Toggle rows based on class
        const macRows = document.querySelectorAll('.fs-mac-row');
        const matRows = document.querySelectorAll('.fs-mat-row');

        if (type === 'machinery') {
            macRows.forEach(r => r.style.display = 'table-row');
            matRows.forEach(r => r.style.display = 'none');
        } else {
            macRows.forEach(r => r.style.display = 'none');
            matRows.forEach(r => r.style.display = 'table-row');
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
        const countBadge = document.getElementById('fs_req_count_badge');
        const messageArea = document.getElementById('fs_req_message_area');

        if (!container) return;

        if (this.requisitionCart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--slate-400); font-size: 12px; border: 1px dashed var(--slate-200); border-radius: 12px;">
                    <i class="fas fa-shopping-cart" style="display: block; font-size: 18px; margin-bottom: 8px; opacity: 0.3;"></i>
                    Draft is empty. Add items above to build your request.
                </div>
            `;
            if (countBadge) countBadge.innerText = '0 Items';
            if (messageArea) messageArea.style.display = 'none';
            return;
        }

        if (countBadge) countBadge.innerText = `${this.requisitionCart.length} Item${this.requisitionCart.length > 1 ? 's' : ''}`;

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

    async handleBulkRequisitionSubmit() {
        const checkboxes = document.querySelectorAll('.fs-req-checkbox');
        const macCheckboxes = document.querySelectorAll('.fs-req-mac-checkbox');
        const items = [];

        for (const cb of checkboxes) {
            if (cb.checked) {
                const limit = parseFloat(cb.dataset.limit || 0);
                if (limit > 0) {
                    items.push({
                        itemName: cb.dataset.name,
                        quantity: limit,
                        unit: cb.dataset.unit || 'units',
                        category: cb.dataset.type,
                        unitPrice: 0
                    });
                }
            }
        }

        for (const cb of macCheckboxes) {
            if (cb.checked) {
                items.push({
                    itemName: cb.dataset.name,
                    quantity: parseFloat(cb.dataset.days || 30),
                    unit: 'days',
                    category: 'machinery',
                    machineUnits: parseFloat(cb.dataset.units || 1),
                    unitPrice: 0
                });
            }
        }

        if (items.length === 0) {
            if (window.toast) window.toast.show('Please enter a quantity for at least one item.', 'warning');
            return;
        }

        const urgency = document.getElementById('fs_req_urgency')?.value || 'normal';

        try {
            if (window.toast) window.toast.show(`Submitting batch of ${items.length} items...`, 'info');

            const payload = {
                projectId: this.assignedProject?.id,
                items: items,
                requestDate: new Date().toISOString(),
                urgency: urgency,
                status: 'pending',
                notes: `Bulk request from Field Supervisor Checklist`,
                vendorName: 'Internal Transfer',
                totalAmount: 0
            };

            const result = await client.post('/requisitions', payload);

            if (window.toast) {
                window.toast.show(`Bulk Requisition #${result.reqCode || 'SENT'} submitted successfully.`, 'success');
            }

            setTimeout(() => {
                window.drawer.close();
                if (this.currentView === 'logistics') {
                    this._loadInTransit();
                    this._refreshCurrentView();
                }
            }, 500);

        } catch (error) {
            console.error('[FS] Bulk requisition failed:', error);
            if (window.toast) window.toast.show(`Submission failed: ${error.message || 'Server error'}`, 'error');
        }
    },

    async handleSubmitRequisition() {
        if (!this.requisitionCart || this.requisitionCart.length === 0) {
            if (window.toast) window.toast.show('Please add at least one item to your request draft.', 'warning');
            return;
        }

        const urgency = document.getElementById('fs_req_urgency')?.value || 'normal';

        // Format items for API
        const formattedItems = this.requisitionCart.map(item => ({
            itemName: item.itemName,
            quantity: Number(item.quantity),
            unit: item.unit || 'Units',
            unitPrice: 0 
        }));

        try {
            if (window.toast) window.toast.show('Submitting requisition to EC...', 'info');

            const payload = {
                projectId: this.assignedProject?.id,
                items: formattedItems,
                requestDate: new Date().toISOString(),
                urgency: urgency,
                status: 'pending',
                notes: `Batch request from Field Supervisor for ${this.assignedProject?.name || 'Site'}`,
                vendorName: 'Internal Transfer',
                totalAmount: 0
            };

            console.log('[FS] Submitting requisition:', payload);
            const result = await client.post('/requisitions', payload);

            if (window.toast) {
                window.toast.show(`Requisition #${result.reqCode || 'SENT'} submitted successfully.`, 'success');
            }

            // Clear cart
            this.requisitionCart = [];
            
            // Close drawer after success
            setTimeout(() => {
                window.drawer.close();
                if (this.currentView === 'logistics') {
                    this._loadInTransit();
                    this._refreshCurrentView();
                }
            }, 500);

        } catch (error) {
            console.error('[FS] Requisition submission failed:', error);
            if (window.toast) {
                window.toast.show(`Submission failed: ${error.message || 'Server error'}`, 'error');
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

    handleRequisitionPhaseChange(phaseNum) {
        console.log('[FS] Requisition phase changed to:', phaseNum);
        if (this.assignedProject) {
            // Update the temporary phase for the drawer view
            const tempProject = { ...this.assignedProject, currentPhase: phaseNum };
            
            // Re-open the drawer with the new phase data
            // Since we're already in a drawer, this will just replace the content
            window.drawer.open('Request Resource', window.DrawerTemplates.requestResourceFS(tempProject), 'lg');
        }
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
    },

    _getReceiptHistory(materialName) {
        const projectId = this.assignedProject?.id || 1;
        const key = `mcms_receipts_${projectId}_${materialName.toLowerCase().replace(/\s+/g, '_')}`;
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            return [];
        }
    },

    _saveReceiptRecord(materialName, data) {
        const projectId = this.assignedProject?.id || 1;
        const key = `mcms_receipts_${projectId}_${materialName.toLowerCase().replace(/\s+/g, '_')}`;
        const history = this._getReceiptHistory(materialName);
        history.unshift(data);
        localStorage.setItem(key, JSON.stringify(history.slice(0, 10))); // Keep last 10
    },

    async viewReceiptHistory(name, unit) {
        const localReceipts = this._getReceiptHistory(name);
        const backendLogs = (this.siteInventoryLogs?.[name] || []).filter(l => l.type === 'IN');

        // Merge and sort by date
        const allHistory = [
            ...localReceipts.map(r => ({
                id: 'local',
                date: r.timestamp,
                qty: r.qty,
                ref: r.ref,
                user: r.receivedBy,
                notes: r.notes,
                isLocal: true
            })),
            ...backendLogs.map(l => ({
                id: l.id,
                date: l.timestamp,
                qty: l.quantity,
                ref: l.reference,
                user: l.user?.name || 'Yard Team',
                notes: l.notes,
                isLocal: false
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        window.drawer.open(`Receipt History: ${name}`, `
            <div style="padding: 0; background: white; min-height: 100%; font-family: sans-serif;">
                <!-- Simple Header -->
                <div style="padding: 24px; border-bottom: 2px solid #FFF7ED; background: white;">
                    <div style="font-size: 11px; color: #F97316; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Material Receipt History</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                        <h2 style="margin: 0; font-size: 20px; color: #1E293B;">${name}</h2>
                        <div style="text-align: right;">
                            <div style="font-size: 18px; font-weight: 700; color: #F97316;">${allHistory.reduce((sum, h) => sum + (Number(h.qty) || 0), 0).toLocaleString()} ${unit}</div>
                            <div style="font-size: 10px; color: #64748B;">Total Received</div>
                        </div>
                    </div>
                </div>

                <div style="padding: 24px;">
                    ${allHistory.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #94A3B8;">No records found.</div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 1px; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                            ${allHistory.map((entry, idx) => `
                                <div style="background: white; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                        <div>
                                            <div style="font-size: 12px; font-weight: 600; color: #1E293B;">+ ${Number(entry.qty).toLocaleString()} ${unit}</div>
                                            <div style="font-size: 11px; color: #64748B;">${new Date(entry.date).toLocaleString()}</div>
                                        </div>
                                        <div style="font-size: 10px; font-weight: 700; color: #F97316; text-transform: uppercase; background: #FFF7ED; padding: 2px 8px; border-radius: 4px;">
                                            ${entry.isLocal ? 'Site Intake' : 'Dispatch'}
                                        </div>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid #F1F5F9; padding-top: 12px;">
                                        <div>
                                            <div style="font-size: 10px; color: #94A3B8; text-transform: uppercase;">Handled By</div>
                                            <div style="font-size: 12px; color: #334155; font-weight: 500;">${entry.user}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 10px; color: #94A3B8; text-transform: uppercase;">Reference</div>
                                            <div style="font-size: 12px; color: #334155; font-weight: 500;">${entry.ref || 'N/A'}</div>
                                        </div>
                                    </div>

                                    ${entry.notes ? `
                                        <div style="font-size: 13px; color: #475569; background: #F8FAFC; padding: 12px 16px; border-radius: 6px; line-height: 1.6;">
                                            ${entry.notes.split('|').map(part => {
                                                const segment = part.trim();
                                                if (segment.includes(':')) {
                                                    const [label, ...value] = segment.split(':');
                                                    return `<div style="margin-bottom: 4px;"><span style="font-weight: 700; color: #1E293B;">${label}:</span> ${value.join(':').trim()}</div>`;
                                                }
                                                return `<div style="margin-bottom: 4px;">${segment}</div>`;
                                            }).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <div style="padding: 24px; border-top: 1px solid #E2E8F0;">
                    <button class="btn" style="width: 100%; background: #F97316; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer;" onclick="window.drawer.close()">
                        Return to Inventory
                    </button>
                </div>
            </div>
        `);
    }
};
