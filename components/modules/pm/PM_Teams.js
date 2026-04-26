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

export const PM_Teams = {
    getTeamsView() {
        setTimeout(() => this.loadSiteActivityFromAPI(), 0);
        return `
            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Live Site Activity & Supervisor Status</div>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule.loadSiteActivityFromAPI()"><i class="fas fa-sync"></i> Refresh Site Data</button>
                </div>
                <div id="site-activity-container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; padding:20px;">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }
};
