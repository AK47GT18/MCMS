const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const admin = await prisma.user.findFirst();
  if (!admin) { console.log('No user found'); process.exit(1); }

  // 1. Wipe ALL existing material prices (clean slate)
  await prisma.materialPriceConfig.deleteMany({});
  console.log('Cleared old material prices');

  // 2. Insert correct Malawi 2025 road construction materials ONLY
  const materials = [
    // === PHASE 1: Clearing & Grubbing ===
    { materialName: 'Diesel Fuel', unit: 'Litre', basePrice: 6687 },

    // === PHASE 2: Earthworks / Subgrade ===
    { materialName: 'Geotextile Fabric', unit: 'Roll (50m²)', basePrice: 22000 },
    { materialName: 'Lime (stabiliser)', unit: 'Tonne', basePrice: 95000 },

    // === PHASE 3: Sub-base ===
    { materialName: 'Gravel/Crushed Stone', unit: 'Tonne', basePrice: 18000 },

    // === PHASE 4: Base Course ===
    { materialName: 'Aggregate Base', unit: 'Tonne', basePrice: 35000 },
    { materialName: 'Crushed Stone', unit: 'Tonne', basePrice: 45000 },

    // === PHASE 5: Surfacing (Asphalt) ===
    { materialName: 'Bitumen 60/70', unit: 'Tonne', basePrice: 820000 },
    { materialName: 'Emulsion Primer', unit: 'Drum (200L)', basePrice: 95000 },
    { materialName: 'Tack Coat (SS-1)', unit: 'Drum (200L)', basePrice: 85000 },

    // === PHASE 5 ALT: Surface Dressing (RT-3) ===
    { materialName: 'Aggregate Chippings 10/14mm', unit: 'm³', basePrice: 250000 },
    { materialName: 'Aggregate Chippings 6/10mm', unit: 'm³', basePrice: 260000 },

    // === PHASE 5 ALT: Concrete (RT-5) ===
    { materialName: 'Ready-mix Concrete C30', unit: 'm³', basePrice: 850000 },
    { materialName: 'Steel Mesh Fabric A252', unit: 'm²', basePrice: 16000 },
    { materialName: 'Steel Reinforcement Y16', unit: 'kg', basePrice: 3000 },
    { materialName: 'Joint Sealant Polyurethane', unit: 'm', basePrice: 25000 },

    // === PHASE 6: Drainage ===
    { materialName: 'Cement OPC', unit: 'Bag (50kg)', basePrice: 18500 },
    { materialName: 'River Sand', unit: 'Tonne', basePrice: 25000 },
    { materialName: 'Reinforcement Steel (12mm)', unit: 'Length (12m)', basePrice: 22000 },
    { materialName: 'PVC Culvert Pipes', unit: 'Length (6m)', basePrice: 35000 },
    { materialName: 'Concrete Pipes', unit: 'Piece', basePrice: 45000 },
    { materialName: 'HDPE Culvert 450mm', unit: 'm', basePrice: 120000 },
    { materialName: 'Precast RC Culvert 600mm', unit: 'm', basePrice: 180000 },

    // === PHASE 7: Road Furniture & Accessories ===
    { materialName: 'Road Marking Paint', unit: 'Bucket (20L)', basePrice: 55000 },
    { materialName: 'Kerb Stones', unit: 'Piece', basePrice: 5500 },
    { materialName: 'W-Beam Guardrail', unit: 'Panel (4m)', basePrice: 185000 },
    { materialName: 'Road Signs', unit: 'Unit', basePrice: 95000 },
    { materialName: 'Delineator Posts', unit: 'Unit', basePrice: 12000 },
    { materialName: 'Cat Eyes/Studs', unit: 'Unit', basePrice: 8500 },

    // === ACCESSORIES: Lighting ===
    { materialName: 'Solar Street Light Set', unit: 'Unit', basePrice: 450000 },
    { materialName: 'Roadside Single-arm Pole', unit: 'Unit', basePrice: 1800000 },
    { materialName: 'High-mast Tower', unit: 'Unit', basePrice: 20000000 },

    // === ACCESSORIES: Pedestrian/NMT ===
    { materialName: 'Concrete (for walkways)', unit: 'm³', basePrice: 120000 },

    // === ACCESSORIES: Transit ===
    { materialName: 'Bus Shelter', unit: 'Unit', basePrice: 1200000 },
    { materialName: 'Concrete Slab (bus bay)', unit: 'm²', basePrice: 45000 },

    // === GENERAL (used across phases) ===
    { materialName: 'Water for Compaction', unit: 'm³', basePrice: 15000 },
    { materialName: 'Survey Pegs & Paint', unit: 'Set', basePrice: 15000 },
    { materialName: 'GPS/Total Station Hire', unit: 'Days', basePrice: 400000 },
    { materialName: 'Chainsaw Fuel', unit: 'Litres', basePrice: 6000 },
    { materialName: 'Borrow Fill (laterite)', unit: 'm³', basePrice: 8000 },
    { materialName: 'OPC Cement (stabilised base)', unit: '50kg bag', basePrice: 75000 },
    { materialName: 'Concrete Lined U-drain', unit: 'm', basePrice: 60000 },
    { materialName: 'Headwall & Wingwall Concrete', unit: 'Each', basePrice: 900000 },
  ];

  for (const mat of materials) {
    await prisma.materialPriceConfig.create({
      data: { ...mat, updatedById: admin.id }
    });
  }

  console.log(`Seeded ${materials.length} road construction materials with 2025 Malawi prices!`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
