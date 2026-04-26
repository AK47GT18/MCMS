import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';

export const EC_Records = {
    getRecordsView() {
        return `
            <div style="display: grid; gap: 24px;">
                <!-- Header Stats (Mirrors FD Style) -->
                <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
                    ${StatCard({ title: 'Compliance Rate', value: '98%', subtext: 'Silo Integrity', alertColor: 'emerald' })}
                    ${StatCard({ title: 'System Audits', value: '1,240', subtext: 'Log events this month', alertColor: 'blue' })}
                    ${StatCard({ title: 'Report Latency', value: '< 2s', subtext: 'Real-time generation', alertColor: 'emerald' })}
                    ${StatCard({ title: 'Discrepancies', value: '02', subtext: 'Requires resolution', alertColor: 'red' })}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
                    <!-- Report Generation (Mirrors FD Style) -->
                    <div class="data-card">
                        <div class="data-card-header">
                            <div class="card-title">Logistics Report Center</div>
                        </div>
                        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                            <a href="/api/v1/reports/logistics/fleet?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                                <i class="fas fa-file-pdf" style="color: var(--red);"></i> Fleet Utilization (PDF)
                            </a>
                            <a href="/api/v1/reports/logistics/inventory?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                                <i class="fas fa-file-pdf" style="color: var(--red);"></i> Material Silo Reconcile (PDF)
                            </a>
                            <a href="/api/v1/reports/logistics/custody?format=csv" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                                <i class="fas fa-file-excel" style="color: var(--emerald);"></i> Chain of Custody (CSV)
                            </a>
                            <a href="/api/v1/reports/logistics/burn?format=pdf" target="_blank" class="btn btn-secondary" style="width: 100%; text-align: left; justify-content: flex-start; gap: 12px; text-decoration: none;">
                                <i class="fas fa-file-pdf" style="color: var(--red);"></i> Material Burn Analysis (PDF)
                            </a>
                            <button class="btn btn-primary" style="margin-top: 12px; justify-content: center;" onclick="window.drawer.open('Report Generator', window.DrawerTemplates.reportGenerator)">
                                <i class="fas fa-wand-magic-sparkles"></i> Custom Report Builder
                            </button>
                        </div>
                    </div>

                    <!-- Discrepancy & Verification (Analysis Style like FD Vendor Registry) -->
                    <div class="data-card">
                        <div class="data-card-header">
                            <div class="card-title">Fleet Integrity Scan</div>
                            <span class="status active" style="font-size: 11px;">System Verified: Today, 18:00</span>
                        </div>
                        <div style="padding: 0 20px 20px;">
                            <table class="premium-table">
                                <thead>
                                    <tr><th>Site / Asset</th><th>Category</th><th>Drift Status</th><th>Last Verified</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>MZ-05 Mzimba</strong></td>
                                        <td>Fuel / Bulk</td>
                                        <td><span class="status active" style="border:none; background: #f0fdf4; color: #15803d;">0.2% Variance (OK)</span></td>
                                        <td style="font-size: 12px; color: var(--slate-500);">2 hours ago</td>
                                    </tr>
                                    <tr>
                                        <td><strong>CEN-01 Unilia</strong></td>
                                        <td>Cement / Pallet</td>
                                        <td><span class="status locked" style="border:none; background: #fef2f2; color: #b91c1c;">15 Bag Shortage</span></td>
                                        <td style="font-size: 12px; color: var(--slate-500);">1 hour ago</td>
                                    </tr>
                                    <tr>
                                        <td><strong>EQP-742 (Grader)</strong></td>
                                        <td>Maintenance</td>
                                        <td><span class="status active" style="border:none; background: #f0fdf4; color: #15803d;">Hours Match (OK)</span></td>
                                        <td style="font-size: 12px; color: var(--slate-500);">Just now</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
