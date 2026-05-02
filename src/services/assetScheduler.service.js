/**
 * MCMS Service - Asset Scheduler & Conflict Resolution
 * Logic to detect overlapping resource needs and suggest optimizations
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

// Mapping of project types/phases to required asset categories
const PHASE_ASSET_REQUIREMENTS = {
    // Road Construction Phases
    1: ['Grader', 'Pickup'], // Site Clearance
    2: ['Excavator', 'Tipper', 'Bulldozer'], // Earthworks
    3: ['Roller', 'Water Bowser', 'Grader'], // Sub-base
    4: ['Roller', 'Tipper', 'Grader'], // Base Course
    5: ['Excavator', 'TLB'], // Drainage
    6: ['Paver', 'Roller', 'Tipper'] // Surfacing
};

/**
 * Detect conflicts where multiple projects in critical phases need the same asset categories
 */
async function detectConflicts() {
    const activeProjects = await prisma.project.findMany({
        where: { status: 'active' },
        select: { id: true, name: true, code: true, currentPhase: true }
    });

    const categoriesNeeded = {};
    
    activeProjects.forEach(proj => {
        const reqs = PHASE_ASSET_REQUIREMENTS[proj.currentPhase] || [];
        reqs.forEach(cat => {
            if (!categoriesNeeded[cat]) categoriesNeeded[cat] = [];
            categoriesNeeded[cat].push({
                projectId: proj.id,
                projectName: proj.name,
                phase: proj.currentPhase
            });
        });
    });

    const conflicts = [];
    for (const [category, projects] of Object.entries(categoriesNeeded)) {
        if (projects.length > 1) {
            // Check availability in registry
            const availableCount = await prisma.asset.count({
                where: { category, status: 'available' }
            });

            if (availableCount < projects.length) {
                conflicts.push({
                    category,
                    neededBy: projects,
                    availableCount,
                    shortfall: projects.length - availableCount,
                    resolution: suggestResolution(projects)
                });
            }
        }
    }

    return conflicts;
}

/**
 * Suggest which project should get priority based on phase progression
 */
function suggestResolution(projects) {
    // Simple heuristic: Projects in later phases get priority (finishing touches)
    // or projects in very early phases (momentum)
    const sorted = [...projects].sort((a, b) => b.phase - a.phase);
    const priority = sorted[0];
    
    return {
        priorityProjectId: priority.projectId,
        priorityProjectName: priority.projectName,
        reason: `Phase ${priority.phase} critical path priority.`
    };
}

/**
 * Get recommended assets for a project's current phase
 */
async function getRecommendations(projectId) {
    const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
        select: { currentPhase: true }
    });

    if (!project) return [];

    const categories = PHASE_ASSET_REQUIREMENTS[project.currentPhase] || [];
    
    const recommendations = await Promise.all(categories.map(async cat => {
        const available = await prisma.asset.findMany({
            where: { category: cat, status: 'available' },
            select: { id: true, name: true, assetCode: true }
        });
        
        return {
            category: cat,
            available
        };
    }));

    return recommendations;
}

/**
 * Create a replenishment request when stock is low
 */
async function createReplenishmentRequest(data) {
    const { projectId, sectorId, materialName, quantityNeeded, requestedBy, notes } = data;

    // Generate code: REP-PRJ-DATE-ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.replenishmentRequest.count();
    const reqCode = `REP-${projectId}-${dateStr}-${count + 1}`;

    return await prisma.replenishmentRequest.create({
        data: {
            reqCode,
            projectId: parseInt(projectId),
            sectorId: sectorId ? parseInt(sectorId) : null,
            materialName,
            quantityNeeded: parseFloat(quantityNeeded),
            requestedBy: parseInt(requestedBy),
            notes,
            status: 'pending_finance'
        }
    });
}

/**
 * Bridge replenishment request to procurement
 */
async function bridgeToProcurement(replenishmentId) {
    const req = await prisma.replenishmentRequest.findUnique({
        where: { id: parseInt(replenishmentId) },
        include: { project: true }
    });

    if (!req) throw new Error('Replenishment request not found');

    return await prisma.replenishmentRequest.update({
        where: { id: parseInt(replenishmentId) },
        data: { status: 'approved' }
    });
}

/**
 * Check if an asset is due for maintenance before dispatch
 */
async function isAssetAvailableForDispatch(assetId, durationDays = 7) {
    const asset = await prisma.asset.findUnique({
        where: { id: parseInt(assetId) },
        include: { maintenanceRecords: { orderBy: { nextServiceDate: 'desc' }, take: 1 } }
    });

    if (!asset) return false;
    if (asset.status !== 'available') return false;

    if (asset.maintenanceRecords.length > 0) {
        const nextService = asset.maintenanceRecords[0].nextServiceDate;
        if (nextService) {
            const dueDate = new Date(nextService);
            const now = new Date();
            const limitDate = new Date();
            limitDate.setDate(now.getDate() + durationDays);

            if (dueDate < limitDate) {
                return false; 
            }
        }
    }

    return true;
}

module.exports = {
    detectConflicts,
    getRecommendations,
    createReplenishmentRequest,
    bridgeToProcurement,
    isAssetAvailableForDispatch,
    PHASE_ASSET_REQUIREMENTS
};
