/**
 * Data Tables Module
 * Handles table operations, filtering, and tab switching
 */
const DataTables = {
  /**
   * Filter table by column
   */
  filterTable(type, value) {
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
  },

  /**
   * Switch between tabs
   */
  switchTab(element, tabName) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');
    
    // Handle tab switching logic
    console.log(`Switched to tab: ${tabName}`);
    
    // Future: Load tab content dynamically
    // this.loadTabContent(tabName);
  },

  /**
   * Load tab content dynamically
   */
  loadTabContent(tabName) {
    const pageContent = document.getElementById('page-content');
    
    if (!pageContent) return;
    
    // Show loading state
    pageContent.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><div>Loading...</div></div>';
    
    // Fetch tab content from server
    ApiService.get(`/api/v1/tabs/${tabName}`)
      .then(response => {
        pageContent.innerHTML = response.html;
      })
      .catch(error => {
        console.error('Error loading tab:', error);
        pageContent.innerHTML = '<div class="error">Failed to load content</div>';
      });
  },

  /**
   * Initialize table events
   */
  init() {
    // Set up filter event listeners
    const statusFilter = document.querySelector('select[onchange*="status"]');
    const vendorFilter = document.querySelector('select[onchange*="vendor"]');
    
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterTable('status', e.target.value);
      });
    }
    
    if (vendorFilter) {
      vendorFilter.addEventListener('change', (e) => {
        this.filterTable('vendor', e.target.value);
      });
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DataTables.init();
});
