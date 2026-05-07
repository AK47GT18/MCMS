import client from '../../src/api/client.js';

export const Shared_Issues = {
    getGovernanceView() {
        if (!this.sharedIssues) this.sharedIssues = [];
        
        // Setup the refresh function if not already there
        if (!this._loadSharedIssues) {
            this._loadSharedIssues = async () => {
                try {
                    const res = await client.get('/issues?limit=50');
                    let issues = [];
                    if (Array.isArray(res)) issues = res;
                    else if (res.data && Array.isArray(res.data)) issues = res.data;
                    
                    const currentUser = window.currentUser || {};
                    let filteredIssues = issues;
                    
                    // Governance Filtering: Non-PM/Executive users only see issues they reported
                    if (currentUser.role !== 'Project_Manager' && currentUser.role !== 'Managing_Director' && currentUser.role !== 'Project Manager') {
                        filteredIssues = issues.filter(i => 
                            i.createdById === currentUser.id || 
                            i.reporter?.id === currentUser.id ||
                            i.reporterId === currentUser.id
                        );
                    }
                    
                    this.sharedIssues = filteredIssues;
                    this._refreshCurrentView();
                } catch (err) {
                    console.error('Shared issues load failed:', err);
                }
            };
            this._loadSharedIssues();
        }

        return `
            <div class="view-content" style="padding: 24px;">
                <div class="data-card shadow-sm" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--slate-200);">
                    <div style="padding: 20px; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center; background: var(--slate-50);">
                        <div>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--slate-900);">Governance & Reported Issues</h3>
                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--slate-500);">Track blockers and PM responses to your site reports.</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary btn-sm" onclick="(window.app.ecModule || window.app.fmModule)?._loadSharedIssues()"><i class="fas fa-sync"></i> Refresh</button>
                            <button class="btn btn-action btn-sm" onclick="window.app.openIssueDrawer(null, 'Report Issue')"><i class="fas fa-plus"></i> Report Issue</button>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Evidence</th>
                                    <th>Description</th>
                                    <th>Latest Response</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.sharedIssues.length === 0 
                                    ? '<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--slate-400);">No issues reported by you.</td></tr>'
                                    : this.sharedIssues.map(issue => {
                                        const statusClass = (issue.status || 'open').toLowerCase() === 'resolved' ? 'active' : (issue.status || 'open').toLowerCase() === 'in_progress' ? 'locked' : 'pending';
                                        
                                        return `
                                        <tr>
                                            <td style="font-weight: 700;">#${issue.id}</td>
                                            <td><span class="badge" style="background: var(--slate-100); color: var(--slate-600); font-size: 10px; padding: 2px 8px; border-radius: 4px;">${issue.category || 'General'}</span></td>
                                            <td><span class="status ${statusClass}">${(issue.status || 'OPEN').toUpperCase()}</span></td>
                                            <td>
                                                ${issue.photoUrl ? '<i class="fas fa-image" style="color: var(--blue);" title="Photo Attached"></i>' : '<span style="color:var(--slate-300);">—</span>'}
                                            </td>
                                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${issue.description}</td>
                                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic; color: var(--slate-500);">
                                                ${issue.resolutionNotes ? issue.resolutionNotes : '<span style="opacity: 0.5;">Pending PM review...</span>'}
                                            </td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick='window.drawer.open("Issue Details", window.DrawerTemplates.complaintDetails(${JSON.stringify(issue).replace(/"/g, '&quot;')}))'>
                                                    <i class="fas fa-eye"></i> View Thread
                                                </button>
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
