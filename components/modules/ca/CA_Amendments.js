import client from '../../../src/api/client.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const CA_Amendments = {
    async getAmendmentsView() {
        // Load versions if not loaded
        if (this.data.versions.length === 0 && this.data.contracts.length > 0) {
            try {
                const versionPromises = this.data.contracts.slice(0, 5).map(c => contractVersions.getByContract(c.id));
                const results = await Promise.all(versionPromises);
                this.data.versions = results.flatMap(r => r.data || []);
            } catch (error) {
                console.error('Failed to load versions', error);
            }
        }

        const versions = this.data.versions;
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Amendments & Variations Log</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Upload Amendment', window.DrawerTemplates.uploadAmendment)"><i class="fas fa-plus"></i> New Variation</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>VO Ref</th>
                            <th>Title</th>
                            <th>Change Notes</th>
                            <th>Cost Impact</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${versions.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">No variations logged yet</td></tr>' : 
                          versions.map(v => `
                          <tr>
                              <td>${new Date(v.createdAt).toLocaleDateString()}</td>
                              <td class="project-id">${v.refCode}</td>
                              <td style="font-weight:600;">${v.title}</td>
                              <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${v.changeNotes || ''}</td>
                              <td class="mono-val" style="color:${parseFloat(v.value) > 0 ? 'var(--red)' : 'var(--emerald)'};">${parseFloat(v.value) > 0 ? '+' : ''}${parseFloat(v.value || 0).toLocaleString()}</td>
                              <td><span class="status ${v.status.toLowerCase()}">${v.status}</span></td>
                          </tr>
                          `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};
