/**
 * MCMS Service - Material Reconciliation (Stage 9)
 * Compares Budgeted vs Dispersed vs Consumed materials.
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Generate a reconciliation report for a project
 * @param {number} projectId 
 */
async function getProjectReconciliation(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      roadSpecification: {
        include: {
          layers: true,
          accessories: true
        }
      },
      sectors: {
        include: {
          inventories: {
            include: {
              logs: true
            }
          }
        }
      }
    }
  });

  if (!project) throw new AppError('Project not found', 404);

  // 1. Map Budgeted Materials
  const budgeted = {};
  if (project.roadSpecification) {
    project.roadSpecification.layers.forEach(layer => {
      const key = layer.materialType.toLowerCase();
      if (!budgeted[key]) budgeted[key] = { name: layer.materialType, unit: layer.unit, quantity: 0 };
      budgeted[key].quantity += Number(layer.totalQuantity);
    });
    project.roadSpecification.accessories.forEach(acc => {
      const key = acc.itemName.toLowerCase();
      if (!budgeted[key]) budgeted[key] = { name: acc.itemName, unit: acc.unit, quantity: 0 };
      budgeted[key].quantity += Number(acc.totalQuantity);
    });
  }

  // 2. Map Dispersed and Consumed Materials from Sector Inventory
  const actuals = {};
  project.sectors.forEach(sector => {
    sector.inventories.forEach(inv => {
      const key = inv.materialName.toLowerCase();
      if (!actuals[key]) {
        actuals[key] = { 
          name: inv.materialName, 
          unit: inv.unit, 
          dispersed: 0, 
          consumed: 0, 
          onHand: Number(inv.quantityOnHand) 
        };
      }
      
      inv.logs.forEach(log => {
        if (log.type === 'IN') {
          actuals[key].dispersed += Number(log.quantity);
        } else if (log.type === 'OUT') {
          actuals[key].consumed += Number(log.quantity);
        }
      });
    });
  });

  // 3. Reconcile
  const reconciliation = [];
  const allMaterialKeys = new Set([...Object.keys(budgeted), ...Object.keys(actuals)]);

  allMaterialKeys.forEach(key => {
    const b = budgeted[key] || { name: key, unit: 'N/A', quantity: 0 };
    const a = actuals[key] || { name: key, unit: b.unit, dispersed: 0, consumed: 0, onHand: 0 };
    
    const variance = a.consumed - b.quantity;
    const wastage = a.dispersed > 0 ? (a.dispersed - a.consumed - a.onHand) : 0; // Dispersed - Consumed should be OnHand. Any loss is wastage.

    reconciliation.push({
      material: b.name || a.name,
      unit: b.unit || a.unit,
      budgeted: b.quantity,
      dispersed: a.dispersed,
      consumed: a.consumed,
      onHand: a.onHand,
      variance: variance,
      wastage: Math.max(0, wastage), // Potential theft or missing logs
      status: variance > 0 ? 'over_budget' : (variance < -0.1 * b.quantity ? 'under_utilized' : 'on_track')
    });
  });

  return {
    projectId: project.id,
    projectName: project.name,
    reconciliation
  };
}

module.exports = {
  getProjectReconciliation
};
