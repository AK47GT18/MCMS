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
                    
                    <div class="hidden-mobile">
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
                    
                    <div class="hidden-desktop">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 20px;">
                            ${this.sharedIssues.length === 0 
                                ? '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--slate-400);">No issues reported by you.</div>'
                                : this.sharedIssues.map(issue => {
                                    const statusClass = (issue.status || 'open').toLowerCase() === 'resolved' ? 'active' : (issue.status || 'open').toLowerCase() === 'in_progress' ? 'locked' : 'pending';
                                    
                                    return `
                                    <div class="issue-card" style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px;">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <div>
                                                <div style="font-weight: 800; font-size: 15px; color: var(--slate-900);">#${issue.id || '—'}</div>
                                                <span class="badge" style="background: var(--slate-100); color: var(--slate-600); font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-top: 4px; display: inline-block;">
                                                    ${issue.category || 'General'}
                                                </span>
                                            </div>
                                            <span class="status ${statusClass}" style="font-size: 10px; font-weight: 700;">${(issue.status || 'OPEN').toUpperCase()}</span>
                                        </div>
                                        
                                        <div style="font-size: 13px; color: var(--slate-600); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 36px;">
                                            ${issue.description || 'No description provided'}
                                        </div>

                                        <div style="padding: 12px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-100); margin-top: 4px;">
                                            <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; margin-bottom: 4px;">Latest Response</div>
                                            <div style="font-style: italic; color: var(--slate-600); font-size: 12px; line-height: 1.4;">
                                                ${issue.resolutionNotes ? issue.resolutionNotes : '<span style="opacity: 0.5;">Pending PM review...</span>'}
                                            </div>
                                        </div>

                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                                            <div>
                                                ${issue.photoUrl ? `
                                                    <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px; color: var(--blue); border-color: var(--blue-light);" onclick='window.viewDocument("${issue.photoUrl}", "Evidence Preview")'>
                                                        <i class="fas fa-image"></i> View Evidence
                                                    </button>
                                                ` : '<span style="font-size: 11px; color: var(--slate-400);"><i class="fas fa-image" style="opacity: 0.5;"></i> No Evidence</span>'}
                                            </div>
                                            <button class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 11px; border-radius: 8px;" 
                                                onclick='window.drawer.open("Issue Details", window.DrawerTemplates.complaintDetails(${JSON.stringify(issue).replace(/"/g, '&quot;')}))'>
                                                View Thread
                                            </button>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
