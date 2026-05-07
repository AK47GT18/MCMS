import { FD_Dashboard } from './fd/FD_Dashboard.js';
import { FD_Procurement } from './fd/FD_Procurement.js';
import { FD_Budget } from './fd/FD_Budget.js';
import { FD_Contracts } from './fd/FD_Contracts.js';
import { FD_Records } from './fd/FD_Records.js';
import { FD_Handlers } from './fd/FD_Handlers.js';
import { FD_Ledger } from './fd/FD_Ledger.js';
import { PM_Budget } from './pm/PM_Budget.js';
import { Shared_Audit } from './Shared_Audit.js';
import { Shared_Issues } from './Shared_Issues.js';
import { StatCard } from '../ui/StatCard.js';

import client from '../../src/api/client.js';
import projects from '../../src/api/projects.api.js';
import requisitions from '../../src/api/requisitions.api.js';
import contracts from '../../src/api/contracts.api.js';


export class FinanceDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.data = {
            stats: { available: 0, committed: 0, ecRequests: 0, pmUplifts: 0 },
            projects: [],

            requisitions: [],
            budgetChanges: [],
            vehicleRentals: []
        };
        
        // Register this module globally with safety checks
        console.log('[DEBUG] FinanceDashboard initialized', this);
        if (window.app) window.app.fmModule = this;
        window.fmModule = this; // Restore legacy reference
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="finance-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content" id="finance-content-area">
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    // --- SUB-VIEWS ---

    getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'procurement': return this.getProcurementView();
            case 'approvals': return this.getResourceApprovalsView();
            case 'contracts': return this.getContractsView();
            case 'vendors': return this.getVendorsView();
            case 'bcr': return this.getBudgetControlView();
            case 'ledger': return this.getLedgerView();
            case 'budget': return this.getBudgetView(); // PM_Budget integration
            case 'reports': return this.getRecordsView();
            case 'governance': return this.getGovernanceView();
            case 'audit': return this.getAuditView();
            case 'portfolio': 
                this.currentView = 'dashboard';
                return this.getDashboardView();
            default: return this.getPlaceholderView(this.currentView);
        }
    }

    getPlaceholderView(title) {
        return `<div class="data-card"><div class="data-card-header"><div class="card-title">${title.charAt(0).toUpperCase() + title.slice(1)}</div></div><div style="padding: 24px;">Content for ${title} coming soon.</div></div>`;
    }

    getHeaderHTML() {
        const headers = {
            'dashboard': { title: 'Dashboard', context: 'Strategic Health & Overruns' },
            'procurement': { title: 'Procurement Dashboard', context: 'Material Pipeline Tracking' },
            'approvals': { title: 'Resource Hub', context: 'Procurement Gatekeeping' },
            'contracts': { title: 'Vendor Contracts', context: 'Milestones & Commitments' },
            'vendors': { title: 'Vendor Registry', context: 'Compliance & Performance' },
            'bcr': { title: 'PM Uplift Requests', context: 'Budget Extensions' },
            'ledger': { title: 'Commitments Ledger', context: 'Organizational Obligations' },
            'budget': { title: 'Project Cost Ledger', context: 'Portfolio Financial Oversight' },
            'governance': { title: 'Governance Center', context: 'Blockers & PM Responses' },
            'reports': { title: 'Records Center', context: 'Reporting & Compliance' },
            'audit': { title: 'Security Audit logs', context: 'Immutable Event Records' }
        };

        const current = headers[this.currentView] || { title: this.currentView, context: '' };

        return `
             <div class="page-header">
                <div class="page-title-row">
                    <div>
                        <h1 class="page-title">${current.title}</h1>
                        <div class="context-strip">
                            <span class="context-value">${current.context}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; align-items: center;">
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.openIssueDrawer(null, 'Report Financial Issue')">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>Report Issue</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    _refreshCurrentView() {
        const container = document.getElementById('finance-content-area');
        if (container) {
            container.innerHTML = this.getCurrentViewHTML();
        }
    }

    switchView(view, projectId = null) {
        console.log('[DEBUG] Switching finance view to:', view, 'with project context:', projectId);
        this.currentView = view;
        
        // Apply project filter context if provided
        if (projectId) {
            this.projectFilter = projectId;
        }

        // Always refresh internally first
        this._refreshCurrentView();

        // Optionally notify global app of the state change
        if (window.app && typeof window.app.syncSidebar === 'function') {
            window.app.syncSidebar(view);
        }
    }

    renderLoadingState() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                <div>Loading data...</div>
            </div>
        `;
    }

    renderEmptyState(message) {
        return `
            <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                <i class="fas fa-folder-open" style="font-size: 32px; margin-bottom: 12px;"></i>
                <div>${message}</div>
            </div>
        `;
    }

    escapeHTML(str) {
        return str?.toString().replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m])) || '';
    }

    toggleDropdown(btn) {
        const content = btn.nextElementSibling;
        const isVisible = content.style.display === 'block';
        
        // Close all others
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
        
        if (!isVisible) {
            content.style.display = 'block';
            const close = (e) => {
                if (!btn.contains(e.target) && !content.contains(e.target)) {
                    content.style.display = 'none';
                    document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        }
    }

    updateHeaderStats() {
        if (!this.allProjects) return;
        
        const activeCount = this.allProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
        const portfolioValue = this.allProjects.reduce((sum, p) => sum + (parseFloat(p.contractSum || p.budget || 0)), 0);
        
        const activeEl = document.getElementById('stat-active-projects');
        const valueEl = document.getElementById('stat-portfolio-value');
        
        if (activeEl) activeEl.textContent = activeCount;
        if (valueEl) valueEl.textContent = `MWK ${portfolioValue.toLocaleString()}`;
    }
}

// Apply modular mixins
Object.assign(FinanceDashboard.prototype, FD_Dashboard, FD_Procurement, FD_Budget, FD_Contracts, FD_Records, FD_Handlers, FD_Ledger, PM_Budget, Shared_Audit, Shared_Issues);
