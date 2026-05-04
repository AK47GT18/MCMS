import client from "../../../src/api/client.js";
import { StatCard } from "../../ui/StatCard.js";
import contracts from "../../../src/api/contracts.api.js";

export const FD_Contracts = {
  getContractsView() {
    this.currentContractTab = this.currentContractTab || "project";
    this.projectFilter = "";
    this.vendorFilter = "";

    setTimeout(() => this.loadContractsData(), 0);

    return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Contract Registry & Legal Repository</div>
                    ${
                      this.currentContractTab === "project"
                        ? `<button class="btn btn-primary" onclick="window.app.fmModule?.openNewProjectContract()"><i class="fas fa-file-signature"></i> New Project Master</button>`
                        : `<button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange);" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.fmModule?.loadContractProjects(); window.app.fmModule?.initContractUpload(); }, 100)"><i class="fas fa-plus"></i> New Vendor Contract</button>`
                    }
                </div>
                
                <div class="tabs" style="margin-bottom: 0; padding: 0 24px; border-bottom: 1px solid var(--slate-200);">
                    <div class="tab ${this.currentContractTab === "project" ? "active" : ""}" data-tab="project" onclick="window.app.fmModule.switchContractTab('project')">Project Contracts</div>
                    <div class="tab ${this.currentContractTab === "vendor" ? "active" : ""}" data-tab="vendor" onclick="window.app.fmModule.switchContractTab('vendor')">Vendor Contracts</div>
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
      const response = await contracts.getAll({ limit: 100 });
      const data = response.data || response;
      const allContracts = Array.isArray(data) ? data : data.contracts || [];

      // Store raw contracts
      this.allContracts = allContracts;
      this._contractsMap = allContracts; // For legacy methods

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
          c.vendorId != null
        );
      } else {
        return (
          c.contractType === "project" ||
          c.contractType === "client" ||
          (c.vendorId == null && c.projectId != null)
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
        const isExpired = daysLeft !== null && daysLeft <= 0;
        const isExpiringSoon =
          daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

        let statusClass = item.status === "Active" ? "active" : "locked";
        if (isExpired) statusClass = "delayed";
        if (isExpiringSoon) statusClass = "locked";

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
                        <span class="status ${statusClass}">${isExpired ? "EXPIRED" : (item.status || "Draft").toUpperCase()}</span>
                        ${isExpiringSoon ? `<div style="font-size: 10px; color: var(--orange); font-weight: 600; margin-top: 4px;">Expires in ${daysLeft} days</div>` : ""}
                        ${isExpired ? `<div style="font-size: 10px; color: var(--red); font-weight: 600; margin-top: 4px;">Action Required</div>` : ""}
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

    try {
      window.toast.show("Fetching project baselines...", "info");
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const project = result.data || result;

      // Pre-fill values
      const valInput = document.getElementById("contract_value") || document.getElementById("edit_contract_value");
      const startInput = document.getElementById("contract_start") || document.getElementById("edit_contract_start");
      const endInput = document.getElementById("contract_end") || document.getElementById("edit_contract_end");

      if (valInput) valInput.value = project.contractValue || project.budgetTotal || 0;
      if (startInput && project.startDate) startInput.value = project.startDate.split("T")[0];
      if (endInput && project.endDate) endInput.value = project.endDate.split("T")[0];

      // Random Code Generation
      const refInput = document.getElementById("contract_ref");
      if (refInput) {
        const random = Math.floor(1000 + Math.random() * 9000);
        refInput.value = `MOW-${project.code || "PRJ"}-${random}`;
      }

      window.toast.show("Project timelines & values synced.", "success");
    } catch (err) {
      console.error("Error fetching project for contract", err);
    }
  },

  openNewProjectContract() {
    window.drawer.open(
      "Archive Project Master Contract",
      window.DrawerTemplates.newProjectContract,
    );
    setTimeout(() => {
      this.loadContractProjects();
      this.initContractUpload(); // Reuse existing upload init
    }, 100);
  },

  async submitProjectContract() {
    // Document upload validation
    const fileInput = document.getElementById("contract_document");
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      window.toast.show(
        "Please upload the signed master agreement document.",
        "error",
      );
      const dropZone = document.getElementById("contract-drop-zone");
      if (dropZone) {
        dropZone.style.borderColor = "var(--red)";
        dropZone.style.background = "#fef2f2";
        dropZone.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          dropZone.style.borderColor = "";
          dropZone.style.background = "";
        }, 3000);
      }
      return;
    }

    const startDateRaw = document.getElementById("contract_start")?.value;
    const endDateRaw = document.getElementById("contract_end")?.value;

    const data = {
      projectId: parseInt(
        document.getElementById("contract_project")?.value,
        10,
      ),
      refCode: document.getElementById("contract_ref")?.value,
      title: "Project Master Agreement",
      value: parseFloat(document.getElementById("contract_value")?.value),
      startDate: startDateRaw
        ? new Date(startDateRaw).toISOString()
        : undefined,
      endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
      contractType: "project",
    };

    if (
      !data.projectId ||
      isNaN(data.projectId) ||
      !data.refCode ||
      !data.value
    ) {
      window.toast.show(
        "Please fill all required project contract fields",
        "warning",
      );
      return;
    }

    window.toast.show("Archiving master agreement...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");

      // Upload document first
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);
      const uploadRes = await fetch("/api/v1/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("File upload failed");
      const uploadResult = await uploadRes.json();
      const uploadData = uploadResult.data || uploadResult;
      data.documentUrl = uploadData.url;
      data.fileName = uploadData.originalName;

      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        const errMsg =
          result?.error?.details
            ?.map((d) => `${d.field}: ${d.message}`)
            .join(", ") ||
          result?.error?.message ||
          "Failed to archive project contract";
        throw new Error(errMsg);
      }

      window.toast.show(
        "Project Master Contract Archived successfully",
        "success",
      );
      window.drawer.close();
      this.loadContractsData();
    } catch (err) {
      window.toast.show(err.message, "error");
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
    } catch (error) {
      window.toast.show("Failed to upload version: " + error.message, "error");
    }
  },

  // Using global window.viewDocument and window.downloadDocument instead

  async loadContractProjects() {
    const select = document.getElementById("contract_project");
    if (!select) return;
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch("/api/v1/projects?status=active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const projects = result.data || result.items || [];
      select.innerHTML =
        '<option value="">Select a project...</option>' +
        projects
          .map((p) => `<option value="${p.id}">${p.code} – ${p.name}</option>`)
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
      valueInput.oninput = () => this.calculateContractValue(true);
    }
  },

  async onContractProjectSelected(projectId) {
    const list = document.getElementById("contract-materials-list");
    const section = document.getElementById("contract-materials-section");
    if (!list || !projectId) return;
    section.style.display = "block";
    list.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
                <i class="fas fa-circle-notch fa-spin" style="margin-right: 8px; color: var(--orange);"></i>
                <span style="font-size: 13px; color: var(--slate-500);">Fetching project requirements & budget...</span>
            </div>
        `;
    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/projects/${projectId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const data = result.data || result;
      const materials = data.materials || [];
      const budget = data.budgetSummary || {};

      // Store budget for submission check
      this.currentProjectBudget = budget;

      // Update Budget Display
      const budgetDisplay = document.getElementById("contract-budget-status");
      if (budgetDisplay) {
        const remaining = Number(budget.remaining || 0);
        const spent = Number(budget.spent || 0);
        const percent = Number(budget.percentUsed || 0);
        
        budgetDisplay.innerHTML = `
                    <div style="background: ${remaining < 1000000 ? "#FFF5F5" : "white"}; border: 2px solid ${remaining < 1000000 ? "var(--red)" : "var(--slate-200)"}; padding: 16px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px;">
                            <div>
                                <div style="font-size: 10px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Available Funds</div>
                                <div style="font-size: 20px; font-weight: 900; color: ${remaining < 1000000 ? "var(--red)" : "var(--slate-900)"}; font-family: 'JetBrains Mono';">MWK ${remaining.toLocaleString()}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 10px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Utilization</div>
                                <div style="font-size: 18px; font-weight: 900; color: ${percent > 90 ? "var(--red)" : "var(--orange)"};">${percent}%</div>
                            </div>
                        </div>
                        
                        <!-- Visual Budget Bar (Dual Layer) -->
                        <div style="height: 14px; background: #E2E8F0; border-radius: 7px; overflow: hidden; display: flex; border: 1px solid rgba(0,0,0,0.05); position: relative;">
                            <div style="width: ${percent}%; height: 100%; background: ${percent > 90 ? "var(--red)" : "var(--orange)"}; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                            <div style="flex: 1; height: 100%; background: var(--emerald-light); opacity: 0.5;"></div>
                            
                            <!-- Middle Marker -->
                            <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(0,0,0,0.1); z-index: 2;"></div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                            <div style="font-size: 11px; font-weight: 600; color: var(--slate-500);">
                                <i class="fas fa-arrow-up" style="color: var(--orange); margin-right: 4px;"></i> Spent: MWK ${spent.toLocaleString()}
                            </div>
                            ${remaining < 1000000 
                                ? '<div style="font-size: 11px; font-weight: 800; color: var(--red); display: flex; align-items: center; gap: 4px;"><i class="fas fa-exclamation-circle"></i> LOW FUNDS</div>' 
                                : `<div style="font-size: 11px; font-weight: 700; color: var(--emerald-dark);">
                                     <i class="fas fa-check-circle" style="margin-right: 4px;"></i> ${(100-percent).toFixed(1)}% Safe
                                   </div>`}
                        </div>
                    </div>
                `;
      }

      if (materials.length === 0) {
        list.innerHTML =
          '<div style="padding: 20px; text-align: center; color: var(--slate-400); font-size: 12px;">No specifications found for this project.</div>';
        return;
      }

      // Check if any materials already have contracted quantities
      const hasExistingContracts = materials.some(
        (m) => m.contractedQuantity > 0,
      );
      if (hasExistingContracts) {
        const titleInput = document.getElementById("contract_title");
        if (titleInput && !titleInput.value.includes("Extension")) {
          titleInput.value = `[EXTENSION] ` + titleInput.value;
        }
        const submitBtn = document.querySelector(
          'button[onclick*="submitContract"]',
        );
        if (submitBtn)
          submitBtn.innerHTML =
            '<i class="fas fa-plus-circle"></i> Update/Extend Contract';
      }

      list.innerHTML = `
                <div style="padding: 8px 12px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">
                    <div style="flex: 2;">Material Name</div>
                    <div style="flex: 1; text-align: right;">Total Required</div>
                    <div style="flex: 1; text-align: right;">Already Contracted</div>
                    <div style="flex: 1.2; text-align: right;">New Qty</div>
                </div>
                ${materials
                  .map((m, i) => {
                    const remainingNeeded = Math.max(
                      0,
                      m.quantity - m.contractedQuantity,
                    );
                    const isFullyContracted = remainingNeeded === 0;
                    return `
                        <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid var(--slate-100); ${isFullyContracted ? 'opacity: 0.5; background: #f8fafc;' : ''}">
                            <div style="flex: 2; display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" name="contract_material" id="m_cb_${i}" value="${i}" 
                                    data-name="${m.name}" data-unit="${m.unit}" data-market="${m.unitCostHigh || 0}"
                                    onchange="window.app.fmModule?.calculateContractValue(); document.getElementById('m_qty_${i}').disabled = !this.checked;"
                                    ${isFullyContracted ? 'disabled' : ''}>
                                <div>
                                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-800); ${isFullyContracted ? 'text-decoration: line-through;' : ''}">${m.name}</div>
                                    <div style="font-size: 11px; color: var(--slate-500);">${m.unit} • Est. MWK ${Number(m.unitCostHigh || 0).toLocaleString()}/unit</div>
                                </div>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 12px; font-weight: 600; color: var(--slate-600);">${m.quantity}</div>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 12px; font-weight: 600; color: ${m.contractedQuantity > 0 ? (isFullyContracted ? "var(--emerald)" : "var(--orange)") : "var(--slate-400)"};">${m.contractedQuantity}</div>
                            </div>
                            <div style="flex: 1.2; text-align: right;">
                                <input type="number" id="m_qty_${i}" class="form-input" disabled value="${remainingNeeded > 0 ? remainingNeeded : 0}" 
                                    min="1" oninput="window.app.fmModule?.calculateContractValue()"
                                    style="width: 100%; padding: 4px 8px; font-size: 12px; text-align: right; border-radius: 6px;">
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
            `;
      this.calculateContractValue();
    } catch (err) {
      list.innerHTML =
        '<div style="padding: 20px; text-align: center; color: #ef4444; font-size: 12px;">Error loading materials list.</div>';
    }
  },

  calculateContractValue(fromManualInput = false) {
    const checkboxes = document.querySelectorAll(
      'input[name="contract_material"]:checked',
    );
    const valueInput = document.getElementById("contract_value");
    const marketEl = document.getElementById("total-market-value");
    const negotiatedEl = document.getElementById("total-negotiated-value");
    const performanceEl = document.getElementById("performance-status");
    const performanceBadge = document.getElementById("procurement-performance-badge");

    let totalMarket = 0;
    checkboxes.forEach((cb) => {
      const index = cb.value;
      const marketPrice = parseFloat(cb.dataset.market || 0);
      const qtyInput = document.getElementById(`m_qty_${index}`);
      const qty = parseFloat(qtyInput?.value || 0);
      totalMarket += marketPrice * qty;
    });

    if (marketEl) marketEl.textContent = `MWK ${totalMarket.toLocaleString()}`;

    if (valueInput) {
      const total = parseFloat(valueInput.value || 0);
      const negotiatedSum = total;
      if (negotiatedEl) negotiatedEl.textContent = `MWK ${negotiatedSum.toLocaleString()}`;
      
      if (performanceEl && negotiatedSum > 0) {
          const diff = totalMarket - negotiatedSum;
          if (diff > 0) {
              performanceEl.textContent = "SURPLUS";
              performanceEl.style.color = "var(--emerald)";
              if (performanceBadge) {
                  performanceBadge.style.background = "var(--emerald-light)";
                  performanceBadge.style.borderColor = "var(--emerald-hover)";
              }
          } else if (diff < 0) {
              performanceEl.textContent = "DEFICIT";
              performanceEl.style.color = "var(--red)";
              if (performanceBadge) {
                  performanceBadge.style.background = "var(--red-light)";
                  performanceBadge.style.borderColor = "var(--red-hover)";
              }
          } else {
              performanceEl.textContent = "MATCHED";
              performanceEl.style.color = "var(--slate-500)";
              if (performanceBadge) {
                  performanceBadge.style.background = "var(--slate-50)";
                  performanceBadge.style.borderColor = "var(--slate-200)";
              }
          }
      } else if (performanceEl) {
          performanceEl.textContent = "-";
          if (performanceBadge) {
              performanceBadge.style.background = "var(--slate-50)";
              performanceBadge.style.borderColor = "var(--slate-200)";
          }
      }

        // Visual feedback that it auto-calculated
        valueInput.style.backgroundColor = "#fff7ed";
        setTimeout(() => {
          valueInput.style.backgroundColor = "";
        }, 500);

      // Real-time Budget Validation
      const remainingBudget = this.currentProjectBudget?.remaining || 0;
      const submitBtn = document.querySelector(
        'button[onclick*="submitContract"]',
      );

      if (total > remainingBudget) {
        const deficit = total - remainingBudget;
        valueInput.style.color = "var(--red)";
        valueInput.style.borderColor = "var(--red)";

        // Show warning in budget status area
        const budgetDisplay = document.getElementById("contract-budget-status");
        if (budgetDisplay) {
          // Update the label to reflect uplift state
          const budgetLabel = budgetDisplay.querySelector(
            'span[style*="text-transform: uppercase"]',
          );
          if (budgetLabel) {
            budgetLabel.innerHTML = "Budget Uplift Required";
            budgetLabel.style.color = "var(--red)";
          }

          if (!document.getElementById("budget-deficit-warning")) {
            const warning = document.createElement("div");
            warning.id = "budget-deficit-warning";
            warning.style.cssText =
              "background: #fef2f2; border: 1px solid #fee2e2; padding: 10px; border-radius: 8px; margin-top: 10px; color: #991b1b; font-size: 11px; font-weight: 600;";
            warning.innerHTML = `<i class="fas fa-exclamation-circle"></i> BUDGET EXCEEDED: You are over by MWK ${deficit.toLocaleString()}. An uplift request will be required.`;
            budgetDisplay.appendChild(warning);
          }
        }

        if (submitBtn) {
          submitBtn.style.opacity = "0.7";
          submitBtn.innerHTML = `<i class="fas fa-lock"></i> Budget Exceeded (Deficit: ${deficit.toLocaleString()})`;
        }
      } else {
        valueInput.style.color = "var(--slate-900)";
        valueInput.style.borderColor = "var(--slate-300)";
        const warning = document.getElementById("budget-deficit-warning");
        if (warning) warning.remove();

        // Restore the label
        const budgetDisplay = document.getElementById("contract-budget-status");
        if (budgetDisplay) {
          const budgetLabel = budgetDisplay.querySelector(
            'span[style*="text-transform: uppercase"]',
          );
          if (budgetLabel) {
            budgetLabel.innerHTML = "Available Project Funds";
            budgetLabel.style.color = "var(--slate-500)";
          }
        }

        if (submitBtn) {
          submitBtn.style.opacity = "1";
          submitBtn.innerHTML =
            '<i class="fas fa-file-contract"></i> Create Contract';
        }
      }
    }
  },

  async submitContract() {
    if (window.app && typeof window.app.validateForm === 'function') {
      const formContainer = document.getElementById('drawer-content') || document.body;
      if (!window.app.validateForm(formContainer)) {
        return;
      }
    }
    // Document upload validation - require a file before submission
    const fileInput = document.getElementById("contract_document");
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      window.toast.show(
        "Please upload a signed contract document before submitting.",
        "error",
      );
      const dropZone = document.getElementById("contract-upload-zone") || document.getElementById("contract-drop-zone");
      if (dropZone) {
        dropZone.style.borderColor = "var(--red)";
        dropZone.style.background = "#fef2f2";
        dropZone.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          dropZone.style.borderColor = "";
          dropZone.style.background = "";
        }, 3000);
      }
      return;
    }

    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      window.toast.show("Contract document exceeds the 10MB limit. Please upload a smaller file.", "error");
      return;
    }

    const startDateRaw = document.getElementById("contract_start")?.value;
    const endDateRaw = document.getElementById("contract_end")?.value;

    if (startDateRaw && endDateRaw) {
      if (new Date(endDateRaw) < new Date(startDateRaw)) {
        window.toast.show("Contract end date cannot be earlier than the start date.", "error");
        const endInput = document.getElementById("contract_end");
        if (endInput) {
            endInput.style.borderColor = "var(--red)";
            endInput.focus();
        }
        return;
      }
    }

    const data = {
      projectId: parseInt(
        document.getElementById("contract_project")?.value,
        10,
      ),
      vendorName: document.getElementById("contract_vendor")?.value,
      vendorPhone: document.getElementById("contract_vendor_phone")?.value,
      vendorId: document.getElementById("contract_vendor_id")?.value ? parseInt(document.getElementById("contract_vendor_id").value, 10) : null,
      title: document.getElementById("contract_title")?.value,
      value: parseFloat(document.getElementById("contract_value")?.value),
      startDate: startDateRaw
        ? new Date(startDateRaw).toISOString()
        : undefined,
      endDate: endDateRaw ? new Date(endDateRaw).toISOString() : undefined,
      retentionPercentage: parseFloat(
        document.getElementById("contract_retention")?.value || 0,
      ),
      isTaxInclusive:
        document.getElementById("contract_tax_inclusive")?.checked || false,
      advancePaymentAmount: parseFloat(
        document.getElementById("contract_advance")?.value || 0,
      ),
      guaranteeExpiry:
        document.getElementById("contract_guarantee_expiry")?.value || null,
      contractType: "vendor", // Categorize correctly for registry tabs
    };

    // Basic field validation
    if (!data.projectId || isNaN(data.projectId)) {
      window.toast.show("Please select a project.", "error");
      return;
    }
    if (!data.title) {
      window.toast.show("Please enter a contract title.", "error");
      return;
    }
    if (!data.value || isNaN(data.value) || data.value <= 0) {
      window.toast.show("Please enter a valid contract value.", "error");
      return;
    }

    // Calculate financial breakdown
    data.retentionAmount = data.value * (data.retentionPercentage / 100);
    if (data.isTaxInclusive) {
      data.vatAmount = data.value * (16.5 / 116.5);
      const netBeforeTax = data.value - data.vatAmount;
      data.whtAmount = netBeforeTax * 0.03;
    } else {
      data.vatAmount = data.value * 0.165;
      data.whtAmount = data.value * 0.03;
    }
    const checkboxes = document.querySelectorAll(
      'input[name="contract_material"]:checked',
    );
    const materials = Array.from(checkboxes).map((cb) => {
      const index = cb.value;
      const qtyInput = document.getElementById(`m_qty_${index}`);
      const priceInput = document.getElementById(`m_price_${index}`);
      const marketPrice = parseFloat(cb.dataset.market || 0);
      const negotiatedPrice = parseFloat(priceInput?.value || 0);
      return {
        name: cb.dataset.name,
        quantity: parseFloat(qtyInput?.value || 0),
        unit: cb.dataset.unit,
        unitPrice: negotiatedPrice,
        marketPrice: marketPrice,
        variance: marketPrice - negotiatedPrice,
        totalCost: negotiatedPrice * parseFloat(qtyInput?.value || 0)
      };
    });

    // Budget Validation
    const remainingBudget = this.currentProjectBudget?.remaining || 0;
    if (data.value > remainingBudget) {
      const deficit = data.value - remainingBudget;
      window.toast.show(
        `Insufficient budget! Deficit: MWK ${deficit.toLocaleString()}`,
        "error",
      );

      // Auto-redirect to Uplift Drawer
      setTimeout(() => {
        const projectSelect = document.getElementById("contract_project");
        const projectText =
          projectSelect?.options[projectSelect.selectedIndex]?.text ||
          "Selected Project";
        const [pCode, pName] = projectText.split(" – ");

        window.drawer.open(
          "Request Budget Uplift",
          window.DrawerTemplates.initiateBCR(
            [
              {
                id: data.projectId,
                code: pCode || "PRJ",
                name: pName || "Project",
              },
            ],
            data.projectId,
          ),
        );

        // Pre-fill deficit
        const bcrAmount = document.getElementById("bcr_amount");
        if (bcrAmount) bcrAmount.value = deficit;
        const bcrReason = document.getElementById("bcr_reason");
        const contractTitle = data.title || "New Vendor Procurement";
        const materialSummary = materials
          .map((m) => `${m.name} (${m.quantity} ${m.unit})`)
          .join(", ");

        if (bcrReason) {
          bcrReason.value = `Budget uplift required for contract "${contractTitle}". \n\nMaterials to be procured: ${materialSummary}. \n\nThe contract value exceeds current balance by MWK ${deficit.toLocaleString()}.`;
        }
      }, 1000);
      return;
    }

    window.toast.show("Establishing contract...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");

      // File Upload Logic
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);

      const uploadRes = await fetch("/api/v1/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("File upload failed");
      const uploadResult = await uploadRes.json();
      const uploadData = uploadResult.data || uploadResult;
      data.documentUrl = uploadData.url;
      data.fileName = uploadData.originalName;

      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          materialsList: JSON.stringify(materials),
          refCode: "CON-" + Date.now().toString(36).toUpperCase(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        const errMsg =
          result?.error?.details
            ?.map((d) => `${d.field}: ${d.message}`)
            .join(", ") ||
          result?.error?.message ||
          "System error creating contract";
        throw new Error(errMsg);
      }

      const contract = result.data || result;

      window.toast.show("Contract established successfully", "success");

      // Automatically notify Logistics
      if (contract && contract.id) {
        this.notifyLogistics(
          contract.id,
          contract.refCode || "CON-" + contract.id,
        );
      }

      window.drawer.close();
      
      // Auto-refresh the appropriate view with tab awareness
      if (this.currentView === "contracts") {
        if (this.currentContractTab === "vendor") {
            // Force a re-fetch of the vendor contracts
            await this.loadContractsData();
        } else {
            this.loadContractsData();
        }
      }
      else if (this.currentView === "procurement") this.loadProcurementData();
      else if (this.currentView === "ledger") this.loadLedgerData();
      else if (this.switchView) this.switchView(this.currentView);
      
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
      const dropZone = document.getElementById("v-drop-zone");
      const fileInput = document.getElementById("v-file-input");
      const status = document.getElementById("v-file-status");

      if (dropZone && fileInput) {
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            status.innerHTML = `<span style="color: var(--emerald);"><i class="fas fa-check-circle"></i> ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)</span>`;
            dropZone.style.borderColor = "var(--emerald)";
            dropZone.style.background = "#F0FDF4";
          }
        };
      }
    }, 100);
  },

  async submitContractUpdate(contractId) {
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
      
      // If we're coming from the Records module, reload that too
      if (window.app.currentModule === "records" && window.app.recordsModule) {
        window.app.recordsModule.loadVendorsData();
      }
    } catch (e) {
      window.toast.show(e.message, "error");
    }
  },

  openTerminateContractDrawer(contract) {
    window.drawer.open(
      `Terminate: ${contract.refCode}`,
      window.DrawerTemplates.terminateContract(contract)
    );
  },

  async submitTermination(contractId) {
    if (window.app && typeof window.app.validateForm === 'function') {
      const formContainer = document.getElementById('drawer-content') || document.body;
      if (!window.app.validateForm(formContainer)) {
        return;
      }
    }

    const reasonInput = document.getElementById("term_reason");
    const reason = reasonInput?.value;
    
    if (!reason) {
      window.toast.show("Please provide a reason for termination.", "error");
      return;
    }

    // Collect received quantities
    const receivedItems = [];
    const qtyInputs = document.querySelectorAll('.term-qty-input');
    qtyInputs.forEach(input => {
      receivedItems.push({
        id: parseInt(input.dataset.itemId, 10),
        receivedQty: parseFloat(input.value || 0)
      });
    });

    try {
      window.toast.show("Finalizing contract termination...", "info");
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
        throw new Error(error.message || "Failed to terminate contract");
      }

      window.toast.show("Contract terminated. Remaining funds and materials returned to project.", "success");
      window.drawer.close();
      await this.loadContractsData();
      
      // If we're in the Ledger, reload to reflect budget changes
      if (window.app.currentModule === "ledger" && window.app.fmModule) {
        window.app.fmModule.loadLedgerData();
      }
    } catch (e) {
      window.toast.show(e.message, "error");
    }
  }
};
