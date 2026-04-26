import client from '../../../src/api/client.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const CA_Compliance = {
    getComplianceView() {
        const policies = this.data.policies;
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Insurance & Bonds Tracking</div>
                    <button class="btn btn-primary" onclick="window.app.caModule.openPolicyDrawer()"><i class="fas fa-plus"></i> Log New Policy</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Entity/Contractor</th>
                            <th>Document Type</th>
                            <th>Policy Number</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${policies.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">No policies tracked yet</td></tr>' : 
                          policies.map(p => {
                            const expiry = new Date(p.expiryDate);
                            const today = new Date();
                            const isExpiring = expiry > today && expiry < new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
                            const isExpired = expiry <= today;
                            
                            return `
                              <tr>
                                  <td style="font-weight:600;">${p.entityName}</td>
                                  <td>${p.documentType}</td>
                                  <td>${p.policyNumber}</td>
                                  <td class="mono-val" style="color:${isExpired ? 'var(--red)' : isExpiring ? 'var(--orange)' : 'var(--slate-600)'};">${expiry.toLocaleDateString()}</td>
                                  <td>
                                    <span class="status ${p.status.toLowerCase()}" style="${isExpired ? 'background: #FEE2E2; color: #991B1B;' : isExpiring ? 'background: #FEF3C7; color: #92400E;' : ''}">
                                        ${isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : p.status}
                                    </span>
                                  </td>
                                  <td><button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.app.caModule.openPolicyDetails(${p.id})">Details</button></td>
                              </tr>
                            `;
                          }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    openPolicyDrawer() {
        window.drawer.open('Log New Policy', window.DrawerTemplates.policyForm());
    },

    openPolicyDetails(id) {
        const policy = this.data.policies.find(p => p.id === id);
        if (policy) {
            window.drawer.open('Policy Details', window.DrawerTemplates.policyDetails(policy));
        }
    }
};
