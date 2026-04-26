import { CA_Dashboard } from './ca/CA_Dashboard.js';
import { CA_Documents } from './ca/CA_Documents.js';
import { CA_Milestones } from './ca/CA_Milestones.js';
import { CA_Amendments } from './ca/CA_Amendments.js';
import { CA_Compliance } from './ca/CA_Compliance.js';
import { CA_Reports } from './ca/CA_Reports.js';
import { CA_Handlers } from './ca/CA_Handlers.js';
import contracts from '../../src/api/contracts.api.js';
import contractVersions from '../../src/api/contractVersions.api.js';
import insurancePolicies from '../../src/api/insurancePolicies.api.js';
import projects from '../../src/api/projects.api.js';
import client from '../../src/api/client.js';

export class ContractAdminDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.data = {
            contracts: [],
            milestones: [],
            versions: [],
            policies: [],
            stats: {
                activeContracts: 0,
                totalValue: 0,
                upcomingDeadlines: 0,
                pendingAmendments: 0,
                complianceAlerts: 0
            }
        };
    }

    async init() {
        await this.loadAllData();
    }

    async loadAllData() {
        try {
            const [contractsRes, policiesRes] = await Promise.all([
                contracts.getAll(),
                insurancePolicies.getAll()
            ]);

            this.data.contracts = contractsRes.data || [];
            this.data.policies = policiesRes.data || [];
            
            // Extract milestones from contracts
            this.data.milestones = this.data.contracts.flatMap(c => 
                (c.milestones || []).map(m => ({ ...m, contractRef: c.refCode, projectName: c.project?.name || 'Unknown' }))
            ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            // Calculate Stats
            this.data.stats.activeContracts = this.data.contracts.filter(c => c.status === 'active').length;
            this.data.stats.totalValue = this.data.contracts.reduce((sum, c) => sum + parseFloat(c.value || 0), 0);
            
            const today = new Date();
            const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            this.data.stats.upcomingDeadlines = this.data.milestones.filter(m => 
                m.status !== 'verified' && m.status !== 'paid' && 
                new Date(m.dueDate) <= sevenDaysLater
            ).length;

            this.data.stats.complianceAlerts = this.data.policies.filter(p => 
                new Date(p.expiryDate) <= today || (new Date(p.expiryDate) <= sevenDaysLater && p.status !== 'Expired')
            ).length;

            // Fetch versions for all contracts (ideally this would be a single call or batched)
            // For now, let's just fetch them if we are in the amendments view or skip for overview
            
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        }
    }

    async render() {
        return `
            <div id="ca-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${await this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    async getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'documents': return await this.getDocumentsView();
            case 'milestones': return this.getMilestonesView();
            case 'amendments': return await this.getAmendmentsView();
            case 'compliance': return this.getComplianceView();
            case 'reports': return this.getReportsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getHeaderHTML() {
        const stats = this.data.stats;
        const headers = {
            'dashboard': { title: 'Dashboard', context: `${stats.activeContracts} Active Contracts | ${stats.complianceAlerts > 0 ? 'Action Required' : '100% Compliance'}` },
            'documents': { title: 'Document Repository', context: 'Centralized Project Documents' },
            'milestones': { title: 'Milestone Tracking', context: 'Deliverables & Deadlines' },
            'amendments': { title: 'Amendments & Variations', context: 'Change Control Log' },
            'compliance': { title: 'Insurance & Bonds', context: 'Risk Management' },
            'reports': { title: 'Performance Reporting', context: 'KPIs & Analytics' }
        };
        const current = headers[this.currentView] || { title: 'Overview', context: '' };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Contract Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${current.title}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${current.title}</h1>
                    <div class="context-strip">
                      <span class="context-value">${current.context}</span>
                      ${this.currentView === 'dashboard' && stats.upcomingDeadlines > 0 ? `
                           <div class="context-dot"></div>
                           <span style="color: var(--orange); font-weight: 600;">${stats.upcomingDeadlines} Approaching Deadlines</span>
                      ` : ''}
                    </div>
                  </div>
                  ${this.currentView === 'documents' || this.currentView === 'dashboard' ? `
                      <button class="btn btn-action" onclick="window.app.caModule.openUploadDrawer()">
                        <i class="fas fa-file-arrow-up"></i>
                        <span>Upload Document</span>
                      </button>
                  ` : ''}
                </div>
            </div>
        `;
    }









    // --- Dynamic UI Helpers ---












    refresh() {
        // Simple re-render of current view
        const content = document.querySelector('#ca-module .content');
        if (content) {
            this.getCurrentViewHTML().then(html => content.innerHTML = html);
        }
    }

    // Replace render with async version to handle fetching
    async render() {
        const html = await this.getTemplateAsync();
        return html;
    }

    async getTemplateAsync() {
        const viewHtml = await this.getCurrentViewHTML();
        return `
            <div id="ca-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${viewHtml}
                </div>
            </div>
        `;
    }

    async getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'documents': return await this.getDocumentsView();
            case 'milestones': return this.getMilestonesView();
            case 'amendments': return this.getAmendmentsView();
            case 'compliance': return this.getComplianceView();
            case 'reports': return this.getReportsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }



}

// Apply modular mixins
Object.assign(ContractAdminDashboard.prototype, CA_Dashboard, CA_Documents, CA_Milestones, CA_Amendments, CA_Compliance, CA_Reports, CA_Handlers);
