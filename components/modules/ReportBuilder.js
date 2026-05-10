/**
 * MCMS Report Engine - Unified Dashboard Version
 * Single-screen UI with integrated control panel.
 */

export class ReportBuilder {
    constructor() {
        this.container = null;
        this.catalog = [];
        this.config = { projects: [], statuses: [], categories: [] };
        this.currentReport = null;
        this.filters = {
            projectId: '',
            status: '',
            dateFrom: '',
            dateTo: '',
            chartField: ''
        };
        this.data = null;
        this.chart = null;
        this.loading = false;
    }

    async init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        window.reportBuilder = this;

        // Ensure full Material Symbols library is loaded for reporting icons
        if (!document.getElementById('rb-material-symbols')) {
            const link = document.createElement('link');
            link.id = 'rb-material-symbols';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
            document.head.appendChild(link);
        }

        this.showLoading();
        try {
            await Promise.all([
                this.fetchCatalog(),
                this.fetchConfig()
            ]);
            
            // Auto-select first report if catalog isn't empty, to avoid empty states if possible
            // Actually, better to let the user select so we don't spam the DB.
            this.render();
        } catch (err) {
            console.error('Initialization failed', err);
            this.container.innerHTML = `<div class="rb-empty-state"><h3>Connection Error</h3><p>Could not load reporting metadata.</p></div>`;
        }
    }

    async fetchCatalog() {
        const res = await fetch('/api/v1/reports/catalog', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('mcms_auth_token')}` }
        });
        const data = await res.json();
        this.catalog = data.data || [];
    }

    async fetchConfig() {
        const res = await fetch('/api/v1/reports/config', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('mcms_auth_token')}` }
        });
        const data = await res.json();
        this.config = data.data || { projects: [], statuses: [], categories: [] };
    }

    async runAnalysis() {
        if (!this.currentReport) return;
        this.loading = true;
        this.render();

        try {
            const res = await fetch('/api/v1/reports/run', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('mcms_auth_token')}` 
                },
                body: JSON.stringify({
                    reportCode: this.currentReport.code,
                    filters: this.filters
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Execution failed');
            this.data = data.data;
        } catch (err) {
            console.error('Failed to run report', err);
            window.toast?.show(err.message, 'error');
        } finally {
            this.loading = false;
            this.render();
            this.initChart();
        }
    }

    async export(format) {
        if (!this.currentReport) return;
        window.toast?.show(`Preparing ${format.toUpperCase()}...`, 'info');

        try {
            const res = await fetch('/api/v1/reports/run', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('mcms_auth_token')}` 
                },
                body: JSON.stringify({
                    reportCode: this.currentReport.code,
                    filters: { ...this.filters, format }
                })
            });

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${this.currentReport.name.replace(/\s+/g, '_')}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            window.toast?.show('Export complete.', 'success');
        } catch (err) {
            console.error('Export failed', err);
            window.toast?.show('Export failed.', 'error');
        }
    }

    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="rb-empty-state" style="padding: 40px;">
                    <div class="rb-loader" style="width: 24px; height: 24px; border-width: 3px;"></div>
                    <p style="margin-top: 12px; font-size: 0.85rem;">Booting Analytics Center...</p>
                </div>
            `;
        }
    }

    handleFilterChange(e) {
        const { name, value } = e.target;
        
        if (name === 'reportSelect') {
            this.currentReport = this.catalog.find(r => r.code === value) || null;
            this.data = null;
            if (this.currentReport) {
                this.filters.chartField = this.currentReport.numericFields[0] || '';
            }
            this.render();
            return;
        }

        this.filters[name] = value;
    }

    initChart() {
        if (!this.data || !this.data.chartData || !this.data.chartData.labels.length) return;

        const ctx = document.getElementById('reportChart')?.getContext('2d');
        if (!ctx) return;

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.data.chartData.labels,
                datasets: [{
                    label: this.filters.chartField,
                    data: this.data.chartData.values,
                    backgroundColor: 'rgba(249, 116, 21, 0.7)',
                    borderColor: 'rgb(249, 116, 21)',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="report-engine-container animate-view">
                ${this.renderControlPanel()}
                <div class="results-container">
                    ${this.data ? this.renderResults() : this.renderEmptyState()}
                </div>
            </div>
        `;

        this.attachEventListeners();
        if (this.data) this.initChart();
    }

    renderControlPanel() {
        const categories = [...new Set(this.catalog.map(r => r.category))];
        
        return `
            <div class="report-view-header">
                <div class="report-header-main" style="align-items: center;">
                    <div class="report-header-info" style="display: flex; align-items: center; gap: 12px;">
                        <div class="kpi-icon" style="width: 36px; height: 36px; background: #fff7ed; color: var(--rb-accent); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="font-size: 20px;">analytics</span>
                        </div>
                        <div>
                            <h2 style="font-size: 1.25rem; font-weight: 900; margin: 0; color: var(--rb-dark);">Analytics Center</h2>
                            <p style="font-size: 0.75rem; color: var(--rb-text-light); margin: 0; margin-top: 2px;">Unified Reporting Dashboard</p>
                        </div>
                    </div>
                    ${this.currentReport && this.data ? `
                        <div class="report-actions-integrated">
                            <button class="btn-report-action" onclick="window.reportBuilder.export('csv')">
                                <span class="material-symbols-outlined" style="font-size: 18px;">download</span> CSV
                            </button>
                            <button class="btn-report-action" onclick="window.reportBuilder.export('pdf')">
                                <span class="material-symbols-outlined" style="font-size: 18px;">picture_as_pdf</span> PDF
                            </button>
                        </div>
                    ` : ''}
                </div>

                <div class="controls-grid" style="margin-top: 16px; padding: 16px; gap: 16px;">
                    <div class="control-item" style="grid-column: 1 / -1;">
                        <label>Select Analytical Report</label>
                        <select name="reportSelect" class="report-input" style="font-weight: 700; font-size: 0.85rem; padding: 8px 12px; height: 38px;">
                            <option value="">-- Choose a report to analyze --</option>
                            ${categories.map(cat => `
                                <optgroup label="${cat.toUpperCase()}" style="font-weight: 800; background: var(--rb-bg);">
                                    ${this.catalog.filter(r => r.category === cat).map(r => `
                                        <option value="${r.code}" ${this.currentReport?.code === r.code ? 'selected' : ''} style="font-weight: 500; background: white;">
                                            ${r.code} - ${r.name}
                                        </option>
                                    `).join('')}
                                </optgroup>
                            `).join('')}
                        </select>
                    </div>

                    <div class="control-item">
                        <label>Project Scope</label>
                        <select name="projectId" class="report-input">
                            <option value="">Global (All Projects)</option>
                            ${this.config.projects.map(p => `<option value="${p.id}" ${this.filters.projectId == p.id ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="control-item">
                        <label>Status Filter</label>
                        <select name="status" class="report-input">
                            <option value="">All Statuses</option>
                            ${this.config.statuses.map(s => `<option value="${s}" ${this.filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="control-item">
                        <label>Start Date</label>
                        <input type="date" name="dateFrom" value="${this.filters.dateFrom}" class="report-input">
                    </div>
                    <div class="control-item">
                        <label>End Date</label>
                        <input type="date" name="dateTo" value="${this.filters.dateTo}" class="report-input">
                    </div>
                    <div class="control-item" style="justify-content: flex-end;">
                        <button class="btn-report-action primary" style="width: 100%; justify-content: center; height: 38px; font-size: 0.8rem;" onclick="window.reportBuilder.runAnalysis()" ${this.loading || !this.currentReport ? 'disabled' : ''}>
                            ${this.loading ? '<div class="rb-loader" style="width:14px; height:14px; border-width:2px;"></div>' : '<span class="material-symbols-outlined" style="font-size: 16px;">play_arrow</span> Run Analysis'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="rb-empty-state" style="background: white; border-radius: 12px; border: 1px solid var(--rb-border); padding: 40px 20px;">
                <div style="width: 64px; height: 64px; background: var(--rb-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                    <span class="material-symbols-outlined" style="font-size: 32px; color: var(--rb-accent);">query_stats</span>
                </div>
                <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--rb-dark); margin: 0 0 8px 0;">Ready for Analysis</h3>
                <p style="color: var(--rb-text-light); max-width: 400px; margin: 0 auto; font-size: 0.8rem;">Select a report from the dropdown above and configure your filters to instantly retrieve live operational and financial data.</p>
            </div>
        `;
    }

    renderResults() {
        return `
            <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--rb-border);">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 900; color: var(--rb-dark);">${this.currentReport.name} Results</h3>
                <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--rb-text-light);">Generated just now</p>
            </div>

            <div class="summary-strip">
                ${Object.entries(this.data.summary).map(([label, val]) => `
                    <div class="kpi-card">
                        <div class="kpi-icon">
                            <span class="material-symbols-outlined">trending_up</span>
                        </div>
                        <div class="kpi-data">
                            <div class="label">${label}</div>
                            <div class="value">${this.formatValue(val, label)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="integrated-table-wrapper animate-view" style="margin-bottom: 32px;">
                <div class="table-top-bar">
                    <h4 style="font-size: 1rem; font-weight: 800; color: var(--rb-dark); margin: 0;">Detailed Records (${this.data.rows.length})</h4>
                    <div class="table-search">
                        <span class="material-symbols-outlined" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:18px; color:var(--rb-text-light);">search</span>
                        <input type="text" placeholder="Search within results..." oninput="window.reportBuilder.filterTable(this.value)">
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table class="integrated-table">
                        <thead>
                            <tr>${this.data.columns.map(c => `<th>${c}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${this.data.rows.map(row => `
                                <tr>${this.data.columns.map(col => `<td>${this.formatCell(row[col], col)}</td>`).join('')}</tr>
                            `).join('')}
                            ${this.data.rows.length === 0 ? `<tr><td colspan="${this.data.columns.length}" style="text-align: center; padding: 40px; color: var(--rb-text-light);">No data found for the selected filters.</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            ${this.currentReport.numericFields.length > 0 ? `
                <div class="rb-visualization-card animate-view">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--rb-dark); margin: 0;">Data Visualization</h4>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-size: 11px; font-weight: 800; color: var(--rb-text-light);">METRIC:</label>
                            <select name="chartField" class="report-input" style="padding: 4px 8px; font-size: 11px; width: auto;" onchange="window.reportBuilder.handleFilterChange(event); window.reportBuilder.initChart();">
                                ${this.currentReport.numericFields.map(f => `<option value="${f}" ${this.filters.chartField === f ? 'selected' : ''}>${f}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div style="height: 350px;">
                        <canvas id="reportChart"></canvas>
                    </div>
                </div>
            ` : ''}
        `;

    }

    formatValue(val, label) {
        if (typeof val === 'number') {
            if (label.toLowerCase().includes('value') || label.toLowerCase().includes('cost') || label.toLowerCase().includes('budget') || label.toLowerCase().includes('spent')) {
                return val.toLocaleString('en-MW', { style: 'currency', currency: 'MWK', maximumFractionDigits: 0 });
            }
            return val.toLocaleString();
        }
        return val;
    }

    formatCell(val, col) {
        if (val === null || val === undefined) return '-';
        if (typeof val === 'number') {
            if (col.toLowerCase().includes('percent') || col.includes('%')) return `${val}%`;
            if (col.toLowerCase().includes('value') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('budget') || col.toLowerCase().includes('spent') || col.toLowerCase().includes('remaining')) {
                return val.toLocaleString('en-MW', { style: 'currency', currency: 'MWK', maximumFractionDigits: 0 });
            }
            return val.toLocaleString();
        }
        if (col.toLowerCase() === 'status') {
            const colors = { 'active': '#f0fdf4; color: #166534', 'completed': '#eff6ff; color: #1e40af', 'pending': '#fff7ed; color: #9a3412', 'rejected': '#fef2f2; color: #991b1b', 'on_site': '#f0fdf4; color: #166534' };
            const style = colors[val.toLowerCase()] || '#f1f5f9; color: #475569';
            return `<span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; background: ${style}">${val}</span>`;
        }
        return val;
    }

    filterTable(term) {
        const query = term.toLowerCase();
        const rows = this.container.querySelectorAll('.integrated-table tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    }

    attachEventListeners() {
        const inputs = this.container.querySelectorAll('.report-input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleFilterChange(e));
        });
    }
}
