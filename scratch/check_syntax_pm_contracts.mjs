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
    this.currentContractTab = localStorage.getItem("mcms_contract_tab") || "project";
    this.projectFilter = "";
    this.vendorFilter = "";

    setTimeout(() => this.loadContractsData(), 0);

    return `
            <div class="data-card" style="margin-bottom: 24px;">
                <div class="data-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title">Contract Registry & Legal Repository</div>
                    <div style="display: flex; gap: 12px;">
                    </div>
                </div>
                
                <div class="tabs" style="margin-bottom: 0; padding: 0 24px; border-bottom: 1px solid var(--slate-200);">
                    <div class="tab ${this.currentContractTab === "project" ? "active" : ""}" data-tab="project" onclick="window.app.pmModule.switchContractTab('project')">Project Contracts</div>
                    <div class="tab ${this.currentContractTab === "vendor" ? "active" : ""}" data-tab="vendor" onclick="window.app.pmModule.switchContractTab('vendor')">Vendor Contracts</div>
                    <div class="tab ${this.currentContractTab === "rental" ? "active" : ""}" data-tab="rental" onclick="window.app.pmModule.switchContractTab('rental')">Vehicle Rentals</div>
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

      // Load contracts based on tab
      let allContracts = [];
      if (this.currentContractTab === "rental") {
        const [rentalRes, contractRes] = await Promise.all([
          window.vehicleRentalsApi.getAll({ limit: 50 }),
          contracts.getAll({ limit: 50 })
        ]);
        
        const specificRentals = rentalRes.data || rentalRes || [];
        const generalContracts = Array.isArray(contractRes.data) ? contractRes.data : (contractRes.contracts || contractRes || []);
        
        // Merge them
        allContracts = [
          ...specificRentals,
          ...generalContracts.filter(c => c.contractType === 'rental' || c.contractType === 'RENTAL')
        ];
      } else {
        const response = await contracts.getAll({ limit: 50 });
        const data = response.data || response;
        allContracts = Array.isArray(data) ? data : data.contracts || [];
      }

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
    let filtered = (Array.isArray(this.allContracts) ? this.allContracts : []).filter((c) => {
      if (this.currentContractTab === "rental") {
        return c.contractType === "rental" || c.contractType === "RENTAL";
      } else if (this.currentContractTab === "vendor") {
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
      container.innerHTML = this.renderEmptyState(
        "No contracts match the selected filters.",
      );
      return;
    }

    const rows = filtered
      .map((item) => {
        if (this.currentContractTab === "rental") {
          const machineName = item.machineType || item.title || "Rental Equipment";
          const rate = item.dailyRate || item.value || 0;
          return `
                <tr>
                    <td><span class="project-id">${this.escapeHTML(item.refCode || item.code || "VRC-" + item.id)}</span></td>
                    <td style="font-weight:600;">${this.escapeHTML(machineName)} ${item.plateNumber ? `(${item.plateNumber})` : ""}</td>
                    <td>${this.escapeHTML(item.vendorName || item.vendor?.name || item.vendor || "N/A")}</td>
                    <td><span class="status active" style="background:var(--blue-light); color:var(--blue-dark);">${this.escapeHTML(item.type || item.contractType || "Rental")}</span></td>
                    <td style="font-weight: 600; color: var(--orange);">MWK ${Number(rate).toLocaleString()}</td>
                    <td>${item.endDate ? new Date(item.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="window.app.pmModule?.viewContract(${item.id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        }

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
                        <th>${this.currentContractTab === "rental" ? "Machine Type" : "Title"}</th>
                        ${this.currentContractTab === "vendor" || this.currentContractTab === "rental" ? "<th>Vendor</th>" : ""}
                        <th>Type</th>
                        <th>${this.currentContractTab === "rental" ? "Daily Rate" : "Version"}</th>
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

      // Get IDs of projects that already have a master contract
      const projectsWithMaster = new Set(
        (Array.isArray(this.allContracts) ? this.allContracts : [])
          .filter(c => c.contractType === 'project' || c.contractType === 'client')
          .map(c => c.projectId)
      );

      select.innerHTML =
        '<option value="">Select a project...</option>' +
        projects
          .filter(p => !projectsWithMaster.has(p.id))
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
      const file = e.target.files[0];
      if (file) {
        if (file.size > 25 * 1024 * 1024) {
          window.toast.show("File size exceeds 25MB limit. Please upload a smaller PDF.", "error");
          e.target.value = "";
          status.innerHTML = `<span style="color: var(--red); font-weight: 700;">File too large (>25MB)</span>`;
          dropZone.style.borderColor = "var(--red)";
          return;
        }
        status.innerHTML = `<span style="color: var(--emerald); font-size: 12px;"><i class="fas fa-check-circle"></i> ${file.name}</span>`;
        dropZone.style.borderColor = "var(--emerald)";
      }
    };

    const valueInput = document.getElementById("contract_value");
    if (valueInput) {
      valueInput.oninput = () => this.calculateContractPerformance();
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
    // 1. Full Form Validation (Zod-like check via window.V)
    if (window.V && typeof window.V.validateForm === 'function') {
      const formContainer = document.getElementById('drawer-content') || document.body;
      if (!window.V.validateForm(formContainer)) {
        window.toast.show("Please correct the highlighted errors before submitting.", "warning");
        return;
      }
    }

    // 2. Document Size Check
    const fileInput = document.getElementById("contract_document");
    const file = fileInput?.files?.[0];
    if (file) {
      const MAX_SIZE = 25 * 1024 * 1024; // 25MB limit
      if (file.size > MAX_SIZE) {
        window.toast.show("Document exceeds the 25MB limit. Please compress and re-upload.", "error");
        return;
      }
    }

    // 3. Extract Data
    const startDateRaw = document.getElementById("contract_start")?.value;
    const endDateRaw = document.getElementById("contract_end")?.value;
    const contractValue = parseFloat(document.getElementById("contract_value")?.value || 0);
    const vendorName = document.getElementById("contract_vendor")?.value || "";

    // 4. Date Logic Validation
    if (startDateRaw && endDateRaw && new Date(endDateRaw) < new Date(startDateRaw)) {
      window.toast.show("Completion deadline must be after the commencement date.", "error");
      return;
    }

    const data = {
      projectId: document.getElementById("contract_project")?.value,
      vendorName: vendorName,
      vendorPhone: document.getElementById("contract_vendor_phone")?.value,
      vendorId: document.getElementById("contract_vendor_id")?.value,
      title: document.getElementById("contract_title")?.value,
      value: contractValue,
      startDate: startDateRaw,
      endDate: endDateRaw,
      justification: document.getElementById("contract_justification")?.value,
      contractType: vendorName ? "vendor" : "project", // AUTO-DETECT
    };

    if (!data.projectId || !data.title || !data.value) {
      window.toast.show("Please fill all required fields.", "warning");
      return;
    }

    window.toast.show("Establishing contract...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const formData = new FormData();

      // Append core fields
      Object.entries(data).forEach(([key, val]) => {
        if (val !== null && val !== undefined) formData.append(key, val);
      });

      // Handle materials if this is a vendor supply contract
      if (data.contractType === "vendor") {
        const checkboxes = document.querySelectorAll('input[name="contract_material"]:checked');
        const materials = Array.from(checkboxes).map(cb => {
          const index = cb.value;
          const qtyInput = document.getElementById(`m_qty_${index}`);
          const units = parseFloat(qtyInput?.value || 1);
          
          let effectiveQty = units;
          if (data.contractType === "rental" || data.contractType === "vendor") { // Check if we have dates for multiplier
              const start = new Date(startDateRaw);
              const end = new Date(endDateRaw);
              if (!isNaN(start) && !isNaN(end) && end >= start) {
                  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  if (days > 0 && cb.dataset.unit === "Day") {
                      effectiveQty = units * days;
                  }
              }
          }

          return {
            materialName: cb.dataset.name,
            quantity: effectiveQty,
            unit: cb.dataset.unit || "Day",
            unitPrice: parseFloat(cb.dataset.market || 0)
          };
        });
        formData.append('materialsList', JSON.stringify(materials));
      }

      if (file) {
        formData.append('document', file);
      }

      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "System error creating contract");
      }

      window.toast.show("Contract established successfully", "success");
      window.drawer.close();
      this.loadContractsData();

      // Audit Log
      import('../../../src/api/client.js').then(m => {
        m.default.post("/audit-logs", {
          action: "VENDOR_CONTRACT_CREATED",
          targetType: "CONTRACT",
          targetId: res.data?.id || res.id,
          details: { title: data.title, vendorName: data.vendorName, value: data.value, actor: window.currentUser?.name }
        });
      }).catch(e => console.warn("Audit failed", e));

      // Notifications
      const materials = data.materialsList ? JSON.parse(data.materialsList).map(m => m.name).join(", ") : "General Services";
      this.broadcastContractEvent("Vendor Contract Established",
        `New Vendor Contract established for "${data.title}" (Materials: ${materials}) by ${window.currentUser?.name || 'Project Manager'}. Value: MWK ${data.value.toLocaleString()}.`,
        data.projectId,
        ["Project Manager", "Finance Director", "Equipment Coordinator"]
      );
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

  openNewVendorContract() {
    this.currentContractTab = localStorage.getItem("mcms_contract_tab") || "project";
    const isRental = this.currentContractTab === "rental";
    window.drawer.open(
      isRental ? "Vehicle Rental Agreement" : "New Vendor Contract",
      isRental ? window.DrawerTemplates.newRentalContract : window.DrawerTemplates.newVendorContract,
      'lg'
    );
    setTimeout(() => {
      this.loadContractProjects();
      this.initMasterContractUpload();
    }, 100);
  },

  async onProjectRentalSelected(projectId) {
    if (!projectId) return;

    const vehiclesBody = document.getElementById("contract-vehicles-body");
    if (vehiclesBody) {
      vehiclesBody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Analyzing equipment gaps...</td></tr>`;
    }

    try {
      const token = localStorage.getItem("mcms_auth_token");

      // 1. Fetch Project Details (for budget/dates)
      const projectRes = await fetch(`/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const projectResult = await projectRes.json();
      const project = projectResult.data || projectResult;

      // 2. Fetch Equipment / Vehicles
      let equipmentGaps = [];
      try {
        const gapRes = await fetch(`/api/v1/road-estimation/${projectId}/equipment-gap`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const gapResult = await gapRes.json();
        equipmentGaps = gapResult.data || gapResult || [];
      } catch (e) { console.warn("Gap API failed"); }

      // Provide a comprehensive standard catalog of construction vehicles and their daily rental rates
      // This ensures we always show vehicles, not materials.
      if (equipmentGaps.length === 0) {
        equipmentGaps = [
          { machineType: "Excavator (20T)", unit: "Day", basePrice: 450000, totalRequired: 4, onSite: 1 },
          { machineType: "Motor Grader (140K)", unit: "Day", basePrice: 650000, totalRequired: 2, onSite: 0 },
          { machineType: "Vibratory Roller (10T)", unit: "Day", basePrice: 350000, totalRequired: 3, onSite: 1 },
          { machineType: "Water Tanker (10,000L)", unit: "Day", basePrice: 180000, totalRequired: 5, onSite: 2 },
          { machineType: "Tipper Truck (15m³)", unit: "Day", basePrice: 220000, totalRequired: 15, onSite: 5 },
          { machineType: "Front End Loader", unit: "Day", basePrice: 380000, totalRequired: 2, onSite: 0 },
          { machineType: "Bulldozer (D8)", unit: "Day", basePrice: 850000, totalRequired: 1, onSite: 0 },
          { machineType: "Backhoe Loader (TLB)", unit: "Day", basePrice: 250000, totalRequired: 2, onSite: 1 },
          { machineType: "Mobile Crane (25T)", unit: "Day", basePrice: 750000, totalRequired: 1, onSite: 0 },
          { machineType: "Lowbed Truck", unit: "Day", basePrice: 500000, totalRequired: 1, onSite: 0 },
          { machineType: "Concrete Mixer Truck", unit: "Day", basePrice: 300000, totalRequired: 3, onSite: 0 },
          { machineType: "Pneumatic Roller", unit: "Day", basePrice: 320000, totalRequired: 2, onSite: 0 }
        ];
      }

      // 3. Update Vehicle Table
      if (vehiclesBody) {
        vehiclesBody.innerHTML = equipmentGaps.map((m, idx) => {
          const gap = Math.max(0, m.totalRequired - m.onSite);
          return `
            <tr style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 10px; text-align: center;">
                    <input type="checkbox" name="contract_material" value="${idx}" 
                        data-name="${m.machineType}" data-unit="${m.unit}" data-market="${m.basePrice}" data-gap="${gap}"
                        onchange="const cbs = document.querySelectorAll('input[name=\\'contract_material\\']'); cbs.forEach(cb => { if(cb !== this) cb.checked = false; }); window.app.pmModule.calculateContractPerformance()">
                </td>
                <td style="padding: 10px;">
                    <div style="font-weight: 700; color: var(--slate-800);">${m.machineType}</div>
                    <div style="font-size: 10px; color: var(--slate-500);">Market: MWK ${m.basePrice.toLocaleString()}/day</div>
                </td>
                <td style="padding: 10px; text-align: center;">
                    <div id="rental_days_display_${idx}" style="font-weight: 700; color: var(--slate-800);">0 Days</div>
                    <div style="font-size: 10px; color: var(--slate-500);">Est: ${m.totalRequired} ${m.unit}s</div>
                </td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <input type="number" id="m_qty_${idx}" class="form-input" style="width: 70px; padding: 4px; font-size: 11px; text-align: center; font-weight: 700;" 
                            value="1" min="1" oninput="window.app.pmModule.calculateContractPerformance()">
                        <span style="font-size: 9px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">Unit(s)</span>
                    </div>
                </td>
            </tr>
          `;
        }).join('');
      }

      // Update Budget Stats (reuse existing logic if IDs match)
      const budget = Number(project.budgetTotal || 0);
      const spent = Number(project.budgetSpent || 0);
      const remaining = Math.max(0, budget - spent);
      const util = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      const elements = {
        funds: document.getElementById("contract_available_funds"),
        util: document.getElementById("contract_utilization_percent"),
        bar: document.getElementById("contract_utilization_bar"),
        spent: document.getElementById("contract_spent_display"),
        safety: document.getElementById("contract_safety_display")
      };

      if (elements.funds) elements.funds.textContent = `MWK ${remaining.toLocaleString()}`;
      if (elements.util) elements.util.textContent = `${util}%`;
      if (elements.bar) {
        elements.bar.style.width = `${util}%`;
        elements.bar.style.background = util > 90 ? 'var(--red)' : util > 75 ? 'var(--orange)' : 'var(--emerald)';
      }
      if (elements.spent) elements.spent.textContent = `Spent: MWK ${spent.toLocaleString()}`;

      // Auto-fill dates
      const startEl = document.getElementById("contract_start");
      const endEl = document.getElementById("contract_end");
      if (startEl && project.startDate) startEl.value = project.startDate.split("T")[0];
      if (endEl && project.endDate) endEl.value = project.endDate.split("T")[0];

      this.calculateContractPerformance();

    } catch (err) {
      console.error("Equipment analysis failed:", err);
      window.toast.show("Error synchronizing equipment data", "error");
    }
  },

  initMasterContractUpload() {
    const dropZone = document.getElementById("contract-drop-zone");
    const fileInput = document.getElementById("contract_document");
    const status = document.getElementById("contract-file-status");
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
    const materialsBody = document.getElementById("contract-materials-body");
    if (materialsBody) {
      materialsBody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading materials...</td></tr>`;
    }

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const project = result.data || result;

      // 1. Fetch Project Materials (Strict Filter)
      const allEstimations = project.estimations || [];
      const projectMaterials = allEstimations.length > 0
        ? allEstimations.filter(e => {
          const name = (e.materialName || e.title || "").toLowerCase();
          const unit = (e.unit || "").toLowerCase();
          // Stricter Material Check: Must NOT be hire/rental and unit must be a physical quantity
          const isService = name.includes("hire") || name.includes("lease") || name.includes("rental") ||
            name.includes("mobilization") || name.includes("construction") || name.includes("survey");
          const isEquipmentUnit = unit.includes("day") || unit.includes("hour") || unit.includes("km");

          return !isService && !isEquipmentUnit;
        })
        : [
          { materialName: "Gravel (Fill)", unit: "m3", basePrice: 8925, totalRequired: 31250 },
          { materialName: "Natural Gravel", unit: "m3", basePrice: 12600, totalRequired: 22500 },
          { materialName: "Crushed Stone (G2)", unit: "m3", basePrice: 26250, totalRequired: 18750 },
          { materialName: "Bitumen (80/100)", unit: "Liters", basePrice: 1890, totalRequired: 562500 },
          { materialName: "Concrete (Class 25)", unit: "m3", basePrice: 157500, totalRequired: 5000 },
          { materialName: "Road Paint", unit: "Liters", basePrice: 5775, totalRequired: 2500 }
        ];

      // 2. Fetch Existing Contracts to calc "Already Contracted"
      const contractsRes = await fetch(`/api/v1/contracts?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contractsResult = await contractsRes.json();
      const existingContracts = Array.isArray(contractsResult.data) ? contractsResult.data : (Array.isArray(contractsResult) ? contractsResult : []);

      const contractedMap = {};
      existingContracts.forEach(c => {
        (c.items || []).forEach(item => {
          const name = item.materialName || item.title;
          contractedMap[name] = (contractedMap[name] || 0) + Number(item.quantity || 0);
        });
      });

      // 3. Update Material Table
      if (materialsBody) {
        materialsBody.innerHTML = projectMaterials.map((m, idx) => {
          const already = contractedMap[m.materialName] || 0;
          const remaining = Math.max(0, m.totalRequired - already);
          return `
            <tr style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 10px; text-align: center;">
                    <input type="checkbox" name="contract_material" value="${idx}" 
                        data-name="${m.materialName}" data-unit="${m.unit}" data-market="${m.basePrice}"
                        onchange="window.app.pmModule.calculateContractPerformance()">
                </td>
                <td style="padding: 10px;">
                    <div style="font-weight: 700; color: var(--slate-800);">${m.materialName}</div>
                    <div style="font-size: 10px; color: var(--slate-500);">${m.unit} • Est. MWK ${m.basePrice.toLocaleString()}/unit</div>
                </td>
                <td style="padding: 10px; text-align: center; color: var(--slate-600);">${m.totalRequired.toLocaleString()}</td>
                <td style="padding: 10px; text-align: center; color: var(--orange); font-weight: 600;">${already.toLocaleString()}</td>
                <td style="padding: 10px; text-align: center;">
                    <input type="number" id="m_qty_${idx}" class="form-input" style="width: 70px; padding: 4px; font-size: 11px; text-align: center;" 
                        value="${remaining}" oninput="window.app.pmModule.calculateContractPerformance()">
                </td>
            </tr>
          `;
        }).join('');
      }

      // 4. Update Budget Control Stats
      const budget = Number(project.budgetTotal || 0);
      const spent = Number(project.budgetSpent || 0);
      const remainingFunds = Math.max(0, budget - spent);
      const util = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      const elements = {
        funds: document.getElementById("contract_available_funds"),
        util: document.getElementById("contract_utilization_percent"),
        bar: document.getElementById("contract_utilization_bar"),
        spent: document.getElementById("contract_spent_display"),
        safety: document.getElementById("contract_safety_display")
      };

      if (elements.funds) elements.funds.textContent = `MWK ${remainingFunds.toLocaleString()}`;
      if (elements.util) elements.util.textContent = `${util}%`;
      if (elements.bar) {
        elements.bar.style.width = `${util}%`;
        elements.bar.style.background = util > 90 ? 'var(--red)' : util > 75 ? 'var(--orange)' : 'var(--emerald)';
      }
      if (elements.spent) elements.spent.textContent = `Spent: MWK ${spent.toLocaleString()}`;
      if (elements.safety) {
        const safe = 100 - util;
        elements.safety.textContent = `${safe}% Safe`;
        elements.safety.style.color = safe < 10 ? 'var(--red)' : safe < 25 ? 'var(--orange)' : 'var(--emerald)';
      }

      // 5. Dates
      const startEl = document.getElementById("contract_start");
      const endEl = document.getElementById("contract_end");
      if (startEl && project.startDate) startEl.value = project.startDate.split("T")[0];
      if (endEl && project.endDate) endEl.value = project.endDate.split("T")[0];

      this.calculateContractPerformance();
      window.toast.show(`Project context established for ${project.name}`, "info");

    } catch (err) {
      console.error("Auto-fill failed:", err);
      window.toast.show("Error synchronizing project data", "error");
    }
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

  async onProjectRentalSelected(projectId, phaseNum = null) {
    if (!projectId) return;
    const vehiclesBody = document.getElementById('contract-vehicles-body');
    const phaseSelect = document.getElementById('contract_phase');
    const phaseContainer = document.getElementById('rental_phase_container');

    if (vehiclesBody) {
      vehiclesBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Analyzing fleet requirements...</td></tr>`;
    }

    try {
      const token = localStorage.getItem("mcms_auth_token");
      
      // 1. Fetch Project Details to get Phases
      const projectRes = await fetch(`/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projectResult = await projectRes.json();
      const project = projectResult.data || projectResult;

      // 2. Update Phase Dropdown if not already populated
      if (phaseSelect && project.phases && (phaseSelect.options.length <= 1 || !phaseNum)) {
          phaseSelect.innerHTML = '<option value="">All Project Requirements</option>';
          project.phases.forEach((p, i) => {
              const opt = document.createElement('option');
              opt.value = i + 1;
              opt.textContent = `Stage ${i + 1}: ${p.name}`;
              if (phaseNum == (i + 1)) opt.selected = true;
              phaseSelect.appendChild(opt);
          });
          if (phaseContainer) phaseContainer.style.display = 'block';
      }

      // 3. Fetch Equipment Gaps
      const resp = await fetch(`/api/v1/projects/${projectId}/equipment-gap`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await resp.json();
      const payload = result.data || result;
      let gaps = [];

      if (payload.needsRental) {
        gaps = payload.needsRental;
      } else if (Array.isArray(payload)) {
        gaps = payload;
      } else if (payload.data && Array.isArray(payload.data)) {
        gaps = payload.data;
      }

      // 4. Apply Phase Filtering
      if (phaseNum) {
          const pNum = parseInt(phaseNum);
          gaps = gaps.filter(v => {
              // Check if machine is required in this phase
              // The API usually returns 'phases' array or we check v.phaseKeys
              if (!v.phaseKeys) return true; // Fallback to showing all if no phase data
              return v.phaseKeys.includes(pNum);
          });
      }

      if (!gaps || gaps.length === 0) {
        vehiclesBody.innerHTML = `<tr><td colspan="5" style="padding:40px; text-align:center; color:var(--slate-400);">No equipment gaps identified for ${phaseNum ? 'this stage' : 'this project'}.</td></tr>`;
        return;
      }

      vehiclesBody.innerHTML = gaps.map((v, idx) => {
        const name = v.label || v.name || v.type || v.machineType;
        const rate = v.dailyRate || v.rate || v.basePrice || 0;
        const estDays = v.estimatedDays || v.totalRequired || 1;

        return `
          <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.2s;">
            <td style="padding: 12px; text-align: center;">
              <input type="checkbox" name="contract_material" value="${idx}" 
                data-name="${name}" data-market="${rate}"
                style="width: 18px; height: 18px; cursor: pointer;"
                onchange="(window.app?.pmModule || window.app?.fmModule || window.app?.ecModule)?.calculateContractPerformance()">
            </td>
            <td style="padding: 12px;">
              <div style="font-weight: 700; color: var(--slate-900); font-size: 13px;">${name}</div>
              <div style="font-size: 10px; color: var(--slate-500); margin-top: 2px;">Market Baseline: MWK ${rate.toLocaleString()}/day</div>
            </td>
            <td style="padding: 12px; text-align: center;">
              <div id="rental_days_display_${idx}" style="font-weight: 700; color: var(--slate-700); font-size: 13px;">${estDays} Days</div>
              <div style="font-size: 9px; color: var(--slate-400); text-transform: uppercase; font-weight: 800; margin-top: 2px;">Estimated Need</div>
            </td>
            <td style="padding: 12px; text-align: center;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <input type="number" id="m_qty_${idx}" class="form-input" 
                    style="width: 70px; padding: 6px; border-radius: 6px; border: 1px solid var(--slate-200); text-align: center; font-weight: 800; background: #F8FAFC;" 
                    value="1" min="1" oninput="(window.app?.pmModule || window.app?.fmModule || window.app?.ecModule)?.calculateContractPerformance()">
                <span style="font-size: 9px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">Unit(s)</span>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Generate Reference Code
      const refInput = document.getElementById("contract_ref");
      if (refInput && !refInput.value) refInput.value = `REN-PM-${Math.floor(1000 + Math.random() * 9000)}`;

      this.fetchBudgetStatus(projectId);
    } catch (err) {
      console.error(err);
      vehiclesBody.innerHTML = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--red);">Failed to analyze fleet requirements.</td></tr>`;
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
           window.toast.show("Demobilization must be after mobilization date", "warning");
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
      return {
        [isRental ? 'name' : 'materialName']: cb.dataset.name,
        quantity: parseFloat(qtyInput?.value || 0),
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

    const file = fileInput.files[0];
    if (file && file.size > 25 * 1024 * 1024) {
      window.toast.show("Contract document exceeds 25MB limit.", "error");
      return;
    }
    const contractValue = parseFloat(document.getElementById("contract_value")?.value || 0);
    const projectId = document.getElementById("contract_project")?.value;

    // 4. Budget Check
    const remainingBudget = Number(this.currentProjectBudget?.remaining || 0);
    if (contractValue > remainingBudget && remainingBudget > 0) {
      window.modal.confirm(
        "Budget Exceeded",
        `This contract (MWK ${contractValue.toLocaleString()}) exceeds the available project budget (Remaining: MWK ${remainingBudget.toLocaleString()}). Proceed anyway?`,
        () => this.executeSubmitContract(isRental, items, contractValue, file, projectId)
      );
    } else {
      this.executeSubmitContract(isRental, items, contractValue, file, projectId);
    }
  },

  async executeSubmitContract(isRental, items, contractValue, file, projectId) {
    window.toast.show("Archiving contract...", "info");

    try {
      const token = localStorage.getItem("mcms_auth_token");
      const formData = new FormData();

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
      formData.append("contractType", isRental ? "rental" : "vendor");
      formData.append("document", file);
      formData.append(isRental ? 'equipmentList' : 'materialsList', JSON.stringify(items));

      const refCode = document.getElementById("contract_ref")?.value ||
        (isRental ? 'REN' : 'PM') + "-MOW-" + Math.floor(1000 + Math.random() * 9000);
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
      fetch("/api/v1/audit-logs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "CONTRACT_CREATED",
          targetType: "CONTRACT",
          details: { type: isRental ? 'RENTAL' : 'VENDOR', projectId, value: contractValue }
        })
      }).catch(e => console.warn("Audit failed", e));

    } catch (err) {
      window.toast.show(err.message, "error");
    }
  },
  async submitProjectContract() {
    console.log("[DEBUG] PM_Contracts: submitProjectContract started");

    // Validation
    if (window.V && !window.V.validateForm(document.getElementById('drawer-content') || document.body)) {
      console.warn("[DEBUG] PM_Contracts: Validation failed");
      return;
    }

    const projectSelect = document.getElementById("contract_project");
    const projectId = projectSelect?.value;
    const projectLabel = projectSelect?.options[projectSelect.selectedIndex]?.textContent || "";
    const projectCode = projectLabel.split("–")[0]?.trim() || "PRJ";

    // Auto-generate refCode since template has no contract_ref field
    const refCode = `MOW-${projectCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const title = document.getElementById("contract_title")?.value?.trim();
    const value = parseFloat(document.getElementById("contract_value")?.value);
    const startDate = document.getElementById("contract_start")?.value;
    const endDate = document.getElementById("contract_end")?.value;
    const justification = document.getElementById("contract_justification")?.value?.trim();
    const fileInput = document.getElementById("contract_document");
    const file = fileInput?.files?.[0];

    if (!projectId || isNaN(value) || !justification || !title) {
      window.toast.show(
        "Please fill all required fields, including title and justification.",
        "warning",
      );
      return;
    }

    if (!file) {
      window.toast.show("Please upload the signed master document.", "warning");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      window.toast.show("Document exceeds the 25MB limit. Please compress and re-upload.", "error");
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
      formData.append("title", title);
      formData.append("contractType", "project");
      formData.append("document", file);

      const token = localStorage.getItem("mcms_auth_token");
      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to archive contract");
      }

      // Send Notifications
      this.sendContractNotification(
        "Master Agreement Created",
        `Project Master for ${refCode} has been archived by ${window.currentUser?.name}. Justification: ${justification}`,
      );

      window.toast.show("Master agreement archived", "success");
      this.selectedMasterFile = null;
      window.drawer.close();
      this.loadContractsData();

      // Audit Log
      import('../../../src/api/client.js').then(m => {
        m.default.post("/audit-logs", {
          action: "CONTRACT_ARCHIVED",
          targetType: "CONTRACT",
          targetId: res.data?.id || res.id,
          details: { title, projectId, refCode, value, actor: window.currentUser?.name }
        });
      }).catch(e => console.warn("Audit failed", e));

      // Notifications
      const projectName = (this.allContracts || []).find(c => c.projectId == projectId)?.project?.name || "the project";
      this.broadcastContractEvent("Master Agreement Archived",
        `Project Master for "${projectName}" has been archived by ${window.currentUser?.name || 'Project Manager'}. Justification: ${justification}`,
        projectId,
        ["Project Manager", "Finance Director", "Equipment Coordinator"]
      );
    } catch (err) {
      console.error("[Contract Error]", err);
      window.toast.show(err.message || "Failed to archive contract", "error");
    }
  },

  async broadcastContractEvent(title, message, projectId, roles = []) {
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

      await fetch("/api/v1/notifications/broadcast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Notification broadcast failed", err);
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

      // Audit Log
      import('../../../src/api/client.js').then(m => {
        m.default.post("/audit-logs", {
          action: "CONTRACT_VERSION_CREATED",
          targetType: "CONTRACT",
          targetId: contractId,
          details: { changeNotes: notes, actor: window.currentUser?.name }
        });
      }).catch(e => console.warn("Audit failed", e));

      // Notifications
      const contract = (this.allContracts || []).find(c => c.id == contractId);
      const materials = contract?.items?.map(i => i.materialName).join(", ") || "General Services";
      this.broadcastContractEvent("Contract Revised",
        `Contract "${contract?.title || 'Contract'}" (Materials: ${materials}) has been revised by ${window.currentUser?.name || 'Project Manager'}. Change: ${notes}`,
        contract?.projectId,
        ["Project Manager", "Finance Director", "Equipment Coordinator"]
      );

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

      if (projectId) {
        const projectRes = await fetch(`/api/v1/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const projectData = await projectRes.json();
        const project = projectData.data || projectData;
        if (project.fieldSupervisorId) {
          payload.users = [project.fieldSupervisorId];
        }
      }

      await client.post("/notifications/broadcast", payload);
    } catch (err) {
      console.warn("Notification broadcast failed", err);
    }
  },
};
