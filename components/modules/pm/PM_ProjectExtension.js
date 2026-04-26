import client from '../../../src/api/client.js';
import projects from '../../../src/api/projects.api.js';
import users from '../../../src/api/users.api.js';
import dailyLogs from '../../../src/api/dailyLogs.api.js';
import requisitions from '../../../src/api/requisitions.api.js';
import audit from '../../../src/api/audit.api.js';
import procurement from '../../../src/api/procurement.api.js';
import assets from '../../../src/api/assets.api.js';
import issues from '../../../src/api/issues.api.js';
import tasksApi from '../../../src/api/tasks.api.js';
import contracts from '../../../src/api/contracts.api.js';

export const PM_ProjectExtension = {
    // --- PROJECT EXTENSION ---
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
    }

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
    }

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
