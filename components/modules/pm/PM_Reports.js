import client from '../../../src/api/client.js';
import projects from '../../../src/api/projects.api.js';
import users from '../../../src/api/users.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import requisitions from '../../../src/api/requisitions.api.js';
import audit from '../../../src/api/audit.api.js';
import procurement from '../../../src/api/procurement.api.js';
import assets from '../../../src/api/assets.api.js';
import issues from '../../../src/api/issues.api.js';
import tasks from '../../../src/api/tasks.api.js';
import contracts from '../../../src/api/contracts.api.js';

export const PM_Reports = {
    getReportsView() {
        setTimeout(() => this.loadReportsData(), 0);
        return `
            <div class="data-card" style="padding: 32px 24px;">
                <div class="data-card-header" style="margin-bottom: 32px;">
                    <div>
                        <div class="card-title" style="font-size: 20px;">Project Reporting Center</div>
                        <p style="color: var(--slate-500); font-size: 13px; margin-top: 4px;">Download comprehensive project health and field execution data.</p>
                    </div>
                    <div style="display: flex; gap: 16px; align-items: flex-end;">
                        <div style="width: 260px;">
                            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 6px;">Target Context</label>
                            <select id="report-project-filter" class="form-input" style="width: 100%; height: 42px;" onchange="window.app.pmModule.loadReportsData()">
                                <option value="all">Global Workspace (All Projects)</option>
                                ${this.allProjects ? this.allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('') : ''}
                            </select>
                        </div>
                        <button class="btn btn-primary" style="height: 42px; padding: 0 20px;" onclick="window.app.pmModule.loadReportsData()"><i class="fas fa-sync"></i> Refresh Data</button>
                    </div>
                </div>

                <div id="reports-grid-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }
};
