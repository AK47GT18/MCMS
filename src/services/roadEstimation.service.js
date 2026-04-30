/**
 * MCMS Service - Road Estimation Engine
 * Based on Malawi 2025 RCMS Master Reference
 * 
 * UNIFIED: Pulls prices from MaterialPriceConfig DB table.
 * Phases and materials are correct per RT-1 through RT-5.
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const emailService = require('../emails/email.service');

// ==========================================
// RCMS MASTER REFERENCE CONSTANTS (MALAWI 2025)
// ==========================================

const ROAD_TYPES = {
  'RT-1': { name: 'Earth', defaultWidth: 4.0, designLife: '2-5 yrs', activePhases: [1, 2], costMultiplier: 1 },
  'RT-2': { name: 'Gravel', defaultWidth: 5.5, designLife: '5-10 yrs', activePhases: [1, 2, 3, 5], costMultiplier: 2 },
  'RT-3': { name: 'Surface Dressed', defaultWidth: 6.5, designLife: '10-15 yrs', activePhases: [1, 2, 3, 4, 5.1, 6, 7], costMultiplier: 4 },
  'RT-4': { name: 'Asphalt', defaultWidth: 7.0, designLife: '15-20 yrs', activePhases: [1, 2, 3, 4, 5.2, 6, 7], costMultiplier: 8 },
  'RT-5': { name: 'Concrete', defaultWidth: 7.0, designLife: '30-50 yrs', activePhases: [1, 2, 3, 4, 5.3, 6, 7], costMultiplier: 14 }
};

const PHASE_NAMES = {
  1: 'Clearing & Grubbing',
  2: 'Earthworks / Subgrade',
  3: 'Sub-base Construction',
  4: 'Base Course Construction',
  5: 'Surfacing',
  5.1: 'Surface Dressing (Chip Seal)',
  5.2: 'Asphalt Surfacing',
  5.3: 'Concrete Surfacing',
  6: 'Drainage',
  7: 'Road Furniture & Accessories'
};

const MULTIPLIERS = {
  terrain: {
    'Flat': 1.0,
    'Rolling': 1.2,
    'Hilly/Mountainous': 1.6,
    'Rocky': 1.4,
    'Swampy/Wetland': 1.6,
    'Urban': 1.3
  },
  accessibility: (km) => {
    if (km <= 20) return 1.0;
    if (km <= 60) return 1.1;
    return 1.2;
  },
  width: (widthM) => {
    // Baseline is 7.0m => 1.0
    return Math.max(0.43, widthM / 7.0); 
  }
};

// ==========================================
// PHASE → MATERIAL MAPPING (Malawi 2025 Correct)
// Each material has: name, unit, qtyPerKm (for 7m width baseline), fallbackCostLow, fallbackCostHigh
// If a matching MaterialPriceConfig entry exists in DB, its basePrice overrides fallbackCostHigh
// ==========================================

const LAYER_PRICING = {
  1: [ // Phase 1: Clearing & Grubbing
    { name: 'Survey Pegs & Paint', unit: 'Set', qtyPerKm: 2, costLow: 5000, costHigh: 15000 },
    { name: 'Chainsaw Fuel', unit: 'Litres', qtyPerKm: 60, costLow: 4500, costHigh: 6687 },
    { name: 'GPS/Total Station Hire', unit: 'Days', qtyPerKm: 4, costLow: 150000, costHigh: 400000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 800, costLow: 5000, costHigh: 6687 },
  ],
  2: [ // Phase 2: Earthworks / Subgrade
    { name: 'Borrow Fill (laterite)', unit: 'm³', qtyPerKm: 2100, costLow: 3000, costHigh: 8000 },
    { name: 'Geotextile Fabric', unit: 'Roll (50m²)', qtyPerKm: 30, costLow: 12000, costHigh: 22000 },
    { name: 'Lime (stabiliser)', unit: 'Tonne', qtyPerKm: 15, costLow: 60000, costHigh: 95000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 2500, costLow: 5000, costHigh: 6687 },
  ],
  3: [ // Phase 3: Sub-base
    { name: 'Gravel/Crushed Stone', unit: 'Tonne', qtyPerKm: 1800, costLow: 10000, costHigh: 18000 },
    { name: 'Water for Compaction', unit: 'm³', qtyPerKm: 175, costLow: 5000, costHigh: 15000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 600, costLow: 5000, costHigh: 6687 },
  ],
  4: [ // Phase 4: Base Course
    { name: 'Aggregate Base', unit: 'Tonne', qtyPerKm: 2100, costLow: 20000, costHigh: 35000 },
    { name: 'Crushed Stone', unit: 'Tonne', qtyPerKm: 500, costLow: 25000, costHigh: 45000 },
    { name: 'OPC Cement (stabilised base)', unit: '50kg bag', qtyPerKm: 500, costLow: 50000, costHigh: 75000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 700, costLow: 5000, costHigh: 6687 },
  ],
  5.1: [ // Phase 5A: Surface Dressing (Chip Seal) — RT-3
    { name: 'Bitumen 60/70', unit: 'Tonne', qtyPerKm: 14, costLow: 550000, costHigh: 820000 },
    { name: 'Aggregate Chippings 10/14mm', unit: 'm³', qtyPerKm: 88, costLow: 140000, costHigh: 250000 },
    { name: 'Aggregate Chippings 6/10mm', unit: 'm³', qtyPerKm: 56, costLow: 150000, costHigh: 260000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 800, costLow: 5000, costHigh: 6687 },
  ],
  5.2: [ // Phase 5B: Asphalt Surfacing — RT-4
    { name: 'Bitumen 60/70', unit: 'Tonne', qtyPerKm: 55, costLow: 550000, costHigh: 820000 },
    { name: 'Emulsion Primer', unit: 'Drum (200L)', qtyPerKm: 18, costLow: 60000, costHigh: 95000 },
    { name: 'Tack Coat (SS-1)', unit: 'Drum (200L)', qtyPerKm: 10, costLow: 55000, costHigh: 85000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 1200, costLow: 5000, costHigh: 6687 },
  ],
  5.3: [ // Phase 5C: Concrete Surfacing — RT-5
    { name: 'Ready-mix Concrete C30', unit: 'm³', qtyPerKm: 1575, costLow: 500000, costHigh: 850000 },
    { name: 'Steel Mesh Fabric A252', unit: 'm²', qtyPerKm: 7000, costLow: 8000, costHigh: 16000 },
    { name: 'Steel Reinforcement Y16', unit: 'kg', qtyPerKm: 35000, costLow: 1800, costHigh: 3000 },
    { name: 'Joint Sealant Polyurethane', unit: 'm', qtyPerKm: 1750, costLow: 12000, costHigh: 25000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 900, costLow: 5000, costHigh: 6687 },
  ],
  6: [ // Phase 6: Drainage
    { name: 'Cement OPC', unit: 'Bag (50kg)', qtyPerKm: 120, costLow: 12000, costHigh: 18500 },
    { name: 'River Sand', unit: 'Tonne', qtyPerKm: 20, costLow: 15000, costHigh: 25000 },
    { name: 'Reinforcement Steel (12mm)', unit: 'Length (12m)', qtyPerKm: 60, costLow: 14000, costHigh: 22000 },
    { name: 'PVC Culvert Pipes', unit: 'Length (6m)', qtyPerKm: 24, costLow: 20000, costHigh: 35000 },
    { name: 'Concrete Pipes', unit: 'Piece', qtyPerKm: 12, costLow: 28000, costHigh: 45000 },
    { name: 'Headwall & Wingwall Concrete', unit: 'Each', qtyPerKm: 6, costLow: 400000, costHigh: 900000 },
    { name: 'Diesel Fuel', unit: 'Litre', qtyPerKm: 300, costLow: 5000, costHigh: 6687 },
  ],
  7: [ // Phase 7: Road Furniture & Accessories (base items always included)
    { name: 'Road Marking Paint', unit: 'Bucket (20L)', qtyPerKm: 8, costLow: 35000, costHigh: 55000 },
    { name: 'Kerb Stones', unit: 'Piece', qtyPerKm: 400, costLow: 3500, costHigh: 5500 },
    { name: 'Road Signs', unit: 'Unit', qtyPerKm: 8, costLow: 60000, costHigh: 95000 },
    { name: 'Delineator Posts', unit: 'Unit', qtyPerKm: 50, costLow: 7000, costHigh: 12000 },
    { name: 'Cat Eyes/Studs', unit: 'Unit', qtyPerKm: 120, costLow: 5000, costHigh: 8500 },
  ]
};

const ACCESSORY_PRICING = {
  'markings': [
    { name: 'Road Marking Paint', unit: 'Bucket (20L)', qtyPerKm: 8, costLow: 35000, costHigh: 55000 },
  ],
  'signage': [
    { name: 'Road Signs', unit: 'Unit', qtyPerKm: 8, costLow: 60000, costHigh: 95000 },
    { name: 'Delineator Posts', unit: 'Unit', qtyPerKm: 50, costLow: 7000, costHigh: 12000 },
  ],
  'lighting_solar': [
    { name: 'Solar Street Light Set', unit: 'Unit', qtyPerKm: 25, costLow: 280000, costHigh: 450000 },
  ],
  'lighting_poles': [
    { name: 'Roadside Single-arm Pole', unit: 'Unit', qtyPerKm: 57, costLow: 600000, costHigh: 1800000 },
  ],
  'lighting_mast': [
    { name: 'High-mast Tower', unit: 'Unit', qtyPerKm: 1.5, costLow: 8000000, costHigh: 20000000 },
  ],
  'guardrails': [
    { name: 'W-Beam Guardrail', unit: 'Panel (4m)', qtyPerKm: 30, costLow: 100000, costHigh: 185000 },
  ],
  'pedestrian': [
    { name: 'Concrete (for walkways)', unit: 'm³', qtyPerKm: 50, costLow: 75000, costHigh: 120000 },
    { name: 'Kerb Stones', unit: 'Piece', qtyPerKm: 600, costLow: 3500, costHigh: 5500 },
  ],
  'transit': [
    { name: 'Bus Shelter', unit: 'Unit', qtyPerKm: 2, costLow: 700000, costHigh: 1200000 },
    { name: 'Concrete Slab (bus bay)', unit: 'm²', qtyPerKm: 80, costLow: 28000, costHigh: 45000 },
  ]
};

// ==========================================
// PRICE OVERRIDE: Load from MaterialPriceConfig DB
// ==========================================

/**
 * Load price overrides from MaterialPriceConfig.
 * Returns a map of materialName → basePrice.
 * These override the hardcoded costHigh values.
 */
async function loadPriceOverrides() {
  try {
    const dbPrices = await prisma.materialPriceConfig.findMany();
    const overrides = {};
    for (const p of dbPrices) {
      overrides[p.materialName] = Number(p.basePrice);
    }
    return overrides;
  } catch (err) {
    logger.error('Failed to load MaterialPriceConfig, using hardcoded fallbacks', { error: err.message });
    return {};
  }
}

/**
 * Apply price overrides to a material item.
 * If the material name has a DB-configured price, use it as costHigh
 * and derive costLow as 70% of the DB price.
 */
function applyPriceOverride(item, overrides) {
  const dbPrice = overrides[item.name];
  if (dbPrice && dbPrice > 0) {
    return {
      ...item,
      costHigh: dbPrice,
      costLow: Math.round(dbPrice * 0.7), // Low estimate = 70% of configured price
    };
  }
  return item;
}

// ==========================================
// ESTIMATION ENGINE
// ==========================================

/**
 * Calculates a full road estimate
 * Now async: pulls prices from MaterialPriceConfig DB
 * @param {Object} input - roadType, lengthKm, widthM, lanes, terrain, nearestTownKm, accessories[]
 */
async function calculateEstimate(input) {
  const { roadType, lengthKm, widthM, terrain, nearestTownKm = 10, accessories = [] } = input;
  
  if (!ROAD_TYPES[roadType]) throw new AppError('Invalid road type', 400);

  // Load price overrides from DB
  const priceOverrides = await loadPriceOverrides();

  const tMult = MULTIPLIERS.terrain[terrain] || 1.0;
  const aMult = MULTIPLIERS.accessibility(nearestTownKm);
  const wMult = widthM ? MULTIPLIERS.width(widthM) : 1.0;

  const typeDef = ROAD_TYPES[roadType];
  const activePhases = typeDef.activePhases;

  const generatedLayers = [];
  let layersTotalLow = 0;
  let layersTotalHigh = 0;

  // 1. Generate Layers (per active phase)
  activePhases.forEach(phaseKey => {
    if (!LAYER_PRICING[phaseKey]) return;
    
    LAYER_PRICING[phaseKey].forEach(rawItem => {
      // Apply MaterialPriceConfig overrides
      const item = applyPriceOverride(rawItem, priceOverrides);

      // Calculate adjusted quantities based on width and length
      const adjustedQtyPerKm = item.qtyPerKm * wMult;
      const totalQty = adjustedQtyPerKm * lengthKm;
      
      // Calculate costs reflecting terrain and accessibility
      const tCostLow = totalQty * item.costLow * tMult * aMult;
      const tCostHigh = totalQty * item.costHigh * tMult * aMult;

      generatedLayers.push({
        phaseNumber: Math.floor(phaseKey),
        phaseName: PHASE_NAMES[phaseKey] || `Phase ${Math.floor(phaseKey)}`,
        materialType: item.name,
        unit: item.unit,
        quantityPerKm: adjustedQtyPerKm,
        totalQuantity: totalQty,
        unitCostLow: item.costLow,
        unitCostHigh: item.costHigh,
        totalCostLow: tCostLow,
        totalCostHigh: tCostHigh,
        approved: true
      });

      layersTotalLow += tCostLow;
      layersTotalHigh += tCostHigh;
    });
  });

  // 2. Generate Accessories
  const generatedAccessories = [];
  let accessoriesTotalLow = 0;
  let accessoriesTotalHigh = 0;

  // Accessories are less impacted by terrain width, use a 0.5 damped terrain multiplier
  const accMult = (tMult - 1) * 0.5 + 1; 

  accessories.forEach(accKey => {
    if (!ACCESSORY_PRICING[accKey]) return;

    ACCESSORY_PRICING[accKey].forEach(rawItem => {
      // Apply MaterialPriceConfig overrides
      const item = applyPriceOverride(rawItem, priceOverrides);

      const totalQty = item.qtyPerKm * lengthKm;
      const tCostLow = totalQty * item.costLow * accMult * aMult;
      const tCostHigh = totalQty * item.costHigh * accMult * aMult;

      generatedAccessories.push({
        category: accKey,
        itemName: item.name,
        unit: item.unit,
        quantityPerKm: item.qtyPerKm,
        totalQuantity: totalQty,
        unitCostLow: item.costLow,
        unitCostHigh: item.costHigh,
        totalCostLow: tCostLow,
        totalCostHigh: tCostHigh,
        approved: true
      });

      accessoriesTotalLow += tCostLow;
      accessoriesTotalHigh += tCostHigh;
    });
  });

  const grandTotalLow = layersTotalLow + accessoriesTotalLow;
  const grandTotalHigh = layersTotalHigh + accessoriesTotalHigh;

  return {
    roadType,
    lengthKm,
    widthM: widthM || typeDef.defaultWidth,
    terrain,
    geographicZone: input.geographicZone,
    nearestTownKm,
    estimatedTotalLow: grandTotalLow,
    estimatedTotalHigh: grandTotalHigh,
    costPerMeterLow: grandTotalLow / (lengthKm * 1000),
    costPerMeterHigh: grandTotalHigh / (lengthKm * 1000),
    layers: generatedLayers,
    accessories: generatedAccessories
  };
}

/**
 * Saves a calculated estimate to the database, binding it to a project.
 * Also regenerates Gantt tasks to match the Road Spec phases.
 */
async function saveEstimate(projectId, estimateData, approvedTotal) {
  // Check if project exists
  const project = await prisma.project.findUnique({ where: { id: projectId }});
  if (!project) throw new AppError('Project not found', 404);

  // Use a transaction to create the spec and all its line items cleanly
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing spec if rewriting
    await tx.roadSpecification.deleteMany({ where: { projectId } });

    const spec = await tx.roadSpecification.create({
      data: {
        projectId,
        roadType: estimateData.roadType,
        lengthKm: estimateData.lengthKm,
        widthM: estimateData.widthM,
        terrain: estimateData.terrain,
        geographicZone: estimateData.geographicZone,
        nearestTownKm: estimateData.nearestTownKm,
        estimatedTotalLow: estimateData.estimatedTotalLow,
        estimatedTotalHigh: estimateData.estimatedTotalHigh,
        costPerMeterLow: estimateData.costPerMeterLow,
        costPerMeterHigh: estimateData.costPerMeterHigh,
        reconciliationStatus: 'approved',
        approvedTotal: approvedTotal // PM locked value
      }
    });

    if (estimateData.layers.length > 0) {
      await tx.roadLayer.createMany({
        data: estimateData.layers.map(l => ({ ...l, specId: spec.id }))
      });
    }

    if (estimateData.accessories.length > 0) {
      await tx.roadAccessory.createMany({
        data: estimateData.accessories.map(a => ({ ...a, specId: spec.id }))
      });
    }

    // Crucially: update the project budget with the locked approvedTotal
    await tx.project.update({
      where: { id: projectId },
      data: { budgetTotal: approvedTotal }
    });

    return spec;
  });

  logger.info(`Road estimate saved for Project ${projectId}`);

  // ============================================
  // UNIFIED: Regenerate Gantt tasks from Road Spec
  // ============================================
  try {
    const tasksService = require('./tasks.service');
    const roadTypeDef = ROAD_TYPES[estimateData.roadType];
    if (roadTypeDef && project.startDate && project.endDate) {
      await tasksService.regenerateFromRoadSpec(
        projectId,
        project.startDate,
        project.endDate,
        roadTypeDef.activePhases
      );
      logger.info('Gantt tasks regenerated from Road Spec', { projectId, roadType: estimateData.roadType });
    }
  } catch (err) {
    logger.error('Failed to regenerate Gantt from Road Spec', { projectId, error: err.message });
  }

  // Fetch recipients for the email trigger asynchronously (don't block the response)
  const fullProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: { fieldSupervisor: true }
  });

  const fms = await prisma.user.findMany({ where: { role: 'Finance_Director', isActive: true } });
  const ecs = await prisma.user.findMany({ where: { role: 'Equipment_Coordinator', isActive: true } });

  const recipients = {
    fs: fullProject.fieldSupervisor || null,
    fms,
    ecs
  };

  // Dispatch email
  emailService.sendRoadBudgetApproved(
    fullProject, 
    result, 
    estimateData.layers, 
    estimateData.accessories, 
    recipients
  ).catch(err => logger.error(`Failed to send road budget approved emails:`, err));

  return result;
}

/**
 * Fetch a fully populated road estimate for a project
 */
async function getEstimateByProject(projectId) {
  const spec = await prisma.roadSpecification.findUnique({
    where: { projectId },
    include: {
      layers: { orderBy: { phaseNumber: 'asc' } },
      accessories: { orderBy: { category: 'asc' } }
    }
  });

  if (!spec) throw new AppError('No road specification found for this project', 404);
  return spec;
}

/**
 * Toggle the approved state of a single layer or accessory
 * Recalculates the spec totals automatically based on approved items
 */
async function toggleItem(projectId, itemType, itemId) {
  const spec = await prisma.roadSpecification.findUnique({ where: { projectId } });
  if (!spec) throw new AppError('Spec not found', 404);

  let targetTable = itemType === 'layer' ? prisma.roadLayer : prisma.roadAccessory;
  
  const item = await targetTable.findUnique({ where: { id: itemId } });
  if (!item || item.specId !== spec.id) throw new AppError('Item not found', 404);

  await targetTable.update({
    where: { id: itemId },
    data: { approved: !item.approved }
  });

  // Now recalculate totals from scratch summing only approved=true items
  const [layers, accessories] = await Promise.all([
    prisma.roadLayer.findMany({ where: { specId: spec.id, approved: true } }),
    prisma.roadAccessory.findMany({ where: { specId: spec.id, approved: true } })
  ]);

  let newTotalLow = 0;
  let newTotalHigh = 0;

  layers.forEach(l => {
    newTotalLow += Number(l.totalCostLow);
    newTotalHigh += Number(l.totalCostHigh);
  });
  accessories.forEach(a => {
    newTotalLow += Number(a.totalCostLow);
    newTotalHigh += Number(a.totalCostHigh);
  });

  const lengthKm = Number(spec.lengthKm);

  const updatedSpec = await prisma.roadSpecification.update({
    where: { id: spec.id },
    data: {
      estimatedTotalLow: newTotalLow,
      estimatedTotalHigh: newTotalHigh,
      costPerMeterLow: newTotalLow / (lengthKm * 1000),
      costPerMeterHigh: newTotalHigh / (lengthKm * 1000)
    }
  });

  return updatedSpec;
}

module.exports = {
  calculateEstimate,
  saveEstimate,
  getEstimateByProject,
  toggleItem,
  ROAD_TYPES,
  PHASE_NAMES,
  LAYER_PRICING,
  ACCESSORY_PRICING
};
