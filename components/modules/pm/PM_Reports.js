import client from '../../../src/api/client.js';

export const PM_Reports = {
    renderLoadingState() {
        return `<div style="padding: 40px; text-align: center; color: var(--slate-400); grid-column: 1/-1;">
            <div class="animate-spin" style="font-size: 24px; margin-bottom: 12px;"><i class="fas fa-circle-notch"></i></div>
            <p>Gathering data for analysis...</p>
        </div>`;
    },

    async loadReportsData() {
        let grid = document.getElementById('reports-grid-container');
        if (!grid) return;
        
        // Load projects and quick stats if not loaded
        if (!this.allProjects) {
            try {
                const [projRes, statsRes] = await Promise.all([
                    client.get('projects'),
                    this.fetchQuickStats()
                ]);
                this.allProjects = projRes.data;
                this.quickStats = statsRes;
                
                // Update dropdown if it exists
                const select = document.getElementById('report-project-filter');
                if (select) {
                    select.innerHTML = `
                        <option value="all">Global Workspace (All Projects)</option>
                        ${this.allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    `;
                }
            } catch (e) {
                console.error('Failed to load initial data for reports', e);
            }
        }

        // Re-fetch grid in case it changed during fetch
        grid = document.getElementById('reports-grid-container');
        if (grid) {
            grid.innerHTML = this.renderReportDashboard();
            // Initialize fields for default model
            setTimeout(() => this.updateBuilderFields(), 50);
        }
    },

    async fetchQuickStats() {
        try {
            const [contracts, reqs, issues] = await Promise.all([
                client.post('reports/dynamic', { model: 'contract', metric: 'count', filters: { status: 'active' } }),
                client.post('reports/dynamic', { model: 'requisition', metric: 'count', filters: { status: 'pending' } }),
                client.post('reports/dynamic', { model: 'issue', metric: 'count', filters: { status: 'open' } })
            ]);
            
            return {
                activeContracts: contracts.data?.count ?? contracts.data ?? 0,
                pendingReqs: reqs.data?.count ?? reqs.data ?? 0,
                openIssues: issues.data?.count ?? issues.data ?? 0,
                efficiency: '94%' // Placeholder logic for efficiency
            };
        } catch (e) {
            console.error('Quick stats fetch failed', e);
            return { activeContracts: '-', pendingReqs: '-', openIssues: '-', efficiency: '-' };
        }
    },

    render() {
        return this.getReportsView();
    },

    getReportsView() {
        this.init();
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
                            <select id="report-project-filter" class="form-input" style="width: 100%; height: 42px;" onchange="window.app.reports.loadReportsData()">
                                <option value="all">Global Workspace (All Projects)</option>
                                ${this.allProjects ? this.allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('') : ''}
                            </select>
                        </div>
                        <button class="btn btn-primary" style="height: 42px; padding: 0 20px;" onclick="window.app.reports.loadReportsData()"><i class="fas fa-sync"></i> Refresh Data</button>
                    </div>
                </div>

                <div id="reports-grid-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    },

    renderReportDashboard() {
        const stats = this.quickStats || { activeContracts: '...', pendingReqs: '...', openIssues: '...', efficiency: '...' };
        return `
            <!-- Quick Insights Row -->
            <div style="grid-column: 1/-1; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 8px;">
                ${this.renderMiniStat('Active Contracts', stats.activeContracts, 'fa-file-contract', 'blue')}
                ${this.renderMiniStat('Pending Requisitions', stats.pendingReqs, 'fa-shopping-cart', 'amber')}
                ${this.renderMiniStat('Open Issues', stats.openIssues, 'fa-exclamation-circle', 'red')}
                ${this.renderMiniStat('Material Efficiency', stats.efficiency, 'fa-chart-line', 'emerald')}
            </div>

            <!-- Dynamic Report Builder Card -->
            <div class="data-card" style="grid-column: 1 / -1; padding: 24px; border: 1px solid var(--orange-light); background: linear-gradient(to bottom right, #fff, #fff9f5);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-800); display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-magic" style="color: var(--orange);"></i> Custom Report Builder
                        </h3>
                        <p style="font-size: 12px; color: var(--slate-500);">Configure custom aggregations and metrics across the entire system.</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; align-items: end;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Analyze Model</label>
                        <select id="builder-model" class="form-input" onchange="window.app.reports.updateBuilderFields()">
                            <option value="project">Projects</option>
                            <option value="contract">Contracts</option>
                            <option value="task">Tasks</option>
                            <option value="materialUsage">Material Usage</option>
                            <option value="requisition">Requisitions</option>
                            <option value="asset">Assets</option>
                            <option value="issue">Issues</option>
                            <option value="dailyLog">Daily Logs</option>
                            <option value="roadLayer">Road Layers</option>
                            <option value="variationOrder">Variation Orders</option>
                            <option value="replenishmentRequest">Replenishments</option>
                            <option value="projectExtensionRequest">Time Extensions</option>
                            <option value="transaction">Financial Ledger</option>
                            <option value="vendor">Vendor Database</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Metric Type</label>
                        <select id="builder-metric" class="form-input">
                            <option value="list">Raw Data List</option>
                            <option value="count">Count (Frequency)</option>
                            <option value="sum">Sum (Total Value)</option>
                            <option value="avg">Average (Mean)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Target Field</label>
                        <select id="builder-field" class="form-input">
                            <option value="id">Record ID</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label">Group By</label>
                        <select id="builder-group" class="form-input">
                            <option value="">No Grouping</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="window.app.reports.runCustomReport()" style="width: 100%; height: 42px; justify-content: center;">
                        <i class="fas fa-play"></i> Generate
                    </button>
                </div>
                
                <div id="builder-results-container" style="margin-top: 24px; min-height: 200px; border-top: 1px dashed var(--slate-200); padding-top: 24px;">
                    <div style="text-align: center; color: var(--slate-400); padding: 40px;">
                        <i class="fas fa-chart-bar" style="font-size: 32px; opacity: 0.2; margin-bottom: 12px;"></i>
                        <p style="font-size: 13px;">Adjust filters above and click Generate to see live analytics.</p>
                    </div>
                </div>
            </div>

            <!-- Standard Reports Section -->
            <div style="grid-column: 1/-1; margin-top: 12px;">
                <h3 style="font-size: 14px; font-weight: 700; color: var(--slate-600); margin-bottom: 16px;">Standard Reports</h3>
            </div>
            
            ${this.renderReportCard('Project Portfolio Summary', 'Status, budget utilization, and progress for all active works.', 'pm_portfolio', 'fa-briefcase', 'blue')}
            ${this.renderReportCard('Timeline Compliance', 'Overdue tasks, schedule variance, and completion forecasts.', 'pm_timeline', 'fa-clock', 'orange')}
            ${this.renderReportCard('Material Consumption', 'Total burn rate per road layer and inventory depletion trends.', 'field_burn_rate', 'fa-layer-group', 'emerald')}
            ${this.renderReportCard('Financial Burn Report', 'Daily expenditure vs project budget limits.', 'finance_budget', 'fa-money-bill-wave', 'purple')}
        `;
    },

    renderMiniStat(label, value, icon, color) {
        return `
            <div class="data-card" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--${color}-light); color: var(--${color}); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                    <i class="fas ${icon}"></i>
                </div>
                <div>
                    <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">${label}</div>
                    <div style="font-size: 18px; font-weight: 800; color: var(--slate-800);">${value}</div>
                </div>
            </div>
        `;
    },

    renderReportCard(title, desc, reportId, icon, color) {
        return `
            <div class="data-card hover-glow" style="padding: 24px; display: flex; flex-direction: column; transition: transform 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--${color}-light); color: var(--${color}); display: flex; align-items: center; justify-content: center; font-size: 16px;">
                        <i class="fas ${icon}"></i>
                    </div>
                    <h4 style="font-size: 15px; font-weight: 700; color: var(--slate-800);">${title}</h4>
                </div>
                <p style="font-size: 12px; color: var(--slate-500); line-height: 1.6; margin-bottom: 24px; flex: 1;">${desc}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="btn btn-secondary" style="font-size: 11px; justify-content: center;" onclick="window.app.reports.exportReport('${reportId}', 'csv')">
                        <i class="fas fa-file-csv"></i> CSV
                    </button>
                    <button class="btn btn-secondary" style="font-size: 11px; justify-content: center;" onclick="window.app.reports.exportReport('${reportId}', 'pdf')">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>
        `;
    },

    updateBuilderFields() {
        const modelEl = document.getElementById('builder-model');
        const fieldSelect = document.getElementById('builder-field');
        const groupSelect = document.getElementById('builder-group');
        if (!modelEl || !fieldSelect || !groupSelect) return;

        const model = modelEl.value;
        
        const fieldMap = {
            'project': ['budgetTotal', 'budgetSpent', 'contractValue', 'radius', 'currentPhase'],
            'contract': ['value', 'retentionAmount', 'vatAmount', 'advancePaymentAmount'],
            'task': ['progress'],
            'materialUsage': ['quantity'],
            'requisition': ['totalAmount'],
            'asset': ['estimatedValue', 'fuelLevel', 'hoursOrKm'],
            'issue': ['id'],
            'dailyLog': ['expenseAmount', 'headcount'],
            'roadLayer': ['totalQuantity', 'totalCostHigh', 'totalCostLow'],
            'variationOrder': ['netValue'],
            'replenishmentRequest': ['quantityNeeded', 'estimatedCost'],
            'projectExtensionRequest': ['extensionDays'],
            'transaction': ['debit', 'credit'],
            'vendor': ['rating']
        };

        const groupMap = {
            'project': ['status', 'projectType', 'client', 'currentPhase'],
            'contract': ['status', 'contractType', 'vendorName'],
            'task': ['statusClass', 'projectId'],
            'materialUsage': ['materialName', 'unit', 'projectId', 'sectorId'],
            'requisition': ['status', 'vendorName', 'projectId'],
            'asset': ['status', 'category', 'condition', 'currentProjectId'],
            'issue': ['status', 'priority', 'category', 'projectId'],
            'dailyLog': ['status', 'weather', 'projectId'],
            'roadLayer': ['phaseName', 'materialType'],
            'variationOrder': ['status', 'projectId'],
            'replenishmentRequest': ['status', 'materialName', 'projectId'],
            'projectExtensionRequest': ['status', 'projectId'],
            'transaction': ['accountCode', 'projectId'],
            'vendor': ['category', 'riskLevel']
        };

        fieldSelect.innerHTML = (fieldMap[model] || []).map(f => `<option value="${f}">${f.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</option>`).join('') || '<option value="id">Record ID</option>';
        groupSelect.innerHTML = `<option value="">No Grouping</option>` + (groupMap[model] || []).map(g => `<option value="${g}">${g.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</option>`).join('');
    },

    async runCustomReport() {
        const resultsContainer = document.getElementById('builder-results-container');
        resultsContainer.innerHTML = this.renderLoadingState();

        const params = {
            model: document.getElementById('builder-model').value,
            metric: document.getElementById('builder-metric').value,
            field: document.getElementById('builder-field').value,
            groupBy: document.getElementById('builder-group').value
        };

        try {
            const res = await client.post('reports/dynamic', params);
            const data = res.data;
            this.lastCustomParams = params; // Store for export
            
            if (!data || (Array.isArray(data) && data.length === 0)) {
                resultsContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);">No matching data found for this configuration.</div>`;
                return;
            }

            this.renderCustomResults(data, params);
        } catch (e) {
            window.toast.show('Failed to generate report: ' + e.message, 'error');
            resultsContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--red);">Error generating report. Please check parameters.</div>`;
        }
    },

    renderCustomResults(data, params) {
        const container = document.getElementById('builder-results-container');
        
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--slate-700);">Analysis Result: ${params.metric.toUpperCase()} of ${params.field} by ${params.groupBy || 'Total'}</div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.app.reports.exportCustom('csv')"><i class="fas fa-download"></i> CSV</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.reports.exportCustom('pdf')"><i class="fas fa-file-pdf"></i> PDF</button>
                </div>
            </div>
            <div style="overflow-x: auto; background: white; border-radius: 8px; border: 1px solid var(--slate-100);">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                        <tr>
                            ${params.groupBy ? `<th style="padding: 12px 16px; text-align: left; color: var(--slate-500); text-transform: uppercase; font-size: 11px;">${params.groupBy}</th>` : ''}
                            <th style="padding: 12px 16px; text-align: left; color: var(--slate-500); text-transform: uppercase; font-size: 11px;">${params.metric} Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderTableRows(data, params)}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        this.lastCustomData = data;
        this.lastCustomParams = params;
    },

    renderTableRows(data, params) {
        if (params.groupBy && Array.isArray(data)) {
            return data.map(row => `
                <tr style="border-bottom: 1px solid var(--slate-50);">
                    <td style="padding: 12px 16px;"><span class="project-id">${row[params.groupBy] || 'N/A'}</span></td>
                    <td style="padding: 12px 16px; font-weight: 700; color: var(--slate-900);">${this.formatMetric(row[params.metric] || row.count || row.sum || row.avg)}</td>
                </tr>
            `).join('');
        } else {
            const val = data[params.metric] || data.count || data.sum || data.avg;
            return `
                <tr>
                    <td colspan="2" style="font-weight: 700; color: var(--orange); font-size: 32px; padding: 48px; text-align: center;">${this.formatMetric(val)}</td>
                </tr>
            `;
        }
    },

    formatMetric(val) {
        if (typeof val === 'number') {
            if (val > 1000) return val.toLocaleString();
            if (val % 1 !== 0) return val.toFixed(2);
        }
        return val || '0';
    },

    async exportReport(reportId, format) {
        window.toast.show(`Preparing ${format.toUpperCase()} report...`, 'info');
        
        let params = {};
        if (reportId === 'pm_portfolio') {
            params = { model: 'project', metric: 'list', groupBy: 'status' };
        } else if (reportId === 'pm_timeline') {
            params = { model: 'task', metric: 'avg', field: 'progress', groupBy: 'statusClass' };
        } else if (reportId === 'field_burn_rate') {
            params = { model: 'materialUsage', metric: 'sum', field: 'quantity', groupBy: 'materialName' };
        } else if (reportId === 'finance_budget') {
            params = { model: 'dailyLog', metric: 'sum', field: 'expenseAmount', groupBy: 'projectId' };
        }

        const queryString = new URLSearchParams({ ...params, format }).toString();
        window.open(`/api/v1/reports/dynamic?${queryString}`, '_blank');
        window.toast.show(`${reportId.replace(/_/g, ' ')} exported successfully.`, 'success');
    },

    async exportCustom(format) {
        if (!this.lastCustomParams) {
            window.toast.show('Please generate a report first.', 'warning');
            return;
        }
        
        window.toast.show(`Generating Custom ${format.toUpperCase()}...`, 'info');
        const queryString = new URLSearchParams({ 
            ...this.lastCustomParams, 
            format: format 
        }).toString();
        
        window.open(`/api/v1/reports/dynamic?${queryString}`, '_blank');
    },

    init() {
        window.app = window.app || {};
        window.app.reports = this;
    }
};
