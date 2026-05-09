import client from '../../../src/api/client.js';
import assets from '../../../src/api/assets.api.js';

export const EC_Registry = {
    getRegistryView() {
        const activeTab = this.registryActiveTab || 'owned';
        return `
            <div style="display: flex; gap: 12px; margin-bottom: 24px; background: var(--slate-100); padding: 6px; border-radius: 12px; width: fit-content;">
                <button class="btn ${activeTab === 'owned' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.ecModule?.switchRegistryTab('owned')">
                    <i class="fas fa-truck-monster"></i> Owned Fleet (${this.assetRegistry.length})
                </button>
                <button class="btn ${activeTab === 'rental' ? 'btn-primary' : 'btn-secondary'}" style="${activeTab === 'rental' ? 'background: var(--orange); border-color: var(--orange);' : ''}" onclick="window.app.ecModule?.switchRegistryTab('rental')">
                    <i class="fas fa-handshake"></i> External Rental Fleet (${(this.rentalContracts || []).length})
                </button>
            </div>

            ${activeTab === 'rental' ? this._renderRentalFleetTable() : this._renderOwnedFleetTable()}
        `;
    },

    switchRegistryTab(tabId) {
        this.registryActiveTab = tabId;
        this._refreshCurrentView();
    },

    _renderOwnedFleetTable() {
        return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header">
                    <div class="card-title">Master Asset Registry (Owned Fleet)</div>
                    <button class="btn btn-primary" onclick="window.drawer.open('Asset Procurement', window.DrawerTemplates.requestNewAsset)">
                        <i class="fas fa-plus-circle"></i> Request New Asset
                    </button>
                </div>
                ${this.isLoadingAssets && this.assetRegistry.length === 0
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Loading asset registry…</div></div>'
                : this.assetRegistry.length === 0
                    ? '<div style="padding: 60px; text-align: center; color: var(--slate-400); background: #f8fafc; border-radius: 12px; border: 1px dashed var(--slate-200); margin: 20px;"><i class="fas fa-box-open" style="font-size:32px; margin-bottom:12px; opacity:0.5;"></i><div style="font-weight: 700; color: var(--slate-600);">No Assets Found</div><div style="font-size:12px;">The asset registry is currently empty.</div></div>'
                    : `<table>
                        <thead>
                            <tr><th>Asset ID</th><th>Name</th><th>Category</th><th>Hours/Km</th><th>Est. Value</th><th>Status</th><th style="text-align: right;">Action</th></tr>
                        </thead>
                        <tbody>
                            ${this.assetRegistry.map(asset => `
                                <tr>
                                    <td><span class="project-id">${asset.assetCode || 'EQP-' + asset.id}</span></td>
                                    <td style="font-weight: 700;">${asset.name}</td>
                                    <td>${asset.category || '--'}</td>
                                    <td style="font-family: 'JetBrains Mono';">${asset.hoursOrKm ? asset.hoursOrKm.toLocaleString() + ' Hr' : '--'}</td>
                                    <td style="font-family: 'JetBrains Mono'; font-size: 12px;">${asset.estimatedValue ? 'MWK ' + Number(asset.estimatedValue).toLocaleString() : '--'}</td>
                                    <td><span class="status ${asset.status === 'available' ? 'active' : asset.status === 'checked_out' ? 'pending' : 'locked'}" style="${asset.status === 'maintenance' ? 'background: var(--red-light); color: var(--red);' : ''}">${(asset.status || 'unknown').replace(/_/g, ' ')}</span></td>
                                    <td style="text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                                            <button class="btn btn-secondary" style="font-size: 11px; padding: 6px 12px;" onclick="window.app.ecModule.handleAssetHistory('${asset.id}')">
                                                <i class="fas fa-history"></i> History
                                            </button>
                                            <button class="btn btn-secondary" style="font-size: 11px; padding: 6px 12px; border-color: var(--red); color: var(--red);" 
                                                onclick="window.app.ecModule.openMarkBrokenDrawer({id: '${asset.id}', assetName: '${(asset.name || '').replace(/'/g, "\\'")}', assetCode: '${asset.assetCode || ''}', project: ${JSON.stringify(asset.project || null)}})">
                                                <i class="fas fa-wrench"></i> Report Breakdown
                                            </button>
                                            ${asset.status === 'maintenance' ?
                                                `<button class="btn btn-primary" style="font-size: 11px; padding: 6px 12px;" onclick="window.app.ecModule.handleResolveIssue('${asset.id}', '${asset.name}')"><i class="fas fa-wrench"></i> Mark Fixed</button>`
                                                : asset.status === 'available' ?
                                                `<button class="btn btn-primary" style="font-size: 11px; padding: 6px 12px; background: var(--emerald-600); border-color: var(--emerald-600);" onclick="window.app.ecModule.openDispatchAssetDrawer({id: '${asset.id}', name: '${(asset.name || '').replace(/'/g, "\\'")}', code: '${asset.assetCode || ''}'})"><i class="fas fa-shipping-fast"></i> Dispatch</button>`
                                                : ''
                                            }
                                            ${asset.status === 'checked_out' ?
                            `<button class="btn btn-primary" style="font-size: 11px; padding: 6px 12px; background: var(--indigo-600); border-color: var(--indigo-600);" onclick="window.app.ecModule.openRecallAssetDrawer({id: '${asset.id}', assetName: '${(asset.name || '').replace(/'/g, "\\'")}', projectId: '${asset.projectId}'})">
                                <i class="fas fa-undo"></i> Recall to Yard
                            </button>`
                            : ''
                        }
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
            }
            </div>
        `;
    },

    _renderRentalFleetTable() {
        return `
            <div class="data-card">
                <div class="data-card-header">
                    <div class="card-title">Contractual Fleet (Rental)</div>
                    <button class="btn btn-primary" style="background: var(--slate-900); border: none;" onclick="window.app.ecModule.openRequestRentalAssetDrawer()">
                        <i class="fas fa-truck-loading"></i> Request Deployment
                    </button>
                </div>
                ${!this.rentalsLoaded
                ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px;"></i><div>Checking rental contracts…</div></div>'
                : (this.rentalContracts || []).length === 0
                    ? '<div style="padding: 40px; text-align: center; color: var(--slate-400);">No active rentals currently in the system.</div>'
                    : `<table>
                        <thead>
                            <tr><th>Contract</th><th>Machine</th><th>Provider</th><th>Project</th><th>Expiry</th><th>Status</th><th style="text-align: right;">Lifecycle Action</th></tr>
                        </thead>
                        <tbody>
                            ${this.rentalContracts.map(c => {
                        const isExpired = c.endDate ? new Date(c.endDate) < new Date() : false;
                        const machineName = c.machineType || c.title || "Rental Equipment";
                        const vendor = c.vendorName || c.vendor?.name || c.vendor || "Unassigned";
                        const ref = c.refCode || c.contractCode || c.code || "RENT-" + c.id;

                        return `
                                <tr>
                                    <td><span class="project-id">${ref}</span></td>
                                    <td style="font-weight: 700;">${machineName}</td>
                                    <td style="font-size: 12px;">${vendor}</td>
                                    <td>${c.project?.name || 'Unassigned'}</td>
                                    <td style="font-size: 12px; color: ${isExpired ? 'var(--red)' : 'var(--slate-600)'};">
                                        ${c.endDate ? new Date(c.endDate).toLocaleDateString() : 'N/A'}
                                        ${isExpired ? '<div style="font-size:10px; font-weight:800;">OVERDUE</div>' : ''}
                                    </td>
                                    <td><span class="status ${c.status === 'Active' || c.status === 'active' ? 'active' : 'locked'}">${(c.status || 'Active').toUpperCase()}</span></td>
                                    <td style="text-align: right;">
                                        ${c.status !== 'returned' && c.status !== 'Completed' && c.status !== 'ENDED' ? `
                                            <button class="btn btn-primary" style="background: var(--orange); border: none; font-size: 11px; padding: 6px 12px;" 
                                                onclick="window.app.ecModule.openConfirmReturnDrawer({contractId: '${c.id}', machineName: '${(machineName || '').replace(/'/g, "\\'")}', refCode: '${ref}', sourceModel: '${c._sourceModel || 'contract'}'})">
                                                <i class="fas fa-truck-pickup"></i> Confirm Returned
                                            </button>
                                        ` : '<span style="font-size: 11px; color: var(--emerald); font-weight:700;"><i class="fas fa-check-circle"></i> Completed</span>'}
                                    </td>
                                </tr>
                                `;
                    }).join('')}
                        </tbody>
                    </table>`
            }
            </div>
        `;
    },

    async _loadAssets() {
        if (this.isLoadingAssets) return;
        this.isLoadingAssets = true;
        try {
            // Load owned assets in parallel with both rental sources and projects
            const [assetRes, vehicleContractsRes, unifiedContractsRes, projectsRes] = await Promise.all([
                assets.getAll(),
                client.get('/vehicle-contracts').catch(() => ({ data: [] })),
                client.get('/contracts?limit=100').catch(() => ({ data: [] })),
                client.get('/projects?status=active').catch(() => ({ data: [] }))
            ]);

            const assetData = assetRes.data || assetRes;
            this.assetRegistry = Array.isArray(assetData) ? assetData : (assetData.items || []);

            // --- Unified Rental Fleet Aggregation with Deduplication ---
            // Source 1: VehicleContract model (legacy)
            const vcData = Array.isArray(vehicleContractsRes) ? vehicleContractsRes : (vehicleContractsRes.data || vehicleContractsRes.contracts || []);
            const vcRentals = vcData.map(vc => ({
                ...vc,
                _sourceModel: 'vehicleContract',
                _dedupeKey: `vc_${vc.id}`
            }));

            // Source 2: Unified Contract model (contractType = rental/RENTAL)
            const allContracts = Array.isArray(unifiedContractsRes) ? unifiedContractsRes : (unifiedContractsRes.data || []);
            const contractRentals = allContracts
                .filter(c => c.contractType === 'rental' || c.contractType === 'RENTAL')
                .map(c => ({
                    ...c,
                    _sourceModel: 'contract',
                    _dedupeKey: `ct_${c.id}`
                }));

            // Deduplicate: prefer Contract model if refCode matches
            const seenRefCodes = new Set();
            const mergedRentals = [];

            // Add Contract-model items first (they are the canonical source)
            for (const cr of contractRentals) {
                const refKey = (cr.refCode || '').toLowerCase();
                if (refKey) seenRefCodes.add(refKey);
                mergedRentals.push(cr);
            }

            // Add VehicleContract items only if not duplicated by refCode
            for (const vc of vcRentals) {
                const refKey = (vc.refCode || vc.contractCode || '').toLowerCase();
                if (refKey && seenRefCodes.has(refKey)) continue; // Skip duplicate
                mergedRentals.push(vc);
            }

            this.rentalContracts = mergedRentals;
            this.activeProjects = Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []);
            this.rentalsLoaded = true;
            this._refreshCurrentView();
        } catch (error) {
            console.error('[EC] Failed to load assets/rentals:', error);
            this.rentalsLoaded = true;
        } finally {
            this.isLoadingAssets = false;
        }
    },

    openDispatchAssetDrawer(asset) {
        window.drawer.open('Dispatch Equipment', window.DrawerTemplates.dispatchOwnedAsset({
            id: asset.id,
            assetName: asset.name,
            assetCode: asset.code,
            projects: this.activeProjects || []
        }));
    },

    async _onDispatchProjectChange(projectId, assetId) {
        if (!projectId) {
            document.getElementById('timeline_intelligence').style.display = 'none';
            return;
        }

        const intelEl = document.getElementById('timeline_intelligence');
        intelEl.style.display = 'block';
        intelEl.innerHTML = `<div style="text-align: center; padding: 12px;"><i class="fas fa-circle-notch fa-spin"></i> Checking project timeline...</div>`;

        try {
            // Fetch project road specification to check phases
            const res = await client.get(`/road-estimation/${projectId}`);
            const spec = res.data || res;
            
            // Simulation: Identify if the asset matches any equipment needed in future phases
            // For now, we'll check the project end date and provide a "Smart Suggestion"
            const project = this.activeProjects.find(p => String(p.id) === String(projectId));
            const phases = spec.layers || [];
            
            if (phases.length > 0) {
                const totalDays = phases.reduce((acc, p) => acc + (p.duration || 10), 0);
                const firstPhase = phases[0];
                
                intelEl.innerHTML = `
                    <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 16px;">
                        <div style="font-size: 11px; font-weight: 800; color: #9A3412; text-transform: uppercase; margin-bottom: 4px;">
                            <i class="fas fa-lightbulb"></i> Timeline Intelligence
                        </div>
                        <div style="font-size: 13px; color: #7C2D12; font-weight: 600;">
                            Project "${project?.name}" has ${phases.length} planned phases. 
                            The next phase (${firstPhase.phaseName}) requires equipment for approx. ${firstPhase.duration || 14} days.
                        </div>
                        <div style="font-size: 11px; color: #9A3412; margin-top: 8px;">
                            <i class="fas fa-exclamation-triangle"></i> Suggestion: Ensure dispatch duration covers the "${firstPhase.phaseName}" timeline to avoid site work stoppages.
                        </div>
                    </div>
                `;
            } else {
                intelEl.innerHTML = `
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                        <div style="font-size: 12px; color: var(--slate-600);">No specific phases found. Standard 30-day dispatch duration suggested.</div>
                    </div>
                `;
            }
        } catch (err) {
            intelEl.innerHTML = `<div style="font-size: 12px; color: var(--red);">Could not verify timeline. Proceed with manual scheduling.</div>`;
        }
    },

    async submitAssetDispatch(assetId) {
        const projectId = document.getElementById('dispatch_project').value;
        const startDate = document.getElementById('dispatch_start').value;
        const endDate = document.getElementById('dispatch_end').value;
        const deliveredBy = document.getElementById('dispatch_delivered_by').value;
        const notes = document.getElementById('dispatch_notes').value;

        if (!projectId || !deliveredBy || !endDate) {
            window.toast.show('Please fill in all required fields (Project, Delivery Personnel, Return Date).', 'error');
            return;
        }

        window.toast.show('Formalizing dispatch order...', 'info');

        try {
            // Update asset status and assign to project
            await client.patch(`/assets/${assetId}`, {
                status: 'checked_out',
                projectId: parseInt(projectId),
                notes: `[DISPATCHED] ${notes || ''}`
            });

            // Create a dispatch audit log
            await client.post('/audit-logs', {
                action: 'ASSET_DISPATCHED',
                targetType: 'ASSET',
                targetId: assetId,
                details: { 
                    projectId, 
                    startDate, 
                    endDate, 
                    deliveredBy, 
                    notes,
                    msg: `Asset dispatched to site. Expected back by ${endDate}.`
                }
            });

            // Notify Field Supervisor
            const project = this.activeProjects.find(p => String(p.id) === String(projectId));
            if (project && project.managerId) {
                await client.post('/notifications', {
                    userId: project.managerId,
                    type: 'info',
                    icon: 'fa-truck-moving',
                    title: 'Asset Dispatched to Your Site',
                    message: `Internal asset has been dispatched by ${deliveredBy}. Est. Arrival: ${startDate}. Duration until ${endDate}. Please ensure site readiness.`
                });
            }

            window.toast.show('Asset successfully dispatched to project site.', 'success');
            window.drawer.close();
            this._loadAssets();
        } catch (err) {
            console.error('Dispatch failed:', err);
            window.toast.show('Failed to formalize dispatch.', 'error');
        }
    },

    openRequestRentalAssetDrawer() {
        window.drawer.open('Rental Procurement Request', window.DrawerTemplates.requestRentalAsset({
            projects: this.activeProjects || []
        }));
    },

    async submitRentalProcurementRequisition() {
        const projectId = document.getElementById('req_rental_project')?.value;
        const machineType = document.getElementById('req_rental_machine')?.value;
        const startDate = document.getElementById('req_rental_start')?.value;
        const endDate = document.getElementById('req_rental_end')?.value;
        const urgency = document.querySelector('input[name="rental_urgency"]:checked')?.value;
        const notes = document.getElementById('req_rental_notes')?.value;

        if (!projectId || !machineType || !startDate || !endDate) {
            window.toast.show('Please fill in all required fields (Project, Machine, Dates).', 'error');
            return;
        }

        window.toast.show('Submitting procurement requisition...', 'info');
        try {
            // Create a procurement requisition
            await client.post('/requisitions', {
                projectId: parseInt(projectId),
                type: 'rental_procurement',
                priority: urgency === 'Standard' ? 'medium' : urgency === 'Urgent' ? 'high' : 'critical',
                items: [{
                    itemName: `Rental: ${machineType}`,
                    quantity: 1,
                    unit: 'Unit'
                }],
                notes: `[RENTAL PROCUREMENT REQ] Machine: ${machineType}. Required: ${startDate} to ${endDate}. Urgency: ${urgency}. ${notes || ''}`
            });

            window.toast.show('Rental procurement requisition submitted successfully!', 'success');
            window.drawer.close();
        } catch (err) {
            console.error('Rental requisition failed:', err);
            window.toast.show('Failed to submit requisition.', 'error');
        }
    },

    async _onRentalContractSelected(contractId) {
        if (!contractId) return;
        const details = document.getElementById('rental_contract_details');
        const machineEl = document.getElementById('disp_machine_type');
        const daysEl = document.getElementById('disp_project_days');
        
        if (!details) return;
        details.style.display = 'block';

        const contract = this.rentalContracts.find(c => String(c.id) === String(contractId));
        if (contract) {
            machineEl.textContent = contract.machineType || contract.title || 'General Equipment';
            
            // Auto-fetch days from project phase/distribution if available
            // Simulation logic: fetch from project start/end if phase not found
            if (contract.endDate && contract.startDate) {
                const diff = Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24));
                daysEl.textContent = diff > 0 ? diff : '30';
            } else {
                daysEl.textContent = '30'; // Baseline fallback
            }
        }
    },

    async submitRentalAssetRequest() {
        // Deprecated in favor of submitRentalProcurementRequisition
        console.warn('submitRentalAssetRequest is deprecated');
    },

    openConfirmReturnDrawer(data) {
        window.drawer.open('Equipment Return', window.DrawerTemplates.confirmRentalReturn(data));
    },

    _toggleReturnDamageReport(status) {
        const report = document.getElementById('return_damage_report');
        if (report) report.style.display = status === 'Damaged' ? 'block' : 'none';
    },

    async submitRentalReturn(contractId, sourceModel) {
        const status = document.getElementById('return_asset_status').value;
        const damageNotes = document.getElementById('return_damage_notes')?.value;
        const personName = document.getElementById('return_person_name').value;
        const personContact = document.getElementById('return_person_contact').value;
        const generalNotes = document.getElementById('return_general_notes').value;

        if (!personName) {
            window.toast.show('Please enter the name of the person returning the asset.', 'warning');
            return;
        }

        if (status === 'Damaged' && !damageNotes) {
            window.toast.show('Please provide damage justification.', 'warning');
            return;
        }

        window.toast.show('Processing return audit...', 'info');

        try {
            const endpoint = sourceModel === 'vehicleContract' 
                ? `/vehicle-contracts/${contractId}/return` 
                : `/contracts/${contractId}/terminate`;
            
            await client.post(endpoint, {
                status: status === 'Damaged' ? 'Damaged' : 'Returned',
                returnedBy: personName,
                contactNo: personContact,
                notes: generalNotes,
                damageJustification: damageNotes
            });

            // Audit log
            await client.post('/audit-logs', {
                action: 'EQUIPMENT_RETURNED',
                targetType: 'CONTRACT',
                targetId: contractId,
                details: { status, personName, hasDamage: status === 'Damaged' }
            });

            window.toast.show(`Return confirmed. ${status === 'Damaged' ? 'FD alerted for damage penalties.' : 'Inventory updated.'}`, 'success');
            window.drawer.close();
            this._loadAssets();
        } catch (err) {
            console.error('Return failed:', err);
            window.toast.show('Failed to process return.', 'error');
        }
    },

    openMarkBrokenDrawer(data) {
        window.drawer.open('Report Breakdown', window.DrawerTemplates.markAssetBrokenDown({
            ...data,
            allProjects: this.activeProjects || []
        }));
    },

    async submitInternalBreakdown(assetId) {
        const location = document.getElementById('breakdown_location').value;
        const date = document.getElementById('breakdown_date').value;
        const reportedBy = document.getElementById('breakdown_reported_by').value;
        const operator = document.getElementById('breakdown_operator').value;
        const justification = document.getElementById('breakdown_justification').value;

        if (!operator || !justification || !reportedBy) {
            window.toast.show('Please provide operator, reporter name, and justification.', 'warning');
            return;
        }

        window.toast.show('Formalizing breakdown report...', 'info');

        try {
            // Mark asset as in maintenance
            await client.patch(`/assets/${assetId}`, {
                status: 'maintenance',
                lastServiceDate: new Date().toISOString()
            });

            // Create audit log with full metadata
            await client.post('/audit-logs', {
                action: 'INTERNAL_ASSET_BREAKDOWN',
                targetType: 'ASSET',
                targetId: assetId,
                details: { 
                    location, 
                    date, 
                    reportedBy, 
                    operator, 
                    justification, 
                    note: `Breakdown at ${location}. Operator: ${operator}. Reported by: ${reportedBy}` 
                }
            });

            window.toast.show('Formal report generated. Fleet maintenance team notified.', 'success');
            window.drawer.close();
            this._loadAssets();
        } catch (err) {
            console.error('Breakdown report failed:', err);
            window.toast.show('Failed to formalize report.', 'error');
        }
    },

    openRecallAssetDrawer(data) {
        window.drawer.open('Recall Equipment', `
            <div style="padding: 24px;">
                <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: #4338CA; text-transform: uppercase; margin-bottom: 8px;">Equipment Recall Order</div>
                    <div style="font-size: 18px; font-weight: 800; color: var(--slate-900);">${data.assetName}</div>
                    <div style="font-size: 12px; color: var(--slate-500);">Current Status: On Site (Checked Out)</div>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="font-weight: 700;">Reason for Recall <span style="color: var(--red);">*</span></label>
                    <select id="recall_reason" class="form-input" style="width: 100%;">
                        <option value="Maintenance Due">Routine Maintenance Due</option>
                        <option value="Redeployment">Redeployment to Priority Site</option>
                        <option value="Contract Ended">Project Phase Completion</option>
                        <option value="Replacement">Equipment Replacement</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="font-weight: 700;">Recall Urgency</label>
                    <select id="recall_urgency" class="form-input" style="width: 100%;">
                        <option value="Standard">Standard (Within 48hrs)</option>
                        <option value="High">High (Immediate Action)</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label" style="font-weight: 700;">Additional Instructions</label>
                    <textarea id="recall_notes" class="form-input" placeholder="E.g. Please clean before return, fuel tank should be full..." style="width: 100%; height: 80px; resize: none;"></textarea>
                </div>

                <button class="btn btn-primary" style="width: 100%; padding: 14px; font-weight: 800; background: var(--indigo-600); border-color: var(--indigo-600);" 
                    onclick="window.app.ecModule.submitRecallRequest('${data.id}', '${data.projectId}')">
                    <i class="fas fa-paper-plane" style="margin-right: 8px;"></i> Issue Recall Notice
                </button>
            </div>
        `);
    },

    async submitRecallRequest(assetId, projectId) {
        const reason = document.getElementById('recall_reason').value;
        const urgency = document.getElementById('recall_urgency').value;
        const notes = document.getElementById('recall_notes').value;

        window.toast.show('Issuing recall notice...', 'info');

        try {
            // Create a task for the FS
            await client.post('/tasks', {
                projectId: parseInt(projectId),
                title: `RETURN: Equipment Recall - ${reason}`,
                description: `EC has recalled this asset. Urgency: ${urgency}. ${notes}`,
                priority: urgency === 'High' ? 'high' : 'medium',
                status: 'todo',
                category: 'logistics',
                meta: { assetId, recallReason: reason }
            });

            // Update asset status to 'recalling' or similar if supported, 
            // or just log it
            await client.post('/audit-logs', {
                action: 'EQUIPMENT_RECALLED',
                targetType: 'ASSET',
                targetId: assetId,
                details: { reason, urgency, projectId }
            });

            window.toast.show('Recall notice sent to Field Supervisor.', 'success');
            window.drawer.close();
            this._loadAssets();
        } catch (err) {
            console.error('Recall failed:', err);
            window.toast.show('Failed to issue recall notice.', 'error');
        }
    }
};
