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
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Vendor Performance Scorecard</div>
                    <div style="font-size: 11px; color: var(--slate-500);"><i class="fas fa-info-circle"></i> Vendors are auto-registered upon contract creation</div>
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
                        <tr><th>Vendor Details</th><th>Contact Info</th><th>Risk Profile</th><th>Contract Volume</th><th>Aggregate Performance</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${vendors.map(v => {
                            const risk = this._calculateRisk(v);
                            return `
                                <tr>
                                    <td>
                                        <div style="font-weight: 700; color: var(--slate-800);">${v.name}</div>
                                        <div style="font-size: 11px; color: var(--slate-500);">${v.category || 'General'}</div>
                                    </td>
                                    <td style="font-family: 'JetBrains Mono'; font-size: 12px; color: var(--slate-600);">${v.phone || '-'}</td>
                                    <td>
                                        <span class="status ${risk.class}" style="background: ${risk.bg}; color: ${risk.color}; font-weight: 700;">
                                            ${risk.label}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div style="font-weight: 800; font-size: 14px; color: var(--slate-800);">${v._count?.contracts || v.contractCount || 0}</div>
                                        <div style="font-size: 10px; color: var(--slate-500); text-transform: uppercase;">Total Awards</div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="color: var(--orange); font-size: 14px;">${this._renderStars(v.avgRating || 0)}</div>
                                            <div style="font-weight: 700; color: var(--slate-700); font-size: 13px;">${v.avgRating ? v.avgRating.toFixed(1) : 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td style="text-align: right;">
                                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; font-weight: 700;" onclick="window.app.fmModule?.viewVendor(${v.id})">
                                            View Details <i class="fas fa-chevron-right" style="margin-left: 4px;"></i>
                                        </button>
                                    </td>
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
        if (!rating || rating === 0) return '<span style="color: var(--slate-300); font-size: 11px;">No Ratings Yet</span>';
        const r = parseFloat(rating) || 0;
        const full = Math.floor(r);
        const half = r % 1 >= 0.5;
        let html = '';
        for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
        if (half) html += '<i class="fas fa-star-half-alt"></i>';
        const empty = Math.max(0, 5 - full - (half ? 1 : 0));
        for (let i = 0; i < empty; i++) html += '<i class="fas fa-star" style="color: var(--slate-200);"></i>';
        return html;
    },

    async viewVendor(id) {
        try {
            window.toast.show('Loading vendor details...', 'info');
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch(`/api/v1/vendors/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch vendor details');
            const result = await response.json();
            const vendor = result.data || result.vendor || result;
            
            // Add avgRating explicitly if API returns stats
            if (vendor._count && vendor.contracts) {
                const rated = vendor.contracts.filter(c => c.vendorRating > 0);
                if (rated.length > 0) {
                    vendor.avgRating = rated.reduce((sum, c) => sum + c.vendorRating, 0) / rated.length;
                }
            }

            window.drawer.open(`Vendor Details: ${vendor.name}`, window.DrawerTemplates.vendorView(vendor));
        } catch (error) {
            console.error('Vendor details error:', error);
            window.toast.show(error.message || 'Failed to load vendor details', 'error');
        }
    }
};
