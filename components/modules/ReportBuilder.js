/**
 * MCMS Report Builder Module
 * Framework-agnostic dynamic reporting component
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

        window.reportBuilder = this; // Global reference for event handlers

        this.showLoading();
        await Promise.all([
            this.fetchCatalog(),
            this.fetchConfig()
        ]);
        this.render();
    }

    async fetchCatalog() {
        try {
            const res = await fetch('/api/v1/reports/catalog', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('mcms_auth_token')}` }
            });
            const data = await res.json();
            this.catalog = data.data || [];
        } catch (err) {
            console.error('Failed to fetch catalog', err);
        }
    }

    async fetchConfig() {
        try {
            const res = await fetch('/api/v1/reports/config', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('mcms_auth_token')}` }
            });
            const data = await res.json();
            this.config = data.data || { projects: [], statuses: [], categories: [] };
        } catch (err) {
            console.error('Failed to fetch config', err);
        }
    }

    async runReport() {
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
            this.data = data.data;
        } catch (err) {
            console.error('Failed to run report', err);
            window.toast?.show('Failed to generate report', 'error');
        } finally {
            this.loading = false;
            this.render();
            this.initChart();
        }
    }

    async exportReport(format) {
        if (!this.currentReport) return;
        
        const params = new URLSearchParams({
            format,
            reportCode: this.currentReport.code,
            ...this.filters
        });

        // For CSV/PDF we use a direct link or fetch with blob
        const url = `/api/v1/reports/run?${params.toString()}`;
        
        try {
            const res = await fetch(url, {
                method: 'POST', // The endpoint is POST
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('mcms_auth_token')}` 
                },
                body: JSON.stringify({
                    reportCode: this.currentReport.code,
                    filters: this.filters
                })
            });

            if (format === 'json') {
                const data = await res.json();
                console.log('JSON Data:', data);
                return;
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${this.currentReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Export failed', err);
        }
    }

    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="flex items-center justify-center p-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            `;
        }
    }

    handleFilterChange(e) {
        const { name, value } = e.target;
        this.filters[name] = value;
    }

    selectReport(code) {
        this.currentReport = this.catalog.find(r => r.code === code);
        this.data = null;
        this.filters.chartField = this.currentReport?.numericFields[0] || '';
        this.render();
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
                    backgroundColor: 'rgba(249, 116, 21, 0.6)',
                    borderColor: 'rgb(249, 116, 21)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="report-builder-grid">
                <!-- Sidebar: Catalog -->
                <aside class="report-catalog-sidebar bg-white border-r border-slate-200 overflow-y-auto">
                    <div class="p-4 border-b border-slate-200">
                        <h3 class="font-bold text-slate-800 flex items-center gap-2">
                            <span class="material-symbols-outlined text-orange-500">analytics</span>
                            Report Catalog
                        </h3>
                    </div>
                    <div class="catalog-list">
                        ${this.renderCatalog()}
                    </div>
                </aside>

                <!-- Main Content -->
                <main class="report-main-content bg-slate-50 overflow-y-auto">
                    ${this.currentReport ? this.renderActiveReport() : this.renderEmptyState()}
                </main>
            </div>
        `;

        this.attachEventListeners();
    }

    renderCatalog() {
        const grouped = this.catalog.reduce((acc, r) => {
            if (!acc[r.category]) acc[r.category] = [];
            acc[r.category].push(r);
            return acc;
        }, {});

        return Object.entries(grouped).map(([category, reports]) => `
            <div class="catalog-group">
                <div class="px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    ${category}
                </div>
                ${reports.map(r => `
                    <button class="catalog-item w-full text-left px-4 py-3 text-sm transition-colors border-b border-slate-50 ${this.currentReport?.code === r.code ? 'bg-orange-50 text-orange-600 font-bold border-l-4 border-l-orange-500' : 'text-slate-600 hover:bg-slate-50'}"
                        onclick="window.reportBuilder.selectReport('${r.code}')">
                        <span class="text-[10px] text-slate-400 block mb-0.5">${r.code}</span>
                        ${r.name}
                    </button>
                `).join('')}
            </div>
        `).join('');
    }

    renderEmptyState() {
        return `
            <div class="flex flex-col items-center justify-center h-full text-slate-400 p-20">
                <span class="material-symbols-outlined text-6xl mb-4">analytics</span>
                <p class="text-lg">Select a report from the catalog to begin</p>
                <p class="text-sm">Comprehensive financial and operational analytics at your fingertips.</p>
            </div>
        `;
    }

    renderActiveReport() {
        return `
            <!-- Control Panel -->
            <div class="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
                <div class="flex flex-wrap items-end gap-4">
                    <div class="flex-1">
                        <h2 class="text-xl font-bold text-slate-800">${this.currentReport.name}</h2>
                        <p class="text-xs text-slate-500">Category: ${this.currentReport.category} | Model: ${this.currentReport.model}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.reportBuilder.exportReport('csv')" class="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[18px]">download</span> CSV
                        </button>
                        <button onclick="window.reportBuilder.exportReport('pdf')" class="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
                        </button>
                        <button onclick="window.print()" class="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[18px]">print</span> Print
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-5 gap-3 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div class="form-group-sm">
                        <label class="text-[10px] font-bold text-slate-500 uppercase">Project</label>
                        <select name="projectId" class="report-filter-select w-full text-xs p-1.5 rounded border border-slate-200">
                            <option value="">All Projects</option>
                            ${this.config.projects.map(p => `<option value="${p.id}" ${this.filters.projectId == p.id ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group-sm">
                        <label class="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                        <select name="status" class="report-filter-select w-full text-xs p-1.5 rounded border border-slate-200">
                            <option value="">All Statuses</option>
                            ${this.config.statuses.map(s => `<option value="${s}" ${this.filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group-sm">
                        <label class="text-[10px] font-bold text-slate-500 uppercase">From Date</label>
                        <input type="date" name="dateFrom" value="${this.filters.dateFrom}" class="report-filter-select w-full text-xs p-1.5 rounded border border-slate-200">
                    </div>
                    <div class="form-group-sm">
                        <label class="text-[10px] font-bold text-slate-500 uppercase">To Date</label>
                        <input type="date" name="dateTo" value="${this.filters.dateTo}" class="report-filter-select w-full text-xs p-1.5 rounded border border-slate-200">
                    </div>
                    <div class="flex items-end">
                        <button onclick="window.reportBuilder.runReport()" class="w-full bg-orange-500 text-white font-bold py-1.5 rounded hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm" ${this.loading ? 'disabled' : ''}>
                            ${this.loading ? '<div class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div> Running...' : '<span class="material-symbols-outlined text-[16px]">play_arrow</span> Run Analysis'}
                        </button>
                    </div>
                </div>
            </div>

            <div class="p-6">
                ${this.data ? this.renderReportResults() : `
                    <div class="bg-white rounded-xl border border-slate-200 p-20 text-center">
                        <div class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-4">
                            <span class="material-symbols-outlined text-3xl">play_circle</span>
                        </div>
                        <h3 class="text-slate-800 font-bold text-lg">Ready to Generate</h3>
                        <p class="text-slate-500 text-sm max-w-xs mx-auto mt-1">Adjust your filters above and click "Run Analysis" to fetch live data.</p>
                    </div>
                `}
            </div>
        `;
    }

    renderReportResults() {
        return `
            <!-- Summary Stats -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                ${Object.entries(this.data.summary).map(([label, val]) => `
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${label}</div>
                        <div class="text-xl font-bold text-slate-800">${typeof val === 'number' ? val.toLocaleString() : val}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Visualization Area -->
            ${this.currentReport.numericFields.length > 0 ? `
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div class="flex justify-between items-center mb-6">
                        <h4 class="font-bold text-slate-800 flex items-center gap-2">
                            <span class="material-symbols-outlined text-orange-500">bar_chart</span>
                            Data Visualization
                        </h4>
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] font-bold text-slate-500">Metric:</label>
                            <select name="chartField" class="report-filter-select text-[10px] border border-slate-200 rounded px-2 py-1" onchange="window.reportBuilder.handleFilterChange(event); window.reportBuilder.initChart();">
                                ${this.currentReport.numericFields.map(f => `<option value="${f}" ${this.filters.chartField === f ? 'selected' : ''}>${f}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="h-[300px]">
                        <canvas id="reportChart"></canvas>
                    </div>
                </div>
            ` : ''}

            <!-- Data Table -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h4 class="font-bold text-slate-800 text-sm">Data Records (${this.data.rows.length})</h4>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input type="text" placeholder="Search records..." class="pl-8 pr-4 py-1.5 text-xs rounded-full border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all w-64">
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="bg-slate-50">
                                ${this.data.columns.map(col => `
                                    <th class="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <div class="flex items-center gap-1">
                                            ${col}
                                            <span class="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100">unfold_more</span>
                                        </div>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.rows.length ? this.data.rows.map(row => `
                                <tr class="hover:bg-orange-50/30 transition-colors group">
                                    ${this.data.columns.map(col => {
                                        const val = row[col];
                                        const isNumeric = this.currentReport.numericFields.includes(col);
                                        return `
                                            <td class="px-4 py-3 border-b border-slate-50 font-medium ${isNumeric ? 'text-slate-900' : 'text-slate-600'}">
                                                ${this.formatValue(val, col)}
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="${this.data.columns.length}" class="px-4 py-10 text-center text-slate-400">No records found matching your filters.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    formatValue(val, col) {
        if (val === null || val === undefined) return '-';
        if (typeof val === 'number') {
            if (col.toLowerCase().includes('percent') || col.includes('%')) return `${val}%`;
            if (col.toLowerCase().includes('value') || col.toLowerCase().includes('total') || col.toLowerCase().includes('budget') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('spent') || col.toLowerCase().includes('remaining')) {
                return val.toLocaleString('en-MW', { style: 'currency', currency: 'MWK', maximumFractionDigits: 0 });
            }
            return val.toLocaleString();
        }
        
        // Status formatting
        if (col.toLowerCase() === 'status') {
            const statusColors = {
                'active': 'bg-green-100 text-green-700',
                'pending': 'bg-orange-100 text-orange-700',
                'completed': 'bg-blue-100 text-blue-700',
                'on_hold': 'bg-slate-100 text-slate-700',
                'rejected': 'bg-red-100 text-red-700',
                'approved': 'bg-emerald-100 text-emerald-700'
            };
            const color = statusColors[val.toLowerCase()] || 'bg-slate-100 text-slate-700';
            return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${color}">${val}</span>`;
        }

        return val;
    }

    attachEventListeners() {
        const selects = this.container.querySelectorAll('.report-filter-select');
        selects.forEach(s => {
            s.addEventListener('change', (e) => this.handleFilterChange(e));
        });

        const searchInput = this.container.querySelector('input[placeholder="Search records..."]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = this.container.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(term) ? '' : 'none';
                });
            });
        }
    }
}
