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
                const parsedCache = JSON.parse(cached);
                if (parsedCache.isEditMode) {
                    this.clearWizardCache();
                } else {
                    this.wizardState = parsedCache;
                    console.log('[DEBUG] Restored wizard state from cache');
                }
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
        
        this.clearWizardCache();
        
        this.wizardState = {
            isEditMode: true,
            projectId: id,
            currentStep: 1,
            isRoad: true,
            roadEstimatePreview: null,
            formData: {}
        };
        
        window.drawer.open('Edit Project Details', window.DrawerTemplates.newProject);
        
        // Let the drawer render first
        setTimeout(() => {
            // Change title in the drawer
            const titleEl = document.querySelector('.drawer-header h3');
            if (titleEl) titleEl.innerText = 'Edit Project Details';
            
            const btnSubmit = document.getElementById('wizard-submit');
            if (btnSubmit) btnSubmit.innerText = 'Update Project';
            
            const editJustContainer = document.getElementById('edit_justification_container');
            if (editJustContainer) editJustContainer.style.display = 'block';

            const docLabel = document.getElementById('project_document_label');
            if (docLabel) docLabel.innerText = 'Attach Updated Document (Optional)';
            
            projects.getById(id).then(response => {
                const project = response.data || response;
                
                const setVal = (fid, val) => {
                    const el = document.getElementById(fid);
                    if (el) el.value = val !== undefined && val !== null ? val : '';
                };

                // Populate Step 1
                setVal('proj_name', project.name);
                setVal('proj_client', project.client);
                setVal('proj_budget', project.budgetTotal || project.budget);
                setVal('proj_start', project.startDate ? project.startDate.split('T')[0] : '');
                setVal('proj_end', project.endDate ? project.endDate.split('T')[0] : '');
                
                const latEl = document.getElementById('proj_lat');
                const lngEl = document.getElementById('proj_lng');
                if (latEl) latEl.textContent = Number(project.lat || -13.9626).toFixed(6);
                if (lngEl) lngEl.textContent = Number(project.lng || 33.7741).toFixed(6);

                this.fetchSupervisors('proj_supervisor').then(() => {
                    setVal('proj_supervisor', project.managerId || project.manager_id);
                });

                this.initializeProjectMap(0, 'project-map', {
                    lat: project.lat || -13.9626,
                    lng: project.lng || 33.7741,
                    radius: project.radius || 500
                });

                const radiusVal = project.radius || 500;
                const radEl = document.getElementById('proj_radius_input');
                if (radEl) {
                    radEl.value = radiusVal;
                    const radValEl = document.getElementById('proj_radius_val');
                    if (radValEl) radValEl.innerText = radiusVal + 'm';
                }

                // Populate Road Specification (Step 2 & 3)
                if (project.roadSpecification) {
                    const rs = project.roadSpecification;
                    setVal('road_type', rs.roadType);
                    setVal('road_length', rs.lengthKm);
                    setVal('road_width', rs.widthM);
                    setVal('road_lanes', rs.lanes || 2);
                    setVal('road_terrain', rs.terrain);
                    setVal('road_zone', rs.geographicZone);
                    setVal('road_town_dist', rs.nearestTownKm);

                    // Accessories & Lighting
                    if (rs.accessories && Array.isArray(rs.accessories)) {
                        rs.accessories.forEach(acc => {
                            // Check if it's a standard accessory (checkbox)
                            const cb = document.querySelector(`input[name="road_acc"][value="${acc.category}"]`);
                            if (cb) {
                                cb.checked = true;
                            } else if (acc.category && acc.category.startsWith('lighting_')) {
                                // It's a lighting category, set the dropdown
                                setVal('acc_lighting', acc.category);
                            }
                        });
                    }
                }
                
                // Save to cache so the wizard can maintain state between steps
                setTimeout(() => {
                    this.saveWizardCache();
                    // Take a snapshot of the data to detect changes
                    this.wizardState.originalSnapshot = JSON.stringify(this.wizardState.formData);
                    this.updateFinalSummary();
                }, 500);
            });
        }, 100);
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

    async handleCompleteProject(id) {
         if (!confirm("Are you sure you want to mark this project as completed? This action cannot be easily undone.")) return;

         try {
             await projects.update(id, { status: 'completed' });
             window.toast.show('Project marked as completed', 'success');
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

};
