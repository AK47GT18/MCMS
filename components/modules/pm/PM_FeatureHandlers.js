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

export const PM_FeatureHandlers = {
    async handleIssueSubmit() {
        try {
            const category = document.getElementById('issue-category').value;
            const priority = document.getElementById('issue-priority').value;
            const description = document.getElementById('issue-description').value;

            if (!description) {
                window.toast.show('Please provide a description', 'error');
                return;
            }

            window.toast.show('Submitting issue report...', 'info');
            await issues.create({
                projectId: this.selectedProjectId,
                category,
                priority,
                description,
                status: 'open'
            });

            window.toast.show('Issue report submitted successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'issues') this.loadIssuesFromAPI();
        } catch (error) {
            console.error('Issue submission error:', error);
            window.toast.show('Failed to submit issue: ' + error.message, 'error');
        }
    },

    async handleAddTask() {
        try {
            const name = document.getElementById('task-name').value;
            const startDate = document.getElementById('task-start').value;
            const endDate = document.getElementById('task-end').value;
            const dependencies = document.getElementById('task-dependencies')?.value || '';

            if (!name || !startDate || !endDate) {
                window.toast.show('Task name and dates are required', 'error');
                return;
            }

            window.toast.show('Creating task...', 'info');
            await tasks.create({
                projectId: this.selectedProjectId,
                name,
                startDate,
                endDate,
                dependencies,
                progress: 0
            });

            window.toast.show('Task created successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'gantt' || this.currentView === 'execution') this.renderGanttChart();
        } catch (error) {
            console.error('Task creation error:', error);
            window.toast.show('Failed to create task: ' + error.message, 'error');
        }
    },

    async handleResolveIssue(id) {
        try {
            const status = document.getElementById('resolution-status').value;
            const notes = document.getElementById('resolution-notes').value;

            if (!notes) {
                window.toast.show('Resolution notes required', 'error');
                return;
            }

            window.toast.show('Updating issue status...', 'info');
            await issues.update(id, {
                status,
                resolutionNotes: notes,
                resolvedAt: status === 'resolved' ? new Date().toISOString() : null
            });

            window.toast.show('Issue updated successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'issues') this.loadIssuesFromAPI();
        } catch (error) {
            console.error('Issue resolution error:', error);
            window.toast.show('Failed to update issue: ' + error.message, 'error');
        }
    },

    initIssueResolutionForm(issue) {
        setTimeout(() => {
            const notesEl = document.getElementById('resolution-notes');
            if (notesEl && issue.resolutionNotes) notesEl.value = issue.resolutionNotes;
            const statusEl = document.getElementById('resolution-status');
            if (statusEl && issue.status) statusEl.value = issue.status === 'open' ? 'in_progress' : issue.status;
        }, 100);
    },

    async handleAddVehicle() {
        try {
            const name = document.getElementById('vehicle-name').value;
            const plate = document.getElementById('vehicle-plate').value;
            const type = document.getElementById('vehicle-type').value;

            if (!name || !plate) {
                window.toast.show('Please fill name and plate', 'error');
                return;
            }

            window.toast.show('Registering asset...', 'info');
            await assets.create({ name, plateNumber: plate, type, status: 'active', condition: 'good' });
            window.toast.show('Asset registered successfully', 'success');
            window.drawer.close();
            if (this.currentView === 'fleet') this.loadAssetsFromAPI();
        } catch (error) {
            console.error('Asset registration error:', error);
            window.toast.show('Failed to register asset: ' + error.message, 'error');
        }
    },

    async handleReviewVehicle(id, action) {
        try {
            window.toast.show(`Processing vehicle ${action}...`, 'info');
            await assets.update(id, { status: action === 'approved' ? 'active' : 'rejected' });
            window.toast.show(`Vehicle request ${action}`, 'success');
            window.drawer.close();
            if (this.currentView === 'fleet') this.loadAssetsFromAPI();
        } catch (error) {
            console.error('Vehicle review error:', error);
            window.toast.show('Failed to process vehicle request', 'error');
        }
    },

    async handleCompleteMaintenance(assetId) {
        try {
            const summary = document.getElementById('maint-summary').value;
            const cost = document.getElementById('maint-cost').value;

            if (!summary) {
                window.toast.show('Please provide maintenance summary', 'error');
                return;
            }

            window.toast.show('Logging maintenance...', 'info');
            await assets.update(assetId, {
                lastMaintenance: new Date().toISOString(),
                maintenanceSummary: summary,
                maintenanceCost: parseFloat(cost) || 0,
                status: 'active'
            });

            window.toast.show(`Maintenance logged for asset ${assetId}`, 'success');
            window.drawer.close();
            if (this.currentView === 'fleet') this.loadAssetsFromAPI();
        } catch (error) {
            console.error('Maintenance log error:', error);
            window.toast.show('Failed to log maintenance', 'error');
        }
    },

    async handleTransactionSubmit() {
        try {
            const category = document.getElementById('trx-category').value;
            const amount = document.getElementById('trx-amount').value;
            const contractor = document.getElementById('trx-contractor').value;
            const description = document.getElementById('trx-description').value;

            if (!amount || !contractor) {
                window.toast.show('Please fill all required fields', 'error');
                return;
            }

            window.toast.show('Processing transaction...', 'info');
            await procurement.create({
                category,
                amount: parseFloat(amount),
                vendorName: contractor,
                projectId: this.selectedProjectId,
                status: 'pending'
            });

            window.toast.show('Transaction processed and awaiting approval', 'success');
            window.drawer.close();
            if (this.currentView === 'budget') this.loadTransactionsFromAPI();
        } catch (error) {
            console.error('Transaction error:', error);
            window.toast.show('Failed to process transaction: ' + error.message, 'error');
        }
    },

    async handleRequestFunds() {
        try {
            const amount = document.getElementById('fund-amount').value;
            const purpose = document.getElementById('fund-purpose').value;
            
            if (!amount || !purpose) {
                window.toast.show('Amount and purpose are required', 'error');
                return;
            }

            window.toast.show('Submitting fund request...', 'info');
            await requisitions.create({
                projectId: this.selectedProjectId,
                amount: parseFloat(amount),
                purpose: purpose,
                status: 'pending'
            });

            window.toast.show('Funding request submitted to Commissioner', 'success');
            window.drawer.close();
            if (this.currentView === 'budget' || this.currentView === 'reviews') this.render();
        } catch (error) {
            console.error('Fund request error:', error);
            window.toast.show('Failed to request funds', 'error');
        }
    },

    async handleContractUpload() {
        try {
            const title = document.getElementById('cnt-title').value;
            const type = document.getElementById('cnt-type').value;
            const expiry = document.getElementById('cnt-expiry').value;

            if (!title || !expiry) {
                window.toast.show('Contract title and expiry are required', 'error');
                return;
            }

            window.toast.show('Uploading contract document...', 'info');
            await contracts.create({ title, type, expiryDate: expiry, status: 'active' });
            window.toast.show('Contract registered in legal repository', 'success');
            window.drawer.close();
            if (this.currentView === 'contracts') this.loadContractsFromAPI();
        } catch (error) {
            console.error('Contract upload error:', error);
            window.toast.show('Failed to upload contract', 'error');
        }
    },

    async handleDailyLogSubmit(payloadOverride = null) {
        try {
            // Get location if available
            let lat = null, lng = null;
            if (navigator.geolocation) {
                try {
                    window.toast.show('Verifying site coordinates...', 'info');
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { 
                            enableHighAccuracy: true, 
                            timeout: 10000 
                        });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) {
                    console.warn('GPS capture failed:', e);
                    if (e.code === 1) {
                        throw new Error('Location permission denied. Please enable GPS in your browser/device settings to submit logs.');
                    }
                    throw new Error('Could not verify location. Please ensure location services are enabled and you have internet/GPS connection.');
                }
            } else {
                throw new Error('Geolocation is not supported by your browser.');
            }

            window.toast.show('Uploading site log...', 'info');
            
            // Build payload
            const payload = {
                projectId: this.selectedProjectId || (window.app.fsModule ? window.app.fsModule.assignedProject?.id : null),
                date: new Date().toISOString().split('T')[0],
                narrative: payloadOverride?.narrative || document.getElementById('log-narrative')?.value || 'Daily Progress',
                status: 'submitted',
                submissionLat: lat,
                submissionLng: lng
            };
            
            // Add extra fields if payload override provided
            if (payloadOverride) {
                if (payloadOverride.taskId) payload.taskId = parseInt(payloadOverride.taskId);
                if (payloadOverride.progressIncrement) payload.progressIncrement = parseInt(payloadOverride.progressIncrement);
                if (payloadOverride.expenseItems) payload.expenseItems = payloadOverride.expenseItems;
                if (payloadOverride.sos) payload.isSos = true;
            }

            await dailyLogs.create(payload);
            window.toast.show('Daily progress logged successfully', 'success');
            window.drawer.close();
            this.render(); 
        } catch (error) {
            console.error('Log submission error:', error);
            let errorMsg = error.response?.data?.message || error.message || 'Failed to submit log';
            errorMsg = errorMsg.replace('ValidationError: ', '').replace('AppError: ', '');
            window.toast.show(errorMsg, 'error');
        }
    },

    validateProjectForm() {
        const fields = ['proj_name', 'proj_client', 'proj_budget', 'proj_supervisor', 'proj_start', 'proj_end'];
        let isValid = true;

        fields.forEach(id => {
            this.validateInline(id);
            const errorEl = document.getElementById(id + '-error');
            if (errorEl && errorEl.style.display !== 'none') {
                isValid = false;
            }
        });

        if (!isValid) {
            window.toast.show('Please correct the errors in Step 1', 'warning');
            return false;
        }

        if (!this.wizardState?.locationSet) {
            window.toast.show('Please click on the map to set the site location and geofence center', 'warning');
            const mapPrompt = document.getElementById('map-prompt');
            if (mapPrompt) {
                mapPrompt.classList.add('v-shake');
                setTimeout(() => mapPrompt.classList.remove('v-shake'), 400);
            }
            return false;
        }

        return true;
    },

    updateItemQuantity(type, index, value) {
        const est = this.wizardState.roadEstimatePreview;
        const list = type === 'layer' ? est.layers : est.accessories;
        const item = list[index];
        
        const newQty = parseFloat(value) || 0;
        const oldQty = item.totalQuantity;
        
        // Update quantity
        item.totalQuantity = newQty;
        
        // Recalculate costs proportionally if they weren't manually overridden yet?
        // Actually, usually PM wants to change quantity which then updates total cost
        const unitCostHigh = item.totalCostHigh / (oldQty || 1);
        const unitCostLow = item.totalCostLow / (oldQty || 1);
        
        item.totalCostHigh = newQty * unitCostHigh;
        item.totalCostLow = newQty * unitCostLow;
        
        // Re-render the receipt to show new totals
        this.renderEstimatedReceipt();
    },

    updateItemCost(type, index, value) {
        const est = this.wizardState.roadEstimatePreview;
        const list = type === 'layer' ? est.layers : est.accessories;
        const item = list[index];
        
        item.totalCostHigh = parseFloat(value) || 0;
        
        // Re-render to update the grand total and gap
        this.renderEstimatedReceipt();
    },

    renderEstimatedReceipt() {
        this.generateEstimatedReceipt(); 
    }
};
