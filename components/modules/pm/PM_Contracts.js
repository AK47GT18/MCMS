import client from "../../../src/api/client.js";
import projects from "../../../src/api/projects.api.js";
import users from "../../../src/api/users.api.js";
import dailyLogs from "../../../src/api/dailyLogs.api.js";
import requisitions from "../../../src/api/requisitions.api.js";
import audit from "../../../src/api/audit.api.js";
import procurement from "../../../src/api/procurement.api.js";
import assets from "../../../src/api/assets.api.js";
import issues from "../../../src/api/issues.api.js";
import tasks from "../../../src/api/tasks.api.js";
import contracts from "../../../src/api/contracts.api.js";

export const PM_Contracts = {
  getContractsView() {
    this.currentContractTab = this.currentContractTab || "project";
    this.projectFilter = "";
    this.vendorFilter = "";

    setTimeout(() => this.loadContractsData(), 0);

    return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Contract Registry & Legal Repository</div>
                    ${this.currentContractTab === "project"
        ? `<button class="btn btn-primary" onclick="window.app.pmModule?.openNewProjectContract()"><i class="fas fa-file-signature"></i> New Project Master</button>`
        : `<button class="btn btn-primary" style="background: var(--orange); border-color: var(--orange);" onclick="window.drawer.open('Create Vendor Contract', window.DrawerTemplates.newContract); setTimeout(() => { window.app.pmModule?.loadContractProjects(); window.app.pmModule?.initContractUpload(); }, 100)"><i class="fas fa-plus"></i> New Vendor Contract</button>`
      }
                </div>
                
                <div class="tabs" style="margin-bottom: 0; padding: 0 24px; border-bottom: 1px solid var(--slate-200);">
                    <div class="tab ${this.currentContractTab === "project" ? "active" : ""}" data-tab="project" onclick="window.app.pmModule.switchContractTab('project')">Project Contracts</div>
                    <div class="tab ${this.currentContractTab === "vendor" ? "active" : ""}" data-tab="vendor" onclick="window.app.pmModule.switchContractTab('vendor')">Vendor Contracts</div>
                </div>
                
                <div style="padding: 16px 24px; background: var(--slate-50); border-bottom: 1px solid var(--slate-200); display: flex; gap: 16px;">
                    <select id="contract-project-filter" class="form-input" style="max-width: 250px;" onchange="window.app.pmModule.handleContractFilterChange()">
                        <option value="">All Projects</option>
                        <!-- Projects loaded dynamically -->
                    </select>
                    ${this.currentContractTab === "vendor"
        ? `
                    <select id="contract-vendor-filter" class="form-input" style="max-width: 250px;" onchange="window.app.pmModule.handleContractFilterChange()">
                        <option value="">All Vendors</option>
                        <!-- Vendors loaded dynamically -->
                    </select>
                    `
        : ""
      }
                </div>

                <div id="contracts-table-container">
                    ${this.renderLoadingState()}
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
      container.innerHTML = this.renderEmptyState(
        "Failed to load contract registry.",
      );
    }
  },

  renderContractsTable() {
    const container = document.getElementById("contracts-table-container");
    if (!container) return;

    if (!this.allContracts || this.allContracts.length === 0) {
      container.innerHTML = this.renderEmptyState(
        "No contracts found in the repository.",
      );
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
      container.innerHTML = this.renderEmptyState(
        "No contracts match the selected filters.",
      );
      return;
    }

    const rows = filtered
      .map((item) => {
        const isLocked = item.items?.some((i) => Number(i.receivedQty) > 0);
        return `
                <tr style="${isLocked ? "background: var(--slate-50);" : ""}">
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="project-id">${this.escapeHTML(item.code || item.refCode || "CNT-" + item.id)}</span>
                            ${isLocked ? `<i class="fas fa-lock" style="color: var(--slate-400); font-size: 10px;" title="Financial Lock: Active receipts detected. Changes require formal [VARIATION]."></i>` : ""}
                        </div>
                    </td>
                    <td style="font-weight:600;">${this.escapeHTML(item.title)}</td>
                    ${this.currentContractTab === "vendor" ? `<td>${this.escapeHTML(item.vendorName || item.vendor?.name || "N/A")}</td>` : ""}
                    <td><span class="status active" style="background:var(--slate-100); color:var(--slate-600);">${this.escapeHTML((item.type || item.contractType || "Service").replace(/_/g, " "))}</span></td>
                    <td style="font-weight: 600; color: var(--orange);">v${item.versions && item.versions.length > 0 ? item.versions[0].versionNumber : "1.0"}</td>
                    <td>${item.endDate ? new Date(item.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule?.viewContract(${item.id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
      })
      .join("");

    container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Contract ID</th>
                        <th>Title</th>
                        ${this.currentContractTab === "vendor" ? "<th>Vendor</th>" : ""}
                        <th>Type</th>
                        <th>Version</th>
                        <th>End Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
  },

  initProjectContractUpload() {
    const dropZone = document.getElementById("v-drop-zone");
    const fileInput = document.getElementById("v-file-input");
    const status = document.getElementById("v-file-status");
    if (!dropZone || !fileInput) return;

    dropZone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 25 * 1024 * 1024) {
          window.toast.show("File too large (Max 25MB)", "error");
          fileInput.value = "";
          return;
        }
        status.innerHTML = `<span style="color: var(--emerald); font-weight: 700;"><i class="fas fa-check-circle"></i> ${file.name}</span>`;
        dropZone.style.borderColor = "var(--emerald)";
        dropZone.style.background = "#f0fdf4";
        this.pendingContractFile = file;
      }
    };

    // Handle Drag & Drop
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--orange)";
    };
    dropZone.ondragleave = () => {
      dropZone.style.borderColor = "var(--orange)";
    };
    dropZone.ondrop = (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        fileInput.files = e.dataTransfer.files;
        fileInput.onchange({ target: fileInput });
      } else {
        window.toast.show("Only PDF files allowed", "warning");
      }
    };
  },

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

      // 1. Fetch Project Details for Auto-fill
      const projRes = await fetch(`/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const projResult = await projRes.json();
      const project = projResult.data || projResult;

      // Auto-fill dates
      const startEl = document.getElementById("contract_start");
      const endEl = document.getElementById("contract_end");
      if (startEl && project.startDate)
        startEl.value = project.startDate.split("T")[0];
      if (endEl && project.endDate) endEl.value = project.endDate.split("T")[0];

      // 2. Fetch Materials and Budget
      const res = await fetch(`/api/v1/projects/${projectId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const data = result.data || result;
      const materials = data.materials || [];
      const budget = data.budgetSummary || {};

      // Store budget for submission check
      this.currentProjectBudget = budget;

      // Pre-fill Agreed Contract Sum with remaining budget as a hint (if 0)
      const valInput = document.getElementById("contract_value");
      if (valInput && (!valInput.value || valInput.value == "0")) {
        valInput.value = budget.remaining || 0;
      }

      // Update Budget Display
      const budgetDisplay = document.getElementById("contract-budget-status");
      if (budgetDisplay) {
        const remaining = Number(budget.remaining || 0);
        const percent = Number(budget.percentUsed || 0);
        budgetDisplay.innerHTML = `
                    <div style="background: ${remaining < 1000000 ? "#fef2f2" : "var(--slate-50)"}; border: 1px solid ${remaining < 1000000 ? "#fee2e2" : "var(--slate-200)"}; padding: 10px; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Available Funds</span>
                            <span style="font-size: 13px; font-weight: 800; color: ${remaining < 1000000 ? "var(--red)" : "var(--slate-900)"}; font-family: 'JetBrains Mono';">MWK ${remaining.toLocaleString()}</span>
                        </div>
                        <div style="height: 5px; background: var(--slate-200); border-radius: 3px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: ${percent > 90 ? "var(--red)" : "var(--emerald)"};"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                            <span style="font-size: 9px; color: var(--slate-400);">${percent}% Utilized</span>
                            ${remaining < 1000000 ? '<span style="font-size: 9px; color: var(--red); font-weight: 700;"><i class="fas fa-exclamation-triangle"></i> LOW</span>' : ""}
                        </div>
                    </div>
                `;
      }

      if (materials.length === 0) {
        list.innerHTML =
          '<div style="padding: 20px; text-align: center; color: var(--slate-400); font-size: 12px;">No specifications found for this project.</div>';
        return;
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
            return `
                        <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid var(--slate-100);">
                            <div style="flex: 2; display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" name="contract_material" id="m_cb_${i}" value="${i}" 
                                    data-name="${m.name}" data-unit="${m.unit}" data-market="${m.unitCostHigh || 0}"
                                    onchange="window.app.pmModule?.calculateContractValue(); document.getElementById('m_qty_${i}').disabled = !this.checked;">
                                <div>
                                    <div style="font-size: 13px; font-weight: 700; color: var(--slate-800);">${m.name}</div>
                                    <div style="font-size: 11px; color: var(--slate-500);">${m.unit} • Est. MWK ${Number(m.unitCostHigh || 0).toLocaleString()}/unit</div>
                                </div>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 12px; font-weight: 600; color: var(--slate-600);">${m.quantity}</div>
                            </div>
                            <div style="flex: 1; text-align: right;">
                                <div style="font-size: 12px; font-weight: 600; color: ${m.contractedQuantity > 0 ? "var(--orange)" : "var(--slate-400)"};">${m.contractedQuantity}</div>
                            </div>
                            <div style="flex: 1.2; text-align: right;">
                                <input type="number" id="m_qty_${i}" class="form-input" disabled value="${remainingNeeded > 0 ? remainingNeeded : 0}" 
                                    min="1" oninput="window.app.pmModule?.calculateContractValue()"
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
    let total = 0;

    if (fromManualInput) {
      total = parseFloat(document.getElementById("contract_value")?.value || 0);
    } else {
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
            performanceEl.innerHTML = `<div style="font-size: 9px; opacity: 0.8;">SURPLUS</div><div style="font-size: 13px; font-weight: 900;">MWK ${diff.toLocaleString()}</div>`;
            performanceEl.style.color = "var(--emerald)";
            if (performanceBadge) {
              performanceBadge.style.background = "var(--emerald-light)";
              performanceBadge.style.borderColor = "var(--emerald-hover)";
            }
          } else if (diff < 0) {
            performanceEl.innerHTML = `<div style="font-size: 9px; opacity: 0.8;">DEFICIT</div><div style="font-size: 13px; font-weight: 900;">MWK ${Math.abs(diff).toLocaleString()}</div>`;
            performanceEl.style.color = "var(--red)";
            if (performanceBadge) {
              performanceBadge.style.background = "var(--red-light)";
              performanceBadge.style.borderColor = "var(--red-hover)";
            }
          } else {
            performanceEl.innerHTML = `<div style="font-size: 9px; opacity: 0.8;">MATCHED</div><div style="font-size: 13px; font-weight: 900;">MWK 0</div>`;
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

        // Real-time Budget Validation
        const remainingBudget = this.currentProjectBudget?.remaining || 0;
        const submitBtn = document.querySelector(
          'button[onclick*="submitContract"]',
        );

        if (total > remainingBudget) {
          valueInput.style.color = "var(--red)";
          if (submitBtn) {
            submitBtn.style.opacity = "0.7";
            submitBtn.disabled = true;
          }
        } else {
          valueInput.style.color = "var(--slate-900)";
          if (submitBtn) {
            submitBtn.style.opacity = "1";
            submitBtn.disabled = false;
          }
        }
      }
    }
  },

  async submitContract() {
    const data = {
      projectId: document.getElementById("contract_project")?.value,
      vendorName: document.getElementById("contract_vendor")?.value,
      vendorPhone: document.getElementById("contract_vendor_phone")?.value,
      vendorId: document.getElementById("contract_vendor_id")?.value,
      title: document.getElementById("contract_title")?.value,
      value: parseFloat(document.getElementById("contract_value")?.value),
      startDate: document.getElementById("contract_start")?.value,
      endDate: document.getElementById("contract_end")?.value,
      justification: document.getElementById("contract_justification")?.value,
    };

    if (!data.projectId || !data.vendorName || !data.title || !data.value) {
      window.toast.show("Please fill all required fields.", "warning");
      return;
    }

    window.toast.show("Establishing contract...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const checkboxes = document.querySelectorAll('input[name="contract_material"]:checked');
      const materials = Array.from(checkboxes).map(cb => {
        const index = cb.value;
        const qtyInput = document.getElementById(`m_qty_${index}`);
        return {
          materialName: cb.dataset.name,
          quantity: parseFloat(qtyInput?.value || 0),
          unit: cb.dataset.unit,
          unitPrice: parseFloat(cb.dataset.market || 0) // Default to market price if not overridden
        };
      });

      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          materialsList: JSON.stringify(materials),
          contractType: "vendor",
          refCode: "CON-" + Date.now().toString(36).toUpperCase(),
        }),
      });
      if (!res.ok) throw new Error("System error creating contract");

      window.toast.show("Contract established successfully", "success");
      window.drawer.close();
      this.loadContractsData();
    } catch (err) {
      window.toast.show(err.message, "error");
    }
  },

  async viewContract(id) {
    window.toast.show("Loading contract...", "info");
    try {
      const token = localStorage.getItem("mcms_auth_token");

      // Fetch contract details
      const contractRes = await fetch(`/api/v1/contracts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!contractRes.ok) throw new Error("Failed to fetch contract");
      const contractResult = await contractRes.json();
      const contract = contractResult.data || contractResult;

      // Fetch version history
      const versionsRes = await fetch(`/api/v1/contracts/${id}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (versionsRes.ok) {
        const versionsResult = await versionsRes.json();
        contract.versions = versionsResult.data || versionsResult || [];
      } else {
        contract.versions = [];
      }

      window.drawer.open(
        "Contract Viewer",
        window.DrawerTemplates.contractView(contract),
      );
    } catch (error) {
      console.error("View contract error:", error);
      window.toast.show("Could not load contract details.", "error");
    }
  },

  openNewProjectContract() {
    window.drawer.open(
      "Project Master Agreement",
      window.DrawerTemplates.newProjectContract,
    );
    setTimeout(() => {
      this.loadContractProjects();
      this.initMasterContractUpload();
    }, 100);
  },

  initMasterContractUpload() {
    const dropZone = document.getElementById("v-drop-zone");
    const fileInput = document.getElementById("v-file-input");
    const status = document.getElementById("v-file-status");
    if (!dropZone || !fileInput) return;

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedMasterFile = file;
        status.innerHTML = `<span style="color: var(--emerald); font-size: 13px;"><i class="fas fa-check-circle"></i> ${file.name}</span>`;
        dropZone.style.borderColor = "var(--emerald)";
        dropZone.style.background = "#f0fdf4";
      }
    };
  },

  async onProjectContractSelected(projectId) {
    if (!projectId) return;

    // Show loading in fields
    const sumEl = document.getElementById("contract_value") || document.getElementById("edit_contract_value");
    const startEl = document.getElementById("contract_start") || document.getElementById("edit_contract_start");
    const endEl = document.getElementById("contract_end") || document.getElementById("edit_contract_end");
    const codeEl = document.getElementById("contract_ref");

    if (sumEl) sumEl.disabled = true;

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const project = result.data || result;

      if (sumEl) {
        sumEl.value = project.contractValue || project.budgetTotal || 0;
        sumEl.disabled = false;
      }
      if (startEl && project.startDate) {
        startEl.value = project.startDate.split("T")[0];
      }
      if (endEl && project.endDate) {
        endEl.value = project.endDate.split("T")[0];
      }
      if (codeEl) {
        codeEl.value = project.code || "";
      }

      window.toast.show(`Auto-filled details for ${project.name}`, "info");
    } catch (err) {
      console.error("Auto-fill failed:", err);
      if (sumEl) sumEl.disabled = false;
    }
  },

  async submitProjectContract() {
    const projectId = document.getElementById("contract_project")?.value;
    const refCode = document.getElementById("contract_ref")?.value;
    const value = parseFloat(document.getElementById("contract_value")?.value);
    const startDate = document.getElementById("contract_start")?.value;
    const endDate = document.getElementById("contract_end")?.value;
    const justification = document.getElementById(
      "contract_justification",
    )?.value;

    if (!projectId || !refCode || isNaN(value) || !justification) {
      window.toast.show(
        "Please fill all required fields, including justification.",
        "warning",
      );
      return;
    }

    if (!this.selectedMasterFile) {
      window.toast.show("Please upload the signed master document.", "warning");
      return;
    }

    window.toast.show("Archiving master agreement...", "info");

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("refCode", refCode);
      formData.append("value", value);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("justification", justification);
      formData.append("title", "Project Master Agreement");
      formData.append("contractType", "project");
      formData.append("document", this.selectedMasterFile);

      const result = await contracts.create(formData);

      // Send Notifications
      this.sendContractNotification(
        "Master Agreement Created",
        `Project Master for ${refCode} has been archived by ${window.currentUser?.name}. Justification: ${justification}`,
      );

      window.toast.show("Master agreement archived", "success");
      this.selectedMasterFile = null;
      window.drawer.close();
      this.loadContractsData();
    } catch (err) {
      console.error("[Contract Error]", err);
      window.toast.show(err.message || "Failed to archive contract", "error");
    }
  },

  async submitContract() {
    const data = {
      projectId: document.getElementById("contract_project")?.value,
      vendorName: document.getElementById("contract_vendor")?.value,
      title: document.getElementById("contract_title")?.value,
      value: parseFloat(document.getElementById("contract_value")?.value),
      startDate: document.getElementById("contract_start")?.value,
      endDate: document.getElementById("contract_end")?.value,
      justification: document.getElementById("contract_justification")?.value,
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
    };

    if (window.app && typeof window.app.validateForm === 'function') {
      const formContainer = document.getElementById('drawer-content') || document.body;
      if (!window.app.validateForm(formContainer)) return;
    }

    if (
      !data.projectId ||
      !data.vendorName ||
      !data.title ||
      !data.value ||
      !data.justification
    ) {
      window.toast.show(
        "Please fill all required fields, including justification.",
        "warning",
      );
      return;
    }

    window.toast.show("Establishing contract...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          contractType: "vendor",
          materialsList: JSON.stringify(Array.from(document.querySelectorAll('input[name="contract_material"]:checked')).map(cb => {
            const idx = cb.value;
            const q = parseFloat(document.getElementById(`m_qty_${idx}`)?.value || 0);
            const p = parseFloat(document.getElementById(`m_price_${idx}`)?.value || 0);
            const m = parseFloat(cb.dataset.market || 0);
            return { name: cb.dataset.name, quantity: q, unit: cb.dataset.unit, unitPrice: p, marketPrice: m, variance: m - p, totalCost: p * q };
          })),
          refCode: "CON-" + Date.now().toString(36).toUpperCase(),
        }),
      });
      if (!res.ok) throw new Error("System error creating contract");

      // Send Notifications
      this.sendContractNotification(
        "Vendor Contract Established",
        `New Vendor Contract for ${data.vendorName} established by ${window.currentUser?.name}. Value: MWK ${data.value.toLocaleString()}. Justification: ${data.justification}`,
      );

      window.toast.show("Contract established successfully", "success");
      window.drawer.close();
      this.loadContractsData();
    } catch (err) {
      window.toast.show(err.message, "error");
    }
  },

  async sendContractNotification(title, message) {
    try {
      const token = localStorage.getItem("mcms_auth_token");
      await fetch("/api/v1/notifications/broadcast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          message: message,
          roles: ["Project Manager", "Finance Director"],
          priority: "high",
          type: "contract",
        }),
      });
    } catch (err) {
      console.warn("Broadcast notification failed:", err);
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

  renderLoadingState() {
    return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: var(--orange); margin-bottom: 12px;"></i>
                <div>Loading contracts...</div>
            </div>
        `;
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
             onmousedown="window.app.pmModule.selectVendorAutocomplete(${v.id}, '${v.name.replace(/'/g, "\\'")}', '${v.phone || ''}')">
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
  },

  renderEmptyState(message) {
    return `
            <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                <i class="fas fa-file-contract" style="font-size: 32px; margin-bottom: 12px;"></i>
                <div>${message}</div>
            </div>
        `;
  },

  escapeHTML(str) {
    return (
      str?.toString().replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[m],
      ) || ""
    );
  },
};
