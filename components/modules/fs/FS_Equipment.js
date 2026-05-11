import client from '../../../src/api/client.js';
import tasksApi from '../../../src/api/tasks.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import assets from '../../../src/api/assets.api.js';

export const FS_Equipment = {
    getEquipmentView() {
        setTimeout(() => this._loadSiteAssets(), 0);

        return `
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">On-Site Equipment</div>
                <button class="btn btn-primary" onclick="window.app.fsModule.openResourceRequestDrawer()"><i class="fas fa-plus"></i> Request</button>
              </div>
              ${!this.assetsLoaded
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Syncing site fleet status…</div></div>'
                : (this.siteAssets.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-loading" style="font-size:24px; margin-bottom:12px; display:block;"></i>No equipment assigned to this workstation.</div>'
                    : `<table>
                    <thead><tr><th>Asset</th><th>ID</th><th>Category</th><th>Last Maint.</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${this.siteAssets.map(asset => {
                            const lastMaint = asset.lastMaintenanceAt ? new Date(asset.lastMaintenanceAt) : null;
                            let maintStr = '--';
                            if (lastMaint) {
                                const diffDays = Math.floor((new Date() - lastMaint) / (1000 * 60 * 60 * 24));
                                maintStr = diffDays > 30 ? `<span style="color:var(--red); font-weight:700;">${diffDays} days ago</span>` : `${diffDays} days ago`;
                            }
                            const daysRemaining = asset.isRental ? Math.ceil((new Date(asset.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                            
                            return `
                            <tr>
                                <td style="font-weight: 700;">
                                    ${asset.name}
                                    ${asset.isRental ? `
                                        <div style="font-size: 10px; color: ${daysRemaining < 3 ? 'var(--red)' : 'var(--emerald)'}; font-weight: 600;">
                                            <i class="fas fa-clock"></i> ${daysRemaining} days left
                                        </div>
                                    ` : ''}
                                </td>
                                <td><span class="project-id">${asset.assetCode || asset.id}</span></td>
                                <td>${asset.category || '--'}</td>
                                <td>${maintStr}</td>
                                <td><span class="status ${asset.status === 'checked_out' ? 'active' : 'pending'}">${(asset.status || '').replace(/_/g, ' ')}</span></td>
                                <td>
                                    <div style="display:flex; gap:4px;">
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="window.app.fsModule?.openAssetIncidentDrawer('${asset.id}')"><i class="fas fa-exclamation-triangle" style="color:var(--red);"></i> Incident</button>
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="window.app.fsModule?.openReturnEquipmentDrawer('${asset.id}', '${asset.name.replace(/'/g, "\\'")}', '${asset.assetCode || ''}')"><i class="fas fa-undo"></i> Return</button>
                                    </div>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>`
                )
            }
            </div>
        `;
    },

    async _loadSiteAssets() {
        if (this._fetchingAssets) return;
        this._fetchingAssets = true;

        try {
            const projectId = this.assignedProject?.id || 1;
            const [assetsRes, rentalsRes] = await Promise.all([
                assets.getAll({ status: 'checked_out', projectId }),
                client.get(`/vehicle-rentals?projectId=${projectId}&status=on_site`).catch(() => ({ data: [] }))
            ]);

            const physicalData = assetsRes.data || assetsRes;
            const physicalAssets = Array.isArray(physicalData) ? physicalData : (physicalData.items || []);
            
            const rentalData = rentalsRes.data || rentalsRes;
            const rentals = Array.isArray(rentalData) ? rentalData : (rentalData.contracts || []);

            const normalizedRentals = rentals.map(r => ({
                id: r.id,
                name: r.machineType,
                assetCode: r.refCode,
                category: 'Rental Fleet',
                status: 'checked_out',
                isRental: true,
                endDate: r.endDate,
                startDate: r.startDate,
                lastMaintenanceAt: null // Rentals handled by vendor
            }));

            // Merge all assets, then enrich with day-tracking for ANY asset with an endDate
            const allAssets = [...physicalAssets, ...normalizedRentals];

            allAssets.forEach(asset => {
                if (asset.endDate) {
                    const end = new Date(asset.endDate);
                    const now = new Date();
                    asset.daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                    asset.isExpired = asset.daysRemaining <= 0;
                } else {
                    asset.daysRemaining = null;
                    asset.isExpired = false;
                }
            });

            this.siteAssets = allAssets;
            
            this.assetsLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            this.assetsLoaded = true;
            console.error('[FS] Failed to load site assets:', error);
        } finally {
            this._fetchingAssets = false;
        }
    },

    async openAssetIncidentDrawer(assetId, isInventory = false) {
        try {
            // Find asset from local cache first (FS_Logistics merges these into its own view, but FS_Equipment uses siteAssets)
            // Wait, FS_Logistics and FS_Equipment are separate.
            // In FS_Logistics, combinedAssets is local to _renderEquipmentTable.
            
            let asset;
            if (isInventory) {
                // If it's from the Logistics tab, we need to find it from the siteInventory
                // Actually, let's just use the ID to find it in the current module's context if possible
                // But this method is in FS_Equipment.
                
                // Let's make it robust:
                asset = (window.app.fsModule.siteAssets || []).find(a => String(a.id) === String(assetId));
            } else {
                asset = (this.siteAssets || []).find(a => String(a.id) === String(assetId));
            }
            
            // If not in cache, fetch from API (only for physical assets)
            if (!asset && !isInventory) {
                const res = await assets.getById(assetId);
                asset = res.data || res;
            }

            if (!asset) {
                window.toast?.show('Asset details not found locally.', 'warning');
                return;
            }

            window.drawer.open(
                'Report Asset Incident',
                window.DrawerTemplates.assetIncidentReport(asset)
            );

            // Store reference for the preview calculator
            this._currentIncidentAsset = asset;
        } catch (error) {
            console.error('[FS] Failed to open incident drawer:', error);
            window.toast?.show('Failed to load asset details', 'error');
        }
    },

    _updateIncidentPreview() {
        const asset = this._currentIncidentAsset;
        if (!asset) return;

        const type = document.getElementById('incident_type')?.value;
        const qtySent = Number(document.getElementById('incident_qty_sent')?.value || 1);
        const qtyReceived = Number(document.getElementById('incident_qty_received')?.value || 0);
        const estimatedValue = Number(asset.estimatedValue || 0);

        let lossRatio = 0;
        let lossDesc = '';

        switch (type) {
            case 'damage':
                lossRatio = qtySent > 0 ? Math.max(0, (qtySent - qtyReceived) / qtySent) : 0;
                lossDesc = `${qtySent - qtyReceived} out of ${qtySent} damaged`;
                break;
            case 'theft':
                lossRatio = 1.0;
                lossDesc = 'Total loss — reported as stolen';
                break;
            case 'accident':
                lossRatio = qtySent > 0 ? Math.max(0, (qtySent - qtyReceived) / qtySent) : 0.5;
                lossDesc = `${qtyReceived} of ${qtySent} salvageable`;
                break;
            case 'non_arrival':
                lossRatio = 1.0;
                lossDesc = 'Never arrived — full provisional loss';
                break;
            default:
                lossDesc = 'Select an incident type';
        }

        const hit = Math.round(estimatedValue * lossRatio);
        const lossPercent = Math.round(lossRatio * 100);

        const hitEl = document.getElementById('incident_hit_amount');
        const descEl = document.getElementById('incident_hit_desc');
        const badgeEl = document.getElementById('incident_loss_badge');

        if (hitEl) hitEl.textContent = `MWK ${hit.toLocaleString()}`;
        if (descEl) descEl.textContent = lossDesc;
        if (badgeEl) {
            badgeEl.textContent = `${lossPercent}% Loss`;
            badgeEl.style.background = lossPercent > 50 ? '#FEE2E2' : '#FEF3C7';
            badgeEl.style.color = lossPercent > 50 ? '#DC2626' : '#92400E';
        }
    },

    async submitAssetIncident(assetId) {
        const type = document.getElementById('incident_type')?.value;
        const qtySent = document.getElementById('incident_qty_sent')?.value;
        const qtyReceived = document.getElementById('incident_qty_received')?.value;
        const description = document.getElementById('incident_description')?.value?.trim();
        const dispatchedBy = document.getElementById('incident_dispatched_by')?.value?.trim();

        if (!type) {
            window.toast?.show('Please select an incident type.', 'warning');
            return;
        }
        if (!description || description.length < 10) {
            window.toast?.show('Please provide a detailed description (min 10 characters).', 'warning');
            return;
        }
        if (!dispatchedBy) {
            window.toast?.show('Please enter the name of who dispatched this asset.', 'warning');
            return;
        }

        if (!confirm(`This will deduct the calculated financial impact from the project budget. Are you sure you want to submit this incident report?`)) {
            return;
        }

        try {
            window.toast?.show('Submitting incident report...', 'info');

            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch(`/api/v1/assets/${assetId}/incident`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    qtySent: Number(qtySent || 1),
                    qtyReceived: Number(qtyReceived || 0),
                    description,
                    dispatchedBy
                })
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result?.error?.message || 'Failed to submit incident');
            }

            const data = result.data || result;

            window.drawer.close();
            window.modal?.showSuccess(
                'Incident Reported',
                `${data.assetName} has been flagged as "${data.incidentType}". Financial impact: MWK ${(data.financialHit || 0).toLocaleString()}.${data.replenishmentReqCode ? ` Replenishment requisition ${data.replenishmentReqCode} has been auto-generated.` : ''}`
            );

            // Refresh assets
            await this._loadSiteAssets();

        } catch (error) {
            console.error('[FS] Incident submission failed:', error);
            window.toast?.show('Failed: ' + (error.message || 'Server error'), 'error');
        }
    },

    async openReturnEquipmentDrawer(assetId, assetName, assetCode) {
        window.drawer.open('Return to Base', `
            <div style="padding: 24px;">
                <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Demobilization Notice</div>
                    <div style="font-size: 18px; font-weight: 800; color: var(--slate-900);">${assetName}</div>
                    <div style="font-size: 12px; color: var(--slate-500);">${assetCode || 'EQP-'+assetId}</div>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="font-weight: 700;">Personnel Sending Back <span style="color: var(--red);">*</span></label>
                    <input type="text" id="return_sent_by" class="form-input" placeholder="Name of supervisor or operator" style="width: 100%;" value="${window.currentUser?.name || ''}">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="font-weight: 700;">Estimated Arrival at Yard <span style="color: var(--red);">*</span></label>
                    <input type="datetime-local" id="return_arrival_time" class="form-input" style="width: 100%;">
                </div>

                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label" style="font-weight: 700;">Equipment Condition Notes</label>
                    <textarea id="return_cond_notes" class="form-input" placeholder="E.g. Clean, partial fuel, minor scratch reported..." style="width: 100%; height: 80px; resize: none;"></textarea>
                </div>

                <button class="btn btn-primary" style="width: 100%; padding: 14px; font-weight: 800; background: var(--slate-900); border-color: var(--slate-900);" 
                    onclick="window.app.fsModule.submitEquipmentReturn('${assetId}', '${assetName.replace(/'/g, "\\'")}')">
                    <i class="fas fa-truck-pickup" style="margin-right: 8px;"></i> Confirm Dispatch to Base
                </button>
            </div>
        `);

        // Default to 4 hours from now
        setTimeout(() => {
            const dt = new Date();
            dt.setHours(dt.getHours() + 4);
            const el = document.getElementById('return_arrival_time');
            if (el) el.value = dt.toISOString().slice(0, 16);
        }, 100);
    },

    async submitEquipmentReturn(assetId, assetName) {
        const sentBy = document.getElementById('return_sent_by').value;
        const arrivalTime = document.getElementById('return_arrival_time').value;
        const notes = document.getElementById('return_cond_notes').value;

        if (!sentBy || !arrivalTime) {
            window.toast.show('Please fill in all required return details.', 'warning');
            return;
        }

        window.toast.show('Processing demobilization...', 'info');

        try {
            await assets.checkIn(assetId, { 
                notes: `[SITE RETURN] Sent by: ${sentBy}. ETA: ${new Date(arrivalTime).toLocaleString()}. Notes: ${notes}` 
            });

            // --- Audit & Notification ---
            try {
                await client.post('/audit-logs', {
                    action: 'ASSET_RETURN_INITIATED',
                    targetType: 'ASSET',
                    targetId: assetId,
                    details: {
                        assetName,
                        sentBy,
                        eta: arrivalTime,
                        notes,
                        projectId: this.assignedProject?.id || 1
                    }
                });

                // Notify EC about incoming return
                await client.post('/notifications', {
                    role: 'Equipment_Controller',
                    type: 'warning',
                    icon: 'fa-undo',
                    title: 'Asset Returning to Base',
                    message: `${assetName} (${assetId}) has been dispatched back to HQ by ${sentBy}. ETA: ${new Date(arrivalTime).toLocaleString()}.`
                });
            } catch (auditErr) {
                console.warn('[FS] Return audit/notif failed:', auditErr);
            }

            window.toast.show(`${assetName} has been marked for return. EC notified.`, 'success');
            window.drawer.close();
            await this._loadSiteAssets();
        } catch (err) {
            console.error('[FS] Return failed:', err);
            window.toast.show('Failed to initiate return: ' + err.message, 'error');
        }
    }
};
