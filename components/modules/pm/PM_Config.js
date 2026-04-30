import client from '../../../src/api/client.js';

export const PM_Config = {
    getConfigView() {
        setTimeout(() => this.loadMaterialPrices(), 0);

        return `
            <div class="data-card" style="margin-top: 0;">
                <div class="data-card-header">
                    <div>
                        <h3 style="font-size: 18px; font-weight: 800; color: var(--slate-900); margin-bottom: 4px;">Material Price Configuration</h3>
                        <p style="font-size: 13px; color: var(--slate-500);">Set baseline unit prices for materials to be used in procurement calculations.</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.app.pmModule.openAddPriceDrawer()">
                        <i class="fas fa-plus" style="margin-right: 8px;"></i> Add Material
                    </button>
                </div>
                <div id="price-config-container">
                    <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                        <div>Loading configuration...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadMaterialPrices() {
        const container = document.getElementById('price-config-container');
        if (!container) return;

        try {
            const response = await client.get('/pm/material-prices');
            const configs = Array.isArray(response) ? response : (response.data || []);
            
            if (!configs || configs.length === 0) {
                container.innerHTML = `
                    <div style="padding: 60px; text-align: center; background: var(--slate-50); border-radius: 12px; margin: 20px;">
                        <div style="width: 64px; height: 64px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: var(--shadow-sm);">
                            <i class="fas fa-tags" style="font-size: 24px; color: var(--slate-300);"></i>
                        </div>
                        <h4 style="font-weight: 700; color: var(--slate-700); margin-bottom: 8px;">No Material Prices Set</h4>
                        <p style="font-size: 13px; color: var(--slate-500); max-width: 300px; margin: 0 auto 20px;">Baseline prices help the Finance team auto-calculate contract values accurately.</p>
                        <button class="btn btn-primary" onclick="window.app.pmModule.openAddPriceDrawer()">Define First Price</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Material Name</th>
                            <th>Unit</th>
                            <th>Baseline Price (MWK)</th>
                            <th>Last Updated</th>
                            <th style="width: 80px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${configs.map(c => `
                            <tr>
                                <td style="font-weight: 700; color: var(--slate-800);">${c.materialName}</td>
                                <td><span style="font-size: 11px; background: var(--slate-100); padding: 2px 8px; border-radius: 4px; font-weight: 600;">${c.unit}</span></td>
                                <td style="font-family: 'JetBrains Mono'; font-weight: 700; color: var(--slate-900);">MWK ${Number(c.basePrice).toLocaleString()}</td>
                                <td style="font-size: 12px; color: var(--slate-500);">${new Date(c.updatedAt).toLocaleDateString()}</td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn-icon" title="Edit" onclick="window.app.pmModule.openEditPriceDrawer('${c.id}')"><i class="fas fa-edit"></i></button>
                                        <button class="btn-icon" title="Delete" style="color: var(--red);" onclick="window.app.pmModule.deleteMaterialPrice('${c.id}')"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            console.error(err);
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Error loading material prices.</div>';
        }
    },

    async openAddPriceDrawer() {
        window.drawer.open('Add Material Price', window.DrawerTemplates.materialPriceForm());
    },

    async openEditPriceDrawer(id) {
        try {
            const response = await client.get('/pm/material-prices');
            const configs = Array.isArray(response) ? response : (response.data || []);
            const config = configs.find(c => c.id == id);
            if (config) {
                window.drawer.open('Edit Material Price', window.DrawerTemplates.materialPriceForm(config));
            }
        } catch (e) {
            console.error('Failed to load price config:', e);
        }
    },

    async handlePriceConfigSubmit(id) {
        const materialName = document.getElementById('price-material-name').value;
        const basePrice = parseFloat(document.getElementById('price-base-amount').value);
        const unit = document.getElementById('price-unit').value;

        if (!materialName || isNaN(basePrice)) {
            window.toast.show('Please fill in all required fields.', 'error');
            return;
        }

        try {
            await client.post('/pm/material-prices', { materialName, basePrice, unit });
            window.toast.show('Price configuration saved successfully.', 'success');
            window.drawer.close();
            this.loadMaterialPrices();
        } catch (e) {
            console.error('Save failed:', e);
            window.toast.show('Failed to save configuration.', 'error');
        }
    },

    async deleteMaterialPrice(id) {
        if (!confirm('Are you sure you want to delete this price configuration?')) return;

        try {
            await client.delete(`/pm/material-prices/${id}`);
            window.toast.show('Configuration deleted.', 'success');
            this.loadMaterialPrices();
        } catch (e) {
            console.error('Delete failed:', e);
            window.toast.show('Failed to delete configuration.', 'error');
        }
    },

    openVariationOrderDrawer(contractId) {
        window.drawer.open('Raise Variation Order', window.DrawerTemplates.variationOrderForm(contractId));
    },

    async handleVOSubmit(contractId) {
        const reason = document.getElementById('vo-reason').value;
        const amount = parseFloat(document.getElementById('vo-amount').value || 0);
        const type = document.getElementById('vo-type').value;

        if (!reason) {
            window.toast.show('Please provide a reason for the variation.', 'warning');
            return;
        }

        try {
            window.toast.show('Submitting Variation Order...', 'info');
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch(`/api/v1/pm/variation-orders`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    contractId,
                    reason,
                    amount,
                    type,
                    voCode: 'VO-' + Math.random().toString(36).substr(2, 6).toUpperCase()
                })
            });

            if (!res.ok) throw new Error('Failed to submit VO');

            window.toast.show('Variation Order submitted successfully', 'success');
            window.drawer.close();
            
            // Refresh contract view if open
            if (window.app.fmModule?.viewContract) {
                window.app.fmModule.viewContract(contractId);
            }
        } catch (err) {
            window.toast.show(err.message, 'error');
        }
    }
};
