import client from '../../src/api/client.js';
import projects from '../../src/api/projects.api.js';

export class ManagingDirectorDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.data = {
            summary: { portfolioValue: 0, activeProjects: 0, margin: 12.4, cashFlow: 'Healthy', risks: 0 },
            rankings: []
        };
        window.app = window.app || {};
        window.app.mdModule = this;
    }

    render() {
        return this.getTemplate();
    }

    getTemplate() {
        return `
            <div id="md-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content">
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'strategy': return this.getStrategyView();
            case 'pnl': return this.getPnlView();
            case 'risk': return this.getRiskView();
            case 'portfolio': return this.getPortfolioView();
            case 'clients': return this.getClientsView();
            case 'reports': return this.getReportsView();
            default: return `<div class="p-4">View ${this.currentView} not found</div>`;
        }
    }

    getHeaderHTML() {
        const headers = {
            'dashboard': { title: 'Dashboard', context: 'Strategic Summary' },
            'strategy': { title: 'Strategy Map', context: 'Long Term Vision' },
            'pnl': { title: 'P&L Overview', context: 'Financial Health' },
            'risk': { title: 'Risk Management', context: 'Enterprise Risk Matrix' },
            'portfolio': { title: 'Dashboard', context: 'All Active Projects' },
            'clients': { title: 'Key Accounts', context: 'Client Relationships' },
            'reports': { title: 'Reporting Center', context: 'Custom Analytics & Exports' }
        };
        const current = headers[this.currentView] || { title: 'Executive View', context: '' };

        return `
            <div class="page-header">
                <div class="breadcrumb">
                  <span>Workspace</span>
                  <i class="fas fa-chevron-right" style="font-size: 9px;"></i>
                  <span>${current.title}</span>
                </div>
                <div class="page-title-row">
                  <div>
                    <h1 class="page-title">${current.title}</h1>
                    <div class="context-strip">
                      <span class="context-value">${current.context}</span>
                      ${this.currentView === 'dashboard' ? `
                           <div class="context-dot"></div>
                           <span class="context-value">${this.formatCurrency(this.data.summary.portfolioValue)}</span> Portfolio Value
                      ` : ''}
                    </div>
                  </div>
                  <button class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i>
                    <span>Print Report</span>
                  </button>
                </div>
            </div>
        `;
    }

    getDashboardView() {
        setTimeout(() => this.loadDashboardData(), 0);
        return `
            ${this.getStatsGridHTML()}
            ${this.getExecutiveSummaryHTML()}
        `;
    }

    getStatsGridHTML() {
        const s = this.data.summary;
        return `
            <div class="stats-grid">
               <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">Net Margin</span>
                    <i class="fas fa-chart-line" style="color: var(--emerald);"></i>
                  </div>
                  <div class="stat-value">${s.margin}%</div>
                  <div class="stat-sub" style="color: var(--emerald);"><i class="fas fa-arrow-up"></i> Live Performance</div>
               </div>
               
               <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">Contract Value</span>
                    <i class="fas fa-coins" style="color: var(--blue);"></i>
                  </div>
                  <div class="stat-value">${this.formatCurrency(s.activeContractValue)}</div>
                  <div class="stat-sub">Active Commitments</div>
               </div>
 
                <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">Active Projects</span>
                    <i class="fas fa-chart-simple" style="color: var(--slate-600);"></i>
                  </div>
                  <div class="stat-value">${s.activeProjects}</div>
                  <div class="stat-sub">Running Portfolio</div>
               </div>
 
               <div class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">Open Issues</span>
                    <i class="fas fa-bolt" style="color: var(--red);"></i>
                  </div>
                  <div class="stat-value">${s.openIssues}</div>
                  <div class="stat-sub">Action Required</div>
               </div>
            </div>
        `;
    }

    getExecutiveSummaryHTML() {
        return `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="data-card">
              <div class="data-card-header">
                <div class="card-title">Project Performance Ranking</div>
                <button class="btn btn-secondary" onclick="window.app.mdModule.loadDashboardData()"><i class="fas fa-sync"></i> Refresh</button>
              </div>
              
              <div id="md-rankings-container">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Progress</th>
                      <th>Budget Util.</th>
                      <th>Issues</th>
                      <th>Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.renderRankingRows()}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="data-card" style="padding: 24px;">
                <div class="card-title" style="margin-bottom: 16px;">Strategic Initiatives</div>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="padding: 12px; background: var(--slate-50); border-radius: 6px; border-left: 3px solid var(--blue);">
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Growth</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Northern Region Expansion</div>
                        <div style="font-size: 12px; color: var(--slate-600);">Land acquisition phase. 40% Complete.</div>
                    </div>
                    
                    <div style="padding: 12px; background: var(--slate-50); border-radius: 6px; border-left: 3px solid var(--emerald);">
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Technology</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Digital Site Logs</div>
                        <div style="font-size: 12px; color: var(--slate-600);">Rollout active. 90% Adoption.</div>
                    </div>

                     <div style="padding: 12px; background: var(--slate-50); border-radius: 6px; border-left: 3px solid var(--orange);">
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Compliance</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">ISO 9001 Certification</div>
                        <div style="font-size: 12px; color: var(--slate-600);">Audit scheduled for March.</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    getStrategyView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Strategy Map 2025</div>
                </div>
                <div style="padding:40px; text-align:center;">
                    <!-- Placeholder visual for strategy map -->
                    <div style="display:flex; justify-content:center; gap:40px;">
                        <div style="width:200px; padding:20px; border:2px dashed var(--blue); border-radius:8px;">
                            <div style="font-weight:700; color:var(--blue); margin-bottom:8px;">Financial</div>
                            <div style="font-size:13px;">Maximize Shareholder Value</div>
                        </div>
                         <div style="width:200px; padding:20px; border:2px dashed var(--emerald); border-radius:8px;">
                            <div style="font-weight:700; color:var(--emerald); margin-bottom:8px;">Customer</div>
                            <div style="font-size:13px;">Market Leader in Quality</div>
                        </div>
                         <div style="width:200px; padding:20px; border:2px dashed var(--orange); border-radius:8px;">
                            <div style="font-weight:700; color:var(--orange); margin-bottom:8px;">Internal Process</div>
                            <div style="font-size:13px;">Operational Excellence</div>
                        </div>
                    </div>
                    <div style="margin-top:40px; color:var(--slate-500);">Interactive Strategy Map Module Loading...</div>
                </div>
            </div>
        `;
    }

    getPnlView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Profit & Loss Statement (Management View)</div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-secondary">YTD</button>
                        <button class="btn btn-secondary">Q3</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr style="background:var(--slate-50);">
                            <th>Line Item</th>
                            <th style="text-align:right;">Actual (MWK)</th>
                            <th style="text-align:right;">Budget (MWK)</th>
                            <th style="text-align:right;">Variance</th>
                            <th style="text-align:right;">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:700;">Total Revenue</td>
                            <td style="text-align:right; font-weight:700;">1,250,000,000</td>
                            <td style="text-align:right; color:var(--slate-500);">1,100,000,000</td>
                            <td style="text-align:right; color:var(--emerald);">+ 150,000,000</td>
                            <td style="text-align:right; color:var(--emerald);">+ 13.6%</td>
                        </tr>
                        <tr>
                            <td style="padding-left:24px;">Direct Costs (COGS)</td>
                            <td style="text-align:right;">(850,000,000)</td>
                            <td style="text-align:right; color:var(--slate-500);">(780,000,000)</td>
                            <td style="text-align:right; color:var(--red);">- 70,000,000</td>
                            <td style="text-align:right; color:var(--red);">+ 9.0%</td>
                        </tr>
                        <tr style="background:var(--slate-50);">
                            <td style="font-weight:700;">Gross Profit</td>
                            <td style="text-align:right; font-weight:700;">400,000,000</td>
                            <td style="text-align:right; color:var(--slate-500);">320,000,000</td>
                            <td style="text-align:right; color:var(--emerald);">+ 80,000,000</td>
                            <td style="text-align:right; color:var(--emerald);">+ 25%</td>
                        </tr>
                         <tr>
                            <td style="padding-left:24px;">Operating Expenses</td>
                            <td style="text-align:right;">(245,000,000)</td>
                            <td style="text-align:right; color:var(--slate-500);">(220,000,000)</td>
                            <td style="text-align:right; color:var(--red);">- 25,000,000</td>
                            <td style="text-align:right; color:var(--red);">+ 11%</td>
                        </tr>
                         <tr style="border-top:2px solid var(--slate-300);">
                            <td style="font-weight:800; font-size:16px;">Net Profit</td>
                            <td style="text-align:right; font-weight:800; font-size:16px; color:var(--blue);">155,000,000</td>
                            <td style="text-align:right; color:var(--slate-500);">100,000,000</td>
                            <td style="text-align:right; color:var(--emerald); font-weight:700;">+ 55,000,000</td>
                            <td style="text-align:right; color:var(--emerald); font-weight:700;">+ 55%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getRiskView() {
        return `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
                <div class="data-card">
                    <div class="data-card-header">
                        <div class="card-title">Corporate Risk Register</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Risk Description</th>
                                <th>Category</th>
                                <th>Impact</th>
                                <th>Prob.</th>
                                <th>Rating</th>
                                <th>Owner</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight:600;">Fuel Price Volatility</td>
                                <td>Market</td>
                                <td style="color:var(--red);">High</td>
                                <td style="color:var(--orange);">High</td>
                                <td><span class="status rejected">Critical</span></td>
                                <td>Ops Director</td>
                            </tr>
                            <tr>
                                <td style="font-weight:600;">Skilled Labor Shortage</td>
                                <td>Operational</td>
                                <td style="color:var(--orange);">Medium</td>
                                <td style="color:var(--red);">High</td>
                                <td><span class="status locked">High</span></td>
                                <td>HR Head</td>
                            </tr>
                             <tr>
                                <td style="font-weight:600;">Regulatory Changes</td>
                                <td>Compliance</td>
                                <td style="color:var(--red);">High</td>
                                <td style="color:var(--emerald);">Low</td>
                                <td><span class="status pending">Medium</span></td>
                                <td>Legal</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                 <div class="data-card" style="padding:24px; text-align:center;">
                    <div class="card-title" style="margin-bottom:24px;">Risk Heatmap</div>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:4px; font-size:12px; font-weight:700; color:white;">
                         <div style="background:var(--emerald); padding:20px; border-radius:4px;">Low/Low</div>
                         <div style="background:var(--emerald); padding:20px; border-radius:4px;">Low/Med</div>
                         <div style="background:var(--orange); padding:20px; border-radius:4px;">Low/High</div>
                         
                         <div style="background:var(--emerald); padding:20px; border-radius:4px;">Med/Low</div>
                         <div style="background:var(--orange); padding:20px; border-radius:4px;">Med/Med</div>
                         <div style="background:var(--red); padding:20px; border-radius:4px;">Med/High</div>

                         <div style="background:var(--orange); padding:20px; border-radius:4px;">High/Low</div>
                         <div style="background:var(--red); padding:20px; border-radius:4px;">High/Med</div>
                         <div style="background:var(--red); padding:20px; border-radius:4px; border:2px solid white;">High/High</div>
                    </div>
                </div>
            </div>
        `;
    }

    getPortfolioView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Project Portfolio Health</div>
                </div>
                 <table>
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Completion</th>
                            <th>Cost Performance</th>
                            <th>Schedule Perf.</th>
                            <th>Quality</th>
                            <th>Overall</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:600;">CEN-01 Unilia</td>
                            <td>
                                <div class="progress-container"><div class="progress-bar" style="width: 45%; background: var(--blue);"></div></div>
                                <div style="font-size:10px; margin-top:2px;">45%</div>
                            </td>
                            <td><span style="color:var(--emerald);">Under Budget</span></td>
                            <td><span style="color:var(--emerald);">Ahead</span></td>
                            <td><span class="status active">A+</span></td>
                             <td><span class="status active">Green</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight:600;">MZ-05 Clinic</td>
                            <td>
                                <div class="progress-container"><div class="progress-bar" style="width: 78%; background: var(--blue);"></div></div>
                                <div style="font-size:10px; margin-top:2px;">78%</div>
                            </td>
                            <td><span style="color:var(--orange);">At Budget</span></td>
                            <td><span style="color:var(--red);">Delayed</span></td>
                            <td><span class="status active">A</span></td>
                             <td><span class="status pending">Amber</span></td>
                        </tr>
                    </tbody>
                 </table>
            </div>
        `;
    }

    getClientsView() {
         return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Top Clients & Accounts</div>
                    <button class="btn btn-secondary">CRM Dashboard</button>
                </div>
                 <table>
                    <thead>
                        <tr>
                            <th>Client Name</th>
                            <th>Sector</th>
                            <th>Total Contract Value</th>
                            <th>Active Projects</th>
                            <th>Relationship Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:600;">Ministry of Health</td>
                            <td>Government</td>
                            <td class="mono-val">MWK 8.5B</td>
                            <td>2</td>
                            <td><span class="status active">Strategic</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">Unilia University</td>
                            <td>Education</td>
                            <td class="mono-val">MWK 1.5B</td>
                            <td>1</td>
                            <td><span class="status active">Good</span></td>
                        </tr>
                         <tr>
                            <td style="font-weight:600;">Press Corp</td>
                            <td>Private</td>
                            <td class="mono-val">MWK 450M</td>
                            <td>0</td>
                            <td><span class="status pending">Targeting</span></td>
                        </tr>
                    </tbody>
                 </table>
            </div>
    }

    getReportsView() {
        // Reuse PM_Reports logic but tailored for MD if needed
        // For now, load the PM_Reports component dynamically
        setTimeout(async () => {
            const { PM_Reports } = await import('./pm/PM_Reports.js');
            const container = document.getElementById('md-reports-root');
            if (container) {
                container.innerHTML = PM_Reports.render();
                PM_Reports.init();
            }
        }, 0);

        return `<div id="md-reports-root">
            <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                <p>Initializing Reporting Engine...</p>
            </div>
        </div>`;
    }

    async loadDashboardData() {
        try {
            const [summaryRes, rankingsRes] = await Promise.all([
                client.get('/reports/executive/summary'),
                client.get('/reports/executive/project-rankings')
            ]);

            const summary = summaryRes.data || {};
            this.data.summary = {
                portfolioValue: summary.financials?.totalBudget || 0,
                activeContractValue: summary.financials?.activeContractValue || 0,
                activeProjects: summary.totalProjects || 0,
                margin: 12.4, // Static for now
                openIssues: summary.openIssues || 0
            };

            this.data.rankings = rankingsRes.data?.rows || rankingsRes.data || [];

            // Update UI
            if (this.currentView === 'dashboard') {
                const module = document.getElementById('md-module');
                if (module) {
                    const header = module.querySelector('.page-header');
                    if (header) header.outerHTML = this.getHeaderHTML();
                    
                    const stats = module.querySelector('.stats-grid');
                    if (stats) stats.outerHTML = this.getStatsGridHTML();
                    
                    const tbody = module.querySelector('#md-rankings-container tbody');
                    if (tbody) tbody.innerHTML = this.renderRankingRows();
                }
            }
        } catch (error) {
            console.error('Failed to load MD data:', error);
        }
    }

    renderRankingRows() {
        if (this.data.rankings.length === 0) {
            return '<tr><td colspan="5" style="text-align:center; padding:20px;">No projects ranked.</td></tr>';
        }
        return this.data.rankings.slice(0, 5).map(row => {
            const health = row.openIssues === 0 && row.avgProgress >= (row.budgetUtilization || 0) ? 'Excellent' : 
                         row.openIssues > 2 ? 'Critical' : 'Good';
            const healthClass = health === 'Excellent' ? 'active' : health === 'Critical' ? 'rejected' : 'pending';
            
            return `
                <tr>
                    <td style="font-weight: 600;">${row.name}</td>
                    <td>${row.avgProgress}%</td>
                    <td>${(row.budgetUtilization || 0).toFixed(1)}%</td>
                    <td>${row.openIssues}</td>
                    <td><span class="status ${healthClass}">${health}</span></td>
                </tr>
            `;
        }).join('');
    }

    formatCurrency(val) {
        if (val >= 1000000000) return 'MWK ' + (val / 1000000000).toFixed(1) + 'B';
        if (val >= 1000000) return 'MWK ' + (val / 1000000).toFixed(1) + 'M';
        return 'MWK ' + (val || 0).toLocaleString();
    }
}
