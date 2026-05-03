
import { PM_MissingHandlers } from './pm/PM_MissingHandlers.js';
import { PM_Portfolio } from './pm/PM_Portfolio.js';
import { PM_Gantt } from './pm/PM_Gantt.js';
import { PM_Budget } from './pm/PM_Budget.js';
import { PM_Teams } from './pm/PM_Teams.js';
import { PM_Contracts } from './pm/PM_Contracts.js';
import { PM_Fleet } from './pm/PM_Fleet.js';
import { PM_Reports } from './pm/PM_Reports.js';
import { PM_Reviews } from './pm/PM_Reviews.js';
import { PM_Issues } from './pm/PM_Issues.js';
import { PM_Users } from './pm/PM_Users.js';
import { PM_Audit } from './pm/PM_Audit.js';
import { PM_ProjectHandlers } from './pm/PM_ProjectHandlers.js';
import { PM_ReviewHandlers } from './pm/PM_ReviewHandlers.js';
import { PM_FeatureHandlers } from './pm/PM_FeatureHandlers.js';
import { PM_UserHandlers } from './pm/PM_UserHandlers.js';
import { PM_Config } from './pm/PM_Config.js';
import { PM_SystemHelpers } from './pm/PM_SystemHelpers.js';
import { PM_ProjectExtension } from './pm/PM_ProjectExtension.js';
import { StatCard } from '../ui/StatCard.js';
import { ROLES } from '../../config/roles.js';
import client from '../../src/api/client.js';
import users from '../../src/api/users.api.js';
import dailyLogs from '../../src/api/dailyLogs.api.js';
import requisitions from '../../src/api/requisitions.api.js';
import projects from '../../src/api/projects.api.js';
import audit from '../../src/api/audit.api.js';
import procurement from '../../src/api/procurement.api.js';
import assets from '../../src/api/assets.api.js';
import issues from '../../src/api/issues.api.js';
import tasks from '../../src/api/tasks.api.js';
import contracts from '../../src/api/contracts.api.js';
import { realtime } from '../../src/realtime/RealtimeClient.js';

export class ProjectManagerDashboard {
    constructor() {
        this.currentView = 'portfolio';
        this.selectedProjectId = null; 
        this.currentGanttViewMode = 'Month'; 
        
        // WebSocket Real-time listeners
        this.initRealtimeListeners();
    }

    initRealtimeListeners() {
        if (!realtime) return;

        // Listen for new issues or updates
        realtime.on('issue:created', () => {
            if (this.currentView === 'issues') this.loadIssuesFromAPI(true);
            this.updateHeaderStats();
        });

        realtime.on('issue:resolved', () => {
            if (this.currentView === 'issues') this.loadIssuesFromAPI(true);
            this.updateHeaderStats();
        });

        // Wildcard for any issue updates (assigned, escalated, etc.)
        realtime.on('issue:updated', () => {
            if (this.currentView === 'issues') this.loadIssuesFromAPI(true);
            this.updateHeaderStats();
        });
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    render() {
        let contentHTML = '';
        
        switch(this.currentView) {
            case 'portfolio': 
            case 'dashboard': 
                contentHTML = this.getPortfolioView(); 
                break;
            case 'gantt': 
            case 'execution': 
                contentHTML = this.getGanttView(); 
                break;
            case 'budget': contentHTML = this.getBudgetView(); break;
            case 'teams': contentHTML = this.getTeamsView(); break;
            case 'contracts': contentHTML = this.getContractsView(); break;
            case 'reports': contentHTML = this.getReportsView(); break;
            case 'analytics': contentHTML = this.getAnalyticsView(); break;
            case 'reviews': contentHTML = this.getReviewsView(); break;
            case 'issues': contentHTML = this.getIssuesView(); break;
            case 'fleet': contentHTML = this.getFleetView(); break;
            case 'users': contentHTML = this.getUsersView(); break;
            case 'audit': contentHTML = this.getAuditView(); break;
            case 'config': contentHTML = this.getConfigView(); break;
            default: contentHTML = this.getPortfolioView();
        }

        return `
            <div id="pm-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        const titleMap = {
            'portfolio': 'Dashboard',
            'dashboard': 'Dashboard',
            'gantt': 'Execution Schedule',
            'execution': 'Execution Schedule',
            'budget': 'Financial Control',
            'teams': 'Field Operations',
            'contracts': 'Contract Registry',
            'reports': 'Reports Center',
            'analytics': 'Performance Analytics',
            'reviews': 'Approvals & Reviews',
            'issues': 'Issues Resolution Center',
            'fleet': 'Asset Registry',
            'users': 'User Management',
            'audit': 'System Audit Logs',
            'config': 'Material Price Configuration'
        };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${titleMap[this.currentView] || 'Dashboard'}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${titleMap[this.currentView] || 'Overview'}</h1>
                    ${this.getContextStrip()}
                  </div>
                  ${this.getActionButtons()}
                </div>
            </div>
        `;
    }

    getContextStrip() {
        const stats = this.allProjects ? this.calculateDashboardStats(this.allProjects) : null;
        
        if (this.currentView === 'budget') {
            return `
                <div class="context-strip">
                  <span class="context-value">MWK ${stats ? (stats.totalBudget / 1000000).toFixed(1) + 'M' : '0.0M'}</span> Total Budget
                  <div class="context-dot"></div>
                  <span style="color: ${stats && stats.budgetUtilization > 100 ? 'var(--red)' : 'var(--emerald)'}; font-weight: 600;">${stats ? stats.budgetUtilization.toFixed(1) : '0.0'}% Utilized</span>
                  <div class="context-dot"></div>
                  <span style="color: var(--orange); font-weight: 600;"><span id="context-pending-logs">0</span> Pending Logs</span>
                </div>
            `;
        }

        if (this.currentView === 'portfolio' || this.currentView === 'dashboard') {
            return `
                <div class="context-strip">
                  <span class="context-value" id="context-active-projects">${stats ? stats.activeProjects : 0}</span> Active Projects
                  <div class="context-dot"></div>
                  <span class="context-value" id="context-portfolio-value">MWK ${stats ? (stats.portfolioValue / 1000000000).toFixed(1) + 'B' : '0.0B'}</span> Portfolio Value
                  <div class="context-dot"></div>
                  <span style="color: var(--orange); font-weight: 600;"><span id="context-pending-logs">0</span> Pending Logs</span>
                </div>
            `;
        }
        return ''; // Default return if no specific view matches
    }

    getActionButtons() {
        if (this.currentView === 'portfolio' || this.currentView === 'dashboard') {
            return `
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-action" onclick="window.app.pmModule.openNewProjectDrawer()">
                        <i class="fas fa-plus-circle"></i> <span>New Project</span>
                    </button>
                </div>`;
        }
        if (this.currentView === 'gantt' || this.currentView === 'execution') {
             return `
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-secondary"><i class="fas fa-sliders"></i> Filter</button>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add Task', window.DrawerTemplates.addTask)"><i class="fas fa-calendar-plus"></i> Add Task</button>
                </div>`;
        }
        if (this.currentView === 'users') {
             return `
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-action" onclick="window.drawer.open('Add New User', window.DrawerTemplates.newUser); window.app.pmModule.initCreateUserForm();">
                        <i class="fas fa-user-plus"></i> <span>Add User</span>
                    </button>
                </div>`;
        }
        return '';
    }

    // --- 1. PORTFOLIO MODULE ---






	toggleDropdown(button) {
		const content = button.nextElementSibling;
		const isVisible = content.style.display === 'block';
		
		// Close all first
		document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
		
		if (!isVisible) {
			content.style.display = 'block';
			
			// Handle click outside
			const closeDropdown = (e) => {
				if (!button.contains(e.target) && !content.contains(e.target)) {
					content.style.display = 'none';
					document.removeEventListener('click', closeDropdown);
				}
			};
			
			setTimeout(() => {
				document.addEventListener('click', closeDropdown);
			}, 0);
		}
	}





    // Consolidated Project Action Handlers

    // openEditProjectDrawer consolidated below in its enhanced version


    // --- 2.1 GANTT SCHEDULE (EXECUTION) ---





    // ============================================
    // GANTT PHASE EXECUTOR & EXTENSION LOGIC
    // ============================================
    




    // --- 2.2 BUDGET CONTROL (EXECUTION) ---




    // --- 2.3 FIELD TEAMS (EXECUTION) ---


    // --- 5. CONTRACTS (DOCUMENTS) ---



    // --- 7. REPORTS ---


    getAnalyticsView() {
        setTimeout(() => this.loadInventoryData(), 0);
        const stats = this.calculateDashboardStats(this.allProjects || []);
        const projectBars = (this.allProjects || []).slice(0, 4).map(p => {
            const utilization = p.budgetTotal > 0 ? (p.budgetSpent / p.budgetTotal) * 100 : 0;
            const color = utilization > 100 ? 'var(--red)' : utilization > 80 ? 'var(--orange)' : 'var(--emerald)';
            return `
                <div class="bar-group">
                    <div class="bar" style="height: ${Math.min(utilization, 100)}%; background: ${color};" title="${p.name}: ${utilization.toFixed(1)}%"></div>
                    <div class="bar-label">${p.code || p.id}</div>
                </div>
            `;
        }).join('');

        return `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Budget Utilization by Project (%)</div>
                        <button class="btn btn-secondary" onclick="window.app.pmModule.loadProjectsFromAPI()"><i class="fas fa-sync"></i></button>
                    </div>
                    <div style="padding:24px;">
                        <div class="chart-container">
                            ${projectBars || '<div style="height:200px; display:flex; align-items:center; color:var(--slate-400);">No project data available</div>'}
                        </div>
                    </div>
                </div>

                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Portfolio Distribution</div>
                        <div style="font-size:11px; color:var(--slate-500);">Value by Project Status</div>
                    </div>
                    <div style="padding:24px; display:flex; align-items:center; justify-content:center; height:240px;">
                        <div style="position:relative; width:160px; height:160px; border-radius:50%; background:conic-gradient(var(--emerald) 0% 45%, var(--orange) 45% 75%, #4F46E5 75% 100%);">
                            <div style="position:absolute; inset:30px; background:white; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                <div style="font-weight:800; font-size:18px;">MWK ${(stats.portfolioValue / 1e9).toFixed(1)}B</div>
                                <div style="font-size:10px; color:var(--slate-500);">Portfolio</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="data-card">
                 <div class="data-card-header">
                    <div class="card-title">Critical Inventory & Assets</div>
                    <button class="btn btn-secondary" onclick="window.app.pmModule.loadInventoryData()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
                <div id="inventory-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }


    // --- 10. REVIEWS & APPROVALS ---

















    // --- 9. ISSUES CENTER ---







    // --- SYSTEM ALIGNMENT HELPERS ---




    // --- USERS MODULE ---




    // --- AUDIT MODULE ---



    // --- USERS MODULE (HANDLERS) ---






    // --- PROJECT HANDLERS ---





    // --- PROJECT EXTENSION ---




    // --- REVIEW & APPROVAL HANDLERS ---






    // --- FEATURE SPECIFIC HANDLERS ---














    // Helper to just re-render the receipt portion
}

// Apply modular mixins
Object.assign(ProjectManagerDashboard.prototype, PM_MissingHandlers, PM_Portfolio, PM_Gantt, PM_Budget, PM_Teams, PM_Contracts, PM_Fleet, PM_Reports, PM_Reviews, PM_Issues, PM_Users, PM_Audit, PM_Config, PM_ProjectHandlers, PM_ReviewHandlers, PM_FeatureHandlers, PM_UserHandlers, PM_SystemHelpers, PM_ProjectExtension);
