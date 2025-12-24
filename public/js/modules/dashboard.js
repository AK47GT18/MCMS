/**
 * Dashboard Module
 * Handles dashboard page functionality and statistics
 */
const DashboardModule = {
  chartInstances: [],

  /**
   * Initialize dashboard
   */
  init() {
    console.log('Dashboard module initialized');
    this.loadStatistics();
    this.initializeCharts();
  },

  /**
   * Load statistics from API or local data
   */
  loadStatistics() {
    const stats = [
      { id: 'active-projects', value: 12, label: 'Active Projects', icon: 'fa-project-diagram', color: 'orange' },
      { id: 'pending-approvals', value: 7, label: 'Pending Approvals', icon: 'fa-clock', color: 'blue' },
      { id: 'completed-tasks', value: 156, label: 'Completed Tasks', icon: 'fa-check-double', color: 'emerald' },
      { id: 'budget-used', value: '78%', label: 'Budget Utilization', icon: 'fa-wallet', color: 'red' }
    ];

    // Update stat cards if they exist
    stats.forEach(stat => {
      const card = document.querySelector(`[data-stat="${stat.id}"]`);
      if (card) {
        const valueEl = card.querySelector('.stat-value');
        if (valueEl) valueEl.textContent = stat.value;
      }
    });
  },

  /**
   * Initialize dashboard charts
   */
  initializeCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded - skipping chart initialization');
      return;
    }

    // Budget chart
    const budgetCtx = document.getElementById('budget-chart');
    if (budgetCtx) {
      this.chartInstances.push(
        new Chart(budgetCtx, {
          type: 'bar',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
              {
                label: 'Spent',
                data: [120, 132, 101, 134, 90, 110, 130, 110, 105, 145, 150, 125],
                backgroundColor: 'rgba(255, 138, 0, 0.8)',
                borderColor: 'rgba(255, 138, 0, 1)',
                borderWidth: 2
              },
              {
                label: 'Budgeted',
                data: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200],
                backgroundColor: 'rgba(226, 232, 240, 0.5)',
                borderColor: 'rgba(148, 163, 184, 1)',
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  font: { size: 12, weight: '600' },
                  color: '#334155',
                  padding: 15
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { font: { size: 11, weight: '600' }, color: '#94A3B8' },
                grid: { color: '#E2E8F0' }
              }
            }
          }
        })
      );
    }

    // Project status chart
    const projectCtx = document.getElementById('project-status-chart');
    if (projectCtx) {
      this.chartInstances.push(
        new Chart(projectCtx, {
          type: 'doughnut',
          data: {
            labels: ['On Track', 'At Risk', 'Behind', 'Completed'],
            datasets: [{
              data: [15, 8, 3, 12],
              backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(59, 130, 246, 0.8)'
              ],
              borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(239, 68, 68, 1)',
                'rgba(59, 130, 246, 1)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 12, weight: '600' },
                  color: '#334155',
                  padding: 15
                }
              }
            }
          }
        })
      );
    }
  },

  /**
   * Refresh dashboard data
   */
  refresh() {
    this.loadStatistics();
  },

  /**
   * Destroy charts
   */
  destroy() {
    this.chartInstances.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.chartInstances = [];
  }
};
