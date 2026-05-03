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

export const PM_UserHandlers = {
    async handleCreateUser(formData) {
        const data = Object.fromEntries(formData.entries());
        try {
            await users.create(data);
            window.toast.show('User account created successfully', 'success');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            console.error('Create user error:', error);
            const errEl = document.getElementById('create-user-error');
            if (errEl) {
                errEl.innerText = error.message;
                errEl.style.display = 'block';
            } else {
                window.toast.show(error.message, 'error');
            }
        }
    },

    async handleUpdateUser(formData) {
        const id = formData.get('id');
        const data = Object.fromEntries(formData.entries());
        delete data.id;
        
        if (!data.password || data.password.trim() === '') {
            delete data.password;
        }

        try {
            await users.update(id, data);
            window.toast.show('User details updated', 'success');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            console.error('Update user error:', error);
            const errEl = document.getElementById('edit-user-error');
            if (errEl) {
                errEl.innerText = error.message;
                errEl.style.display = 'block';
            } else {
                window.toast.show(error.message, 'error');
            }
        }
    },

    async lockUser(id) {
        const reason = prompt("Reason for account deactivation:");
        if (reason === null) return;
        if (!reason.trim()) {
            window.toast.show("A reason is required to deactivate an account", "error");
            return;
        }

        try {
            await users.lock(id, { reason });
            window.toast.show('User account locked', 'warning');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    },

    async unlockUser(id) {
        try {
            await users.unlock(id);
            window.toast.show('User account reactivated', 'success');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    },

    async deleteUser(id) {
        if (!confirm('CRITICAL: This will permanently delete this user account. All audit logs will remain but the user will be purged. Proceed?')) return;
        
        const confirmation = prompt("Type 'PURGE' to confirm permanent deletion:");
        if (confirmation !== 'PURGE') return;

        try {
            await users.remove(id);
            window.toast.show('User purged from system', 'error');
            window.drawer.close();
            this.loadUsers();
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    },

    initCreateUserForm() {
        setTimeout(() => {
            const form = document.getElementById('newUserForm');
            if (form) {
                const generateBtn = form.querySelector('.btn-generate-pass');
                if (generateBtn) {
                    generateBtn.onclick = () => {
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                        let pass = '';
                        for (let i = 0; i < 12; i++) {
                            pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        if (!/[A-Z]/.test(pass)) pass += 'A';
                        if (!/[0-9]/.test(pass)) pass += '1';
                        
                        const passInput = form.querySelector('input[name="password"]');
                        if (passInput) {
                            passInput.value = pass;
                            passInput.type = 'text'; 
                            passInput.dispatchEvent(new Event('input'));
                        }
                    };
                }
            }
        }, 100);
    },

    initEditUserForm(user) {
        setTimeout(() => {
            const form = document.getElementById('editUserForm');
            if (form && user) {
                if (form.querySelector('[name="id"]')) form.querySelector('[name="id"]').value = user.id || '';
                if (form.querySelector('[name="name"]')) form.querySelector('[name="name"]').value = user.name || '';
                if (form.querySelector('[name="email"]')) form.querySelector('[name="email"]').value = user.email || '';
                if (form.querySelector('[name="role"]') && user.role) form.querySelector('[name="role"]').value = user.role;
                if (form.querySelector('[name="phone"]')) form.querySelector('[name="phone"]').value = user.phone || '';
                
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
        }, 150);
    },

    generateTempPassword(inputId) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (!/[A-Z]/.test(pass)) pass += 'A';
        if (!/[0-9]/.test(pass)) pass += '1';
        if (!/[!@#$%^&*]/.test(pass)) pass += '!';
        
        let passInput;
        if (inputId) {
            passInput = document.getElementById(inputId);
        } else if (event && event.target) {
            passInput = event.target.closest('.form-group, div').querySelector('input[name="password"]');
        } else {
            passInput = document.querySelector(`input[name="password"]`);
        }

        if (passInput) {
            passInput.value = pass;
            passInput.type = 'text'; 
            passInput.dispatchEvent(new Event('input'));
            window.toast.show('Temporary password generated', 'info');
        }
    }
};
