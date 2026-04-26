import { FD_Dashboard } from './fd/FD_Dashboard.js';
import { FD_Procurement } from './fd/FD_Procurement.js';
import { FD_Budget } from './fd/FD_Budget.js';
import { FD_Contracts } from './fd/FD_Contracts.js';
import { FD_Records } from './fd/FD_Records.js';
import { FD_Handlers } from './fd/FD_Handlers.js';
import { FD_Ledger } from './fd/FD_Ledger.js';
import { Shared_Audit } from './Shared_Audit.js';
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
            budgetChanges: []
        };
        
        // Register this module globally
        window.app = window.app || {};
        window.app.fmModule = this;
        window.fmModule = this; // Legacy/Direct access
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
            case 'reports': return this.getRecordsView();
            case 'audit': return this.getAuditView();
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
                </div>
            </div>
        `;
    }

    switchView(view) {
        this.currentView = view;
        // Use the global app page loader for proper DOM re-injection
        if (window.app && typeof window.app.loadPage === 'function') {
            window.app.loadPage(view);
        } else {
            // Fallback: re-render into content area
            const content = document.getElementById('finance-content-area');
            if (content) content.innerHTML = this.getCurrentViewHTML();
        }
    }
}

// Apply modular mixins
Object.assign(FinanceDashboard.prototype, FD_Dashboard, FD_Procurement, FD_Budget, FD_Contracts, FD_Records, FD_Handlers, FD_Ledger, Shared_Audit);
