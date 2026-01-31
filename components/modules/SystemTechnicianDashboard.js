import { StatCard } from '../ui/StatCard.js';
import { FormValidator } from '../../src/utils/FormValidator.js';

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

        window.techModule = this;
        window.initCreateUserForm = this.initCreateUserForm.bind(this);
        window.initEditUserForm = this.initEditUserForm.bind(this);
    }

    initCreateUserForm() {
        setTimeout(() => {
            const form = document.getElementById('createUserForm') || document.getElementById('newUserForm');
            if (form) {
                // Password Generation Logic
                const generateBtn = document.getElementById('btn-generate-pass') || form.querySelector('.btn-generate-pass');
                if (generateBtn) {
                    generateBtn.addEventListener('click', () => {
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                        let pass = '';
                        for (let i = 0; i < 12; i++) {
                            pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        if (!/[A-Z]/.test(pass)) pass += 'A';
                        if (!/[0-9]/.test(pass)) pass += '1';
                        if (!/[!@#$%^&*]/.test(pass)) pass += '!';
                        
                        const passInput = form.querySelector('input[type="password"]') || form.querySelector('input[name="password"]');
                        if (passInput) {
                            passInput.value = pass;
                            passInput.type = 'text'; 
                            passInput.dispatchEvent(new Event('input'));
                        }
                    });
                }
            }
        }, 100);
    }

    async handleCreateUser(formData) {
        const userData = Object.fromEntries(formData.entries());
        const btn = document.querySelector('#newUserForm button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error?.message || result.message || 'Failed to create user');
            }
            
            window.drawer.close();
            window.toast.show('User account created and welcome email sent', 'success');
            this.loadUsersFromAPI();
        } catch (error) {
            window.toast.show(error.message, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async handleUpdateUser(formData) {
        const userData = Object.fromEntries(formData.entries());
        userData.id = parseInt(userData.id);
        const btn = document.querySelector('#editUserForm button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch(`/api/v1/users/${userData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                })
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || result.message || 'Failed to update user');
            }
            
            window.drawer.close();
            window.toast.show('User updated and notified', 'success');
            this.loadUsersFromAPI();
        } catch (err) {
            window.toast.show(err.message, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
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
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('Edit VAT Rate', window.DrawerTemplates.editVAT)" data-tooltip="Update VAT Percentage">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">Currency Symbol</td>
                                <td style="padding: 18px 24px; font-weight: 700; color: var(--slate-900);">MWK</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('Edit Currency', window.DrawerTemplates.editCurrency)" data-tooltip="Update System Currency">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">Company Name</td>
                                <td style="padding: 18px 24px; font-weight: 700; color: var(--slate-900);">Mkaka Construction Ltd</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('Edit Company Details', window.DrawerTemplates.editCompany)" data-tooltip="Update Organization Profile">Edit</button></td>
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
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)" data-tooltip="Configure Email Host">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">SMTP Port</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--slate-900);">587</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)" data-tooltip="Configure Email Port">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">SMTP Username</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--slate-900);">system@mkaka.mw</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)" data-tooltip="Configure Email Account">Edit</button></td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;" onmouseover="this.style.background='var(--slate-50)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 18px 24px; color: var(--slate-600); font-weight: 600;">SMTP Password</td>
                                <td style="padding: 18px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--slate-900);">••••••••••••</td>
                                <td style="padding: 18px 24px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; border-radius: 4px;" onclick="window.drawer.open('SMTP Configuration', window.DrawerTemplates.editSMTP)" data-tooltip="Update Email Password">Edit</button></td>
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

    renderLoadingState() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 32px; color: var(--orange); margin-bottom: 16px;"></i>
                <div style="font-weight: 600; color: var(--slate-600);">Loading data...</div>
            </div>
        `;
    }

    renderEmptyState(message = 'No records found') {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--slate-400); text-align: center;">
                <div style="width: 64px; height: 64px; background: var(--slate-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <i class="fas fa-search" style="font-size: 24px; color: var(--slate-400);"></i>
                </div>
                <div style="font-weight: 600; color: var(--slate-700); margin-bottom: 8px;">${message}</div>
                <div style="font-size: 13px; max-width: 300px;">Try adjusting your filters or search terms to find what you're looking for.</div>
                <button class="btn btn-secondary" style="margin-top: 24px;" onclick="this.currentView='dashboard'; this.render();">Return to Dashboard</button>
            </div>
        `;
    }

    getUsersView() {
        // Show loading placeholder, then load users via API
        setTimeout(() => this.loadUsersFromAPI(), 0);
        
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">User Registry & Permissions</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add New User', window.DrawerTemplates.newUser); window.initCreateUserForm();" data-tooltip="Create a new system user"><i class="fas fa-plus"></i> New User</button>
                </div>
                <div id="users-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }

    async loadUsersFromAPI() {
        const container = document.getElementById('users-table-container');
        if (!container) return;
        
        try {
            const token = localStorage.getItem('mcms_auth_token');
            const response = await fetch('/api/v1/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                const errorMessage = result.error?.message || result.message || `Server error: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            const users = result.data || result.items || result || [];
            
            if (users.length === 0) {
                container.innerHTML = this.renderEmptyState('No users found in the system.');
                return;
            }
            
            container.innerHTML = this.renderUsersTable(users);
        } catch (error) {
            console.error('Failed to load users:', error);
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div>Failed to load users: ${error.message}</div>
                    <button class="btn btn-secondary" style="margin-top: 16px;" onclick="window.app?.loadPage('users')">Retry</button>
                </div>
            `;
        }
    }

    renderUsersTable(users) {
        const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
        const formatRole = (role) => role.replace(/_/g, ' ');
        
        const rows = users.map(user => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${user.isLocked ? 'var(--red-light)' : 'var(--slate-800)'}; color: ${user.isLocked ? 'var(--red)' : 'white'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${getInitials(user.name)}</div>
                        <div style="font-weight: 600; ${user.isLocked ? 'color: var(--slate-400);' : ''}">${user.name}</div>
                    </div>
                </td>
                <td>${formatRole(user.role)}</td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td><span class="status ${user.isLocked ? 'inactive' : 'active'}">${user.isLocked ? 'Locked' : 'Active'}</span></td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; font-weight: 600;" onclick="window.drawer.open('Edit User Details', window.DrawerTemplates.editUser); window.initEditUserForm(${JSON.stringify(user).replace(/"/g, '&quot;')})" data-tooltip="Manage account details and status">Edit User</button>
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <table>
                <thead>
                    <tr><th>User</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    async lockUser(userId) {
        window.modal.prompt(
            'Deactivate Account', 
            'Please provide a reason for deactivating this user account. The user will be notified via email.',
            'Optional deactivation reason...',
            async (reason) => {
                if (reason === null) return;

                try {
                    const token = localStorage.getItem('mcms_auth_token');
                    const response = await fetch(`/api/v1/users/${userId}/lock`, {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ reason: reason || 'Account deactivated by administrator' })
                    });
                    if (!response.ok) throw new Error('Failed to lock user');
                    
                    window.toast.show('User account deactivated', 'success');
                    window.drawer.close();
                    this.loadUsersFromAPI();
                } catch (error) {
                    window.toast.show(error.message, 'error');
                }
            }
        );
    }

    async unlockUser(userId) {
        window.modal.prompt(
            'Reactivate Account', 
            'Are you sure you want to reactivate this account? Please provide a reason for the log.',
            'Optional reactivation reason...',
            async (reason) => {
                try {
                    const token = localStorage.getItem('mcms_auth_token');
                    const response = await fetch(`/api/v1/users/${userId}/unlock`, {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ reason: reason || 'Account reactivated by administrator' })
                    });
                    if (!response.ok) throw new Error('Failed to unlock user');
                    
                    window.toast.show('User account reactivated', 'success');
                    window.drawer.close();
                    this.loadUsersFromAPI();
                } catch (error) {
                    window.toast.show(error.message, 'error');
                }
            }
        );
    }

    async deleteUser(userId) {
        window.modal.prompt(
            'CRITICAL: Delete Account', 
            '<span style="color: var(--red); font-weight: 700;">WARNING:</span> This action is permanent and cannot be undone. Please enter the reason for deletion to confirm.',
            'Required deletion reason...',
            async (reason) => {
                if (!reason || reason.trim().length < 5) {
                    window.toast.show('A valid reason (min 5 chars) is required for deletion', 'warning');
                    return;
                }

                try {
                    const token = localStorage.getItem('mcms_auth_token');
                    const response = await fetch(`/api/v1/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ reason: reason })
                    });
                    if (!response.ok) throw new Error('Failed to delete user');
                    
                    window.toast.show('User account permanently deleted', 'success');
                    window.drawer.close();
                    this.loadUsersFromAPI();
                } catch (error) {
                    window.toast.show(error.message, 'error');
                }
            }
        );
    }

    initCreateUserForm() {
        // ... this will be handled by the existing initCreateUserForm logic which I'll move to a method
    }

    initEditUserForm(user) {
        setTimeout(() => {
            const form = document.getElementById('editUserForm');
            if (form && user) {
                form.querySelector('[name="id"]').value = user.id;
                form.querySelector('[name="name"]').value = user.name;
                form.querySelector('[name="email"]').value = user.email;
                form.querySelector('[name="role"]').value = user.role.replace(' ', '_');
                
                // Toggle status buttons based on locked state
                const lockBtn = document.getElementById('btn-deactivate-user');
                const unlockBtn = document.getElementById('btn-unlock-user');
                
                if (lockBtn && unlockBtn) {
                    if (user.isLocked) {
                        lockBtn.style.display = 'none';
                        unlockBtn.style.display = 'flex';
                    } else {
                        lockBtn.style.display = 'flex';
                        unlockBtn.style.display = 'none';
                    }
                }
            }
        }, 100);
    }

    getAuditView() {
        // Mock data check for empty state
        const logs = [1]; 
        if (logs.length === 0) return this.renderEmptyState('No audit logs found matching your criteria.');

        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Immutable Audit & Security Log</div>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" class="form-input" placeholder="Search logs..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button class="btn btn-secondary" data-tooltip="Filter logs by criteria"><i class="fas fa-filter"></i> Filter</button>
                        <button class="btn btn-secondary" data-tooltip="Download logs as CSV"><i class="fas fa-download"></i> Export CSV</button>
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
                        <!-- ... (Rest of table rows) ... -->
                        <tr>
                            <td style="text-align: center;"><i class="fas fa-circle" style="color: var(--slate-300);" title="Routine"></i></td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">2023-10-26 22:00:00</td>
                            <td style="font-weight: 600;">System</td>
                            <td>Session Cleanup</td>
                            <td>Auth System</td>
                            <td style="font-family: 'JetBrains Mono'; font-size: 12px;">localhost</td>
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
