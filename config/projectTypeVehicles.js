/**
 * Project Type to Vehicle Mapping
 * Defines default/recommended equipment for each project type
 */
export const PROJECT_TYPES = {
    civil_works: {
        label: 'Civil Works',
        description: 'Site preparations, earthmoving, and foundational engineering',
        defaultVehicles: ['Excavator', 'Bulldozer', 'Grader', 'Tipper', 'Compactor']
    },
    bridge_construction: {
        label: 'Bridge Construction',
        description: 'Transportation links and structural bridge works',
        defaultVehicles: ['Crane', 'Excavator', 'Concrete Mixer', 'Pile Driver', 'Boom Truck']
    },
    road_works: {
        label: 'Road Works',
        description: 'Highway development and road rehabilitation',
        defaultVehicles: ['Grader', 'Roller', 'Asphalt Paver', 'Tipper', 'Water Bowser']
    },
    building_works: {
        label: 'Building Works',
        description: 'Commercial construction and institutional facilities',
        defaultVehicles: ['Tower Crane', 'Concrete Mixer', 'Forklift', 'Scaffolding Truck', 'Telehandler']
    }
};

/**
 * Get recommended vehicles for a project type
 * @param {string} projectType - The project type key
 * @returns {string[]} Array of vehicle names
 */
export function getRecommendedVehicles(projectType) {
    return PROJECT_TYPES[projectType]?.defaultVehicles || [];
}

/**
 * Get project type options for dropdowns
 * @returns {Array<{value: string, label: string}>}
 */
export function getProjectTypeOptions() {
    return Object.entries(PROJECT_TYPES).map(([value, config]) => ({
        value,
        label: config.label,
        description: config.description
    }));
}
