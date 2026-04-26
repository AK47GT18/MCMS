import client from '../../../src/api/client.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const CA_Reports = {
    getReportsView() {
         return `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                         <div class="card-title">Contract Analytics</div>
                    </div>
                     <div style="padding:24px; text-align:center; color:var(--slate-500);">
                        <i class="fas fa-chart-pie" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i>
                        <p>Contract Value Distribution</p>
                    </div>
                </div>
                <div class="data-card">
                    <div class="data-card-header">
                         <div class="card-title">Available Reports</div>
                    </div>
                    <ul style="list-style:none; padding:0; margin:0;">
                        <li style="padding:16px; border-bottom:1px solid var(--slate-100); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600; font-size:14px;">Contract Expiry Schedule</div>
                                <div style="font-size:12px; color:var(--slate-500);">PDF • Generated Weekly</div>
                            </div>
                            <button class="btn btn-secondary">Download</button>
                        </li>
                         <li style="padding:16px; border-bottom:1px solid var(--slate-100); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600; font-size:14px;">Compliance Audit Log</div>
                                <div style="font-size:12px; color:var(--slate-500);">Excel • Live Data</div>
                            </div>
                            <button class="btn btn-secondary">Download</button>
                        </li>
                         <li style="padding:16px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:600; font-size:14px;">Contractor Performance Review</div>
                                <div style="font-size:12px; color:var(--slate-500);">PDF • Q3 2025</div>
                            </div>
                            <button class="btn btn-secondary">Download</button>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }
};
