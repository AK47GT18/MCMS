import client from "../../../src/api/client.js";
import { StatCard } from "../../ui/StatCard.js";
import contracts from "../../../src/api/contracts.api.js";

export const FD_Contracts = {
  getContractsView() {
    this.currentContractTab = this.currentContractTab || "project";
    // Keep existing filter if switching from dashboard
    this.projectFilter = this.projectFilter || "";
    this.vendorFilter = this.vendorFilter || "";

    setTimeout(() => this.loadContractsData(), 0);

    return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Contract Registry & Legal Repository</div>
                    ${
                      this.currentContractTab === "project"
                        ? `<button class="btn btn-primary" onclick="window.app.fmModule?.openNewProjectContract()"><i class="fas fa-file-signature"></i> New Project Master</button>`
                        : (this.currentContractTab === "vendor" 
                            ? `<button class="btn btn-primary" onclick="window.app.fmModule?.openNewVendorContract()">
                                <i class="fas fa-plus-circle"></i> New Vendor Contract
                               </button>`
                            : `<button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange);" onclick="window.app.fmModule?.openNewVendorContract()">
                                <i class="fas fa-truck-loading"></i> New Rental Contract
                               </button>`
                          )
                    }
                </div>
                
                <div class="tabs" style="margin-bottom: 0; padding: 0 24px; border-bottom: 1px solid var(--slate-200);">
                    <div class="tab ${this.currentContractTab === "project" ? "active" : ""}" data-tab="project" onclick="window.app.fmModule.switchContractTab('project')">Project Contracts</div>
                    <div class="tab ${this.currentContractTab === "vendor" ? "active" : ""}" data-tab="vendor" onclick="window.app.fmModule.switchContractTab('vendor')">Vendor Contracts</div>
                    <div class="tab ${this.currentContractTab === "rental" ? "active" : ""}" data-tab="rental" onclick="window.app.fmModule.switchContractTab('rental')">Vehicle Rentals</div>
                </div>
                
                <div style="padding: 16px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; gap: 16px;">
                    <select id="contract-project-filter" class="form-input" style="max-width: 250px;" onchange="window.app.fmModule.handleContractFilterChange()">
                        <option value="">All Projects</option>
                        <!-- Projects loaded dynamically -->
                    </select>
                    ${
                      this.currentContractTab === "vendor"
                        ? `
                    <select id="contract-vendor-filter" class="form-input" style="max-width: 250px;" onchange="window.app.fmModule.handleContractFilterChange()">
                        <option value="">All Vendors</option>
                        <!-- Vendors loaded dynamically -->
                    </select>
                    `
                        : ""
                    }
                </div>

                <div id="contracts-table-container">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                        <div>Loading contracts...</div>
                    </div>
                </div>
            </div>
        `;
  },

  switchContractTab(tab) {
    this.currentContractTab = tab;
    localStorage.setItem("mcms_contract_tab", tab);
    this.projectFilter = "";
    this.vendorFilter = "";
    if (window.app) window.app.loadPage("contracts");
  },

  handleContractFilterChange() {
    this.projectFilter =
      document.getElementById("contract-project-filter")?.value || "";
    if (this.currentContractTab === "vendor") {
      this.vendorFilter =
        document.getElementById("contract-vendor-filter")?.value || "";
    }
    this.renderContractsTable();
  },

  async loadContractsData() {
    const container = document.getElementById("contracts-table-container");
    if (!container) return;

    try {
      // Load filters data
      client
        .get("/projects?limit=50")
        .then((res) => {
          const projectsData = Array.isArray(res) ? res : res.data || [];
          const select = document.getElementById("contract-project-filter");
          if (select) {
            projectsData.forEach((p) => {
              const opt = document.createElement("option");
              opt.value = p.id;
              opt.textContent = p.name;
              if (this.projectFilter == p.id) opt.selected = true;
              select.appendChild(opt);
            });
          }
        })
        .catch((e) => console.error("Error loading projects for filter", e));

      // Load contracts
      const response = await contracts.getAll({ limit: 20 });
      const data = response.data || response;
      const allContracts = Array.isArray(data) ? data : data.contracts || [];

      // Store raw contracts
      this.allContracts = allContracts;
      this._contractsMap = allContracts; // For legacy methods

      // Load Vehicle Rentals if on that tab
      if (this.currentContractTab === "rental") {
          const rentalRes = await window.vehicleRentalsApi.getAll();
          this.data.vehicleRentals = Array.isArray(rentalRes) ? rentalRes : (rentalRes.data || []);
      }

      // Populate vendor filter dynamically from contracts
      if (this.currentContractTab === "vendor") {
        const vendorSelect = document.getElementById("contract-vendor-filter");
        if (vendorSelect) {
          const uniqueVendors = new Map();
          allContracts.forEach((c) => {
            if (c.vendorId) {
              uniqueVendors.set(
                c.vendorId,
                c.vendor?.name || c.vendorName || `Vendor ${c.vendorId}`,
              );
            }
          });
          vendorSelect.innerHTML = '<option value="">All Vendors</option>';
          uniqueVendors.forEach((name, id) => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = name;
            if (this.vendorFilter == id) opt.selected = true;
            vendorSelect.appendChild(opt);
          });
        }
      }

      this.renderContractsTable();
    } catch (error) {
      console.error("Failed to load contracts:", error);
      container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--red);">Failed to load contract registry.</div>`;
    }
  },

  renderContractsTable() {
    const container = document.getElementById("contracts-table-container");
    if (!container) return;

    if (this.currentContractTab === "rental") {
        return this.renderRentalsTable();
    }

    if (!this.allContracts || this.allContracts.length === 0) {
      container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-file-contract" style="font-size: 32px; margin-bottom: 12px;"></i><div>No contracts found in the repository.</div></div>`;
      return;
    }

    // Filter by tab type
    let filtered = this.allContracts.filter((c) => {
      if (this.currentContractTab === "vendor") {
        return (
          c.contractType === "supply" ||
          c.contractType === "vendor" ||
          (c.vendorId != null && c.contractType !== "rental" && c.contractType !== "RENTAL")
        );
      } else {
        return (
          c.contractType === "project" ||
          c.contractType === "client" ||
          (c.vendorId == null && c.projectId != null && c.contractType !== "rental" && c.contractType !== "RENTAL")
        );
      }
    });

    // Filter by project
    if (this.projectFilter) {
      filtered = filtered.filter((c) => c.projectId == this.projectFilter);
    }

    // Filter by vendor
    if (this.currentContractTab === "vendor" && this.vendorFilter) {
      filtered = filtered.filter((c) => c.vendorId == this.vendorFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-filter" style="font-size: 32px; margin-bottom: 12px;"></i><div>No contracts match the selected filters.</div></div>`;
      return;
    }

    const formatValue = (v) =>
      v ? (Number(v) / 1000000).toFixed(1) + "M" : "-";

    const rows = filtered
      .map((item) => {
        const endDate = item.endDate ? new Date(item.endDate) : null;
        const today = new Date();
        const daysLeft = endDate
          ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
          : null;
        const isEnded = daysLeft !== null && daysLeft <= 0;
        const isEndingSoon =
          daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

        let statusClass = item.status === "Active" ? "active" : "locked";
        if (isEnded) statusClass = "delayed";
        if (isEndingSoon) statusClass = "locked";

        return `
                <tr onclick="window.app.fmModule.viewContract(${item.id})">
                    <td><span class="project-id">${item.contractCode || "CON-" + item.id}</span></td>
                    <td>
                        <div style="font-weight: 600;">${item.title}</div>
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 500;">${item.vendor?.name || item.vendorName || "General"}</div>
                    </td>
                    <td>${item.project?.name || "Multi-Project"}</td>
                    <td style="font-family:'JetBrains Mono'; font-weight: 700;">${formatValue(item.value)}</td>
                    <td>
                        ${(() => {
                            try {
                                const materials = JSON.parse(item.materialsList || '[]');
                                const variance = materials.reduce((acc, m) => acc + (Number(m.variance) || 0), 0);
                                if (variance > 0) {
                                    return `<span style="color: var(--emerald); font-weight: 800; font-size: 12px;"><i class="fas fa-caret-down"></i> Saved MWK ${(variance/1000).toFixed(0)}k</span>`;
                                } else if (variance < 0) {
                                    return `<span style="color: var(--red); font-weight: 800; font-size: 12px;"><i class="fas fa-caret-up"></i> Over MWK ${(Math.abs(variance)/1000).toFixed(0)}k</span>`;
                                }
                                return `<span style="color: var(--slate-400); font-size: 11px;">On Market</span>`;
                            } catch (e) { return '-'; }
                        })()}
                    </td>
                    <td>
                        <span class="status ${statusClass}">${isEnded ? "ENDED" : (item.status || "Draft").toUpperCase()}</span>
                        ${isEndingSoon ? `<div style="font-size: 10px; color: var(--orange); font-weight: 600; margin-top: 4px;">Ends in ${daysLeft} days</div>` : ""}
                        ${(isEnded && !item.vendorRating) ? `<div style="font-size: 10px; color: var(--red); font-weight: 600; margin-top: 4px;">Action Required</div>` : ""}
                        ${(isEnded && item.vendorRating) ? `<div style="font-size: 10px; color: var(--emerald); font-weight: 600; margin-top: 4px;"><i class="fas fa-check-circle"></i> Performance Rated</div>` : ""}
                    </td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">View</button>
                    </td>
                </tr>
            `;
      })
      .join("");

    container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Ref</th>
                        <th>Title</th>
                        ${this.currentContractTab === "vendor" ? "<th>Vendor</th>" : ""}
                        <th>Value</th>
                        <th>Procurement Performance</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
  },

  async viewContract(id) {
    window.toast.show("Fetching contract details...", "info");
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const [contractRes, versionsRes] = await Promise.all([
        fetch(`/api/v1/contracts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/v1/contracts/${id}/versions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!contractRes.ok)
        throw new Error("Failed to fetch full contract details");
      const result = await contractRes.json();
      const contract = result.data || result;

      if (versionsRes.ok) {
        const versionsResult = await versionsRes.json();
        contract.versions = versionsResult.data || versionsResult || [];
      } else {
        contract.versions = [];
      }

      window.drawer.open(
        "Contract Details",
        window.DrawerTemplates.contractView(contract),
      );
    } catch (error) {
      console.error("View contract error:", error);
      const contract = this._contractsMap?.find((c) => c.id === id);
      if (contract) {
        window.drawer.open(
          "Contract Details",
          window.DrawerTemplates.contractView(contract),
        );
      } else {
        window.toast.show("Could not load contract details.", "error");
      }
    }
  },

  openUploadNewVersion(contractId, currentValue) {
    window.drawer.open(
      "New Contract Version",
      window.DrawerTemplates.contractUploadVersion({
        id: contractId,
        value: currentValue,
      }),
    );

    // Initialize file upload logic for the new drawer content
    setTimeout(() => {
      const dropZone = document.getElementById("v-drop-zone");
      const fileInput = document.getElementById("v-file-input");
      const status = document.getElementById("v-file-status");

      if (dropZone && fileInput) {
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 25 * 1024 * 1024) {
              window.toast.show("File size exceeds 25MB limit. Please upload a smaller PDF.", "error");
              e.target.value = "";
              status.innerHTML = `<span style="color: var(--red); font-weight: 700;">File too large (>25MB)</span>`;
              dropZone.style.borderColor = "var(--red)";
              return;
            }
            status.innerHTML = `<span style="color: var(--emerald);"><i class="fas fa-check-circle"></i> ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)</span>`;
            dropZone.style.borderColor = "var(--emerald)";
            dropZone.style.background = "#F0FDF4";
          }
        };
      }
    }, 100);
  },

  async onProjectContractSelected(projectId) {
    if (!projectId) return;
    const materialsBody = document.getElementById('contract-materials-body');
    if (!materialsBody) return;

    materialsBody.innerHTML = `<tr><td colspan="6" style="padding:24px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Analyzing material gaps...</td></tr>`;

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const resp = await fetch(`/api/v1/projects/${projectId}/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await resp.json();

      // API returns: { success: true, data: { project, budgetSummary, materials: [...] } }
      const payload = result.data || result;
      const materials = Array.isArray(payload) ? payload : (payload.materials || []);

      // Store budget from this response so we don't need a separate call
      if (payload.budgetSummary) {
        this.currentProjectBudget = payload.budgetSummary;
      }

      if (!materials || materials.length === 0) {
        materialsBody.innerHTML = `<tr><td colspan="6" style="padding:24px; text-align:center; color:var(--slate-400);">No baseline materials found for this project.</td></tr>`;
        return;
      }

      materialsBody.innerHTML = materials.map((m, idx) => {
        const contracted = m.contractedQuantity || 0;
        const required = m.quantity || 0;
        const gap = Math.max(0, required - contracted);
        const isSurplus = gap <= 0;
        const unitCost = m.unitCostHigh || 0;

        return `
          <tr style="border-bottom: 1px solid var(--slate-100); background: ${isSurplus ? '#f8fafc' : 'white'};">
            <td style="padding: 12px; text-align: center;">
              <input type="checkbox" name="contract_material" value="${idx}" 
                data-name="${m.name}" data-market="${unitCost}" data-unit="${m.unit || ''}"
                style="width: 16px; height: 16px; cursor: pointer;"
                onchange="(window.app?.pmModule || window.app?.fmModule || window.fmModule || window.pmModule)?.calculateContractPerformance()">
            </td>
            <td style="padding: 12px;">
              <div style="font-weight: 700; color: var(--slate-800);">${m.name}</div>
              <div style="font-size: 10px; color: var(--slate-500);">${m.unit || ''} • Rate: MWK ${unitCost.toLocaleString()}</div>
            </td>
            <td style="padding: 12px; text-align: center; color: var(--slate-600); font-weight: 600;">${required.toLocaleString()}</td>
            <td style="padding: 12px; text-align: center; color: var(--slate-400);">${contracted.toLocaleString()}</td>
            <td style="padding: 12px; text-align: center;">
               <span style="padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; background: ${isSurplus ? '#ecfdf5' : '#fff1f2'}; color: ${isSurplus ? '#059669' : '#e11d48'};">
                ${isSurplus ? 'SURPLUS' : 'GAP: ' + gap.toLocaleString()}
               </span>
            </td>
            <td style="padding: 12px; text-align: center;">
              <input type="number" id="m_qty_${idx}" class="form-input" 
                style="width: 70px; padding: 4px; font-size: 11px; text-align: center; font-weight: 700;" 
                value="${gap}" oninput="(window.app?.pmModule || window.app?.fmModule || window.fmModule || window.pmModule)?.calculateContractPerformance()">
            </td>
          </tr>
        `;
      }).join('');

      this.calculateContractPerformance();
    } catch (err) {
      console.error(err);
      materialsBody.innerHTML = `<tr><td colspan="6" style="padding:24px; text-align:center; color:var(--red);">Failed to load material requirements.</td></tr>`;
    }
  },



  async fetchBudgetStatus(projectId) {
    try {
        const token = localStorage.getItem("mcms_auth_token");
        const resp = await fetch(`/api/v1/projects/${projectId}/budget`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await resp.json();
        this.currentProjectBudget = result.data || result.budgetSummary || result;
        this.calculateContractPerformance();
    } catch (e) {
        console.warn("Failed to fetch project budget", e);
    }
  },

  async loadContractProjects(showAll = false) {
    const select = document.getElementById("contract_project");
    if (!select) return;
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch("/api/v1/projects?status=active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const projects = result.data || result.items || [];

      // If showAll is false, filter out projects that already have a master contract
      let filteredProjects = projects;
      if (!showAll) {
        const projectsWithMaster = new Set(
          (Array.isArray(this.allContracts) ? this.allContracts : [])
            .filter(c => c.contractType === 'project' || c.contractType === 'client')
            .map(c => c.projectId)
        );
        filteredProjects = projects.filter(p => !projectsWithMaster.has(p.id));
      }

      select.innerHTML =
        '<option value="">Select a project...</option>' +
        filteredProjects
          .map((p) => `<option value="${p.id}">${p.code} – ${p.name}</option>`)
          .join("");
    } catch (err) {
      console.error(err);
    }
  },

  openNewVendorContract() {
    this.currentContractTab = localStorage.getItem("mcms_contract_tab") || this.currentContractTab || "project";
    const isRental = this.currentContractTab === "rental";
    
    window.drawer.open(
      isRental ? "Vehicle Rental Agreement" : "New Vendor Contract",
      isRental ? window.DrawerTemplates.newRentalContract : window.DrawerTemplates.newVendorContract,
      'lg'
    );
    
    setTimeout(() => {
      this.loadContractProjects(true);
      this.initContractUpload();
    }, 100);
  },

  openNewProjectContract() {
    window.drawer.open(
      "Archive Project Master Contract",
      window.DrawerTemplates.newProjectContract,
      'lg'
    );
    setTimeout(() => {
      this.loadContractProjects();
      this.initContractUpload(); // Reuse existing upload init
    }, 100);
  },

  async submitProjectContract() {
    console.log("[DEBUG] FD_Contracts: submitProjectContract started");
    
    // Validation
    if (window.V && !window.V.validateForm(document.getElementById('drawer-content') || document.body)) {
      console.warn("[DEBUG] FD_Contracts: Validation failed");
      return;
    }

    const projectSelect = document.getElementById("contract_project");
    const projectId = projectSelect?.value;
    const projectLabel = projectSelect?.options[projectSelect.selectedIndex]?.textContent || "";
    const projectCode = projectLabel.split("–")[0]?.trim() || "PRJ";

    const fileInput = document.getElementById("contract_document");
    const file = fileInput?.files?.[0];

    if (!file) {
      window.toast.show("Please upload the signed master agreement document.", "error");
      return;
    }

    // Auto-generate refCode since the template has no contract_ref input
    const refCode = `MOW-${projectCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const title = document.getElementById("contract_title")?.value?.trim() || "Project Master Agreement";
    const value = parseFloat(document.getElementById("contract_value")?.value);
    const startDate = document.getElementById("contract_start")?.value;
    const endDate = document.getElementById("contract_end")?.value;
    const justification = document.getElementById("contract_justification")?.value?.trim();

    if (!projectId || isNaN(value) || !justification) {
      window.toast.show("Please fill all required project contract fields", "warning");
      return;
    }

    window.toast.show("Archiving master agreement...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const formData = new FormData();
      
      formData.append("projectId", projectId);
      formData.append("refCode", refCode);
      formData.append("title", title);
      formData.append("value", value);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("justification", justification);
      formData.append("contractType", "project");
      formData.append("document", file);

      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.message || "Failed to archive project contract");
      }

      window.toast.show("Project Master Contract Archived successfully", "success");
      window.drawer.close();
      this.loadContractsData();

      // Audit Log
      client.post("/audit-logs", {
        action: "CONTRACT_ARCHIVED",
        targetType: "CONTRACT",
        targetId: result.data?.id || result.id,
        details: { title, projectId, refCode, value }
      }).catch(e => console.warn("Audit failed", e));

      // Notifications
      const projectName = (this.allContracts || []).find(c => c.projectId == projectId)?.project?.name || "the project";
      this.broadcastContractEvent("Master Agreement Archived", 
        `New Master Contract archived for project "${projectName}" by ${window.currentUser?.name || 'Finance Director'}. Value: MWK ${value.toLocaleString()}.`,
        projectId,
        ["Project Manager", "Finance Director", "Equipment Coordinator"]
      );
    } catch (err) {
      window.toast.show(err.message, "error");
    }
  },

  async broadcastContractEvent(title, message, projectId, roles = [], excludeRoles = []) {
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const payload = {
        title,
        message,
        roles,
        priority: "high",
        type: "contract",
        isEmail: true
      };

      // Resolve Field Supervisor if projectId is provided
      if (projectId) {
        const projectRes = await fetch(`/api/v1/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          const project = projectData.data || projectData;
          if (project.fieldSupervisorId) {
            payload.users = [project.fieldSupervisorId];
          }
        }
      }

      await client.post("/notifications/broadcast", payload);
    } catch (err) {
      console.warn("Notification broadcast failed", err);
    }
  },

  async submitNewVersion(contractId) {
    const notes = document.getElementById("v-change-notes")?.value;
    const fileInput = document.getElementById("v-file-input");
    const newValueInput = document.getElementById("v-new-amount");
    const file = fileInput?.files[0];

    if (!notes || notes.length < 5) {
      window.toast.show("Please provide descriptive change notes.", "error");
      return;
    }

    if (!file) {
      window.toast.show("Please select a contract document (PDF).", "error");
      return;
    }

    window.toast.show("Uploading new version...", "info");

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("changeNotes", notes);

      if (newValueInput && newValueInput.value) {
        formData.append("value", parseFloat(newValueInput.value));
      }

      const token = localStorage.getItem("mcms_auth_token");
      const response = await fetch(`/api/v1/contracts/${contractId}/versions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      window.toast.show("New version uploaded successfully!", "success");
      window.drawer.close();
      // Refresh the view
      this.viewContract(contractId);
      this.loadContractsData();

      // Audit Log
      client.post("/audit-logs", {
        action: "CONTRACT_VERSION_CREATED",
        targetType: "CONTRACT",
        targetId: contractId,
        details: { notes, newValue: newValueInput?.value }
      }).catch(e => console.warn("Audit failed", e));

      // Notifications
      const contract = (this.allContracts || []).find(c => c.id == contractId);
      const materials = contract?.items?.map(i => i.materialName).join(", ") || "General Services";
      this.broadcastContractEvent("Contract Version Committed", 
        `Revision committed for "${contract?.title || 'Contract'}" (Materials: ${materials}) by ${window.currentUser?.name || 'Finance Director'}. Change: ${notes}`,
        contract?.projectId, 
        ["Project Manager", "Finance Director", "Equipment Coordinator"]
      );
    } catch (error) {
      window.toast.show("Failed to upload version: " + error.message, "error");
    }
  },

  // Using global window.viewDocument and window.downloadDocument instead

  async loadContractProjects(isVendor = false) {
    const select = document.getElementById("contract_project");
    if (!select) return;
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch("/api/v1/projects?status=active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const projects = result.data || result.items || [];
      
      let filteredProjects = projects;

      // Only filter for Master Contract creation. 
      // Vendor contracts can be created for any project, even those with existing contracts.
      if (!isVendor) {
        const projectsWithMaster = new Set(
          (this.allContracts || [])
            .filter(c => c.contractType === 'project' || c.contractType === 'client')
            .map(c => c.projectId)
        );
        filteredProjects = projects.filter(p => !projectsWithMaster.has(p.id));
      }

      select.innerHTML =
        '<option value="">Select a project...</option>' +
        filteredProjects
          .map((p) => `<option value="${p.id}" ${this.projectFilter == p.id ? 'selected' : ''}>${p.code} – ${p.name}</option>`)
          .join("");
    } catch (err) {
      console.error(err);
    }
  },

  initContractUpload() {
    const dropZone = document.getElementById("contract-drop-zone");
    const fileInput = document.getElementById("contract_document");
    const status = document.getElementById("contract-file-status");
    if (!dropZone || !fileInput) return;
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      if (e.target.files[0]) {
        status.innerHTML = `<span style="color: var(--emerald); font-size: 12px;"><i class="fas fa-check-circle"></i> ${e.target.files[0].name}</span>`;
        dropZone.style.borderColor = "var(--emerald)";
      }
    };

    const valueInput = document.getElementById("contract_value");
    if (valueInput) {
      valueInput.oninput = () => this.calculateContractPerformance();
    }
  },

  async submitContract() {
    const isRental = !!document.getElementById('contract-vehicles-body');
    const formContainer = document.querySelector('.drawer-content') || document.body;
    
    // 1. Full Form Validation using global Validator
    if (window.V && !window.V.validateForm(formContainer)) {
      window.toast.show("Please correct the highlighted errors.", "warning");
      return;
    }

    // 2. Extract Items (Materials or Equipment)
    const selectedCheckboxes = document.querySelectorAll('input[name="contract_material"]:checked');
    if (selectedCheckboxes.length === 0) {
      window.toast.show(`Please select at least one ${isRental ? 'machine' : 'material'} to include.`, "error");
      return;
    }

    const items = Array.from(selectedCheckboxes).map(cb => {
      const idx = cb.value;
      const qtyInput = document.getElementById(`m_qty_${idx}`);
      const units = parseFloat(qtyInput?.value || 1);
      const start = new Date(document.getElementById("contract_start")?.value);
      const end = new Date(document.getElementById("contract_end")?.value);
      
      let effectiveQty = units;
      if (isRental && !isNaN(start) && !isNaN(end) && end >= start) {
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          effectiveQty = units * days;
      }

      return {
        materialName: cb.dataset.name,
        quantity: effectiveQty,
        unit: cb.dataset.unit || (isRental ? 'Day' : 'Unit'),
        unitPrice: parseFloat(cb.dataset.market || 0)
      };
    });

    // 3. Document Check
    const fileInput = document.getElementById("contract_document");
    if (!fileInput?.files?.[0]) {
      window.toast.show("Signed agreement document is required.", "error");
      return;
    }

    const contractValue = parseFloat(document.getElementById("contract_value")?.value || 0);
    
    // 4. Budget Check
    const remainingBudget = Number(this.currentProjectBudget?.remaining || 0);
    if (contractValue > remainingBudget && remainingBudget > 0) {
        window.modal.confirm(
            "Budget Exceeded",
            `This contract (MWK ${contractValue.toLocaleString()}) exceeds the available project budget (Remaining: MWK ${remainingBudget.toLocaleString()}). Do you want to override and proceed anyway?`,
            () => this.executeSubmitContract(isRental, items, contractValue)
        );
    } else {
        this.executeSubmitContract(isRental, items, contractValue);
    }
  },

  async executeSubmitContract(isRental, items, contractValue) {
    window.toast.show("Archiving contract...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const formData = new FormData();
      
      const fileInput = document.getElementById("contract_document");
      const projectId = document.getElementById("contract_project")?.value;

      formData.append("projectId", projectId);
      formData.append("vendorName", document.getElementById("contract_vendor")?.value);
      const vId = document.getElementById("contract_vendor_id")?.value;
      if (vId) formData.append("vendorId", vId);
      formData.append("vendorPhone", document.getElementById("contract_vendor_phone")?.value || "");
      formData.append("title", document.getElementById("contract_title")?.value);
      formData.append("value", contractValue);
      formData.append("startDate", document.getElementById("contract_start")?.value);
      formData.append("endDate", document.getElementById("contract_end")?.value);
      formData.append("justification", document.getElementById("contract_justification")?.value);
      formData.append("contractType", isRental ? "rental" : "procurement");
      formData.append("items", JSON.stringify(items));
      formData.append("materialsList", JSON.stringify(items));
      
      if (fileInput.files[0]) {
        formData.append("document", fileInput.files[0]);
      }
      
      const refCode = document.getElementById("contract_ref")?.value || 
                      (isRental ? 'REN' : 'VND') + "-MOW-" + Math.floor(1000 + Math.random() * 9000);
      formData.append("refCode", refCode);

      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Submission failed");
      }

      window.toast.show("Contract successfully established & archived", "success");
      window.drawer.close();
      if (this.loadContractsData) this.loadContractsData();
      
      // Audit Log
      client.post("/audit-logs", {
        action: "CONTRACT_CREATED",
        targetType: "CONTRACT",
        details: { 
          type: isRental ? 'RENTAL' : 'VENDOR', 
          projectId, 
          value: contractValue,
          title: document.getElementById("contract_title")?.value
        }
      }).catch(e => console.warn("Audit failed", e));

      // Notifications
      const title = document.getElementById("contract_title")?.value;
      const vendor = document.getElementById("contract_vendor")?.value;
      this.broadcastContractEvent(
        isRental ? "Rental Contract Established" : "Vendor Contract Established",
        `New ${isRental ? 'Rental' : 'Vendor'} contract established with "${vendor}" for project context. Title: ${title}. Total Value: MWK ${contractValue.toLocaleString()}.`,
        projectId,
        ["Project Manager", "Finance Director", "Equipment Coordinator"]
      );

    } catch (err) {
      window.toast.show(err.message, "error");
    }
  },

  async handleSubmitUplift() {
    const data = {
      projectId: parseInt(document.getElementById("bcr_project")?.value),
      amount: parseFloat(document.getElementById("bcr_amount")?.value),
      reason: document.getElementById("bcr_reason")?.value,
      requesterId: window.app.currentUser?.id,
    };

    if (!data.projectId || !data.amount || !data.reason) {
      window.toast.show(
        "Please provide project, amount and justification.",
        "warning",
      );
      return;
    }

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch("/api/v1/budget-changes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit uplift request");

      window.toast.show(
        "Budget Uplift Request sent to PM for approval",
        "success",
      );
      window.drawer.close();

      // Optionally refresh view or dashboard
      if (this.currentView === "procurement") this.loadProcurementData();
    } catch (err) {
      window.toast.show(err.message, "error");
    }
  },

  async notifyLogistics(contractId, refCode) {
    window.toast.show(`Notifying Logistics about ${refCode}...`, "info");
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch("/api/v1/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole: "Equipment_Coordinator",
          type: "PROCUREMENT_READY",
          title: "New Procurement Ready",
          message: `Contract ${refCode} has been finalized. Materials are now ready for intake and logistics planning.`,
          contractId: contractId,
        }),
      });
      if (!res.ok) throw new Error("Failed to send notification");
      window.toast.show("Logistics department notified", "success");
    } catch (err) {
      window.toast.show("Error notifying logistics: " + err.message, "error");
    }
  },

  openEditContractDrawer(contract) {
    window.drawer.open(
      "Contract Revision & Versioning",
      window.DrawerTemplates.editContract(contract),
    );

    setTimeout(() => {
      const drawerEl = document.querySelector('.drawer-content');
      if (drawerEl && window.V) {
        window.V.attachListeners(drawerEl);
      }

      const dropZone = document.getElementById("v-drop-zone");
      const fileInput = document.getElementById("v-file-input");
      const status = document.getElementById("v-file-status");

      if (dropZone && fileInput) {
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const sizeMB = file.size / 1024 / 1024;
            if (sizeMB > 25) {
              window.toast?.show('Document size exceeds 25MB limit', 'error');
              fileInput.value = '';
              status.innerHTML = `<span style="color: var(--red);"><i class="fas fa-times-circle"></i> File too large (${sizeMB.toFixed(2)}MB)</span>`;
              dropZone.style.borderColor = "var(--red)";
              dropZone.style.background = "#FEF2F2";
              return;
            }
            status.innerHTML = `<span style="color: var(--emerald);"><i class="fas fa-check-circle"></i> ${file.name} (${sizeMB.toFixed(2)}MB)</span>`;
            dropZone.style.borderColor = "var(--emerald)";
            dropZone.style.background = "#F0FDF4";
          }
        };
      }
    }, 100);
  },

  async submitContractUpdate(contractId) {
    const drawerEl = document.querySelector('.drawer-content');
    if (window.V && !window.V.validateForm(drawerEl)) {
      window.toast?.show('Please resolve the validation errors.', 'warning');
      return;
    }

    try {
      const fileInput = document.getElementById("v-file-input");
      const file = fileInput?.files[0];
      const notes = document.getElementById("edit_contract_notes").value;

      const formData = new FormData();
      formData.append("value", parseFloat(document.getElementById("edit_contract_value").value));
      formData.append("status", document.getElementById("edit_contract_status").value);
      formData.append("startDate", document.getElementById("edit_contract_start").value || "");
      formData.append("endDate", document.getElementById("edit_contract_end").value || "");
      formData.append("changeNotes", notes);
      
      if (file) {
        formData.append("document", file);
      }

      window.toast.show("Committing revision & version...", "info");
      const token = localStorage.getItem("mcms_auth_token");
      
      const res = await fetch(`/api/v1/contracts/${contractId}/versions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
      }

      window.toast.show("Contract revised and new version committed", "success");
      window.drawer.close();

      // Refresh the table first
      await this.loadContractsData();

      // Then re-open the viewer with fresh data if needed
      setTimeout(() => this.viewContract(contractId), 300);
    } catch (err) {
      window.toast.show(err.message, "error");
    }
  },

  loadContractsView() {
    this.currentView = "contracts";
    this.switchView("contracts");
  },

  // ============================================
  // Vendor Autocomplete & Rating
  // ============================================
  
  async searchVendors(query) {
    const resultsContainer = document.getElementById("vendor_autocomplete_results");
    if (!resultsContainer) return;

    if (!query || query.length < 2) {
      resultsContainer.style.display = "none";
      return;
    }

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/vendors/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      const vendors = result.data || result;

      if (vendors.length === 0) {
        resultsContainer.innerHTML = `
          <div style="padding: 12px; text-align: center; color: var(--slate-500); font-size: 12px;">
            <i class="fas fa-plus-circle" style="color: var(--orange); margin-bottom: 4px;"></i><br>
            No matches found.<br>
            <strong>"${query}"</strong> will be created as a new vendor.
          </div>
        `;
        resultsContainer.style.display = "block";
        document.getElementById("contract_vendor_id").value = "";
        return;
      }

      resultsContainer.innerHTML = vendors.map(v => `
        <div style="padding: 12px; border-bottom: 1px solid var(--slate-100); cursor: pointer; transition: background 0.2s;" 
             onmouseover="this.style.backgroundColor='var(--slate-50)'" 
             onmouseout="this.style.backgroundColor='transparent'"
             onmousedown="(window.app.fmModule || window.app.pmModule).selectVendorAutocomplete(${v.id}, '${v.name.replace(/'/g, "\\'")}', '${v.phone || ''}')">
          <div style="font-weight: 700; color: var(--slate-800); font-size: 13px;">${v.name}</div>
          <div style="display: flex; gap: 12px; font-size: 11px; color: var(--slate-500); margin-top: 4px;">
            ${v.phone ? `<span><i class="fas fa-phone"></i> ${v.phone}</span>` : ''}
            <span><i class="fas fa-file-contract"></i> ${v.contractCount || 0} contracts</span>
            ${v.avgRating ? `<span style="color: var(--orange);"><i class="fas fa-star"></i> ${v.avgRating}</span>` : ''}
          </div>
        </div>
      `).join('');
      
      resultsContainer.style.display = "block";
    } catch (e) {
      console.error('Vendor search error', e);
    }
  },

  selectVendorAutocomplete(id, name, phone) {
    const nameInput = document.getElementById("contract_vendor");
    const idInput = document.getElementById("contract_vendor_id");
    const phoneInput = document.getElementById("contract_vendor_phone");
    const resultsContainer = document.getElementById("vendor_autocomplete_results");

    if (nameInput) {
      nameInput.value = name;
      // Manually trigger events so validator and listeners see the change
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.V) window.V.checkField(nameInput);
    }

    if (idInput) {
      idInput.value = id;
    }

    if (phoneInput) {
      phoneInput.value = phone || "";
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (window.V && phone) window.V.checkField(phoneInput);
    }

    if (resultsContainer) {
      resultsContainer.style.display = "none";
    }
  },

  async submitVendorRating(contractId) {
    const ratingInput = document.querySelector('input[name="vendor_rating"]:checked');
    const commentInput = document.getElementById("vendor_rating_comment");
    
    if (!ratingInput) {
      window.toast.show("Please select a star rating.", "error");
      return;
    }

    const data = {
      rating: parseInt(ratingInput.value, 10),
      comment: commentInput?.value || ""
    };

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/contracts/${contractId}/rate`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit rating");
      }

      window.toast.show("Vendor performance rating saved successfully", "success");
      window.drawer.close();
      this.loadContractsData();
      
      // Audit Log
      client.post("/audit-logs", {
        action: "VENDOR_RATED",
        targetType: "CONTRACT",
        targetId: contractId,
        details: { rating: data.rating, comment: data.comment, rater: window.currentUser?.name }
      }).catch(e => console.warn("Audit failed", e));

      // Notifications - ONLY FD and PM as requested
      const contract = (this.allContracts || []).find(c => c.id == contractId);
      const materials = contract?.items?.map(i => i.materialName).join(", ") || "General Services";
      this.broadcastContractEvent("Vendor Performance Rated", 
        `${window.currentUser?.name || 'Finance Director'} has rated the vendor for "${contract?.title || 'Contract'}" (Materials: ${materials}). Rating: ${data.rating} Stars.`,
        contract?.projectId,
        ["Project Manager", "Finance Director"]
      );

      // If we're coming from the Records module, reload that too
      if (window.app.currentModule === "records" && window.app.recordsModule) {
        window.app.recordsModule.loadVendorsData();
      }
    } catch (e) {
      window.toast.show(e.message, "error");
    }
  },

  openTerminateContractDrawer(contract) {
    const isExpired = contract.status === 'expired' || (contract.endDate && new Date(contract.endDate) <= new Date());
    window.drawer.open(
      `${isExpired ? 'Contract Closure' : 'Contract Termination'}: ${contract.refCode}`,
      window.DrawerTemplates.terminateContract(contract)
    );
  },

  async submitTermination(contractId) {
    // Validation check using V utility
    if (window.V && !window.V.validateForm(document.getElementById('drawer-content') || document.body)) {
      return;
    }


    const reason = document.getElementById("term_reason")?.value;

    // Collect received quantities
    const receivedItems = [];
    const qtyInputs = document.querySelectorAll('.term-received-qty');
    qtyInputs.forEach(input => {
      receivedItems.push({
        id: parseInt(input.dataset.itemId, 10),
        receivedQty: parseFloat(input.value || 0)
      });
    });

    try {
      const contract = (this.allContracts || []).find(c => c.id == contractId);
      const isExpired = contract?.status === 'expired' || (contract?.endDate && new Date(contract.endDate) <= new Date());
      
      window.toast.show(isExpired ? "Finalizing contract closure..." : "Finalizing contract termination...", "info");
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/contracts/${contractId}/terminate`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason, receivedItems })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${isExpired ? 'close' : 'terminate'} contract`);
      }

      window.toast.show(isExpired ? "Contract successfully closed and reconciled." : "Contract terminated. Remaining funds and materials returned to project.", "success");
      window.drawer.close();
      await this.loadContractsData();

      // Audit Log
      client.post("/audit-logs", {
        action: isExpired ? "CONTRACT_CLOSED" : "CONTRACT_TERMINATED",
        targetType: "CONTRACT",
        targetId: contractId,
        details: { reason, type: isExpired ? 'Closure' : 'Termination' }
      }).catch(e => console.warn("Audit failed", e));

      // Notifications
      const materials = contract?.items?.map(i => i.materialName).join(", ") || "General Services";
      this.broadcastContractEvent(isExpired ? "Contract Closed" : "Contract Terminated", 
        `"${contract?.title || 'Contract'}" has been ${isExpired ? 'formally closed' : 'terminated'} by ${window.currentUser?.name || 'Finance Director'}. ${isExpired ? 'Final Reconciliation' : 'Reason'}: ${reason}`,
        contract?.projectId,
        ["Project Manager", "Finance Director"]
      );
      
      // If we're in the Ledger, reload to reflect budget changes
      if (window.app.currentModule === "ledger" && window.app.fmModule) {
        window.app.fmModule.loadLedgerData();
      }
    } catch (e) {
      window.toast.show(e.message, "error");
    }
  },

  async completeContract(contractId) {
    const contract = (this.allContracts || []).find(c => c.id == contractId);
    
    window.modal.confirm(
      "Mark as 100% Completed?",
      `Are you sure you want to formally complete <strong>${contract?.refCode || 'this contract'}</strong>? This will close the agreement and lock it for further changes.`,
      () => this.executeCompleteContract(contractId)
    );
  },

  async executeCompleteContract(contractId) {
    try {
      window.toast.show("Processing completion...", "info");
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/contracts/${contractId}/complete`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to complete contract");
      }

      window.toast.show("Contract successfully marked as completed.", "success");
      window.drawer.close();
      await this.loadContractsData();

      // Audit Log handled by backend service

      // Notifications
      const contract = (this.allContracts || []).find(c => c.id == contractId);
      this.broadcastContractEvent("Contract Completed", 
        `"${contract?.title || 'Contract'}" has been successfully completed and 100% fulfilled.`,
        contract?.projectId,
        ["Project Manager", "Finance Director"]
      );
      
    } catch (e) {
      window.toast.show(e.message, "error");
    }
  },


  renderRentalsTable() {
    const container = document.getElementById("contracts-table-container");
    const requisitions = this.data.vehicleRentals || [];
    const finalizedRentals = (this.allContracts || []).filter(c => c.contractType === 'rental' || c.contractType === 'RENTAL');
    const rentals = [...requisitions, ...finalizedRentals];

    if (rentals.length === 0) {
      container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--slate-400);"><i class="fas fa-truck-pickup" style="font-size: 32px; margin-bottom: 12px;"></i><div>No vehicle rental requisitions or contracts found.</div></div>`;
      return;
    }

    const rows = rentals
      .map((item) => {
        let statusClass = "locked";
        if (item.status === "Approved" || item.status === "Active" || item.status === "active") statusClass = "active";
        if (item.status === "Rejected") statusClass = "delayed";
        if (item.status === "Pending" || item.status === "Draft") statusClass = "locked";
        if (item.endDate && new Date(item.endDate) <= new Date()) statusClass = "delayed";

        const machineName = item.machineType || item.title || "Rental Equipment";
        const rate = item.dailyRate || item.value || 0;
        const duration = item.durationDays || (item.startDate && item.endDate ? Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) : "N/A");

        return `
                <tr onclick="window.app.fmModule.viewContract(${item.id})">
                    <td><span class="project-id">${item.refCode || item.contractCode || item.code || "RENT-" + item.id}</span></td>
                    <td>
                        <div style="font-weight: 600;">${machineName}</div>
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 500;">${item.vendorName || item.vendor?.name || "Unassigned"}</div>
                    </td>
                    <td>${item.project?.name || "Multiple"}</td>
                    <td style="font-family:'JetBrains Mono'; font-weight: 700;">MWK ${Number(rate).toLocaleString()}/day</td>
                    <td>${duration} Days</td>
                    <td>
                        <span class="status ${statusClass}">${(item.status || "Active").toUpperCase()}</span>
                    </td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">Review</button>
                    </td>
                </tr>
            `;
      })
      .join("");

    container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Ref</th>
                        <th>Machine Type</th>
                        <th>Project</th>
                        <th>Rate</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
  },

  async onProjectRentalSelected(projectId) {
    if (!projectId) return;

    const vehiclesBody = document.getElementById("contract-vehicles-body");
    const refInput = document.getElementById("contract_ref");
    
    // Auto-generate Ref Code
    if (refInput) {
        const random = Math.floor(1000 + Math.random() * 9000);
        refInput.value = `REN-MOW-${random}`;
    }

    if (vehiclesBody) {
      vehiclesBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Synchronizing project context...</td></tr>`;
      
      try {
        const token = localStorage.getItem("mcms_auth_token");
        // Fetch estimate, budget, and equipment gaps
        const [estRes, budgetRes, gapRes] = await Promise.all([
          fetch(`/api/v1/projects/${projectId}/estimate`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/v1/projects/${projectId}/materials`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/v1/road-estimation/${projectId}/equipment-gap`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const estimate = await estRes.json();
        const budgetData = await budgetRes.json();
        const gapData = await gapRes.json();
        
        // Store budget for calculation check
        this.currentProjectBudget = budgetData.data?.budgetSummary || budgetData.budgetSummary || {};
        
        // Standardized Budget Bar
        const budgetContainer = document.getElementById("contract-budget-status");
        if (budgetContainer && this.currentProjectBudget) {
            const remaining = Number(this.currentProjectBudget.remaining || 0);
            const spent = Number(this.currentProjectBudget.spent || 0);
            const percent = Number(this.currentProjectBudget.percentUsed || 0);
            
            budgetContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Available Funds</div>
                        <div id="contract_available_funds" style="font-size: 18px; font-weight: 900; color: ${remaining < 1000000 ? 'var(--red)' : 'var(--slate-900)'};">MWK ${remaining.toLocaleString()}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Utilization</div>
                        <div id="contract_utilization_percent" style="font-size: 18px; font-weight: 900; color: ${percent > 90 ? 'var(--red)' : 'var(--emerald)'};">${percent}%</div>
                    </div>
                </div>
                <div style="height: 8px; background: var(--slate-100); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                    <div id="contract_utilization_bar" style="height: 100%; width: ${percent}%; background: ${percent > 90 ? 'var(--red)' : 'var(--emerald)'}; transition: width 0.3s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span id="contract_spent_display" style="color: var(--slate-500);">Spent: MWK ${spent.toLocaleString()}</span>
                    <span id="contract_safety_display" style="color: ${percent > 90 ? 'var(--red)' : 'var(--emerald)'}; font-weight: 600;">${percent > 90 ? 'Over Budget' : (100 - percent).toFixed(0) + '% Safe'}</span>
                </div>
            `;
        }
        
        // Use real equipment gaps from the project plan
        const payload = gapData.data || gapData;
        let gaps = [];
        if (payload.needsRental) gaps = payload.needsRental;
        else if (Array.isArray(payload)) gaps = payload;
        else if (payload.data && Array.isArray(payload.data)) gaps = payload.data;

        if (!gaps || gaps.length === 0) {
          vehiclesBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--slate-400);">No equipment gaps identified for this project.</td></tr>`;
        } else {
          vehiclesBody.innerHTML = gaps.map((v, idx) => {
            const name = v.label || v.name || v.type;
            const rate = v.dailyRate || v.rate || 0;
            const totalRequired = v.estimatedDays || 1; 

            return `
              <tr style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 12px 10px; text-align: center;">
                  <input type="checkbox" name="contract_material" value="${idx}" data-market="${rate}" data-gap="${totalRequired}" data-name="${name}" data-unit="Day"
                    style="width: 16px; height: 16px;"
                    onchange="const cbs = document.querySelectorAll('input[name=\\'contract_material\\']'); cbs.forEach(cb => { if(cb !== this) cb.checked = false; }); window.app.fmModule.calculateContractPerformance()">
                </td>
                <td style="padding: 12px 10px;">
                  <div style="font-weight: 700; color: var(--slate-800);">${name}</div>
                  <div style="font-size: 10px; color: var(--slate-500);">Market: MWK ${rate.toLocaleString()}/day</div>
                </td>
                <td style="padding: 12px 10px; text-align: center;">
                  <div id="rental_days_display_${idx}" style="font-weight: 700; color: var(--slate-800);">0 Days</div>
                  <div style="font-size: 10px; color: var(--slate-500);">Est: ${totalRequired} Days</div>
                </td>
                <td style="padding: 12px 10px; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <input type="number" id="m_qty_${idx}" class="form-input" 
                      style="width: 60px; padding: 4px; font-size: 11px; text-align: center; font-weight: 700;" 
                      value="1" min="1" oninput="window.app.fmModule.calculateContractPerformance()">
                    <span style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Unit(s)</span>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      } catch (err) {
        vehiclesBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--red);">Failed to load fleet catalog.</td></tr>`;
      }
    }

    // Sync project details (dates/budget)
    this.handleProjectSelectChange(projectId);
  },

  handleProjectSelectChange(projectId) {
    if (!projectId) return;
    // Populate project dates or budgets if needed in the UI
    console.log("Project context switched to:", projectId);
    
    const token = localStorage.getItem("mcms_auth_token");
    fetch(`/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(p => {
        const titleInput = document.getElementById("contract_title");
        if (titleInput && !titleInput.value) {
            titleInput.value = `Rental for ${p.name || projectId}`;
        }
    })
    .catch(e => console.warn("Failed to sync project context", e));
  },

  calculateContractPerformance() {
    const checkboxes = document.querySelectorAll('input[name="contract_material"]:checked');
    let marketTotal = 0;

    // Sum market value from checked materials (qty * unit cost)
    checkboxes.forEach(cb => {
      const index = cb.value;
      const qtyInput = document.getElementById(`m_qty_${index}`);
      const qty = parseFloat(qtyInput?.value || 0);
      const marketPrice = parseFloat(cb.dataset.market || 0);
      marketTotal += qty * marketPrice;
    });

    // Handle Rental Duration Multiplier & Row Updates
    if (this.currentContractTab === "rental") {
      const startInput = document.getElementById("contract_start");
      const endInput = document.getElementById("contract_end");
      let diffDays = 0;
      
      if (startInput?.value && endInput?.value) {
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);
        const diffTime = end - start;
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
        
        if (diffDays <= 0) {
            window.toast.show("Demobilization date must be after mobilization", "warning");
            diffDays = 0;
        }
      }

      // Update individual row day displays and validate against gap
      checkboxes.forEach(cb => {
          const index = cb.value;
          const display = document.getElementById(`rental_days_display_${index}`);
          const gap = parseFloat(cb.dataset.gap || 9999);
          
          if (display) {
              display.textContent = `${diffDays} Day${diffDays === 1 ? '' : 's'}`;
              
              if (diffDays > gap) {
                  display.style.color = 'var(--red)';
                  display.innerHTML += ` <span style="font-size:10px; display:block; color:var(--red); font-weight:700;"><i class="fas fa-exclamation-circle"></i> Exceeds Gap (${gap})</span>`;
                  window.toast.show(`Contract duration (${diffDays} days) exceeds required gap (${gap} days) for this machine.`, "error");
              } else {
                  display.style.color = diffDays > 0 ? 'var(--emerald)' : 'var(--slate-400)';
              }
          }
      });

      if (diffDays > 0) {
        marketTotal *= diffDays;
      }
    }

    const valueInput = document.getElementById("contract_value");
    const negotiatedTotal = parseFloat(valueInput?.value || 0);

    const displays = {
      market: document.getElementById("contract_market_price_display") || document.getElementById("total-market-value"),
      negotiated: document.getElementById("contract_negotiated_price_display") || document.getElementById("total-negotiated-value"),
      performance: document.getElementById("contract_performance_display") || document.getElementById("performance-status"),
      performanceBadge: document.getElementById("procurement-performance-badge")
    };

    if (displays.market) displays.market.textContent = `MWK ${marketTotal.toLocaleString()}`;
    if (displays.negotiated) displays.negotiated.textContent = `MWK ${negotiatedTotal.toLocaleString()}`;

    if (displays.performance) {
      if (marketTotal > 0 && negotiatedTotal > 0) {
        const diff = marketTotal - negotiatedTotal;
        const savings = (diff / marketTotal) * 100;
        
        if (diff > 0) {
          displays.performance.innerHTML = `<span style="color: var(--emerald); font-weight: 800;">+${savings.toFixed(1)}% Saving</span>`;
          if (displays.performanceBadge) {
              displays.performanceBadge.style.background = "var(--emerald-light)";
              displays.performanceBadge.style.borderColor = "var(--emerald-hover)";
          }
        } else if (diff < 0) {
          displays.performance.innerHTML = `<span style="color: var(--red); font-weight: 800;">${Math.abs(savings).toFixed(1)}% Over Market</span>`;
          if (displays.performanceBadge) {
              displays.performanceBadge.style.background = "var(--red-light)";
              displays.performanceBadge.style.borderColor = "var(--red-hover)";
          }
        } else {
          displays.performance.innerHTML = `<span style="color: var(--slate-500); font-weight: 800;">Matched</span>`;
          if (displays.performanceBadge) {
              displays.performanceBadge.style.background = "var(--slate-50)";
              displays.performanceBadge.style.borderColor = "var(--slate-200)";
          }
        }
      } else if (negotiatedTotal > 0) {
        displays.performance.innerHTML = `<span style="color: var(--blue); font-weight: 800;">MWK ${negotiatedTotal.toLocaleString()}</span>`;
      } else {
        displays.performance.textContent = "-";
      }
    }

    // Budget Utilization Bars & Safety Metrics
    if (this.currentProjectBudget) {
        const spent = Number(this.currentProjectBudget.spent || 0);
        const total = Number(this.currentProjectBudget.total || 0);
        const remainingBudget = Number(this.currentProjectBudget.remaining || 0);
        const newTotalSpent = spent + negotiatedTotal;
        const newPercent = (newTotalSpent / total) * 100;
        const newRemaining = total - newTotalSpent;

        const availFunds = document.getElementById("contract_available_funds");
        const utilPercent = document.getElementById("contract_utilization_percent");
        const utilBar = document.getElementById("contract_utilization_bar");
        const spentDisplay = document.getElementById("contract_spent_display");
        const safetyDisplay = document.getElementById("contract_safety_display");
        const submitBtn = document.querySelector('button[onclick*="submitContract"]');

        if (availFunds) {
            availFunds.textContent = `MWK ${newRemaining.toLocaleString()}`;
            availFunds.style.color = newRemaining < 0 ? 'var(--red)' : 'var(--slate-900)';
        }
        if (utilPercent) {
            utilPercent.textContent = `${newPercent.toFixed(1)}%`;
            utilPercent.style.color = newPercent > 90 ? 'var(--red)' : 'var(--emerald)';
        }
        if (utilBar) {
            utilBar.style.width = `${Math.min(newPercent, 100)}%`;
            utilBar.style.background = newPercent > 90 ? 'var(--red)' : 'var(--emerald)';
        }
        if (spentDisplay) spentDisplay.textContent = `New Projected Spend: MWK ${newTotalSpent.toLocaleString()}`;
        if (safetyDisplay) {
            safetyDisplay.textContent = newRemaining < 0 ? 'Budget Exceeded' : (100 - newPercent).toFixed(1) + '% Fiscal Safety';
            safetyDisplay.style.color = newRemaining < 0 ? 'var(--red)' : 'var(--emerald)';
        }

        // Lock button and show deficit if budget exceeded
        if (negotiatedTotal > remainingBudget && remainingBudget > 0) {
            const deficit = negotiatedTotal - remainingBudget;
            if (submitBtn) {
                submitBtn.style.opacity = "0.7";
                submitBtn.style.background = "var(--slate-400)";
                submitBtn.innerHTML = `<i class="fas fa-lock"></i> Budget Exceeded (Deficit: ${deficit.toLocaleString()})`;
            }
            if (valueInput) {
                valueInput.style.color = "var(--red)";
                valueInput.style.borderColor = "var(--red)";
            }
        } else if (submitBtn) {
            submitBtn.style.opacity = "1";
            submitBtn.style.background = ""; // Revert to CSS default
            submitBtn.innerHTML = `<i class="fas fa-file-contract"></i> Establish Contract`;
            if (valueInput) {
                valueInput.style.color = "";
                valueInput.style.borderColor = "";
            }
        }
    }
  },

  async searchVendors(query) {
    const resultsContainer = document.getElementById("vendor_autocomplete_results");
    if (!resultsContainer) return;
    if (!query || query.length < 2) {
      resultsContainer.style.display = "none";
      return;
    }
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/vendors/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      const vendors = result.data || result;
      if (vendors.length === 0) {
        resultsContainer.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--slate-500); font-size: 12px;">No matches found.</div>`;
        resultsContainer.style.display = "block";
        return;
      }
      resultsContainer.innerHTML = vendors.map(v => `
        <div style="padding: 12px; border-bottom: 1px solid var(--slate-100); cursor: pointer;" 
             onmousedown="(window.app.pmModule || window.app.fmModule).selectVendorAutocomplete(${v.id}, '${v.name.replace(/'/g, "\\'")}', '${v.phone || ''}')">
          <div style="font-weight: 700; color: var(--slate-800); font-size: 13px;">${v.name}</div>
          <div style="font-size: 11px; color: var(--slate-500);">${v.phone || 'No phone'}</div>
        </div>
      `).join('');
      resultsContainer.style.display = "block";
    } catch (e) { console.error(e); }
  },

  selectVendorAutocomplete(id, name, phone) {
    const nameInput = document.getElementById("contract_vendor");
    const idInput = document.getElementById("contract_vendor_id");
    const phoneInput = document.getElementById("contract_vendor_phone");
    if (nameInput) nameInput.value = name;
    if (idInput) idInput.value = id;
    if (phoneInput) phoneInput.value = phone || "";
    document.getElementById("vendor_autocomplete_results").style.display = "none";
  }
};
