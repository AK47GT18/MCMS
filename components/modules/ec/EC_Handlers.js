import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const EC_Handlers = {
    async handleExecuteDispatch() {
        const project = document.getElementById('assign_project')?.value;
        const phase = document.getElementById('assign_phase')?.value;
        const supervisor = document.getElementById('assign_fs')?.value;
        const isMachinery = document.getElementById('btn_machinery')?.classList.contains('active');

        window.toast.show('Executing logistics dispatch…', 'info');

        if (!isMachinery) {
            // API-backed material distribution
            const phaseMats = this.phaseMaterials[phase] || [];
            for (const [i, mat] of phaseMats.entries()) {
                const qty = Number(document.getElementById(`qty_${i}`)?.value);
                if (qty > 0) {
                    try {
                        await inventoryApi.distribute({
                            sectorId: 1, // TODO: dynamic sector selection
                            materialName: mat.name,
                            category: 'Construction',
                            unit: mat.unit,
                            quantity: qty,
                            reference: 'Site Dispatch',
                            notes: `Dispatched to ${supervisor} at ${project}`
                        });
                    } catch (err) {
                        console.error(`[EC] Failed to distribute ${mat.name}:`, err);
                    }
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
    },

    async handleProcurementReceipt(item) {
        const qty = Number(document.getElementById('receive_qty')?.value);
        if (!qty) return;

        window.toast.show('Updating store silo via API…', 'info');

        try {
            await inventoryApi.distribute({
                sectorId: 1,
                materialName: item.name,
                category: 'Procurement',
                unit: item.unit,
                quantity: qty,
                reference: `Receipt: ${item.id}`,
                notes: `Received from ${item.vendor}`
            });
            
            this.pendingReceipts = this.pendingReceipts.filter(p => p.id !== item.id);

            setTimeout(() => {
                window.drawer.close();
                window.app.loadPage(this.currentView);
                window.toast.show('Physical stock verified and received.', 'success');
            }, 800);
        } catch (error) {
            console.error('[EC] Receipt failed:', error);
            window.toast.show('Failed to update inventory: ' + (error.message || 'Server error'), 'error');
        }
    },

    async handleIntake(requisitionId) {
        try {
            await window.loader.show('Processing GRN and Intaking Inventory...', async () => {
                const reqId = parseInt(requisitionId, 10);
                await window.requisitions.fulfill(reqId, 1); // Default to Sector 1 for yard
            });
            modal.showSuccess('Goods Received', 'Materials have been added to inventory.');
            await this._loadRequisitions();
            await this._loadInventory();
        } catch (error) {
            console.error('[EC] Intake failed', error);
            modal.showError('Intake Failed', error.message || 'Failed to process GRN');
        }
    },

    async handleAssetUpdate(assetId) {}
,

    async handleResolveIssue(assetId, assetName) {
        if (!confirm(`Mark ${assetName} as FIXED and return it to AVAILABLE fleet pool?`)) {
            return;
        }

        try {
            await window.loader.show('Resolving maintenance issue...', async () => {
                await window.assets.resolveIssue(assetId, `Fixed by workshop and returned to fleet.`);
            });
            modal.showSuccess('Asset Repaired', `${assetName} is now available for field deployment.`);
            await this._loadAssets();
        } catch (error) {
            console.error('[EC] Failed to resolve:', error);
            modal.showError('Error', error.message || 'Failed to update asset');
        }
    },

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
    },

    async syncFMProcurement() {
        window.toast.show('Syncing with Finance procurement system…', 'info');
        
        try {
            await this._loadProcurementReceipts();
            window.app.loadPage(this.currentView);
            window.toast.show(`Sync complete: ${this.pendingReceipts.length} pending receipt(s).`, 'success');
        } catch (error) {
            window.toast.show('Sync failed: ' + (error.message || 'Server error'), 'error');
        }
    }
};
