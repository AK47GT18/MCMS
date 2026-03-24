/**
 * MCMS Service - Road Estimation Engine
 * Based on Malawi 2025 RCMS Master Reference
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const emailService = require('../emails/email.service');

// ==========================================
// RCMS MASTER REFERENCE CONSTANTS (MALAWI 2025)
// ==========================================

const ROAD_TYPES = {
  'RT-1': { name: 'Earth', defaultWidth: 4.0, designLife: '2-5 yrs', activePhases: [1, 2, 5, 8] },
  'RT-2': { name: 'Gravel', defaultWidth: 5.5, designLife: '5-10 yrs', activePhases: [1, 2, 3, 4, 5, 8] },
  'RT-3': { name: 'Surface Dressed', defaultWidth: 6.5, designLife: '10-15 yrs', activePhases: [1, 2, 3, 4, 5, 6, 7.1, 8, 9] },
  'RT-4': { name: 'Asphalt', defaultWidth: 7.0, designLife: '15-20 yrs', activePhases: [1, 2, 3, 4, 5, 6, 7.2, 8, 9] },
  'RT-5': { name: 'Concrete', defaultWidth: 7.0, designLife: '30-50 yrs', activePhases: [1, 2, 3, 4, 5, 7.3, 8, 9] }
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

// Pricing lists (per KM based on standard 7m width)
const LAYER_PRICING = {
  1: [ // Phase 1: Site Clearance
    { name: 'Survey pegs & paint', unit: 'Set', qtyPerKm: 2, costLow: 5000, costHigh: 15000 },
    { name: 'Chainsaw fuel', unit: 'Litres', qtyPerKm: 60, costLow: 4500, costHigh: 6000 },
    { name: 'GPS/total station hire', unit: 'Days', qtyPerKm: 4, costLow: 150000, costHigh: 400000 },
  ],
  2: [ // Phase 2: Earthworks
    { name: 'Borrow fill (laterite)', unit: 'm³', qtyPerKm: 2100, costLow: 3000, costHigh: 8000 },
    { name: 'Geotextile fabric 200g/m²', unit: 'm²', qtyPerKm: 7000, costLow: 800, costHigh: 1800 },
  ],
  3: [ // Phase 3: Sub-base
    { name: 'Crushed stone G6 (300mm)', unit: 'm³', qtyPerKm: 2100, costLow: 100000, costHigh: 180000 },
    { name: 'Water for compaction', unit: 'm³', qtyPerKm: 175, costLow: 5000, costHigh: 15000 },
  ],
  4: [ // Phase 4: Base Course
    { name: 'Crushed stone G4/G5 (200mm)', unit: 'm³', qtyPerKm: 1400, costLow: 150000, costHigh: 300000 },
    { name: 'OPC cement (stabilised)', unit: '50kg bag', qtyPerKm: 500, costLow: 50000, costHigh: 75000 },
  ],
  5: [ // Phase 5: Drainage
    { name: 'Concrete lined U-drain 300mm', unit: 'm', qtyPerKm: 2000, costLow: 25000, costHigh: 60000 },
    { name: 'HDPE culvert 450mm', unit: 'm', qtyPerKm: 30, costLow: 60000, costHigh: 120000 },
    { name: 'Precast RC culvert 600mm', unit: 'm', qtyPerKm: 15, costLow: 90000, costHigh: 180000 },
    { name: 'Headwall & wingwall concrete', unit: 'Each', qtyPerKm: 6, costLow: 400000, costHigh: 900000 },
  ],
  6: [ // Phase 6: Prime/Tack
    { name: 'Bitumen emulsion SS-1 (prime)', unit: 'Litres', qtyPerKm: 8400, costLow: 2800, costHigh: 5000 },
    { name: 'Tack coat CSS-1', unit: 'Litres', qtyPerKm: 2800, costLow: 2800, costHigh: 5000 },
  ],
  7.1: [ // Phase 7A: Chip Seal
    { name: 'Bitumen 60/70', unit: 'Litres', qtyPerKm: 9800, costLow: 3200, costHigh: 5500 },
    { name: 'Aggregate chippings 10/14mm', unit: 'm³', qtyPerKm: 88, costLow: 140000, costHigh: 250000 },
    { name: 'Aggregate chippings 6/10mm', unit: 'm³', qtyPerKm: 56, costLow: 150000, costHigh: 260000 },
  ],
  7.2: [ // Phase 7B: Asphalt
    { name: 'Hotmix asphalt wearing AC14 (50mm)', unit: 'Tonnes', qtyPerKm: 808, costLow: 450000, costHigh: 850000 },
    { name: 'Hotmix asphalt binder AC20 (70mm)', unit: 'Tonnes', qtyPerKm: 1131, costLow: 380000, costHigh: 700000 },
    { name: 'Bitumen 60/70 (binder)', unit: 'Tonnes', qtyPerKm: 97, costLow: 7000000, costHigh: 14000000 },
  ],
  7.3: [ // Phase 7C: Concrete
    { name: 'Ready-mix concrete C30', unit: 'm³', qtyPerKm: 1575, costLow: 500000, costHigh: 850000 },
    { name: 'Steel mesh fabric A252', unit: 'm²', qtyPerKm: 7000, costLow: 8000, costHigh: 16000 },
    { name: 'Steel reinforcement Y16', unit: 'kg', qtyPerKm: 35000, costLow: 1800, costHigh: 3000 },
    { name: 'Joint sealant polyurethane', unit: 'm', qtyPerKm: 1750, costLow: 12000, costHigh: 25000 },
  ]
};

const ACCESSORY_PRICING = {
  'markings': [
    { name: 'Thermoplastic centreline', unit: 'm²', qtyPerKm: 140, costLow: 12000, costHigh: 25000 },
    { name: 'Thermoplastic edge lines', unit: 'm²', qtyPerKm: 300, costLow: 12000, costHigh: 25000 },
  ],
  'signage': [
    { name: 'Road signs (regulatory+warning)', unit: 'Each', qtyPerKm: 6, costLow: 120000, costHigh: 350000 },
    { name: 'Km markers', unit: 'Each', qtyPerKm: 2, costLow: 30000, costHigh: 80000 },
  ],
  'lighting_solar': [
    { name: 'Solar street light', unit: 'Each', qtyPerKm: 20, costLow: 800000, costHigh: 2200000 },
  ],
  'lighting_poles': [
    { name: 'Roadside single-arm pole', unit: 'Each', qtyPerKm: 57, costLow: 600000, costHigh: 1800000 },
  ],
  'lighting_mast': [
    { name: 'High-mast tower', unit: 'Each', qtyPerKm: 1.5, costLow: 8000000, costHigh: 20000000 },
  ],
  'guardrails': [
    { name: 'W-beam guard rail', unit: 'm', qtyPerKm: 300, costLow: 80000, costHigh: 160000 },
  ],
  'pedestrian': [
    { name: 'Paved footpath 1.5m', unit: 'm', qtyPerKm: 1000, costLow: 15000, costHigh: 35000 },
    { name: 'Raised pedestrian crossing', unit: 'Each', qtyPerKm: 1.5, costLow: 800000, costHigh: 2500000 },
  ],
  'transit': [
    { name: 'Bus bay (lay-by)', unit: 'Each', qtyPerKm: 0.15, costLow: 2000000, costHigh: 5000000 },
    { name: 'Bus shelter', unit: 'Each', qtyPerKm: 0.15, costLow: 3000000, costHigh: 8000000 },
  ]
};

// ==========================================
// ESTIMATION ENGINE
// ==========================================

/**
 * Calculates a full road estimate statelessly
 * @param {Object} input - roadType, lengthKm, widthM, lanes, terrain, accessibilityKm, accessories[]
 */
function calculateEstimate(input) {
  const { roadType, lengthKm, widthM, terrain, nearestTownKm = 10, accessories = [] } = input;
  
  if (!ROAD_TYPES[roadType]) throw new AppError('Invalid road type', 400);

  const tMult = MULTIPLIERS.terrain[terrain] || 1.0;
  const aMult = MULTIPLIERS.accessibility(nearestTownKm);
  const wMult = widthM ? MULTIPLIERS.width(widthM) : 1.0;
  const combinedMult = tMult * aMult * wMult;

  const typeDef = ROAD_TYPES[roadType];
  const activePhases = typeDef.activePhases;

  const generatedLayers = [];
  let layersTotalLow = 0;
  let layersTotalHigh = 0;

  // 1. Generate Layers
  activePhases.forEach(phaseKey => {
    if (!LAYER_PRICING[phaseKey]) return;
    
    LAYER_PRICING[phaseKey].forEach(item => {
      // Calculate adjusted quantities based on width and length
      const adjustedQtyPerKm = item.qtyPerKm * wMult;
      const totalQty = adjustedQtyPerKm * lengthKm;
      
      // Calculate costs reflecting terrain and accessibility
      // Unit cost is fixed as per RCMS, but the *effective* budget required goes up due to multipliers
      const tCostLow = totalQty * item.costLow * tMult * aMult;
      const tCostHigh = totalQty * item.costHigh * tMult * aMult;

      generatedLayers.push({
        phaseNumber: Math.floor(phaseKey),
        phaseName: `Phase ${Math.floor(phaseKey)}`,
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

    ACCESSORY_PRICING[accKey].forEach(item => {
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
 * Saves a calculated estimate to the database, binding it to a project
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
  LAYER_PRICING,
  ACCESSORY_PRICING
};
