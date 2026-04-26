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

        const materials = this.phaseMaterials[phaseId];
        if (!materials) {
            container.innerHTML = '<div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--slate-400);">No materials listed for this phase.</div>';
            return;
        }

        container.innerHTML = materials.map((mat, i) => `
            <div style="background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">${mat.name}</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="number" id="qty_${i}" class="form-input" style="flex: 1; padding: 6px;" placeholder="Qty">
                    <span style="font-size: 11px;">${mat.unit}</span>
                </div>
            </div>
        `).join('');
    },

    async handleExecuteDispatch() {
        const project = document.getElementById('assign_project')?.value;
        const phase = document.getElementById('assign_phase')?.value;
        const supervisor = document.getElementById('assign_fs')?.value;
        const isMachinery = document.getElementById('btn_machinery')?.classList.contains('active');

        window.toast.show('Executing logistics dispatch…', 'info');

        if (!isMachinery) {
            // --- PROJECT SILO ENFORCEMENT ---
            const projectStock = this.inventoryByProject?.[project] || [];
            const phaseMats = this.phaseMaterials[phase] || [];
            
            for (const [i, mat] of phaseMats.entries()) {
                const qty = Number(document.getElementById(`qty_${i}`)?.value);
                if (qty <= 0) continue;

                const stockItem = projectStock.find(m => m.materialName === mat.name);
                const available = stockItem ? Number(stockItem.quantityOnHand) : 0;

                if (available < qty) {
                    window.toast.show(`SKIPPING ${mat.name}: Project only has ${available} ${mat.unit}. Refusing cross-project transfer.`, 'warning');
                    continue;
                }

                try {
                    await inventoryApi.distribute({
                        sectorId: stockItem ? stockItem.sectorId : 1, 
                        materialName: mat.name,
                        category: 'Construction',
                        unit: mat.unit,
                        quantity: qty,
                        reference: `Bulk Site Dispatch: ${project}`,
                        notes: `Dispatched to ${supervisor}`
                    });
                } catch (err) {
                    console.error(`[EC] Failed to distribute ${mat.name}:`, err);
                }
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
        const qty = Number(document.getElementById('receive_qty')?.value);
        if (!qty) return;

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

        // Build allocation list from inventoryByProject
        const allocations = [];
        Object.entries(this.inventoryByProject || {}).forEach(([projectId, items]) => {
            const item = items.find(i => i.materialName === materialName);
            if (item && item.quantityOnHand > 0) {
                const project = (this.activeProjects || []).find(p => p.id == projectId);
                allocations.push({
                    projectName: project ? project.name : `Project ${projectId}`,
                    sectorName: item.sectorName,
                    qty: Number(item.quantityOnHand)
                });
            }
        });

        window.drawer.open('Material Inventory Breakdown', window.DrawerTemplates.inventoryDetails({
            materialName,
            totalQty: data.qty,
            unit: data.unit,
            allocations
        }));
    },

    async openAssetHistory(assetId) {
        window.toast.show('Retrieving chain of custody log…', 'info');
        try {
            const asset = await assetsApi.getById(assetId);
            window.drawer.open('Asset History & Fault Log', window.DrawerTemplates.assetHistory(asset));
        } catch (error) {
            console.error('[EC] Failed to load asset history:', error);
            window.toast.show('Failed to load history: ' + (error.message || 'Server error'), 'error');
        }
    }
};
