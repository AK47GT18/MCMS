export const DrawerTemplates = {
    transactionEntry: `
        <div style="padding: 24px;">
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Transaction Type</label>
                <div style="display: flex; gap: 12px;">
                     <label style="flex: 1; border: 1px solid var(--orange); background: var(--orange-light); padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--orange); cursor: pointer;">
                        <input type="radio" name="trx_type" checked style="accent-color: var(--orange);"> Expense
                     </label>
                     <label style="flex: 1; border: 1px solid var(--slate-200); padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--slate-600); cursor: pointer;">
                        <input type="radio" name="trx_type" style="accent-color: var(--slate-400);"> Invoice
                     </label>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Amount (MWK)</label>
                <input type="number" class="form-input" value="0.00" style="width: 100%; font-size: 18px; font-weight: 700; font-family: 'JetBrains Mono'; color: var(--slate-900);">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project</label>
                <select class="form-input" style="width: 100%;">
                    <option selected>CEN-01 Unilia Library Complex</option>
                    <option>MZ-05 Mzimba Clinic Extension</option>
                    <option>NOR-04 Mzuzu Bridge Repair</option>
                    <option>LIL-02 Lilongwe Mall Access Road</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Budget Line</label>
                <select class="form-input" style="width: 100%;">
                    <option selected>Materials (02-MAT)</option>
                    <option>Labor (03-LAB)</option>
                    <option>Equipment (04-EQU)</option>
                    <option>Overheads (05-OVH)</option>
                    <option>Subcontractors (06-SUB)</option>
                </select>
            </div>

             <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Description</label>
                <textarea class="form-input" rows="3" placeholder="Enter transaction details..." style="width: 100%;"></textarea>
            </div>

             <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Receipt / Invoice Upload</label>
                <div style="border: 2px dashed var(--slate-300); border-radius: 8px; padding: 32px; text-align: center; color: var(--slate-500); font-size: 13px; background: var(--slate-50); cursor: pointer;" onclick="window.toast.show('File explorer opened', 'info')">
                    <i class="fas fa-cloud-arrow-up" style="font-size: 28px; margin-bottom: 8px; color: var(--slate-400);"></i>
                    <p style="margin: 0; font-weight: 500;">Drag files here or <span style="color: var(--orange);">click to upload</span></p>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700;" onclick="window.toast.show('Transaction Processed', 'success'); window.drawer.close();">Process Transaction</button>
        </div>
    `,

    whistleblowerPortal: `
        <div style="padding: 24px;">
            <div style="background: var(--red-light); padding: 16px; border-radius: 8px; border: 1px solid var(--red-hover); margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-shield-halved" style="color: var(--red); font-size: 20px;"></i>
                <div style="font-weight: 700; color: var(--red); font-size: 14px;">Anti-Corruption & Integrity Portal</div>
            </div>

            <div class="form-group" style="margin-bottom: 20px; background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-800);">Anonymous Mode</div>
                    <div style="font-size: 11px; color: var(--slate-500);">Your identity will not be recorded</div>
                </div>
                <input type="checkbox" id="anon_mode" style="width: 20px; height: 20px; accent-color: var(--orange);" checked>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Report Category</label>
                <select class="form-input">
                    <option>Material Theft / Diversion</option>
                    <option>Bribery / Kickbacks</option>
                    <option>False Invoicing</option>
                    <option>Payroll Fraud</option>
                    <option>Safety Violation Cover-up</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Project / Department Involved</label>
                <select class="form-input">
                    <option>None Specific</option>
                    <option>CEN-01 Unilia Construction</option>
                    <option>Supply Chain / Logistics</option>
                    <option>Human Resources</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Evidence / Narrative</label>
                <textarea class="form-input" rows="5" placeholder="Please provide details, dates, and names if known..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Supporting Documents (Secure Upload)</label>
                <div style="border: 2px dashed var(--slate-300); padding: 20px; text-align: center; border-radius: 8px; background: var(--slate-50); color: var(--slate-500);">
                    <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <p style="font-size: 12px;">Files are encrypted on upload</p>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; background: var(--red); border-color: var(--red); justify-content: center; padding: 14px; font-weight: 700;" onclick="window.toast.show('Report filed securely. Internal Audit alerted.', 'error'); window.drawer.close();">Submit Secure Report</button>
        </div>
    `,

    safetyIncident: `
        <div style="padding: 24px;">
            <div style="background: var(--orange-light); padding: 16px; border-radius: 8px; border: 1px solid var(--orange-hover); margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-helmet-safety" style="color: var(--orange); font-size: 20px;"></i>
                <div style="font-weight: 700; color: var(--orange-hover); font-size: 14px;">HSE Safety Incident Report</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label">Incident Type</label>
                    <select class="form-input">
                        <option>Injury / First Aid</option>
                        <option>Near Miss</option>
                        <option>Hazard Identified</option>
                        <option>Equipment Failure (Safety)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Site Area</label>
                    <select class="form-input">
                        <option>Sector 1: Foundation</option>
                        <option>Sector 2: Warehouse</option>
                        <option>Sector 3: Main Block</option>
                    </select>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Person(s) Involved</label>
                <input type="text" class="form-input" placeholder="Name or Staff ID...">
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Incident Description</label>
                <textarea class="form-input" rows="4" placeholder="Describe what happened and immediate actions taken..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Scene Photos</label>
                <div style="border: 2px dashed var(--slate-300); padding: 24px; text-align: center; border-radius: 8px; background: var(--slate-50); color: var(--slate-500); cursor: pointer;" onclick="window.toast.show('Camera launched', 'info')">
                    <i class="fas fa-camera" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <p style="font-size: 13px; margin: 0;">Tap to Capture Site Condition</p>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; background: var(--orange); border-color: var(--orange); justify-content: center; padding: 14px; font-weight: 700;" onclick="window.toast.show('HSE Report Filed. SMS Alert sent to Safety Officer.', 'info'); window.drawer.close();">Log Incident</button>
        </div>
    `,
    
    requisitionReview: `
         <div style="padding: 0;">
            <div style="padding: 24px; border-bottom: 1px solid var(--slate-200); background: var(--slate-50);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 700; color: var(--slate-900);">REQ-089</div>
                        <div style="color: var(--slate-500); font-size: 13px;">Submitted by Frank M. (Site Manager) • 2 hours ago</div>
                    </div>
                    <span class="status pending" style="background: #FEF3C7; color: #92400E; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Pending Approval</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Project</div>
                        <div style="font-weight: 600; color: var(--slate-800);">CEN-01 Unilia</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Vendor</div>
                        <div style="font-weight: 600; color: var(--slate-800);">Malawi Cement Ltd</div>
                    </div>
                     <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Total Amount</div>
                        <div style="font-weight: 700; color: var(--slate-900); font-family: 'JetBrains Mono';">MWK 4,500,000</div>
                    </div>
                </div>
            </div>

            <div style="padding: 24px;">
                <h4 style="font-size: 13px; font-weight: 700; color: var(--slate-800); margin-bottom: 12px; text-transform: uppercase;">Line Items</h4>
                <table style="width: 100%; font-size: 13px; border: 1px solid var(--slate-200); border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
                    <thead style="background: var(--slate-50);">
                        <tr>
                            <th style="padding: 8px 12px; text-align: left; color: var(--slate-500);">Item</th>
                            <th style="padding: 8px 12px; text-align: right; color: var(--slate-500);">Qty</th>
                            <th style="padding: 8px 12px; text-align: right; color: var(--slate-500);">Unit Price</th>
                            <th style="padding: 8px 12px; text-align: right; color: var(--slate-500);">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px 12px; border-top: 1px solid var(--slate-200);">Portland Cement (50kg)</td>
                            <td style="padding: 8px 12px; text-align: right; border-top: 1px solid var(--slate-200);">600</td>
                            <td style="padding: 8px 12px; text-align: right; border-top: 1px solid var(--slate-200);">7,500</td>
                            <td style="padding: 8px 12px; text-align: right; border-top: 1px solid var(--slate-200); font-weight: 600;">4,500,000</td>
                        </tr>
                    </tbody>
                </table>

                <div style="background: var(--blue-light); border: 1px solid var(--blue); padding: 12px; border-radius: 6px; display: flex; gap: 10px; margin-bottom: 24px;">
                    <i class="fas fa-info-circle" style="color: var(--blue); margin-top: 2px;"></i>
                    <div style="font-size: 13px; color: var(--blue-dark);">
                        <strong>Budget Check:</strong> This expenditure is within the remaining budget for "Materials" (85% utilized after this).
                    </div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" style="flex: 1; justify-content: center;">Approve Requisition</button>
                    <button class="btn btn-danger" style="flex: 1; justify-content: center;">Reject</button>
                </div>
            </div>
         </div>
    `,

    investigation: `
        <div style="padding: 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: var(--red-light); color: var(--red); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px;">
                     <i class="fas fa-search-dollar"></i>
                </div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--slate-900);">Fraud Investigation Case #994</h3>
                <p style="color: var(--slate-500); font-size: 13px;">Opened manually by Stefan Mwale</p>
            </div>

            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Suspicious Pattern</div>
                <div style="font-size: 14px; font-weight: 600; color: var(--red); display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-triangle-exclamation"></i> Duplicate Payment Detected
                </div>
                <p style="font-size: 13px; color: var(--slate-600); margin-top: 8px; line-height: 1.5;">
                    Transaction REQ-095 (MWK 850,000) to Mzuzu Hardware matches TRX-9885 processed 3 days ago. Same amount, same vendor, similar description.
                </p>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Investigation Notes</label>
                <textarea class="form-input" rows="4" placeholder="Log your findings here..." style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;"></textarea>
            </div>

            <div style="display: flex; gap: 12px;">
                <button class="btn btn-action" style="flex: 1; justify-content: center;">Confirm Fraud (Freeze Vendor)</button>
                <button class="btn btn-secondary" style="flex: 1; justify-content: center;">Clear Alert</button>
            </div>
        </div>
    `,
    newProject: `
        <div class="drawer-section">
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Project Name</label>
                <input type="text" id="proj_name" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Client Name</label>
                <input type="text" id="proj_client" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
            </div>
             <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Allocated Budget (MWK)</label>
                <input type="number" id="proj_budget" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Start Date</label>
                    <input type="date" id="proj_start" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">End Date</label>
                    <input type="date" id="proj_end" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                </div>
            </div>
             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Assign Supervisor</label>
                    <select id="proj_supervisor" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                        <option>Sarah Jenkins</option>
                        <option>John Banda</option>
                        <option>Blessings Phiri</option>
                        <option>Peter Phiri</option>
                        <option>Davi Moyo</option>
                    </select>
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Project Radius (m)</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="number" id="proj_radius_input" value="500" class="form-input" style="width:70px; padding:6px; border:1px solid var(--slate-300); border-radius:6px;" oninput="document.getElementById('proj_radius_slider').value = this.value; window.app.pmModule.updateMapRadius(this.value)">
                        <input type="range" id="proj_radius_slider" value="500" min="50" max="5000" step="50" style="flex: 1; accent-color: var(--orange);" oninput="document.getElementById('proj_radius_input').value = this.value; window.app.pmModule.updateMapRadius(this.value)">
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Site Location (Click map to set)</label>
                <div id="project-map" style="height: 200px; width: 100%; border-radius: 8px; border: 1px solid var(--slate-300); margin-bottom: 8px; background: var(--slate-100); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <div style="color: var(--slate-400); font-size: 12px;"><i class="fas fa-map-marked-alt"></i> Loading Map...</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="font-size: 11px; color: var(--slate-500);">Lat: <span id="proj_lat">-13.9626</span></div>
                    <div style="font-size: 11px; color: var(--slate-500);">Long: <span id="proj_lng">33.7741</span></div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%" onclick="window.toast.show('Project created successfully', 'success'); window.drawer.close();">Create Project</button>
        </div>
    `,

    siteLogVerification: `
        <div style="padding: 0 24px; border-bottom: 1px solid var(--slate-200); background: white;">
          <div class="tabs" style="margin-bottom: 0;">
            <div class="tab active">Verify Log</div>
            <div class="tab">Budget Check</div>
            <div class="tab">Tasks</div>
          </div>
        </div>

        <div class="drawer-section">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <div style="font-size:11px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Supervisor</div>
                    <div style="font-weight:600;">John Banda</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Timestamp</div>
                    <div style="font-weight:600;">Today, 08:30 AM</div>
                </div>
            </div>

            <div class="evidence-photo" style="width: 100%; height: 200px; background: var(--slate-200); border-radius: 8px; overflow: hidden; position: relative; margin-bottom: 16px; border: 1px solid var(--slate-300);">
                <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000&auto=format&fit=crop" alt="Site Evidence" style="width: 100%; height: 100%; object-fit: cover;">
                <div class="geo-tag" style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 4px 8px; border-radius: 4px; font-family: 'JetBrains Mono'; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-map-marker-alt"></i> Sector 4 (-13.98, 33.78)
                </div>
            </div>

            <div style="font-size:13px; font-weight:700; color:var(--slate-900); margin-bottom:8px;">Narrative Report</div>
            <p style="font-size:13px; color:var(--slate-600); line-height:1.5; background:var(--slate-50); padding:12px; border-radius:6px;">
                "Excavated 50 meters of trenching. Encountered minor rock obstruction but cleared. 15 bags cement received."
            </p>
        </div>

        <div class="drawer-section">
            <div style="font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:12px;">Resource Consumption</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div style="border:1px solid var(--slate-200); padding:10px; border-radius:6px;">
                    <div style="font-size:11px; color:var(--slate-500);">Materials</div>
                    <div style="font-weight:600;">Cement: 15 Bags</div>
                    <div style="font-weight:600;">Sand: 2 Tons</div>
                </div>
                <div style="border:1px solid var(--slate-200); padding:10px; border-radius:6px;">
                    <div style="font-size:11px; color:var(--slate-500);">Attendance</div>
                    <div style="font-weight:600;">12 General</div>
                    <div style="font-weight:600;">2 Skilled</div>
                </div>
            </div>
        </div>
        
        <div class="drawer-section" style="border:none;">
             <div style="font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:12px;">Impact on Schedule</div>
             <div style="background:var(--orange-light); padding:12px; border-radius:6px; display:flex; gap:12px; align-items:center;">
                <i class="fas fa-info-circle" style="color:var(--orange);"></i>
                <div style="font-size:12px; color:var(--slate-800);">
                    Approving this log will advance <strong>Task 2.4 (Foundation)</strong> from 20% to <strong>25%</strong>.
                </div>
             </div>
        </div>

        <div style="padding: 16px 24px; border-top: 1px solid var(--slate-200); background: white; display: flex; gap: 12px;">
          <button class="btn btn-secondary" style="flex: 1; border-color: var(--red); color: var(--red);" onclick="window.drawer.close(); window.toast.show('Log rejected. Supervisor notified.', 'error')">Reject Log</button>
          <button class="btn btn-primary" style="flex: 1; background: var(--emerald);" onclick="window.drawer.close(); window.toast.show('Progress approved and Gantt updated.', 'success')">Confirm & Update Gantt</button>
        </div>
    `,

    dailyReport: `
        <div class="drawer-section">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 6px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: var(--slate-600); font-size: 12px;">GPS Location Verified</span>
                <span class="gps-badge" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.1); color: var(--emerald); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2);"><i class="fas fa-check"></i> -13.98, 33.78</span>
            </div>

            <div style="margin-bottom: 16px;">
                 <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Workforce Headcount</label>
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div>
                        <label style="font-size:11px; color:var(--slate-500);">General Labor</label>
                        <input type="number" class="form-input" value="12">
                    </div>
                    <div>
                        <label style="font-size:11px; color:var(--slate-500);">Skilled / Trades</label>
                         <input type="number" class="form-input" value="2">
                    </div>
                 </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Work Completed Today</label>
                <textarea style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" rows="3" placeholder="Describe progress..."></textarea>
            </div>

            <!-- Financial Section -->
            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:16px;">
                <label class="form-label" style="color:var(--slate-700); font-weight:700;"><i class="fas fa-coins"></i> Daily Expense Log</label>
                
                <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Total Spent Today (MWK)</label>
                    <input type="number" class="form-input" placeholder="0.00">
                </div>

                <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Expense Category</label>
                    <select class="form-input">
                        <option value="">Select Category...</option>
                        <option value="Labor">Casual Labor / Wages</option>
                        <option value="Materials">Materials Purchase</option>
                        <option value="Fuel">Fuel / Transport</option>
                        <option value="Equipment">Equipment Rental</option>
                        <option value="Other">Other / Miscellaneous</option>
                    </select>
                </div>

                 <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Details / Justification</label>
                    <input type="text" class="form-input" placeholder="e.g. Paid 3 casuals, bought 200L diesel...">
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Photo Evidence (Required)</label>
                <div style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 20px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer;" onclick="window.toast.show('Camera launched', 'info')">
                    <i class="fas fa-camera" style="font-size: 20px; margin-bottom: 8px;"></i>
                    <div style="font-weight: 600; font-size: 12px;">Tap to Take Photo</div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%" onclick="window.drawer.close(); window.toast.show('Daily Log & Expenses Submitted', 'success')">Submit Daily Log</button>
        </div>
    `,

    confirmArrival: `
         <div class="drawer-section">
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; font-size:14px; color:var(--blue);">Incoming Asset Verification</div>
                <div style="font-size:12px; color:var(--slate-500);">Ref: DISPATCH-882</div>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Asset Details</label>
                 <input type="text" class="form-input" value="CAT 320D Excavator (EQ-001)" readonly style="width:100%; padding:10px; background:#f1f5f9;">
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Responsible Person (Receiver)</label>
                <input type="text" class="form-input" placeholder="Enter Name..." style="width:100%; padding:10px;">
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Photo Evidence (Location Verification)</label>
                <div style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 20px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer;" onclick="window.toast.show('Camera launched', 'info')">
                    <i class="fas fa-camera" style="font-size: 20px; margin-bottom: 8px;"></i>
                    <div style="font-weight: 600; font-size: 12px;">Capture Asset at Location</div>
                </div>
            </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Condition Check</label>
                <div style="display:flex; gap:10px; margin-bottom:8px;">
                     <input type="checkbox" checked> <span style="font-size:13px;">Received in Good Order</span>
                </div>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Arrival Confirmed & Coordinator Notified', 'success')">Confirm Receipt</button>
         </div>
    `,

    updateTask: `
        <div class="drawer-section">
            <div style="margin-bottom:16px;">
                 <div style="font-size:12px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Task Update</div>
                 <div style="font-size:16px; font-weight:700; margin-top:4px;">Excavate Trench A</div>
                 <div style="font-size:12px; color:var(--red); margin-top:4px;"><i class="fas fa-clock"></i> Deadline: Today, 16:00</div>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Completion Percentage</label>
                <div style="display:flex; align-items:center; gap:12px;">
                    <input type="range" class="form-input" style="flex:1;" min="0" max="100" value="45" oninput="this.nextElementSibling.innerText = this.value + '%'">
                    <span style="font-weight:700; font-size:14px; width:40px;">45%</span>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Notes / Obstacles</label>
                 <textarea class="form-input" rows="3" style="width:100%; padding:10px;" placeholder="e.g. Hit rock layer, slower progress..."></textarea>
            </div>
            
            <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Task Progress Updated', 'success')">Update Progress</button>
        </div>
    `,

    dailyProgressLog: `
        <div class="drawer-section">
            <div style="background:var(--red-light); border:1px solid var(--red); color:var(--red-dark); padding:12px; border-radius:6px; margin-bottom:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-clock"></i> CRITICAL DEADLINE: 2 Days Remaining
            </div>

            <!-- Workflow Wallet Card -->
            <div style="background:var(--slate-900); color:white; padding:16px; border-radius:8px; margin-bottom:20px;">
                <div style="font-size:11px; text-transform:uppercase; color:var(--slate-400); font-weight:700;">Project Wallet</div>
                <div style="font-size:24px; font-weight:700; margin:4px 0;">MWK <span id="wallet-balance">800,000</span></div>
                <div style="font-size:11px; color:var(--slate-400);">of MWK 5,000,000 Allocated</div>
                <div style="height:4px; background:rgba(255,255,255,0.1); margin-top:12px; border-radius:2px;">
                    <div style="width:16%; height:100%; background:var(--emerald);"></div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Narrative / Progress Log</label>
                 <textarea class="form-input" rows="2" placeholder="Describe work done today... (e.g. Finished north section)"></textarea>
            </div>

            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:16px;">
                <label class="form-label" style="color:var(--slate-700); font-weight:700;"><i class="fas fa-coins"></i> Daily Spending Logic</label>
                
                <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Amount Spent (MWK)</label>
                    <input type="number" id="daily-expense" class="form-input" placeholder="0" oninput="
                        const bal = 800000 - (this.value || 0);
                        document.getElementById('wallet-balance').innerText = bal.toLocaleString();
                        document.getElementById('wallet-balance').style.color = bal < 0 ? '#ef4444' : 'white';
                    ">
                </div>

                <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Expense Category</label>
                    <select id="expense-category" class="form-input">
                        <option value="">Select Category...</option>
                        <option value="Labor">Casual Labor / Wages</option>
                        <option value="Materials">Materials Purchase</option>
                        <option value="Fuel">Fuel / Transport</option>
                        <option value="Equipment">Equipment Rental</option>
                        <option value="Other">Other / Miscellaneous</option>
                    </select>
                </div>

                 <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Expense Details (What was it used for?)</label>
                    <input type="text" id="expense-details" class="form-input" placeholder="e.g. 50 bags of cement, day labor for 3 men...">
                </div>
            </div>

             <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Progress Completion</label>
                <div style="display:flex; align-items:center; gap:12px;">
                    <input type="range" class="form-input" style="flex:1;" min="0" max="100" value="45" oninput="this.nextElementSibling.innerText = this.value + '%'">
                    <span style="font-weight:700; font-size:14px; width:40px;">45%</span>
                </div>
            </div>

            <div style="border-top:1px solid var(--slate-200); margin: 0 -24px 20px; padding: 16px 24px; background:var(--slate-50);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <label style="font-weight:700; font-size:13px; color:var(--slate-700);">Request Additional Funds?</label>
                    <input type="checkbox" id="sos-toggle" style="width:20px; height:20px; accent-color:var(--red);" onchange="document.getElementById('sos-fields').style.display = this.checked ? 'block' : 'none'">
                </div>
                
                <div id="sos-fields" style="display:none; animation: fadeIn 0.3s ease;">
                    <div class="form-group" style="margin-bottom:12px;">
                         <label class="form-label" style="color:var(--red);">Amount Needed (MWK)</label>
                         <input type="number" class="form-input" placeholder="e.g. 500,000" style="border-color:var(--red-light);">
                    </div>
                     <div class="form-group">
                         <label class="form-label" style="color:var(--red);">Reason</label>
                         <select class="form-input" style="border-color:var(--red-light);">
                            <option>Material Price Increase</option>
                            <option>Unforeseen Labor Costs</option>
                            <option>Emergency Repair</option>
                         </select>
                    </div>
                    <div style="font-size:11px; color:var(--red); margin-top:8px;"> <i class="fas fa-bolt"></i> Triggers instant alert to Finance Director</div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px;" onclick="window.drawer.close(); window.app.fsModule.handleDailyLogSubmit({ 
                expense: document.getElementById('daily-expense').value, 
                category: document.getElementById('expense-category').value,
                details: document.getElementById('expense-details').value,
                sos: document.getElementById('sos-toggle').checked 
            })">Submit Update</button>
        </div>
    `,

    logEquipmentUsage: `
         <div class="drawer-section">
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Task Description</label>
                <textarea class="form-input" rows="3" style="width:100%; padding:10px;" placeholder="What was the equipment used for?"></textarea>
             </div>
             <div class="grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                  <div class="form-group"><label class="form-label">Hours Operated</label><input type="number" class="form-input" style="width:100%; padding:10px;"></div>
                  <div class="form-group"><label class="form-label">Fuel (L)</label><input type="number" class="form-input" style="width:100%; padding:10px;"></div>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Usage Logged', 'success')">Log Usage</button>
         </div>
    `,

    returnEquipment: `
         <div class="drawer-section">
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; font-size:14px; color:var(--orange);">Return Asset to Yard</div>
                <div style="font-size:12px; color:var(--slate-500);">Action: Release form site</div>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Asset</label>
                 <input type="text" class="form-input" value="Excavator CAT 320 (EQ-001)" readonly style="width:100%; padding:10px; background:#f1f5f9;">
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Condition on Release</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>Functional / Good</option>
                    <option>Needs Service</option>
                    <option>Damaged</option>
                </select>
             </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Notes</label>
                <textarea class="form-input" rows="3" style="width:100%; padding:10px;" placeholder="Any issues during operation?"></textarea>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Return Request Sent to Coordinator', 'info')">Confirm Return</button>
         </div>
    `,

    attendanceLog: `
        <div class="drawer-section">
            <div style="margin-bottom: 16px;"><label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">General Labor</label><input type="number" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" value="12"></div>
            <div style="margin-bottom: 16px;"><label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Skilled Labor</label><input type="number" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" value="2"></div>
            <div style="margin-bottom: 16px;"><label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Absentee Notes</label><input type="text" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" placeholder="Name/Reason"></div>
            <button class="btn btn-primary" style="width:100%" onclick="window.drawer.close(); window.toast.show('Register updated', 'success')">Update Register</button>
        </div>
    `,

    incidentReport: `
         <div class="drawer-section">
            <div style="background: #FEF2F2; color: #B91C1C; padding: 12px; border-radius: 6px; font-size: 12px; margin-bottom: 16px;">
                <i class="fas fa-triangle-exclamation"></i> This will immediately alert the Project Manager and Safety Officer.
            </div>
            <div style="margin-bottom: 16px;"><label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Type</label><select style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;"><option>Injury</option><option>Near Miss</option><option>Property Damage</option></select></div>
            <div style="margin-bottom: 16px;"><label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Description</label><textarea style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" rows="3"></textarea></div>
            <div style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 24px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; transition: 0.2s; margin-bottom: 16px;"><i class="fas fa-camera"></i> Capture Scene</div>
            <button class="btn btn-primary" style="width:100%; background: var(--red); border-color: var(--red);" onclick="window.drawer.close(); window.toast.show('Alert sent to HQ', 'error')">Submit Alert</button>
        </div>
    `,

    // --- CONTRACT ADMIN TEMPLATES ---
    contractDetails: `
        <div class="drawer-section">
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
                <div><div class="stat-label">Start Date</div><div style="font-weight:600;">Jan 01, 2025</div></div>
                <div><div class="stat-label">End Date</div><div style="font-weight:600;">Dec 31, 2026</div></div>
                <div><div class="stat-label">Current Value</div><div class="mono-val" style="font-weight:700;">MWK 500,000,000</div></div>
                <div><div class="stat-label">Current Version</div><div class="version-tag">v3.0</div></div>
            </div>
        </div>
        
        <div class="drawer-section">
            <div class="stat-label" style="margin-bottom:12px;">Version History (Immutable Audit)</div>
            <table style="font-size:12px; width:100%;">
                <thead><tr><th style="text-align:left;">Ver</th><th style="text-align:left;">Date</th><th style="text-align:left;">User</th><th style="text-align:left;">Type</th><th></th></tr></thead>
                <tbody>
                    <tr><td><span class="version-tag">v3.0</span></td><td>Jan 02, 2026</td><td>S. Mwale</td><td>Amendment</td><td style="color:var(--blue);"><i class="fas fa-download"></i></td></tr>
                    <tr><td><span class="version-tag">v2.1</span></td><td>Dec 15, 2025</td><td>L. Kambala</td><td>Addendum</td><td style="color:var(--blue);"><i class="fas fa-download"></i></td></tr>
                    <tr><td><span class="version-tag">v1.0</span></td><td>Jan 01, 2025</td><td>J. Kaira</td><td>Original</td><td style="color:var(--blue);"><i class="fas fa-download"></i></td></tr>
                </tbody>
            </table>
        </div>

        <div class="drawer-section">
            <div class="stat-label" style="margin-bottom:8px;">Description</div>
            <p style="font-size:13px; color:var(--slate-600); line-height:1.5;">Main works contract for the construction of the Unilia Library Complex, including foundation, structural, and finishing works.</p>
        </div>

        <div style="padding: 16px 24px; border-top: 1px solid var(--slate-200); background: white; display: flex; gap: 12px;">
            <button class="btn btn-secondary" style="flex:1;" onclick="window.drawer.close()">Print Summary</button>
            <button class="btn btn-action" style="flex:2;" onclick="window.drawer.open('Upload Amendment', window.DrawerTemplates.uploadAmendment)"><i class="fas fa-cloud-upload-alt"></i> Upload Amendment</button>
        </div>
    `,

    newContract: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Project</label><select class="form-input" style="width:100%; padding:10px;"><option>CEN-01 Unilia</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Vendor/Client</label><select class="form-input" style="width:100%; padding:10px;"><option>Mkaka Ltd</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Contract Type</label><select class="form-input" style="width:100%; padding:10px;"><option>Main Works</option><option>Supply</option></select></div>
            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Contract Value</label>
                 <div style="position:relative;">
                      <input class="form-input" type="text" value="MWK 450,000,000" readonly style="width:100%; padding:10px; background:var(--slate-50); padding-right:30px; font-weight:600; color:var(--slate-700);">
                      <i class="fas fa-lock" style="position:absolute; right:12px; top:12px; color:var(--slate-400); font-size:12px;"></i>
                 </div>
                 <div style="font-size:11px; color:var(--slate-500); margin-top:4px; display:flex; align-items:center; gap:4px;">
                     <i class="fas fa-info-circle"></i> Linked to Project Budget (PM Approved)
                 </div>
            </div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Start Date</label><input class="form-input" type="date" style="width:100%; padding:10px;"></div>
            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Contract Document (v1.0)</label>
                 <div style="border:2px dashed var(--slate-300); padding:20px; text-align:center; border-radius:6px; color:var(--slate-500); background:var(--slate-50); cursor:pointer;">
                    <i class="fas fa-file-pdf" style="font-size:24px; margin-bottom:8px;"></i><br>
                    <span style="font-size:12px;">Drage Original Contract Here</span>
                 </div>
            </div>
            <button class="btn btn-primary" style="width:100%; border:none; padding:12px;" onclick="window.drawer.close(); window.toast.show('New Contract Created', 'success')">Create Record</button>
        </div>
    `,

    uploadAmendment: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Amendment Type</label><select class="form-input" style="width:100%; padding:10px;"><option>Variation Order</option><option>Addendum</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Change Description</label><textarea class="form-input" rows="3" style="width:100%; padding:10px;"></textarea></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Financial Impact</label><input class="form-input" type="number" placeholder="+/- Amount" style="width:100%; padding:10px;"></div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Document Upload</label>
                <div style="border:2px dashed var(--slate-300); padding:20px; text-align:center; border-radius:6px; color:var(--slate-500); background:var(--slate-50);">
                   <i class="fas fa-file-pdf" style="font-size:24px; margin-bottom:8px;"></i><br>Drag PDF here
                </div>
            </div>
            <button class="btn btn-primary" style="width:100%; border:none; padding:12px;" onclick="window.drawer.close(); window.toast.show('Amendment Uploaded', 'success')">Save New Version</button>
        </div>
    `,

    // --- EQUIPMENT COORDINATOR TEMPLATES ---
    assignEquipment: `
        <div class="drawer-section">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 12px; background: var(--orange-light); border-radius: 8px; border: 1px solid var(--orange-hover);">
                <i class="fas fa-key" style="color: var(--orange); font-size: 20px;"></i>
                <div>
                    <div style="font-weight: 700; color: var(--orange); font-size: 14px;">Asset Allocation</div>
                    <div style="font-size: 11px; color: var(--orange-hover);">Formal handover and location lock</div>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" style="display:block; font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:6px;">Equipment ID/Name</label>
                <select class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                    <option>EQP-045: Caterpillar 320D Excavator</option>
                    <option>EQP-012: Tata Tipper 10T</option>
                    <option>EQP-008: Winget Concrete Mixer</option>
                </select>
            </div>
            
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" style="display:block; font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:6px;">Assign To Project</label>
                <select class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                    <option>CEN-01: Unilia Library Complex</option>
                    <option>MZ-05: Mzimba Clinic Extension</option>
                    <option>NOR-04: Mzuzu Bridge Repair</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label" style="display:block; font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:6px;">Responsible Person</label>
                    <select class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                        <option>John Banda (PM)</option>
                        <option>Peter Phiri (Sup)</option>
                        <option>Davi Moyo (Foreman)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display:block; font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:6px;">Expected Return</label>
                    <input type="date" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label" style="display:block; font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:6px;">Special Instructions</label>
                <textarea class="form-input" rows="3" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" placeholder="Operator requirements, fuel level, attachments..."></textarea>
            </div>
            
            <div style="background: #F8FAFC; border:1px solid var(--slate-200); padding: 12px; border-radius: 8px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; color: var(--slate-700); font-size: 13px;">GPS Signal Status</span>
                    <span class="status active" style="font-size:10px; font-weight:700; color:var(--emerald); background:#DCFCE7; padding:4px 10px; border-radius:20px; text-transform: uppercase;"><i class="fas fa-satellite-dish"></i> Lock Acquired</span>
                </div>
                <div style="font-size: 11px; color: var(--slate-500); margin-top: 6px; font-family: 'JetBrains Mono';">Current: -13.9626, 33.7741 (HQ Storage)</div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px; font-weight: 700; border: none;" onclick="window.drawer.close(); window.toast.show('Equipment Assigned Successfully', 'success')">Process Handover</button>
        </div>
    `,

    assetDetails: `
        <div class="drawer-section">
            <div style="display: flex; gap: 16px; margin-bottom: 24px; align-items: center;">
                <div style="width: 80px; height: 80px; background: var(--slate-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: var(--slate-600); border: 1px solid var(--slate-200);">
                    <i class="fas fa-truck-front"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 800; color: var(--slate-900);">Caterpillar 320D</h3>
                    <div style="margin-top: 4px; display: flex; gap: 8px; align-items: center;">
                        <span class="project-id">EQP-045</span>
                        <span class="status active" style="font-size: 10px; padding: 2px 8px;">In Use</span>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size: 9px;">Engine Hours</div>
                    <div style="font-size: 14px; font-weight: 700; font-family: 'JetBrains Mono'; margin-top: 4px;">2,450h</div>
                </div>
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size: 9px;">Fuel Level</div>
                    <div style="font-size: 14px; font-weight: 700; color: var(--emerald); margin-top: 4px;">85%</div>
                </div>
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size: 9px;">Utilization</div>
                    <div style="font-size: 14px; font-weight: 700; color: var(--blue); margin-top: 4px;">92%</div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size:11px; font-weight:700; color:var(--slate-400); text-transform:uppercase; margin-bottom:10px; letter-spacing: 0.5px;">Fleet Information</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 11px; color: var(--slate-500);">Current Location</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">Unilia Site (CEN-01)</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: var(--slate-500);">Assigned To</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">John Banda (PM)</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size:11px; font-weight:700; color:var(--slate-400); text-transform:uppercase; margin-bottom:10px; letter-spacing: 0.5px;">Maintenance Health</label>
                <div style="padding: 12px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-200);">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
                        <span>Next Service Due</span>
                        <span style="font-weight: 700; color: var(--orange);">50h remaining</span>
                    </div>
                    <div class="budget-bar-bg" style="height: 6px;"><div class="budget-bar-fill" style="width: 90%; background: var(--orange);"></div></div>
                </div>
            </div>

            <div style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex:1; padding: 12px;" onclick="window.drawer.open('Maintenance Log', window.DrawerTemplates.completeMaintenance)">Log Maintenance</button>
                <button class="btn btn-secondary" style="flex:1; padding: 12px;">Full History</button>
            </div>
        </div>
    `,

    scheduleMaintenance: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Equipment</label><select class="form-input" style="width:100%; padding:10px;"><option>EQP-045 Excavator</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Service Type</label><select class="form-input" style="width:100%; padding:10px;"><option>Preventive (Scheduled)</option><option>Corrective (Repair)</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Service Provider</label><input type="text" class="form-input" style="width:100%; padding:10px;" value="Malawi Equip. Services"></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Date</label><input type="date" class="form-input" style="width:100%; padding:10px;"></div>
            <button class="btn btn-primary" style="width:100%; border:none; padding:12px;" onclick="window.drawer.close(); window.toast.show('Work Order Created', 'success')">Create Work Order</button>
        </div>
    `,

    // --- NEW ADDITIONS FOR COMPLETED DASHBOARDS ---

    vendorProfile: `
        <div class="drawer-section">
            <div style="display:flex; gap:16px; align-items:center; margin-bottom:16px;">
                <div style="width:60px; height:60px; background:var(--slate-200); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:24px; color:var(--slate-600);">MC</div>
                <div>
                     <div style="font-size:18px; font-weight:700;">Malawi Cement Ltd</div>
                     <div style="color:var(--slate-500); font-size:13px;">Reg: #TPIN-998273</div>
                </div>
            </div>
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:0;">
                 <div class="stat-card" style="padding:12px;">
                    <div class="stat-label">Performance</div>
                    <div class="stat-value" style="font-size:18px; color:var(--emerald);">4.8/5.0</div>
                 </div>
                 <div class="stat-card" style="padding:12px;">
                    <div class="stat-label">Active Contracts</div>
                    <div class="stat-value" style="font-size:18px;">3</div>
                 </div>
            </div>
        </div>
        <div class="drawer-section">
            <div class="stat-label" style="margin-bottom:12px;">Compliance Documents</div>
            <div style="display:flex; justify-content:space-between; padding:10px; border:1px solid var(--slate-200); border-radius:6px; margin-bottom:8px; align-items:center;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <i class="fas fa-file-pdf" style="color:var(--red);"></i>
                    <div style="font-size:13px; font-weight:600;">Tax Clearance Certificate</div>
                </div>
                <span class="status active" style="font-size:10px;">Valid 2025</span>
            </div>
             <div style="display:flex; justify-content:space-between; padding:10px; border:1px solid var(--slate-200); border-radius:6px; align-items:center;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <i class="fas fa-file-pdf" style="color:var(--red);"></i>
                    <div style="font-size:13px; font-weight:600;">NCIC Registration (Cat A)</div>
                </div>
                <span class="status active" style="font-size:10px;">Valid 2026</span>
            </div>
        </div>
         <div class="drawer-section">
            <div class="stat-label" style="margin-bottom:12px;">Contact Information</div>
            <div style="font-size:13px; margin-bottom:8px;"><i class="fas fa-user-tie" style="width:20px; color:var(--slate-400);"></i> John Phiri (Sales Mgr)</div>
            <div style="font-size:13px; margin-bottom:8px;"><i class="fas fa-envelope" style="width:20px; color:var(--slate-400);"></i> sales@malawicement.mW</div>
            <div style="font-size:13px;"><i class="fas fa-phone" style="width:20px; color:var(--slate-400);"></i> +265 999 123 456</div>
        </div>
    `,

    onboardVendor: `
        <div class="drawer-section">
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Company Name</label>
                <input type="text" class="form-input" style="width:100%; padding:10px;">
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Category</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>Materials Supply</option>
                    <option>Subcontractor (Labor)</option>
                    <option>Equipment Hire</option>
                    <option>Consultancy</option>
                </select>
             </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Tax Payer ID (TPIN)</label>
                <input type="text" class="form-input" style="width:100%; padding:10px;">
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Required Documents Upload</label>
                 <div style="border:2px dashed var(--slate-300); padding:20px; background:var(--slate-50); text-align:center; border-radius:6px; font-size:12px;">
                    Tax Clearance, NCIC Cert, Incorporation Cert
                 </div>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Vendor onboarding request submitted for approval', 'success')">Submit Application</button>
        </div>
    `,

    certifyMilestone: `
        <div class="drawer-section" style="background:#F0FDF4; border-bottom:1px solid #BBF7D0;">
            <div style="font-size:12px; color:#166534; font-weight:700;">Milestone Details</div>
            <div style="font-size:16px; font-weight:700; color:#15803D; margin:4px 0;">Foundation Completion</div>
            <div style="font-size:13px; color:#166534;">Contract: CEN-01 Main Works</div>
        </div>
        <div class="drawer-section">
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Valuation Amount (MWK)</label>
                <input type="number" class="form-input" style="width:100%; padding:10px; font-family:'JetBrains Mono';" value="120000000">
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Completion Verification</label>
                <div style="display:flex; gap:10px; margin-bottom:8px;">
                     <input type="checkbox" checked> <span style="font-size:13px;">Site inspection passed</span>
                </div>
                 <div style="display:flex; gap:10px;">
                     <input type="checkbox" checked> <span style="font-size:13px;">Quality tests (Cubes) passed</span>
                </div>
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Attach Certificate</label>
                 <input type="file" class="form-input" style="width:100%; padding:10px;">
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Payment Certificate Generated', 'success')">Issue Certificate</button>
        </div>
    `,

    viewPolicy: `
        <div class="drawer-section">
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; font-size:18px;">Performance Bond</div>
                <div style="font-size:13px; color:var(--slate-500);">Unilia Construction • NB-BND-2024-889</div>
            </div>
             <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
                 <div class="stat-card" style="padding:12px;">
                    <div class="stat-label">Coverage Limit</div>
                    <div class="stat-value" style="font-size:16px; color:var(--slate-800);">MWK 120,000,000</div>
                 </div>
                 <div class="stat-card" style="padding:12px;">
                    <div class="stat-label">Expiry Date</div>
                    <div class="stat-value" style="font-size:16px; color:var(--emerald);">Jun 30, 2026</div>
                 </div>
            </div>
             <div class="drawer-section" style="background:var(--slate-50); border:1px solid var(--slate-200); padding:16px;">
                 <div style="font-weight:700; font-size:13px; margin-bottom:8px;">Provider Details</div>
                 <div style="font-size:13px; margin-bottom:4px;">National Bank of Malawi</div>
                 <div style="font-size:13px; margin-bottom:4px;">Ref: NBM/GUA/889/24</div>
                 <div style="font-size:13px; color:var(--slate-500);">Verified by: J. Kaira (Jan 02, 2025)</div>
            </div>
             <button class="btn btn-secondary" style="width:100%; padding:12px; margin-top:16px;" onclick="window.drawer.close();"><i class="fas fa-download"></i> Download Certificate</button>
        </div>
    `,

    requestRenewal: `
         <div class="drawer-section">
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; font-size:14px; color:var(--orange);">Insurance Renewal Required</div>
                <div style="font-size:12px; color:var(--slate-500);">Ref: NICO-CAR-992 (All Risk)</div>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Current Status</label>
                <div style="padding:10px; background:var(--orange-light); color:var(--orange-dark); border-radius:6px; font-size:13px; font-weight:600;">Expiring in 45 Days (Feb 28, 2025)</div>
             </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Recipient</label>
                 <input type="text" class="form-input" value="Unilia Admin (compliance@unilia.mw)" readonly style="width:100%; padding:10px; background:#f1f5f9;">
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Reminder Message</label>
                <textarea class="form-input" rows="12" style="width:100%; padding:10px;">Attention,

Your 'Contractors All Risk' policy for the Unilia Library Complex is due for renewal. Please submit valid proof of renewal before Feb 28, 2025 to avoid certification holds.

Regards,
Contract Admin</textarea>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Renewal Reminder Sent', 'success')">Send Request</button>
         </div>
    `,

    flagBreach: `
         <div class="drawer-section">
            <div style="background:var(--red-light); padding:16px; border-radius:8px; display:flex; gap:12px; align-items:center; margin-bottom:24px;">
                <i class="fas fa-gavel" style="color:var(--red); font-size:20px;"></i>
                <div>
                    <div style="font-weight:700; color:var(--red); font-size:14px;">Regulatory Breach Alert</div>
                    <div style="font-size:11px; color:var(--red);">Apex Security • Workers Comp</div>
                </div>
            </div>
            
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Breach Type</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>Coverage Lapsed</option>
                    <option>Insufficient Limit</option>
                    <option>Provider Insolvency</option>
                </select>
             </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Impact Assessment</label>
                <div style="display:flex; gap:10px; margin-bottom:8px;">
                     <input type="checkbox" checked> <span style="font-size:13px;">Suspend Payment Certificates</span>
                </div>
                 <div style="display:flex; gap:10px;">
                     <input type="checkbox" checked> <span style="font-size:13px;">Notify Regulatory Authority</span>
                </div>
             </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Breach Notice</label>
                <textarea class="form-input" rows="3" style="width:100%; padding:10px;">Worker's Compensation policy WCA-221-002 expired on Dec 31, 2024. Immediate suspension of services required until rectified.</textarea>
             </div>
             <button class="btn btn-danger" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Breach Logged & Legal Notified', 'error')">Confirm Breach</button>
         </div>
    `,

    sendReminders: `
        <div class="drawer-section">
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; font-size:14px; color:var(--blue);">Bulk Reminder Action</div>
                <div style="font-size:12px; color:var(--slate-500);">Target: Vendors with expiring documents</div>
            </div>
            
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" style="display:block; margin-bottom:8px;">Select Recipients</label>
                <div style="background:white; border:1px solid var(--slate-200); border-radius:6px; overflow:hidden;">
                    <div style="padding:10px; border-bottom:1px solid var(--slate-100); display:flex; gap:10px; align-items:center;">
                        <input type="checkbox" checked>
                        <div style="font-size:13px;">
                            <div style="font-weight:600;">Unilia Construction</div>
                            <div style="font-size:11px; color:var(--orange);">All Risk Policy (Exp: Feb 28)</div>
                        </div>
                    </div>
                    <div style="padding:10px; border-bottom:1px solid var(--slate-100); display:flex; gap:10px; align-items:center;">
                        <input type="checkbox" checked>
                        <div style="font-size:13px;">
                            <div style="font-weight:600;">Apex Security</div>
                            <div style="font-size:11px; color:var(--red);">Workers Comp (Expired: Dec 31)</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Message Template</label>
                 <select class="form-input" style="width:100%; padding:10px;">
                    <option>Standard Expiry Warning</option>
                    <option>Urgent Compliance Notice</option>
                    <option>Final Breach Notification</option>
                 </select>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Reminders Sent to 2 Vendors', 'success')">Send Bulk Reminders</button>
        </div>
    `,

    completeMaintenance: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Asset</label><input type="text" class="form-input" value="CAT 320D (EQP-045)" readonly style="width:100%; padding:10px; background:#f1f5f9;"></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Work Done</label><textarea class="form-input" rows="3" style="width:100%; padding:10px;" placeholder="Describe repairs..."></textarea></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Parts Replaced</label><input type="text" class="form-input" style="width:100%; padding:10px;" placeholder="e.g., Oil Filter, Hydraulic Hose"></div>
            <div class="grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                 <div class="form-group"><label class="form-label">Parts Cost</label><input type="number" class="form-input" style="width:100%; padding:10px;"></div>
                 <div class="form-group"><label class="form-label">Labor Cost</label><input type="number" class="form-input" style="width:100%; padding:10px;"></div>
            </div>
             <button class="btn btn-primary" style="width:100%; margin-top:16px; padding:12px;" onclick="window.drawer.close(); window.toast.show('Audit evidence logged', 'success')">Submit Audit</button>
        </div>
    `,

    newUser: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" placeholder="e.g., John Doe" style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Role</label>
                <select class="form-input" style="width: 100%;">
                    <option>Project Manager</option>
                    <option>Finance Director</option>
                    <option>Field Supervisor</option>
                    <option>Contract Administrator</option>
                    <option>Equipment Coordinator</option>
                    <option>System Technician</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" placeholder="j.doe@mkaka.mw" style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Phone Number</label>
                <input type="tel" class="form-input" placeholder="+265..." style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Initial Password</label>
                <input type="password" class="form-input" placeholder="••••••••" style="width: 100%;">
                <p style="font-size: 11px; color: var(--slate-500); margin-top: 4px;">User will be prompted to change this on first login.</p>
            </div>
            <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="window.drawer.close(); window.toast.show('User account created successfully', 'success')">Create User Account</button>
        </div>
    `,

    editUser: `
        <div class="drawer-section">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 16px; background: var(--slate-50); border-radius: 12px; border: 1px solid var(--slate-200);">
                <div style="width: 48px; height: 48px; background: var(--slate-800); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">SJ</div>
                <div>
                    <div style="font-weight: 700; color: var(--slate-900);">Sarah Jenkins</div>
                    <div style="font-size: 13px; color: var(--slate-500);">Project Manager</div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" value="Sarah Jenkins" style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Role</label>
                <select class="form-input" style="width: 100%;">
                    <option selected>Project Manager</option>
                    <option>Finance Director</option>
                    <option>Field Supervisor</option>
                    <option>System Technician</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" value="s.jenkins@mkaka.mw" style="width: 100%;">
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--slate-100); display: flex; flex-direction: column; gap: 12px;">
                <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase;">Administrative Actions</div>
                
                <button class="btn btn-secondary" style="width: 100%; justify-content: start; gap: 12px;" onclick="window.toast.show('Password reset email sent to user', 'info')">
                    <i class="fas fa-key" style="color: var(--slate-400);"></i> Force Password Reset
                </button>
                
                <button class="btn btn-secondary" style="width: 100%; justify-content: start; gap: 12px; color: var(--red); border-color: var(--red-light);" onclick="if(confirm('Are you sure you want to delete this user? This action cannot be undone.')) { window.drawer.close(); window.toast.show('User account deleted', 'error'); }">
                    <i class="fas fa-user-slash"></i> Deactivate & Delete User
                </button>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-top: 24px; padding: 12px;" onclick="window.drawer.close(); window.toast.show('User details updated', 'success')">Save Changes</button>
        </div>
    `,

    editVAT: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Standard VAT Rate (%)</label>
                <input type="number" class="form-input" value="16.5" step="0.1" style="width: 100%; padding: 12px;">
                <p style="font-size: 11px; color: var(--slate-500); margin-top: 6px;">Applies to all taxable transactions.</p>
            </div>
            <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="window.drawer.close(); window.toast.show('VAT Rate updated', 'success')">Update Rate</button>
        </div>
    `,

    editCurrency: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">System Currency Symbol</label>
                <select class="form-input" style="width: 100%; padding: 12px;">
                    <option value="MWK" selected>MWK (Malawian Kwacha)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="GBP">GBP (British Pound)</option>
                    <option value="ZAR">ZAR (South African Rand)</option>
                </select>
            </div>
             <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="window.drawer.close(); window.toast.show('Currency updated', 'success')">Update Currency</button>
        </div>
    `,

    editCompany: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Legal Company Name</label>
                <input type="text" class="form-input" value="Mkaka Construction Ltd" style="width: 100%; padding: 12px;">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Tax ID (TPIN)</label>
                <input type="text" class="form-input" value="10029384" style="width: 100%; padding: 12px;">
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Registered Address</label>
                <textarea class="form-input" style="width: 100%; padding: 12px; height: 80px;">P.O. Box 30456, Capital City, Lilongwe 3</textarea>
            </div>
             <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="window.drawer.close(); window.toast.show('Company details updated', 'success')">Update Details</button>
        </div>
    `,

    editSMTP: `
        <div class="drawer-section">
             <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">SMTP Host</label>
                <input type="text" class="form-input" value="smtp.gmail.com" style="width: 100%; padding: 12px;">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">SMTP Port</label>
                <input type="text" class="form-input" value="587" style="width: 100%; padding: 12px;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" value="system@mkaka.mw" style="width: 100%; padding: 12px;">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" value="secure_password" style="width: 100%; padding: 12px;">
                </div>
            </div>
            <div style="background: var(--slate-50); padding: 12px; border-radius: 6px; margin-bottom: 24px; border: 1px solid var(--slate-200);">
                <button class="btn btn-secondary" style="width: 100%; font-size: 11px;">Test Connection</button>
            </div>
             <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="window.drawer.close(); window.toast.show('SMTP Settings updated', 'success')">Save Connection</button>
        </div>
    `,

    newAudit: `
        <div class="drawer-section">
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Site</label>
                <select class="form-input" style="width:100%; padding:10px;"><option>CEN-01 Unilia Library</option><option>MZ-05 Clinic</option></select>
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Audit Checklist</label>
                <div style="max-height:150px; overflow-y:auto; border:1px solid var(--slate-200); padding:10px; border-radius:6px;">
                    <label style="display:block; margin-bottom:8px;"><input type="checkbox"> PPE Compliance</label>
                    <label style="display:block; margin-bottom:8px;"><input type="checkbox"> Scaffolding Safety</label>
                    <label style="display:block; margin-bottom:8px;"><input type="checkbox"> Electrical Hazards</label>
                    <label style="display:block; margin-bottom:8px;"><input type="checkbox"> Waste Management</label>
                    <label style="display:block; margin-bottom:8px;"><input type="checkbox"> Signage & Hoarding</label>
                </div>
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Overall Score (%)</label>
                 <input type="number" class="form-input" style="width:100%; padding:10px;" max="100">
             </div>
              <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Major Findings / Violations</label>
                 <textarea class="form-input" rows="3" style="width:100%; padding:10px;"></textarea>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Safety Score updated', 'success')">Submit Audit</button>
        </div>
    `,

    shiftPlan: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Select Site</label>
                <select class="form-input" style="width:100%; padding:10px;"><option>CEN-01 Unilia Library</option></select>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Shift Date</label>
                <input type="date" class="form-input" style="width:100%; padding:10px;">
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; font-size:12px; margin-bottom:8px;">Resource Demand</div>
                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:13px;">General Labor</span>
                    <input type="number" value="15" style="width:60px; padding:4px; text-align:center;">
                 </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:13px;">Carpenters</span>
                    <input type="number" value="4" style="width:60px; padding:4px; text-align:center;">
                 </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px;">Steel Fixers</span>
                    <input type="number" value="6" style="width:60px; padding:4px; text-align:center;">
                 </div>
            </div>
            <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Shift Plan Broadcasted to Site', 'success')">Publish Plan</button>
        </div>
    `,
    
    projectDetails: `
        <div class="drawer-section">
            <div style="font-size:18px; font-weight:700; margin-bottom:4px;">MZ-05 Mzuzu Clinic Extension</div>
            <div style="font-size:13px; color:var(--slate-500); margin-bottom:16px;">Project Manager: Peter Phiri</div>
            
            <div class="stats-grid" style="grid-template-columns:1fr 1fr; margin:0 0 16px 0;">
                <div class="stat-card" style="padding:10px;">
                    <div class="stat-label">Budget</div>
                    <div class="stat-value" style="font-size:16px;">MWK 450M</div>
                </div>
                <div class="stat-card" style="padding:10px;">
                    <div class="stat-label">Progress</div>
                    <div class="stat-value" style="font-size:16px; color:var(--emerald);">92%</div>
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <div class="stat-label" style="margin-bottom:8px;">Project Health</div>
                <div style="display:flex; gap:8px;">
                     <span class="status active" style="flex:1; text-align:center;">Schedule: On Time</span>
                     <span class="status active" style="flex:1; text-align:center;">Safety: 100%</span>
                </div>
            </div>

             <div class="stat-label" style="margin-bottom:8px;">Recent Activity</div>
             <div style="font-size:12px; color:var(--slate-600); border-left:2px solid var(--slate-200); padding-left:10px; margin-bottom:8px;">
                <strong>Today:</strong> Material Delivery (Cement) confirmed.
             </div>
             <div style="font-size:12px; color:var(--slate-600); border-left:2px solid var(--slate-200); padding-left:10px;">
                <strong>Yesterday:</strong> Painting gang A completed 2nd coat.
             </div>
        </div>
        <div style="padding:16px 24px; border-top:1px solid var(--slate-200); display:flex; gap:12px;">
            <button class="btn btn-secondary" style="flex:1;">View Gantt</button>
            <button class="btn btn-primary" style="flex:1;">Open Dashboard</button>
        </div>
    `,

    addTask: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Task Name</label>
                <input type="text" class="form-input" style="width:100%; padding:10px;" placeholder="e.g. Foundation Pouring">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-input" style="width:100%; padding:10px;">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Duration (Days)</label>
                <input type="number" class="form-input" style="width:100%; padding:10px;" placeholder="0">
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Assignee</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>John Banda (Supervisor)</option>
                    <option>Davi Moyo (Foreman)</option>
                </select>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Dependencies</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>None</option>
                    <option>1.1 Site Clearing</option>
                    <option>1.2 Excavation</option>
                </select>
            </div>
            <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Task Added to Schedule', 'success')">Save Task</button>
        </div>
    `,

    initiateBCR: `
        <div class="drawer-section">
             <div class="stats-grid" style="grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                <div class="stat-card" style="padding:12px;">
                    <div class="stat-label">Current Budget</div>
                    <div class="stat-value" style="font-size:16px;">MWK 200M</div>
                </div>
                <div class="stat-card" style="padding:12px;">
                    <div class="stat-label">Variance</div>
                    <div class="stat-value" style="font-size:16px; color:var(--red);">+10%</div>
                </div>
             </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project Code</label>
                <select style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;">
                    <option>CEN-01 Unilia Construction</option>
                    <option>NOR-04 Mzuzu Bridge</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Budget Category</label>
                <select style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;">
                    <option>02-MAT Materials</option>
                    <option>03-LAB Labor</option>
                    <option>04-EQU Equipment</option>
                </select>
            </div>
             <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Proposed New Amount (MWK)</label>
                <input type="number" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px; border-color: var(--orange);">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Justification</label>
                <textarea style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;" rows="3" placeholder="Explain the reason for budget increase..."></textarea>
            </div>
            <button class="btn btn-action" style="width: 100%; justify-content: center; padding:12px;" onclick="window.drawer.close(); window.toast.show('Budget Change Request Initiated', 'success')">Submit Request</button>
        </div>
    `,

    matchTransaction: `
        <div class="drawer-section">
            <div style="background:var(--slate-50); padding:12px; border-radius:6px; margin-bottom:16px;">
                <div style="font-size:11px; color:var(--slate-500); font-weight:700; text-transform:uppercase;">Bank Transaction</div>
                <div style="font-weight:700; color:var(--slate-800); margin-top:4px;">Direct Deposit - Client Pymt (DEP-992)</div>
                <div style="font-family:'JetBrains Mono'; color:var(--emerald); font-weight:700; margin-top:4px;">+ MWK 5,000,000</div>
            </div>

            <div style="margin-bottom:16px;">
                <label class="form-label">Match with System Entry</label>
                <div style="border:1px solid var(--slate-300); border-radius:6px; overflow:hidden; margin-top:8px;">
                     <div style="padding:10px; border-bottom:1px solid var(--slate-200); background:var(--blue-light); display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size:12px; font-weight:600;">INV-2024-001 (Partial)</div>
                            <div style="font-size:11px; color:var(--slate-600);">Client: Ministry of Health</div>
                        </div>
                        <div style="font-family:'JetBrains Mono'; font-weight:700;">5,000,000</div>
                        <i class="fas fa-check-circle" style="color:var(--blue);"></i>
                    </div>
                </div>
                <div style="margin-top:8px; text-align:right;">
                    <button class="btn btn-secondary" style="font-size:11px;">Search Other Entries</button>
                </div>
            </div>
             <button class="btn btn-primary" style="width: 100%; justify-content: center; padding:12px;" onclick="window.drawer.close(); window.toast.show('Transaction Matched', 'success')">Confirm Match</button>
        </div>
    `,

    createJournalEntry: `
        <div class="drawer-section">
            <div style="background:var(--slate-50); padding:12px; border-radius:6px; margin-bottom:16px;">
                <div style="font-size:11px; color:var(--slate-500); font-weight:700; text-transform:uppercase;">Source (Bank Stmt)</div>
                <div style="font-weight:700; color:var(--slate-800); margin-top:4px;">Bank Service Charge (SVC-001)</div>
                <div style="font-family:'JetBrains Mono'; color:var(--red); font-weight:700; margin-top:4px;">- MWK 150,000</div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Expense Account</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>6900 - Bank Charges</option>
                    <option>6905 - Interest Expense</option>
                </select>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Contra Account</label>
                 <input type="text" class="form-input" style="width:100%; padding:10px;" value="1010 - National Bank Ops" readonly>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Notes</label>
                <input type="text" class="form-input" style="width:100%; padding:10px;" value="Monthly Service Fee - Oct">
            </div>
            
            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding:12px;" onclick="window.drawer.close(); window.toast.show('Journal Entry Posted', 'success')">Post Entry</button>
        </div>
    `,

    submitComplaint: `
        <div class="drawer-section">
            <div style="background:var(--red-light); padding:16px; border-radius:8px; margin-bottom:24px; border:1px solid var(--red-hover);">
                <div style="display:flex; gap:12px; align-items:center;">
                    <i class="fas fa-exclamation-circle" style="color:var(--red); font-size:20px;"></i>
                    <div style="font-weight:700; color:var(--red); font-size:14px;">Log New Project Issue</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label">Issue Category</label>
                    <select class="form-input">
                        <option selected>Subcontractor Delay</option>
                        <option>Site Operational Issue</option>
                        <option>Safety/HSE Hazard</option>
                        <option>Equipment Failure</option>
                        <option>Material Shortage/Quality</option>
                        <option>Labor Dispute</option>
                        <option>Weather Delay</option>
                        <option>Other / General Complaint</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Project Affected</label>
                    <select class="form-input">
                        <option selected>CEN-01 Unilia Library</option>
                        <option>MZ-05 Clinic Extension</option>
                        <option>NOR-04 Mzuzu Bridge</option>
                        <option>LIL-02 Mall Access Road</option>
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label">Site Location / Block</label>
                    <input type="text" class="form-input" value="Block B - North Face">
                </div>
                <div class="form-group">
                    <label class="form-label">Date Identified</label>
                    <input type="date" class="form-input" value="2026-01-16">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Priority Level</label>
                <div style="display:flex; gap:8px;">
                    <label style="flex:1; border:1px solid var(--slate-200); padding:10px; border-radius:6px; text-align:center; cursor:pointer; font-size:12px; font-weight:600;">
                        <input type="radio" name="priority" value="Low"> Low
                    </label>
                    <label style="flex:1; border:1px solid var(--orange); background:var(--orange-light); color:var(--orange); padding:10px; border-radius:6px; text-align:center; cursor:pointer; font-size:12px; font-weight:600;">
                        <input type="radio" name="priority" value="Medium"> Medium
                    </label>
                    <label style="flex:1; border:1px solid var(--red); background:var(--red-light); color:var(--red); padding:10px; border-radius:6px; text-align:center; cursor:pointer; font-size:12px; font-weight:600;">
                        <input type="radio" name="priority" value="High" checked> Urgent
                    </label>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Issue Description / Narrative</label>
                <textarea class="form-input" rows="4">Subcontractor for plumbing has failed to show up for 3 days. This is delaying the screeding process in Block B. Need immediate intervention to avoid project lag.</textarea>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Assign To (Initial)</label>
                <select class="form-input">
                    <option selected>Sarah Jenkins (PM)</option>
                    <option>John Banda (PM)</option>
                    <option>Mike Banda (Supervisor)</option>
                    <option>Grace Chibwe (Ops Manager)</option>
                    <option>Stefan Mwale (Finance)</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label">Photo Evidence (Optional)</label>
                <div style="border:2px dashed var(--slate-300); padding:20px; text-align:center; border-radius:8px; color:var(--slate-500); background:var(--slate-50); cursor:pointer;" onclick="window.toast.show('Camera launched', 'info')">
                    <i class="fas fa-camera" style="font-size:24px; margin-bottom:8px;"></i>
                    <div style="font-weight:600; font-size:13px;">Snap or Upload photo</div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px; font-weight:700;" onclick="window.drawer.close(); window.toast.show('Issue #CMP-443 logged. Ops Manager notified.', 'success');">Submit Issue Report</button>
        </div>
    `,

    complaintDetails: `
        <div class="drawer-section">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px;">
                <div>
                    <div style="font-size:18px; font-weight:800; color:var(--slate-900);">Issue #CMP-442</div>
                    <div style="font-size:12px; color:var(--slate-500); margin-top:4px;">Reported by John Banda (PM) • 3h ago</div>
                </div>
                <span class="status pending" id="drawer_complaint_status" style="font-weight:700;">In Progress</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px;">
                <div style="background:var(--slate-50); padding:12px; border-radius:8px; border:1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size:10px;">Project</div>
                    <div style="font-size:13px; font-weight:700; margin-top:4px;">CEN-01 Unilia</div>
                </div>
                <div style="background:var(--red-light); padding:12px; border-radius:8px; border:1px solid var(--red-hover);">
                    <div class="stat-label" style="font-size:10px; color:var(--red);">Priority</div>
                    <div style="font-size:13px; font-weight:700; color:var(--red); margin-top:4px;">Urgent</div>
                </div>
            </div>

            <div style="margin-bottom:24px;">
                <label class="form-label" style="color:var(--slate-400);">Narrative</label>
                <p style="font-size:13px; line-height:1.6; color:var(--slate-700); background:var(--white); border:1px solid var(--slate-200); padding:16px; border-radius:8px;">
                    "Subcontractor for plumbing has failed to show up for 3 days. This is delaying the screeding process in Block B. Need immediate intervention to avoid project lag."
                </p>
            </div>

            <div style="margin-bottom:24px;">
                <label class="form-label" style="color:var(--slate-400);">Attachment</label>
                <div style="width:100%; height:150px; background:var(--slate-200); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--slate-500);">
                    <i class="fas fa-image" style="font-size:32px;"></i>
                </div>
            </div>

            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:24px;">
                <label class="form-label" style="margin-bottom:12px; font-weight:700;">Resolution Management</label>
                
                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label" style="font-size:11px;">ASSIGNED TO</label>
                    <select class="form-input">
                        <option>Sarah Jenkins (PM)</option>
                        <option>Mike Banda (SV)</option>
                        <option>John Banda (PM)</option>
                        <option>Stefan Mwale (Finance)</option>
                        <option>Grace Chibwe (Ops)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" style="font-size:11px;">INTERNAL RESOLUTION NOTES</label>
                    <textarea class="form-input" rows="3" placeholder="Document the steps taken to resolve this issue..."></textarea>
                </div>
            </div>

            <div style="border-top:1px solid var(--slate-200); padding-top:24px;">
                <label class="form-label" style="margin-bottom:12px;">Resolution Actions</label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <button class="btn btn-secondary" style="justify-content:center;" onclick="document.getElementById('drawer_complaint_status').className='status pending'; document.getElementById('drawer_complaint_status').innerText='In Progress'; window.toast.show('Status set to In Progress', 'info');">
                        Set In Progress
                    </button>
                    <button class="btn btn-primary" style="justify-content:center; background:var(--emerald); border-color:var(--emerald);" onclick="document.getElementById('drawer_complaint_status').className='status active'; document.getElementById('drawer_complaint_status').innerText='Resolved'; window.toast.show('Issue marked as Resolved', 'success');">
                        Mark Resolved
                    </button>
                </div>
                <button class="btn btn-action" style="width:100%; margin-top:12px; justify-content:center;">
                </div>
        </div>
    `,

    // --- VEHICLE PROCUREMENT WORKFLOW ---
    requestNewVehicle: `
        <div class="drawer-section">
            <div style="background:var(--blue-light); padding:16px; border-radius:8px; border:1px solid var(--blue); margin-bottom:24px; display:flex; gap:12px; align-items:center;">
                <i class="fas fa-truck-pickup" style="color:var(--blue); font-size:20px;"></i>
                <div style="font-weight:700; color:var(--blue-dark); font-size:14px;">Vehicle Procurement Request</div>
            </div>
            
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Vehicle Type / Name</label>
                <input type="text" class="form-input" placeholder="e.g. Toyota Hilux 4x4, JCB Backhoe..." id="proc_veh_name">
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Estimated Cost (MWK)</label>
                <input type="number" class="form-input" placeholder="0.00" id="proc_veh_cost">
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Justification / Project Need</label>
                <textarea class="form-input" rows="3" placeholder="Why is this vehicle needed? Which project?" id="proc_veh_reason"></textarea>
            </div>

            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">Priority</label>
                <select class="form-input" id="proc_veh_priority">
                    <option>Standard</option>
                    <option>Urgent (Project Delay Risk)</option>
                    <option>Critical (Safety/Breakdown)</option>
                </select>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px;" onclick="window.drawer.close(); window.toast.show('Request sent to Project Manager for review', 'success')">Submit Request to PM</button>
        </div>
    `,

    reviewVehicleRequest: `
        <div class="drawer-section">
            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:20px;">
                <div style="font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase;">Procurement Request #PROC-882</div>
                <div style="font-size:18px; font-weight:800; color:var(--slate-900); margin-top:4px;" id="rev_veh_name">Toyota Hilux 4x4</div>
                <div style="font-size:14px; color:var(--slate-600); font-weight:600; margin-top:2px;">Target Cost: MWK 45,000,000</div>
            </div>

            <div style="margin-bottom:20px;">
                <label class="form-label" style="color:var(--slate-400);">EC Justification</label>
                <p style="font-size:13px; color:var(--slate-700); line-height:1.5;">"Current site vehicle for CEN-01 is frequently breaking down. Need a reliable 4x4 for supervisor site visits and urgent small material deliveries."</p>
            </div>

            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">PM Review Comments</label>
                <textarea class="form-input" rows="3" placeholder="Enter your review notes for Finance..."></textarea>
            </div>

            <div style="display:flex; gap:12px;">
                <button class="btn btn-secondary" style="flex:1;" onclick="window.drawer.close(); window.toast.show('Request sent back to EC for clarification', 'info')">Need Info</button>
                <button class="btn btn-primary" style="flex:2;" onclick="window.drawer.close(); window.toast.show('Request recommended to Finance Director', 'success')">Recommend to Finance</button>
            </div>
        </div>
    `,

    approveVehiclePurchase: `
        <div class="drawer-section">
            <div style="background:var(--emerald-light); padding:16px; border-radius:8px; border:1px solid var(--emerald); margin-bottom:24px; display:flex; gap:12px; align-items:center;">
                <i class="fas fa-check-circle" style="color:var(--emerald); font-size:20px;"></i>
                <div style="font-weight:700; color:var(--emerald-dark); font-size:14px;">Final Procurement Approval</div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                <div style="background:var(--slate-50); padding:12px; border-radius:8px;">
                    <div style="font-size:10px; color:var(--slate-500);">ASSET</div>
                    <div style="font-weight:700;">Toyota Hilux</div>
                </div>
                <div style="background:var(--slate-50); padding:12px; border-radius:8px;">
                    <div style="font-size:10px; color:var(--slate-500);">BUDGET IMPACT</div>
                    <div style="font-weight:700;">MWK 45M</div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label">GL Code / Account</label>
                <select class="form-input">
                    <option>Capital Expenditure (CAPEX-01)</option>
                    <option>Project Operations (OPEX-FS)</option>
                </select>
            </div>

            <button class="btn btn-primary" style="width:100%; background:var(--emerald); border-color:var(--emerald); padding:14px;" onclick="window.drawer.close(); window.toast.show('Purchase Order Approved. EC notified to execute.', 'success')">Approve & Release Funds</button>
        </div>
    `,

    addNewVehicle: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Asset ID (Auto-generated)</label>
                <input type="text" class="form-input" value="EQP-088" readonly>
            </div>
            
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Make / Model</label>
                <input type="text" class="form-input" placeholder="e.g. Toyota Hilux 2024">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                <div class="form-group">
                    <label class="form-label">Serial Number / VIN</label>
                    <input type="text" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Initial Engine Hours / KM</label>
                    <input type="number" class="form-input" value="0">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label">Upload Proof of Purchase / License</label>
                <div style="border:2px dashed var(--slate-300); border-radius:8px; padding:20px; text-align:center; color:var(--slate-500); cursor:pointer;">
                    <i class="fas fa-file-contract" style="font-size:24px; margin-bottom:8px;"></i>
                    <div style="font-size:12px;">Drag documents here</div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px;" onclick="window.drawer.close(); window.toast.show('Asset successfully added to fleet registry', 'success')">Add to Fleet</button>
        </div>
    `
};
