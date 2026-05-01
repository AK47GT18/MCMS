import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';

export const FD_Records = {
    getRecordsView() {
        setTimeout(async () => {
            const { PM_Reports } = await import('../pm/PM_Reports.js');
            const container = document.getElementById('fd-reports-root');
            if (container) {
                container.innerHTML = PM_Reports.getReportsView();
                PM_Reports.init();
            }
        }, 0);

        return `<div id="fd-reports-root">
            <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                <p>Initializing Records Center...</p>
            </div>
        </div>`;
    },

    getVendorsView() {
        setTimeout(() => this.loadVendorsData(), 0);
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Vendor Registry & Risk Analysis</div>
                    <button class="btn btn-primary" onclick="window.toast.show('Onboarding drawer coming soon', 'info')"><i class="fas fa-plus"></i> Add Vendor</button>
                </div>
                <div id="fm-vendors-table-container">
                    <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                        <div>Analyzing vendor performance...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadVendorsData() {
        const container = document.getElementById('fm-vendors-table-container');
        if (!container) return;

        try {
            const response = await client.get('/contracts?limit=100');
            const allContracts = response.data?.contracts || response.data || [];
            
            const vendorsMap = new Map();
            allContracts.forEach(c => {
                if (!c.vendorId) return;
                if (!vendorsMap.has(c.vendorId)) {
                    vendorsMap.set(c.vendorId, {
                        id: c.vendorId,
                        name: c.vendor?.name || c.vendorName || `Vendor ${c.vendorId}`,
                        category: c.category || 'Materials',
                        activeContracts: 0,
                        delays: c.deliveryDelays || 0,
                        variance: c.priceVariance || 0,
                        rating: c.vendorRating || 4.5
                    });
                }
                const v = vendorsMap.get(c.vendorId);
                if (c.status === 'Active') v.activeContracts++;
            });

            const vendors = Array.from(vendorsMap.values());

            if (vendors.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);">No vendors found in active contracts.</div>`;
                return;
            }

            container.innerHTML = `
                <table>
                    <thead>
                        <tr><th>Vendor Name</th><th>Category</th><th>Risk Profile</th><th>Active Contracts</th><th>Performance Rating</th></tr>
                    </thead>
                    <tbody>
                        ${vendors.map(v => {
                            const risk = this._calculateRisk(v);
                            return `
                                <tr>
                                    <td style="font-weight: 600;">${v.name}</td>
                                    <td>${v.category}</td>
                                    <td>
                                        <span class="status ${risk.class}" style="background: ${risk.bg}; color: ${risk.color};">
                                            ${risk.label}
                                        </span>
                                        <div style="font-size: 10px; color: var(--slate-500); margin-top: 4px;">
                                            ${v.delays} delays | ${v.variance}% variance
                                        </div>
                                    </td>
                                    <td style="text-align: center; font-weight: 700;">${v.activeContracts}</td>
                                    <td style="color: #FBBF24;">${this._renderStars(v.rating)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Vendors error:', error);
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">${error.message}</div>`;
        }
    },

    _calculateRisk(v) {
        if (v.delays > 3 || v.variance > 15) return { label: 'High Risk', class: 'delayed', bg: '#FEF2F2', color: 'var(--red)' };
        if (v.delays > 1 || v.variance > 5) return { label: 'Medium Risk', class: 'locked', bg: '#FFF7ED', color: 'var(--orange)' };
        return { label: 'Low Risk', class: 'active', bg: '#F0FDF4', color: 'var(--emerald)' };
    },

    _renderStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let html = '';
        for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
        if (half) html += '<i class="fas fa-star-half-alt"></i>';
        const empty = 5 - full - (half ? 1 : 0);
        for (let i = 0; i < empty; i++) html += '<i class="far fa-star"></i>';
        return html;
    }
};
