import client from '../../../src/api/client.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const CA_Documents = {
    async getDocumentsView() {
        const docs = await this.loadDocuments();
        
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Project Documents & Versions</div>
                    <div style="display:flex; gap:8px;">
                        <input type="text" placeholder="Search documents..." style="padding:6px 12px; border:1px solid var(--slate-300); border-radius:4px; font-size:13px;">
                        <button class="btn btn-secondary"><i class="fas fa-filter"></i> Project</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Linked Project</th>
                            <th>Contract Value</th>
                            <th>Latest Version</th>
                            <th>Last Updated</th>
                            <th>Uploaded By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${docs.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--slate-400);">No documents uploaded yet.</td></tr>` : 
                          docs.map(doc => `
                            <tr>
                                <td style="font-weight:600;">${doc.title}</td>
                                <td><span class="project-id">${doc.project?.code || 'PRJ'}</span> ${doc.project?.name || 'Unknown'}</td>
                                <td class="mono-val">${doc.contractValue ? parseFloat(doc.contractValue).toLocaleString() + ' MWK' : 'N/A'}</td>
                                <td><span class="version-tag">v${doc.versions[0]?.versionNumber || 1}</span></td>
                                <td>${new Date(doc.updatedAt).toLocaleDateString()}</td>
                                <td>${doc.uploadedBy?.name || 'N/A'}</td>
                                <td>
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.app.caModule.openVersionDrawer(${JSON.stringify(doc).replace(/"/g, '&quot;')})">Update</button>
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.app.caModule.openEditDocumentDrawer(${JSON.stringify(doc).replace(/"/g, '&quot;')})">Edit</button>
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.app.caModule.openVersionHistoryDrawer(${JSON.stringify(doc).replace(/"/g, '&quot;')})" title="View Version History"><i class="fas fa-history"></i></button>
                                        <a href="${doc.currentVersionUrl}" target="_blank" class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" title="View Latest in Browser"><i class="fas fa-eye"></i></a>
                                        <a href="${doc.currentVersionUrl}" download target="_blank" class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" title="Download Latest"><i class="fas fa-download"></i></a>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async loadDocuments() {
        try {
            const res = await contracts.getAll(); // Or use documents API if specific to CA
            // Assuming documents are part of contracts or projects
            // For now, let's use the actual documents API if it's what's intended
            // Checking src/api/documents.api.js earlier...
            const docsRes = await client.get('/documents'); 
            return docsRes.data || [];
        } catch (error) {
            console.error('Failed to load documents', error);
            return [];
        }
    }
};
