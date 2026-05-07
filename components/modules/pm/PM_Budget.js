import client from '../../../src/api/client.js';
import projectsApi from '../../../src/api/projects.api.js';
import procurementApi from '../../../src/api/procurement.api.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const PM_Budget = {
    projects: [],
    materialBaselines: {},

    getBudgetView() {
        // Trigger data load
        this.loadPortfolioData();
        
        return `
            <div class="animate-fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h2 style="font-size: 20px; font-weight: 800; color: var(--slate-900);">Project Cost Ledger</h2>
                        <p style="font-size: 13px; color: var(--slate-500);">Comprehensive financial portfolio oversight and variance tracking.</p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" onclick="(window.fmModule || window.pmModule || window.app?.fmModule || window.app?.pmModule).loadPortfolioData()">
                            <i class="fas fa-sync-alt"></i> Refresh Data
                        </button>
                    </div>
                </div>

                <div id="portfolio-grid" style="background: white; border: 1px solid var(--slate-200); border-radius: 8px; overflow-x: auto;">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    },

    async loadPortfolioData() {
        console.log('[PM_Budget] Starting portfolio load...');
        const grid = document.getElementById('portfolio-grid');
        if (!grid) {
            console.warn('[PM_Budget] portfolio-grid element not found. Retrying in 100ms...');
            setTimeout(() => this.loadPortfolioData(), 100);
            return;
        }

        try {
            console.log('[PM_Budget] Fetching projects...');
            const projRes = await projectsApi.getAll();

            console.log('[PM_Budget] Data received:', { projRes });

            this.projects = projRes.data || projRes || [];

            if (this.projects.length === 0) {
                console.log('[PM_Budget] No projects found.');
                grid.innerHTML = this.renderEmptyState('No projects found in the system.');
                return;
            }

            console.log(`[PM_Budget] Rendering ${this.projects.length} project rows...`);
            let tableHTML = `
                <table class="data-table" style="width: 100%; border-collapse: collapse; min-width: 800px;">
                    <thead style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                        <tr>
                            <th style="padding: 16px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Project Code & Name</th>
                            <th style="padding: 16px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Status</th>
                            <th style="padding: 16px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Utilization</th>
                            <th style="padding: 16px; text-align: right; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Total Allocated</th>
                            <th style="padding: 16px; text-align: right; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Actual Spent</th>
                            <th style="padding: 16px; text-align: right; font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 700;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.projects.map(p => this.renderProjectRow(p)).join('')}
                    </tbody>
                </table>
            `;
            grid.innerHTML = tableHTML;
            console.log('[PM_Budget] Portfolio load complete.');
        } catch (error) {
            console.error('[PM_Budget] Portfolio load failed:', error);
            grid.innerHTML = this.renderEmptyState('Failed to load project financial data.');
        }
    },

    renderProjectRow(project) {
        if (!project) return '';
        
        const budget = Number(project.budgetTotal || project.budget || 0);
        const spent = Number(project.budgetSpent || 0);
        const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        const isOver = spent > budget;
        
        const statusColor = percent > 90 ? 'var(--red)' : percent > 75 ? 'var(--amber)' : 'var(--emerald)';
        const status = (project.status || 'PLANNING').toUpperCase();

        return `
            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;">
                <td style="padding: 16px;">
                    <div style="font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 800; color: var(--slate-400); margin-bottom: 4px;">${project.code || 'PRJ-' + project.id}</div>
                    <div style="font-weight: 700; color: var(--slate-900); font-size: 14px;">${this.escapeHTML(project.name || 'Unnamed Project')}</div>
                </td>
                <td style="padding: 16px;">
                    <span class="status ${project.status === 'active' ? 'active' : 'locked'}">${status}</span>
                </td>
                <td style="padding: 16px; width: 200px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                        <span style="font-weight: 800; color: ${statusColor};">${percent}%</span>
                    </div>
                    <div class="budget-bar-bg" style="height: 6px; background: var(--slate-100); border-radius: 3px; overflow: hidden;">
                        <div class="budget-bar-fill ${percent > 90 ? 'danger' : percent > 75 ? 'warn' : ''}" 
                             style="width: ${Math.min(percent, 100)}%; height: 100%; border-radius: 3px;"></div>
                    </div>
                </td>
                <td style="padding: 16px; text-align: right; font-weight: 700; color: var(--slate-900);">
                    MWK ${budget.toLocaleString()}
                </td>
                <td style="padding: 16px; text-align: right; font-weight: 700; color: ${isOver ? 'var(--red)' : 'var(--slate-900)'};">
                    MWK ${spent.toLocaleString()}
                </td>
                <td style="padding: 16px; text-align: right;">
                    <button class="btn btn-secondary btn-sm" onclick="(window.fmModule || window.pmModule || window.app?.fmModule || window.app?.pmModule).openProjectLedger(${project.id})">
                        <i class="fas fa-magnifying-glass-chart"></i> View Ledger
                    </button>
                </td>
            </tr>
        `;
    },

    async openProjectLedger(projectId) {
        window.drawer.open('Project Financial Audit', `
            <div id="ledger-detail-container" style="padding: 24px;">
                <div style="display: flex; align-items: center; justify-content: center; padding: 40px;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange);"></i>
                </div>
            </div>
        `, 'lg');

        try {
            const project = this.projects.find(p => p.id === projectId);
            const [contractsRes, bcrRes, assetsRes] = await Promise.all([
                client.get(`/contracts?projectId=${projectId}&limit=20`).catch(err => { console.warn('Contracts fetch failed:', err); return []; }),
                client.get('/budget-changes?projectId=' + projectId).catch(err => { console.warn('BCR fetch failed:', err); return []; }),
                client.get('/assets?currentProjectId=' + projectId).catch(err => { console.warn('Assets fetch failed:', err); return []; })
            ]);

            const contracts = contractsRes.data || contractsRes || [];
            const bcrs = bcrRes.data || bcrRes || [];
            const allAssets = assetsRes.data || assetsRes || [];
            const projectAssets = allAssets.filter(a => Number(a.currentProjectId) === Number(projectId));

            // Group data by contract for variance reporting
            // Market baseline = item.totalCost (qty × market unitPrice, stored at contract creation from road spec)
            // Actual total = contract.value (the real negotiated price the FD got)
            const allItems = [];
            contracts.forEach(c => {
                const contractValue = Number(c.value || 0);
                const itemMarketTotal = (c.items || []).reduce((sum, i) => sum + Number(i.totalCost || 0), 0);
                if (c.items && c.items.length > 0) {
                    c.items.forEach(i => {
                        // For multi-item contracts, proportionally split the actual contract value
                        const itemShare = itemMarketTotal > 0 
                            ? (Number(i.totalCost || 0) / itemMarketTotal) * contractValue 
                            : contractValue / c.items.length;
                        allItems.push({ 
                            ...i, 
                            contractRef: c.refCode, 
                            vendor: c.vendorName,
                            contractStatus: c.status,
                            actualTotal: itemShare // Proportional share of FD's negotiated price
                        });
                    });
                }
            });

            this.renderLedgerDetail(project, allItems, bcrs, projectAssets);
        } catch (error) {
            console.error('[PM_Budget] Ledger load failed:', error);
            document.getElementById('ledger-detail-container').innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <div style="font-weight: 700;">Audit Data Unavailable</div>
                    <p style="font-size: 12px;">The financial records for this project could not be retrieved at this time.</p>
                </div>
            `;
        }
    },

    renderLedgerDetail(project, items, bcrs, assets) {
        const container = document.getElementById('ledger-detail-container');
        if (!container) return;

        const budget = Number(project.budgetTotal || 0);
        const spent = Number(project.budgetSpent || 0);
        const status = spent > budget ? 'OVER BUDGET' : 'UNDER BUDGET';
        const statusCls = spent > budget ? 'rejected' : 'active';

        container.innerHTML = `
            <div style="margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
                    <div>
                        <h3 style="font-size: 24px; font-weight: 900; color: var(--slate-900);">${project.name}</h3>
                        <div style="display: flex; gap: 8px; margin-top: 4px;">
                            <span class="project-id">${project.code}</span>
                            <span class="status ${statusCls}">${status}</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">Real-time Utilization</div>
                        <div style="font-size: 28px; font-weight: 900; color: var(--slate-900);">${budget > 0 ? Math.round((spent/budget)*100) : 0}%</div>
                    </div>
                </div>
            </div>

            <!-- Material Variance Section -->
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header">
                    <div class="card-title"><i class="fas fa-boxes-stacked" style="margin-right: 8px; color: var(--orange);"></i> Material Procurement Variance</div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; font-size: 12px;">
                        <thead>
                            <tr>
                                <th>Material / Item</th>
                                <th>Ref</th>
                                <th>Market Baseline (Total)</th>
                                <th>Actual Total</th>
                                <th>Variance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--slate-400);">No material procurement records found.</td></tr>' : ''}
                            ${items.map(item => {
                                const qty = Number(item.quantity || 0);
                                const receivedQty = Number(item.receivedQty || 0);
                                const isTerminated = item.contractStatus === 'cancelled' || item.contractStatus === 'terminated';
                                
                                const calcQty = isTerminated ? receivedQty : qty;

                                const marketUnitPrice = Number(item.unitPrice || 0); 
                                const actualTotalNegotiated = Math.round(Number(item.actualTotal || 0)); 
                                const actualUnitPrice = qty > 0 ? (actualTotalNegotiated / qty) : 0;
                                
                                const marketTotal = marketUnitPrice * calcQty;
                                const actualTotal = Math.round(actualUnitPrice * calcQty);

                                const diff = actualTotal - marketTotal;
                                let diffPct = 0;
                                if (calcQty > 0) {
                                    diffPct = marketTotal > 0 ? (diff / marketTotal) * 100 : (actualTotal > 0 ? 100 : 0);
                                }
                                const isHigh = diff > 0;

                                return `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 700; color: var(--slate-900);">${item.materialName}</div>
                                            <div style="font-size: 10px; color: var(--slate-500);">
                                                ${isTerminated ? `<span style="color:var(--red);font-weight:600;">[TERMINATED]</span> ` : ''}
                                                Qty: ${calcQty} ${item.unit} | Vendor: ${item.vendor || 'N/A'}
                                            </div>
                                        </td>
                                        <td class="project-id" style="font-size: 10px;">${item.contractRef}</td>
                                        <td style="font-family: 'JetBrains Mono'; color: var(--slate-500);">MWK ${marketTotal.toLocaleString()}</td>
                                        <td style="font-family: 'JetBrains Mono'; font-weight: 700;">MWK ${actualTotal.toLocaleString()}</td>
                                        <td>
                                            <span style="font-weight: 800; color: ${isHigh ? 'var(--red)' : (marketTotal === 0 ? 'var(--slate-500)' : 'var(--emerald)')};">
                                                ${marketTotal === 0 && actualTotal > 0 ? 'No Baseline' : (calcQty === 0 ? 'N/A' : (isHigh ? '+' : '') + Math.round(diffPct) + '%')}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr style="background: var(--slate-50);">
                                        <td colspan="5" style="padding: 8px 20px; font-style: italic; color: var(--slate-500); font-size: 11px; border-bottom: 1px solid var(--slate-200);">
                                            <i class="fas fa-comment-dots" style="margin-right: 4px;"></i> 
                                            ${isHigh ? 'Procured above market baseline due to logistical urgency or supply constraints.' : 'Procured within or below baseline through optimized vendor selection.'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Assets & Fleet Section -->
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header">
                    <div class="card-title"><i class="fas fa-truck-pickup" style="margin-right: 8px; color: var(--blue);"></i> Assigned Assets & Fleet</div>
                </div>
                <div style="padding: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                    ${assets.length === 0 ? '<div style="grid-column: 1/-1; text-align: center; color: var(--slate-400); font-size: 12px;">No heavy equipment currently deployed to this site.</div>' : ''}
                    ${assets.map(asset => `
                        <div style="border: 1px solid var(--slate-100); border-radius: 8px; padding: 12px; background: var(--slate-50);">
                            <div style="font-size: 10px; font-weight: 800; color: var(--slate-400);">${asset.assetCode}</div>
                            <div style="font-weight: 700; color: var(--slate-900); font-size: 13px;">${asset.name}</div>
                            <div style="margin-top: 4px;"><span class="status active" style="font-size: 9px; padding: 2px 6px;">${asset.status.toUpperCase()}</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Uplift History Section -->
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title"><i class="fas fa-arrow-up-right-dots" style="margin-right: 8px; color: var(--emerald);"></i> Budget Uplift & Amendment History</div>
                </div>
                <div style="padding: 0;">
                    ${bcrs.length === 0 ? '<div style="padding: 24px; text-align: center; color: var(--slate-400); font-size: 12px;">No financial amendments or uplifts recorded.</div>' : ''}
                    ${bcrs.map(bcr => `
                        <div style="padding: 16px 20px; border-bottom: 1px solid var(--slate-100);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div>
                                    <span class="project-id" style="font-size: 10px;">${bcr.bcrCode}</span>
                                    <div style="font-weight: 800; color: var(--slate-900); font-size: 14px; margin-top: 4px;">+ MWK ${(Number(bcr.amount)).toLocaleString()}</div>
                                </div>
                                <span class="status ${bcr.status.toLowerCase() === 'approved' ? 'active' : 'pending'}">${bcr.status.toUpperCase()}</span>
                            </div>
                            <div style="font-size: 11px; color: var(--slate-600); background: var(--slate-50); padding: 8px; border-radius: 4px; border-left: 3px solid var(--slate-300);">
                                <strong>Justification:</strong> ${bcr.justification || 'Administrative adjustment.'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderLoadingState() {
        return `
            <div style="grid-column: 1/-1; padding: 80px; text-align: center;">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 32px; color: var(--orange); margin-bottom: 16px;"></i>
                <div style="font-weight: 700; color: var(--slate-600);">Scanning Portfolio Financials...</div>
            </div>
        `;
    },

    renderEmptyState(msg) {
        return `
            <div style="grid-column: 1/-1; padding: 60px; text-align: center; background: white; border-radius: 12px; border: 2px dashed var(--slate-200);">
                <i class="fas fa-receipt" style="font-size: 40px; color: var(--slate-300); margin-bottom: 16px;"></i>
                <div style="font-weight: 700; color: var(--slate-500);">${msg}</div>
            </div>
        `;
    }
};
