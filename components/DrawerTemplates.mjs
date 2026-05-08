export const DrawerTemplates = {
  escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  documentViewer: (url, fileName = "Document") => {
    if (!url || url === "null" || url === "") {
      return `
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; padding: 48px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: var(--slate-100); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: var(--slate-400); margin-bottom: 24px;">
                        <i class="fas fa-file-excel"></i>
                    </div>
                    <h3 style="font-size: 18px; font-weight: 700; color: var(--slate-800); margin-bottom: 8px;">Document Not Found</h3>
                    <p style="font-size: 14px; color: var(--slate-500); max-width: 320px; line-height: 1.6;">
                        This contract record exists but the associated legal document was not successfully archived. 
                        Please contact the Project Manager or re-upload the signed agreement.
                    </p>
                    <button class="btn btn-secondary" onclick="window.drawer.close()" style="margin-top: 24px;">Return to Registry</button>
                </div>
            `;
    }

    const isPdf =
      (url || "").toLowerCase().includes(".pdf") ||
      (fileName || "").toLowerCase().includes(".pdf") ||
      (url || "").includes("type=pdf");
    const fileExt = (fileName || "document.pdf").split(".").pop().toUpperCase();

    return `
            <div style="height: 100%; display: flex; flex-direction: column; background: var(--slate-50);">
                <div style="padding: 16px 24px; border-bottom: 1px solid var(--slate-200); background: white; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); z-index: 10;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: ${isPdf ? "#FEF2F2" : "#F0F9FF"}; color: ${isPdf ? "#EF4444" : "#0369A1"}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            <i class="fas ${isPdf ? "fa-file-pdf" : "fa-file-word"}"></i>
                        </div>
                        <div>
                            <div style="font-size: 14px; font-weight: 800; color: var(--slate-800);">${fileName}</div>
                            <div style="font-size: 11px; color: var(--slate-500); font-weight: 600; text-transform: uppercase;">${fileExt} Document • Secure Viewer</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.print()">
                            <i class="fas fa-print"></i>
                        </button>
                        <a href="${url}" download="${fileName}" class="btn btn-primary btn-sm" style="background: var(--orange); border-color: var(--orange);">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
                
                <div style="flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column;">
                    ${
                      isPdf
                        ? `
                        <iframe src="${url}#toolbar=0&navpanes=0" style="width: 100%; height: 100%; border: none; background: var(--slate-100);"></iframe>
                    `
                        : `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 48px; text-align: center; background: white; margin: 24px; border-radius: 16px; border: 1px dashed var(--slate-300);">
                            <div style="width: 100px; height: 100px; border-radius: 24px; background: #F0F9FF; display: flex; align-items: center; justify-content: center; color: #0369A1; font-size: 48px; margin-bottom: 24px; border: 1px solid #E0F2FE;">
                                <i class="fas fa-file-word"></i>
                            </div>
                            <h3 style="font-size: 20px; font-weight: 800; color: var(--slate-800); margin-bottom: 12px;">Document Preview Locked</h3>
                            <p style="font-size: 14px; color: var(--slate-500); max-width: 400px; line-height: 1.6; margin-bottom: 32px;">
                                This <strong>${fileExt}</strong> document is protected by the MCMS Secure Document Pipeline. 
                                In-app rendering for complex Office formats is restricted to maintain formatting fidelity and security.
                            </p>
                            <div style="display: flex; gap: 12px;">
                                <button class="btn btn-secondary" onclick="window.downloadDocument('${url}', '${fileName}')" style="padding: 12px 24px; font-weight: 700;">
                                    <i class="fas fa-download" style="margin-right: 8px;"></i> Download Local Copy
                                </button>
                                <button class="btn btn-primary" onclick="window.drawer.close()" style="padding: 12px 24px; font-weight: 700; background: var(--orange); border-color: var(--orange);">
                                    <i class="fas fa-check" style="margin-right: 8px;"></i> Acknowledge
                                </button>
                            </div>
                        </div>
                    `
                    }
                </div>
                
                <div style="padding: 12px 24px; background: white; border-top: 1px solid var(--slate-200); font-size: 11px; color: var(--slate-400); display: flex; justify-content: space-between; align-items: center;">
                    <div>MCMS Secure Document Pipeline • AES-256 Encrypted</div>
                    <div style="display: flex; gap: 16px;">
                        <span><i class="fas fa-shield-alt"></i> Verified Integrity</span>
                        <span><i class="fas fa-history"></i> Version 1.0</span>
                    </div>
                </div>
            </div>
        `;
  },

  materialPriceForm: (data = {}) => `
        <div style="padding: 24px;">
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Material Name</label>
                <input type="text" id="price-material-name" class="form-input" data-vrules="required" value="${data.materialName || ""}" placeholder="e.g. Cement (42.5R)" style="width: 100%;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="form-group">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Category</label>
                    <select id="price-category" class="form-input" style="width: 100%;">
                        <option value="Aggregates" ${data.category === "Aggregates" ? "selected" : ""}>Aggregates</option>
                        <option value="Bitumen" ${data.category === "Bitumen" ? "selected" : ""}>Bitumen</option>
                        <option value="Cement" ${data.category === "Cement" ? "selected" : ""}>Cement</option>
                        <option value="Fuel" ${data.category === "Fuel" ? "selected" : ""}>Fuel</option>
                        <option value="Earthworks" ${data.category === "Earthworks" ? "selected" : ""}>Earthworks</option>
                        <option value="Drainage" ${data.category === "Drainage" ? "selected" : ""}>Drainage</option>
                        <option value="Road Furniture" ${data.category === "Road Furniture" ? "selected" : ""}>Road Furniture</option>
                        <option value="Others" ${data.category === "Others" ? "selected" : ""}>Others</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project Phase</label>
                    <select id="price-phase" class="form-input" style="width: 100%;">
                        <option value="General" ${data.phase === "General" ? "selected" : ""}>General / Unassigned</option>
                        <option value="Phase 1: Clearing & Grubbing" ${data.phase === "Phase 1: Clearing & Grubbing" ? "selected" : ""}>Phase 1: Clearing & Grubbing</option>
                        <option value="Phase 2: Earthworks / Subgrade" ${data.phase === "Phase 2: Earthworks / Subgrade" ? "selected" : ""}>Phase 2: Earthworks / Subgrade</option>
                        <option value="Phase 3: Sub-base Construction" ${data.phase === "Phase 3: Sub-base Construction" ? "selected" : ""}>Phase 3: Sub-base Construction</option>
                        <option value="Phase 4: Base Course Construction" ${data.phase === "Phase 4: Base Course Construction" ? "selected" : ""}>Phase 4: Base Course Construction</option>
                        <option value="Phase 5: Surfacing" ${data.phase === "Phase 5: Surfacing" ? "selected" : ""}>Phase 5: Surfacing</option>
                        <option value="Phase 6: Drainage" ${data.phase === "Phase 6: Drainage" ? "selected" : ""}>Phase 6: Drainage</option>
                        <option value="Phase 7: Road Furniture & Accessories" ${data.phase === "Phase 7: Road Furniture & Accessories" ? "selected" : ""}>Phase 7: Road Furniture & Accessories</option>
                        <option value="Phase 8: Bridge Construction" ${data.phase === "Phase 8: Bridge Construction" ? "selected" : ""}>Phase 8: Bridge Construction</option>
                        <option value="Phase 9: Site Establishment" ${data.phase === "Phase 9: Site Establishment" ? "selected" : ""}>Phase 9: Site Establishment</option>
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="form-group">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Base Price (MWK)</label>
                    <input type="number" id="price-base-amount" class="form-input" data-vrules="required|min:0" value="${data.basePrice || ""}" placeholder="0.00" style="width: 100%; font-weight: 700; font-family: 'JetBrains Mono';">
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Unit</label>
                    <select id="price-unit" class="form-input" style="width: 100%;">
                        <option value="Bag" ${data.unit === "Bag" ? "selected" : ""}>Bag</option>
                        <option value="m3" ${data.unit === "m3" ? "selected" : ""}>m³</option>
                        <option value="ton" ${data.unit === "ton" ? "selected" : ""}>Tonne</option>
                        <option value="litres" ${data.unit === "litres" ? "selected" : ""}>Litres</option>
                        <option value="m" ${data.unit === "m" ? "selected" : ""}>Meter (m)</option>
                        <option value="unit" ${data.unit === "unit" ? "selected" : ""}>Unit</option>
                        <option value="drum" ${data.unit === "drum" ? "selected" : ""}>Drum</option>
                    </select>
                </div>
            </div>



            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700;" onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.app.pmModule.handlePriceConfigSubmit(${data.id || "null"})">
                    <i class="fas fa-save" style="margin-right: 8px;"></i> ${data.id ? "Update Configuration" : "Save Configuration"}
                </button>
                
                ${
                  data.id
                    ? `
                    <button class="btn btn-secondary" style="width: 100%; justify-content: center; color: var(--red); border-color: var(--red-light); background: transparent;" onclick="window.app.pmModule.deleteMaterialPrice('${data.id}')">
                        <i class="fas fa-trash-can" style="margin-right: 8px;"></i> Delete Configuration
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `,
  variationOrderForm: (contractId) => `
        <div style="padding: 24px;">
            <div style="background: var(--orange-light); padding: 12px; border-radius: 8px; border: 1px solid var(--orange-hover); margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-file-signature" style="color: var(--orange); font-size: 20px;"></i>
                <div>
                    <div style="font-weight: 700; color: var(--orange); font-size: 14px;">Raise Variation Order (VO)</div>
                    <div style="font-size: 11px; color: var(--orange-hover);">Formal change request for contract scope or budget</div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">VO Reason / Description</label>
                <textarea id="vo-reason" class="form-input" data-vrules="required|minLen:10" rows="4" placeholder="Explain the reason for this variation (e.g. Additional site clearance required, change in material spec)..." style="width: 100%;"></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Financial Adjustment (MWK)</label>
                <input type="number" id="vo-amount" class="form-input" data-vrules="required" placeholder="0.00" style="width: 100%; font-size: 18px; font-weight: 700; font-family: 'JetBrains Mono'; color: var(--slate-900);">
                <div style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">Enter a positive number for budget uplift, negative for reduction.</div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Variation Type</label>
                <select id="vo-type" class="form-input" style="width: 100%;">
                    <option value="SCOPE_CHANGE">Scope Change</option>
                    <option value="PRICE_ADJUSTMENT">Price Adjustment</option>
                    <option value="EMERGENCY_WORKS">Emergency Works</option>
                    <option value="EXTENSION_OF_TIME">Extension of Time (No Financial Impact)</option>
                </select>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700; background: var(--orange); border-color: var(--orange);" onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.app.pmModule.handleVOSubmit(${contractId})">
                Submit Variation Order
            </button>
        </div>
    `,
  transactionEntry: `
        <div style="padding: 24px;">
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Transaction Type</label>
                <div style="display: flex; gap: 12px;">
                     <label style="flex: 1; border: 1px solid var(--orange); background: var(--orange-light); padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--orange); cursor: pointer;">
                        <input type="radio" name="trx_type" id="trx_type_expense" value="expense" checked style="accent-color: var(--orange);"> Expense
                     </label>
                     <label style="flex: 1; border: 1px solid var(--slate-200); padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--slate-600); cursor: pointer;">
                        <input type="radio" name="trx_type" id="trx_type_invoice" value="invoice" style="accent-color: var(--slate-400);"> Invoice
                     </label>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Amount (MWK)</label>
                <input type="number" id="trx-amount" class="form-input" data-vrules="required|min:1" oninput="window.V?.checkField(this)" value="" placeholder="0.00" style="width: 100%; font-size: 18px; font-weight: 700; font-family: 'JetBrains Mono'; color: var(--slate-900);">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project</label>
                <select id="trx-project" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%;">
                    <option value="" disabled selected>Select Project...</option>
                    <option>CEN-01 Unilia Library Complex</option>
                    <option>MZ-05 Mzimba Clinic Extension</option>
                    <option>NOR-04 Mzuzu Bridge Repair</option>
                    <option>LIL-02 Lilongwe Mall Access Road</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Budget Line</label>
                <select id="trx-category" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%;">
                    <option value="" disabled selected>Select Category...</option>
                    <option value="materials">Materials (02-MAT)</option>
                    <option value="labor">Labor (03-LAB)</option>
                    <option value="equipment">Equipment (04-EQU)</option>
                    <option value="overheads">Overheads (05-OVH)</option>
                    <option value="subcontractors">Subcontractors (06-SUB)</option>
                </select>
            </div>

             <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Description / Contractor</label>
                <input type="text" id="trx-contractor" class="form-input" data-vrules="required|minLen:2" oninput="window.V?.checkField(this)" placeholder="Enter contractor name..." style="width: 100%; margin-bottom: 8px;">
                <textarea id="trx-description" class="form-input" data-vrules="required|minLen:5" oninput="window.V?.checkField(this)" rows="3" placeholder="Enter transaction details..." style="width: 100%;"></textarea>
            </div>

             <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Receipt / Invoice Upload</label>
                <div style="border: 2px dashed var(--slate-300); border-radius: 8px; padding: 32px; text-align: center; color: var(--slate-500); font-size: 13px; background: var(--slate-50); cursor: pointer;" onclick="window.toast.show('File explorer opened', 'info')">
                    <i class="fas fa-cloud-arrow-up" style="font-size: 28px; margin-bottom: 8px; color: var(--slate-400);"></i>
                    <p style="margin: 0; font-weight: 500;">Drag files here or <span style="color: var(--orange);">click to upload</span></p>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700;" onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return}(window.app.pmModule || window.app.fsModule || window.app.caModule).handleTransactionSubmit()">Process Transaction</button>
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
                <select class="form-input" data-vrules="required" onchange="window.V?.checkField(this)">
                    <option value="" disabled selected>Select Category...</option>
                    <option>Material Theft / Diversion</option>
                    <option>Bribery / Kickbacks</option>
                    <option>False Invoicing</option>
                    <option>Payroll Fraud</option>
                    <option>Safety Violation Cover-up</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Project / Department Involved</label>
                <select class="form-input" data-vrules="required" onchange="window.V?.checkField(this)">
                    <option value="" disabled selected>Select Project/Dept...</option>
                    <option>None Specific</option>
                    <option>CEN-01 Unilia Construction</option>
                    <option>Supply Chain / Logistics</option>
                    <option>Human Resources</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Evidence / Narrative</label>
                <textarea class="form-input" data-vrules="required|minLen:20" oninput="window.V?.checkField(this)" rows="5" placeholder="Please provide details, dates, and names if known..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Supporting Documents (Secure Upload)</label>
                <div style="border: 2px dashed var(--slate-300); padding: 20px; text-align: center; border-radius: 8px; background: var(--slate-50); color: var(--slate-500);">
                    <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <p style="font-size: 12px;">Files are encrypted on upload</p>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; background: var(--red); border-color: var(--red); justify-content: center; padding: 14px; font-weight: 700;" onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.toast.show('Report filed securely. Internal Audit alerted.', 'error'); window.drawer.close();">Submit Secure Report</button>
        </div>
    `,
  safetyIncident: `
        <div class="drawer-section" style="padding-top: 12px;">
            <div class="hidden-desktop" style="width: 40px; height: 5px; background: var(--slate-300); border-radius: 10px; margin: 0 auto 20px;"></div>
            <div style="background: var(--red-light); padding: 16px; border-radius: 8px; border: 1px solid var(--red-border); margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-helmet-safety" style="color: var(--red); font-size: 20px;"></i>
                <div style="font-weight: 700; color: var(--red); font-size: 14px;">Report Safety Incident</div>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Incident Type</label>
                <select class="form-input" data-vrules="required" onchange="window.V?.checkField(this)">
                    <option value="" disabled selected>Select Incident Type...</option>
                    <option>Near Miss</option>
                    <option>Minor Injury</option>
                    <option>Major Injury</option>
                    <option>Equipment Damage</option>
                    <option>Environmental Incident</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Description</label>
                <textarea class="form-input" data-vrules="required|minLen:10" oninput="window.V?.checkField(this)" rows="4" placeholder="Provide details of the incident..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <label class="form-label" style="margin:0;">Incident Evidence</label>
                    <span id="photo-counter-safetyIncident" style="font-size:11px; color:var(--slate-500);"><span style="font-weight:700;">0</span>/10 photos</span>
                </div>
                <label id="photo-add-btn-safetyIncident" onclick="return window.handleCameraClick(event, 'safetyIncident')" style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 16px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; display: block; margin-bottom:8px;">
                    <i class="fas fa-camera" style="font-size: 18px; margin-bottom: 4px;"></i>
                    <div style="font-weight: 600; font-size: 11px;">Capture Scene / Injury Evidence</div>
                    <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="window.handlePhotoCapture(this, 'safetyIncident')">
                </label>
                <div id="photo-preview-safetyIncident" style="display:flex; gap:8px; flex-wrap:wrap; padding:4px 0;">
                    <div style="text-align:center; color:var(--slate-400); font-size:12px; padding:8px; width:100%;">No evidence attached.</div>
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%; background: var(--red); border-color: var(--red); justify-content: center; padding: 14px; font-weight: 700;" onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} window.toast.show('Safety incident reported. HQ notified.', 'error'); window.drawer.close();">Submit Incident Report</button>
        </div>
    `,
  reportingMenu: `
        <div class="drawer-section" style="padding-top: 12px;">
            <div class="hidden-desktop" style="width: 40px; height: 5px; background: var(--slate-300); border-radius: 10px; margin: 0 auto 20px;"></div>
            <div style="margin-bottom: 24px; text-align: center;">
                <div style="width: 48px; height: 48px; background: var(--slate-100); color: var(--slate-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 20px;">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 style="font-size: 16px; font-weight: 700; color: var(--slate-900);">Governance & Site Controls</h3>
                <p style="font-size: 13px; color: var(--slate-500);">Monitor blockers and site integrity</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="btn" style="width: 100%; padding: 16px; justify-content: flex-start; gap: 16px; background: white; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);" onclick="window.drawer.open('Daily Log', window.DrawerTemplates.dailyProgressLog())">
                    <div style="width: 32px; height: 32px; background: rgba(249, 116, 21, 0.1); color: var(--orange); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-camera"></i>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--slate-900);">Daily Progress Log</div>
                        <div style="font-size: 11px; color: var(--slate-500);">Log work done, expenses and photos</div>
                    </div>
                </button>

                <button class="btn" style="width: 100%; padding: 16px; justify-content: flex-start; gap: 16px; background: white; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);" onclick="window.app.fsModule.viewRejectedLogs()">
                    <div style="width: 32px; height: 32px; background: rgba(239, 68, 68, 0.1); color: var(--red); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-undo-alt"></i>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--slate-900);">Rejected Reviews</div>
                        <div style="font-size: 11px; color: var(--slate-500);">View and fix rejected site logs</div>
                    </div>
                </button>

                <button class="btn" style="width: 100%; padding: 16px; justify-content: flex-start; gap: 16px; background: white; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);" onclick="window.drawer.open('Report Issue', window.DrawerTemplates.submitComplaint(window.app.fsModule?.assignedProject?.id))">
                    <div style="width: 32px; height: 32px; background: rgba(245, 158, 11, 0.1); color: var(--amber); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--slate-900);">Report Issue / Blocker</div>
                        <div style="font-size: 11px; color: var(--slate-500);">Log site delays or technical issues</div>
                    </div>
                </button>

                <div style="height: 1px; background: var(--slate-100); margin: 8px 0;"></div>

                <!-- Profile Button -->
                <button class="btn" style="width: 100%; padding: 16px; justify-content: flex-start; gap: 16px; background: white; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);" onclick="window.app.layout.showProfileDrawer()">
                    <div style="width: 32px; height: 32px; background: rgba(59, 130, 246, 0.1); color: var(--blue); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--slate-900);">My Profile</div>
                        <div style="font-size: 11px; color: var(--slate-500);">Account settings & credentials</div>
                    </div>
                </button>

                <!-- Download App (PWA) -->
                <button class="btn" style="width: 100%; padding: 16px; justify-content: flex-start; gap: 16px; background: white; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);" onclick="window.triggerPwaInstall()">
                    <div style="width: 32px; height: 32px; background: rgba(249, 116, 21, 0.1); color: var(--orange); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-campground"></i>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--slate-900);">Install Work App</div>
                        <div style="font-size: 11px; color: var(--slate-500);">Fast access from your home screen</div>
                    </div>
                </button>

                <!-- Logout -->
                <button class="btn" style="width: 100%; padding: 16px; justify-content: flex-start; gap: 16px; background: #FFF1F2; border: 1px solid #FECACA; box-shadow: var(--shadow-sm);" onclick="window.app.layout.handleLogout()">
                    <div style="width: 32px; height: 32px; background: white; color: var(--red); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #FECACA;">
                        <i class="fas fa-power-off"></i>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--red);">Logout Session</div>
                        <div style="font-size: 11px; color: #B91C1C; opacity: 0.8;">Securely sign out of MCMS</div>
                    </div>
                </button>
            </div>
        </div>
    `,

  submitComplaint: `
        <div class="drawer-section">
            <div style="background: var(--amber-light); padding: 16px; border-radius: 8px; border: 1px solid var(--amber-hover); margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-exclamation-triangle" style="color: var(--amber-dark); font-size: 20px;"></i>
                <div style="font-weight: 700; color: var(--amber-dark); font-size: 14px;">Report Site Issue / Delay</div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Issue Category</label>
                <select class="form-input">
                    <option>Material Shortage</option>
                    <option>Weather Delay</option>
                    <option>Equipment Breakdown</option>
                    <option>Technical Clarification Needed</option>
                    <option>Labor Dispute</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Severity</label>
                <div style="display: flex; gap: 12px;">
                    <label style="flex: 1; border: 1px solid var(--slate-200); padding: 8px; border-radius: 6px; text-align: center; cursor: pointer;">
                        <input type="radio" name="severity" value="low"> <div style="font-size: 11px;">Low</div>
                    </label>
                    <label style="flex: 1; border: 1px solid var(--amber); background: var(--amber-light); padding: 8px; border-radius: 6px; text-align: center; cursor: pointer;">
                        <input type="radio" name="severity" value="medium" checked> <div style="font-size: 11px; font-weight: 700;">Medium</div>
                    </label>
                    <label style="flex: 1; border: 1px solid var(--red); background: var(--red-light); padding: 8px; border-radius: 6px; text-align: center; cursor: pointer;">
                        <input type="radio" name="severity" value="high"> <div style="font-size: 11px; font-weight: 700;">High</div>
                    </label>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Details</label>
                <textarea class="form-input" data-vrules="required|minLen:10" rows="5" placeholder="Describe the issue and expected impact on schedule..."></textarea>
            </div>

            <button class="btn btn-primary" style="width: 100%; background: var(--amber-dark); border-color: var(--amber-dark); justify-content: center; padding: 14px; font-weight: 700;" onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.toast.show('Issue reported to PM and Operations.', 'info'); window.drawer.close();">Submit Report</button>
        </div>
    `,

  safetyIncident: (incident) => `
        <div style="padding: 0;">
            <div style="padding: 16px 24px; background: #FEF2F2; border-bottom: 1px solid #FECACA; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 800; font-size: 16px; color: #991B1B;">${incident?.id ? "Incident Report: " + incident.id : "New Safety Incident"}</div>
                    <div style="font-size: 12px; color: #B91C1C;">Priority: ${incident?.priority || "High"}</div>
                </div>
                <div class="status-badge" style="background: white; color: #991B1B; border: 1px solid #FECACA; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                    ${(incident?.status || "PENDING").toUpperCase()}
                </div>
            </div>

            <div style="padding: 24px; max-height: calc(100vh - 120px); overflow-y: auto;">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label">Incident Type</label>
                    <input type="text" class="form-input" value="${incident?.type || "Injury"}" readonly style="width: 100%; background: #F8FAFC;">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label">Narrative / Description</label>
                    <div style="background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px; font-size: 14px; color: var(--slate-700); line-height: 1.6;">
                        ${incident?.description || "No description provided."}
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Evidence Capture</label>
                    <div id="safety-photo-preview" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                        ${(incident?.photos || []).map((p) => `<img src="${p}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 1px solid var(--slate-200);">`).join("")}
                    </div>
                    ${
                      !incident?.id
                        ? `
                    <label class="camera-btn" style="border: 2px dashed #FECACA; background: #FFF5F5; padding: 20px; text-align: center; border-radius: 12px; color: #B91C1C; cursor: pointer; display: block;" onclick="window.app.fsModule?.triggerSafetyCamera()">
                        <i class="fas fa-camera" style="font-size: 24px; margin-bottom: 8px;"></i>
                        <div style="font-weight: 700; font-size: 13px;">Capture Scene / Hazard</div>
                    </label>
                    `
                        : ""
                    }
                </div>

                <div style="border-top: 1px solid var(--slate-200); padding-top: 24px; margin-top: 24px;">
                    <h4 style="font-size: 12px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; margin-bottom: 16px;">Handling Thread / Replies</h4>
                    
                    <div id="safety-reply-thread" style="margin-bottom: 24px; border: 1px solid var(--slate-200); border-radius: 8px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="background: var(--slate-50); border-bottom: 1px solid var(--slate-200);">
                                <tr>
                                    <th style="padding: 12px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase;">User / Role</th>
                                    <th style="padding: 12px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase;">Date / Time</th>
                                    <th style="padding: 12px; font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase;">Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                  (incident?.replies || []).length === 0
                                    ? `
                                    <tr>
                                        <td colspan="3" style="text-align: center; padding: 24px; color: var(--slate-400); font-size: 12px; background: white;">
                                            No handling updates yet.
                                        </td>
                                    </tr>
                                `
                                    : incident.replies
                                        .map(
                                          (reply) => `
                                    <tr style="border-bottom: 1px solid var(--slate-100); background: white;">
                                        <td style="padding: 12px; vertical-align: top;">
                                            <div style="font-weight: 700; font-size: 12px; color: var(--slate-900);">${reply.user?.name || "System"}</div>
                                            <div style="font-size: 10px; color: var(--slate-500);">${reply.user?.role?.replace(/_/g, " ") || "User"}</div>
                                        </td>
                                        <td style="padding: 12px; vertical-align: top; font-size: 11px; color: var(--slate-600);">
                                            ${new Date(reply.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td style="padding: 12px; vertical-align: top; font-size: 13px; color: var(--slate-700); line-height: 1.5;">
                                            ${reply.content}
                                        </td>
                                    </tr>
                                `,
                                        )
                                        .join("")
                                }
                            </tbody>
                        </table>
                    </div>

                    <div class="reply-input-box" style="display: flex; gap: 12px; background: white; padding: 12px; border: 1px solid var(--slate-200); border-radius: 12px; box-shadow: var(--shadow-sm);">
                        <textarea id="safety-reply-text" style="flex: 1; border: none; outline: none; font-size: 13px; resize: none; background: transparent;" placeholder="Type a reply or update..." rows="1"></textarea>
                        <button class="btn btn-primary" style="padding: 8px 16px; font-size: 12px;" onclick="window.app.fsModule?.handleSafetyReply('${incident?.id}')">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,

  contractView: (contract) => {
    const versions = contract.versions || [];
    const latestVersion = versions.length > 0 ? versions[0] : null;
    const currentVersionNum = latestVersion ? latestVersion.versionNumber : 1;

    return `
        <div style="padding: 0;">
            <div style="padding: 24px; border-bottom: 1px solid var(--slate-200); background: linear-gradient(to right, var(--slate-50), #fff);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 800; color: var(--slate-900);">${contract.refCode || "CTR-" + contract.id}</div>
                        <div style="color: var(--slate-500); font-size: 13px; font-weight: 500;">${contract.title}</div>
                    </div>
                    <span class="status ${ (contract.endDate && new Date(contract.endDate) <= new Date()) ? 'delayed' : (contract.status === 'active' ? 'active' : 'locked') }" style="padding: 4px 12px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; ${ (contract.endDate && new Date(contract.endDate) <= new Date()) ? 'background: #fee2e2; color: #ef4444;' : '' }">${ (contract.endDate && new Date(contract.endDate) <= new Date()) ? "ENDED" : (contract.status || "ACTIVE").toUpperCase()}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
                    ${
                      contract.contractType !== "project"
                        ? `
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Vendor / Party</div>
                        <div style="font-weight: 700; color: var(--slate-800); font-size: 15px;">${contract.vendorName || "-"}</div>
                    </div>
                    `
                        : `
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Linked Project</div>
                        <div style="font-weight: 700; color: var(--slate-800); font-size: 15px;">${contract.project?.name || "Master Project"}</div>
                    </div>
                    `
                    }
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Contract Value</div>
                        <div style="font-weight: 800; color: var(--slate-900); font-family: 'JetBrains Mono'; font-size: 15px;">MWK ${Number(contract.value || 0).toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Start Date</div>
                        <div style="font-weight: 600; color: var(--slate-700);">${contract.startDate ? new Date(contract.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">End Date</div>
                        <div style="font-weight: 600; color: var(--slate-700);">${contract.endDate ? new Date(contract.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Procurement Variance</div>
                        ${(() => {
                          const market = Number(contract.marketValue || contract.project?.budgetTotal || 0);
                          const actual = Number(contract.value || 0);
                          const variance = actual - market;
                          const isOver = variance > 0;
                          const percent = market > 0 ? ((variance / market) * 100).toFixed(1) : '0.0';
                          return `
                          <div style="font-weight: 800; color: ${isOver ? '#e11d48' : '#059669'}; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                            ${isOver ? '+' : ''}MWK ${Math.abs(variance).toLocaleString()} 
                            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${isOver ? '#fff1f2' : '#ecfdf5'}; color: ${isOver ? '#e11d48' : '#059669'};">
                                ${percent}% ${isOver ? 'OVER' : 'UNDER'}
                            </span>
                          </div>`;
                        })()}
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Actual Contract Value</div>
                        <div style="font-weight: 800; color: var(--emerald-dark); font-size: 14px; font-family: 'JetBrains Mono';">MWK ${Number(contract.value || 0).toLocaleString()}</div>
                    </div>
                </div>
                
                ${(() => {
                  const justText = contract.justification || contract.versions?.[0]?.changeNotes || "";
                  if (justText && justText !== "Initial contract creation") {
                    return `
                <div style="margin-top: 24px; padding: 16px; background: #fff; border: 1px solid var(--slate-200); border-radius: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Justification / Purpose</div>
                    <div style="font-size: 13px; color: var(--slate-700); line-height: 1.6;">${justText}</div>
                </div>
                `;
                  }
                  return "";
                })()}
            </div>

            <div style="padding: 24px;">
                <!-- Materials Section -->
                <div style="margin-bottom: 32px;">
                    <h4 style="font-size: 11px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Procured Materials & Specs</h4>
                    <div style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm);">
                        <div style="padding: 10px 16px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">
                            <div style="flex: 2;">Item Specification</div>
                            <div style="flex: 1; text-align: right;">Quantity</div>
                            <div style="flex: 1.2; text-align: right;">Total Est. Value</div>
                        </div>
                        ${
                          contract.items && contract.items.length > 0
                            ? contract.items
                                .map(
                                  (item) => `
                            <div style="padding: 12px 16px; border-bottom: 1px solid var(--slate-100); display: flex; align-items: center;">
                                <div style="flex: 2;">
                                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-800);">${item.materialName}</div>
                                    <div style="font-size: 11px; color: var(--slate-500);">${(item.unitPrice !== undefined && item.unitPrice !== null) ? "MWK " + Number(item.unitPrice).toLocaleString() + " per " + (item.unit || "unit") : item.unit || "Standard Unit"}</div>
                                </div>
                                <div style="flex: 1; text-align: right;">
                                    <div style="font-size: 12px; font-weight: 700; color: var(--slate-700);">${item.quantity} ${item.unit || ""}</div>
                                </div>
                                <div style="flex: 1.2; text-align: right;">
                                    <div style="font-size: 13px; font-weight: 800; color: var(--slate-900); font-family: 'JetBrains Mono';">MWK ${Number(item.totalCost || 0).toLocaleString()}</div>
                                    ${item.variance !== undefined ? `
                                        <div style="font-size: 9px; font-weight: 800; margin-top: 4px; color: ${Number(item.variance) >= 0 ? "var(--emerald)" : "var(--red)"};">
                                            <i class="fas ${Number(item.variance) >= 0 ? "fa-caret-down" : "fa-caret-up"}"></i> 
                                            ${Number(item.variance) >= 0 ? "SAVED" : "OVER"} MWK ${Math.abs(Number(item.variance) * Number(item.quantity)).toLocaleString()}
                                        </div>
                                    ` : ""}
                                </div>
                            </div>
                        `,
                                )
                                .join("")
                            : `
                            <div style="padding: 24px; text-align: center; color: var(--slate-400); font-size: 12px;">
                                <i class="fas fa-box-open" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                                No specific material line items attached to this agreement.
                            </div>
                        `
                        }
                    </div>
                </div>

                <!-- Variation Orders Section -->
                ${
                  contract.contractType !== "project"
                    ? `
                <div style="margin-bottom: 32px; padding: 16px; background: var(--slate-50); border-radius: 12px; border: 1px solid var(--slate-200);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="font-size: 11px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Variation Orders (VO)</h4>
                        <button class="btn btn-secondary btn-sm" style="color: var(--orange); font-weight: 700;" onclick="window.app.pmModule?.openVariationOrderDrawer(${contract.id})">
                            <i class="fas fa-plus"></i> Raise VO
                        </button>
                    </div>
                    <div id="variation-orders-list">
                        ${
                          contract.variationOrders &&
                          contract.variationOrders.length > 0
                            ? contract.variationOrders
                                .map(
                                  (vo) => `
                            <div style="padding: 10px; background: white; border: 1px solid var(--slate-200); border-radius: 8px; margin-bottom: 8px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <span style="font-weight: 700; font-size: 12px; color: var(--slate-800);">${vo.voCode}</span>
                                    <span style="font-family: 'JetBrains Mono'; font-weight: 700; color: ${vo.amount >= 0 ? "var(--emerald)" : "var(--red)"}; font-size: 11px;">
                                        ${vo.amount >= 0 ? "+" : ""}${vo.amount.toLocaleString()} MWK
                                    </span>
                                </div>
                                <div style="font-size: 11px; color: var(--slate-500); line-height: 1.4;">${vo.reason}</div>
                            </div>
                        `,
                                )
                                .join("")
                            : `
                            <div style="font-size: 11px; color: var(--slate-400); text-align: center; padding: 12px; border: 1px dashed var(--slate-200); border-radius: 8px; background: white;">
                                No Variation Orders recorded for this contract.
                            </div>
                        `
                        }
                    </div>
                </div>
                `
                    : ""
                }
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h4 style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Contract Documents</h4>
                </div>
                
                <div style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
                    <div style="width: 48px; height: 48px; background: #FEF2F2; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 24px; border: 1px solid #FEE2E2;">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: var(--slate-800); font-size: 14px;">${contract.fileName || "Master_Agreement_Signed.pdf"}</div>
                        <div style="font-size: 11px; color: var(--slate-500);">
                            <span style="font-weight: 700; color: var(--orange);">Version v${currentVersionNum}</span> • 
                            Uploaded By: <span style="font-weight: 600; color: var(--slate-700);">${(latestVersion?.createdBy?.name) || contract.createdBy?.name || window.currentUser?.name || "Authorized Official"}</span> • 
                            ${latestVersion ? new Date(latestVersion.createdAt).toLocaleDateString() : (contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : new Date().toLocaleDateString())}
                        </div>
                    </div>
                    <button class="btn btn-secondary" style="padding: 8px 12px;" onclick="window.viewDocument('${contract.documentUrl || ""}', '${contract.fileName || ""}')">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="btn btn-secondary" style="padding: 8px 12px;" onclick="window.downloadDocument('${contract.documentUrl || ""}', '${contract.fileName || ""}')">
                        <i class="fas fa-download"></i>
                    </button>
                </div>

                <div style="margin-bottom: 32px;">
                    <h4 style="font-size: 13px; font-weight: 800; color: var(--slate-600); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-history" style="color: var(--orange);"></i> Version History & Audit Trace
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${
                          versions.length > 0
                            ? versions
                                .map(
                                  (v, idx) => `
                            <div style="display: flex; flex-direction: column; padding: 16px; background: white; border-radius: 12px; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); transition: all 0.2s ease;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 32px; height: 32px; background: var(--slate-100); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: var(--slate-500);">V${v.versionNumber}</div>
                                        <div>
                                            <div style="font-size: 14px; font-weight: 700; color: var(--slate-800);">${v.fileName || (contract.contractType === "project" ? "Master_Agreement_V" + v.versionNumber + ".pdf" : "Contract_V" + v.versionNumber + ".pdf")}</div>
                                            <div style="font-size: 12px; color: var(--slate-500); display: flex; align-items: center; gap: 4px;">
                                                <i class="fas fa-user-circle" style="font-size: 11px;"></i>
                                                ${v.createdBy?.name || window.currentUser?.name || "Authorized Official"} • ${new Date(v.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-secondary btn-sm" title="View" onclick="window.viewDocument('${v.documentUrl || ""}', '${v.fileName || (contract.contractType === "project" ? "Master_Agreement_V" + v.versionNumber + ".pdf" : "Contract_V" + v.versionNumber + ".pdf")}')" style="padding: 6px 10px;">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-secondary btn-sm" title="Download" onclick="window.downloadDocument('${v.documentUrl || ""}', '${v.fileName || (contract.contractType === "project" ? "Master_Agreement_V" + v.versionNumber + ".pdf" : "Contract_V" + v.versionNumber + ".pdf")}')" style="padding: 6px 10px;">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </div>
                                <div style="padding: 12px 0; font-size: 13px; color: var(--slate-700); line-height: 1.5;">
                                    <div style="font-size: 10px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; display: flex; justify-content: space-between; border-bottom: 1px solid var(--slate-100); padding-bottom: 4px;">
                                        <span>Change Authorization & Intent</span>
                                        <span style="color: var(--slate-500);">${v.versionNumber === 1 ? "ORIGINAL BASELINE" : "REVISION V" + v.versionNumber}</span>
                                    </div>
                                    <div style="padding-top: 4px;">
                                        ${(v.changeNotes && v.changeNotes !== "Initial contract creation") ? v.changeNotes : "Master agreement baseline establishment and legal archiving."}
                                    </div>
                                </div>
                            </div>
                        `,
                                )
                                .join("")
                            : `
                            <div style="text-align: center; padding: 32px; color: var(--slate-400); font-size: 13px; background: var(--slate-50); border-radius: 12px; border: 1px dashed var(--slate-200);">
                                <i class="fas fa-history" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5;"></i>
                                <div>No prior versions tracked for this contract.</div>
                            </div>
                        `
                        }
                    </div>
                </div>

                <div style="background: ${(contract.status === "expired" || (contract.endDate && new Date(contract.endDate) <= new Date())) ? "#fef2f2" : "#f0fdf4"}; border: 1px solid ${(contract.status === "expired" || (contract.endDate && new Date(contract.endDate) <= new Date())) ? "#fecaca" : "#bbf7d0"}; padding: 16px; border-radius: 8px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <i class="fas ${(contract.status === "expired" || (contract.endDate && new Date(contract.endDate) <= new Date())) ? "fa-exclamation-triangle" : "fa-shield-check"}" style="color: ${(contract.status === "expired" || (contract.endDate && new Date(contract.endDate) <= new Date())) ? "#dc2626" : "#16a34a"}; font-size: 18px; margin-top: 2px;"></i>
                        <div style="font-size: 13px; color: ${(contract.status === "expired" || (contract.endDate && new Date(contract.endDate) <= new Date())) ? "#991b1b" : "#15803d"}; line-height: 1.5;">
                            <strong>Compliance Status:</strong> ${(contract.status === "expired" || (contract.endDate && new Date(contract.endDate) <= new Date())) ? "This contract has ended and requires immediate renewal or final closure." : "This contract is active and all associated insurance policies are valid. No payment blocks detected."}
                        </div>
                    </div>
                    ${(contract.status === "expired" || (contract.endDate && new Date(contract.endDate) <= new Date())) ? `
                    <div style="display: flex; gap: 8px; margin-left: 30px;">
                        <button class="btn btn-primary btn-sm" style="background: var(--slate-800); border-color: var(--slate-800);" onclick="(window.app.fmModule || window.app.pmModule)?.openEditContractDrawer(${JSON.stringify(contract).replace(/"/g, "&quot;")})">
                            <i class="fas fa-sync-alt"></i> Renew Contract
                        </button>
                        <button class="btn btn-secondary btn-sm" style="color: var(--red); border-color: #fecaca; background: white;" onclick="(window.app.fmModule || window.app.pmModule)?.openTerminateContractDrawer(${JSON.stringify(contract).replace(/"/g, "&quot;")})">
                            <i class="fas fa-file-circle-check"></i> Initiate Closure
                        </button>
                    </div>
                    ` : ''}
                </div>

                ${((contract.status === 'expired' || contract.status === 'cancelled' || (contract.endDate && new Date(contract.endDate) <= new Date())) && !contract.vendorRating && contract.vendorId) ? `
                <div style="margin-bottom: 32px; padding: 20px; background: #fffaf5; border-radius: 12px; border: 1px solid var(--orange); box-shadow: var(--shadow-sm);">
                    <h4 style="font-size: 14px; font-weight: 800; color: var(--orange-dark); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-star-half-alt"></i> Rate Vendor Performance
                    </h4>
                    <div style="font-size: 12px; color: var(--slate-600); margin-bottom: 16px;">This contract has concluded. Please rate ${contract.vendorName || 'the vendor'}'s performance to update their overall scorecard.</div>
                    
                    <div style="display: flex; gap: 8px; margin-bottom: 16px; font-size: 24px; color: var(--slate-300); cursor: pointer;" id="vendor-rating-stars">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <label style="cursor: pointer; position: relative;">
                                <input type="radio" name="vendor_rating" value="${i}" style="opacity: 0; position: absolute;" 
                                    onchange="document.querySelectorAll('#vendor-rating-stars i').forEach((el, idx) => el.style.color = idx < ${i} ? 'var(--orange)' : 'var(--slate-300)')">
                                <i class="fas fa-star transition-colors duration-200"></i>
                            </label>
                        `).join('')}
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label" style="font-size: 11px;">Performance Comments (Optional)</label>
                        <textarea id="vendor_rating_comment" class="form-input" rows="2" style="width: 100%; border-color: var(--orange-light);" placeholder="Did they deliver on time? How was the quality?"></textarea>
                    </div>
                    
                    <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--orange); border-color: var(--orange);" onclick="window.app.fmModule?.submitVendorRating(${contract.id})">
                        Submit Scorecard Rating
                    </button>
                </div>
                ` : ''}
                
                ${contract.vendorRating ? `
                <div style="margin-bottom: 32px; padding: 16px; background: var(--slate-50); border-radius: 12px; border: 1px solid var(--slate-200);">
                    <h4 style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Final Vendor Rating</h4>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="color: var(--orange); font-size: 18px;">
                            ${Array(5).fill(0).map((_, i) => `<i class="fas fa-star" style="color: ${i < contract.vendorRating ? 'var(--orange)' : 'var(--slate-300)'};"></i>`).join('')}
                        </div>
                        <div style="font-size: 14px; font-weight: 800; color: var(--slate-900);">${contract.vendorRating}.0 / 5.0</div>
                    </div>
                    ${contract.ratingComment ? `<div style="margin-top: 8px; font-size: 12px; color: var(--slate-600); font-style: italic;">"${contract.ratingComment}"</div>` : ''}
                </div>
                ` : ''}

                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                    ${['active', 'draft', 'pending'].includes(contract.status) ? `
                    <button class="btn btn-secondary" style="flex: 1; justify-content: center; font-weight: 700;" onclick="(window.app.fmModule || window.app.pmModule)?.openEditContractDrawer(${JSON.stringify(contract).replace(/"/g, "&quot;")})">
                        <i class="fas fa-edit" style="margin-right: 8px;"></i> Edit Details
                    </button>
                    ` : ''}
                    ${(contract.status === 'active' || contract.status === 'Active' || contract.status === 'expired') ? `
                    ${contract.items && contract.items.length > 0 && contract.items.every(i => Number(i.receivedQty) >= Number(i.quantity)) ? `
                    <button class="btn btn-secondary" style="flex: 1; justify-content: center; font-weight: 700; color: var(--emerald); border-color: #bbf7d0; background: #f0fdf4;" onclick="(window.app.fmModule || window.app.pmModule)?.completeContract(${contract.id})">
                        <i class="fas fa-check-double" style="margin-right: 8px;"></i> Mark Completed
                    </button>
                    ` : `
                    <button class="btn btn-secondary" style="flex: 1; justify-content: center; font-weight: 700; color: var(--red); border-color: #fecaca; background: #fef2f2;" onclick="(window.app.fmModule || window.app.pmModule)?.openTerminateContractDrawer(${JSON.stringify(contract).replace(/"/g, "&quot;")})">
                        <i class="fas fa-ban" style="margin-right: 8px;"></i> ${contract.status === 'expired' ? 'Finalize Closure' : 'Terminate'}
                    </button>
                    `}
                    ` : ''}
                    <button class="btn btn-secondary" style="flex: 1; justify-content: center; font-weight: 700;" onclick="window.drawer.close()">Close</button>
                </div>
                <button class="btn btn-primary" style="width: 100%; justify-content: center; font-weight: 700; background: var(--orange); border-color: var(--orange);" onclick="window.downloadDocument('${contract.documentUrl || ""}', '${contract.fileName || "Contract_Latest.pdf"}')">
                    <i class="fas fa-download" style="margin-right: 8px;"></i> Download Latest PDF
                </button>
            </div>
        </div>
    `;
  },





  requestFunds: `
        <div class="drawer-section">
            <div style="margin-bottom: 24px; padding: 12px; background: var(--orange-light); border-radius: 8px; border: 1px solid var(--orange-hover); display: flex; gap: 12px; align-items: center;">
                 <i class="fas fa-file-invoice-dollar" style="color: var(--orange); font-size: 20px;"></i>
                 <div>
                     <div style="font-weight: 700; color: var(--orange); font-size: 14px;">New Fund Request</div>
                     <div style="font-size: 11px; color: var(--orange-hover);">Submit requisition for approval</div>
                 </div>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Project</label>
                <select class="form-input" style="width: 100%; padding: 10px;">
                    <option>CEN-01 Unilia Library Complex</option>
                    <option>MZ-05 Mzimba Clinic Extension</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Vendor Name</label>
                <input type="text" class="form-input" data-vrules="required|minLen:2" style="width: 100%; padding: 10px;" placeholder="e.g. Lilongwe Hardware">
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Description / Items</label>
                <textarea class="form-input" data-vrules="required|minLen:5" rows="3" style="width: 100%; padding: 10px;" placeholder="List items needed..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Total Amount (MWK)</label>
                <input type="number" class="form-input" data-vrules="required|min:1" style="width: 100%; padding: 10px; font-family: 'JetBrains Mono'; font-weight: 700;" placeholder="0.00">
            </div>

            <div style="margin-bottom: 24px;">
                <label class="form-label">Supporting Document (Quote/Invoice)</label>
                <div style="border: 2px dashed var(--slate-300); padding: 20px; text-align: center; border-radius: 8px; background: var(--slate-50); color: var(--slate-500); cursor: pointer;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <p style="font-size: 12px; margin: 0;">Click to upload PDF/Image</p>
                </div>
            </div>

            <button class="btn btn-primary" id="btn-submit-funds" style="width: 100%; padding: 14px; font-weight: 700;" onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}(window.app.pmModule || window.app.fsModule || window.app.caModule).handleRequestFunds()">Submit Request</button>
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
        <div class="drawer-section" style="padding-bottom: 80px;">
            <div id="project-form-error" style="display:none; padding:12px; background:var(--red-light); color:var(--red); border-radius:6px; margin-bottom:16px; font-size:13px;"></div>
            
            <!-- Step Progress Header -->
            <div id="project-wizard-progress" style="display:flex; justify-content:space-between; margin-bottom: 24px; position:relative;">
                <div style="position:absolute; top:12px; left:0; right:0; height:2px; background:var(--slate-200); z-index:0;"></div>
                <div id="progress-bar-fill" style="position:absolute; top:12px; left:0; width:0%; height:2px; background:var(--orange); z-index:0; transition:width 0.3s ease;"></div>
                
                <div class="wizard-step step-1 active" style="z-index:1; display:flex; flex-direction:column; align-items:center; gap:4px; flex:1;">
                    <div class="step-circle" style="width:24px; height:24px; border-radius:50%; background:var(--orange); color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:2px solid white;">1</div>
                    <div style="font-size:10px; font-weight:700; color:var(--orange); text-transform:uppercase;">Identity</div>
                </div>
                <div class="wizard-step step-2" style="z-index:1; display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; opacity:0.4;">
                    <div class="step-circle" style="width:24px; height:24px; border-radius:50%; background:var(--slate-200); color:var(--slate-500); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:2px solid white;">2</div>
                    <div style="font-size:10px; font-weight:700; color:var(--slate-500); text-transform:uppercase;">Road Spec</div>
                </div>
                <div class="wizard-step step-3" style="z-index:1; display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; opacity:0.4;">
                    <div class="step-circle" style="width:24px; height:24px; border-radius:50%; background:var(--slate-200); color:var(--slate-500); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:2px solid white;">3</div>
                    <div style="font-size:10px; font-weight:700; color:var(--slate-500); text-transform:uppercase;">Accessories</div>
                </div>
                <div class="wizard-step step-4" style="z-index:1; display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; opacity:0.4;">
                    <div class="step-circle" style="width:24px; height:24px; border-radius:50%; background:var(--slate-200); color:var(--slate-500); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:2px solid white;">4</div>
                    <div style="font-size:10px; font-weight:700; color:var(--slate-500); text-transform:uppercase;">Budget Lock</div>
                </div>
                <!-- Final Step -->
                <div class="wizard-step step-5" style="z-index:1; display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; opacity:0.4;">
                    <div class="step-circle" style="width:24px; height:24px; border-radius:50%; background:var(--slate-200); color:var(--slate-500); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:2px solid white;">✓</div>
                    <div style="font-size:10px; font-weight:700; color:var(--slate-500); text-transform:uppercase;">Submit</div>
                </div>
            </div>

            <!-- STEP 1: Basic Identity -->
            <div id="wizard-pane-1" class="wizard-pane active" style="animation: fadeIn 0.3s ease;">
                <div style="margin-bottom: 20px; padding: 12px; background: var(--slate-50); border-radius: 8px;">
                    <div style="font-weight: 700; color: var(--slate-700); font-size: 14px;">Step 1: Project Identity</div>
                    <div style="font-size: 11px; color: var(--slate-500);">Core details and staffing</div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Project Name</label>
                    <input type="text" id="proj_name" class="form-input" data-vrules="required|minLen:5|hasLetters" oninput="window.V?.checkField(this)" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" placeholder="e.g. M1 Karonga-Songwe Rehabilitation">
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Client Name</label>
                    <input type="text" id="proj_client" class="form-input" data-vrules="required|minLen:3|hasLetters" oninput="window.V?.checkField(this)" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" placeholder="e.g. Roads Authority (Malawi)">
                </div>

                <div style="margin-bottom: 16px;">
                    <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Allocated Budget (MWK)</label>
                    <input type="number" id="proj_budget" class="form-input" data-vrules="required|min:1" oninput="window.V?.checkField(this)" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px; font-family: 'JetBrains Mono'; font-weight:700;" placeholder="0.00">
                    <span style="font-size:11px; color:var(--slate-500); margin-top:4px; display:inline-block;"><i class="fas fa-info-circle"></i> For road works, the estimate must fit within this envelope.</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Start Date</label>
                        <input type="date" id="proj_start" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" min="${new Date().toISOString().split("T")[0]}">
                    </div>
                    <div>
                        <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">End Date</label>
                        <input type="date" id="proj_end" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" min="${new Date().toISOString().split("T")[0]}">
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Assign Field Supervisor</label>
                    <select id="proj_supervisor" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                        <option value="">Select Supervisor</option>
                    </select>
                </div>

                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label class="form-label v-req" style="margin-bottom: 0;">
                            <span>Geofence Radius (meters)</span>
                            <span id="proj_radius_val" style="color: var(--orange); font-weight: 700;">500m</span>
                        </label>
                    </div>
                    <input type="range" id="proj_radius_input" min="50" max="5000" step="50" value="500" style="width:100%; accent-color:var(--orange);" oninput="document.getElementById('proj_radius_val').innerText = this.value + 'm'; if(window.app.pmModule && window.app.pmModule.geofenceCircle) { window.app.pmModule.geofenceCircle.setRadius(this.value); }">
                    <div style="font-size: 10px; color: var(--slate-500); margin-top: 4px;">Site reporting is only allowed within this radius.</div>
                </div>
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Site Location (Click map to set)</label>
                    <div id="project-map" style="height: 180px; width: 100%; border-radius: 8px; border: 1px solid var(--slate-300); margin-bottom: 8px; background: var(--slate-100); position: relative; overflow: hidden; z-index: 1;">
                        <div class="map-loader" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: var(--slate-400); font-size: 12px; z-index: 0;">
                            <i class="fas fa-map-marked-alt"></i> Loading Map...
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div style="font-size: 11px; color: var(--slate-500);">Lat: <span id="proj_lat">-13.9626</span></div>
                        <div style="font-size: 11px; color: var(--slate-500);">Long: <span id="proj_lng">33.7741</span></div>
                    </div>
            </div>

            <div id="wizard-pane-2" class="wizard-pane" style="display:none; animation: fadeIn 0.3s ease;">
                <div style="background: var(--slate-100); padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; display: flex; gap: 12px; align-items: center;">
                    <i class="fas fa-road" style="color: var(--orange); font-size: 18px;"></i>
                    <div>
                        <div style="font-weight: 700; color: var(--slate-800); font-size: 13px;">RCMS Road Specification</div>
                        <div style="font-size: 11px; color: var(--slate-600);">Defines phase logic and base material calculations</div>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Road Class/Type</label>
                    <select id="road_type" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width:100%; padding:10px; font-weight:600; color:var(--slate-800);">
                        <option value="RT-1">RT-1 Earth (2-5 yrs design life)</option>
                        <option value="RT-2">RT-2 Gravel (5-10 yrs design life)</option>
                        <option value="RT-3">RT-3 Surface Dressed (10-15 yrs)</option>
                        <option value="RT-4" selected>RT-4 Asphalt (15-20 yrs)</option>
                        <option value="RT-5">RT-5 Concrete (30-50 yrs)</option>
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Total Length (km)</label>
                        <input type="number" id="road_length" class="form-input" data-vrules="required|min:0.1" oninput="window.V?.checkField(this)" style="width:100%; padding:10px; font-family: 'JetBrains Mono';" placeholder="e.g. 15.5" step="0.1">
                    </div>
                    <div>
                        <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Avg Width (m)</label>
                        <input type="number" id="road_width" class="form-input" data-vrules="required|min:1" oninput="window.V?.checkField(this)" style="width:100%; padding:10px; font-family: 'JetBrains Mono';" value="7.0" step="0.5">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Number of Lanes</label>
                        <select id="road_lanes" class="form-input" onchange="const m = (window.app.pmModule || window.app.fsModule); if(m && m.validateInline) m.validateInline(this.id)" style="width:100%; padding:10px;">
                            <option value="1">1 Lane (Single track)</option>
                            <option value="2" selected>2 Lanes (Standard)</option>
                            <option value="4">4 Lanes (Dual Carriageway)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Primary Terrain</label>
                        <select id="road_terrain" class="form-input" onchange="const m = (window.app.pmModule || window.app.fsModule); if(m && m.validateInline) m.validateInline(this.id)" style="width:100%; padding:10px;">
                            <option value="Flat">Flat</option>
                            <option value="Rolling">Rolling</option>
                            <option value="Hilly/Mountainous">Hilly/Mountainous</option>
                            <option value="Rocky">Rocky</option>
                            <option value="Swampy/Wetland">Swampy/Wetland</option>
                            <option value="Urban">Urban</option>
                        </select>
                        <div style="font-size:10px; color:var(--slate-500); margin-top:3px;">Affects earthworks multipliers</div>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Geographical Zone / District</label>
                    <input type="text" id="road_zone" class="form-input" data-vrules="required|minLen:3" oninput="window.V?.checkField(this)" style="width:100%; padding:10px;" placeholder="e.g. Northern Region - Mzimba">
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="form-label v-req" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Distance from Nearest Town (km)</label>
                    <input type="number" id="road_town_dist" class="form-input" data-vrules="required|min:0" oninput="window.V?.checkField(this)" style="width:100%; padding:10px;" placeholder="e.g. 25" value="10">
                    <div style="font-size:10px; color:var(--slate-500); margin-top:3px;">Affects accessibility / transport multipliers</div>
                </div>
            </div>

            <!-- STEP 3: Accessories Checklist -->
            <div id="wizard-pane-3" class="wizard-pane" style="display:none; animation: fadeIn 0.3s ease;">
                <div style="margin-bottom: 20px; padding: 12px; background: var(--slate-50); border-radius: 8px;">
                    <div style="font-weight: 700; color: var(--slate-700); font-size: 14px;">Step 3: Road Accessories & Safety</div>
                    <div style="font-size: 11px; color: var(--slate-500);">Select additional features required for this specification.</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                    <label style="border:1px solid var(--slate-200); padding:12px; border-radius:6px; background:white; cursor:pointer; display:flex; gap:10px; align-items:flex-start;">
                        <input type="checkbox" name="road_acc" value="markings" style="margin-top:3px; accent-color:var(--orange);">
                        <div>
                            <div style="font-size:12px; font-weight:700; color:var(--slate-800);">Road Markings</div>
                            <div style="font-size:10px; color:var(--slate-500);">Centrelines, edge lines, studs</div>
                        </div>
                    </label>
                    
                    <label style="border:1px solid var(--slate-200); padding:12px; border-radius:6px; background:white; cursor:pointer; display:flex; gap:10px; align-items:flex-start;">
                        <input type="checkbox" name="road_acc" value="signage" style="margin-top:3px; accent-color:var(--orange);">
                        <div>
                            <div style="font-size:12px; font-weight:700; color:var(--slate-800);">Signage</div>
                            <div style="font-size:10px; color:var(--slate-500);">Regulatory, warning, km markers</div>
                        </div>
                    </label>

                    <label style="border:1px solid var(--slate-200); padding:12px; border-radius:6px; background:white; cursor:pointer; display:flex; gap:10px; align-items:flex-start;">
                        <input type="checkbox" name="road_acc" value="guardrails" style="margin-top:3px; accent-color:var(--orange);">
                        <div>
                            <div style="font-size:12px; font-weight:700; color:var(--slate-800);">Safety Barriers</div>
                            <div style="font-size:10px; color:var(--slate-500);">W-beam guardrails for embankments</div>
                        </div>
                    </label>

                    <label style="border:1px solid var(--slate-200); padding:12px; border-radius:6px; background:white; cursor:pointer; display:flex; gap:10px; align-items:flex-start;">
                        <input type="checkbox" name="road_acc" value="pedestrian" style="margin-top:3px; accent-color:var(--orange);">
                        <div>
                            <div style="font-size:12px; font-weight:700; color:var(--slate-800);">Pedestrian / NMT</div>
                            <div style="font-size:10px; color:var(--slate-500);">Footpaths, raised crossings, kerbing</div>
                        </div>
                    </label>

                    <label style="border:1px solid var(--slate-200); padding:12px; border-radius:6px; background:white; cursor:pointer; display:flex; gap:10px; align-items:flex-start;">
                        <input type="checkbox" name="road_acc" value="transit" style="margin-top:3px; accent-color:var(--orange);">
                        <div>
                            <div style="font-size:12px; font-weight:700; color:var(--slate-800);">Transit Facilities</div>
                            <div style="font-size:10px; color:var(--slate-500);">Bus bays and passenger shelters</div>
                        </div>
                    </label>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:8px;">Street Lighting Option</label>
                    <select id="acc_lighting" class="form-input" style="width:100%; padding:10px;">
                        <option value="">None (No Lighting)</option>
                        <option value="lighting_solar">Solar Street Lights (Off-grid)</option>
                        <option value="lighting_poles">Standard Grid Poles (Single arm)</option>
                        <option value="lighting_mast">High-mast Towers (Junctions)</option>
                    </select>
                </div>
            </div>

            <!-- STEP 4: Budget Lock Receipt -->
            <div id="wizard-pane-4" class="wizard-pane" style="display:none; animation: fadeIn 0.3s ease;">
                <div id="budget_recon_banner" style="background: var(--red-light); padding: 12px; border-radius: 8px; border: 1px solid var(--red-hover); margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
                    <i id="budget_recon_icon" class="fas fa-lock" style="color: var(--red); font-size: 20px;"></i>
                    <div style="flex:1;">
                        <div id="budget_recon_title" style="font-weight: 700; color: var(--red-dark); font-size: 14px; display:flex; justify-content:space-between;">
                            <span>Budget Reconciliation</span>
                            <span id="budget_gap_indicator">MWK 0.00 Gap</span>
                        </div>
                        <div id="budget_recon_hint" style="font-size: 11px; color: var(--red);">Toggle items off if the estimate exceeds your allocated budget.</div>
                    </div>
                </div>

                <div style="background: var(--slate-50); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--slate-200); margin-bottom: 16px;">
                    <div style="font-size: 11px; color: var(--slate-500); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Allocated Budget (MWK)</div>
                    <input type="number" id="step4_budget" 
                        style="width: 100%; padding: 8px 12px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 14px;"
                        oninput="
                            const mainBudget = document.getElementById('proj_budget');
                            if (mainBudget) mainBudget.value = this.value;
                            (window.app.pmModule || window.app.fsModule || window.app.caModule).checkBudgetReconciliation();
                            (window.app.pmModule || window.app.fsModule || window.app.caModule).saveWizardCache();
                        ">
                </div>

                <div id="estimation-loader" style="padding:40px; text-align:center; color:var(--slate-500); display:none;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:12px; color:var(--orange);"></i>
                    <div style="font-size:12px; font-weight:600; text-transform:uppercase;">Running Parametric Estimator...</div>
                </div>

                <div id="estimation-receipt-container">
                    <!-- Dynamic receipt table rendered here -->
                </div>
            </div>

            <!-- STEP 5: Final Summary & Submit -->
            <div id="wizard-pane-5" class="wizard-pane" style="display:none; animation: fadeIn 0.3s ease;">
                <div style="text-align:center; margin-bottom:24px;">
                    <div style="width:64px; height:64px; background:var(--emerald); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 16px;">
                        <i class="fas fa-check"></i>
                    </div>
                    <h3 style="font-size:18px; font-weight:700; color:var(--slate-900); margin-bottom:8px;">Ready to Dispatch</h3>
                    <p style="font-size:13px; color:var(--slate-500); max-width:280px; margin:0 auto;">An email brief will be sent to the Field Supervisor, Finance Director, and Equipment Coordinator.</p>
                </div>

                <div style="background:var(--slate-50); border:1px solid var(--slate-200); padding:16px; border-radius:8px; margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:12px; color:var(--slate-500);">Project</span>
                        <span id="summary_name" style="font-size:13px; font-weight:600; color:var(--slate-800);">---</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:12px; color:var(--slate-500);">Type</span>
                        <span id="summary_type" style="font-size:13px; font-weight:600; color:var(--slate-800); text-transform:capitalize;">---</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span style="font-size:12px; color:var(--slate-500);">Locked Budget</span>
                        <span id="summary_budget" style="font-size:14px; font-weight:700; color:var(--slate-900); font-family:'JetBrains Mono';">MWK 0.00</span>
                    </div>

                    <div id="project_document_container" style="border-top: 1px solid var(--slate-200); padding-top: 12px; margin-top: 4px;">
                        <label id="project_document_label" class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Attach Initial Document (Required) *</label>
                        <div id="project-drop-zone" onclick="document.getElementById('proj_document').click()" style="border: 2px dashed var(--slate-300); border-radius: 8px; padding: 16px; text-align: center; background: white; cursor: pointer;">
                             <i class="fas fa-file-upload" style="color: var(--slate-400); margin-bottom: 4px;"></i>
                             <div id="project-file-status" style="font-size: 11px; color: var(--slate-600); font-weight: 600;">Click to upload project charter/PDF (Max 25MB)</div>
                             <input type="file" id="proj_document" data-vrules="required" accept=".pdf" style="display: none;" onchange="if(this.files[0]) { const s = document.getElementById('project-file-status'); s.textContent = this.files[0].name; s.style.color = 'var(--emerald)'; }">
                        </div>
                    </div>
                </div>

                <div id="edit_justification_container" style="margin-bottom: 24px; display: none;">
                    <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Reason for Edit (Required for Audit) *</label>
                    <textarea id="edit_justification" class="form-input" style="width: 100%; padding: 12px; height: 80px;" placeholder="Briefly explain what you changed and why..."></textarea>
                </div>
            </div>

            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 24px; background: white; border-top: 1px solid var(--slate-200); display: flex; gap: 12px; justify-content: space-between; z-index: 10;">
                <button id="wizard-prev" class="btn btn-secondary" style="flex:1; display:none; justify-content:center;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleWizardNav(-1)">Back</button>
                <div style="flex:1;"></div>
                <button id="wizard-next" class="btn btn-primary" style="flex:2; justify-content:center; background:var(--orange); border-color:var(--orange);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleWizardNav(1)">Continue</button>
                <button id="wizard-submit" class="btn btn-primary" style="flex:2; display:none; justify-content:center; background:var(--emerald); border-color:var(--emerald);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleCreateProject()">Finalize & Create</button>
            </div>
        </div>
    `,

  siteLogVerification: (project, log) => {
    const escapeHTML = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    return `
        <div style="padding: 0 24px; border-bottom: 1px solid var(--slate-200); background: white;">
          <div class="tabs" style="margin-bottom: 0;">
            <div class="tab active" style="border-bottom-color: var(--orange);">Verify Log</div>
            <div class="tab">Attendance</div>
          </div>
        </div>

        <div class="drawer-section">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <div style="font-size:11px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Supervisor</div>
                    <div style="font-weight:600;">${escapeHTML(project?.manager?.name || "Site Supervisor")}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Date</div>
                    <div style="font-weight:600;">${log ? new Date(log.createdAt || log.date).toLocaleDateString() : "Today"}</div>
                </div>
            </div>

            <div id="verification-map" style="height: 180px; width: 100%; border-radius: 8px; border: 1px solid var(--slate-300); margin-bottom: 16px; background: var(--slate-100); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <div style="color: var(--slate-400); font-size: 11px;"><i class="fas fa-map-marked-alt"></i> Loading Verification Map...</div>
            </div>

            <div class="evidence-photo" style="width: 100%; height: 200px; background: var(--slate-200); border-radius: 8px; overflow: hidden; position: relative; margin-bottom: 16px; border: 1px solid var(--slate-300);">
                <img src="${log?.photoUrl || "public/images/hero-background.jpg"}" alt="Site Evidence" style="width: 100%; height: 100%; object-fit: cover; background: var(--slate-100);" onerror="this.src='public/images/hero-background.jpg'">
                <div class="geo-tag" style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 4px 8px; border-radius: 4px; font-family: 'JetBrains Mono'; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-map-marker-alt"></i> ${log?.gpsCoords || project?.location || "Sector 4"}
                </div>
            </div>

            <div style="font-size:13px; font-weight:700; color:var(--slate-900); margin-bottom:8px;">Narrative Report</div>
            <p style="font-size:13px; color:var(--slate-600); line-height:1.5; background:var(--slate-50); padding:12px; border-radius:6px;">
                "${log?.narrative || "No narrative provided for this log."}"
            </p>
        </div>

        <div class="drawer-section">
            <div style="font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:12px;">Resource Consumption</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div style="border:1px solid var(--slate-200); padding:10px; border-radius:6px;">
                    <div style="font-size:11px; color:var(--slate-500);">Materials Used</div>
                    <div style="font-weight:600;">${log?.materials || "None reported"}</div>
                </div>
                <div style="border:1px solid var(--slate-200); padding:10px; border-radius:6px;">
                    <div style="font-size:11px; color:var(--slate-500);">Attendance</div>
                    <div style="font-weight:600;">${log?.attendanceCount || log?.attendance || 0} Workers</div>
                </div>
            </div>
        </div>

        <div style="padding: 16px 24px; border-top: 1px solid var(--slate-200); background: white; display: flex; gap: 12px;">
          <button class="btn btn-secondary" style="flex: 1; border-color: var(--red); color: var(--red);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleRejectLog('${escapeHTML(log?.id)}', prompt('Reason for rejection:'))">Reject Log</button>
          <button class="btn btn-primary" style="flex: 1; background: var(--emerald);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleApproveLog('${escapeHTML(log?.id)}')">Approve & Update Gantt</button>
        </div>
    `;
  },

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
                        <input type="number" class="form-input" data-vrules="required|min:0" oninput="window.V?.checkField(this)" value="12">
                    </div>
                    <div>
                        <label style="font-size:11px; color:var(--slate-500);">Skilled / Trades</label>
                         <input type="number" class="form-input" data-vrules="required|min:0" oninput="window.V?.checkField(this)" value="2">
                    </div>
                 </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Work Completed Today</label>
                <textarea id="daily-narrative" data-vrules="required|minLen:10" oninput="window.V?.checkField(this)" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" rows="3" placeholder="Describe progress..."></textarea>
            </div>

            <!-- Financial Section -->
            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:16px;">
                <label class="form-label" style="color:var(--slate-700); font-weight:700;"><i class="fas fa-coins"></i> Daily Expense Log</label>
                
                <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Total Spent Today (MWK)</label>
                    <input type="number" class="form-input" data-vrules="min:0" oninput="window.V?.checkField(this)" placeholder="0.00">
                </div>

                <div class="form-group" style="margin-top:12px;">
                    <label class="form-label">Expense Category</label>
                    <select class="form-input" onchange="window.V?.checkField(this)">
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
                    <input type="text" class="form-input" oninput="window.V?.checkField(this)" placeholder="e.g. Paid 3 casuals, bought 200L diesel...">
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <label style="display:block; font-size:12px; font-weight:600;">Photo Evidence (Required)</label>
                    <span id="photo-counter-dailyReport" style="font-size:11px; color:var(--slate-500);"><span style="color:var(--red); font-weight:700;">0</span>/10 photos <span style="font-size:10px; color:var(--slate-400);">(min 3)</span></span>
                </div>
                <label id="photo-add-btn-dailyReport" onclick="return window.handleCameraClick(event, 'dailyReport')" style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 16px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; display: block; margin-bottom:8px;">
                    <i class="fas fa-camera" style="font-size: 18px; margin-bottom: 4px;"></i>
                    <div style="font-weight: 600; font-size: 11px;">Tap to Take Photo (max 10)</div>
                    <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="window.handlePhotoCapture(this, 'dailyReport')">
                </label>
                <div id="photo-preview-dailyReport" style="display:flex; gap:8px; flex-wrap:wrap; padding:4px 0;">
                    <div style="text-align:center; color:var(--slate-400); font-size:12px; padding:8px;">No photos yet. Tap the button above to capture.</div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%" onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} if (!window.validatePhotos('dailyReport')) return; window.drawer.close(); window.toast.show('Daily Log & Expenses Submitted', 'success')">Submit Daily Log</button>
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
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <label class="form-label" style="margin:0;">Photo Evidence (Location Verification)</label>
                    <span id="photo-counter-assetVerify" style="font-size:11px; color:var(--slate-500);"><span style="color:var(--red); font-weight:700;">0</span>/10 photos <span style="font-size:10px; color:var(--slate-400);">(min 3)</span></span>
                </div>
                <label id="photo-add-btn-assetVerify" onclick="return window.handleCameraClick(event, 'assetVerify')" style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 16px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; display: block; margin-bottom:8px;">
                    <i class="fas fa-camera" style="font-size: 18px; margin-bottom: 4px;"></i>
                    <div style="font-weight: 600; font-size: 11px;">Capture Asset at Location (max 10)</div>
                    <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="window.handlePhotoCapture(this, 'assetVerify')">
                </label>
                <div id="photo-preview-assetVerify" style="display:flex; gap:8px; flex-wrap:wrap; padding:4px 0;">
                    <div style="text-align:center; color:var(--slate-400); font-size:12px; padding:8px;">No photos yet. Tap the button above to capture.</div>
                </div>
            </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Condition Check</label>
                <div style="display:flex; gap:10px; margin-bottom:8px;">
                     <input type="checkbox" checked> <span style="font-size:13px;">Received in Good Order</span>
                </div>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="if (!window.validatePhotos('assetVerify')) return; window.drawer.close(); window.toast.show('Arrival Confirmed & Coordinator Notified', 'success')">Confirm Receipt</button>
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

            <div class="form-group" style="margin-bottom: 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <label class="form-label" style="margin:0;">Progress Photos</label>
                    <span id="photo-counter-taskUpdate" style="font-size:11px; color:var(--slate-500);"><span style="color:var(--red); font-weight:700;">0</span>/10 photos <span style="font-size:10px; color:var(--slate-400);">(min 3)</span></span>
                </div>
                <label id="photo-add-btn-taskUpdate" onclick="return window.handleCameraClick(event, 'taskUpdate')" style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 16px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; display: block; margin-bottom:8px;">
                    <i class="fas fa-camera" style="font-size: 18px; margin-bottom: 4px;"></i>
                    <div style="font-weight: 600; font-size: 11px;">Tap to Take Photo (max 10)</div>
                    <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="window.handlePhotoCapture(this, 'taskUpdate')">
                </label>
                <div id="photo-preview-taskUpdate" style="display:flex; gap:8px; flex-wrap:wrap; padding:4px 0;">
                    <div style="text-align:center; color:var(--slate-400); font-size:12px; padding:8px;">No photos yet. Tap the button above to capture.</div>
                </div>
            </div>
            
            <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="if (!window.validatePhotos('taskUpdate')) return; window.drawer.close(); window.toast.show('Task Progress Updated', 'success')">Update Progress</button>
        </div>
    `,

  dailyProgressLog: (taskId = null) => `
        <div class="drawer-section" style="padding-top: 12px;">
            <div class="hidden-desktop" style="width: 40px; height: 5px; background: var(--slate-300); border-radius: 10px; margin: 0 auto 20px;"></div>
            <input type="hidden" id="daily-log-task-id" value="${taskId || ""}" />
            <div style="background:var(--red-light); border:1px solid var(--red); color:var(--red-dark); padding:12px; border-radius:6px; margin-bottom:16px; font-weight:700; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-clock"></i> CRITICAL DEADLINE: 2 Days Remaining
                </div>
                <button class="btn btn-secondary" style="padding:4px 10px; font-size:11px; background:white; border: 1px solid var(--slate-300);" onclick="window.app.fsModule.viewLogHistory()">
                    <i class="fas fa-history"></i> History
                </button>
            </div>

            <!-- Workflow Wallet Card -->
            <div style="background:white; color:var(--slate-900); border: 1px solid var(--slate-200); padding:16px; border-radius:8px; margin-bottom:20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="font-size:11px; text-transform:uppercase; color:var(--slate-500); font-weight:700;">Project Wallet</div>
                <div style="font-size:24px; font-weight:800; margin:4px 0; color:var(--slate-900);">MWK <span id="wallet-balance">800,000</span></div>
                <div style="font-size:11px; color:var(--slate-500); font-weight: 500;">of MWK 5,000,000 Allocated</div>
                <div style="height:6px; background:var(--slate-100); margin-top:12px; border-radius:3px; overflow: hidden;">
                    <div style="width:16%; height:100%; background:var(--emerald);"></div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Narrative / Progress Log</label>
                 <textarea id="daily-narrative" class="form-input" data-vrules="required|minLen:5" rows="2" placeholder="Describe work done today... (e.g. Finished north section)"></textarea>
            </div>

            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <label class="form-label" style="color:var(--slate-700); font-weight:700; margin:0;"><i class="fas fa-coins"></i> Daily Expenses</label>
                    <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="window.addExpenseRow()"><i class="fas fa-plus"></i> Add Item</button>
                </div>
                
                <div id="expense-rows" style="display:flex; flex-direction:column; gap:8px;">
                    <!-- Rows will be injected here -->
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:12px; border-top:1px dashed var(--slate-300); font-weight:700;">
                    <span style="font-size:12px; color:var(--slate-600);">Total Expense:</span>
                    <span id="daily-total-expense" style="color:var(--orange); font-size:14px;">0 MWK</span>
                </div>
            </div>

             <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Progress Completion</label>
                <div style="display:flex; align-items:center; gap:12px;">
                    <input type="range" id="daily-progress-increment" class="form-input" style="flex:1;" min="0" max="100" value="45" oninput="this.nextElementSibling.innerText = this.value + '%'">
                    <span style="font-weight:700; font-size:14px; width:40px;">45%</span>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <label class="form-label" style="margin:0;">Progress Photos</label>
                    <span id="photo-counter-progressLog" style="font-size:11px; color:var(--slate-500);"><span style="color:var(--red); font-weight:700;">0</span>/10 photos <span style="font-size:10px; color:var(--slate-400);">(min 3)</span></span>
                </div>
                <label id="photo-add-btn-progressLog" onclick="return window.handleCameraClick(event, 'progressLog')" style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 16px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; display: block; margin-bottom:8px;">
                    <i class="fas fa-camera" style="font-size: 18px; margin-bottom: 4px;"></i>
                    <div style="font-weight: 600; font-size: 11px;">Tap to Take Photo (max 10)</div>
                    <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="window.handlePhotoCapture(this, 'progressLog')">
                </label>
                <div id="photo-preview-progressLog" style="display:flex; gap:8px; flex-wrap:wrap; padding:4px 0;">
                    <div style="text-align:center; color:var(--slate-400); font-size:12px; padding:8px;">No photos yet. Tap the button above to capture.</div>
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

            <div id="machinery-usage-section" style="background: #F0F9FF; padding: 16px; border-radius: 8px; border: 1px solid #BAE6FD; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <label class="form-label" style="color: #0369A1; font-weight: 700; margin: 0;"><i class="fas fa-truck-monster"></i> Machinery Usage</label>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; background: white; border-color: #BAE6FD;" onclick="window.app.fsModule?.addMachineUsageRow()">
                        <i class="fas fa-plus"></i> Add Machine
                    </button>
                </div>
                <div id="machine-usage-rows" style="display: flex; flex-direction: column; gap: 12px;">
                    <!-- Machinery usage rows will be injected here -->
                    <div style="text-align: center; color: #64748B; font-size: 11px; padding: 8px;">No machinery usage logged today.</div>
                </div>
            </div>

            <button id="daily-log-submit-btn" class="btn btn-primary" style="width:100%; padding:14px; background:var(--emerald); border-color:var(--emerald);" onclick="window.app.fsModule?.submitDailyProgressLog(this)"><i class="fas fa-map-marker-alt"></i> Submit Update (Requires GPS)</button>
        </div>
    `,

  dailyProgressLogHistory: (logs = []) => `
        <div class="drawer-section" style="padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 800;">Log History</h3>
                <input type="date" id="history-date-picker" class="form-input" style="padding: 4px 8px; font-size: 13px;" onchange="window.app.fsModule.loadHistoricalLog(this.value)">
            </div>
            
            <div id="history-content-area">
                ${
                  logs.length === 0
                    ? `
                    <div style="text-align: center; padding: 40px 20px; color: var(--slate-400);">
                        <i class="fas fa-calendar-alt" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
                        <div>Select a date to view historical progress reports</div>
                    </div>
                `
                    : `
                    <div style="text-align: center; padding: 20px; color: var(--slate-500);">Loading historical data...</div>
                `
                }
            </div>
            
            <button class="btn btn-secondary" style="width: 100%; margin-top: 20px;" onclick="window.drawer.open('Daily Progress', window.DrawerTemplates.dailyProgressLog())">
                <i class="fas fa-arrow-left"></i> Back to Current Log
            </button>
        </div>
    `,

  logEquipmentUsage: `
         <div class="drawer-section">
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Task Description</label>
                <textarea class="form-input" data-vrules="required|minLen:5" rows="3" style="width:100%; padding:10px;" placeholder="What was the equipment used for?"></textarea>
             </div>
             <div class="grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                  <div class="form-group"><label class="form-label">Hours Operated</label><input type="number" class="form-input" data-vrules="required|min:0" style="width:100%; padding:10px;"></div>
                  <div class="form-group"><label class="form-label">Fuel (L)</label><input type="number" class="form-input" style="width:100%; padding:10px;"></div>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.drawer.close(); window.toast.show('Usage Logged', 'success')">Log Usage</button>
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
            <div style="margin-bottom: 16px;"><label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Description</label><textarea class="form-input" data-vrules="required|minLen:10" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" rows="3"></textarea></div>
            <div class="form-label">Evidence (Optional)</div>
            <label style="border: 2px dashed var(--slate-300); background: var(--slate-50); padding: 24px; text-align: center; border-radius: 8px; color: var(--slate-500); cursor: pointer; transition: 0.2s; margin-bottom: 16px; display: block;">
                <i class="fas fa-camera"></i> Capture Scene
                <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="window.toast.show('Evidence attached!', 'success')">
            </label>
            <button class="btn btn-primary" style="width:100%; background: var(--red); border-color: var(--red);" onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.drawer.close(); window.toast.show('Alert sent to HQ', 'error')">Submit Alert</button>
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

  editContract: (contract) => {
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return d.toISOString().split("T")[0];
    };

    return `
        <div style="padding: 24px;">
            <div style="margin-bottom: 24px; padding: 16px; background: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; display: flex; gap: 12px; align-items: center;">
                <div style="width: 48px; height: 48px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--orange); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <i class="fas fa-file-signature"></i>
                </div>
                <div>
                    <div style="font-weight: 800; color: #9a3412; font-size: 15px;">Contract Revision & Versioning</div>
                    <div style="font-size: 11px; color: var(--orange); font-weight: 600; text-transform: uppercase;">
                        Ref: ${contract.refCode || contract.code || "CNT-" + contract.id} | <span style="color: #9a3412;">Current: v${contract.versions && contract.versions.length > 0 ? contract.versions[0].versionNumber : "1"}</span>
                    </div>
                </div>
            </div>

            <!-- Metadata Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="form-group">
                     <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Contract Value (MWK)</label>
                     <input type="number" id="edit_contract_value" class="form-input" data-vrules="required|numeric|min:1" value="${contract.value || ""}" style="width:100%; padding:10px; border: 1px solid var(--slate-300); border-radius: 8px; font-family: 'JetBrains Mono'; font-weight: 700;">
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Contract Status</label>
                    <select id="edit_contract_status" class="form-input" style="width:100%; padding:10px; border: 1px solid var(--slate-300); border-radius: 8px; font-weight: 600;">
                        <option value="draft" ${contract.status === "draft" ? "selected" : ""}>Draft</option>
                        <option value="pending_approval" ${contract.status === "pending_approval" ? "selected" : ""}>Pending Approval</option>
                        <option value="active" ${contract.status === "active" ? "selected" : ""}>Active</option>
                        <option value="expired" ${contract.status === "expired" ? "selected" : ""}>Expired</option>
                        <option value="cancelled" ${contract.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                    </select>
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Schedule Timeline</label>
                    <button class="btn btn-sm" style="font-size: 10px; padding: 2px 8px; background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; font-weight: 700;" 
                        onclick="(window.app.pmModule || window.app.caModule)?.onProjectContractSelected('${contract.projectId}')">
                        <i class="fas fa-sync-alt"></i> Sync with Project
                    </button>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label style="font-size: 10px; color: var(--slate-400); margin-bottom: 4px; display: block;">Commencement</label>
                        <input type="date" id="edit_contract_start" class="form-input" data-vrules="required" min="${new Date().toISOString().split("T")[0]}" value="${formatDate(contract.startDate)}" style="width:100%; padding:10px; border-radius: 8px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 10px; color: var(--slate-400); margin-bottom: 4px; display: block;">Deadline</label>
                        <input type="date" id="edit_contract_end" class="form-input" data-vrules="required" min="${new Date().toISOString().split("T")[0]}" value="${formatDate(contract.endDate)}" style="width:100%; padding:10px; border-radius: 8px;">
                    </div>
                </div>
            </div>

            <div style="height: 1px; background: var(--slate-100); margin: 24px 0;"></div>

            <!-- Versioning Section -->
            <div style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Change Description / Variation Reason *</label>
                <textarea id="edit_contract_notes" class="form-input" data-vrules="required|minLen:10" oninput="window.V?.checkField(this)" rows="3" placeholder="Explain why these changes are being made and what is included in the new document version..." style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;"></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 32px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Upload Revised Document (Optional PDF)</label>
                <div id="v-drop-zone" style="border: 2px dashed var(--orange); border-radius: 12px; padding: 32px; text-align: center; background: #fffaf5; cursor: pointer;">
                    <i class="fas fa-cloud-arrow-up" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div id="v-file-status" style="font-size: 13px; font-weight: 700; color: #9a3412;">Drag new version here or browse</div>
                    <div style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">Leave empty to update metadata only</div>
                    <input type="file" id="v-file-input" accept=".pdf" style="display: none;">
                </div>
            </div>

            <div style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.drawer.close()">Cancel</button>
                <button class="btn btn-primary" style="flex: 2; justify-content: center; background: var(--orange); border-color: var(--orange); padding: 14px; font-weight: 800;" 
                    onclick="if(!window.V?.validateForm(this.closest('.drawer-content'))){ window.toast?.show('Please fix the errors in the form', 'error'); return; } (window.app.caModule || window.app.pmModule || window.app.fmModule)?.submitContractUpdate(${contract.id})">
                    <i class="fas fa-upload" style="margin-right: 8px;"></i> Commit Revision & Version
                </button>
            </div>
        </div>
        `;
  },

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

  uploadDocument: (projects = []) => `
        <div class="drawer-section">
            <div id="upload-doc-error" style="display:none; padding:12px; background:var(--red-light); color:var(--red); border-radius:6px; margin-bottom:16px; font-size:13px;"></div>
            
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Document Title</label>
                <input type="text" id="doc_title" class="form-input" data-vrules="required|minLen:3" style="width:100%; padding:10px;" placeholder="e.g. Environmental Impact Assessment">
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Document Type</label>
                <select id="doc_type" class="form-input" style="width:100%; padding:10px;">
                    <option value="general">General / Other</option>
                    <option value="vendor_quote">Vendor Quote</option>
                    <option value="contract">Formal Contract</option>
                    <option value="blueprint">Blueprint / Design</option>
                    <option value="insurance">Insurance / Bond</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Associated Project</label>
                <select id="doc_project_id" class="form-input" style="width:100%; padding:10px;">
                    <option value="">Select Project...</option>
                    ${projects.map((p) => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join("")}
                </select>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Description</label>
                <textarea id="doc_description" class="form-input" rows="2" style="width:100%; padding:10px;" placeholder="Brief details about this document..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Estimated Contract Value (MWK)</label>
                 <input type="number" id="doc_contract_value" class="form-input" style="width:100%; padding:10px; font-family: 'JetBrains Mono'; font-weight: 700;" placeholder="0.00">
            </div>

            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">Select File</label>
                <input type="file" id="doc_file" style="display:none;" onchange="document.getElementById('file-name-display').innerText = this.files[0]?.name || 'No file selected'">
                <div style="border:2px dashed var(--slate-300); padding:24px; text-align:center; border-radius:8px; background:var(--slate-50); color:var(--slate-500); cursor:pointer;" onclick="document.getElementById('doc_file').click()">
                    <i class="fas fa-cloud-arrow-up" style="font-size:28px; margin-bottom:8px; color:var(--slate-400);"></i>
                    <p id="file-name-display" style="margin:0; font-weight:500;">Click to select document file (PDF, Docx, etc.)</p>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px; font-weight:700;" onclick="window.app.caModule.handleUploadDocument()">Upload & Notify PM</button>
        </div>
    `,

  documentVersionHistory: (document) => `
        <div class="drawer-section">
            <div style="margin-bottom: 20px; padding: 12px; background: var(--blue-light); border-radius: 8px;">
                <div style="font-weight: 700; color: var(--blue); font-size: 14px;">Version History: ${document.title}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--slate-200); text-align: left;">
                        <th style="padding: 12px 8px;">Version</th>
                        <th style="padding: 12px 8px;">Date</th>
                        <th style="padding: 12px 8px;">Notes</th>
                        <th style="padding: 12px 8px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${(document.versions || [])
                      .map(
                        (v) => `
                        <tr style="border-bottom: 1px solid var(--slate-100);">
                            <td style="padding: 12px 8px; font-weight: 600;">v${v.versionNumber}</td>
                            <td style="padding: 12px 8px;">${new Date(v.createdAt).toLocaleDateString()}</td>
                            <td style="padding: 12px 8px; color: var(--slate-600); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.changeNotes || "-"}</td>
                            <td style="padding: 12px 8px;">
                                <div style="display:flex; gap:4px;">
                                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.viewDocument('${v.fileUrl}', '${document.title}_V${v.versionNumber}')" title="View in Professional Viewer"><i class="fas fa-eye"></i> View</button>
                                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.downloadDocument('${v.fileUrl}', '${document.title}_V${v.versionNumber}')" title="Download File"><i class="fas fa-download"></i></button>
                                </div>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `,

  contractViewer: (contract) => {
    const versions = contract.versions || [];
    const latestVersion =
      versions.length > 0 ? versions[versions.length - 1] : null;

    return `
        <div style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header -->
            <div style="padding: 28px 24px; background: linear-gradient(135deg, var(--orange-dark), var(--orange)); color: white; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -20px; top: -20px; font-size: 120px; opacity: 0.1; transform: rotate(-15deg);">
                    <i class="fas fa-file-contract"></i>
                </div>
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">${DrawerTemplates.escapeHTML(contract.type || "Standard Agreement")}</span>
                                <span style="font-size: 10px; opacity: 0.8; font-weight: 600;">v${contract.version || "1.0"}</span>
                            </div>
                            <div style="font-size: 22px; font-weight: 800; line-height: 1.2; max-width: 400px;">${DrawerTemplates.escapeHTML(contract.title || "Untitled Document")}</div>
                            <div style="font-size: 13px; opacity: 0.9; margin-top: 8px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-fingerprint" style="font-size: 11px;"></i> 
                                <span style="font-family: 'JetBrains Mono'; font-weight: 500;">${DrawerTemplates.escapeHTML(contract.code || "CNT-" + contract.id)}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div class="status active" style="background: var(--emerald); color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 6px;">
                                <div style="width: 6px; height: 6px; background: white; border-radius: 50%; box-shadow: 0 0 8px white;"></div>
                                ACTIVE
                            </div>
                            <div style="margin-top: 12px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase;">Expires</div>
                            <div style="font-size: 13px; font-weight: 600;">${contract.expiryDate ? new Date(contract.expiryDate).toLocaleDateString() : "Lifetime"}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Metadata Bar -->
            <div style="display: flex; padding: 12px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); gap: 24px;">
                <div>
                    <div style="font-size: 10px; color: var(--slate-400); text-transform: uppercase; font-weight: 700;">Party A</div>
                    <div style="font-size: 12px; font-weight: 600; color: var(--slate-700);">MCMS / Gov of Malawi</div>
                </div>
                <div style="width: 1px; background: var(--slate-200);"></div>
                <div>
                    <div style="font-size: 10px; color: var(--slate-400); text-transform: uppercase; font-weight: 700;">Contractor / Party B</div>
                    <div style="font-size: 12px; font-weight: 600; color: var(--slate-700);">${DrawerTemplates.escapeHTML(contract.contractor || "General Supplier")}</div>
                </div>
            </div>

            <!-- Content Area -->
            <div style="flex: 1; background: var(--slate-100); position: relative; min-height: 500px; display: flex; flex-direction: column;">
                <!-- Version History Panel -->
                <div style="background: white; border-bottom: 1px solid var(--slate-200); padding: 16px 24px;">
                    <h4 style="font-size: 11px; font-weight: 700; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; margin-top: 0;">Version History</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
                        ${
                          versions.length > 0
                            ? versions
                                .map(
                                  (v, idx) => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-100);">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400);">V${v.versionNumber || idx + 1}</div>
                                    <div>
                                        <div style="font-size: 12px; font-weight: 700; color: var(--slate-700);">${DrawerTemplates.escapeHTML(v.fileName || "Contract_Revision.pdf")}</div>
                                        <div style="font-size: 10px; color: var(--slate-400);">By ${DrawerTemplates.escapeHTML(v.createdBy?.name || v.createdByName || "System")} • ${new Date(v.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 4px;">
                                    <button class="btn btn-icon-sm" title="View" onclick="window.viewDocument('${v.fileUrl || v.documentUrl}', '${DrawerTemplates.escapeHTML(v.fileName || "Contract_Revision.pdf")}')" style="padding: 4px 8px; font-size: 11px;"><i class="fas fa-eye"></i> View</button>
                                    <button class="btn btn-icon-sm" title="Download" onclick="window.downloadDocument('${v.fileUrl || v.documentUrl}', '${DrawerTemplates.escapeHTML(v.fileName || "Contract_Revision.pdf")}')" style="padding: 4px 8px; font-size: 11px;"><i class="fas fa-download"></i></button>
                                </div>
                            </div>
                        `,
                                )
                                .reverse()
                                .join("")
                            : `
                            <div style="text-align: center; padding: 12px; color: var(--slate-400); font-size: 12px; background: var(--slate-50); border-radius: 8px; border: 1px dashed var(--slate-200);">
                                No prior versions tracked for this contract.
                            </div>
                        `
                        }
                    </div>
                </div>

                ${
                  contract.fileUrl
                    ? `
                    <div style="background: var(--slate-800); padding: 10px; display: flex; justify-content: center; gap: 20px;">
                        <div style="color: white; font-size: 11px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-shield-alt" style="color: var(--emerald);"></i> Digitally Verified
                        </div>
                        <div style="color: white; font-size: 11px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-lock" style="color: var(--orange);"></i> Encrypted Transmission
                        </div>
                    </div>
                    <iframe src="${contract.fileUrl}" style="flex: 1; width: 100%; border: none;"></iframe>
                `
                    : `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--slate-500); padding: 60px; text-align: center;">
                        <div style="position: relative; margin-bottom: 24px;">
                            <div style="width: 100px; height: 100px; background: var(--orange-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse-orange 2s infinite;">
                                <i class="fas fa-file-pdf" style="font-size: 42px; color: var(--orange);"></i>
                            </div>
                            <div style="position: absolute; bottom: 0; right: 0; width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); border: 1px solid var(--slate-200);">
                                <i class="fas fa-exclamation-triangle" style="font-size: 14px; color: var(--orange);"></i>
                            </div>
                        </div>
                        <div style="font-size: 18px; font-weight: 800; color: var(--slate-800);">No Digital Copy Found</div>
                        <div style="font-size: 13px; margin-top: 12px; max-width: 320px; line-height: 1.6;">This contract record is valid in the registry, but the physical document hasn't been uploaded yet.</div>
                        
                        <div style="margin-top: 32px; display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px;">
                            <button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange); justify-content: center; padding: 12px;" onclick="window.drawer.open('Upload Document', window.DrawerTemplates.newContract)">
                                <i class="fas fa-upload"></i> Upload Signed PDF
                            </button>
                            <button class="btn btn-secondary" style="justify-content: center; padding: 12px;" onclick="window.toast.show('Requesting document from registry...', 'info')">
                                <i class="fas fa-paper-plane"></i> Request from Archive
                            </button>
                        </div>
                    </div>
                `
                }
            </div>

            <!-- Footer Actions -->
            <div style="padding: 20px 24px; background: white; border-top: 1px solid var(--slate-200); display: flex; gap: 12px; align-items: center;">
                <button class="btn btn-secondary" style="padding: 12px 20px;" onclick="window.downloadDocument('${contract.fileUrl}', '${DrawerTemplates.escapeHTML(contract.fileName || "Contract_Latest.pdf")}')" ${!contract.fileUrl ? "disabled" : ""}>
                    <i class="fas fa-download"></i> Download PDF
                </button>
                <div style="flex: 1;"></div>
                <button class="btn btn-secondary" style="padding: 12px 20px;" onclick="window.drawer.close()">Cancel</button>
                <button class="btn btn-primary" style="background: var(--slate-900); border-color: var(--slate-900); padding: 12px 32px;" onclick="window.drawer.close()">
                    Close Viewer
                </button>
            </div>

            <style>
                @keyframes pulse-orange {
                    0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
                    70% { box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
                }
            </style>
        </div>
        </div>
    `;
  },

  uploadDocumentVersion: (document) => `
        <div class="drawer-section">
            <div id="upload-ver-error" style="display:none; padding:12px; background:var(--red-light); color:var(--red); border-radius:6px; margin-bottom:16px; font-size:13px;"></div>
            
            <div style="margin-bottom: 20px; padding: 12px; background: var(--blue-light); border-radius: 8px;">
                <div style="font-weight: 700; color: var(--blue); font-size: 14px;">Updating: ${document.title}</div>
                <div style="font-size: 11px; color: var(--blue-hover);">Current Version: v${document.versions[0]?.versionNumber || 1}</div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Change Notes</label>
                <textarea id="ver_notes" class="form-input" rows="3" style="width:100%; padding:10px;" placeholder="What has changed in this version?"></textarea>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label">Select Updated File</label>
                <input type="file" id="ver_file" style="display:none;" onchange="document.getElementById('ver-file-name').innerText = this.files[0]?.name || 'No file selected'">
                <div style="border:2px dashed var(--slate-300); padding:24px; text-align:center; border-radius:8px; background:var(--slate-50); color:var(--slate-500); cursor:pointer;" onclick="document.getElementById('ver_file').click()">
                    <i class="fas fa-file-arrow-up" style="font-size:28px; margin-bottom:8px; color:var(--slate-400);"></i>
                    <p id="ver-file-name" style="margin:0; font-weight:500;">Select the new version file</p>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px; font-weight:700;" onclick="window.app.caModule.handleUploadVersion(${document.id})">Upload Version</button>
        </div>
    `,

  editDocument: (doc) => `
        <div class="drawer-section">
            <div id="edit-doc-error" style="display:none; padding:12px; background:var(--red-light); color:var(--red); border-radius:6px; margin-bottom:16px; font-size:13px;"></div>
            
            <div style="margin-bottom: 20px; padding: 12px; background: var(--blue-light); border-radius: 8px;">
                <div style="font-weight: 700; color: var(--blue); font-size: 14px;">Edit Document Details</div>
                <div style="font-size: 11px; color: var(--blue-hover);">${doc.title}</div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Document Title</label>
                <input type="text" id="edit_doc_title" class="form-input" value="${doc.title}" style="width:100%; padding:10px;">
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Description</label>
                <textarea id="edit_doc_description" class="form-input" rows="3" style="width:100%; padding:10px;">${doc.description || ""}</textarea>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                 <label class="form-label">Contract Value (MWK)</label>
                 <input type="number" id="edit_doc_contract_value" class="form-input" value="${doc.contractValue || ""}" style="width:100%; padding:10px; font-family: 'JetBrains Mono'; font-weight: 700;">
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px; font-weight:700;" onclick="window.app.caModule.handleUpdateDocumentDetails(${doc.id})">Save Changes</button>
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
                <label class="form-label" style="display:block; font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:6px;">Assign To Project</label>
                <select id="assign_project" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" onchange="window.app?.equipModule?.showRecommendedVehicles?.(this.value)">
                    <option value="civil_works" data-type="civil_works">CEN-01: Unilia Library Complex (Building)</option>
                    <option value="road_works" data-type="road_works">MZ-05: Mzimba Clinic Extension (Road)</option>
                    <option value="bridge_construction" data-type="bridge_construction">NOR-04: Mzuzu Bridge Repair (Bridge)</option>
                </select>
            </div>

            <!-- Recommended Vehicles Section -->
            <div id="recommended-vehicles" style="margin-bottom: 16px; padding: 12px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i class="fas fa-lightbulb" style="color: var(--blue);"></i>
                    <span style="font-size: 11px; font-weight: 700; color: var(--blue); text-transform: uppercase;">Recommended for this Project Type</span>
                </div>
                <div id="recommended-list" style="display: flex; flex-wrap: wrap; gap: 6px;">
                    <span style="background: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #BFDBFE;">Excavator</span>
                    <span style="background: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #BFDBFE;">Bulldozer</span>
                    <span style="background: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #BFDBFE;">Tower Crane</span>
                    <span style="background: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #BFDBFE;">Concrete Mixer</span>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" style="display:block; font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase; margin-bottom:6px;">Equipment ID/Name</label>
                <select id="assign_equipment" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;" onchange="window.app?.equipModule?.checkEquipmentConflict?.(this.value)">
                    <option value="EQP-045">(Available) EQP-045: Caterpillar 320D Excavator</option>
                    <option value="EQP-012">(Available) EQP-012: Tata Tipper 10T</option>
                    <option value="EQP-008">(Waitlist) EQP-008: Winget Concrete Mixer</option>
                </select>
            </div>

            <!-- Conflict Alert (hidden by default) -->
            <div id="equipment-conflict-alert" style="display: none; margin-bottom: 16px; padding: 12px; background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i class="fas fa-exclamation-triangle" style="color: var(--orange);"></i>
                    <span style="font-size: 12px; font-weight: 700; color: var(--orange);">Conflict Detected</span>
                </div>
                <div id="conflict-message" style="font-size: 12px; color: var(--slate-700); margin-bottom: 12px;">
                    This equipment is currently assigned to <strong>MZ-05 Mzimba Clinic</strong> until <strong>Feb 15, 2026</strong>.
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary" style="flex:1; padding:8px; font-size:11px;" onclick="window.app?.equipModule?.stallRequest?.()">
                        <i class="fas fa-pause"></i> Stall Request
                    </button>
                    <button class="btn btn-action" style="flex:1; padding:8px; font-size:11px;" onclick="window.app?.equipModule?.reassignEquipment?.()">
                        <i class="fas fa-exchange-alt"></i> Reassign Now
                    </button>
                </div>
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

  assetDetails: (asset) => {
    const escapeHTML = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    return `
        <div class="drawer-section">
            <div style="display: flex; gap: 16px; margin-bottom: 24px; align-items: center;">
                <div style="width: 80px; height: 80px; background: var(--slate-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: var(--slate-600); border: 1px solid var(--slate-200);">
                    <i class="fas fa-truck-front"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 800; color: var(--slate-900);">${escapeHTML(asset.name) || "Equipment Details"}</h3>
                    <div style="margin-top: 4px; display: flex; gap: 8px; align-items: center;">
                        <span class="project-id">${escapeHTML(asset.code || asset.id)}</span>
                        <span class="status active" style="font-size: 10px; padding: 2px 8px;">${escapeHTML(asset.status) || "Active"}</span>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size: 9px;">Engine Hours</div>
                    <div style="font-size: 14px; font-weight: 700; font-family: 'JetBrains Mono'; margin-top: 4px;">${asset.hours || "2,450"}h</div>
                </div>
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size: 9px;">Fuel Level</div>
                    <div style="font-size: 14px; font-weight: 700; color: var(--emerald); margin-top: 4px;">${asset.fuel || "85"}%</div>
                </div>
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size: 9px;">Utilization</div>
                    <div style="font-size: 14px; font-weight: 700; color: var(--blue); margin-top: 4px;">${asset.utilization || "92"}%</div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size:11px; font-weight:700; color:var(--slate-400); text-transform:uppercase; margin-bottom:10px; letter-spacing: 0.5px;">Fleet Information</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 11px; color: var(--slate-500);">Current Location</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">${asset.location || "HQ Storage"}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: var(--slate-500);">Assigned To</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">${asset.assignedTo || "Unassigned"}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size:11px; font-weight:700; color:var(--slate-400); text-transform:uppercase; margin-bottom:10px; letter-spacing: 0.5px;">Maintenance Health</label>
                <div style="padding: 12px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-200);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 11px; color: var(--slate-500);">Last Maintenance</div>
                            <div id="asset-last-maintenance" style="font-size: 13px; font-weight: 600; margin-top: 4px; color: var(--emerald);">${asset.lastMaintenance || "Dec 15, 2025"}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: var(--slate-500);">Next Service Due</div>
                            <div id="asset-next-service" style="font-size: 13px; font-weight: 600; margin-top: 4px; color: var(--orange);">50h remaining</div>
                        </div>
                    </div>
                    <div class="budget-bar-bg" style="height: 6px;"><div class="budget-bar-fill" style="width: 90%; background: var(--orange);"></div></div>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display:block; font-size:11px; font-weight:700; color:var(--slate-400); text-transform:uppercase; margin-bottom:10px; letter-spacing: 0.5px;">Maintenance History</label>
                <div id="asset-maintenance-history" style="font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--slate-100);">
                        <div><span style="font-weight: 600;">500 Hour Service</span> <span class="status active" style="font-size: 9px; padding: 1px 6px;">Preventive</span></div>
                        <div style="color: var(--slate-500);">Dec 15, 2025 • MWK 1.2M</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--slate-100);">
                        <div><span style="font-weight: 600;">Oil & Filter Change</span> <span class="status active" style="font-size: 9px; padding: 1px 6px;">Preventive</span></div>
                        <div style="color: var(--slate-500);">Oct 02, 2025 • MWK 450K</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                        <div><span style="font-weight: 600;">Hydraulic Hose Repair</span> <span class="status pending" style="font-size: 9px; padding: 1px 6px;">Corrective</span></div>
                        <div style="color: var(--slate-500);">Aug 18, 2025 • MWK 890K</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex:1; padding: 12px;" onclick="window.drawer.open('Maintenance Log', window.DrawerTemplates.completeMaintenance)">Log Maintenance</button>
                <button class="btn btn-secondary" style="flex:1; padding: 12px;">Full History</button>
            </div>
        </div>
    `;
  },

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

  // --- PROJECT MANAGEMENT TEMPLATES ---
  editProject: `
        <div class="drawer-section">
            <input type="hidden" id="edit_proj_id">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="edit_proj_name" class="form-input" style="width:100%; padding:10px;">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Client</label>
                <input type="text" id="edit_proj_client" class="form-input" style="width:100%; padding:10px;">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Status</label>
                <select id="edit_proj_status" class="form-input" style="width:100%; padding:10px;">
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Budget</label>
                <input type="number" id="edit_proj_budget" class="form-input" style="width:100%; padding:10px;">
            </div>
            <div class="grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                <div class="form-group"><label class="form-label">Start Date</label><input type="date" id="edit_proj_start" class="form-input" style="width:100%; padding:10px;"></div>
                <div class="form-group"><label class="form-label">End Date</label><input type="date" id="edit_proj_end" class="form-input" style="width:100%; padding:10px;"></div>
            </div>
            <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleUpdateProject()">Update Project</button>
        </div>
    `,

  suspendProject: `
        <div class="drawer-section">
            <input type="hidden" id="suspend_project_id">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="suspend_project_name" class="form-input" style="width:100%; padding:10px;" readonly>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                 <label class="form-label">Reason for Suspension</label>
                 <textarea id="suspend_project_reason" class="form-input" rows="4" style="width:100%; padding:10px;" placeholder="Detailed reason required..."></textarea>
            </div>
            <div style="background:var(--red-light); color:var(--red-dark); padding:12px; border-radius:6px; font-size:12px; margin-bottom:16px;">
                <i class="fas fa-exclamation-triangle"></i> This will halt all active workflows and notify stakeholders.
            </div>
            <button class="btn btn-primary" style="width:100%; background:var(--red); border-color:var(--red); padding:12px;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleSuspendProject()">Suspend Project</button>
        </div>
    `,

  userForm: `
        <div class="drawer-section">
            <input type="hidden" id="user_form_id">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Full Name</label>
                <input type="text" id="user_form_name" class="form-input" style="width:100%; padding:10px;" required>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Email Address</label>
                <input type="email" id="user_form_email" class="form-input" style="width:100%; padding:10px;" required>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Role</label>
                <select id="user_form_role" class="form-input" style="width:100%; padding:10px;" required>
                    <option value="">Select Role...</option>
                    <option value="Project_Manager">Project Manager</option>
                    <option value="Finance_Director">Finance Director</option>
                    <option value="Field_Supervisor">Field Supervisor</option>
                    <option value="Equipment_Coordinator">Equipment Coordinator</option>
                    <option value="Client_Viewer">Client Viewer</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Password</label>
                <input type="password" id="user_form_password" class="form-input" style="width:100%; padding:10px;" placeholder="Leave blank to keep current (update only)">
            </div>
             <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleSaveUser()">Save User</button>
        </div>
    `,

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

  suspendProject: `
        <div class="drawer-section">
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Project ID / Code</label>
                <input type="text" id="suspend_project_id" class="form-input" style="width:100%; padding:10px; background:var(--slate-50);" readonly>
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="suspend_project_name" class="form-input" style="width:100%; padding:10px; background:var(--slate-50);" readonly>
             </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label v-req">Reason for Suspension</label>
                <textarea id="suspend_project_reason" class="form-input" style="width:100%; padding:10px;" rows="4" placeholder="Enter reason (e.g. Funding frozen, Community issues)..."></textarea>
             </div>
             <button class="btn btn-primary" style="width:100%; padding:12px; background:var(--amber-dark); border-color:var(--amber-dark);" onclick="window.app.pmModule?.handleSuspendProject()">Suspend Project</button>
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
            <form id="newUserForm" onsubmit="event.preventDefault(); window.app.pmModule.handleCreateUser(new FormData(this))">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Full Name</label>
                    <input type="text" name="name" class="form-input" placeholder="e.g., John Doe" style="width: 100%;" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Role / Access Level</label>
                    <select name="role" class="form-input" style="width: 100%;" required>
                        <option value="">Select Role...</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Finance Director">Finance Director</option>
                        <option value="Field Supervisor">Field Supervisor</option>
                        <option value="Contract Administrator">Contract Administrator</option>
                        <option value="Equipment Coordinator">Equipment Coordinator</option>
                        <option value="Operations Manager">Operations Manager</option>
                        <option value="Managing Director">Managing Director</option>
                        <option value="System Technician">System Technician</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" class="form-input" placeholder="j.doe@mkaka.mw" style="width: 100%;" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" name="phone" class="form-input" placeholder="+265..." style="width: 100%;">
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Initial Password</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="password" name="password" class="form-input" placeholder="********" style="width: 100%;" required>
                        <button type="button" class="btn btn-secondary btn-generate-pass" style="white-space: nowrap;">Generate</button>
                    </div>
                </div>
                <div id="create-user-error" style="display: none; color: var(--red); font-size: 12px; margin-bottom: 16px; padding: 10px; background: var(--red-light); border-radius: 4px;"></div>
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;">Create User Account</button>
            </form>
        </div>
    `,

  editUser: `
        <div class="drawer-section">
            <form id="editUserForm" onsubmit="event.preventDefault(); window.app.pmModule.handleUpdateUser(new FormData(this))">
                <input type="hidden" name="id">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Full Name</label>
                    <input type="text" name="name" class="form-input" style="width: 100%;" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Role</label>
                    <select name="role" class="form-input" style="width: 100%;" required>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Finance Director">Finance Director</option>
                        <option value="Field Supervisor">Field Supervisor</option>
                        <option value="Contract Administrator">Contract Administrator</option>
                        <option value="Equipment Coordinator">Equipment Coordinator</option>
                        <option value="Operations Manager">Operations Manager</option>
                        <option value="Managing Director">Managing Director</option>
                        <option value="System Technician">System Technician</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" class="form-input" style="width: 100%;" required>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" name="phone" class="form-input" style="width: 100%;">
                </div>
                
                <div id="edit-user-error" style="display: none; color: var(--red); font-size: 12px; margin-bottom: 16px; padding: 10px; background: var(--red-light); border-radius: 4px;"></div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--slate-100);">
                    <label class="form-label">Reset Password</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="password" name="password" class="form-input" style="width: 100%;" placeholder="Leave blank to keep current">
                        <button type="button" class="btn btn-secondary btn-generate-pass" style="white-space: nowrap;" onclick="window.app.pmModule.generateTempPassword(null)">Generate</button>
                    </div>
                </div>

                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--slate-100); display: flex; flex-direction: column; gap: 12px;">
                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase;">Administrative Actions</div>
                    
                    <button type="button" id="btn-unlock-user" class="btn btn-secondary" style="width: 100%; justify-content: start; gap: 12px; display: none;" onclick="window.app.pmModule.unlockUser(this.closest('form').querySelector('[name=id]').value)">
                        <i class="fas fa-user-check" style="color: var(--emerald);"></i> Reactivate Account
                    </button>

                    <button type="button" id="btn-deactivate-user" class="btn btn-secondary" style="width: 100%; justify-content: start; gap: 12px; color: var(--red); border-color: var(--red-light);" onclick="window.app.pmModule.lockUser(this.closest('form').querySelector('[name=id]').value)">
                        <i class="fas fa-user-slash"></i> Deactivate Account
                    </button>
                    
                    <button type="button" class="btn btn-secondary" style="width: 100%; justify-content: start; gap: 12px; color: var(--red); border-color: var(--red-light);" onclick="window.app.pmModule.deleteUser(this.closest('form').querySelector('[name=id]').value)">
                        <i class="fas fa-trash-alt"></i> Permanently Purge User
                    </button>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 24px; padding: 12px;">Save Changes</button>
            </form>
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

  projectDetails: (project) => {
    const escapeHTML = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    return `
        <div class="drawer-section">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <div style="font-size: 20px; font-weight: 800; color: var(--slate-900);">${escapeHTML(project.name) || "Project Details"}</div>
                    <div style="font-size: 13px; color: var(--slate-500); font-family: 'JetBrains Mono';">${escapeHTML(project.code) || "PRJ-" + escapeHTML(project.id)}</div>
                </div>
                <span class="status active" style="padding: 6px 12px; border-radius: 6px; font-weight: 700; text-transform: uppercase;">${escapeHTML(project.status)?.toUpperCase() || "ACTIVE"}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; border: 1px solid var(--slate-100);">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Client</div>
                    <div style="font-weight: 600; color: var(--slate-800);">${escapeHTML(project.client) || "Government of Malawi"}</div>
                </div>
                <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; border: 1px solid var(--slate-100);">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Manager</div>
                    <div style="font-weight: 600; color: var(--slate-800);">${escapeHTML(project.manager?.name || project.managerName || "Unassigned")}</div>
                </div>
            </div>

            <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div class="stat-card" style="margin: 0;">
                    <div class="stat-label">Budget</div>
                    <div class="stat-value" style="font-size: 18px;">MWK ${project.budgetTotal ? (project.budgetTotal / 1000000).toFixed(1) + "M" : "0"}</div>
                </div>
                <div class="stat-card" style="margin: 0;">
                    <div class="stat-label">Progress</div>
                    <div class="stat-value" style="font-size: 18px; color: var(--orange);">${project.progress || 0}%</div>
                </div>
            </div>

            <div style="background: white; border: 1px solid var(--slate-200); border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <div style="padding: 12px 16px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); font-size: 12px; font-weight: 700; color: var(--slate-600); text-transform: uppercase;">
                    Schedule Timeline
                </div>
                <div style="padding: 16px; display: flex; justify-content: space-between;">
                    <div>
                        <div style="font-size: 11px; color: var(--slate-500); margin-bottom: 2px;">Start Date</div>
                        <div style="font-weight: 600;">${project.startDate || "Jan 10, 2024"}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; color: var(--slate-500); margin-bottom: 2px;">End Date</div>
                        <div style="font-weight: 600;">${project.endDate || "Dec 15, 2024"}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--slate-600); text-transform: uppercase; margin-bottom: 12px;">Health Metrics</div>
                 <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                      <div style="flex: 1; min-width: 100px; padding: 12px; border-radius: 8px; background: ${project.budgetUtilization > 100 ? "var(--red-light)" : "var(--emerald-light)"}; border: 1px solid ${project.budgetUtilization > 100 ? "var(--red-hover)" : "var(--emerald-hover)"};">
                         <div style="font-size: 10px; color: ${project.budgetUtilization > 100 ? "var(--red)" : "var(--emerald)"}; font-weight: 700;">BUDGET</div>
                         <div style="font-weight: 600; font-size: 13px;">${project.budgetUtilization > 100 ? "Overrun" : "Within Budget"}</div>
                      </div>
                      <div style="flex: 1; min-width: 100px; padding: 12px; border-radius: 8px; background: ${Number(project.procurementVariance || 0) >= 0 ? "var(--emerald-light)" : "var(--red-light)"}; border: 1px solid ${Number(project.procurementVariance || 0) >= 0 ? "var(--emerald-hover)" : "var(--red-hover)"};">
                         <div style="font-size: 10px; color: ${Number(project.procurementVariance || 0) >= 0 ? "var(--emerald)" : "var(--red)"}; font-weight: 700;">EFFICIENCY</div>
                         <div style="font-weight: 600; font-size: 13px;">${Number(project.procurementVariance || 0) >= 0 ? "Saving" : "Loss"}: MWK ${Math.abs(Number(project.procurementVariance || 0)).toLocaleString()}</div>
                      </div>
                      <div style="flex: 1; min-width: 100px; padding: 12px; border-radius: 8px; background: var(--blue-light); border: 1px solid var(--blue-hover);">
                         <div style="font-size: 10px; color: var(--blue); font-weight: 700;">SAFETY</div>
                         <div style="font-weight: 600; font-size: 13px;">100% Score</div>
                      </div>
                 </div>
            </div>

             <div style="font-size: 12px; font-weight: 700; color: var(--slate-600); text-transform: uppercase; margin-bottom: 12px;">Recent Updates</div>
             <div style="display: flex; flex-direction: column; gap: 12px;">
                 <div style="display: flex; gap: 10px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--orange); margin-top: 4px;"></div>
                    <div>
                        <div style="font-size: 13px; font-weight: 600;">Site Log Submitted</div>
                        <div style="font-size: 11px; color: var(--slate-500);">3 hours ago by Supervisor</div>
                    </div>
                 </div>
                 <div style="display: flex; gap: 10px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--emerald); margin-top: 4px;"></div>
                    <div>
                        <div style="font-size: 13px; font-weight: 600;">Project Review Completed</div>
                        <div style="font-size: 11px; color: var(--slate-500);">Yesterday by PM</div>
                    </div>
                 </div>
             </div>
        </div>
        <div style="padding: 24px; border-top: 1px solid var(--slate-200); background: var(--slate-50); display: flex; gap: 12px; border-radius: 0 0 12px 12px;">
            <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.drawer.close(); (window.app.pmModule || window.app.fsModule || window.app.caModule).currentView='gantt'; (window.app.pmModule || window.app.fsModule || window.app.caModule).render();">View Schedule</button>
            <button class="btn btn-primary" style="flex: 1; justify-content: center;" onclick="window.drawer.close(); (window.app.pmModule || window.app.fsModule || window.app.caModule).currentView='budget'; (window.app.pmModule || window.app.fsModule || window.app.caModule).render();">Financial Info</button>
        </div>
    `;
  },

  addTask: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Task Name</label>
                <input type="text" id="task-name" class="form-input" style="width:100%; padding:10px;" placeholder="e.g. Foundation Pouring">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Start Date</label>
                <input type="date" id="task-start" class="form-input" style="width:100%; padding:10px;">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">End Date</label>
                <input type="date" id="task-end" class="form-input" style="width:100%; padding:10px;">
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Assignee (Optional)</label>
                <select class="form-input" style="width:100%; padding:10px;">
                    <option>John Banda (Supervisor)</option>
                    <option>Davi Moyo (Foreman)</option>
                </select>
            </div>
             <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Dependencies (Optional)</label>
                <input type="text" id="task-dependencies" class="form-input" style="width:100%; padding:10px;" placeholder="e.g. T1, T2">
            </div>
            <button class="btn btn-primary" style="width:100%; padding:12px;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleAddTask()">Save Task</button>
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

            <div id="issue-project-selector" style="margin-bottom:20px; display:none;">
                <div class="form-group">
                    <label class="form-label" style="color:var(--red); font-weight:700;">
                        <span style="color:var(--red);">*</span> Select Project
                    </label>
                    <select id="issue-project" class="form-input" required style="border-color:var(--orange); border-width:2px;">
                        <option value="">-- Choose a Project --</option>
                    </select>
                    <span id="issue-project-error" style="color:var(--red); font-size:12px; display:none; margin-top:4px;">
                        <i class="fas fa-exclamation-triangle"></i> Project is required
                    </span>
                </div>
                <div id="issue-project-selected" style="background:var(--emerald-light); border:1px solid var(--emerald); padding:12px; border-radius:6px; margin-top:8px; display:none; color:var(--slate-700);">
                    <i class="fas fa-check-circle" style="color:var(--emerald); margin-right:8px;"></i>
                    <strong>Selected Project:</strong> <span id="issue-project-name">--</span>
                </div>
            </div>

            <div id="issue-no-project-warning" style="background:var(--amber-light); border:1px solid var(--amber); padding:12px; border-radius:6px; margin-bottom:16px; display:none; color:var(--slate-700);">
                <i class="fas fa-info-circle"></i> <strong>No project selected.</strong> Please choose a project from the dropdown above.
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label">Issue Category</label>
                    <select id="issue-category" class="form-input">
                        <option value="material">Material Shortage</option>
                        <option value="equipment">Equipment Failure</option>
                        <option value="safety">Safety Hazard</option>
                        <option value="labor">Labor Dispute</option>
                        <option value="weather">Weather Delay</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select id="issue-priority" class="form-input">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical / SOS</option>
                    </select>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Issue Description / Narrative <span style="color:var(--red);">*</span></label>
                <textarea id="issue-description" class="form-input" rows="4" placeholder="Provide details about the issue..." required></textarea>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label">Photo Evidence (Optional)</label>
                <div style="border:2px dashed var(--slate-300); padding:20px; text-align:center; border-radius:8px; color:var(--slate-500); background:var(--slate-50); cursor:pointer;" onclick="window.toast.show('Camera launched', 'info')">
                    <i class="fas fa-camera" style="font-size:24px; margin-bottom:8px;"></i>
                    <div style="font-weight:600; font-size:13px;">Snap or Upload photo for fs report for the current project their on and also internal only just for fs</div>
                </div>
            </div>

            <button class="btn btn-primary" id="btn-submit-issue" style="width:100%; padding:14px; font-weight:700;" onclick="window.app.handleIssueSubmit()">Submit Issue Report</button>

            <script>
                // Initialize project selector
                (function initIssueDrawer() {
                    const projectId = window.currentIssueProjectId;
                    const warningEl = document.getElementById('issue-no-project-warning');
                    const selectorEl = document.getElementById('issue-project-selector');
                    const projectSelect = document.getElementById('issue-project');
                    const projectSelectedEl = document.getElementById('issue-project-selected');
                    const projectNameEl = document.getElementById('issue-project-name');
                    const submitBtn = document.getElementById('btn-submit-issue');
                    
                    console.log('[Issue Init] currentIssueProjectId:', projectId, 'pmModule:', window.app?.pmModule);
                    
                    if (!projectId) {
                        // No project context - show selector and disable submit
                        console.log('[Issue Init] No project, showing selector');
                        if (selectorEl) selectorEl.style.display = 'block';
                        if (warningEl) warningEl.style.display = 'block';
                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.style.opacity = '0.5';
                            submitBtn.style.cursor = 'not-allowed';
                        }
                        
                        // Load and populate projects list
                        if (window.app?.pmModule?.allProjects) {
                            console.log('[Issue Init] Loading projects from pmModule:', (window.app.pmModule || window.app.fsModule || window.app.caModule).allProjects.length);
                            (window.app.pmModule || window.app.fsModule || window.app.caModule).allProjects.forEach(p => {
                                const option = document.createElement('option');
                                option.value = p.id;
                                option.textContent = p.code + ' - ' + p.name;
                                option.dataset.projectCode = p.code;
                                option.dataset.projectName = p.name;
                                projectSelect.appendChild(option);
                            });
                        } else if (window.app?.pmModule) {
                            // Try to load projects if available
                            console.log('[Issue Init] pmModule available but allProjects not loaded');
                            if (typeof (window.app.pmModule || window.app.fsModule || window.app.caModule).loadProjectsFromAPI === 'function') {
                                (window.app.pmModule || window.app.fsModule || window.app.caModule).loadProjectsFromAPI().then(() => {
                                    if ((window.app.pmModule || window.app.fsModule || window.app.caModule).allProjects) {
                                        projectSelect.innerHTML = '<option value="">-- Choose a Project --</option>';
                                        (window.app.pmModule || window.app.fsModule || window.app.caModule).allProjects.forEach(p => {
                                            const option = document.createElement('option');
                                            option.value = p.id;
                                            option.textContent = p.code + ' - ' + p.name;
                                            option.dataset.projectCode = p.code;
                                            option.dataset.projectName = p.name;
                                            projectSelect.appendChild(option);
                                        });
                                    }
                                });
                            }
                        }
                        
                        // Enable submit and show project name when project is selected
                        projectSelect.addEventListener('change', function() {
                            if (this.value) {
                                const selectedOption = this.options[this.selectedIndex];
                                const projectCode = selectedOption.dataset.projectCode;
                                const projectName = selectedOption.dataset.projectName;
                                
                                window.currentIssueProjectId = parseInt(this.value);
                                
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.style.opacity = '1';
                                    submitBtn.style.cursor = 'pointer';
                                }
                                if (warningEl) warningEl.style.display = 'none';
                                if (projectSelectedEl) projectSelectedEl.style.display = 'block';
                                if (projectNameEl) projectNameEl.textContent = projectCode + ' - ' + projectName;
                                
                                console.log('[Issue Init] Project selected:', {
                                    id: window.currentIssueProjectId,
                                    code: projectCode,
                                    name: projectName
                                });
                            } else {
                                window.currentIssueProjectId = null;
                                if (submitBtn) {
                                    submitBtn.disabled = true;
                                    submitBtn.style.opacity = '0.5';
                                    submitBtn.style.cursor = 'not-allowed';
                                }
                                if (warningEl) warningEl.style.display = 'block';
                                if (projectSelectedEl) projectSelectedEl.style.display = 'none';
                            }
                        });
                    } else {
                        // Project already provided - hide selector
                        console.log('[Issue Init] Project provided:', projectId);
                        if (selectorEl) selectorEl.style.display = 'none';
                        if (warningEl) warningEl.style.display = 'none';
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.style.opacity = '1';
                            submitBtn.style.cursor = 'pointer';
                        }
                    }
                })();
            </script>
        </div>
    `,

  complaintDetails: (issue) => `
        <div class="drawer-section">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px;">
                <div>
                    <div style="font-size:18px; font-weight:800; color:var(--slate-900);">Issue #${issue.id}</div>
                    <div style="font-size:12px; color:var(--slate-500); margin-top:4px;">Reported by ${issue.reporter?.name || "Site Manager"} • ${issue.createdAt ? new Date(issue.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recently"}</div>
                </div>
                <span class="status ${issue.status === "open" ? "pending" : "active"}" id="drawer_complaint_status" style="font-weight:700;">${issue.status.toUpperCase()}</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px;">
                <div style="background:var(--slate-50); padding:12px; border-radius:8px; border:1px solid var(--slate-100);">
                    <div class="stat-label" style="font-size:10px;">Category</div>
                    <div style="font-size:13px; font-weight:700; margin-top:4px;">${issue.category}</div>
                </div>
                <div style="background:var(--red-light); padding:12px; border-radius:8px; border:1px solid var(--red-hover);">
                    <div class="stat-label" style="font-size:10px; color:var(--red);">Priority</div>
                    <div style="font-size:13px; font-weight:700; color:var(--red); margin-top:4px;">${issue.priority.toUpperCase()}</div>
                </div>
            </div>

            <div style="margin-bottom:24px;">
                <label class="form-label" style="color:var(--slate-400);">Narrative</label>
                <p style="font-size:13px; line-height:1.6; color:var(--slate-700); background:var(--white); border:1px solid var(--slate-200); padding:16px; border-radius:8px;">
                    "${issue.description || "No description provided."}"
                </p>
            </div>

            ${(issue.status === 'open' || issue.status === 'investigating') ? `
            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:24px;">
                <label class="form-label" style="margin-bottom:12px; font-weight:700;">Resolution Management</label>

                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label" style="font-size:11px;">RESOLUTION STATUS</label>
                    <select id="resolution-status" class="form-input">
                        <option value="resolved">Mark Resolved</option>
                        <option value="in_progress">Set In Progress</option>
                        <option value="closed">Close (No Action)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" style="font-size:11px;">INTERNAL RESOLUTION NOTES</label>
                    <textarea id="resolution-notes" class="form-input" rows="3" placeholder="Document the steps taken to resolve this issue..."></textarea>
                </div>
            </div>
            ` : `
            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:24px;">
                <label class="form-label" style="margin-bottom:12px; font-weight:700;"><i class="fas fa-check-circle" style="color:var(--emerald);"></i> Resolution History</label>
                <div style="font-size:13px; color:var(--slate-700); line-height:1.6;">
                    ${issue.resolutionNotes || "This issue was closed with no specific notes recorded."}
                </div>
                ${issue.resolvedAt ? `<div style="font-size:11px; color:var(--slate-500); margin-top:12px;">Resolved on ${new Date(issue.resolvedAt).toLocaleString()}</div>` : ""}
            </div>
            `}

            <div style="border-top:1px solid var(--slate-200); padding-top:24px; display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex: 1; justify-content:center;" onclick="window.drawer.close()">Close</button>
                ${(issue.status === 'open' || issue.status === 'investigating') ? `
                <button class="btn btn-primary" style="flex: 1; justify-content:center; background:var(--emerald); border-color:var(--emerald);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleResolveIssue('${issue.id}')">Submit Resolution</button>
                ` : ""}
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

  reviewVehicleRequest: (request) => `
        <div class="drawer-section">
            <div style="background:var(--slate-50); padding:16px; border-radius:8px; border:1px solid var(--slate-200); margin-bottom:20px;">
                <div style="font-size:11px; font-weight:700; color:var(--slate-500); text-transform:uppercase;">Procurement Request #${request.id || "PROC-NEW"}</div>
                <div style="font-size:18px; font-weight:800; color:var(--slate-900); margin-top:4px;">${request.name || request.vehicle || "New Vehicle Request"}</div>
                <div style="font-size:14px; color:var(--slate-600); font-weight:600; margin-top:2px;">Requested by: ${request.user || "Supervisor"}</div>
            </div>

            <div style="margin-bottom:20px;">
                <label class="form-label" style="color:var(--slate-400);">Purpose / Justification</label>
                <p style="font-size:13px; color:var(--slate-700); line-height:1.5;">"${request.purpose || request.reason || "No justification provided."}"</p>
            </div>

            <div style="display:flex; gap:12px;">
                <button class="btn btn-danger" style="flex:1;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleReviewVehicle('${request.id}', 'rejected')">Reject Request</button>
                <button class="btn btn-primary" style="flex:2;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleReviewVehicle('${request.id}', 'approved')">Approve & Register</button>
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
                <label class="form-label">Vehicle Name / Model</label>
                <input type="text" id="vehicle-name" class="form-input" placeholder="e.g. Toyota Hilux 2024">
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                <div class="form-group">
                    <label class="form-label">Registration Plate</label>
                    <input type="text" id="vehicle-plate" class="form-input" placeholder="Registration Number">
                </div>
                <div class="form-group">
                    <label class="form-label">Vehicle Type</label>
                    <select id="vehicle-type" class="form-input">
                        <option value="truck">Truck / Tipper</option>
                        <option value="loader">Front Loader</option>
                        <option value="excavator">Excavator</option>
                        <option value="pickup">Pickup (4x4)</option>
                        <option value="sedan">Staff Sedan</option>
                    </select>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label">Upload Proof of Purchase / License</label>
                <div style="border:2px dashed var(--slate-300); border-radius:8px; padding:20px; text-align:center; color:var(--slate-500); cursor:pointer;">
                    <i class="fas fa-file-contract" style="font-size:24px; margin-bottom:8px;"></i>
                    <div style="font-size:12px;">Drag documents here</div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleAddVehicle()">Register Vehicle</button>
        </div>
    `,

  // --- SYSTEM TECHNICIAN / USER MANAGEMENT TEMPLATES ---
  newUser: `
        <div class="drawer-section">
            <div id="create-user-error" style="display:none; padding:12px; background:var(--red-light); color:var(--red); border-radius:6px; margin-bottom:16px; font-size:13px;"></div>
            <form id="newUserForm" onsubmit="event.preventDefault(); (window.techModule || window.app.pmModule)?.handleCreateUser(new FormData(this));">
                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">Full Name</label>
                    <input type="text" name="name" class="form-input" placeholder="e.g. John Doe" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" class="form-input" placeholder="john@mkaka.mw" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">Phone Number</label>
                    <input type="text" name="phone" class="form-input" placeholder="+265..." style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">System Role</label>
                    <select name="role" class="form-input" required style="width:100%;">
                        <option value="Project_Manager">Project Manager</option>
                        <option value="Finance_Director">Finance Director</option>
                        <option value="Operations_Manager">Operations Manager</option>
                        <option value="Field_Supervisor">Field Supervisor</option>
                        <option value="Contract_Administrator">Contract Administrator</option>
                        <option value="Equipment_Coordinator">Equipment Coordinator</option>
                        <option value="Managing_Director">Managing Director</option>
                        <option value="System_Technician">System Technician</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:24px;">
                    <label class="form-label">Initial Password</label>
                    <div style="display:flex; gap:8px;">
                        <input type="password" name="password" id="new-user-password" class="form-input" placeholder="Min 8 chars..." required style="flex:1;">
                        <button type="button" class="btn btn-secondary btn-generate-pass" style="padding:0 12px;" title="Generate secure password" onclick="(window.techModule || window.app.pmModule)?.generateTempPassword('new-user-password')"><i class="fas fa-key"></i></button>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px;">Create User Account</button>
            </form>
        </div>
    `,

  editUser: `
        <div class="drawer-section">
            <div id="edit-user-error" style="display:none; padding:12px; background:var(--red-light); color:var(--red); border-radius:6px; margin-bottom:16px; font-size:13px;"></div>
            <form id="editUserForm" onsubmit="event.preventDefault(); (window.techModule || window.app.pmModule)?.handleUpdateUser(new FormData(this));">
                <input type="hidden" name="id" id="edit-user-id">
                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">Full Name</label>
                    <input type="text" name="name" id="edit-user-name" class="form-input" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" id="edit-user-email" class="form-input" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">System Role</label>
                    <select name="role" id="edit-user-role" class="form-input" required style="width:100%;">
                        <option value="Project_Manager">Project Manager</option>
                        <option value="Finance_Director">Finance Director</option>
                        <option value="Operations_Manager">Operations Manager</option>
                        <option value="Field_Supervisor">Field Supervisor</option>
                        <option value="Contract_Administrator">Contract Administrator</option>
                        <option value="Equipment_Coordinator">Equipment Coordinator</option>
                        <option value="Managing_Director">Managing Director</option>
                        <option value="System_Technician">System Technician</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Password Reset</label>
                    <div style="display:flex; gap:8px;">
                        <input type="password" name="password" id="edit-user-password" class="form-input" placeholder="Enter new password to reset" style="flex:1;">
                        <button type="button" class="btn btn-secondary btn-generate-pass" style="padding:0 12px;" title="Generate secure password" onclick="(window.techModule || window.app.pmModule)?.generateTempPassword('edit-user-password')">
                            <i class="fas fa-key"></i>
                        </button>
                    </div>
                    <p style="font-size: 11px; color: var(--slate-500); margin-top: 4px;">Leave blank to keep the current password.</p>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; margin-bottom: 24px;">Update User Details</button>

                <div style="border-top: 1px solid var(--slate-200); padding-top: 24px;">
                    <label class="form-label" style="color: var(--slate-500); font-size: 11px; margin-bottom: 12px;">ACCOUNT SECURITY & STATUS</label>
                    <div id="edit-user-status-actions" style="display: flex; flex-direction: column; gap: 8px;">
                        <button type="button" id="btn-deactivate-user" class="btn btn-secondary" style="color: var(--red); border-color: var(--red-light); justify-content: center;" onclick="(window.techModule || window.app.pmModule)?.lockUser(document.getElementById('edit-user-id').value)">Deactivate Account</button>
                        <button type="button" id="btn-unlock-user" class="btn btn-secondary" style="color: var(--emerald); border-color: var(--emerald-light); justify-content: center; display: none;" onclick="(window.techModule || window.app.pmModule)?.unlockUser(document.getElementById('edit-user-id').value)">Unlock & Reactivate</button>
                        <button type="button" id="btn-delete-user-drawer" class="btn btn-secondary" style="color: var(--red); border-color: var(--red-light); justify-content: center; margin-top: 8px; background: var(--red-light); font-weight: 700;" onclick="(window.techModule || window.app.pmModule)?.deleteUser(document.getElementById('edit-user-id').value)">Delete Account Permanently</button>
                    </div>
                </div>
            </form>
        </div>
    `,

  editVAT: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">Current VAT Rate (%)</label>
                <input type="number" class="form-input" value="16.5" step="0.5" style="width:100%;">
                <p style="font-size:11px; color:var(--slate-500); margin-top:4px;">Applies to all new invoices and procurement orders.</p>
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="window.toast.show('VAT Rate Updated', 'success'); window.drawer.close();">Save Changes</button>
        </div>
    `,

  editCurrency: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">System Primary Currency</label>
                <select class="form-input" style="width:100%;">
                    <option selected>Malawi Kwacha (MWK)</option>
                    <option>US Dollar (USD)</option>
                    <option>Euro (EUR)</option>
                </select>
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="window.toast.show('Currency Config Saved', 'success'); window.drawer.close();">Update Global Currency</button>
        </div>
    `,

  editCompany: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Company Name</label>
                <input type="text" class="form-input" value="Mkaka Construction Ltd" style="width:100%;">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">HQ Address</label>
                <textarea class="form-input" rows="3" style="width:100%;">Area 4, Lilongwe, Malawi</textarea>
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="window.toast.show('Company Details Updated', 'success'); window.drawer.close();">Save Profile</button>
        </div>
    `,

  editSMTP: `
        <div class="drawer-section">
            <div class="form-group" style="margin-bottom:12px;">
                <label class="form-label">SMTP Host</label>
                <input type="text" class="form-input" value="smtp.gmail.com" style="width:100%;">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
                <label class="form-label">SMTP Port</label>
                <input type="number" class="form-input" value="587" style="width:100%;">
            </div>
            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">SMTP Password (Encrypted)</label>
                <input type="password" class="form-input" value="********" style="width:100%;">
            </div>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="window.toast.show('SMTP Connection Tested & Saved', 'success'); window.drawer.close();">Test & Save</button>
        </div>
    `,

  suspendProject: `
        <div class="drawer-section">
            <input type="hidden" id="suspend_project_id">
            <div style="background:var(--orange-light); border:1px solid var(--orange); color:var(--orange-dark); padding:12px; border-radius:6px; margin-bottom:16px; font-size:13px;">
                <i class="fas fa-exclamation-triangle"></i> This will halt all activities. Project Manager will be notified.
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="suspend_project_name" class="form-input" style="width:100%; background:var(--slate-50);" readonly>
            </div>
            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">Reason for Suspension (Required)</label>
                <textarea id="suspend_project_reason" class="form-input" rows="4" style="width:100%;" placeholder="e.g. Budget overflow, safety violation, client request..."></textarea>
            </div>
            <button class="btn btn-secondary" style="width:100%; justify-content:center; color:var(--orange); border-color:var(--orange);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleSuspendProject()">Confirm Suspension</button>
        </div>
    `,

  editProject: `
        <div class="drawer-section" style="padding: 24px;">
            <input type="hidden" id="edit_proj_id">
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="edit_proj_name" class="form-input" style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Client / Agency</label>
                <input type="text" id="edit_proj_client" class="form-input" style="width: 100%;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="form-group">
                    <label class="form-label">Budget (MWK)</label>
                    <input type="number" id="edit_proj_budget" class="form-input" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select id="edit_proj_status" class="form-input" style="width: 100%;">
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" id="edit_proj_start" class="form-input" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">Target Completion</label>
                    <input type="date" id="edit_proj_end" class="form-input" style="width: 100%;">
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Designated Supervisor</label>
                <select id="edit_proj_supervisor" class="form-input" style="width: 100%;">
                    <option value="">Loading supervisors...</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Site Location (Geofence)</label>
                <div id="edit-project-map" style="height: 200px; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--slate-200);"></div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--slate-500);">
                    <span>Lat: <span id="edit_proj_lat">--</span></span>
                    <span>Lng: <span id="edit_proj_lng">--</span></span>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleUpdateProject()">Update Project Master</button>
        </div>
    `,

  completeMaintenance: (assetId) => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Complete Maintenance: ${assetId}</h3>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Maintenance Performed</label>
                <textarea id="maint-summary" class="form-input" rows="3" style="width: 100%;" placeholder="Summary of work..."></textarea>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Cost (MWK)</label>
                <input type="number" id="maint-cost" class="form-input" style="width: 100%;" placeholder="0.00">
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleCompleteMaintenance('${assetId}')">Log Completion</button>
        </div>
    `,
  initiateBCR: `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Request Project Budget Uplift</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">This request will be sent to the Project Manager for final authorization.</p>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Project *</label>
                <select id="bcr_project" class="form-input" style="width: 100%;">
                    <option value="1">CEN-01 Unilia Library</option>
                    <option value="2">MZ-05 Mzimba Clinic</option>
                </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Current Balance (MWK)</label>
                <input type="text" class="form-input" value="16,000,000" disabled style="background: var(--slate-50);">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Required Uplift Amount (MWK) *</label>
                <input type="number" id="bcr_amount" class="form-input" style="width: 100%; font-family: 'JetBrains Mono'; font-weight: 700; color: var(--orange);" placeholder="0">
                <div style="font-size: 11px; margin-top: 4px; color: var(--slate-400);">Amount to add to current project budget</div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Justification / Reason *</label>
                <textarea id="bcr_reason" class="form-input" rows="4" style="width: 100%;" placeholder="e.g. Sharp increase in global Bitumen prices or Scope creep in foundation work..."></textarea>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--orange); border-color: var(--orange);" onclick="window.app.fmModule?.handleSubmitUplift()">
        </div>
    `,

  suspendProject: `
        <div class="drawer-section">
            <input type="hidden" id="suspend_project_id">
            <div style="background:var(--orange-light); border:1px solid var(--orange); color:var(--orange-dark); padding:12px; border-radius:6px; margin-bottom:16px; font-size:13px;">
                <i class="fas fa-exclamation-triangle"></i> This will halt all activities. Project Manager will be notified.
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="suspend_project_name" class="form-input" style="width:100%; background:var(--slate-50);" readonly>
            </div>
            <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">Reason for Suspension (Required)</label>
                <textarea id="suspend_project_reason" class="form-input" rows="4" style="width:100%;" placeholder="e.g. Budget overflow, safety violation, client request..."></textarea>
            </div>
            <button class="btn btn-secondary" style="width:100%; justify-content:center; color:var(--orange); border-color:var(--orange);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleSuspendProject()">Confirm Suspension</button>
        </div>
    `,

  editProject: `
        <div class="drawer-section" style="padding-bottom: 80px;">
            <input type="hidden" id="edit_proj_id">
            
            <div style="margin-bottom: 20px; padding: 12px; background: var(--slate-50); border-radius: 8px;">
                <div style="font-weight: 700; color: var(--slate-700); font-size: 14px;">Project Identity Revision</div>
                <div style="font-size: 11px; color: var(--slate-500);">Update core details and site staffing</div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Project Name</label>
                <input type="text" id="edit_proj_name" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Client Name</label>
                <input type="text" id="edit_proj_client" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Allocated Budget (MWK)</label>
                    <input type="number" id="edit_proj_budget" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px; font-family: 'JetBrains Mono'; font-weight:700;">
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Project Status</label>
                    <select id="edit_proj_status" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px; font-weight:600;">
                        <option value="planning">PLANNING</option>
                        <option value="active">ACTIVE</option>
                        <option value="on_hold">ON HOLD</option>
                        <option value="completed">COMPLETED</option>
                    </select>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Start Date</label>
                    <input type="date" id="edit_proj_start" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Target End Date</label>
                    <input type="date" id="edit_proj_end" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Assign Field Supervisor</label>
                <select id="edit_proj_supervisor" class="form-input" style="width:100%; padding:10px; border:1px solid var(--slate-300); border-radius:6px;">
                    <option value="">Loading supervisors...</option>
                </select>
            </div>

            <div style="margin-bottom: 16px;">
                <div style="margin-bottom: 12px;">
                    <label style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;">
                        <span>Geofence Radius (meters)</span>
                        <span id="edit_proj_radius_val">500m</span>
                    </label>
                    <input type="range" id="edit_proj_radius_input" min="50" max="5000" step="50" value="500" style="width:100%; accent-color:var(--orange);" oninput="document.getElementById('edit_proj_radius_val').innerText = this.value + 'm'; if(window.app.pmModule && window.app.pmModule.geofenceCircle) { window.app.pmModule.geofenceCircle.setRadius(this.value); }">
                </div>
                <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Site Location (Geofence)</label>
                <div id="edit-project-map" style="height: 180px; width: 100%; border-radius: 8px; border: 1px solid var(--slate-300); margin-bottom: 8px; background: var(--slate-100); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <div style="color: var(--slate-400); font-size: 12px;"><i class="fas fa-map-marked-alt"></i> Redrawing Map...</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="font-size: 11px; color: var(--slate-500);">Lat: <span id="edit_proj_lat">--</span></div>
                    <div style="font-size: 11px; color: var(--slate-500);">Long: <span id="edit_proj_lng">--</span></div>
                </div>
            </div>

            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 24px; background: white; border-top: 1px solid var(--slate-200); display: flex; gap: 12px; z-index: 10;">
                <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700; background: var(--orange); border-color: var(--orange);" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleUpdateProject()">Update Project Master</button>
            </div>
        </div>
    `,

  newContract: `
        <div style="padding: 24px;">
            <div style="margin-bottom: 20px; padding: 12px; background: var(--slate-50); border-radius: 8px;">
                <div style="font-weight: 700; color: var(--slate-700); font-size: 14px;">Create Vendor Contract</div>
                <div style="font-size: 11px; color: var(--slate-500);">Select a project, choose materials, and assign a vendor</div>
            </div>

            <!-- Step 1: Select Project -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project *</label>
                <select id="contract_project" required class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: inherit; font-size: 13px;"
                    onchange="(window.app.fmModule || window.app.pmModule)?.onContractProjectSelected(this.value)">
                    <option value="">Loading projects...</option>
                </select>
            </div>

            <!-- Step 2: Materials (dynamically populated) -->
            <div id="contract-materials-section" style="display: none; margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Select Materials for This Contract *</label>
                <div id="contract-materials-list" style="max-height: 250px; overflow-y: auto; border: 1px solid var(--slate-200); border-radius: 8px; padding: 8px;"></div>
                <div style="margin-top: 8px; font-size: 11px; color: var(--slate-400);">Check the materials this vendor will supply</div>
            </div>

            <!-- Vendor Selection (Combobox) -->
            <div class="form-group" style="margin-bottom: 20px; position: relative;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Vendor/Supplier Name *</label>
                <div style="position: relative;">
                    <input type="text" id="contract_vendor" required 
                        data-vrules="required|minLen:3|alphaNum|hasLetters" 
                        oninput="window.V?.checkField(this); (window.app.fmModule || window.app.pmModule)?.searchVendors(this.value)" 
                        onfocus="(window.app.fmModule || window.app.pmModule)?.searchVendors(this.value)" 
                        onblur="window.V?.checkField(this); setTimeout(() => { const el = document.getElementById('vendor_autocomplete_results'); if(el) el.style.display='none'; }, 200)"
                        class="form-input" autocomplete="off" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: inherit; font-size: 13px;" placeholder="Search or type new vendor name...">
                    <input type="hidden" id="contract_vendor_id" value="">
                    
                    <!-- Dropdown Results -->
                    <div id="vendor_autocomplete_results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid var(--slate-300); border-radius: 6px; margin-top: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; max-height: 250px; overflow-y: auto;">
                        <!-- Results injected here -->
                    </div>
                </div>
                <div style="font-size: 11px; margin-top: 4px; color: var(--slate-400);">Select existing or type to create a new vendor.</div>
            </div>

            <!-- Vendor Phone (for new or updating existing) -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Vendor Phone Number</label>
                <input type="text" id="contract_vendor_phone" 
                    data-vrules="phone" 
                    oninput="window.V?.checkField(this)"
                    class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: inherit; font-size: 13px;" placeholder="e.g. +265 99 123 4567">
            </div>

            <!-- Contract Title -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Contract Title *</label>
                <input type="text" id="contract_title" required 
                    data-vrules="required|minLen:5|hasLetters" 
                    oninput="window.V?.checkField(this)"
                    class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: inherit; font-size: 13px;" placeholder="e.g. Bitumen Supply Agreement">
            </div>
            <div id="contract-performance-row" style="margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div style="padding: 12px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Market Price</div>
                    <div id="total-market-value" style="font-size: 14px; font-weight: 800; color: var(--slate-900); font-family: 'JetBrains Mono'; margin-top: 4px;">MWK 0</div>
                </div>
                <div style="padding: 12px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Negotiated Price</div>
                    <div id="total-negotiated-value" style="font-size: 14px; font-weight: 800; color: var(--orange); font-family: 'JetBrains Mono'; margin-top: 4px;">MWK 0</div>
                </div>
                <div id="procurement-performance-badge" style="padding: 12px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Performance</div>
                    <div id="performance-status" style="font-size: 12px; font-weight: 800; margin-top: 4px;">-</div>
                </div>
            </div>

            <div id="contract-budget-status"></div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Agreed Contract Sum (MWK) *</label>
                <input type="number" id="contract_value" required 
                    data-vrules="required|numeric|min:1000" 
                    oninput="window.V?.checkField(this); (window.app.fmModule || window.app.pmModule)?.calculateContractValue(true)"
                    class="form-input" style="width: 100%; padding: 12px; border: 2px solid var(--orange-light); border-radius: 8px; font-family: 'JetBrains Mono'; font-size: 15px; font-weight: 800; color: var(--orange);" placeholder="0">
            </div>

            <!-- Dates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div>
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Start Date *</label>
                    <input type="date" id="contract_start" required 
                        min="${new Date().toISOString().split('T')[0]}"
                        data-vrules="required|date" 
                        onchange="window.V?.checkField(this)"
                        class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: inherit; font-size: 13px;">
                </div>
                <div>
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">End Date *</label>
                    <input type="date" id="contract_end" required 
                        min="${new Date().toISOString().split('T')[0]}"
                        data-vrules="required|date" 
                        onchange="window.V?.checkField(this)"
                        class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: inherit; font-size: 13px;">
                </div>
            </div>

            <!-- Justification -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Justification/Notes *</label>
                <textarea id="contract_justification" required 
                    data-vrules="required|minWords:5" 
                    oninput="window.V?.checkField(this)"
                    class="form-input" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 6px; font-family: inherit; font-size: 13px;" rows="2" placeholder="Explain why this contract is being established or modified..."></textarea>
            </div>
            
            <!-- Contract Document -->
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Contract Document (PDF/DOC) *</label>
                <div id="contract-drop-zone" style="border: 2px dashed var(--slate-300); border-radius: 8px; padding: 24px; text-align: center; color: var(--slate-400); background: var(--slate-50); cursor: pointer; transition: all 0.2s ease;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 8px; color: var(--slate-400);"></i>
                    <div id="contract-file-status" style="font-size: 12px; font-weight: 600;">Drag and drop file here or <span style="color: var(--orange);">browse</span></div>
                    <div style="font-size: 10px; margin-top: 4px;">PDF or Word documents (Max 10MB)</div>
                    <input type="file" id="contract_document" accept=".pdf,.doc,.docx" style="display: none;">
                </div>
            </div>

            <!-- Submit -->
            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; font-size: 14px; font-weight: 700; background-color: var(--orange); border-color: var(--orange);"
                onclick="if(!window.V?.validateForm(this.closest('.drawer-section')||this.parentElement)){return} (window.app.fmModule || window.app.pmModule)?.submitContract()">
                <i class="fas fa-file-contract" style="margin-right: 8px;"></i> Create Contract
            </button>
        </div>
    `,
  newProjectContract: `
        <div style="padding: 24px;">
            <div style="margin-bottom: 24px; padding: 16px; background: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-file-contract" style="color: var(--orange); font-size: 24px;"></i>
                <div>
                    <div style="font-weight: 800; color: #9a3412; font-size: 15px;">Project Master Agreement</div>
                    <div style="font-size: 11px; color: var(--orange);">Register the primary contract with the Client/Government</div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Linked Project *</label>
                <select id="contract_project" class="form-input" data-vrules="required" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;"
                    onchange="window.V?.checkField(this); console.log('[DEBUG] Project selected:', this.value); (window.app?.pmModule || window.app?.fmModule || window.fmModule || window.pmModule)?.onProjectContractSelected(this.value)">
                    <option value="">Select Target Project...</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Master Contract Title *</label>
                <input type="text" id="contract_title" class="form-input" data-vrules="required|minLen:5" oninput="window.V?.checkField(this)" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;" placeholder="e.g. M1 Karonga-Songwe Main Works Agreement">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Agreed Contract Sum (MWK) *</label>
                <input type="number" id="contract_value" class="form-input" data-vrules="required|min:1000" oninput="window.V?.checkField(this)" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px; font-family: 'JetBrains Mono'; font-weight: 700;" placeholder="0">
            </div>

            <!-- Dates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                <div>
                    <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Commencement Date</label>
                    <input type="date" id="contract_start" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;">
                </div>
                <div>
                    <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Completion Deadline</label>
                    <input type="date" id="contract_end" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;">
                </div>
            </div>

            <!-- Justification -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Justification/Notes *</label>
                <textarea id="contract_justification" class="form-input" data-vrules="required|minWords:3" oninput="window.V?.checkField(this)" style="width: 100%; padding: 10px; border: 1px solid var(--slate-300); border-radius: 8px;" rows="2" placeholder="Context for the master agreement..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 32px;">
                <label class="form-label v-req" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Signed Master Document *</label>
                <div id="contract-drop-zone" style="border: 2px dashed var(--orange); border-radius: 12px; padding: 32px; text-align: center; background: #fffaf5; cursor: pointer;">
                    <i class="fas fa-file-signature" style="font-size: 32px; color: var(--orange); margin-bottom: 12px;"></i>
                    <div id="contract-file-status" style="font-size: 13px; font-weight: 700; color: #9a3412;">Click to upload signed legal PDF</div>
                    <div style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">Max size 25MB • Secure Pipeline</div>
                    <input type="file" id="contract_document" accept=".pdf" style="display: none;">
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 16px; font-weight: 800; font-size: 15px; background: var(--orange); border-color: var(--orange);"
                onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} console.log('[DEBUG] Archive button clicked'); const mod = (window.app?.pmModule || window.app?.fmModule || window.fmModule || window.pmModule); console.log('[DEBUG] Handler Module:', mod ? 'Found' : 'NOT FOUND'); if(mod) { mod.submitProjectContract(); } else { window.toast.show('System Error: Contract handler not found', 'error'); }">
                <i class="fas fa-file-contract" style="margin-right: 8px;"></i> Archive Master Agreement
            </button>
        </div>
    `,

  newVendor: `
        <div style="padding: 24px;">
            <div style="margin-bottom: 24px; padding: 16px; background: var(--slate-50); border-radius: 12px; border: 1px solid var(--slate-200); display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-store" style="color: var(--slate-600); font-size: 24px;"></i>
                <div>
                    <div style="font-weight: 800; color: var(--slate-900); font-size: 15px;">Vendor Onboarding</div>
                    <div style="font-size: 11px; color: var(--slate-500);">Register a new supplier or service provider</div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Company Name *</label>
                <input type="text" id="vendor_name" class="form-input" data-vrules="required|minLen:3" oninput="window.V?.checkField(this)" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;" placeholder="e.g. Acme Construction Ltd.">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Service Category *</label>
                <select id="vendor_category" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;">
                    <option value="">Select Category...</option>
                    <option value="Materials">Materials & Supply</option>
                    <option value="Equipment">Heavy Equipment Rental</option>
                    <option value="Labor">Labor & Sub-contracting</option>
                    <option value="Consultancy">Consultancy & Engineering</option>
                    <option value="Logistics">Logistics & Transport</option>
                    <option value="Fuel">Fuel & Energy</option>
                    <option value="Others">Others</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Initial Risk Profile</label>
                <select id="vendor_risk" class="form-input" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;">
                    <option value="low">Low Risk (Trusted Partner)</option>
                    <option value="medium">Medium Risk (New Vendor)</option>
                    <option value="high">High Risk (Requires Monitoring)</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 32px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Internal Rating (1-5)</label>
                <input type="number" id="vendor_rating" class="form-input" min="1" max="5" step="0.5" value="5.0" style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px;" placeholder="5.0">
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 16px; font-weight: 800; font-size: 15px;"
                onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} window.app.fmModule?.submitVendor()">
                <i class="fas fa-plus" style="margin-right: 8px;"></i> Onboard Vendor
            </button>
        </div>
    `,

  completeMaintenance: (assetId) => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Complete Maintenance: ${assetId}</h3>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Maintenance Performed</label>
                <textarea id="maint-summary" class="form-input" rows="3" style="width: 100%;" placeholder="Summary of work..."></textarea>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Cost (MWK)</label>
                <input type="number" id="maint-cost" class="form-input" style="width: 100%;" placeholder="0.00">
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="(window.app.pmModule || window.app.fsModule || window.app.caModule).handleCompleteMaintenance('${assetId}')">Log Completion</button>
        </div>
    `,
  initiateBCR: (projects = [], selectedId = "") => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Request Project Budget Uplift</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">This request will be sent to the Project Manager for final authorization.</p>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Project *</label>
                <select id="bcr_project" class="form-input" style="width: 100%;">
                    ${
                      projects.length
                        ? projects
                            .map(
                              (p) => `
                        <option value="${p.id}" ${p.code === selectedId || String(p.id) === selectedId ? "selected" : ""}>${p.code}: ${p.name}</option>
                    `,
                            )
                            .join("")
                        : '<option value="">No projects available</option>'
                    }
                </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Requested Uplift Amount (MWK) *</label>
                <input type="number" id="bcr_amount" class="form-input" style="width: 100%; font-family: 'JetBrains Mono'; font-weight: 700; color: var(--orange);" placeholder="0">
                <div style="font-size: 11px; margin-top: 4px; color: var(--slate-400);">Amount to add to current project budget</div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Justification / Reason *</label>
                <textarea id="bcr_reason" class="form-input" rows="4" style="width: 100%;" placeholder="e.g. Sharp increase in global Bitumen prices..."></textarea>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--orange); border-color: var(--orange);" onclick="window.app.fmModule?.handleSubmitUplift()">
                Send Request to PM
            </button>
        </div>
    `,

  reportGenerator: `
        <div class="drawer-section">
            <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 8px; color: var(--slate-900);">Generate System Report</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">Select parameters to generate detailed project or financial intelligence.</p>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Report Type *</label>
                <select id="report_type" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px;">
                    <option value="pnl">Project Profitability (P&L)</option>
                    <option value="bva">Budget vs Actual (BvA) - Material Usage</option>
                    <option value="vendor">Vendor Compliance & Price Variance</option>
                    <option value="audit">Strategic Master Audit Log</option>
                    <option value="inventory">Fleet & Asset Utilization</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Project Context</label>
                <select id="report_project" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px;">
                    <option value="all">Global (All Projects)</option>
                    <option value="1">CEN-01 Unilia Library</option>
                    <option value="2">MZ-05 Mzimba Clinic</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div>
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Start Date</label>
                    <input type="date" id="report_start" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px;" value="2026-03-01">
                </div>
                <div>
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">End Date</label>
                    <input type="date" id="report_end" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px;" value="2026-03-31">
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Output Format</label>
                <div style="display: flex; gap: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                        <input type="radio" name="report_fmt" value="pdf" checked style="accent-color: var(--orange);"> <i class="fas fa-file-pdf" style="color: var(--red);"></i> PDF
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                        <input type="radio" name="report_fmt" value="xlsx" style="accent-color: var(--orange);"> <i class="fas fa-file-excel" style="color: var(--emerald);"></i> Excel
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                        <input type="radio" name="report_fmt" value="json" style="accent-color: var(--orange);"> <i class="fas fa-code" style="color: var(--blue);"></i> API Source
                    </label>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; height: 50px; font-size: 15px; font-weight: 800; background: var(--slate-900); border-color: var(--slate-900);" 
                onclick="window.app.fmModule?.handleGenerateReport()">
                <i class="fas fa-bolt" style="margin-right: 10px; color: var(--orange);"></i> Generate Detailed Intel
            </button>
        </div>
    `,
  materialDistribution: (item) => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Issue Material to Project</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">Confirming the "Burn" (distribution) of consumable resources from the central store.</p>

            <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--slate-200);">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Item to Issue</div>
                <div style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin-top: 4px;">${item.name}</div>
                <div style="font-size: 12px; color: var(--slate-500);">Available Stock: ${item.stock} ${item.unit}</div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Destination Project *</label>
                <select id="dist_project" class="form-input" style="width: 100%;">
                    <option value="1">CEN-01 Unilia Library</option>
                    <option value="2">MZ-05 Mzimba Clinic</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Quantity to Issue (${item.unit}) *</label>
                <input type="number" id="dist_qty" class="form-input" style="width: 100%; border-color: var(--blue);" value="10">
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Authorized By (Operator/FS Name)</label>
                <input type="text" id="dist_auth" class="form-input" style="width: 100%;" placeholder="e.g. Kondwani Jere">
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--blue); border-color: var(--blue);" onclick="window.app.ecModule?.handleIssueMaterial('${item.id}')">
                Complete Distribution
            </button>
        </div>
    `,
  forwardProcurement: (req) => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Forward to Finance (Stock-Out)</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">The current stock is insufficient. Forwarding this to the Finance Director (Stefan Mwale) for urgent procurement.</p>

            <div style="background: var(--red-light); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--red-border);">
                <div style="font-size: 11px; font-weight: 700; color: var(--red); text-transform: uppercase;">Missing Resource</div>
                <div style="font-size: 16px; font-weight: 800; color: var(--red); margin-top: 4px;">${req.item}</div>
                <div style="font-size: 12px; color: var(--red);">Requested Qty: ${req.qty} ${req.unit} | Current Stock: 0</div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Internal Note for Finance *</label>
                <textarea id="forward_note" class="form-input" data-vrules="required|minLen:10" oninput="window.V?.checkField(this)" rows="4" style="width: 100%;" placeholder="e.g. Critical stock-out. Local suppliers have stock, but we need FM approval for Purchase Order..."></textarea>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--orange); border-color: var(--orange);" onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} window.app.ecModule?.submitForwardToFinance('${req.id}')">
                Push to Finance Dashboard
            </button>
        </div>
    `,
  requestNewAsset: `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">New Asset Procurement Request</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">Requesting additional fleet or specialized equipment from Finance.</p>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Asset Category *</label>
                <select id="req_asset_type" class="form-input" style="width: 100%;">
                    <option value="Roller">Roller (Compaction)</option>
                    <option value="Grader">Grader (Leveling)</option>
                    <option value="Water Bowser">Water Bowser (Suppression)</option>
                    <option value="Tipper">Tipper Truck (Logistics)</option>
                    <option value="TLB">TLB (Excavation)</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Destination Project *</label>
                <select id="req_project" class="form-input" style="width: 100%;">
                    <option value="CEN-01">CEN-01 Unilia</option>
                    <option value="MZ-05">MZ-05 Mzimba</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Justification (Reason for Request) *</label>
                <textarea id="req_reason" class="form-input" data-vrules="required|minWords:3" oninput="window.V?.checkField(this)" rows="5" style="width: 100%; border-color: var(--blue-border);" placeholder="Explain why this additional asset is required for the project stage..."></textarea>
                <div style="font-size: 11px; margin-top: 4px; color: var(--slate-400);">Stefan (FM) will review this for budget allocation.</div>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--blue); border-color: var(--blue);" 
                onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} window.app.ecModule?.handleAssetProcurementRequest()">
                <i class="fas fa-file-invoice-dollar" style="margin-right: 8px;"></i> Send Request to Finance
            </button>
        </div>
    `,
  requestResourceFS: (projectData = {}) => `
        <div class="drawer-section" style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; background: rgba(255, 107, 0, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--orange); margin-right: 12px; font-size: 18px;">
                    <i class="fas fa-truck-loading"></i>
                </div>
                <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--slate-900); margin: 0;">Resource Requisition</h3>
                    <div style="font-size: 12px; color: var(--slate-500);">Add multiple items to your request</div>
                </div>
            </div>

            <div id="fs_req_message_area" style="margin-bottom: 16px; display: none;"></div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" style="color: var(--slate-700); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block;">1. Choose Category</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: var(--slate-50); padding: 4px; border-radius: 10px; border: 1px solid var(--slate-200);">
                    <button class="btn active" id="fs_btn_machinery" 
                        onclick="window.app.fsModule?.toggleRequestType('machinery', this)" 
                        style="padding: 10px; border-radius: 8px; border: none; font-weight: 700; font-size: 12px; transition: all 0.2s; background: var(--orange); color: white;">
                        <i class="fas fa-tractor" style="margin-right: 6px;"></i> Machinery
                    </button>
                    <button class="btn" id="fs_btn_materials" 
                        onclick="window.app.fsModule?.toggleRequestType('materials', this)" 
                        style="padding: 10px; border-radius: 8px; border: none; font-weight: 700; font-size: 12px; transition: all 0.2s; background: transparent; color: var(--slate-600);">
                        <i class="fas fa-boxes" style="margin-right: 6px;"></i> Materials
                    </button>
                </div>
            </div>

            <div id="fs_resource_selector_box" style="padding: 16px; background: var(--slate-50); border-radius: 12px; border: 1px dashed var(--slate-300); margin-bottom: 20px;">
                <div id="fs_machinery_req_view">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Equipment Model</label>
                    <select id="fs_mac_select" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px; border-color: var(--slate-200); background-color: white;">
                        ${
                          (projectData?.recommendedMachines || []).length > 0
                            ? (projectData.recommendedMachines || [])
                                .map(
                                  (m) => `
                            <option value="${m.model}" data-available="${m.available}" data-type="${m.type}">${m.available ? "(Available)" : "(Waitlist)"} ${m.type}: ${m.model}</option>
                        `,
                                )
                                .join("")
                            : `<option value="" disabled>No machinery mapped for ${projectData?.roadSpecification?.roadType || "RT-5"}</option>`
                        }
                    </select>
                    
                    <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
                        <div style="flex: 1;">
                            <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 4px; text-transform: uppercase;">Quantity</label>
                            <input type="number" id="fs_mac_qty" class="form-input" value="1" min="1" style="width: 100%; border-radius: 8px; padding: 8px;">
                        </div>
                        <button class="btn" onclick="window.app.fsModule?.addItemToRequisition('machinery')" style="margin-top: 20px; background: var(--slate-900); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 12px;">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                    </div>
                </div>

                <div id="fs_material_req_view" style="display: none;">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Material Type</label>
                    <select id="fs_mat_select" class="form-input" style="width: 100%; padding: 10px; border-radius: 8px; border-color: var(--slate-200); background-color: white;">
                        ${
                          (projectData?.recommendedMaterials || []).length > 0
                            ? (projectData.recommendedMaterials || [])
                                .map(
                                  (m) => `
                            <option value="${m.name}" data-unit="${m.unit}">${m.name} (${m.unit})</option>
                        `,
                                )
                                .join("")
                            : `<option value="" disabled>No materials mapped for ${projectData?.roadSpecification?.roadType || "RT-5"}</option>`
                        }
                    </select>

                    <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
                        <div style="flex: 1;">
                            <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 4px; text-transform: uppercase;">Amount</label>
                            <input type="number" id="fs_mat_qty" class="form-input" value="1" min="1" step="0.1" style="width: 100%; border-radius: 8px; padding: 8px;">
                        </div>
                        <button class="btn" onclick="window.app.fsModule?.addItemToRequisition('material')" style="margin-top: 20px; background: var(--slate-900); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 12px;">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                    </div>
                </div>
            </div>

            <div id="fs_requisition_items_list" style="margin-bottom: 24px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-700); margin-bottom: 12px; text-transform: uppercase; border-bottom: 2px solid var(--slate-100); padding-bottom: 8px;">Selected Items (0)</label>
                <div id="fs_items_container" style="display: flex; flex-direction: column; gap: 8px; min-height: 40px;">
                    <div style="text-align: center; padding: 12px; color: var(--slate-400); font-size: 12px; font-style: italic;">No items added yet.</div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 32px; padding: 16px; background: #FFF9F5; border-radius: 12px; border: 1px solid #FFE5D4;">
                <label class="form-label" style="color: var(--orange-dark); font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; display: block;">Overall Priority</label>
                <select id="fs_req_urgency" class="form-input" style="width: 100%; border: none; background: transparent; font-weight: 700; color: var(--slate-800);">
                    <option value="normal">Normal (Scheduled)</option>
                    <option value="urgent"> Urgent (Impacts Critical Path)</option>
                </select>
            </div>

            <button class="btn" style="width: 100%; padding: 16px; background: var(--orange); border: none; border-radius: 12px; color: white; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3); transition: transform 0.2s;" 
                onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'"
                onclick="window.app.fsModule?.handleSubmitRequisition()">
                <i class="fas fa-paper-plane" style="margin-right: 8px;"></i> Submit Requisition
            </button>
        </div>
    `,
  dispatchResource: (req) => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Dispatch Resources</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">Confirming stock availability and setting estimated delivery time.</p>
            
            <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--slate-200);">
                <div style="font-size: 12px; color: var(--slate-500); margin-bottom: 4px;">Items to Dispatch</div>
                <div style="font-weight: 700;">${req.items.map((i) => `${i.quantity} x ${i.itemName}`).join(", ")}</div>
            </div>

             <div class="form-group" id="eta_container" style="margin-bottom: 24px;">
                <label class="form-label">Estimated Arrival Time *</label>
                <input type="datetime-local" id="dispatch_eta" class="form-input" data-vrules="required" style="width: 100%;" 
                    min="${new Date().toISOString().slice(0, 16)}" onchange="window.V?.checkField(this); document.getElementById('eta_error').style.display='none'">
                <div id="eta_error" style="font-size: 11px; color: var(--red); margin-top: 4px; display: none; font-weight: 600;">⚠ Please set a valid future arrival time.</div>
                <div style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">Past dates are restricted.</div>
            </div>

            <div id="dispatch_impact_summary" style="margin-bottom: 24px; padding: 12px; border-radius: 8px; background: var(--slate-50); border: 1px dashed var(--slate-300); display: block;">
                <div style="font-size: 11px; color: var(--slate-400); text-align: center;">Calculating inventory impact...</div>
            </div>

            <button class="btn btn-primary" id="btn_authorize_dispatch" style="width: 100%; justify-content: center; background: var(--emerald); border-color: var(--emerald);" 
                onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} window.app.ecModule?.handleRequisitionDispatch('${req.id}')">
                <i class="fas fa-truck" style="margin-right: 8px;"></i> Authorize & Dispatch
            </button>
        </div>
    `,
  replenishRequest: (req) => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Replenishment Request (FD)</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">Stock is unavailable in yard. Requesting procurement approval from Finance Director.</p>
            
            <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--slate-200);">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Original Request</div>
                <div style="font-weight: 700; margin-bottom: 4px;">${req.reqCode || "REQ-" + req.id}</div>
                <div style="font-size: 13px; color: var(--slate-600);">${req.project?.name || "Project"}</div>
                <div style="font-size: 13px; margin-top: 8px; font-weight: 600;">${(req.items || []).map((i) => i.quantity + " x " + i.itemName).join(", ")}</div>
                <div style="font-size: 12px; color: var(--blue); font-weight: 800; margin-top: 8px;">Value: MWK ${Number(req.totalAmount || 0).toLocaleString()}</div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Justification *</label>
                <textarea id="replenish_reason" class="form-input" rows="4" style="width: 100%;" placeholder="e.g. Current yard stock exhausted. Required for critical paving phase."></textarea>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--slate-900); border-color: var(--slate-900);" 
                onclick="window.app.ecModule?.handleSubmitReplenishment('${req.id}')">
                <i class="fas fa-file-invoice-dollar" style="margin-right: 8px;"></i> Request FD Approval & Procurement
            </button>
        </div>
    `,
  logMaterialBurn: (item) => `
        <div class="drawer-section">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Log Material Consumption (Burn)</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">Recording use of project-owned inventory on site.</p>

            <div style="background: var(--slate-50); padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--slate-200);">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Resource</div>
                <div style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin-top: 4px;">${item.name}</div>
                <div style="font-size: 12px; color: var(--slate-500);">Current Site Stock: ${item.qty} ${item.unit}</div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Quantity Consumed (${item.unit}) *</label>
                <input type="number" id="burn_qty" class="form-input" data-vrules="required|min:1" style="width: 100%; border-color: var(--blue);" value="">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Road Layer / Activity</label>
                <select id="burn_layer" class="form-input" style="width: 100%;">
                    <option value="">Select layer...</option>
                    <option value="1">Sub-Base</option>
                    <option value="2">Base Course</option>
                    <option value="3">Wearing Course (Prime/Seal)</option>
                    <option value="4">Earthworks / Fill</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Estimated Progress Addition (%)</label>
                <input type="number" id="burn_progress" class="form-input" placeholder="e.g. 5" style="width: 100%;">
                <div style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">How much does this consumption add to the overall layer completion?</div>
            </div>


            <button class="btn btn-primary" style="width: 100%; justify-content: center; background: var(--slate-900); border-color: var(--slate-900);" 
                onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.app.fsModule?.handleExecuteBurn('${item.name}')">
                <i class="fas fa-fire" style="margin-right: 8px;"></i> Confirm Daily Burn
            </button>
        </div>
    `,

  extendProject: (project) => `
        <div style="padding: 24px;">
            <div style="background: var(--orange-light); padding: 16px; border-radius: 8px; border: 1px solid var(--orange); margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
                <i class="fas fa-calendar-plus" style="color: var(--orange); font-size: 20px;"></i>
                <div>
                    <div style="font-weight: 700; color: var(--orange-hover); font-size: 14px;">Extend Project Timeline</div>
                    <div style="font-size: 11px; color: var(--orange);">This will cascade to all tasks, contracts & notify stakeholders</div>
                </div>
            </div>

            <input type="hidden" id="extend_project_id" value="${project?.id || ""}">

            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Project</div>
                        <div style="font-weight: 700; color: var(--slate-800); font-size: 14px;">${project?.name || "---"}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Code</div>
                        <div style="font-weight: 600; color: var(--slate-600);">${project?.code || "---"}</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="form-group">
                    <label class="form-label" style="display:block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Current End Date</label>
                    <input type="date" id="extend_current_end" class="form-input" style="width: 100%; padding: 10px; background: var(--slate-50);" value="${project?.endDate ? project.endDate.split("T")[0] : ""}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display:block; font-size: 11px; font-weight: 700; color: var(--orange); margin-bottom: 6px; text-transform: uppercase;">New End Date</label>
                    <input type="date" id="extend_new_end" class="form-input" data-vrules="required|futureDate" style="width: 100%; padding: 10px; border-color: var(--orange);" min="${project?.endDate ? project.endDate.split("T")[0] : ""}">
                </div>
            </div>

            <div id="extend_preview" style="display: none; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #15803d;">
                <i class="fas fa-info-circle"></i> <span id="extend_preview_text"></span>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="display:block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Reason for Extension *</label>
                <textarea id="extend_reason" class="form-input" data-vrules="required|minLen:10" rows="3" style="width: 100%; padding: 10px;" placeholder="e.g. Weather delays, scope change, material shortages..."></textarea>
            </div>

            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px; margin-bottom: 24px; font-size: 12px; color: var(--slate-600);">
                <div style="font-weight: 700; margin-bottom: 6px;"><i class="fas fa-bell"></i> What happens:</div>
                <ul style="margin: 0; padding-left: 16px; line-height: 1.8;">
                    <li>Project end date updated to new date</li>
                    <li>All trailing tasks shifted proportionally</li>
                    <li>Associated contract end dates extended</li>
                    <li>Email notification sent to all project roles</li>
                    <li>Action logged to immutable audit trail</li>
                </ul>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700; background: var(--orange); border-color: var(--orange);" 
                onclick="if(!window.V.validateForm(this.closest('.drawer-content')||this.parentElement)){return}window.app.pmModule.handleExtendProject()">
                <i class="fas fa-calendar-plus" style="margin-right: 8px;"></i> Approve & Extend Timeline
            </button>
        </div>
    `,

  // ============================================================
  // GANTT PHASE EDITOR  (PM opens from Gantt toolbar)
  // ============================================================
  ganttPhaseEditor: `
        <div style="padding: 0;">
            <div style="padding: 16px 24px; border-bottom: 1px solid var(--slate-200); background: var(--slate-50); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--slate-900)">Edit Construction Phases</div>
                    <div style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">Adjust start/end dates for auto-generated phases. Changes cascade downstream.</div>
                </div>
                <i class="fas fa-construction" style="font-size: 22px; color: var(--orange);"></i>
            </div>

            <div id="phase-editor-loading" style="padding: 48px; text-align: center; color: var(--slate-400);">
                <i class="fas fa-spinner fa-spin" style="font-size: 28px; color: var(--orange); display: block; margin-bottom: 12px;"></i>
                Loading phases...
            </div>

            <div id="phase-editor-content" style="display: none;">
                <div style="padding: 12px 24px; background: #FEFCE8; border-bottom: 1px solid #FEF08A; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="phase-cascade-toggle" checked style="width: 16px; height: 16px; cursor: pointer;">
                        <label for="phase-cascade-toggle" style="font-size: 12px; font-weight: 700; color: #854D0E; cursor: pointer;">Auto-cascade shifts downstream</label>
                    </div>
                    <div style="font-size: 11px; color: #A16207; font-style: italic;">Recommended for delays</div>
                </div>
                <div id="phase-editor-list" style="padding: 16px 24px; max-height: 400px; overflow-y: auto;"></div>

                <div style="padding: 16px 24px; border-top: 1px solid var(--slate-200); background: var(--slate-50); display: flex; gap: 10px;">
                    <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.drawer.close()">Cancel</button>
                    <button class="btn btn-primary" style="flex: 2; justify-content: center; background: var(--orange); border-color: var(--orange);" onclick="window.app.pmModule.handlePhaseEditorSave()">
                        <i class="fas fa-save" style="margin-right: 8px;"></i>Save All Phase Dates
                    </button>
                </div>
            </div>
        </div>
    `,

  // ============================================================
  // REQUEST TIMELINE EXTENSION  (any role submits to PM)
  // ============================================================
  requestTimelineExtension: (projects = []) => `
        <div style="padding: 0;">
            <div style="padding: 16px 24px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-bottom: 4px solid var(--orange);">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 48px; height: 48px; background: var(--orange); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; flex-shrink: 0;">
                        <i class="fas fa-calendar-plus"></i>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 16px; color: var(--slate-900);">Request Timeline Extension</div>
                        <div style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">This request will be sent to the Project Manager for approval.</div>
                    </div>
                </div>
            </div>

            <div style="padding: 24px;">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 12px; font-weight: 700; color: var(--slate-700); margin-bottom: 6px; text-transform: uppercase;">Select Project <span style="color: var(--red);">*</span></label>
                    <select id="ext-req-project-id" class="form-input" style="width: 100%;" onchange="window.app.layout?.handleTimelineProjectChange(this.value, ${JSON.stringify(projects).replace(/"/g, "&quot;")})">
                        <option value="">Select a project...</option>
                        ${projects.map((p) => `<option value="${p.id}">${p.code} ${p.name}</option>`).join("")}
                    </select>
                </div>

                <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 4px;">Current Project End Date</div>
                    <div id="ext-req-current-end" style="font-size: 18px; font-weight: 700; color: var(--slate-900); font-family: 'JetBrains Mono';">--</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-700); margin-bottom: 6px; text-transform: uppercase;">Apply to Phase (Optional)</label>
                        <select id="ext-req-phase-id" class="form-input" style="width: 100%;" onchange="window.app.layout?.handleTimelinePhaseChange(this.value)">
                            <option value="">Full Project Timeline</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-700); margin-bottom: 6px; text-transform: uppercase;">Extension Days <span style="color: var(--red);">*</span></label>
                        <input type="number" id="ext-req-days-input" class="form-input" style="width: 100%;" min="1" placeholder="Days" oninput="window.app.layout?.calculateNewEndDate()">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 18px;">
                    <label style="display: block; font-size: 12px; font-weight: 700; color: var(--slate-700); margin-bottom: 6px; text-transform: uppercase;">Requested New End Date <span style="color: var(--red);">*</span></label>
                    <input type="date" id="ext-req-new-date" class="form-input" style="width: 100%; font-weight: 700; font-size: 15px; font-family: 'JetBrains Mono';" onchange="window.app.layout?.updateExtensionBadge()">
                    <div id="ext-req-days-badge" style="margin-top: 6px; font-size: 12px; color: var(--orange); font-weight: 700; display: none;">
                        <i class="fas fa-clock"></i> <span id="ext-req-days-text"></span>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="display: block; font-size: 12px; font-weight: 700; color: var(--slate-700); margin-bottom: 6px; text-transform: uppercase;">Justification <span style="color: var(--red);">*</span></label>
                    <textarea id="ext-req-justification" class="form-input" rows="5" style="width: 100%; resize: vertical; line-height: 1.6;" placeholder="Minimum 20 characters. Explain the reason for the extension clearly - e.g. weather delays, scope changes, design revisions..." oninput="window.app.layout?.updateCharCount(this.value)"></textarea>
                    <div id="ext-req-char-count" style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">0 / 20 min</div>
                </div>

                <div id="ext-req-warning" style="display: none; background: var(--red-light); border: 1px solid var(--red); color: var(--red-dark); padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 16px;"></div>

                <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 8px; margin-bottom: 24px; font-size: 12px; color: #0369a1;">
                    <div style="font-weight: 700; margin-bottom: 4px;"><i class="fas fa-info-circle"></i> Submission Impact:</div>
                    <div style="line-height: 1.5;">This will create a formal request for the Project Manager. If approved, all downstream milestones and vendor contracts will be adjusted accordingly.</div>
                </div>

                <button id="ext-req-submit-btn" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700; background: var(--orange); border-color: var(--orange);"
                    onclick="window.app.layout?.handleSubmitExtensionRequest()">
                    <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>Submit Extension Request
                </button>
            </div>
        </div>
    `,

  timelineExtensionReview: (req) => `
        <div style="padding: 0;">
            <div style="padding: 16px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--slate-900)">Review Timeline Extension</div>
                    <div style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">Requested by ${req.requestedBy?.name || req.requestedByName || "Supervisor"}</div>
                </div>
                <div class="status-badge" style="background: var(--orange-light); color: var(--orange); border: 1px solid var(--orange-border); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">PENDING</div>
            </div>

            <div style="padding: 24px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-100);">
                        <div style="font-size: 10px; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Current End Date</div>
                        <div style="font-size: 14px; font-weight: 700; color: var(--slate-700); margin-top: 4px;">${new Date(req.currentEndDate).toLocaleDateString()}</div>
                    </div>
                    <div style="background: var(--orange-light); padding: 12px; border-radius: 8px; border: 1px solid var(--orange-border);">
                        <div style="font-size: 10px; color: var(--orange); font-weight: 700; text-transform: uppercase;">Requested New Date</div>
                        <div style="font-size: 14px; font-weight: 800; color: var(--orange-dark); margin-top: 4px;">${new Date(req.requestedEndDate).toLocaleDateString()}</div>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <div style="font-size: 11px; color: var(--slate-500); font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Justification / Reason</div>
                    <div style="background: white; border: 1px solid var(--slate-200); padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: var(--slate-700);">
                        "${req.justification || req.reason || "No reason provided."}"
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label" style="font-size: 11px;">PM REVIEW COMMENTS (OPTIONAL)</label>
                    <textarea id="extension-review-comment" class="form-input" rows="3" placeholder="Enter any notes or reasons for approval/rejection..."></textarea>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 32px;">
                    <button class="btn btn-danger" style="flex: 1; justify-content: center;" onclick="window.app.pmModule.handleRejectExtension('${req.id}', document.getElementById('extension-review-comment').value)">Reject Request</button>
                    <button class="btn btn-primary" style="flex: 2; justify-content: center; background: var(--emerald); border-color: var(--emerald);" onclick="window.app.pmModule.handleApproveExtension('${req.id}', document.getElementById('extension-review-comment').value)">Approve Extension</button>
                </div>
            </div>
        </div>
    `,

  dailyLogReview: (log, historicalLogs = []) => `
        <div style="padding: 0;">
            <div style="padding: 16px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--slate-900)">Site Progress Review</div>
                    <div style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">Project: ${log.project?.name || "Central"}</div>
                </div>
                <div>
                    <select id="log-history-selector" class="form-input" style="font-size: 11px; padding: 4px 8px;" onchange="window.app.pmModule.switchReviewLog(this.value)">
                        ${historicalLogs.map((h) => `<option value="${h.id}" ${h.id === log.id ? "selected" : ""}>${new Date(h.date || h.createdAt).toLocaleDateString()}</option>`).join("")}
                    </select>
                </div>
            </div>

            <div style="padding: 24px; max-height: calc(100vh - 150px); overflow-y: auto;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                    <div style="background: var(--emerald-light); padding: 12px; border-radius: 8px; border: 1px solid var(--emerald-border); text-align: center;">
                        <div style="font-size: 10px; color: var(--emerald-dark); font-weight: 700;">WORK PERCENT</div>
                        <div style="font-size: 18px; font-weight: 800; color: var(--emerald-dark);">${log.workPercentage}%</div>
                    </div>
                    <div style="background: var(--blue-light); padding: 12px; border-radius: 8px; border: 1px solid var(--blue-border); text-align: center;">
                        <div style="font-size: 10px; color: var(--blue-dark); font-weight: 700;">MANPOWER</div>
                        <div style="font-size: 18px; font-weight: 800; color: var(--blue-dark);">${log.manpowerCount}</div>
                    </div>
                    <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; border: 1px solid var(--slate-200); text-align: center;">
                        <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">WEATHER</div>
                        <div style="font-size: 13px; font-weight: 800; color: var(--slate-700); margin-top: 4px;">${log.weatherCondition?.toUpperCase() || "CLEAR"}</div>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <div style="font-size: 11px; color: var(--slate-500); font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Completed Activities</div>
                    <div style="background: white; border: 1px solid var(--slate-200); padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: var(--slate-700);">
                        ${log.activitiesCompleted || "No activities logged."}
                    </div>
                </div>

                ${
                  log.expenseItems && log.expenseItems.length > 0
                    ? `
                    <div style="margin-bottom: 24px;">
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Site Expenses (MWK)</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            ${log.expenseItems
                              .map(
                                (item) => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid var(--slate-100);">${item.description}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid var(--slate-100); text-align: right; font-family: 'JetBrains Mono';">${Number(item.amount).toLocaleString()}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                            <tr>
                                <td style="padding: 8px; font-weight: 700;">Total</td>
                                <td style="padding: 8px; text-align: right; font-weight: 700; font-family: 'JetBrains Mono';">${log.expenseItems.reduce((s, i) => s + Number(i.amount), 0).toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>
                `
                    : ""
                }

                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label" style="font-size: 11px;">REJECTION REASON (ONLY IF REJECTING)</label>
                    <textarea id="log-review-comment" class="form-input" rows="3" placeholder="Explain why this log is being rejected..."></textarea>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 32px;">
                    <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.drawer.close()">Cancel</button>
                    ${
                      log.status === "submitted" || log.status === "pending"
                        ? `
                        <button class="btn btn-danger" style="flex: 1; justify-content: center;" onclick="window.app.pmModule.handleRejectLog('${log.id}', document.getElementById('log-review-comment').value)">Reject</button>
                        <button class="btn btn-primary" style="flex: 2; justify-content: center; background: var(--emerald); border-color: var(--emerald);" onclick="window.app.pmModule.handleApproveLog('${log.id}')">Approve & Update Schedule</button>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `,

  requisitionReview: (req) => {
    const isReplenishment = req.isReplenishment;
    const items = req.items || [];
    const reqCode = req.reqCode || "REQ-" + req.id;
    const submitterName =
      req.submitter?.name ||
      req.user?.name ||
      req.requester?.name ||
      "Supervisor";

    return `
        <div style="padding: 0;">
            <div style="padding: 16px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--slate-900)">${isReplenishment ? "Stock Replenishment" : "Material Requisition"} ${reqCode}</div>
                    <div style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">Requested by ${submitterName}</div>
                </div>
                ${isReplenishment ? '<span class="badge badge-primary" style="background: var(--blue-light); color: var(--blue); font-size: 10px;">STOCK</span>' : ""}
            </div>

            <div style="padding: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
                    <thead style="background: var(--slate-50);">
                        <tr>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid var(--slate-200);">Item</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid var(--slate-200);">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid var(--slate-200);">Est. Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items
                          .map((item) => {
                            const name =
                              item.itemName ||
                              item.materialName ||
                              "Unknown Item";
                            const qty =
                              item.quantity || item.quantityNeeded || 0;
                            const unit = item.unit || "";
                            const cost =
                              item.unitPrice || item.estimatedCost || 0;
                            return `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid var(--slate-100); font-weight: 600;">${name}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid var(--slate-100); text-align: right;">${qty} ${unit}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid var(--slate-100); text-align: right; font-family: 'JetBrains Mono';">${Number(cost * qty).toLocaleString()}</td>
                                </tr>
                            `;
                          })
                          .join("")}
                    </tbody>
                </table>

                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 6px; text-transform: uppercase;">Approval/Rejection Justification *</label>
                    <textarea id="requisition_note" class="form-input" data-vrules="required|minLen:5" oninput="window.V?.checkField(this)" rows="3" style="width: 100%; border-radius: 8px; border-color: var(--slate-300);" placeholder="Provide reasoning for this decision..."></textarea>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.drawer.close()">Cancel</button>
                    <button class="btn btn-danger" style="flex: 1; justify-content: center;" onclick="if(!window.V?.validateForm(this.closest('.drawer-content'))){return} window.app.fmModule?.handleRequisitionAction('${req.id}', 'rejected')">Reject</button>
                    <button class="btn btn-primary" style="flex: 2; justify-content: center; background: var(--emerald); border-color: var(--emerald);" 
                        onclick="if(!window.V?.validateForm(this.closest('.drawer-content'))){return} window.app.fmModule?.handleRequisitionAction('${req.id}', 'approved')">
                        Approve & Create Contract
                    </button>
                </div>
            </div>
        </div>
    `;
  },

  userForm: `
        <div style="padding: 24px;">
            <input type="hidden" id="edit_user_id" name="id">
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Full Name</label>
                <input type="text" id="edit_user_name" name="name" class="form-input" data-vrules="required|minLen:3" oninput="window.V?.checkField(this)" placeholder="Enter full name..." style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Email Address</label>
                <input type="email" id="edit_user_email" name="email" class="form-input" data-vrules="required|email" oninput="window.V?.checkField(this)" placeholder="user@mcms.com" style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Role / Access Level</label>
                <select id="edit_user_role" name="role" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%;">
                    <option value="" disabled selected>Select Role...</option>
                    <option value="Project_Manager">Project Manager</option>
                    <option value="Field_Supervisor">Field Supervisor</option>
                    <option value="Finance_Director">Finance Director</option>
                    <option value="Contract_Administrator">Contract Administrator</option>
                    <option value="Equipment_Coordinator">Equipment Coordinator</option>
                    <option value="Operations_Manager">Operations Manager</option>
                    <option value="Managing_Director">Managing Director</option>
                    <option value="System_Technician">System Technician</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Password (Leave blank to keep current)</label>
                <input type="password" id="edit_user_pass" name="password" class="form-input" placeholder="••••••••" style="width: 100%;">
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px;" onclick="window.app.pmModule.handleUserFormSubmit()">Save User Changes</button>
        </div>
    `,

  editProject: `
        <div style="padding: 24px;">
            <input type="hidden" id="edit_proj_id">
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="edit_proj_name" class="form-input" data-vrules="required|minLen:5" oninput="window.V?.checkField(this)" style="width: 100%;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label">Client</label>
                    <input type="text" id="edit_proj_client" class="form-input" data-vrules="required|minLen:2" oninput="window.V?.checkField(this)" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select id="edit_proj_status" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%;">
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                    <label class="form-label">Budget (MWK)</label>
                    <input type="number" id="edit_proj_budget" class="form-input" data-vrules="required|min:1000" oninput="window.V?.checkField(this)" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">Supervisor</label>
                    <select id="edit_proj_supervisor" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%;">
                        <!-- Populated dynamically -->
                    </select>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" id="edit_proj_start" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">End Date</label>
                    <input type="date" id="edit_proj_end" class="form-input" data-vrules="required" onchange="window.V?.checkField(this)" style="width: 100%;">
                </div>
            </div>
            
            <div id="project-map" style="height: 250px; background: #eee; border-radius: 8px; margin-bottom: 24px; position: relative; cursor: crosshair;">
                <div id="map-prompt" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.9); padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; color: var(--orange); border: 1px solid var(--orange); pointer-events: none; z-index: 1000; animation: pulse 2s infinite; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <i class="fas fa-map-marker-alt"></i> CLICK MAP TO SET LOCATION
                </div>
            </div>
            <div style="font-size: 11px; color: var(--slate-500); margin-bottom: 24px; display: flex; justify-content: space-between;">
                <span>Lat: <span id="edit_proj_lat">--</span></span>
                <span>Lng: <span id="edit_proj_lng">--</span></span>
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px;" onclick="if(!window.V?.validateForm(this.closest('.drawer-content')||this.parentElement)){return} window.app.pmModule.handleUpdateProject()">Update Project Master</button>
        </div>
    `,

  suspendProject: `
        <div style="padding: 24px;">
            <input type="hidden" id="suspend_project_id">
            <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Project Name</label>
                <input type="text" id="suspend_project_name" class="form-input" readonly style="width: 100%; background: var(--slate-50);">
            </div>
            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Suspension Reason</label>
                <textarea id="suspend_project_reason" class="form-input" rows="5" placeholder="Document the reason for suspension (e.g. funding delay, site dispute)..." style="width: 100%;"></textarea>
            </div>
            <div style="background: var(--red-light); padding: 12px; border-radius: 6px; color: var(--red-dark); font-size: 12px; margin-bottom: 24px;">
                <i class="fas fa-exclamation-triangle"></i> This will halt all active workflows and site reporting for this project.
            </div>
            <button class="btn btn-danger" style="width: 100%; justify-content: center; padding: 14px;" onclick="window.app.pmModule.handleSuspendProject()">Suspend Project Now</button>
        </div>
    `,

  projectDetails: (p) => `
        <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
                <div>
                    <div style="font-size: 20px; font-weight: 800; color: var(--slate-900);">${p.name}</div>
                    <div style="font-size: 13px; color: var(--slate-500); margin-top: 4px;">${p.code} | ${p.client}</div>
                </div>
                <span class="status ${p.status === "active" ? "active" : "pending"}">${p.status.toUpperCase()}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">TOTAL BUDGET</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--slate-900); margin-top: 4px;">MWK ${Number(p.budgetTotal || p.budget).toLocaleString()}</div>
                </div>
                <div style="background: var(--slate-50); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">TIMELINE</div>
                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-900); margin-top: 4px;">${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}</div>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Project Manager / Supervisor</div>
                <div style="display: flex; align-items: center; gap: 12px; background: white; border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px;">
                    <div style="width: 32px; height: 32px; background: var(--blue-light); color: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800;">${(p.manager?.name || p.managerName || "U").charAt(0)}</div>
                    <div>
                        <div style="font-size: 13px; font-weight: 700;">${p.manager?.name || p.managerName || "Unassigned"}</div>
                        <div style="font-size: 11px; color: var(--slate-500); margin-top: 2px;">
                            ${p.manager ? `${p.manager.email || 'No email'} ${p.manager.phone ? '• ' + p.manager.phone : ''}` : 'No contact details available'}
                        </div>
                        <div style="font-size: 10px; font-weight: 700; color: var(--blue); margin-top: 4px; text-transform: uppercase;">Supervisor</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.app.pmModule.openEditProjectDrawer('${p.id}')"><i class="fas fa-edit"></i> Edit Master</button>
                <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.app.pmModule.openExtendProjectDrawer('${p.id}')"><i class="fas fa-calendar-plus"></i> Extend</button>
            </div>
        </div>
    `,

  assignResource: (projects) => `
        <div style="padding: 24px;">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Strategic Asset Dispatch</h3>
            <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 24px;">Allocate materials and machinery to active project sites.</p>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">Project / Site</label>
                <select id="assign_project" class="form-input" style="width: 100%;" onchange="window.app.ecModule.handleTimelineProjectChange(this.value)">
                    <option value="">Select Project...</option>
                    ${projects.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
                </select>
            </div>
            
            <div style="display: flex; gap: 12px; margin-bottom: 24px; background: var(--slate-100); padding: 4px; border-radius: 8px;">
                <button id="btn_materials" class="btn btn-primary active-resource active" style="flex: 1; justify-content: center; font-size: 12px;" onclick="window.app.ecModule.toggleResourceType('materials', this)">Construction Materials</button>
                <button id="btn_machinery" class="btn btn-secondary active-resource" style="flex: 1; justify-content: center; font-size: 12px;" onclick="window.app.ecModule.toggleResourceType('machinery', this)">Machinery / Fleet</button>
            </div>

            <div id="material_sheet_view">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label">Project Phase</label>
                    <select id="assign_phase" class="form-input" style="width: 100%;" onchange="window.app.ecModule.updateMaterialSheet(this.value)">
                        <option value="">Select Phase...</option>
                        <option value="1">Phase 1: Mobilization & Site Prep</option>
                        <option value="2">Phase 2: Earthworks & Sub-base</option>
                        <option value="3">Phase 3: Base Course Construction</option>
                        <option value="4">Phase 4: Surfacing / Paving</option>
                        <option value="5">Phase 5: Drainage & Ancillary</option>
                        <option value="6">Phase 6: Final Completion</option>
                    </select>
                </div>
                
                <div id="material_sheet_container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                    <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--slate-400); font-size: 12px;">Select a phase to view required materials.</div>
                </div>
            </div>

            <div id="machinery_view" style="display: none; margin-bottom: 24px;">
                <div class="form-group">
                    <label class="form-label">Search Asset Registry</label>
                    <input type="text" class="form-input" placeholder="Search by name, plate, or type..." style="width: 100%;">
                </div>
                <div style="margin-top: 12px; max-height: 200px; overflow-y: auto; border: 1px solid var(--slate-200); border-radius: 12px; background: var(--slate-50);">
                    <div style="padding: 32px 16px; text-align: center; color: var(--slate-400);">
                        <i class="fas fa-search-plus" style="font-size: 20px; margin-bottom: 8px; opacity: 0.5;"></i>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Registry Search</div>
                        <div style="font-size: 10px; opacity: 0.8;">Enter asset name or serial to filter fleet</div>
                    </div>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">Site Supervisor / Recipient</label>
                <select id="assign_fs" class="form-input" style="width: 100%;">
                    <option value="">Select Supervisor...</option>
                    <option value="Mike Banda">(Available) Mike Banda (Sector 1)</option>
                    <option value="Grace Chibwe">(Available) Grace Chibwe (Sector 2)</option>
                </select>
            </div>

            <div class="form-group" id="eta_container" style="margin-bottom: 24px;">
                <label class="form-label">Estimated Arrival Time *</label>
                <input type="datetime-local" id="dispatch_eta" class="form-input" style="width: 100%;"
                    min="${new Date().toISOString().slice(0, 16)}" onchange="document.getElementById('eta_error').style.display='none'">
                <div id="eta_error" style="font-size: 11px; color: var(--red); margin-top: 4px; display: none; font-weight: 600;">⚠ Please set a valid future arrival time.</div>
                <div style="font-size: 11px; color: var(--slate-400); margin-top: 4px;">Past dates are restricted.</div>
            </div>

            <div id="dispatch_impact_summary" style="margin-bottom: 24px; padding: 24px; border-radius: 12px; background: var(--slate-50); border: 1px dashed var(--slate-200); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                <i class="fas fa-microchip" style="font-size: 24px; color: var(--slate-300); opacity: 0.5;"></i>
                <div style="text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em;">Intelligence: Awaiting Input</div>
                    <div style="font-size: 10px; color: var(--slate-400); margin-top: 2px;">Select project and resources to calculate logistics impact</div>
                </div>
            </div>

            <button class="btn btn-primary" id="btn_execute_dispatch" style="width: 100%; justify-content: center; padding: 14px;" onclick="window.app.ecModule.handleExecuteDispatch()">Authorize & Execute Dispatch</button>
        </div>
    `,

  receiveProcurement: (item) => `
        <div style="padding: 24px;">
            <div style="background: var(--blue-light); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-weight: 700; color: var(--blue); font-size: 16px;">${item.name}</div>
                <div style="font-size: 12px; color: var(--slate-500); margin-top: 4px;">Ref: ${item.contractRef} | From: ${item.vendor}</div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 8px; text-transform: uppercase;">Quantity to Receive <span style="color: var(--red);">*</span></label>
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="flex: 1;">
                        <input type="number" id="receive_qty" class="form-input" value="${item.qty}" min="0.001" max="${item.qty}" step="any" 
                            data-vrules="required|numeric|min:0.001|max:${item.qty}" oninput="window.V?.checkField(this)"
                            style="width: 100%; font-weight: 700; font-size: 18px; font-family: 'JetBrains Mono', monospace;">
                    </div>
                    <span style="font-weight: 600; color: var(--slate-500); padding-top: 10px;">${item.unit}</span>
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: var(--slate-400);">
                    Max pending: <strong>${item.qty} ${item.unit}</strong>
                </div>
            </div>

            <div style="background: #FFFBEB; border: 1px solid #FDE68A; padding: 12px; border-radius: 6px; font-size: 12px; color: #92400E; margin-bottom: 24px;">
                <i class="fas fa-triangle-exclamation"></i> <strong>Verification Note:</strong> By clicking receive, you confirm that the physical goods match the quantity entered and quality standards are met.
            </div>

            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-weight: 800;" 
                onclick="if(window.V?.validateForm(this.closest('.drawer-content'))) window.app.ecModule.handleProcurementReceipt(${JSON.stringify(item).replace(/"/g, "&quot;")})">
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i> Confirm Physical Receipt
            </button>
        </div>
    `,

  inventoryDetails: (data) => `
        <div style="padding: 20px; background: #fff;">
            <div style="background: var(--orange-light); padding: 16px; border-radius: 12px; border: 1px solid rgba(249, 115, 22, 0.2); margin-bottom: 20px; display: flex; align-items: center; gap: 16px;">
                <div style="width: 48px; height: 48px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--orange); box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <i class="fas fa-cubes"></i>
                </div>
                <div>
                    <div style="font-size: 10px; font-weight: 800; color: var(--orange); text-transform: uppercase; letter-spacing: 0.1em;">${data.materialName}</div>
                    <div style="font-size: 22px; font-weight: 900; color: var(--slate-900); font-family: 'JetBrains Mono', monospace;">
                        ${Number(data.totalQty).toLocaleString()} <span style="font-size: 12px; color: var(--slate-500); font-weight: 700;">${data.unit} Total</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px;">
                <h4 style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em;">Project Allocations</h4>
                <div style="font-size: 10px; font-weight: 700; color: var(--orange);">${data.allocations.length} Active Sites</div>
            </div>
            
            <div style="display: grid; gap: 8px; margin-bottom: 20px;">
                ${
                  data.allocations.length === 0
                    ? `
                    <div style="padding: 24px; text-align: center; background: var(--slate-50); border: 1px dashed var(--slate-200); border-radius: 12px; color: var(--slate-400); font-size: 12px;">
                        No project-specific stock found.
                    </div>
                `
                    : data.allocations
                        .map(
                          (a) => `
                    <div style="background: #fff; border: 1px solid var(--slate-100); padding: 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-location-dot" style="font-size: 12px; color: var(--orange);"></i>
                            <div>
                                <div style="font-weight: 700; color: var(--slate-800); font-size: 13px;">${a.projectName || "Central Silo"}</div>
                                <div style="font-size: 10px; color: var(--slate-500);">${a.sectorName}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 15px; color: var(--slate-900);">${Number(a.quantity).toLocaleString()}</div>
                        </div>
                    </div>
                `,
                        )
                        .join("")
                }
            </div>

            <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                <i class="fas fa-shield-halved" style="color: #ca8a04; font-size: 14px; margin-top: 2px;"></i>
                <div style="font-size: 11px; color: #854d0e; line-height: 1.4;">
                    <strong>Inventory Lock:</strong> Legally bound to the sites above. Site transfers require <strong>Finance Director Authorization</strong> via Formal Variation Order.
                </div>
            </div>
            
            <div style="margin-top: 24px;">
                <button class="btn" style="width: 100%; justify-content: center; padding: 14px; font-weight: 800; font-size: 13px; border-radius: 10px; background: var(--orange); color: white; border: none; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2); cursor: pointer; transition: all 0.2s ease;" 
                    onclick="window.drawer.close()"
                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 15px rgba(249, 115, 22, 0.3)'"
                    onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(249, 115, 22, 0.2)'">
                    ACKNOWLEDGE & CLOSE
                </button>
            </div>
        </div>
    `,

  assetHistory: (asset) => `
        <div style="padding: 24px;">
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; border-radius: 16px; color: white; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">Asset Chain of Custody</div>
                <h3 style="font-size: 20px; font-weight: 900;">${asset.name}</h3>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Code: ${asset.assetCode || "EQP-" + asset.id} | Status: ${asset.status}</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0; position: relative; padding-left: 20px;">
                <div style="position: absolute; left: 6px; top: 0; bottom: 0; width: 2px; background: var(--slate-200);"></div>
                
                ${
                  asset.assetLogs.length === 0
                    ? '<div style="padding: 20px; text-align: center; color: var(--slate-400);">No history logs found for this asset.</div>'
                    : asset.assetLogs
                        .map((log, i) => {
                          const isIssue = log.action === "flagged_issue";
                          const isResolve = log.action === "issue_resolved";
                          const isCheckOut = log.action === "check_out";
                          const color = isIssue
                            ? "var(--red)"
                            : isResolve
                              ? "var(--emerald)"
                              : isCheckOut
                                ? "var(--blue)"
                                : "var(--slate-400)";

                          return `
                        <div style="position: relative; margin-bottom: 24px;">
                            <div style="position: absolute; left: -20px; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: ${color}; border: 3px solid white; box-shadow: 0 0 0 2px ${color}20;"></div>
                            <div style="background: ${isIssue ? "#fef2f2" : "white"}; border: 1px solid ${isIssue ? "#fecaca" : "var(--slate-200)"}; border-radius: 12px; padding: 16px; margin-left: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                    <span style="font-weight: 800; font-size: 13px; color: ${color}; text-transform: uppercase;">${log.action.replace(/_/g, " ")}</span>
                                    <span style="font-size: 11px; color: var(--slate-400);">${new Date(log.timestamp).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <div style="font-size: 14px; font-weight: 700; color: var(--slate-900);">${log.user?.name || "System"}</div>
                                ${log.projectId ? `<div style="font-size: 12px; color: var(--slate-600); margin-top: 4px;"><i class="fas fa-location-dot"></i> Assigned to Project Site</div>` : ""}
                                ${isIssue ? `<div style="margin-top: 8px; padding: 8px; background: #fee2e2; border-radius: 6px; font-size: 12px; color: #b91c1c; font-weight: 600;"><i class="fas fa-triangle-exclamation"></i> Fault/Problem Reported</div>` : ""}
                            </div>
                        </div>
                        `;
                        })
                        .join("")
                }
            </div>

            <div style="margin-top: 32px; border-top: 1px solid var(--slate-200); padding-top: 24px;">
                <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="window.drawer.close()">Close Log</button>
            </div>
        </div>
    `,

  safetyIncidentTable: (incidents = []) => `
        <div class="drawer-section" style="padding: 0;">
            <div style="padding: 24px; background: #FEF2F2; border-bottom: 1px solid #FECACA; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: #991B1B; margin: 0;">Safety Incidents</h3>
                    <div style="font-size: 12px; color: #B91C1C; margin-top: 4px;">Track and respond to site incidents</div>
                </div>
                <button class="btn btn-primary" style="background: #DC2626; border-color: #DC2626;" onclick="window.drawer.open('Report Safety Incident', window.DrawerTemplates.safetyIncident())">
                    <i class="fas fa-plus"></i> Report New
                </button>
            </div>
            
            <div style="padding: 24px;">
                ${
                  incidents.length === 0
                    ? `
                    <div style="padding: 40px; text-align: center; color: var(--slate-400); background: var(--slate-50); border-radius: 8px; border: 1px dashed var(--slate-200);">
                        <i class="fas fa-shield-check" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i>
                        <div>No safety incidents reported.</div>
                    </div>
                `
                    : `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--slate-200); text-align: left;">
                                <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500);">ID / Date</th>
                                <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500);">Type</th>
                                <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500);">Status</th>
                                <th style="padding: 12px 8px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${incidents
                              .map(
                                (inc) => `
                                <tr style="border-bottom: 1px solid var(--slate-100); background: white; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                    <td style="padding: 16px 8px;">
                                        <div style="font-weight: 700; font-size: 13px;">${inc.id || "N/A"}</div>
                                        <div style="font-size: 11px; color: var(--slate-500);">${new Date(inc.createdAt || Date.now()).toLocaleDateString()}</div>
                                    </td>
                                    <td style="padding: 16px 8px;">
                                        <div style="font-weight: 700; color: var(--slate-700); font-size: 13px;">${inc.type || "General"}</div>
                                        <div style="font-size: 11px; color: ${inc.priority === "High" ? "var(--red)" : "var(--amber)"}; font-weight: 700;">${inc.priority || "Medium"} Priority</div>
                                    </td>
                                    <td style="padding: 16px 8px;">
                                        <span class="badge ${inc.status === "resolved" ? "badge-success" : "badge-warning"}">${(inc.status || "PENDING").toUpperCase()}</span>
                                    </td>
                                    <td style="padding: 16px 8px; text-align: right;">
                                        <button class="btn btn-secondary btn-sm" onclick='window.drawer.open("Incident Details", window.DrawerTemplates.safetyIncident(${JSON.stringify(inc).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}))'>
                                            View Thread
                                        </button>
                                    </td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                `
                }
            </div>
        </div>
    `,

  issueTable: (issues = []) => `
        <div class="drawer-section" style="padding: 0;">
            <div style="padding: 24px; background: #FFFBEB; border-bottom: 1px solid #FDE68A; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: #92400E; margin: 0;">Site Issues</h3>
                    <div style="font-size: 12px; color: #B45309; margin-top: 4px;">Track and respond to operational issues</div>
                </div>
                <button class="btn btn-primary" style="background: #D97706; border-color: #D97706;" onclick="window.drawer.open('Report Issue', window.DrawerTemplates.submitComplaint)">
                    <i class="fas fa-plus"></i> Report New
                </button>
            </div>
            
            <div style="padding: 24px;">
                ${
                  issues.length === 0
                    ? `
                    <div style="padding: 40px; text-align: center; color: var(--slate-400); background: var(--slate-50); border-radius: 8px; border: 1px dashed var(--slate-200);">
                        <i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px; color: var(--emerald);"></i>
                        <div>No open issues reported.</div>
                    </div>
                `
                    : `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--slate-200); text-align: left;">
                                <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500);">ID / Date</th>
                                <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500);">Category</th>
                                <th style="padding: 12px 8px; font-size: 11px; text-transform: uppercase; color: var(--slate-500);">Status</th>
                                <th style="padding: 12px 8px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${issues
                              .map(
                                (iss) => `
                                <tr style="border-bottom: 1px solid var(--slate-100); background: white; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                    <td style="padding: 16px 8px;">
                                        <div style="font-weight: 700; font-size: 13px;">${iss.id || "N/A"}</div>
                                        <div style="font-size: 11px; color: var(--slate-500);">${new Date(iss.createdAt || Date.now()).toLocaleDateString()}</div>
                                    </td>
                                    <td style="padding: 16px 8px;">
                                        <div style="font-weight: 700; color: var(--slate-700); font-size: 13px;">${iss.category || "General"}</div>
                                        <div style="font-size: 11px; color: var(--slate-500);">${iss.severity || "Medium"} Severity</div>
                                    </td>
                                    <td style="padding: 16px 8px;">
                                        <span class="badge ${iss.status === "resolved" ? "badge-success" : "badge-warning"}">${(iss.status || "PENDING").toUpperCase()}</span>
                                    </td>
                                    <td style="padding: 16px 8px; text-align: right;">
                                        <button class="btn btn-secondary btn-sm" onclick='window.drawer.open("Issue Details", window.DrawerTemplates.complaintDetails(${JSON.stringify(iss).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}))'>
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                `
                }
            </div>
        </div>
    `,

  auditDetails: (log) => {
    const details =
      typeof log.details === "string" ? JSON.parse(log.details) : log.details;

    const getAuditSummaryHTML = () => {
      if (!details) return "";

      let summary = "";
      const action = log.action;

      if (action === "UPDATE_USER" || action === "CREATE_USER") {
        summary = `
                    <div style="background: #fdf2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #991b1b; font-weight: 700; margin-bottom: 4px;">User Profile Event</div>
                        <div style="font-size: 13px; color: #7f1d1d;">
                            ${action === "CREATE_USER" ? "New user account provisioned for" : "Account details updated for"} 
                            <strong>${details.name || details.email || log.targetCode || "Unknown User"}</strong>.
                            ${details.role ? `<br>Assigned Role: <span class="badge active" style="font-size:10px; margin-top:4px;">${details.role}</span>` : ""}
                            ${details.changes && details.changes.length > 0 ? `<div style="margin-top:8px; font-size:11px; color:#991b1b;">Fields modified: ${details.changes.join(", ")}</div>` : ""}
                        </div>
                    </div>
                `;
      } else if (action.includes("EXTENSION") || action.includes("TIMELINE")) {
        summary = `
                    <div style="background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #854d0e; font-weight: 700; margin-bottom: 4px;">Timeline Variance Event</div>
                        <div style="font-size: 13px; color: #713f12;">
                            Project: <strong>${details.projectName || log.targetCode || "N/A"}</strong><br>
                            Requested End Date: <span style="font-weight:700;">${details.requestedEndDate || "N/A"}</span><br>
                            Extension: <span style="color:#ca8a04; font-weight:700;">+${details.extensionDays || 0} days</span><br>
                            Reason: <span style="font-style:italic;">"${details.justification || "No justification provided"}"</span>
                        </div>
                    </div>
                `;
      } else if (
        action.includes("MONETARY") ||
        action.includes("BUDGET") ||
        action.includes("FINANCE") ||
        action.includes("REQUISITION") ||
        action.includes("PAYMENT")
      ) {
        const amount =
          details.amount || details.totalAmount || details.cost || 0;
        summary = `
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #065f46; font-weight: 700; margin-bottom: 4px;">Financial Transaction Event</div>
                        <div style="font-size: 13px; color: #064e3b;">
                            Impact: <strong style="font-size: 15px; color: #059669;">MWK ${Number(amount).toLocaleString()}</strong><br>
                            Resource: ${log.targetType} (${log.targetCode || "N/A"})<br>
                            Status Flow: <span style="font-weight:600;">${details.oldStatus || "INITIATED"} &rarr; ${details.newStatus || log.status || "FINALIZED"}</span>
                            ${details.remainingBudget ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed #a7f3d0;">Project Balance after action: <strong>MWK ${Number(details.remainingBudget).toLocaleString()}</strong></div>` : ""}
                        </div>
                    </div>
                `;
      } else if (
        action.includes("VENDOR") ||
        action.includes("PROCUREMENT") ||
        action.includes("CONTRACT")
      ) {
        summary = `
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #1e40af; font-weight: 700; margin-bottom: 4px;">Supply Chain & Logistics Event</div>
                        <div style="font-size: 13px; color: #1e3a8a;">
                            Entity/Contract: <strong>${details.vendorName || details.supplierName || details.contractName || log.targetCode || "N/A"}</strong><br>
                            ${details.amount ? `Transaction Value: <strong style="color:#2563eb;">MWK ${Number(details.amount).toLocaleString()}</strong><br>` : ""}
                            ${details.remainingProjectBudget ? `Project Ledger Balance: <strong>MWK ${Number(details.remainingProjectBudget).toLocaleString()}</strong>` : ""}
                        </div>
                    </div>
                `;
      } else if (action.includes("ASSET") || action.includes("EQUIPMENT")) {
        summary = `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; margin-bottom: 4px;">Asset Allocation Event</div>
                        <div style="font-size: 13px; color: #1e293b;">
                            Asset: <strong>${details.assetName || log.targetCode || "N/A"}</strong><br>
                            Assigned to: <span style="font-weight:600;">${details.assignedTo || "Unassigned"}</span><br>
                            Action: <span style="color:var(--orange); font-weight:700;">${log.action.replace(/_/g, " ")}</span>
                        </div>
                    </div>
                `;
      } else if (action.includes("REQUISITION")) {
        summary = `
                    <div style="background: #fff7ed; border: 1px solid #ffedd5; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #9a3412; font-weight: 700; margin-bottom: 4px;">Resource Requisition Event</div>
                        <div style="font-size: 13px; color: #7c2d12;">
                            ID: <strong>${log.targetCode || "N/A"}</strong><br>
                            Action: <span style="font-weight:600;">${action.replace(/_/g, " ")}</span><br>
                            Items: <span style="font-style:italic;">${details.itemsCount || details.items?.length || "Multiple resources"}</span>
                            ${details.totalCost ? `<br>Estimated Value: <strong>MWK ${Number(details.totalCost).toLocaleString()}</strong>` : ""}
                        </div>
                    </div>
                `;
      } else if (
        action.includes("ISSUE") ||
        action.includes("COMPLAINT") ||
        action.includes("INCIDENT")
      ) {
        summary = `
                    <div style="background: #fff1f2; border: 1px solid #ffe4e6; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #be123c; font-weight: 700; margin-bottom: 4px;">Governance & Safety Event</div>
                        <div style="font-size: 13px; color: #881337;">
                            Category: <strong>${details.category || "Site Issue"}</strong><br>
                            Priority: <span class="status ${details.priority === "high" ? "rejected" : "active"}" style="font-size:9px; padding: 2px 6px;">${(details.priority || "NORMAL").toUpperCase()}</span><br>
                            Description: <span style="font-size:12px; display:block; margin-top:4px; line-height:1.4;">${details.description || "No description provided."}</span>
                        </div>
                    </div>
                `;
      } else if (action.includes("REPORT") || action.includes("ANALYTICS")) {
        summary = `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; margin-bottom: 4px;">Data & Insights Event</div>
                        <div style="font-size: 13px; color: #1e293b;">
                            Action: <span style="font-weight:600;">${action.replace(/_/g, " ")}</span><br>
                            Resource: <strong>${log.targetType || "System Report"}</strong><br>
                            Scope: <span style="font-size:11px;">${details.scope || details.projectName || "Full System"}</span>
                        </div>
                    </div>
                `;
      } else if (
        action === "APPROVE" ||
        action === "REJECT" ||
        action.includes("REVIEW")
      ) {
        const isApprove = action === "APPROVE" || action.includes("APPROVE");
        summary = `
                    <div style="background: ${isApprove ? "#ecfdf5" : "#fff1f2"}; border: 1px solid ${isApprove ? "#a7f3d0" : "#fecaca"}; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; color: ${isApprove ? "#065f46" : "#991b1b"}; font-weight: 700; margin-bottom: 4px;">Governance Approval Workflow</div>
                        <div style="font-size: 13px; color: ${isApprove ? "#064e3b" : "#7f1d1d"};">
                            Result: <strong style="color:${isApprove ? "#059669" : "#dc2626"};">${action.replace(/_/g, " ")}</strong><br>
                            Target: <strong>${log.targetType} (${log.targetCode})</strong><br>
                            Comment: <span style="font-style:italic;">"${details.comment || details.reason || "No comment provided"}"</span>
                        </div>
                    </div>
                `;
      }
      return summary;
    };

    return `
            <div style="padding: 24px; border-bottom: 1px solid var(--slate-200); background: var(--slate-50);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 16px;">
                    <div>
                        <div style="font-size:11px; color:var(--slate-500); text-transform:uppercase; font-weight:700;">Action Type</div>
                        <div style="font-size:18px; font-weight:800; color:var(--slate-900);">${log.action}</div>
                    </div>
                    <div style="text-align:right;">
                        <span class="status ${log.status === "failure" ? "rejected" : "active"}" style="font-size:10px; padding: 4px 8px; border-radius: 4px;">${(log.status || "Success").toUpperCase()}</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size:10px; color:var(--slate-500); text-transform:uppercase;">Actor</div>
                        <div style="font-size:13px; font-weight:600;">${log.userName || "System"}</div>
                        <div style="font-size:11px; color:var(--slate-400);">${log.userRole || "Automated Service"}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:10px; color:var(--slate-500); text-transform:uppercase;">IP Address</div>
                        <div style="font-size:12px; font-family:'JetBrains Mono';">${log.ipAddress || "Internal"}</div>
                    </div>
                </div>
            </div>

            <div class="drawer-section">
                ${getAuditSummaryHTML()}
                
                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 13px; font-weight: 700; color: var(--slate-800); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-microchip" style="color: var(--orange);"></i> Technical Trace Data
                    </h4>
                    
                    <div style="background: var(--slate-900); border-radius: 8px; padding: 16px; color: #a5d6ff; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.5; overflow-x: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        <pre style="margin: 0;">${JSON.stringify(details, null, 2)}</pre>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px;">
                        <div style="font-size:10px; color:var(--slate-500); text-transform:uppercase; margin-bottom: 4px;">Target Type</div>
                        <div style="font-size:12px; font-weight:600;">${log.targetType || "N/A"}</div>
                    </div>
                    <div style="border: 1px solid var(--slate-200); padding: 12px; border-radius: 8px;">
                        <div style="font-size:10px; color:var(--slate-500); text-transform:uppercase; margin-bottom: 4px;">Resource ID</div>
                        <div style="font-size:12px; font-weight:600; font-family:'JetBrains Mono';">${log.targetId || log.targetCode || "None"}</div>
                    </div>
                </div>

                <div style="margin-top: 24px; padding: 16px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 8px;">
                    <div style="display: flex; gap: 12px;">
                        <i class="fas fa-shield-halved" style="color: #3b82f6; font-size: 18px;"></i>
                        <div>
                            <div style="font-size: 12px; font-weight: 700; color: #1e40af;">Audit Integrity Verified</div>
                            <div style="font-size: 11px; color: #1e40af; margin-top: 2px;">This log entry is immutable and cryptographically timestamped in the system records.</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 24px; background: white; border-top: 1px solid var(--slate-200); display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.drawer.close()">Close Log</button>
            </div>
        `;
  },

   terminateContract: (contract) => {
        const isExpired = contract.status === 'expired' || (contract.endDate && new Date(contract.endDate) <= new Date());
        return `
        <div style="padding: 24px;">
            <div style="margin-bottom: 20px; padding: 16px; background: ${isExpired ? '#eff6ff' : '#fef2f2'}; border-radius: 8px; border: 1px solid ${isExpired ? '#dbeafe' : '#fecaca'};">
                <div style="font-weight: 800; color: ${isExpired ? '#1e40af' : '#dc2626'}; font-size: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas ${isExpired ? 'fa-file-circle-check' : 'fa-exclamation-triangle'}"></i> ${isExpired ? 'Contract Closure & Reconciliation' : 'Terminate Contract'}
                </div>
                <div style="font-size: 12px; color: ${isExpired ? '#1e3a8a' : '#991b1b'}; margin-top: 4px;">
                    You are ${isExpired ? 'closing' : 'terminating'} <strong>${contract.refCode}</strong>. Please reconcile any received materials so the remaining budget can be returned to the project.
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--slate-500); margin-bottom: 8px;">${isExpired ? 'Closure Notes' : 'Termination Reason'} <span style="color: var(--red);">*</span></label>
                <textarea id="term_reason" class="form-input" style="width: 100%; min-height: 100px; padding: 12px;" placeholder="${isExpired ? 'Provide final summary for closure...' : 'Provide justification for termination...'}" data-vrules="required|minLen:10" oninput="window.V?.checkField(this)"></textarea>
            </div>

            <div style="margin-bottom: 20px;">
                <label class="form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); margin-bottom: 12px; text-transform: uppercase;">Material Reconciliation</label>
                <div style="font-size: 11px; color: var(--slate-500); margin-bottom: 12px; line-height: 1.5;">
                    Specify exactly how much material was <strong>actually received</strong> before ${isExpired ? 'closure' : 'termination'}. The difference will be returned to the project budget.
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${contract.items && contract.items.length > 0 ? contract.items.map((item, idx) => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 8px;">
                            <div>
                                <div style="font-weight: 700; font-size: 13px; color: var(--slate-800);">${item.materialName}</div>
                                <div style="font-size: 11px; color: var(--slate-500);">Originally Contracted: <strong>${Number(item.quantity)} ${item.unit}</strong></div>
                            </div>
                            <div style="width: 120px;">
                                <label style="font-size: 10px; font-weight: 700; color: var(--slate-400); margin-bottom: 4px; display: block; text-transform: uppercase;">Qty Received</label>
                                <input type="number" class="form-input term-received-qty" data-item-id="${item.id}" value="${item.receivedQty || 0}" min="${item.receivedQty || 0}" max="${item.quantity}" style="width: 80px; padding: 4px 8px; font-size: 12px; text-align: center;" data-vrules="required|numeric|min:${item.receivedQty || 0}|max:${item.quantity}" oninput="window.V?.checkField(this)">
                            </div>
                        </div>
                    `).join('') : '<div style="font-size: 12px; color: var(--slate-400);">No specific materials listed for this contract.</div>'}
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 32px;">
                <button class="btn btn-secondary" style="flex: 1; justify-content: center; font-weight: 700;" onclick="window.drawer.close()">Cancel</button>
                <button class="btn btn-primary" style="flex: 2; justify-content: center; background: ${isExpired ? 'var(--slate-800)' : 'var(--red)'}; border-color: ${isExpired ? 'var(--slate-800)' : 'var(--red)'};" onclick="if(window.V.validateForm(this.closest('.drawer-content'))) (window.app.fmModule || window.app.pmModule)?.submitTermination(${contract.id})">
                    <i class="fas ${isExpired ? 'fa-file-circle-check' : 'fa-file-contract'}" style="margin-right: 8px;"></i> ${isExpired ? 'Finalize Closure' : 'Finalize Termination'}
                </button>
            </div>
        </div>
        `;
    },

    vendorView: (vendor) => {
        const rating = vendor.avgRating || 0;
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let starsHtml = '';
        for (let i = 0; i < full; i++) starsHtml += '<i class="fas fa-star"></i>';
        if (half) starsHtml += '<i class="fas fa-star-half-alt"></i>';
        const empty = Math.max(0, 5 - full - (half ? 1 : 0));
        for (let i = 0; i < empty; i++) starsHtml += '<i class="fas fa-star" style="color: var(--slate-200);"></i>';

        return `
        <div style="padding: 24px;">
            <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 32px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--orange-light); color: var(--orange); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    <i class="fas fa-building"></i>
                </div>
                <div style="flex: 1;">
                    <h2 style="font-size: 18px; font-weight: 800; color: var(--slate-900); margin: 0 0 4px 0;">${vendor.name}</h2>
                    <div style="font-size: 13px; color: var(--slate-500); display: flex; gap: 12px;">
                        <span><i class="fas fa-tag"></i> ${vendor.category || 'General Supplier'}</span>
                        <span><i class="fas fa-phone"></i> ${vendor.phone || 'No phone'}</span>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 16px; border-radius: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Total Contracts</div>
                    <div style="font-size: 24px; font-weight: 800; color: var(--slate-900);">${vendor._count?.contracts || vendor.contractCount || 0}</div>
                </div>
                <div style="background: #fffaf5; border: 1px solid var(--orange-light); padding: 16px; border-radius: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--orange); text-transform: uppercase; margin-bottom: 8px;">Scorecard Rating</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="font-size: 24px; font-weight: 800; color: var(--slate-900);">${rating > 0 ? rating.toFixed(1) : 'N/A'}</div>
                        <div style="color: var(--orange); font-size: 14px;">${starsHtml}</div>
                    </div>
                </div>
            </div>

            <h3 style="font-size: 14px; font-weight: 800; color: var(--slate-800); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--slate-200);">Contract History</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
                ${vendor.contracts && vendor.contracts.length > 0 ? vendor.contracts.map(c => `
                    <div style="padding: 16px; background: white; border: 1px solid var(--slate-200); border-radius: 8px; box-shadow: var(--shadow-sm);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <div style="font-weight: 700; font-size: 13px; color: var(--slate-800);">${c.title}</div>
                            <span class="status ${c.status}" style="font-size: 10px;">${c.status.toUpperCase()}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: var(--slate-500);">
                            <div><strong>Ref:</strong> ${c.refCode}</div>
                            <div><strong>Value:</strong> MWK ${Number(c.value).toLocaleString()}</div>
                            ${c.vendorRating ? `<div style="grid-column: 1 / -1; margin-top: 4px; padding-top: 4px; border-top: 1px dashed var(--slate-200); color: var(--orange);"><strong>Rating:</strong> ${c.vendorRating}/5 - <i>"${c.ratingComment || 'No comment'}"</i></div>` : ''}
                        </div>
                    </div>
                `).join('') : '<div style="font-size: 12px; color: var(--slate-400); text-align: center; padding: 20px;">No contract history found.</div>'}
            </div>

            <div style="position: sticky; bottom: 0; background: white; padding-top: 16px; border-top: 1px solid var(--slate-200); display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex: 1; justify-content: center; font-weight: 700;" onclick="window.drawer.close()">Close</button>
            </div>
        </div>
        `;
    },

    suspendProject: () => `
        <div style="padding: 24px;">
            <div style="margin-bottom: 24px; text-align: center;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: #fffaf0; color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px;">
                    <i class="fas fa-pause-circle"></i>
                </div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--slate-900); margin-bottom: 8px;">Suspend Project</h3>
                <p style="font-size: 13px; color: var(--slate-500); line-height: 1.5;">Are you sure you want to put this project on hold? This will pause all activity and alert the team.</p>
            </div>

            <input type="hidden" id="suspend_project_id">
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Project Name</label>
                <input type="text" id="suspend_project_name" readonly 
                    style="width: 100%; padding: 12px; border: 1px solid var(--slate-200); border-radius: 8px; background: var(--slate-50); color: var(--slate-600); font-size: 14px; font-weight: 600;">
            </div>

            <div class="form-group" style="margin-bottom: 32px;">
                <label style="display: block; font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Reason for Suspension <span style="color: var(--red);">*</span></label>
                <textarea id="suspend_project_reason" placeholder="Explain why the project is being suspended (e.g. Budget issues, Site access, Weather)..."
                    style="width: 100%; padding: 12px; border: 1px solid var(--slate-300); border-radius: 8px; font-size: 14px; min-height: 120px; outline: none; transition: border-color 0.2s;"></textarea>
            </div>

            <div style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.drawer.close()">Cancel</button>
                <button class="btn btn-warning" style="flex: 1; justify-content: center; background: #f59e0b; color: white;" 
                    onclick="window.app.pmModule?.handleSuspendProject()">
                    Suspend Project
                </button>
            </div>
        </div>
    `,
};
