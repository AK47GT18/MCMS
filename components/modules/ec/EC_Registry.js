export const EC_Registry = {
    getRegistryView() {
        return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header">
                    <div class="card-title">Master Asset Registry (Owned Fleet)</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Asset Procurement', window.DrawerTemplates.requestNewAsset)">
                        <i class="fas fa-plus-circle"></i> Request New Asset
                    </button>
                </div>
                ${this.isLoadingAssets && this.assetRegistry.length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading asset registry…</div></div>'
                    : this.assetRegistry.length === 0
                        ? '<div style="padding: 60px; text-align: center; color: var(--slate-400); background: #f8fafc; border-radius: 12px; border: 1px dashed var(--slate-200); margin: 20px;"><i class="fas fa-box-open" style="font-size:32px; margin-bottom:12px; opacity:0.5;"></i><div style="font-weight: 700; color: var(--slate-600);">No Assets Found</div><div style="font-size:12px;">The asset registry is currently empty.</div></div>'
                        : `<table>
                        <thead>
                            <tr><th>Asset ID</th><th>Name</th><th>Category</th><th>Hours/Km</th><th>Status</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            ${this.assetRegistry.map(asset => `
                                <tr>
                                    <td><span class="project-id">${asset.assetCode || 'EQP-' + asset.id}</span></td>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td>${asset.category || '--'}</td>
                                    <td style="font-family: 'JetBrains Mono';">${asset.hoursOrKm ? asset.hoursOrKm.toLocaleString() + ' Hr' : '--'}</td>
                                    <td><span class="status ${asset.status === 'available' ? 'active' : asset.status === 'checked_out' ? 'pending' : 'locked'}" style="${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">${(asset.status || 'unknown').replace(/_/g, ' ')}</span></td>
                                    <td style="text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                                            <button class="btn btn-secondary" style="font-size: 11px; padding: 6px 12px;" onclick="window.app.ecModule.handleAssetHistory('${asset.id}')">
                                                <i class="fas fa-history"></i> History
                                            </button>
                                            ${asset.status === 'maintenance' ? 
                                              `<button class="btn btn-primary" style="font-size: 11px; padding: 6px 12px;" onclick="window.app.ecModule.handleResolveIssue('${asset.id}', '${asset.name}')"><i class="fas fa-wrench"></i> Mark Fixed</button>`
                                              : ''
                                            }
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>

            <div class="data-card" style="border-top: 4px solid var(--orange);">
                <div class="data-card-header">
                    <div class="card-title" style="color: var(--orange);">External Rental Fleet</div>
                    <div class="badge badge-secondary">${(this.rentalContracts || []).length} Active Contracts</div>
                </div>
                ${!this.rentalsLoaded
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Checking rental contracts…</div></div>'
                    : (this.rentalContracts || []).length === 0
                        ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);">No active rentals currently in the system.</div>'
                        : `<table>
                        <thead>
                            <tr><th>Contract</th><th>Machine</th><th>Provider</th><th>Project</th><th>Expiry</th><th>Status</th><th style="text-align: right;">Lifecycle Action</th></tr>
                        </thead>
                        <tbody>
                            ${this.rentalContracts.map(c => {
                                const isExpired = c.status === 'expired';
                                return `
                                <tr>
                                    <td><span class="project-id">${c.refCode}</span></td>
                                    <td style="font-weight: 700;">${c.machineType}</td>
                                    <td style="font-size: 12px;">${c.vendorName}</td>
                                    <td>${c.project?.name || 'Unassigned'}</td>
                                    <td style="font-size: 12px; color: ${isExpired ? 'var(--red)' : 'var(--slate-600)'};">
                                        ${new Date(c.endDate).toLocaleDateString()}
                                        ${isExpired ? '<div style="font-size:10px; font-weight:800;">OVERDUE</div>' : ''}
                                    </td>
                                    <td><span class="status ${c.status === 'active' ? 'active' : 'locked'}">${(c.status || 'active').toUpperCase()}</span></td>
                                    <td style="text-align: right;">
                                        ${c.status !== 'returned' ? `
                                            <button class="btn btn-primary" style="background: var(--orange); border: none; font-size: 11px; padding: 6px 12px;" 
                                                onclick="window.app.ecModule.handleConfirmReturned('${c.id}', '${c.machineType}')">
                                                <i class="fas fa-truck-pickup"></i> Confirm Returned
                                            </button>
                                        ` : '<span style="font-size: 11px; color: var(--emerald); font-weight:700;"><i class="fas fa-check-circle"></i> Completed</span>'}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `;
    },

    async _loadAssets() {
        if (this.isLoadingAssets) return;
        this.isLoadingAssets = true;
        try {
            // Load both owned assets and rental contracts
            const [assetRes, rentalRes] = await Promise.all([
                assets.getAll(),
                client.get('/vehicle-contracts')
            ]);
            
            const assetData = assetRes.data || assetRes;
            this.assetRegistry = Array.isArray(assetData) ? assetData : (assetData.items || []);
            
            const rentalData = Array.isArray(rentalRes) ? rentalRes : (rentalRes.contracts || []);
            this.rentalContracts = rentalData;
            
            this.rentalsLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load assets/rentals:', error);
            this.rentalsLoaded = true;
        } finally {
            this.isLoadingAssets = false;
        }
    }
};
