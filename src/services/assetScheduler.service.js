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

module.exports = {
    detectConflicts,
    getRecommendations,
    PHASE_ASSET_REQUIREMENTS
};
