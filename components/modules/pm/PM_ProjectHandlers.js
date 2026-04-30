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

export const PM_ProjectHandlers = {
    openNewProjectDrawer() {
        const cached = sessionStorage.getItem('mcms_new_project_cache');
        if (cached) {
            try {
                this.wizardState = JSON.parse(cached);
                console.log('[DEBUG] Restored wizard state from cache');
            } catch (e) {
                console.error('Failed to parse wizard cache', e);
                this.initDefaultWizardState();
            }
        } else {
            this.initDefaultWizardState();
        }

        window.drawer.open('Initialize New Project', window.DrawerTemplates.newProject);
        
        // Restore DOM values after a short delay for rendering
        setTimeout(() => {
            this.restoreWizardDOM();
            this.initializeProjectMap();
            this.fetchSupervisors().then(() => {
                if (this.wizardState.formData?.managerId) {
                    const el = document.getElementById('proj_supervisor');
                    if (el) el.value = this.wizardState.formData.managerId;
                }
            });
            // Jump to the cached step
            if (this.wizardState.currentStep > 1) {
                this.switchWizardStep(this.wizardState.currentStep);
            }
            this.attachWizardAutoSave();
        }, 100);
    },

    initDefaultWizardState() {
        this.wizardState = {
            currentStep: 1,
            isRoad: true,
            roadEstimatePreview: null,
            formData: {}
        };
    },

    saveWizardCache() {
        // Collect current form data
        const getVal = (id) => document.getElementById(id)?.value || '';
        
        this.wizardState.formData = {
            name: getVal('proj_name'),
            client: getVal('proj_client'),
            budget: getVal('proj_budget'),
            start: getVal('proj_start'),
            end: getVal('proj_end'),
            managerId: getVal('proj_supervisor'),
            roadType: getVal('road_type'),
            length: getVal('road_length'),
            width: getVal('road_width'),
            lanes: getVal('road_lanes'),
            terrain: getVal('road_terrain'),
            zone: getVal('road_zone'),
            townDist: getVal('road_town_dist'),
            lighting: getVal('acc_lighting'),
            lat: document.getElementById('proj_lat')?.textContent,
            lng: document.getElementById('proj_lng')?.textContent,
            radius: document.getElementById('proj_radius_input')?.value
        };

        // Collect accessories
        const accBoxes = document.querySelectorAll('input[name="road_acc"]:checked');
        this.wizardState.formData.accessories = Array.from(accBoxes).map(cb => cb.value);

        sessionStorage.setItem('mcms_new_project_cache', JSON.stringify(this.wizardState));
    },

    restoreWizardDOM() {
        if (!this.wizardState.formData) return;
        const data = this.wizardState.formData;
        
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined) el.value = val;
        };

        setVal('proj_name', data.name);
        setVal('proj_client', data.client);
        setVal('proj_budget', data.budget);
        setVal('proj_start', data.start);
        setVal('proj_end', data.end);
        setVal('road_type', data.roadType);
        setVal('road_length', data.length);
        setVal('road_width', data.width);
        setVal('road_lanes', data.lanes);
        setVal('road_terrain', data.terrain);
        setVal('road_zone', data.zone);
        setVal('road_town_dist', data.townDist);
        setVal('acc_lighting', data.lighting);

        if (data.lat) document.getElementById('proj_lat').textContent = data.lat;
        if (data.lng) document.getElementById('proj_lng').textContent = data.lng;
        if (data.radius) {
            const radInput = document.getElementById('proj_radius_input');
            if (radInput) radInput.value = data.radius;
        }

        if (data.accessories) {
            data.accessories.forEach(val => {
                const cb = document.querySelector(`input[name="road_acc"][value="${val}"]`);
                if (cb) cb.checked = true;
            });
        }
    },

    attachWizardAutoSave() {
        const inputs = [
            'proj_name', 'proj_client', 'proj_budget', 'proj_start', 'proj_end',
            'proj_supervisor', 'road_type', 'road_length', 'road_width',
            'road_lanes', 'road_terrain', 'road_zone', 'road_town_dist', 'acc_lighting'
        ];
        
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            el.addEventListener('change', () => {
                this.saveWizardCache();
                if (id === 'proj_budget') this.checkBudgetReconciliation();
            });
        });

        // Live formatter for budget
        const budgetInput = document.getElementById('proj_budget');
        if (budgetInput) {
            budgetInput.addEventListener('input', () => {
                const val = parseFloat(budgetInput.value);
                const info = budgetInput.nextElementSibling;
                if (info && !isNaN(val)) {
                    info.innerHTML = `<i class="fas fa-info-circle"></i> ${this.formatMWK(val)} allocated budget.`;
                    info.style.color = 'var(--emerald-dark)';
                }
                this.checkBudgetReconciliation();
                this.saveWizardCache();
            });
        }

        document.querySelectorAll('input[name="road_acc"]').forEach(cb => {
            cb.addEventListener('change', () => this.saveWizardCache());
        });

        // Also save when radius changes
        document.getElementById('proj_radius_input')?.addEventListener('input', (e) => {
            this.updateMapRadius(e.target.value);
            this.saveWizardCache();
        });
    },

    clearWizardCache() {
        sessionStorage.removeItem('mcms_new_project_cache');
        this.initDefaultWizardState();
    },

    openEditProjectDrawer(id) {
        if(!id) return;
        window.drawer.open('Edit Project Details', window.DrawerTemplates.editProject);
         projects.getById(id).then(response => {
             const project = response.data || response;
             
             const setVal = (id, val) => {
                 const el = document.getElementById(id);
                 if (el) el.value = val !== undefined && val !== null ? val : '';
             };

             setVal('edit_proj_id', project.id);
             setVal('edit_proj_name', project.name);
             setVal('edit_proj_client', project.client);
             setVal('edit_proj_status', project.status);
             setVal('edit_proj_budget', project.budgetTotal || project.budget);
             setVal('edit_proj_start', project.startDate ? project.startDate.split('T')[0] : '');
             setVal('edit_proj_end', project.endDate ? project.endDate.split('T')[0] : '');
             
             const latEl = document.getElementById('edit_proj_lat');
             const lngEl = document.getElementById('edit_proj_lng');
             if (latEl) latEl.textContent = Number(project.lat || -13.9626).toFixed(6);
             if (lngEl) lngEl.textContent = Number(project.lng || 33.7741).toFixed(6);

             this.fetchSupervisors('edit_proj_supervisor').then(() => {
                 setVal('edit_proj_supervisor', project.managerId || project.manager_id);
             });

             this.initializeProjectMap(0, 'edit-project-map', {
                 lat: project.lat || -13.9626,
                 lng: project.lng || 33.7741,
                 radius: project.radius || 500
             });

             const radiusVal = project.radius || 500;
             const radEl = document.getElementById('edit_proj_radius_input');
             if (radEl) {
                 radEl.value = radiusVal;
                 const radValEl = document.getElementById('edit_proj_radius_val');
                 if (radValEl) radValEl.innerText = radiusVal + 'm';
             }
         });
    },

    async handleUpdateProject() {
        const id = document.getElementById('edit_proj_id').value;
        const projectType = document.getElementById('edit_proj_type')?.value || 'road_works';

        const data = {
            name: document.getElementById('edit_proj_name').value,
            client: document.getElementById('edit_proj_client').value,
            status: document.getElementById('edit_proj_status').value,
            budgetTotal: parseFloat(document.getElementById('edit_proj_budget').value),
            startDate: new Date(document.getElementById('edit_proj_start').value).toISOString(),
            endDate: new Date(document.getElementById('edit_proj_end').value).toISOString(),
            managerId: parseInt(document.getElementById('edit_proj_supervisor').value),
            projectType: projectType,
            lat: parseFloat(document.getElementById('edit_proj_lat').textContent),
            lng: parseFloat(document.getElementById('edit_proj_lng').textContent),
            radius: parseInt(document.getElementById('edit_proj_radius_input')?.value || 500)
        };

        if (!data.name || !data.managerId) {
            window.toast.show('Project name and supervisor are mandatory', 'error');
            return;
        }

        try {
            await projects.update(id, data);
            window.toast.show('Project master updated successfully', 'success');
            window.drawer.close();
            this.loadProjectsFromAPI(); // Refresh table and stats
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    },

    openSuspendProjectDrawer(id) {
         window.drawer.open('Suspend Project', window.DrawerTemplates.suspendProject);
         projects.getById(id).then(response => {
              const p = response.data || response;
              document.getElementById('suspend_project_id').value = p.id;
              document.getElementById('suspend_project_name').value = p.name;
         });
    },

    async handleSuspendProject() {
         const id = document.getElementById('suspend_project_id').value;
         const reason = document.getElementById('suspend_project_reason').value;
         
         if (!reason) {
             window.toast.show('Please provide a reason', 'error');
             return;
         }

         try {
             await projects.update(id, { status: 'suspended', suspensionReason: reason });
             window.toast.show('Project suspended', 'warning');
             window.drawer.close();
             this.loadProjectsFromAPI();
         } catch (error) {
             window.toast.show(error.message, 'error');
         }
    },

    async handleDeleteProject(id) {
         const reason = prompt("Enter reason for deletion (This will be logged):");
         if (!reason) return;

         try {
             await projects.remove(id, reason);
             window.toast.show('Project deleted', 'success');
             this.loadProjectsFromAPI();
         } catch (error) {
             window.toast.show(error.message, 'error');
         }
    },

    openExtendProjectDrawer(id) {
        if (!id) return;
        projects.getById(id).then(response => {
            const project = response.data || response;
            window.drawer.open('Extend Project Timeline', window.DrawerTemplates.extendProject(project));

            // Live preview: show days being added
            setTimeout(() => {
                const newEndInput = document.getElementById('extend_new_end');
                if (newEndInput) {
                    newEndInput.addEventListener('change', () => {
                        const currentEnd = document.getElementById('extend_current_end').value;
                        const newEnd = newEndInput.value;
                        if (currentEnd && newEnd) {
                            const days = Math.round((new Date(newEnd) - new Date(currentEnd)) / (1000*60*60*24));
                            const preview = document.getElementById('extend_preview');
                            const previewText = document.getElementById('extend_preview_text');
                            if (days > 0) {
                                preview.style.display = 'block';
                                previewText.textContent = `Extension of ${days} day(s). All trailing tasks and contracts will shift by ${days} day(s).`;
                            } else {
                                preview.style.display = 'none';
                            }
                        }
                    });
                }
            }, 200);
        });
    },

    async handlePhaseEditorSave() {
        if (!this.ganttPhaseEditorTasks) return;
        
        const btn = document.querySelector('button[onclick="window.app.pmModule.handlePhaseEditorSave()"]');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const tasksApi = await import('../../src/api/tasks.api.js');
            const updates = [];
            for (const t of this.ganttPhaseEditorTasks) {
                const s = document.getElementById(`phase-start-${t.id}`)?.value;
                const e = document.getElementById(`phase-end-${t.id}`)?.value;
                if (!s || !e) continue;
                
                const origS = t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '';
                const origE = t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '';
                
                if (s !== origS || e !== origE) {
                    updates.push(tasksApi.default.update(t.id, { startDate: s, endDate: e }));
                }
            }
            
            if (updates.length > 0) {
                await Promise.all(updates);
                window.toast?.show(`Updated ${updates.length} phases and cascaded dependencies`, 'success');
                this.renderGanttChart(); 
            } else {
                window.toast?.show('No changes detected', 'info');
            }
            window.drawer.close();
            
        } catch (error) {
            console.error('Failed to save phases', error);
            window.toast?.show('Error saving phases', 'error');
        } finally {
            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        }
    },

    async handleSubmitExtensionRequest() {
        const projectIdStr = document.getElementById('ext-req-project-id')?.value;
        const newDate = document.getElementById('ext-req-new-date')?.value;
        const justification = document.getElementById('ext-req-justification')?.value;
        const warningEl = document.getElementById('ext-req-warning');
        
        let projectId = projectIdStr;
        if (!projectId && window.app?.pmModule?.selectedProjectId) projectId = window.app.pmModule.selectedProjectId;
        if (!projectId && window.app?.fsModule?.assignedProject?.id) projectId = window.app.fsModule.assignedProject.id;
        if (!projectId && window.app?.caModule?.selectedProjectId) projectId = window.app.caModule.selectedProjectId;
        
        if (warningEl) warningEl.style.display = 'none';

        if (!projectId) {
            if (warningEl) { warningEl.textContent = "Error: No project selected or found. Go to a project view first."; warningEl.style.display = 'block'; }
            return;
        }

        if (!newDate) {
            if (warningEl) { warningEl.textContent = "Please select a requested end date."; warningEl.style.display = 'block'; }
            return;
        }

        if (!justification || justification.trim().length < 20) {
            if (warningEl) { warningEl.textContent = "Justification must be at least 20 characters explaining the delay."; warningEl.style.display = 'block'; }
            return;
        }

        const btn = document.getElementById('ext-req-submit-btn');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        btn.disabled = true;

        try {
            const timelineApi = await import('../../src/api/timelineExtensions.api.js');
            await timelineApi.default.create({
                projectId,
                requestedEndDate: newDate,
                justification: justification.trim()
            });
            window.toast?.show('Timeline extension requested. PM notified.', 'success');
            window.drawer.close();
        } catch (error) {
            if (warningEl) { warningEl.textContent = error.message || 'Failed to submit request'; warningEl.style.display = 'block'; }
            console.error('Extension request error:', error);
        } finally {
            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        }
    },

    async handleExtendProject() {
        const projectId = document.getElementById('extend_project_id')?.value;
        const newEndDate = document.getElementById('extend_new_end')?.value;
        const reason = document.getElementById('extend_reason')?.value;

        if (!newEndDate) {
            window.toast.show('Please select a new end date', 'error');
            return;
        }
        if (!reason) {
            window.toast.show('Please provide a reason for extension', 'error');
            return;
        }

        try {
            window.toast.show('Extending project timeline...', 'info');
            const response = await fetch(`/api/v1/projects/${projectId}/extend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ newEndDate, reason }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Extension failed');
            }

            const data = result.data || result;
            window.toast.show(
                `Project extended by ${data.extension?.shiftDays || '?'} days. ${data.cascade?.shifted || 0} tasks shifted. ${data.notified || 0} stakeholders notified.`,
                'success'
            );
            window.drawer.close();
            this.loadProjectsFromAPI();
            this.renderGanttChart();
        } catch (error) {
            window.toast.show(error.message, 'error');
        }
    }
};
