/**
 * MCMS - EC Handlers (v1.0.4 - Validation Hardening)
 */
import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';
import inventoryApi from '../../../src/api/inventory.api.js';
import procurement from '../../../src/api/procurement.api.js';
import assetsApi from '../../../src/api/assets.api.js';
import { notificationService } from '../../../src/services/notifications.service.js';

export const EC_Handlers = {
    openDispatchDrawer() {
        // Fetch projects to populate the drawer
        client.get('/projects').then(result => {
            const projects = Array.isArray(result) ? result : (result.data || []);
            window.drawer.open('Strategic Asset Dispatch', window.DrawerTemplates.assignResource(projects));
        });
    },

    toggleResourceType(type, btn) {
        const machineryView = document.getElementById('machinery_view');
        const materialsView = document.getElementById('material_sheet_view');
        if (!machineryView || !materialsView) return;

        if (type === 'machinery') {
            machineryView.style.display = 'block';
            materialsView.style.display = 'none';
        } else {
            machineryView.style.display = 'none';
            materialsView.style.display = 'block';
        }

        document.querySelectorAll('.active-resource').forEach(b => b.classList.remove('active', 'btn-primary'));
        document.querySelectorAll('.active-resource').forEach(b => b.classList.add('btn-secondary'));
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary', 'active');
    },

    updateMaterialSheet(phaseId) {
        const container = document.getElementById('material_sheet_container');
        if (!container) return;

        const materials = (this.phaseMaterials || {})[phaseId];
        if (!materials) {
            container.innerHTML = '<div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--slate-400);">No materials listed for this phase.</div>';
            return;
        }

        container.innerHTML = materials.map((mat, i) => `
            <div style="background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">${mat.name}</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="number" id="qty_${i}" class="form-input" style="flex: 1; padding: 6px;" placeholder="Qty" 
                        oninput="window.app.ecModule.refreshStrategicImpact()">
                    <span style="font-size: 11px;">${mat.unit}</span>
                </div>
            </div>
        `).join('');
        this.refreshStrategicImpact();
    },

    refreshStrategicImpact() {
        const project = document.getElementById('assign_project')?.value;
        const phase = document.getElementById('assign_phase')?.value;
        if (!project || !phase) return;

        const projectStock = this.inventoryByProject?.[project] || [];
        const phaseMats = this.phaseMaterials[phase] || [];
        const itemsToMove = phaseMats.map((mat, i) => ({
            name: mat.name,
            quantity: Number(document.getElementById(`qty_${i}`)?.value || 0),
            unit: mat.unit
        })).filter(i => i.quantity > 0);

        const stockMap = {};
        projectStock.forEach(s => stockMap[s.materialName] = { qty: s.quantityOnHand });
        this._updateDispatchImpact(itemsToMove, stockMap);
    },

    async handleExecuteDispatch() {
        const project = document.getElementById('assign_project')?.value;
        const phase = document.getElementById('assign_phase')?.value;
        const supervisor = document.getElementById('assign_fs')?.value;
        const isMachinery = document.getElementById('btn_machinery')?.classList.contains('active');
        const eta = document.getElementById('dispatch_eta')?.value;

        // 1. Validate ETA (Inline)
        const etaDate = new Date(eta);
        const etaError = document.getElementById('eta_error');
        if (isNaN(etaDate.getTime()) || etaDate < new Date()) {
            if (etaError) etaError.style.display = 'block';
            window.toast?.show('Invalid ETA provided.', 'warning');
            return;
        }

        if (!project || (!isMachinery && !phase) || !supervisor) {
            window.toast.show('Please select project, phase, and supervisor.', 'warning');
            return;
        }

        window.toast.show('Validating inventory…', 'info');

        const projectStock = this.inventoryByProject?.[project] || [];
        const phaseMats = this.phaseMaterials[phase] || [];
        const itemsToMove = phaseMats.map((mat, i) => ({
            name: mat.name,
            quantity: Number(document.getElementById(`qty_${i}`)?.value || 0),
            unit: mat.unit
        })).filter(i => i.quantity > 0);

        if (itemsToMove.length === 0) {
            window.toast.show('Please enter quantities to dispatch.', 'warning');
            return;
        }

        // Map projectStock to the format expected by _updateDispatchImpact
        const stockMap = {};
        projectStock.forEach(s => stockMap[s.materialName] = { qty: s.quantityOnHand });

        const { allAvailable, shortfalls } = this._updateDispatchImpact(itemsToMove, stockMap);

        if (!allAvailable) {
            // Store context for partial dispatch
            this._currentDispatchContext = {
                type: 'strategic',
                project,
                phase,
                supervisor,
                items: itemsToMove,
                shortfalls,
                eta
            };
            window.toast.show('Inventory check failed. Use "Dispatch Available" to proceed with partial delivery.', 'warning');
            return;
        }

        if (!confirm('Inventory verified. Proceed with Strategic Dispatch?')) {
            return;
        }

        // Execute the moves
        for (const item of itemsToMove) {
            const stockItem = projectStock.find(m => String(m.materialName).trim() === String(item.name).trim());

            try {
                await inventoryApi.distribute({
                    sectorId: stockItem ? stockItem.sectorId : 1, 
                    materialName: item.name,
                    category: 'Construction',
                    unit: item.unit,
                    quantity: item.quantity,
                    reference: `Bulk Site Dispatch: ${project}`,
                    notes: `Dispatched to ${supervisor} | ETA: ${eta}`
                });
            } catch (err) {
                console.error(`[EC] Failed to distribute ${item.name}:`, err);
            }
        }

        await notificationService.sendEmail({
            to: supervisor,
            subject: `Dispatch Notification: ${isMachinery ? 'Machinery' : 'Materials'} En-Route`,
            body: `Greetings. A dispatch of ${isMachinery ? 'Assets' : 'Construction Materials'} has been authorized for Site ${project}.`
        });

        setTimeout(() => {
            window.drawer.close();
            this._loadInventory();
            window.app.loadPage(this.currentView);
            window.toast.show('Dispatch completed successfully.', 'success');
        }, 800);
    },

    async handleIssueMaterial(itemId) {
        const projectId = document.getElementById('dist_project')?.value;
        const qty = Number(document.getElementById('dist_qty')?.value);
        if (!projectId || !qty) return;

        // --- STRICT SILO ENFORCEMENT ---
        const projectStock = this.inventoryByProject?.[projectId] || [];
        const material = projectStock.find(m => m.materialName === itemId || m.id === parseInt(itemId));
        
        if (!material || material.quantityOnHand < qty) {
            window.toast.show(`INSUFFICIENT PROJECT STOCK: Project ${projectId} only has ${material ? material.quantityOnHand : 0} units of this material. Refusing cross-project transfer.`, 'error');
            return;
        }

        window.toast.show('Authorizing site release…', 'info');

        try {
            await inventoryApi.consume({
                sectorId: material.sectorId, // Use the correct sector for this project
                materialName: material.materialName,
                quantity: qty,
                reference: `Field Release: ${projectId}`,
                notes: `Released to site by EC`
            });
            
            await this._loadInventory(); // Refresh specific silo
            await this._loadDistributionLogs();

            setTimeout(() => {
                window.drawer.close();
                window.toast.show('Material released to project site.', 'success');
            }, 800);
        } catch (error) {
            console.error('[EC] Release failed:', error);
            window.toast.show('Release Failed: ' + (error.message || 'Server error'), 'error');
        }
    },

    async handleProcurementReceipt(item) {
        const qtyInput = document.getElementById('receive_qty');
        const qty = Number(qtyInput?.value);
        if (!qty) return;

        const btn = document.querySelector('button[onclick*="handleProcurementReceipt"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        }

        window.toast.show('Recording physical receipt and updating silo…', 'info');

        try {
            await inventoryApi.receiveShipment({
                contractItemId: item.id,
                receivedQty: qty
            });
            
            this.pendingReceipts = this.pendingReceipts.filter(p => p.id !== item.id);
            await this._loadInventory(); // Refresh stock levels
            await this._loadProcurementReceipts(); // Sync with server

            setTimeout(() => {
                window.drawer.close();
                window.app.loadPage(this.currentView);
                window.toast.show('Physical stock verified and added to silo.', 'success');
            }, 800);
        } catch (error) {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Confirm Physical Receipt';
            }
            console.error('[EC] Receipt failed:', error);
            window.toast.show('Failed to record receipt: ' + (error.message || 'Server error'), 'error');
        }
    },

    async handleIntake(requisitionId) {
        try {
            await window.loader.show('Processing GRN and Intaking Inventory...', async () => {
                const reqId = parseInt(requisitionId, 10);
                await window.requisitions.fulfill(reqId, 1); // Default to Sector 1 for yard
            });
            window.modal.showSuccess('Goods Received', 'Materials have been added to inventory.');
            await this._loadRequisitions();
            await this._loadInventory();
        } catch (error) {
            console.error('[EC] Intake failed', error);
            window.modal.showError('Intake Failed', error.message || 'Failed to process GRN');
        }
    },

    async handleAssetUpdate(assetId) {},

    handleTimelineProjectChange(projectId) {
        console.log('[EC] Project context changed to:', projectId);
        // Additional logic can be added here if we need to filter phases or supervisors by project
    },

    async handleResolveIssue(assetId, assetName) {
        if (!confirm(`Mark ${assetName} as FIXED and return it to AVAILABLE fleet pool?`)) {
            return;
        }

        try {
            await window.loader.show('Resolving maintenance issue...', async () => {
                await window.assets.resolveIssue(assetId, `Fixed by workshop and returned to fleet.`);
            });
            window.modal.showSuccess('Asset Repaired', `${assetName} is now available for field deployment.`);
            await this._loadAssets();
        } catch (error) {
            console.error('[EC] Failed to resolve:', error);
            window.modal.showError('Error', error.message || 'Failed to update asset');
        }
    },

    async handleAssetProcurementRequest() {
        const type = document.getElementById('req_asset_type')?.value;
        const reason = document.getElementById('req_reason')?.value;

        window.toast.show('Submitting procurement request…', 'info');

        try {
            await procurement.create({
                vehicleName: type,
                justification: reason,
                priority: 'Standard'
            });

            await notificationService.sendEmail({
                to: 'Finance Director',
                subject: `Fleet Procurement Request: ${type}`,
                body: `Equipment Coordinator has requested a new ${type} asset.`,
                description: reason
            });

            setTimeout(() => {
                window.drawer.close();
                window.toast.show('Procurement request submitted to Finance.', 'success');
            }, 800);
        } catch (error) {
            window.toast.show('Failed to submit request: ' + (error.message || 'Server error'), 'error');
        }
    },

    async syncFMProcurement() {
        window.toast.show('Syncing with Finance procurement system…', 'info');
        
        try {
            await this._loadProcurementReceipts();
            window.app.loadPage(this.currentView);
            window.toast.show(`Sync complete: ${this.pendingReceipts.length} pending receipt(s).`, 'success');
        } catch (error) {
            window.toast.show('Sync failed: ' + (error.message || 'Server error'), 'error');
        }
    },

    openInventoryDetails(materialName) {
        const data = this.inventory[materialName];
        if (!data) return;

        window.drawer.open('Material Inventory Breakdown', window.DrawerTemplates.inventoryDetails({
            materialName,
            totalQty: data.qty,
            unit: data.unit,
            allocations: data.allocations || []
        }));
    },

    async handleAssetHistory(assetId) {
        window.toast.show('Retrieving chain of custody log…', 'info');
        try {
            const asset = await assetsApi.getById(assetId);
            window.drawer.open('Asset History & Fault Log', window.DrawerTemplates.assetHistory(asset));
        } catch (error) {
            console.error('[EC] Failed to load asset history:', error);
            window.toast.show('Failed to load history: ' + (error.message || 'Server error'), 'error');
        }
    },

    async handleDispatch(reqId) {
        const req = this.requisitionQueue.find(r => String(r.id) === String(reqId));
        if (req) {
            window.drawer.open('Dispatch Authorization', window.DrawerTemplates.dispatchResource(req));
            
            // Auto-trigger inventory impact calculation
            setTimeout(async () => {
                if (!this.inventory || Object.keys(this.inventory).length === 0) {
                    await this._loadInventory();
                }
                this._updateDispatchImpact(req.items, this.inventory);
            }, 100);
        }
    },

    async handleRequisitionDispatch(reqId) {
        console.log('[EC] handleRequisitionDispatch triggered for:', reqId);
        const req = this.requisitionQueue.find(r => String(r.id) === String(reqId));
        if (!req) {
            window.toast.show('Error: Requisition not found in queue.', 'error');
            return;
        }

        const eta = document.getElementById('dispatch_eta')?.value;
        const etaDate = new Date(eta);
        const etaError = document.getElementById('eta_error');
        
        if (isNaN(etaDate.getTime()) || etaDate < new Date()) {
            if (etaError) etaError.style.display = 'block';
            window.toast?.show('Invalid ETA provided.', 'warning');
            return;
        }

        // Validate that the Yard has enough stock to fulfill this requisition
        if (req.items && req.items.length > 0) {
            // Force reload inventory if it seems empty
            if (!this.inventory || Object.keys(this.inventory).length === 0) {
                await this._loadInventory();
            }

            const { allAvailable, shortfalls } = this._updateDispatchImpact(req.items, this.inventory);

            if (!allAvailable) {
                // Store context for partial dispatch
                this._currentDispatchContext = {
                    type: 'requisition',
                    reqId,
                    items: req.items,
                    shortfalls,
                    eta,
                    project: req.project?.name,
                    supervisor: req.project?.fieldSupervisor?.name
                };
                window.toast.show('Insufficient Yard Inventory. Use "Dispatch Available" to escalate to Finance.', 'warning');
                return;
            }

            if (!confirm('Inventory verified. Proceed with Logistics?')) {
                return;
            }
        }

        try {
            window.toast.show('Processing dispatch...', 'info');
            await client.post('/dispatch', { requisitionId: reqId, estimatedArrival: eta });
            window.toast.show('Resources dispatched successfully.', 'success');
            window.drawer.close();
            await this._loadRequisitions();
        } catch (error) {
            console.error('Dispatch failed:', error);
            window.toast.show('Failed to execute dispatch.', 'error');
        }
    },

    async handleReplenishRequest(reqId) {
        const req = this.requisitionQueue.find(r => String(r.id) === String(reqId));
        if (!req) {
            window.toast.show('Requisition not found.', 'error');
            return;
        }

        // Open the replenish drawer with the requisition info
        window.drawer.open('Request Replenishment', window.DrawerTemplates.replenishRequest(req));
    },

    async handleSubmitReplenishment(reqId) {
        const reason = document.getElementById('replenish_reason')?.value;
        if (!reason || reason.length < 10) {
            window.toast.show('Please provide a valid justification (min 10 chars).', 'warning');
            return;
        }

        const req = this.requisitionQueue.find(r => String(r.id) === String(reqId));
        if (!req) return;

        try {
            window.toast.show('Submitting replenishment request to Finance Director...', 'info');
            
            // Create a new replenishment requisition linked to the original
            const items = (req.items || []).map(i => ({
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice || 0
            }));

            await client.post('/requisitions', {
                projectId: req.projectId || req.project?.id || 1,
                totalAmount: 0, // Will be auto-calculated by price catalog
                vendorName: 'Replenishment Request',
                notes: `REPLENISHMENT: ${reason} | Ref: ${req.reqCode || 'REQ-'+req.id}`,
                items
            });

            // Send email to Finance Director
            try {
                const { notificationService } = await import('../../../src/services/notifications.service.js');
                await notificationService.sendEmail({
                    to: 'Finance Director',
                    subject: `Replenishment Request: Stock Depleted for ${req.project?.name || 'Project'}`,
                    body: `Equipment Coordinator is requesting stock replenishment.\n\nJustification: ${reason}\n\nOriginal Requisition: ${req.reqCode || 'REQ-'+req.id}\nItems: ${items.map(i => `${i.quantity}x ${i.itemName}`).join(', ')}\n\nPlease review and approve a vendor contract if budget permits.`
                });
            } catch (emailErr) {
                console.error('[EC] Email notification failed:', emailErr);
            }

            window.toast.show('Replenishment request sent to Finance Director for procurement.', 'success');
            window.drawer.close();
            await this._loadRequisitions();
        } catch (error) {
            console.error('Replenishment failed:', error);
            window.toast.show('Failed to submit replenishment request.', 'error');
        }
    },

    async _loadInventory() {
        if (this.isLoadingInventory) return;
        this.isLoadingInventory = true;
        try {
            const data = await inventoryApi.getAll();
            const items = Array.isArray(data) ? data : (data.data || []);
            
            const invMap = {};
            const projectMap = {};
            
            items.forEach(item => {
                // System Total Map
                invMap[item.materialName] = {
                    qty: Number(item.totalQuantity) || 0,
                    unit: item.unit || 'Units',
                    thresh: 100, // Default threshold
                    category: 'Materials',
                    allocations: item.allocations
                };

                // Project-specific Map for the breakdown view
                item.allocations.forEach(alloc => {
                    if (!projectMap[alloc.projectId]) projectMap[alloc.projectId] = [];
                    projectMap[alloc.projectId].push({
                        materialName: item.materialName,
                        quantityOnHand: alloc.quantity,
                        sectorName: alloc.sectorName,
                        sectorId: alloc.sectorId
                    });
                });
            });
            
            this.inventory = invMap;
            this.inventoryByProject = projectMap;
            
            if (this.currentView === 'inventory' || this.currentView === 'dashboard') {
                this._refreshCurrentView();
            }
        } catch (error) {
            console.error('[EC] Failed to load inventory:', error);
        } finally {
            this.isLoadingInventory = false;
        }
    },

    _updateDispatchImpact(items, inventorySource) {
        const container = document.getElementById('dispatch_impact_summary');
        const mainBtn = document.getElementById('btn_authorize_dispatch') || document.getElementById('btn_execute_dispatch');
        if (!container) return { allAvailable: false, shortfalls: [] };

        // If no items, reset to initial state
        if (!items || items.length === 0) {
            container.innerHTML = `
                <i class="fas fa-microchip" style="font-size: 24px; color: var(--slate-300); opacity: 0.5;"></i>
                <div style="text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em;">Intelligence: Awaiting Input</div>
                    <div style="font-size: 10px; color: var(--slate-400); margin-top: 2px;">Select project and resources to calculate logistics impact</div>
                </div>
            `;
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.padding = '24px';
            container.style.background = 'var(--slate-50)';
            container.style.border = '1px dashed var(--slate-200)';
            return { allAvailable: true, shortfalls: [] };
        }

        container.style.display = 'block';
        container.style.padding = '0';
        container.style.background = 'transparent';
        container.style.border = 'none';

        let html = `<div style="font-size: 11px; font-weight: 800; color: var(--slate-500); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-microchip" style="color: var(--blue);"></i>
                        <span>Inventory Impact Intelligence</span>
                        <span style="flex: 1; height: 1px; background: var(--slate-200);"></span>
                    </div>`;
        
        let allAvailable = true;
        let anyAvailable = false;
        const shortfalls = [];

        items.forEach(item => {
            const name = String(item.itemName || item.name).trim();
            const stock = inventorySource?.[name];
            const available = Number(stock?.qty || stock?.quantityOnHand || 0);
            const requested = Number(item.quantity);
            const remaining = available - requested;

            if (available > 0) anyAvailable = true;
            
            const isShort = available < requested;
            if (isShort) {
                allAvailable = false;
                shortfalls.push({ name, requested, available, deficit: requested - available });
            }

            const percent = Math.min(100, Math.max(0, (available / requested) * 100));
            const barColor = isShort ? 'var(--red)' : 'var(--emerald)';

            html += `
                <div style="background: white; padding: 14px; border-radius: 12px; margin-bottom: 12px; border: 1px solid ${isShort ? 'rgba(239, 68, 68, 0.2)' : 'var(--slate-200)'}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${barColor}"></div>
                            <div style="font-weight: 700; font-size: 13px; color: var(--slate-800);">${name}</div>
                        </div>
                        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;">
                            ${available.toLocaleString()} / ${requested.toLocaleString()}
                        </div>
                    </div>
                    <div style="height: 4px; background: var(--slate-100); border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${percent}%; background: ${barColor}; transition: width 0.5s ease;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; font-weight: 600; color: ${isShort ? 'var(--red)' : 'var(--slate-500)'};">
                        <span>${isShort ? `Deficit: ${(requested - available).toLocaleString()}` : `Surplus: ${remaining.toLocaleString()}`}</span>
                        <span>${Math.round(percent)}% Match</span>
                    </div>
                </div>
            `;
        });

        if (!allAvailable) {
            html += `
                <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #FFF5F5 0%, #FED7D7 100%); border-radius: 12px; border: 1px solid #FEB2B2; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);">
                    <div style="font-size: 12px; color: #C53030; font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                        <i class="fas fa-triangle-exclamation"></i> Critical Shortage
                    </div>
                    <div style="font-size: 12px; color: #742A2A; margin-bottom: 16px; line-height: 1.5; font-weight: 500;">
                        ${anyAvailable ? 'Supply chain gap detected. Yard stock cannot fulfill the total requirement.' : 'Requested assets are completely unavailable in the central yard.'}
                    </div>
                    <button class="btn" style="width: 100%; font-size: 12px; background: #C53030; color: white; border: none; padding: 14px; font-weight: 700; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 10px rgba(197, 48, 48, 0.3); transition: all 0.2s;" 
                        onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'"
                        onclick="window.app.ecModule.handlePartialDispatchProcess()">
                        <i class="fas fa-bolt"></i> ${anyAvailable ? 'Dispatch Available & Escalate' : 'Trigger Emergency Procurement'}
                    </button>
                </div>
            `;
            
            if (mainBtn) {
                const etaContainer = document.getElementById('eta_container');
                if (!anyAvailable) {
                    mainBtn.style.display = 'none';
                    if (etaContainer) etaContainer.style.display = 'none';
                } else {
                    mainBtn.style.display = 'flex';
                    mainBtn.style.opacity = '0.4';
                    mainBtn.style.pointerEvents = 'none';
                    mainBtn.title = 'Complete restocking escalation first or use the partial dispatch button.';
                    if (etaContainer) etaContainer.style.display = 'block';
                }
            }
        } else {
            html += `
                <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border-radius: 12px; border: 1px solid #BBF7D0; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--emerald); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div>
                        <div style="font-size: 13px; font-weight: 700; color: #166534;">Logistics Validated</div>
                        <div style="font-size: 11px; color: #15803d;">All requested assets are available for immediate dispatch.</div>
                    </div>
                </div>
            `;
            if (mainBtn) {
                mainBtn.style.display = 'flex';
                mainBtn.style.opacity = '1';
                mainBtn.style.pointerEvents = 'auto';
                const etaContainer = document.getElementById('eta_container');
                if (etaContainer) etaContainer.style.display = 'block';
            }
        }

        container.innerHTML = html;
        return { allAvailable, shortfalls };
    },

    async handlePartialDispatchProcess() {
        // This will be called when user clicks the "Dispatch Available" button in the summary
        const btn = document.getElementById('btn_authorize_dispatch') || document.getElementById('btn_execute_dispatch');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Authorizing Partial Dispatch...';
            btn.style.background = 'var(--orange)';
            btn.onclick = () => this.executePartialDispatch();
            window.toast.show('Partial dispatch mode active. Click the orange button to confirm escalation.', 'warning');
        }
    },

    async executePartialDispatch() {
        const ctx = this._currentDispatchContext;
        if (!ctx) return;

        try {
            window.toast.show('Escalating Shortage to Finance...', 'info');

            // 1. Send Escalation Email to Finance Director (FD) and Financial Manager (FM)
            // We use the email service directly for external escalation
            const emailService = await import('../../../src/emails/email.service.js');
            const notificationService = await import('../../../src/services/notification.service.js');
            
            const anyAvailable = ctx.shortfalls.some(s => s.available > 0);
            const shortageList = ctx.shortfalls.map(s => `- ${s.name}: Requested ${s.requested}, only ${s.available} in stock (Shortfall: ${s.deficit})`).join('\n');
            const target = ctx.project || 'Project Site';

            const escalationBody = `🛑 URGENT: Inventory Shortage & Restock Request - ${target}\n\n` +
                                  `Equipment Coordinator is reporting a critical material shortage for ${target}.\n\n` +
                                  `Shortfall Details:\n${shortageList}\n\n` +
                                  `Action Taken: ${anyAvailable ? 'Dispatched available quantities' : 'Dispatch blocked'} and escalated to Finance.\n` +
                                  `Escalation: Restocking is required immediately by the Financial Manager (FM) or Finance Director.\n\n` +
                                  `Note: If budget limits are reached, PM approval for contingency funds may be required.`;

            // Notify Finance (FD/FM)
            await emailService.send({
                to: 'Finance Director; Financial Manager; pm@mkakaconstruction.com',
                subject: `🛑 URGENT: Restock Required for ${target}`,
                text: escalationBody
            });

            // Notify Site Supervisor (FS)
            const fsMessage = anyAvailable 
                ? `The Yard is currently low on stock. We have dispatched what is available (${ctx.shortfalls.map(s => `${s.available} ${s.name}`).join(', ')}) but since the full quantity isn't there, it may take a bit longer to complete your request as we have escalated a restocking order to the Financial Manager (FM).`
                : `The Yard is currently out of stock for the requested materials. We have escalated an urgent restocking request to the Financial Manager (FM). Please note that this will take a bit longer than usual while we wait for procurement.`;

            await emailService.send({
                to: ctx.supervisor || 'Field Supervisor',
                subject: `🚚 Dispatch Notice: ${target} (Restock Required)`,
                text: `Notice regarding your resource request for ${target}.\n\n` +
                      `${fsMessage}\n\n` +
                      `ETA (Partial): ${ctx.eta || 'N/A'}`
            });

            // 2. Also create in-app notifications for visibility
            try {
                await notificationService.notifyRole('Finance_Director', {
                    type: 'danger',
                    icon: 'fa-exclamation-triangle',
                    title: 'Stock Shortage Escalation',
                    message: `Critical shortage of ${ctx.shortfalls[0]?.name} for ${target}. Partial dispatch authorized.`,
                    link: '/dashboard.html?view=procurement'
                });

                await notificationService.notifyRole('Project_Manager', {
                    type: 'warning',
                    icon: 'fa-box-open',
                    title: 'Site Supply Warning',
                    message: `Material shortage reported for project ${target}. Escalated to FM for restocking.`,
                    link: '/dashboard.html?view=projects'
                });
            } catch (notifErr) {
                console.warn('[EC] In-app notification failed, but email sent.', notifErr);
            }

            // 3. Execute the actual dispatch for the available quantities
            if (ctx.type === 'requisition') {
                await client.post('/dispatch', { 
                    requisitionId: ctx.reqId, 
                    estimatedArrival: ctx.eta,
                    partial: true,
                    dispatchedItems: ctx.shortfalls.map(s => ({ name: s.name, qty: s.available }))
                });
            } else {
                // Strategic moves
                for (const item of ctx.items) {
                    const shortfall = ctx.shortfalls.find(s => s.name === item.name);
                    const dispatchQty = shortfall ? shortfall.available : item.quantity;
                    if (dispatchQty <= 0) continue;

                    await inventoryApi.distribute({
                        sectorId: 1, 
                        materialName: item.name,
                        category: 'Construction',
                        unit: item.unit,
                        quantity: dispatchQty,
                        reference: `Partial Bulk Dispatch: ${ctx.project}`,
                        notes: `Escalated to Finance due to shortage.`
                    });
                }
            }

            window.toast.show('Partial dispatch authorized and escalated to Finance/PM.', 'success');
            window.drawer.close();
            if (this._loadRequisitions) await this._loadRequisitions();
        } catch (error) {
            console.error('Partial dispatch failed:', error);
            window.toast.show('Failed to complete partial dispatch.', 'error');
        } finally {
            this._currentDispatchContext = null;
        }
    },

    async reorderMaterial(materialName) {
        if (!confirm(`Generate one-click replenishment request for ${materialName}?`)) return;

        window.toast.show(`Requesting ${materialName} replenishment…`, 'info');

        try {
            // Find a project to link this to (defaulting to project 1 if none found)
            const projectsRes = await client.get('/projects');
            const projects = Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []);
            const targetProject = projects[0]?.id || 1; 

            await client.post('/assets-scheduler/replenishment', {
                projectId: targetProject,
                materialName: materialName,
                quantityNeeded: 500, 
                notes: 'Automated low-stock replenishment from EC Dashboard.'
            });

            window.toast.show(`${materialName} replenishment requested from Finance.`, 'success');
            await this._loadInventory();
        } catch (error) {
            console.error('[EC] Reorder failed:', error);
            window.toast.show('Reorder failed: ' + (error.message || 'Server error'), 'error');
        }
    },

    async reorderAllCritical() {
        const criticalItems = Object.entries(this.inventory)
            .filter(([_, data]) => data.qty <= data.thresh)
            .map(([name]) => name);

        if (criticalItems.length === 0) return;
        if (!confirm(`Generate replenishment requests for ALL ${criticalItems.length} critical materials?`)) return;

        window.toast.show('Processing batch reorder…', 'info');

        try {
            const projectsRes = await client.get('/projects');
            const projects = Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []);
            const targetProject = projects[0]?.id || 1;

            for (const item of criticalItems) {
                await client.post('/assets-scheduler/replenishment', {
                    projectId: targetProject,
                    materialName: item,
                    quantityNeeded: 500,
                    notes: 'Automated batch replenishment (Critical Stock).'
                });
            }

            window.toast.show('Batch replenishment requests submitted.', 'success');
            await this._loadInventory();
        } catch (error) {
            console.error('[EC] Batch reorder failed:', error);
            window.toast.show('Batch reorder failed.', 'error');
        }
    }
};
