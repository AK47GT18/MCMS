import client from '../../../src/api/client.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const CA_Milestones = {
    getMilestonesView() {
        const milestones = this.data.milestones;
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Deliverables & Payment Milestones</div>
                    <button class="btn btn-secondary"><i class="fas fa-calendar-alt"></i> View Timeline</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Due Date</th>
                            <th>Ref Code</th>
                            <th>Project</th>
                            <th>Milestone</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Certify</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${milestones.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:20px;">No milestones found</td></tr>' : 
                          milestones.map(m => `
                          <tr>
                              <td style="font-weight:700; color:${new Date(m.dueDate) < new Date() ? 'var(--red)' : 'var(--orange)'};">${new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td class="project-id">${m.refCode || 'N/A'}</td>
                              <td>${m.projectName}</td>
                              <td>${m.description}</td>
                              <td class="mono-val">${parseFloat(m.value || 0).toLocaleString()} MWK</td>
                              <td><span class="status ${m.status.toLowerCase()}">${m.status}</span></td>
                              <td>
                                ${m.status === 'verified' || m.status === 'paid' ? 
                                    `<button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.app.caModule.openMilestoneCertificate(${m.id})">View Cert</button>` :
                                    `<button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="window.app.caModule.openCertifyDrawer(${m.id})">Verify</button>`
                                }
                              </td>
                          </tr>
                          `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    openMilestoneDetails(id) {
        const milestone = this.data.milestones.find(m => m.id === id);
        if (milestone) {
            window.drawer.open('Milestone Details', window.DrawerTemplates.milestoneDetails(milestone));
        }
    },

    openCertifyDrawer(id) {
        const milestone = this.data.milestones.find(m => m.id === id);
        if (milestone) {
            window.drawer.open('Certify Milestone', window.DrawerTemplates.certifyMilestone(milestone));
        }
    },

    openMilestoneCertificate(id) {
        const milestone = this.data.milestones.find(m => m.id === id);
        if (milestone) {
            window.drawer.open('Milestone Certificate', window.DrawerTemplates.milestoneCertificate(milestone));
        }
    }
};
