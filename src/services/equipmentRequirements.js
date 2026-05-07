/**
 * MCMS - Equipment Requirements Matrix
 * Maps road construction phases to required machine types.
 * 
 * KEY DESIGN: Only machine TYPES are stored (e.g., "Dozer", "Excavator").
 * Specific models/brands (CAT D6T, Komatsu PC200) are NOT tracked here —
 * the system only cares whether you HAVE a Dozer, not which brand.
 * 
 * Daily rental rates are predefined defaults (MWK/day).
 * These can be overridden per-project via EquipmentPriceConfig DB table.
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

// ==========================================
// MACHINE TYPE DEFINITIONS
// ==========================================

const MACHINE_TYPES = {
  Dozer:       { label: 'Crawler Bulldozer',        icon: 'fa-tractor',           defaultDailyRate: 450000 },
  Excavator:   { label: 'Hydraulic Excavator',      icon: 'fa-truck-monster',     defaultDailyRate: 380000 },
  Loader:      { label: 'Wheel Loader',             icon: 'fa-truck-loading',     defaultDailyRate: 320000 },
  Truck:       { label: 'Dump Truck',               icon: 'fa-truck',             defaultDailyRate: 180000 },
  Grader:      { label: 'Motor Grader',             icon: 'fa-road',              defaultDailyRate: 420000 },
  Roller:      { label: 'Vibratory Roller',         icon: 'fa-drum',              defaultDailyRate: 280000 },
  Bowser:      { label: 'Water Bowser',             icon: 'fa-droplet',           defaultDailyRate: 150000 },
  Mixer:       { label: 'Concrete Mixer',           icon: 'fa-blender',           defaultDailyRate: 120000 },
  Sprayer:     { label: 'Bitumen Pressure Sprayer',  icon: 'fa-spray-can',         defaultDailyRate: 350000 },
  ChipSpreader:{ label: 'Chip Spreader',            icon: 'fa-align-justify',     defaultDailyRate: 300000 },
  PneuRoller:  { label: 'Pneumatic Tyre Roller',    icon: 'fa-circle',            defaultDailyRate: 260000 },
  Boiler:      { label: 'Bitumen Heater/Boiler',    icon: 'fa-fire',              defaultDailyRate: 180000 },
  Crane:       { label: 'Rough Terrain Crane',      icon: 'fa-anchor',            defaultDailyRate: 550000 },
  Pickup:      { label: 'Crew Pickup/Light Truck',  icon: 'fa-car-side',          defaultDailyRate: 85000 },
  Generator:   { label: 'Portable Generator',       icon: 'fa-bolt',              defaultDailyRate: 45000 },
  LineMarker:  { label: 'Road Marking Machine',     icon: 'fa-pen',               defaultDailyRate: 200000 },
  Vibrator:    { label: 'Poker Vibrator',           icon: 'fa-wave-square',       defaultDailyRate: 35000 },
  BatchPlant:  { label: 'Concrete Batching Plant',  icon: 'fa-industry',          defaultDailyRate: 850000 },
  TransitMixer:{ label: 'Transit Concrete Mixer',   icon: 'fa-truck-moving',      defaultDailyRate: 250000 },
  SlipPaver:   { label: 'Concrete Slip-form Paver', icon: 'fa-layer-group',       defaultDailyRate: 1200000 },
  TextureMachine:{ label: 'Surface Texturing Machine', icon: 'fa-brush',          defaultDailyRate: 280000 },
  SawCutter:   { label: 'Concrete Joint Saw',       icon: 'fa-compact-disc',      defaultDailyRate: 120000 },
  JointSealer: { label: 'Hot-Pour Joint Sealer',    icon: 'fa-fill-drip',         defaultDailyRate: 95000 },
  KnuckleCrane:{ label: 'Knuckleboom Crane Truck',  icon: 'fa-truck-pickup',      defaultDailyRate: 380000 },
};

// ==========================================
// EQUIPMENT REQUIREMENTS PER PHASE
// Each phase lists the machine types needed.
// "alwaysRequired" = needed regardless of road type.
// ==========================================

const EQUIPMENT_BY_PHASE = {
  // Phase 1: Clearing & Grubbing — Always Required
  1: {
    phaseName: 'Clearing & Grubbing',
    alwaysRequired: true,
    machines: [
      { type: 'Dozer',     role: 'Push over trees, clear bush, remove topsoil' },
      { type: 'Excavator', role: 'Uproot stumps, dig out large roots' },
      { type: 'Loader',    role: 'Load cleared debris into dump trucks' },
      { type: 'Truck',     role: 'Haul cleared material off site' },
    ]
  },

  // Phase 2: Earthworks / Subgrade — Always Required
  2: {
    phaseName: 'Earthworks / Subgrade',
    alwaysRequired: true,
    machines: [
      { type: 'Dozer',     role: 'Cut and fill earthworks, rough shaping' },
      { type: 'Grader',    role: 'Fine grade subgrade to design level' },
      { type: 'Roller',    role: 'Compact subgrade to required CBR' },
      { type: 'Excavator', role: 'Spot cuts, drain channels, soft spot removal' },
      { type: 'Truck',     role: 'Haul cut material or import fill' },
      { type: 'Bowser',    role: 'Moisture conditioning before compaction' },
    ]
  },

  // Phase 3: Sub-base — RT-3, RT-4, RT-5
  3: {
    phaseName: 'Sub-base Construction',
    alwaysRequired: false,
    machines: [
      { type: 'Grader',    role: 'Spread and level sub-base material' },
      { type: 'Roller',    role: 'Compact sub-base to 98% MDD' },
      { type: 'Truck',     role: 'Deliver gravel/crushed stone to site' },
      { type: 'Loader',    role: 'Load crushed stone at source' },
      { type: 'Bowser',    role: 'Moisture control during compaction' },
    ]
  },

  // Phase 4: Base Course — RT-3, RT-4, RT-5
  4: {
    phaseName: 'Base Course Construction',
    alwaysRequired: false,
    machines: [
      { type: 'Grader',    role: 'Spread aggregate base to uniform thickness' },
      { type: 'Roller',    role: 'Compact base course to specification' },
      { type: 'Truck',     role: 'Deliver aggregate base material' },
      { type: 'Loader',    role: 'Load aggregate at source / stockpile' },
      { type: 'Bowser',    role: 'Moisture conditioning' },
    ]
  },

  // Phase 5.1: Surface Dressing (Chip Seal) — RT-3
  5.1: {
    phaseName: 'Surface Dressing (Chip Seal)',
    alwaysRequired: false,
    machines: [
      { type: 'Sprayer',      role: 'Spray emulsion primer and binder coat evenly' },
      { type: 'ChipSpreader', role: 'Spread stone chippings over binder coat' },
      { type: 'PneuRoller',   role: 'Embed chippings into binder coat' },
      { type: 'Truck',        role: 'Deliver chippings to paving train' },
      { type: 'Boiler',       role: 'Heat bitumen to spray temperature' },
    ]
  },

  // Phase 5.2: Asphalt Surfacing — RT-4
  5.2: {
    phaseName: 'Asphalt Surfacing',
    alwaysRequired: false,
    machines: [
      { type: 'Sprayer',      role: 'Spray emulsion primer and binder coat' },
      { type: 'ChipSpreader', role: 'Spread stone chippings over binder coat' },
      { type: 'PneuRoller',   role: 'Embed chippings into binder coat' },
      { type: 'Truck',        role: 'Deliver chippings to paving train' },
      { type: 'Boiler',       role: 'Heat bitumen to spray temperature' },
    ]
  },

  // Phase 5.3: Concrete Surfacing — RT-5
  5.3: {
    phaseName: 'Concrete Surfacing',
    alwaysRequired: false,
    machines: [
      { type: 'BatchPlant',      role: 'Batch design-mix concrete for pavement slab' },
      { type: 'TransitMixer',    role: 'Transport concrete from plant to paving point' },
      { type: 'SlipPaver',       role: 'Lay, screed and finish 250mm concrete slab' },
      { type: 'Vibrator',        role: 'Consolidate concrete slab, eliminate voids' },
      { type: 'TextureMachine',  role: 'Apply surface texture and curing compound' },
      { type: 'SawCutter',       role: 'Cut transverse and longitudinal joints' },
      { type: 'Truck',           role: 'Supply aggregate and materials to batching plant' },
    ]
  },

  // Phase 6: Drainage — Always Required
  6: {
    phaseName: 'Drainage',
    alwaysRequired: true,
    machines: [
      { type: 'Excavator', role: 'Dig culvert pits, channels, side drains' },
      { type: 'Mixer',     role: 'Mix concrete for headwalls and channels' },
      { type: 'Truck',     role: 'Deliver drainage materials' },
      { type: 'Crane',     role: 'Lower large culvert pipes into position' },
    ]
  },

  // Phase 7: Road Furniture — Accessories Selection
  7: {
    phaseName: 'Road Furniture & Accessories',
    alwaysRequired: false,
    machines: [
      { type: 'LineMarker', role: 'Paint centreline and edge lines' },
      { type: 'Pickup',     role: 'Transport signage crew and materials' },
      { type: 'Generator',  role: 'Power tools for kerb cutting, sign posts' },
    ]
  },

  // RT-5 Specific: Lean Concrete Base
  4.5: {
    phaseName: 'Lean Concrete Base',
    alwaysRequired: false,
    machines: [
      { type: 'TransitMixer', role: 'Deliver and pour lean concrete blinding layer' },
      { type: 'BatchPlant',   role: 'Batch lean concrete mix on site' },
      { type: 'Vibrator',     role: 'Consolidate lean concrete, remove voids' },
      { type: 'Truck',        role: 'Deliver aggregate and sand to batching plant' },
    ]
  },

  // RT-5 Specific: Joint Sealing & Curing
  5.4: {
    phaseName: 'Joint Sealing & Curing',
    alwaysRequired: false,
    machines: [
      { type: 'JointSealer', role: 'Fill sawn joints with hot bitumen sealant' },
      { type: 'Pickup',      role: 'Transport curing crew and equipment along slab' },
    ]
  },

  // RT-5 Specific: Road Furniture (heavy)
  7.5: {
    phaseName: 'Road Furniture & Accessories (Heavy)',
    alwaysRequired: false,
    machines: [
      { type: 'LineMarker',    role: 'Paint full lane, edge and centreline markings' },
      { type: 'Pickup',        role: 'Transport sign and kerb installation teams' },
      { type: 'Generator',     role: 'Power stud guns, drills, lighting' },
      { type: 'KnuckleCrane',  role: 'Install heavy guardrail panels and large signs' },
      { type: 'SawCutter',     role: 'Cut kerb seating channels in concrete slab edge' },
    ]
  },
};

// ==========================================
// ROAD TYPE → ACTIVE EQUIPMENT PHASES
// Maps each road type to the phases that need equipment
// ==========================================

const ROAD_TYPE_EQUIPMENT_PHASES = {
  'RT-1': [1, 2],                                     // Earth: Clear + Earthworks only
  'RT-2': [1, 2, 7],                                  // Gravel: + Road furniture (basic)
  'RT-3': [1, 2, 3, 4, 5.1, 6, 7],                    // Surface Dressed
  'RT-4': [1, 2, 3, 4, 5.2, 6, 7],                    // Asphalt
  'RT-5': [1, 2, 3, 4, 4.5, 5.3, 5.4, 6, 7.5],       // Concrete (most complex)
};

// ==========================================
// GAP ANALYSIS ENGINE
// ==========================================

/**
 * Get all unique machine types required for a given road type
 * @param {string} roadType - e.g., 'RT-3'
 * @returns {Array} - Unique machine type entries with roles by phase
 */
function getRequiredEquipment(roadType) {
  const phases = ROAD_TYPE_EQUIPMENT_PHASES[roadType];
  if (!phases) return [];

  const machineMap = new Map(); // type → { type, label, icon, phases: [...] }

  phases.forEach(phaseKey => {
    const phaseDef = EQUIPMENT_BY_PHASE[phaseKey];
    if (!phaseDef) return;

    phaseDef.machines.forEach(m => {
      const typeDef = MACHINE_TYPES[m.type];
      if (!typeDef) return;

      if (!machineMap.has(m.type)) {
        machineMap.set(m.type, {
          type: m.type,
          label: typeDef.label,
          icon: typeDef.icon,
          defaultDailyRate: typeDef.defaultDailyRate,
          phases: []
        });
      }

      machineMap.get(m.type).phases.push({
        phaseKey,
        phaseName: phaseDef.phaseName,
        role: m.role
      });
    });
  });

  return Array.from(machineMap.values());
}

/**
 * Perform equipment gap analysis for a project
 * Cross-references required machines against owned assets
 * 
 * @param {number} projectId
 * @returns {Object} { roadType, required, owned, needsRental, equipmentBudget }
 */
async function analyzeEquipmentGap(projectId) {
  // 1. Get project's road specification
  const spec = await prisma.roadSpecification.findUnique({
    where: { projectId },
    include: { project: true }
  });

  if (!spec) {
    return { missingSpec: true, projectId };
  }

  const roadType = spec.roadType;
  const requiredMachines = getRequiredEquipment(roadType);

  // 2. Get all company-owned assets grouped by category
  const ownedAssets = await prisma.asset.findMany({
    where: {
      status: { not: 'decommissioned' }
    },
    select: {
      id: true,
      name: true,
      assetCode: true,
      category: true,
      status: true,
      currentProjectId: true
    }
  });

  // Build a map of category → [assets]
  const ownedByCategory = {};
  ownedAssets.forEach(a => {
    const cat = (a.category || '').trim();
    if (!ownedByCategory[cat]) ownedByCategory[cat] = [];
    ownedByCategory[cat].push(a);
  });

  // 3. Load custom daily rates from DB (EquipmentPriceConfig)
  let customRates = {};
  try {
    const configs = await prisma.equipmentPriceConfig.findMany({
      where: { isDeleted: false }
    });
    configs.forEach(c => {
      customRates[c.machineType] = Number(c.dailyRate);
    });
  } catch (e) {
    // Table may not exist yet during migration
    logger.warn('EquipmentPriceConfig not available yet', { error: e.message });
  }

  // 4. Calculate project duration in days (for budget estimation)
  const startDate = spec.project?.startDate;
  const endDate = spec.project?.endDate;
  let projectDays = 180; // Fallback: 6 months
  if (startDate && endDate) {
    projectDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  }

  // 5. Cross-reference: what do we own vs. what do we need?
  const owned = [];
  const needsRental = [];
  let totalEquipmentBudget = 0;

  requiredMachines.forEach(machine => {
    const matchingOwned = ownedByCategory[machine.type] || [];
    const dailyRate = customRates[machine.type] || machine.defaultDailyRate;

    // Calculate how many days this machine type is needed based on its phases
    // For simplicity: estimate each phase takes proportional days
    const totalPhases = (ROAD_TYPE_EQUIPMENT_PHASES[roadType] || []).length;
    const machinePhaseCount = machine.phases.length;
    const estimatedDays = Math.ceil((machinePhaseCount / totalPhases) * projectDays);

    const rentalCost = dailyRate * estimatedDays;

    if (matchingOwned.length > 0) {
      owned.push({
        ...machine,
        dailyRate,
        estimatedDays,
        rentalCost: 0, // No cost — we own it
        ownedAssets: matchingOwned.map(a => ({
          id: a.id,
          name: a.name,
          assetCode: a.assetCode,
          status: a.status,
          currentProjectId: a.currentProjectId
        }))
      });
    } else {
      needsRental.push({
        ...machine,
        dailyRate,
        estimatedDays,
        rentalCost
      });
      totalEquipmentBudget += rentalCost;
    }
  });

  return {
    projectId,
    roadType,
    roadTypeName: spec.roadType,
    projectName: spec.project?.name,
    projectDays,
    required: requiredMachines,
    owned,
    needsRental,
    totalEquipmentBudget,
    summary: {
      totalRequired: requiredMachines.length,
      totalOwned: owned.length,
      totalNeedsRental: needsRental.length,
      coveragePercent: requiredMachines.length > 0
        ? Math.round((owned.length / requiredMachines.length) * 100)
        : 100
    }
  };
}

module.exports = {
  MACHINE_TYPES,
  EQUIPMENT_BY_PHASE,
  ROAD_TYPE_EQUIPMENT_PHASES,
  getRequiredEquipment,
  analyzeEquipmentGap
};
