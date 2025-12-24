/**
 * Finance Module
 * Handles financial management and reporting
 */
const FinanceModule = {
  transactions: [],

  /**
   * Initialize finance module
   */
  init() {
    console.log('Finance module initialized');
    this.loadTransactions();
  },

  /**
   * Load transactions from API
   */
  loadTransactions() {
    this.transactions = [
      {
        id: 'TXN-2024-001',
        date: '2024-02-15',
        description: 'Cement Supply Payment',
        vendor: 'Malawi Cement Company',
        amount: 5000000,
        type: 'expense',
        category: 'Materials',
        status: 'Completed',
        reference: 'INV-2024-001'
      },
      {
        id: 'TXN-2024-002',
        date: '2024-02-18',
        description: 'Equipment Rental',
        vendor: 'Heavy Equipment Rentals',
        amount: 3500000,
        type: 'expense',
        category: 'Equipment',
        status: 'Completed',
        reference: 'INV-2024-002'
      },
      {
        id: 'TXN-2024-003',
        date: '2024-02-20',
        description: 'Fuel Purchase',
        vendor: 'Puma Energy Malawi',
        amount: 1200000,
        type: 'expense',
        category: 'Fuel',
        status: 'Pending',
        reference: 'INV-2024-003'
      }
    ];
  },

  /**
   * Display transactions
   */
  displayTransactions() {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;

    tbody.innerHTML = this.transactions.map(txn => `
      <tr onclick="FinanceModule.viewTransaction('${txn.id}')">
        <td data-label="Date">${txn.date}</td>
        <td data-label="Description">${txn.description}</td>
        <td data-label="Vendor">${txn.vendor}</td>
        <td data-label="Amount">MWK ${txn.amount.toLocaleString()}</td>
        <td data-label="Category">${txn.category}</td>
        <td data-label="Status">
          <span class="status ${txn.status.toLowerCase()}">${txn.status}</span>
        </td>
      </tr>
    `).join('');
  },

  /**
   * View transaction details
   */
  viewTransaction(transactionId) {
    const txn = this.transactions.find(t => t.id === transactionId);
    if (!txn) {
      NotificationComponent.error('Transaction not found');
      return;
    }

    const modalId = 'transaction-details-modal';
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
          <h3 class="modal-title">Transaction Details</h3>
          <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="modal-body" style="display: grid; gap: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Transaction ID</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--slate-900);">${txn.id}</div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Description</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--slate-900);">${txn.description}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Date</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${txn.date}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Status</div>
              <span class="status ${txn.status.toLowerCase()}">${txn.status}</span>
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Amount</div>
            <div style="font-size: 24px; font-weight: 800; color: var(--orange);">MWK ${txn.amount.toLocaleString()}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Category</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${txn.category}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Reference</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${txn.reference}</div>
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Vendor</div>
            <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${txn.vendor}</div>
          </div>
          
          <div style="display: flex; gap: 12px; padding-top: 20px;">
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
   * Generate financial report
   */
  generateReport(reportType) {
    NotificationComponent.info(`Generating ${reportType} report`);
  },

  /**
   * Export transactions
   */
  exportTransactions(format = 'csv') {
    NotificationComponent.success(`Exporting transactions as ${format.toUpperCase()}`);
  }
};
