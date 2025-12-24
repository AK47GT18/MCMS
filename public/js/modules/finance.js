/**
 * Finance Module - Commitments
 * Handles commitments management, viewing, creating, and editing
 */
const FinanceModule = {
  // Sample data store
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
    }
  },

  /**
   * View commitment details
   */
  viewCommitment(contractId) {
    const commitment = this.commitments[contractId];
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!modalOverlay || !modalTitle || !modalBody) {
      console.error('Modal elements not found');
      return;
    }

    modalTitle.textContent = 'Commitment Details';
    
    if (commitment) {
      modalBody.innerHTML = this.renderCommitmentDetails(commitment);
    } else {
      modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--slate-500);">
          <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
          <div style="font-size: 16px; font-weight: 600;">Commitment not found</div>
        </div>
      `;
    }
    
    modalOverlay.classList.add('show');
  },

  /**
   * Render commitment details template
   */
  renderCommitmentDetails(commitment) {
    return `
      <div style="display: grid; gap: 20px;">
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
          <button class="btn btn-primary" style="flex: 1;" onclick="FinanceModule.editCommitment('${commitment.contract}')">
            <i class="fas fa-edit"></i>
            <span>Edit</span>
          </button>
          <button class="btn btn-secondary" onclick="closeModal()">
            <span>Close</span>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Create new commitment
   */
  createCommitment() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!modalOverlay || !modalTitle || !modalBody) {
      console.error('Modal elements not found');
      return;
    }

    modalTitle.textContent = 'Create New Commitment';
    modalBody.innerHTML = `
      <form onsubmit="FinanceModule.saveCommitment(event)">
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
          <button type="button" class="btn btn-secondary" onclick="closeModal()">
            <span>Cancel</span>
          </button>
        </div>
      </form>
    `;
    
    modalOverlay.classList.add('show');
  },

  /**
   * Save commitment
   */
  saveCommitment(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Post to API
    ApiService.post('/api/v1/commitments', Object.fromEntries(formData))
      .then(response => {
        NotificationManager.success('Commitment saved successfully!');
        closeModal();
        // Reload table
        location.reload();
      })
      .catch(error => {
        console.error('Error saving commitment:', error);
        NotificationManager.error('Failed to save commitment');
      });
  },

  /**
   * Edit commitment
   */
  editCommitment(contractId) {
    const commitment = this.commitments[contractId];
    
    if (!commitment) {
      NotificationManager.error('Commitment not found');
      return;
    }

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = 'Edit Commitment';
    modalBody.innerHTML = `
      <form onsubmit="FinanceModule.updateCommitment(event, '${contractId}')">
        <div class="form-group">
          <label class="form-label">Contract Title</label>
          <input type="text" class="form-input" value="${commitment.title}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Vendor</label>
          <select class="form-select" required>
            <option value="${commitment.vendor}">${commitment.vendor}</option>
            <option>Malawi Cement Company</option>
            <option>Steel Supply Ltd</option>
            <option>Heavy Equipment Rentals</option>
            <option>Construction Materials Co</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Contract Value (MWK)</label>
          <input type="number" class="form-input" value="${commitment.amount}" required>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" class="form-input" value="${commitment.startDate}" required>
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="date" class="form-input" value="${commitment.endDate}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" required>${commitment.description}</textarea>
        </div>
        
        <div style="display: flex; gap: 12px; padding-top: 20px;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">
            <i class="fas fa-save"></i>
            <span>Update Commitment</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">
            <span>Cancel</span>
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Update commitment
   */
  updateCommitment(event, contractId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Put to API
    ApiService.put(`/api/v1/commitments/${contractId}`, Object.fromEntries(formData))
      .then(response => {
        NotificationManager.success('Commitment updated successfully!');
        closeModal();
        // Reload table
        location.reload();
      })
      .catch(error => {
        console.error('Error updating commitment:', error);
        NotificationManager.error('Failed to update commitment');
      });
  }
};
