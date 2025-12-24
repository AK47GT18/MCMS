/**
 * Commitments Module
 * Handles commitment/contract management functionality
 */
const CommitmentsModule = {
  commitments: {
    'CNT-2024-001': {
      contract: 'CNT-2024-001',
      title: 'M1 Road Construction Materials',
      vendor: 'Malawi Cement Company',
      status: 'Approved',
      amount: 145000000,
      progress: 75,
      startDate: '2024-01-15',
      endDate: '2024-12-30',
      description: 'Supply of cement, aggregates, and other construction materials for M1 Road rehabilitation project between Lilongwe and Mzuzu.',
      projectManager: 'Anthony Kanjira',
      approvedBy: 'Larry Kambala',
      approvalDate: '2024-01-10'
    },
    'CNT-2024-002': {
      contract: 'CNT-2024-002',
      title: 'Bridge Rehabilitation Steel Supply',
      vendor: 'Steel Supply Ltd',
      status: 'In Progress',
      amount: 89500000,
      progress: 45,
      startDate: '2024-03-01',
      endDate: '2024-11-15',
      description: 'Structural steel supply for bridge rehabilitation on M5 corridor.',
      projectManager: 'John Banda',
      approvedBy: 'Larry Kambala',
      approvalDate: '2024-02-25'
    },
    'CNT-2024-003': {
      contract: 'CNT-2024-003',
      title: 'Equipment Rental - Excavators',
      vendor: 'Heavy Equipment Rentals',
      status: 'Pending',
      amount: 52000000,
      progress: 0,
      startDate: '2024-05-01',
      endDate: '2024-10-30',
      description: 'Rental of excavators and related equipment for M5 project phase 2.',
      projectManager: 'James Mwale',
      approvedBy: 'Pending',
      approvalDate: null
    }
  },

  /**
   * Initialize module
   */
  init() {
    console.log('Commitments module initialized');
    this.setupEventListeners();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add event listeners for table interactions
    const tableBody = document.getElementById('table-body');
    if (tableBody) {
      tableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
          const contractId = row.querySelector('[data-label="Contract #"]')?.textContent?.trim();
          if (contractId) {
            this.viewCommitment(contractId);
          }
        }
      });
    }
  },

  /**
   * View commitment details
   */
  viewCommitment(contractId) {
    const commitment = this.commitments[contractId];
    if (!commitment) {
      NotificationComponent.error('Commitment not found');
      return;
    }

    const modalId = 'commitment-details-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
        }
      });
    }

    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Commitment Details</h3>
          <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="modal-body" style="display: grid; gap: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Contract Number</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--slate-900);">${commitment.contract}</div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Title</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--slate-900);">${commitment.title}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Vendor</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${commitment.vendor}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Status</div>
              <span class="status ${commitment.status.toLowerCase().replace(' ', '-')}">${commitment.status}</span>
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Contract Value</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--orange);">MWK ${commitment.amount.toLocaleString()}</div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Progress</div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="progress-bar" style="flex: 1;">
                <div class="progress-fill" style="width: ${commitment.progress}%"></div>
              </div>
              <span style="font-weight: 800; font-size: 16px; color: var(--slate-900);">${commitment.progress}%</span>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Start Date</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${commitment.startDate}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">End Date</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${commitment.endDate}</div>
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Description</div>
            <div style="font-size: 14px; line-height: 1.6; color: var(--slate-700);">${commitment.description}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-top: 20px; border-top: 1px solid var(--slate-200);">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Project Manager</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${commitment.projectManager}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Approved By</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${commitment.approvedBy}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; padding-top: 20px;">
            <button class="btn btn-primary" style="flex: 1;" onclick="CommitmentsModule.editCommitment('${commitment.contract}')">
              <i class="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').classList.remove('show')">
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  /**
   * Create new commitment
   */
  createCommitment() {
    const modalId = 'create-commitment-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
        }
      });
    }

    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Create New Commitment</h3>
          <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="modal-body">
          <form onsubmit="CommitmentsModule.saveCommitment(event)">
            <div class="form-group">
              <label class="form-label">Contract Title</label>
              <input type="text" class="form-input" placeholder="Enter contract title" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Vendor</label>
              <select class="form-select" required>
                <option value="">Select vendor</option>
                <option>Malawi Cement Company</option>
                <option>Steel Supply Ltd</option>
                <option>Heavy Equipment Rentals</option>
                <option>Construction Materials Co</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Contract Value (MWK)</label>
              <input type="number" class="form-input" placeholder="0.00" required>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-input" required>
              </div>
              <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" class="form-input" required>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" placeholder="Enter contract description" required></textarea>
            </div>
            
            <div style="display: flex; gap: 12px; padding-top: 20px;">
              <button type="submit" class="btn btn-primary" style="flex: 1;">
                <i class="fas fa-save"></i>
                <span>Save Commitment</span>
              </button>
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('${modalId}').classList.remove('show')">
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  /**
   * Save commitment
   */
  saveCommitment(event) {
    event.preventDefault();
    NotificationComponent.success('Commitment saved successfully!');
    document.getElementById('create-commitment-modal')?.classList.remove('show');
  },

  /**
   * Edit commitment
   */
  editCommitment(contractId) {
    NotificationComponent.info(`Editing commitment ${contractId}`);
    // Additional edit functionality can be added here
  },

  /**
   * Delete commitment
   */
  deleteCommitment(contractId) {
    if (confirm('Are you sure you want to delete this commitment?')) {
      delete this.commitments[contractId];
      NotificationComponent.success('Commitment deleted successfully');
      // Refresh table
      location.reload();
    }
  },

  /**
   * Filter commitments
   */
  filterCommitments(type, value) {
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach(row => {
      if (value === 'All Status' || value === 'All Vendors' || value === '') {
        row.style.display = '';
      } else {
        let show = false;
        if (type === 'status') {
          const statusCell = row.querySelector('[data-label="Status"]');
          if (statusCell && statusCell.textContent.includes(value)) {
            show = true;
          }
        } else if (type === 'vendor') {
          const vendorCell = row.querySelector('[data-label="Vendor"]');
          if (vendorCell && vendorCell.textContent.includes(value)) {
            show = true;
          }
        }
        row.style.display = show ? '' : 'none';
      }
    });
  }
};
