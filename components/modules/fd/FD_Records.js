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
                    <button class="btn btn-primary" onclick="window.app.fmModule?.openVendorDrawer()"><i class="fas fa-plus"></i> Add Vendor</button>
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
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/vendors?limit=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch vendors');
            const result = await response.json();
            const vendors = result.data?.vendors || result.vendors || result || [];

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
                                    <td>${v.category || 'General'}</td>
                                    <td>
                                        <span class="status ${risk.class}" style="background: ${risk.bg}; color: ${risk.color};">
                                            ${risk.label}
                                        </span>
                                    </td>
                                    <td style="text-align: center; font-weight: 700;">${v._count?.contracts || v.activeContracts || 0}</td>
                                    <td style="color: #FBBF24;">${this._renderStars(v.rating || 5.0)}</td>
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
        const r = parseFloat(rating) || 0;
        const full = Math.floor(r);
        const half = r % 1 >= 0.5;
        let html = '';
        for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
        if (half) html += '<i class="fas fa-star-half-alt"></i>';
        const empty = Math.max(0, 5 - full - (half ? 1 : 0));
        for (let i = 0; i < empty; i++) html += '<i class="far fa-star"></i>';
        return html;
    },

    openVendorDrawer() {
        window.drawer.open('Onboard New Vendor', window.DrawerTemplates.newVendor);
    },

    async submitVendor() {
        try {
            const data = {
                name: document.getElementById('vendor_name').value,
                category: document.getElementById('vendor_category').value,
                riskLevel: document.getElementById('vendor_risk').value,
                rating: parseFloat(document.getElementById('vendor_rating').value)
            };

            window.toast.show('Onboarding vendor...', 'info');
            const token = localStorage.getItem('mcms_auth_token');
            const res = await fetch('/api/v1/vendors', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Onboarding failed');
            }

            window.toast.show('Vendor registered successfully', 'success');
            window.drawer.close();
            this.loadVendorsData();
        } catch (err) {
            window.toast.show(err.message, 'error');
        }
    }
};
