import { StatCard } from '../ui/StatCard.js';

export class SystemTechnicianDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.config = {
            vat_rate: '16.5',
            currency: 'MWK',
            company_name: 'Mkaka Construction Ltd',
            smtp_host: 'smtp.gmail.com',
            smtp_port: '587',
            smtp_user: 'system@mkaka.mw'
        };
    }

    render() {
        return `
            <div id="tech-module" class="animate-fade-in">
                ${this.getHeaderHTML()}
                <div class="content" id="tech-content-area">
                    ${this.getCurrentViewHTML()}
                </div>
            </div>
        `;
    }

    getCurrentViewHTML() {
        switch(this.currentView) {
            case 'dashboard': return this.getDashboardView();
            case 'config': return this.getConfigView();
            case 'users': return this.getUsersView();
            case 'audit': return this.getAuditView();
            default: return this.getDashboardView();
        }
    }

    getHeaderHTML() {
        const titles = {
            dashboard: 'System Overview',
            config: 'Global Configuration',
            users: 'User Management',
            audit: 'Security Audit logs'
        };
        return `
            <div class="page-header">
                <div class="page-title-row">
                    <div>
                        <h1 class="page-title">${titles[this.currentView] || 'Technician Portal'}</h1>
                        <div class="context-strip">
                            <span class="context-value">System Version: v2.4.0-prod</span>
                            <div class="context-dot"></div>
                            <span style="color: var(--emerald); font-weight: 600;">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDashboardView() {
        return `
            <div class="stats-grid">
                ${StatCard({ title: 'System Uptime', value: '99.9%', subtext: 'Last 30 days', alertColor: 'emerald' })}
                ${StatCard({ title: 'Sync Success', value: '94%', subtext: '12 Failed Pushes', alertColor: 'amber' })}
                ${StatCard({ title: 'Active Users', value: '8', subtext: 'Current sessions: 3' })}
                ${StatCard({ title: 'DB Size', value: '1.2GB', subtext: 'Last Backup: 4h ago' })}
            </div>
        `;
    }

    getConfigView() {
        return `
            <div class="data-card max-w-4xl" style="margin-top: 24px;">
                <div class="data-card-header" style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                    <div class="card-title" style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-sliders" style="color: var(--slate-400);"></i>
                        System Variables & Settings
                    </div>
                </div>
                <div style="padding: 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--slate-50)/50; border-bottom: 1px solid var(--slate-200);">
                                <th style="padding: 14px 24px; text-align: left; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; width: 30%;">Parameter</th>
                                <th style="padding: 14px 24px; text-align: left; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px;">Current Value</th>
                                <th style="padding: 14px 24px; text-align: right; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; width: 15%;">Action</th>
                            </tr>
                        </thead>
                        <tbody style="font-size: 13px;">
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">System Version</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--slate-900);">v2.4.0-prod</td>
                                <td style="padding: 18px 24px; text-align: right;"><i class="fas fa-lock" style="color: var(--slate-300);" title="Read-only System Variable"></i></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">System Status</td>
                                <td style="padding: 18px 24px;"><span style="color: var(--emerald); font-weight: 700; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle"></i> All Systems Operational</span></td>
                                <td style="padding: 18px 24px; text-align: right;"><i class="fas fa-lock" style="color: var(--slate-300);"></i></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">VAT Rate (%)</td>
                                <td style="padding: 18px 24px; font-weight: 700; color: var(--slate-900);">16.5%</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('Edit VAT Rate', window.DrawerTemplates.editVAT)">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">Currency Symbol</td>
                                <td style="padding: 18px 24px; font-weight: 700; color: var(--slate-900);">MWK</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('Edit Currency', window.DrawerTemplates.editCurrency)">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">Company Name</td>
                                <td style="padding: 18px 24px; font-weight: 700; color: var(--slate-900);">Mkaka Construction Ltd</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('Edit Company Details', window.DrawerTemplates.editCompany)">Edit</button></td>
                            </tr>
                            
                            <!-- SMTP SECTION HEADER -->
                            <tr style="background: var(--slate-50);">
                                <td colspan="3" style="padding: 14px 24px; font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-envelope-open-text" style="font-size: 14px;"></i>
                                        SMTP Email Server Settings
                                    </div>
                                </td>
                            </tr>

                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">SMTP Host</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--slate-900);">smtp.gmail.com</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">SMTP Port</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--slate-900);">587</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">SMTP Username</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--slate-900);">system@mkaka.mw</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">SMTP Password</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--slate-900);">••••••••••••</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)">Edit</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="padding: 24px; background: var(--slate-50); border-top: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn btn-secondary" style="color: var(--slate-500); border-color: transparent;">Reset to Default</button>
                    <button class="btn btn-primary" onclick="window.toast.show('Settings updated successfully', 'success')" style="box-shadow: var(--shadow-sm);"><i class="fas fa-save"></i> Save All Changes</button>
                </div>
            </div>
        `;
    }

    getUsersView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">User Registry & Permissions</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add New User', window.DrawerTemplates.newUser)"><i class="fas fa-plus"></i> New User</button>
                </div>
                <table>
                    <thead>
                        <tr><th>User</th><th>Role</th><th>Email</th><th>Phone</th><th>Permissions</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-800); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">SJ</div>
                                    <div style="font-weight: 600;">Sarah Jenkins</div>
                                </div>
                            </td>
                            <td>Project Manager</td>
                            <td>s.jenkins@mkaka.mw</td>
                            <td>+265 991 234 567</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_all, write_project...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--orange); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">SM</div>
                                    <div style="font-weight: 600;">Stefan Mwale</div>
                                </div>
                            </td>
                            <td>Finance Director</td>
                            <td>s.mwale@mkaka.mw</td>
                            <td>+265 882 111 222</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_all, write_finance...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--blue); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">JB</div>
                                    <div style="font-weight: 600;">James Banda</div>
                                </div>
                            </td>
                            <td>Site Engineer</td>
                            <td>j.banda@mkaka.mw</td>
                            <td>+265 993 333 444</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_project, write_site...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--purple); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">AC</div>
                                    <div style="font-weight: 600;">Alice Chimwala</div>
                                </div>
                            </td>
                            <td>HR Manager</td>
                            <td>a.chimwala@mkaka.mw</td>
                            <td>+265 884 555 666</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_hr, write_hr...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--emerald); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">TP</div>
                                    <div style="font-weight: 600;">Tionge Phiri</div>
                                </div>
                            </td>
                            <td>Procurement Officer</td>
                            <td>t.phiri@mkaka.mw</td>
                            <td>+265 995 777 888</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_finance, write_procure...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-500); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">DK</div>
                                    <div style="font-weight: 600;">David Kamwendo</div>
                                </div>
                            </td>
                            <td>Foreman</td>
                            <td>d.kamwendo@mkaka.mw</td>
                            <td>+265 886 999 000</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_site, write_site...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">LN</div>
                                    <div style="font-weight: 600;">Lumbani Nyirenda</div>
                                </div>
                            </td>
                            <td>System Admin</td>
                            <td>l.nyirenda@mkaka.mw</td>
                            <td>+265 997 111 333</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">root_access</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-400); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">CM</div>
                                    <div style="font-weight: 600;">Chifundo Mwale</div>
                                </div>
                            </td>
                            <td>Accountant</td>
                            <td>c.mwale@mkaka.mw</td>
                            <td>+265 888 222 444</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_finance, write_finance...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--amber); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">GK</div>
                                    <div style="font-weight: 600;">Grace Kachingwe</div>
                                </div>
                            </td>
                            <td>Store Manager</td>
                            <td>g.kachingwe@mkaka.mw</td>
                            <td>+265 999 333 555</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_inventory, write_inv...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                         <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-300); color: var(--slate-700); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">PK</div>
                                    <div style="font-weight: 600;">Peter Kalua</div>
                                </div>
                            </td>
                            <td>Site Supervisor</td>
                            <td>p.kalua@mkaka.mw</td>
                            <td>+265 881 444 666</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_site, write_site...</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-800); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">MM</div>
                                    <div style="font-weight: 600;">Mary Mbewe</div>
                                </div>
                            </td>
                            <td>Junior Engineer</td>
                            <td>m.mbewe@mkaka.mw</td>
                            <td>+265 992 555 777</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_site</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                         <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-300); color: var(--slate-700); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">FK</div>
                                    <div style="font-weight: 600;">Francis Kakhobwe</div>
                                </div>
                            </td>
                            <td>Driver</td>
                            <td>f.kakhobwe@mkaka.mw</td>
                            <td>+265 883 666 888</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_logistics</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                         <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--red-light); color: var(--red); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">BZ</div>
                                    <div style="font-weight: 600; color: var(--slate-400);">Brian Zulu</div>
                                </div>
                            </td>
                            <td style="color: var(--slate-400);">Former Ops Manager</td>
                            <td style="color: var(--slate-400);">b.zulu@mkaka.mw</td>
                            <td style="color: var(--slate-400);">+265 994 777 999</td>
                            <td><span style="font-size: 11px; color: var(--slate-400);">no_access</span></td>
                            <td><span class="status inactive">Inactive</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-800); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">EM</div>
                                    <div style="font-weight: 600;">Esther Mhango</div>
                                </div>
                            </td>
                            <td>QS Assistant</td>
                            <td>e.mhango@mkaka.mw</td>
                            <td>+265 885 888 000</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_project</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--blue); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">JM</div>
                                    <div style="font-weight: 600;">John Moyo</div>
                                </div>
                            </td>
                            <td>Safety Officer</td>
                            <td>j.moyo@mkaka.mw</td>
                            <td>+265 996 999 111</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_all, write_hse</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--purple); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">TC</div>
                                    <div style="font-weight: 600;">Thoko Chirwa</div>
                                </div>
                            </td>
                            <td>Lab Technician</td>
                            <td>t.chirwa@mkaka.mw</td>
                            <td>+265 887 000 222</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_site, write_lab</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                         <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-300); color: var(--slate-700); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">WN</div>
                                    <div style="font-weight: 600;">Wongani Ngwira</div>
                                </div>
                            </td>
                            <td>Mechanic</td>
                            <td>w.ngwira@mkaka.mw</td>
                            <td>+265 998 111 333</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_asset</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--emerald); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">LM</div>
                                    <div style="font-weight: 600;">Loveness Msiska</div>
                                </div>
                            </td>
                            <td>Receptionist</td>
                            <td>l.msiska@mkaka.mw</td>
                            <td>+265 889 222 444</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_basic</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--amber); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">KN</div>
                                    <div style="font-weight: 600;">Kelvin Nkhoma</div>
                                </div>
                            </td>
                            <td>IT Support</td>
                            <td>k.nkhoma@mkaka.mw</td>
                            <td>+265 990 333 555</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">read_all, write_admin</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--slate-800); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">VM</div>
                                    <div style="font-weight: 600;">Victor Mtambo</div>
                                </div>
                            </td>
                            <td>Managing Director</td>
                            <td>v.mtambo@mkaka.mw</td>
                            <td>+265 880 444 666</td>
                            <td><span style="font-size: 11px; color: var(--slate-500);">full_access</span></td>
                            <td><span class="status active">Active</span></td>
                            <td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.drawer.open('Edit User', window.DrawerTemplates.editUser)">Edit</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    getAuditView() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Immutable Audit & Security Log</div>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" class="form-input" placeholder="Search logs..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button class="btn btn-secondary"><i class="fas fa-filter"></i> Filter</button>
                        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export CSV</button>
                    </div>
                </div>
                <table class="audit-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">Sev.</th>
                            <th>Timestamp</th>
                            <th>User / Actor</th>
                            <th>Event Action</th>
                            <th>Target Resource</th>
                            <th>IP Address</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody style="font-size: 13px;">
                        <tr style="background: var(--red-light);">
                            <td style="text-align: center;"><i class="fas fa-circle-exclamation" style="color: var(--red);" title="Critical"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-27 10:45:22</td>
                            <td style="font-weight: 600;">Stefan Mwale</td>
                            <td>Failed Login Attempt</td>
                            <td>Auth System</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">105.12.4.22</td>
                            <td><span class="status rejected">Blocked</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle-info" style="color: var(--blue);" title="Information"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-27 10:44:10</td>
                            <td style="font-weight: 600;">System</td>
                            <td>Auto-Backup Completed</td>
                            <td>Database (PostgreSQL)</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">localhost</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-27 10:30:05</td>
                            <td style="font-weight: 600;">Sarah Jenkins</td>
                            <td>Project Budget Update</td>
                            <td>PRJ-2023-001</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.105</td>
                            <td><span class="status active">Logged</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-triangle-exclamation" style="color: var(--amber);" title="Warning"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-27 09:15:33</td>
                            <td style="font-weight: 600;">Mike Banda</td>
                            <td>Role Permission Change</td>
                            <td>User: J.Doe</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.102</td>
                            <td><span class="status pending">Flagged</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-27 08:00:00</td>
                            <td style="font-weight: 600;">System (Cron)</td>
                            <td>Daily Report Processing</td>
                            <td>Reports Module</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">localhost</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                         <tr>
                            <td style="text-align: center;"><i class="fas fa-circle-exclamation" style="color: var(--red);" title="Critical"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 23:12:44</td>
                            <td style="font-weight: 600;">Unknown</td>
                            <td>Port Scan Detected</td>
                            <td>Firewall</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">45.22.19.112</td>
                            <td><span class="status rejected">Blocked</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 22:00:00</td>
                            <td style="font-weight: 600;">System</td>
                            <td>Session Cleanup</td>
                            <td>Auth System</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">localhost</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 17:05:12</td>
                            <td style="font-weight: 600;">Alice Chimwala</td>
                            <td>New User Created</td>
                            <td>User: T.Phiri</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.108</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                         <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 16:45:30</td>
                            <td style="font-weight: 600;">James Banda</td>
                            <td>Site Inspection Log</td>
                            <td>Project: Area 43</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.115</td>
                            <td><span class="status active">Logged</span></td>
                        </tr>
                         <tr>
                            <td style="text-align: center;"><i class="fas fa-triangle-exclamation" style="color: var(--amber);" title="Warning"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 15:30:00</td>
                            <td style="font-weight: 600;">System</td>
                            <td>High CPU Usage</td>
                            <td>Server: App-01</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">localhost</td>
                            <td><span class="status pending">Alerted</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 14:22:18</td>
                            <td style="font-weight: 600;">Stefan Mwale</td>
                            <td>Invoice Approved</td>
                            <td>INV-2023-998</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.105</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 13:10:05</td>
                            <td style="font-weight: 600;">Tionge Phiri</td>
                            <td>PO Generated</td>
                            <td>PO-2023-556</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.120</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle-exclamation" style="color: var(--red);" title="Critical"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 12:00:01</td>
                            <td style="font-weight: 600;">System</td>
                            <td>Sync Connection Lost</td>
                            <td>Remote DB</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">--</td>
                            <td><span class="status rejected">Failed</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--emerald);" title="Recovered"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 12:05:00</td>
                            <td style="font-weight: 600;">System</td>
                            <td>Sync Connection Restored</td>
                            <td>Remote DB</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">--</td>
                            <td><span class="status active">Recovered</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 11:30:00</td>
                            <td style="font-weight: 600;">David Kamwendo</td>
                            <td>Material Request</td>
                            <td>Req: Cement</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">Mobile App</td>
                            <td><span class="status active">Submitted</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 10:15:22</td>
                            <td style="font-weight: 600;">Sarah Jenkins</td>
                            <td>Schedule Updated</td>
                            <td>Project: City Mall</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.105</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-triangle-exclamation" style="color: var(--amber);" title="Warning"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 09:45:10</td>
                            <td style="font-weight: 600;">System</td>
                            <td>Disk Space Low</td>
                            <td>Vol: /var/log</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">localhost</td>
                            <td><span class="status pending">Warning</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 09:00:00</td>
                            <td style="font-weight: 600;">Grace Kachingwe</td>
                            <td>Stock Take Started</td>
                            <td>Warehouse: Main</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.125</td>
                            <td><span class="status active">Logged</span></td>
                        </tr>
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 08:30:15</td>
                            <td style="font-weight: 600;">System</td>
                            <td>Daily Backup</td>
                            <td>Full Backup</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">localhost</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                         <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 08:05:00</td>
                            <td style="font-weight: 600;">Kelvin Nkhoma</td>
                            <td>User Password Reset</td>
                            <td>User: F.Kakhobwe</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">192.168.1.110</td>
                            <td><span class="status active">Success</span></td>
                        </tr>
                    </tbody>
                </table>
                <div style="padding: 12px 24px; border-top: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center; background: var(--slate-50);">
                    <div style="font-size: 11px; color: var(--slate-500);">Showing 6 of 2,455 events</div>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-secondary" style="padding: 4px 8px;" disabled>&lt;</button>
                        <button class="btn btn-secondary" style="padding: 4px 8px;">1</button>
                        <button class="btn btn-secondary" style="padding: 4px 8px;">2</button>
                        <button class="btn btn-secondary" style="padding: 4px 8px;">3</button>
                        <button class="btn btn-secondary" style="padding: 4px 8px;">&gt;</button>
                    </div>
                </div>
            </div>
        `;
    }
}
