
/**
 * Module Loading Strategy
 * Decouples role-based module loading from the main application logic.
 */
export class ModuleLoaderStrategy {
    constructor() {
        this.modules = new Map();
        
        // Configuration: Role -> { path, className }
        this.registry = {
            'Finance Director': { 
                path: '../../components/modules/FinanceDashboard.js', 
                className: 'FinanceDashboard' 
            },
            'Project Manager': { 
                path: '../../components/modules/ProjectManagerDashboard.js', 
                className: 'ProjectManagerDashboard' 
            },
            'Field Supervisor': { 
                path: '../../components/modules/FieldSupervisorDashboard.js', 
                className: 'FieldSupervisorDashboard' 
            },
            'Contract Administrator': { 
                path: '../../components/modules/ContractAdminDashboard.js', 
                className: 'ContractAdminDashboard' 
            },
            'Equipment Coordinator': { 
                path: '../../components/modules/EquipmentCoordinatorDashboard.js', 
                className: 'EquipmentCoordinatorDashboard' 
            },
            'Operations Manager': { 
                path: '../../components/modules/OperationsManagerDashboard.js', 
                className: 'OperationsManagerDashboard' 
            },
            'Managing Director': { 
                path: '../../components/modules/ManagingDirectorDashboard.js', 
                className: 'ManagingDirectorDashboard' 
            },
            'System Technician': { 
                path: '../../components/modules/SystemTechnicianDashboard.js', 
                className: 'SystemTechnicianDashboard' 
            }
        };
    }

    /**
     * Load the appropriate module for the given role
     * @param {string} role 
     * @returns {Promise<Object>} The module instance
     */
    async load(role) {
        // Return cached instance if available
        if (this.modules.has(role)) {
            return this.modules.get(role);
        }

        // Normalize role: convert 'System_Technician' to 'System Technician'
        const normalizedRole = role.replace(/_/g, ' ');
        
        // Try both original and normalized role
        const config = this.registry[role] || this.registry[normalizedRole];
        if (!config) {
            console.warn(`No module configuration found for role: ${role} (normalized: ${normalizedRole})`);
            return null;
        }

        try {
            console.log(`Lazy loading module for: ${role}...`);
            const module = await import(config.path + '?v=' + Date.now());
            const Instance = module[config.className];
            const instance = new Instance();
            
            // Cache the instance
            this.modules.set(role, instance);
            return instance;
        } catch (error) {
            console.error(`Failed to load module for role ${role}:`, error);
            throw new Error(`Could not load dashboard module: ${error.message}`);
        }
    }
}
