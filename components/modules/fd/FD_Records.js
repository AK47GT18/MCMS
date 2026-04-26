import client from '../../../src/api/client.js';
import { StatCard } from '../ui/StatCard.js';

export const FD_Records = {
    getRecordsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Generated Reports</div>
                </div>
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                    <a href="/api/v1/reports/finance/budget?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-pdf" style="color: var(--red);"></i> Budget Overview (PDF)
                    </a>
                    <a href="/api/v1/reports/finance/requisitions?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-pdf" style="color: var(--red);"></i> Requisition Analysis (PDF)
                    </a>
                    <a href="/api/v1/reports/finance/top-vendors?format=csv" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-excel" style="color: var(--emerald);"></i> Top Vendors (CSV)
                    </a>
                    <a href="/api/v1/reports/finance/spend-categories?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                        <i class="fas fa-file-pdf" style="color: var(--red);"></i> Spend Categories (PDF)
                    </a>
                    <button class="btn btn-primary" style="margin-top: 12px; justify-content: center;" onclick="window.drawer.open('Report Generator', window.DrawerTemplates.reportGenerator)">
                        Custom Report
                    </button>
                </div>
            </div>
        `;
    },

    getVendorsView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Vendor Registry</div>
                    <button class="btn btn-primary" onclick="window.toast.show('Onboarding drawer coming soon', 'info')"><i class="fas fa-plus"></i> Add Vendor</button>
                </div>
                <table>
                   <thead>
                      <tr><th>Vendor Name</th><th>Category</th><th>Risk Level</th><th>Active Contracts</th><th>Rating</th></tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td style="font-weight: 600;">Malawi Cement Ltd</td>
                         <td>Basic Materials</td>
                         <td><span class="status active" style="background:#f0fdf4; color:var(--emerald);">Low</span></td>
                         <td style="text-align: center;">4</td>
                         <td style="color: #FBBF24;"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></td>
                      </tr>
                      <tr>
                         <td style="font-weight: 600;">Steel Masters MW</td>
                         <td>Structural</td>
                         <td><span class="status active" style="background:#f0fdf4; color:var(--emerald);">Low</span></td>
                         <td style="text-align: center;">2</td>
                         <td style="color: #FBBF24;"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i></td>
                      </tr>
                   </tbody>
                </table>
            </div>
        `;
    }
};
