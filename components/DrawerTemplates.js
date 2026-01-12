export const DrawerTemplates = {
    transactionEntry: `
        <div style="padding: 24px;">
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Transaction Type</label>
                <div style="display: flex; gap: 12px;">
                     <label style="flex: 1; border: 1px solid var(--orange); background: var(--orange-light); padding: 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--orange); cursor: pointer;">
                        <input type="radio" name="trx_type" checked style="accent-color: var(--orange);"> Expense
                     </label>
                     <label style="flex: 1; border: 1px solid var(--slate-200); padding: 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--slate-600); cursor: pointer;">
                        <input type="radio" name="trx_type" style="accent-color: var(--slate-400);"> Invoice
                     </label>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Amount (MWK)</label>
                <input type="number" class="form-input" placeholder="0.00" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 16px; font-weight: 600;">
            </div>

            <div class="grid md:grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project</label>
                    <select class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;">
                        <option>Select Project</option>
                        <option>CEN-01 Unilia Construction</option>
                        <option>NOR-04 Mzuzu Bridge</option>
                    </select>
                </div>
                <div>
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Budget Line</label>
                    <select class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;">
                        <option>Select Category</option>
                        <option>Materials</option>
                        <option>Labor</option>
                        <option>Equipment</option>
                    </select>
                </div>
            </div>

             <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Description</label>
                <textarea class="form-input" rows="3" placeholder="Enter transaction details..." style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 4px; font-family: inherit; font-size: 13px;"></textarea>
            </div>

             <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Receipt / Invoice Upload</label>
                <div style="border: 2px dashed var(--slate-300); border-radius: 6px; padding: 20px; text-align: center; color: var(--slate-500); font-size: 13px; background: var(--slate-50);">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 8px; color: var(--slate-400);"></i>
                    <p>Drag files here or click to upload</p>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;">Process Transaction</button>
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
                <input type="text" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
            </div>
             <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Allocated Budget (MWK)</label>
                <input type="number" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
            </div>
             <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Assign Supervisor</label>
                <select style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                    <option>John Banda</option>
                    <option>Peter Phiri</option>
                    <option>Davi Moyo</option>
                </select>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="window.toast.show('Project created successfully', 'success')">Create Project</button>
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
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Work Completed Today</label>
                <textarea style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" rows="4" placeholder="Describe progress (e.g., Excavated 15m)..."></textarea>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Photo Evidence (Required)</label>
                <div style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 24px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; transition: 0.2s;" onclick="window.toast.show('Camera launched (mock)', 'info')">
                    <i class="fas fa-camera" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div style="font-weight: 600;">Tap to Take Photo</div>
                    <div style="font-size: 11px;">Geotagging Enabled</div>
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Completion %</label>
                <input type="range" style="width: 100%; margin-top: 8px;">
            </div>

            <button class="btn btn-primary" style="width:100%" onclick="window.drawer.close(); window.toast.show('Daily Log Submitted', 'success')">Submit Daily Log</button>
        </div>
    `,

    materialLog: `
        <div class="drawer-section">
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Action Type</label>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary" style="flex:1;">Usage (Consumed)</button>
                    <button class="btn btn-secondary" style="flex:1;">Delivery (Received)</button>
                </div>
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Material Category</label>
                <select style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;"><option>Cement (Bags)</option><option>Sand (Tons)</option></select>
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Quantity</label>
                <input type="number" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" placeholder="0">
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="window.drawer.close(); window.toast.show('Material record saved', 'success')">Save Record</button>
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
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Value (MWK)</label><input class="form-input" type="number" style="width:100%; padding:10px;"></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Start Date</label><input class="form-input" type="date" style="width:100%; padding:10px;"></div>
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
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Select Equipment</label><select class="form-input" style="width:100%; padding:10px;"><option>EQP-045 Excavator</option><option>EQP-012 Tipper</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Assign To (Project)</label><select class="form-input" style="width:100%; padding:10px;"><option>CEN-01 Unilia Library</option><option>MZ-05 Clinic</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Responsible User</label><select class="form-input" style="width:100%; padding:10px;"><option>John Banda (PM)</option><option>Peter Phiri</option></select></div>
            <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Expected Return</label><input type="date" class="form-input" style="width:100%; padding:10px;"></div>
        </div>
        <div class="drawer-section" style="background: #F8FAFC; border:1px solid var(--slate-200);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: var(--slate-700);">GPS Validation</span>
                <span class="status active" style="font-size:11px; font-weight:600; color:var(--emerald); background:#DCFCE7; padding:4px 8px; border-radius:20px;"><i class="fas fa-satellite-dish"></i> Signal Locked</span>
            </div>
            <div style="font-size: 11px; color: var(--slate-500); margin-top: 4px;">Current Loc: -13.9626, 33.7741 (HQ Yard)</div>
        </div>
        <button class="btn btn-primary" style="width:100%; margin-top:16px; border:none; padding:12px;" onclick="window.drawer.close(); window.toast.show('Equipment Assigned', 'success')">Confirm Handover</button>
    `,

    assetDetails: `
        <div class="drawer-section">
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
                <div><div class="stat-label">Serial Number</div><div class="mono-val">CAT-8892-XJ</div></div>
                <div><div class="stat-label">Purchase Date</div><div style="font-weight:600;">Jan 2024</div></div>
                <div><div class="stat-label">Hours</div><div class="mono-val">248 Hrs</div></div>
                <div><div class="stat-label">Status</div><span class="status active" style="background:#DCFCE7; color:#166534; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">In Use</span></div>
            </div>
        </div>
        <div class="drawer-section">
            <div class="stat-label" style="margin-bottom: 8px;">Maintenance History</div>
            <table style="font-size: 11px; width:100%;">
                <thead><tr><th style="text-align:left;">Date</th><th style="text-align:left;">Type</th><th style="text-align:left;">Cost</th></tr></thead>
                <tbody>
                    <tr><td style="padding:4px 0;">Dec 10, 2025</td><td>Hydraulic Check</td><td>MWK 150,000</td></tr>
                    <tr><td style="padding:4px 0;">Oct 05, 2025</td><td>500hr Service</td><td>MWK 450,000</td></tr>
                </tbody>
            </table>
        </div>
        <button class="btn btn-secondary" style="width:100%; border:1px solid var(--slate-200); padding:10px;" onclick="window.drawer.close()">View Full History</button>
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

    complianceAction: `
         <div class="drawer-section">
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; font-size:14px;">Insurance Policy Renewal</div>
                <div style="font-size:12px; color:var(--slate-500);">Ref: INS-882 (All Risk)</div>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Action</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>Request Renewal from Vendor</option>
                    <option>Log Breach of Contract</option>
                    <option>Upload New Policy</option>
                </select>
             </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Message to Vendor</label>
                <textarea class="form-input" rows="4" style="width:100%; padding:10px;">Please submit the renewed 'All Risk' policy for the Unilia project by Friday to avoid payment holds.</textarea>
             </div>
             <button class="btn btn-action" style="width:100%; padding:12px;" onclick="window.drawer.close(); window.toast.show('Notice sent to Vendor', 'success')">Send Notice</button>
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
            <button class="btn btn-primary" style="width:100%; margin-top:16px; padding:12px;" onclick="window.drawer.close(); window.toast.show('Maintenance Logged', 'success')">Close Order</button>
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
    `
};
