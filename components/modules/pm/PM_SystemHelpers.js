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

export const PM_SystemHelpers = {
    calculateDashboardStats(projects) {
        const stats = {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active' || p.status === 'planning').length,
            portfolioValue: projects.reduce((sum, p) => sum + (parseFloat(p.contractValue) || 0), 0),
            totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.budgetTotal) || 0), 0),
            totalSpent: projects.reduce((sum, p) => sum + (parseFloat(p.budgetSpent) || 0), 0),
            pendingReviews: (this.pendingExtensions?.length || 0) + (this.pendingLogs?.length || 0) + (this.pendingRequisitions?.length || 0)
        };
        
        stats.budgetUtilization = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0;
        
        return stats;
    },

    async updateHeaderStats() {
        try {
            // Fetch comprehensive dashboard data - Skip cache for real-time accuracy
            const [logsRes, projectsRes, issuesRes] = await Promise.all([
                client.get('/daily-logs', { status: 'pending', skipCache: true }),
                client.get('/projects', { skipCache: true }),
                client.get('/issues', { status: 'open', skipCache: true })
            ]);

            const pendingLogs = (logsRes.data || logsRes || []).length;
            const openIssues = (issuesRes.data || issuesRes || []).length;
            const allProjects = projectsRes.data || projectsRes || [];
            const stats = this.calculateDashboardStats(allProjects);

            // Update DOM directly if elements exist
            // 1. Context Navbar Strip
            const activeProjectsEl = document.getElementById('context-active-projects');
            if (activeProjectsEl) activeProjectsEl.innerText = stats.activeProjects;

            const portfolioValueEl = document.getElementById('context-portfolio-value');
            if (portfolioValueEl) portfolioValueEl.innerText = `MWK ${(stats.portfolioValue / 1000000000).toFixed(1)}B`;

            const pendingLogsEl = document.getElementById('context-pending-logs');
            if (pendingLogsEl) {
                pendingLogsEl.innerText = pendingLogs;
                pendingLogsEl.parentElement.style.opacity = pendingLogs > 0 ? '1' : '0.5';
            }

            // 2. Main Stats Grid (Portfolio View)
            const statBudgetHealth = document.getElementById('stat-budget-health');
            if (statBudgetHealth) {
                const health = stats.totalBudget ? ((1 - (stats.totalSpent / stats.totalBudget)) * 100).toFixed(0) : 100;
                statBudgetHealth.innerText = `${health}%`;
            }

            const statPendingReviews = document.getElementById('stat-pending-reviews');
            if (statPendingReviews) statPendingReviews.innerText = pendingLogs;

            const statPortfolioValue = document.getElementById('stat-portfolio-value');
            if (statPortfolioValue) statPortfolioValue.innerText = `MWK ${(stats.portfolioValue / 1000000).toFixed(0)}M`;

            const statActiveProjects = document.getElementById('stat-active-projects');
            if (statActiveProjects) statActiveProjects.innerText = stats.activeProjects;

        } catch (error) {
            console.error('Failed to update header stats:', error);
        }
    },

    renderEmptyState(message = 'No records found') {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--slate-400); text-align: center;">
                <div style="width: 64px; height: 64px; background: var(--slate-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <i class="fas fa-search" style="font-size: 24px; color: var(--slate-400);"></i>
                </div>
                <div style="font-weight: 600; color: var(--slate-700); margin-bottom: 8px;">${message}</div>
                <div style="font-size: 13px; max-width: 300px;">Try adjusting your filters or search terms to find what you're looking for.</div>
                <button class="btn btn-secondary" style="margin-top: 24px;" onclick="window.app.pmModule.currentView='dashboard'; window.app.pmModule.render();">Return to Overview</button>
            </div>
        `;
    },

    renderLoadingState() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 32px; color: var(--orange); margin-bottom: 16px;"></i>
                <div style="font-weight: 600; color: var(--slate-600);">Loading system data...</div>
            </div>
        `;
    }
};
