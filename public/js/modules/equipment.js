/**
 * Equipment Module
 * Handles equipment and fleet management
 */
const EquipmentModule = {
  equipment: [],

  /**
   * Initialize equipment module
   */
  init() {
    console.log('Equipment module initialized');
    this.loadEquipment();
  },

  /**
   * Load equipment list from API or local storage
   */
  loadEquipment() {
    this.equipment = [
      {
        id: 'EQ-001',
        name: 'Excavator CAT 320',
        category: 'Heavy Equipment',
        status: 'In Use',
        location: 'M1 Road Site',
        operator: 'James Mwale',
        maintenanceDate: '2024-01-20',
        fuelLevel: 75
      },
      {
        id: 'EQ-002',
        name: 'Dump Truck Volvo',
        category: 'Transport',
        status: 'In Use',
        location: 'M5 Project',
        operator: 'David Phiri',
        maintenanceDate: '2024-02-10',
        fuelLevel: 45
      },
      {
        id: 'EQ-003',
        name: 'Asphalt Roller',
        category: 'Paving Equipment',
        status: 'Maintenance',
        location: 'Workshop',
        operator: 'N/A',
        maintenanceDate: '2024-02-28',
        fuelLevel: 0
      }
    ];
  },

  /**
   * Display equipment in table
   */
  displayEquipment() {
    const tbody = document.getElementById('equipment-table-body');
    if (!tbody) return;

    tbody.innerHTML = this.equipment.map(eq => `
      <tr onclick="EquipmentModule.viewEquipment('${eq.id}')">
        <td data-label="Equipment ID">${eq.id}</td>
        <td data-label="Name">${eq.name}</td>
        <td data-label="Category">${eq.category}</td>
        <td data-label="Status">
          <span class="status ${eq.status.toLowerCase().replace(' ', '-')}">${eq.status}</span>
        </td>
        <td data-label="Location">${eq.location}</td>
        <td data-label="Operator">${eq.operator}</td>
        <td data-label="Fuel Level">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="progress-bar" style="flex: 1; min-width: 100px;">
              <div class="progress-fill" style="width: ${eq.fuelLevel}%; background: ${eq.fuelLevel > 50 ? 'var(--emerald)' : eq.fuelLevel > 25 ? 'var(--amber)' : 'var(--red)'}"></div>
            </div>
            <span style="font-weight: 700; font-size: 13px; min-width: 30px;">${eq.fuelLevel}%</span>
          </div>
        </td>
      </tr>
    `).join('');
  },

  /**
   * View equipment details
   */
  viewEquipment(equipmentId) {
    const eq = this.equipment.find(e => e.id === equipmentId);
    if (!eq) {
      NotificationComponent.error('Equipment not found');
      return;
    }

    const modalId = 'equipment-details-modal';
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
          <h3 class="modal-title">Equipment Details</h3>
          <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="modal-body" style="display: grid; gap: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Equipment ID</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--slate-900);">${eq.id}</div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Name</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--slate-900);">${eq.name}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Category</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${eq.category}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Status</div>
              <span class="status ${eq.status.toLowerCase().replace(' ', '-')}">${eq.status}</span>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Location</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${eq.location}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Operator</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${eq.operator}</div>
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Fuel Level</div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="progress-bar" style="flex: 1;">
                <div class="progress-fill" style="width: ${eq.fuelLevel}%; background: ${eq.fuelLevel > 50 ? 'var(--emerald)' : eq.fuelLevel > 25 ? 'var(--amber)' : 'var(--red)'}"></div>
              </div>
              <span style="font-weight: 800; font-size: 16px; color: var(--slate-900);">${eq.fuelLevel}%</span>
            </div>
          </div>
          
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--slate-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Last Maintenance</div>
            <div style="font-size: 14px; font-weight: 600; color: var(--slate-700);">${eq.maintenanceDate}</div>
          </div>
          
          <div style="display: flex; gap: 12px; padding-top: 20px;">
            <button class="btn btn-primary" style="flex: 1;" onclick="EquipmentModule.editEquipment('${eq.id}')">
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
   * Edit equipment
   */
  editEquipment(equipmentId) {
    NotificationComponent.info(`Editing equipment ${equipmentId}`);
  },

  /**
   * Schedule maintenance
   */
  scheduleMaintenance(equipmentId) {
    NotificationComponent.info(`Scheduling maintenance for ${equipmentId}`);
  },

  /**
   * Track location via GPS
   */
  trackLocation(equipmentId) {
    NotificationComponent.info(`Tracking location for ${equipmentId}`);
  }
};
