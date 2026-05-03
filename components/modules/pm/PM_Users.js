import client from '../../../src/api/client.js';
import projects from '../../../src/api/projects.api.js';
import users from '../../../src/api/users.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import requisitions from '../../../src/api/requisitions.api.js';
import audit from '../../../src/api/audit.api.js';
import procurement from '../../../src/api/procurement.api.js';
import assets from '../../../src/api/assets.api.js';
import issues from '../../../src/api/issues.api.js';
import tasks from '../../../src/api/tasks.api.js';
import contracts from '../../../src/api/contracts.api.js';

export const PM_Users = {
    getUsersView() {
        setTimeout(() => this.loadUsers(), 0);
        
        return `
            <div class="data-card">
                <div class="data-card-header" style="justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div class="card-title">User Registry & Permissions</div>
                    <div style="display: flex; gap: 8px; flex-grow: 1; max-width: 600px;">
                        <div style="position: relative; flex-grow: 1;">
                            <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--slate-400); font-size: 13px;"></i>
                            <input type="text" id="user-search-filter" class="form-input" placeholder="Search name or email..." style="width: 100%; padding-left: 32px;" onkeyup="if(event.key === 'Enter') window.app.pmModule.loadUsers()">
                        </div>
                        <select id="user-role-filter" class="form-input" style="width: 160px;" onchange="window.app.pmModule.loadUsers()">
                            <option value="">All Roles</option>
                            <option value="Project_Manager">Project Manager</option>
                            <option value="Finance_Director">Finance Director</option>
                            <option value="Operations_Manager">Operations Manager</option>
                            <option value="Field_Supervisor">Field Supervisor</option>
                            <option value="Contract_Administrator">Contract Administrator</option>
                            <option value="Equipment_Coordinator">Equipment Coordinator</option>
                            <option value="Managing_Director">Managing Director</option>
                            <option value="System_Technician">System Technician</option>
                        </select>
                        <select id="user-status-filter" class="form-input" style="width: 140px;" onchange="window.app.pmModule.loadUsers()">
                            <option value="">All Statuses</option>
                            <option value="false">Active Only</option>
                            <option value="true">Locked Only</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Add New User', window.DrawerTemplates.newUser); window.app.pmModule.initCreateUserForm();" data-tooltip="Create a new system user"><i class="fas fa-plus"></i> New User</button>
                </div>
                <div id="users-table-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    },

    async loadUsers(page = 1) {
        const container = document.getElementById('users-table-container');
        if (!container) return;

        try {
            const search = document.getElementById('user-search-filter')?.value;
            const role = document.getElementById('user-role-filter')?.value;
            const status = document.getElementById('user-status-filter')?.value;

            const params = { limit: 15, page: page };
            if (search) params.search = search;
            if (role) params.role = role;
            
            if (status === 'true') params.isLocked = true;
            else if (status === 'false') params.isLocked = false;

            const response = await users.getAll(params);
            const data = response.data || response; 
            const usersList = Array.isArray(data) ? data : data.users || [];
            const total = data.total || usersList.length;
            const totalPages = Math.ceil(total / 15);
            
            if (usersList.length === 0) {
                container.innerHTML = this.renderEmptyState('No users found matching your criteria.');
                return;
            }

            container.innerHTML = `
                ${this.renderUsersTable(usersList)}
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--slate-50); border-top: 1px solid var(--slate-200);">
                    <div style="font-size: 13px; color: var(--slate-500);">
                        Showing ${(page - 1) * 15 + 1} - ${Math.min(page * 15, total)} of ${total} users
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" ${page === 1 ? 'disabled' : ''} onclick="window.app.pmModule.loadUsers(${page - 1})">
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--slate-700);">
                            Page ${page} of ${totalPages || 1}
                        </div>
                        <button class="btn btn-secondary btn-sm" ${page >= totalPages ? 'disabled' : ''} onclick="window.app.pmModule.loadUsers(${page + 1})">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load users:', error);
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div>Failed to load users: ${error.message}</div>
                    <button class="btn btn-secondary" style="margin-top: 16px;" onclick="window.app.pmModule.loadUsers()">Retry</button>
                </div>
            `;
        }
    },

    renderUsersTable(usersList) {
        const getInitials = (name) => {
            if (!name) return '?';
            return name.toString().split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase();
        };
        const formatRole = (role) => {
            if (!role) return 'User';
            return role.toString().replace(/_/g, ' ');
        };
        
        const rows = usersList.map(user => {
            const isLocked = user.isLocked;
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isLocked ? 'var(--red-light)' : 'var(--slate-800)'}; color: ${isLocked ? 'var(--red)' : 'white'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${this.escapeHTML(getInitials(user.name))}</div>
                            <div style="font-weight: 600; ${isLocked ? 'color: var(--slate-400);' : ''}">${this.escapeHTML(user.name)}</div>
                        </div>
                    </td>
                    <td><span style="font-size: 11px; background: var(--slate-100); padding: 2px 8px; border-radius: 4px; font-weight: 600;">${this.escapeHTML(formatRole(user.role))}</span></td>
                    <td>${this.escapeHTML(user.email || 'N/A')}</td>
                    <td><span style="font-family: 'JetBrains Mono'; font-size: 12px;">${this.escapeHTML(user.phone || '-')}</span></td>
                    <td><span class="status ${isLocked ? 'inactive' : 'active'}">${isLocked ? 'Locked' : 'Active'}</span></td>
                    <td>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 11px; font-weight: 600;" onclick="window.drawer.open('Edit User Details', window.DrawerTemplates.editUser); window.app.pmModule.initEditUserForm(${JSON.stringify(user).replace(/"/g, '&quot;')})" data-tooltip="Manage account details and status">Edit User</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

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
    },

    openUserDrawer(userId = null) {
        window.drawer.open(userId ? 'Edit User' : 'Add New User', window.DrawerTemplates.userForm);
        if (userId) {
             users.getById(userId).then(response => {
                 const user = response.data || response;
                 document.getElementById('user_form_id').value = user.id;
                 document.getElementById('user_form_name').value = user.name;
                 document.getElementById('user_form_email').value = user.email;
                 document.getElementById('user_form_role').value = user.role;
             });
        }
    }
};
