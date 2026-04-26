/**
 * MCMS Seed Script — Construction Fleet Vehicles
 * Seeds the assets table with typical road construction equipment
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FLEET = [
  // --- EXCAVATORS ---
  { assetCode: 'EXC-001', name: 'CAT 320 GC Excavator', serialNumber: 'CAT320GC-2024-1187', category: 'Excavator', modelYear: 2024, hoursOrKm: 1240, condition: 'Good', fuelLevel: 78, status: 'available', estimatedValue: 45000000 },
  { assetCode: 'EXC-002', name: 'Komatsu PC200-10M0 Excavator', serialNumber: 'KOM-PC200-2023-0422', category: 'Excavator', modelYear: 2023, hoursOrKm: 2680, condition: 'Good', fuelLevel: 55, status: 'checked_out', estimatedValue: 42000000 },
  { assetCode: 'EXC-003', name: 'CAT 330 Excavator', serialNumber: 'CAT330-2022-0893', category: 'Excavator', modelYear: 2022, hoursOrKm: 4100, condition: 'Fair', fuelLevel: 30, status: 'checked_out', estimatedValue: 52000000 },

  // --- BULLDOZERS ---
  { assetCode: 'BDZ-001', name: 'CAT D6 XE Bulldozer', serialNumber: 'CATD6XE-2024-0516', category: 'Bulldozer', modelYear: 2024, hoursOrKm: 890, condition: 'Good', fuelLevel: 90, status: 'available', estimatedValue: 65000000 },
  { assetCode: 'BDZ-002', name: 'CAT D8T Bulldozer', serialNumber: 'CATD8T-2021-0341', category: 'Bulldozer', modelYear: 2021, hoursOrKm: 5200, condition: 'Fair', fuelLevel: 42, status: 'checked_out', estimatedValue: 95000000 },

  // --- MOTOR GRADERS ---
  { assetCode: 'GRD-001', name: 'CAT 140K Motor Grader', serialNumber: 'CAT140K-2023-0298', category: 'Motor_Grader', modelYear: 2023, hoursOrKm: 1850, condition: 'Good', fuelLevel: 65, status: 'checked_out', estimatedValue: 58000000 },
  { assetCode: 'GRD-002', name: 'John Deere 672G Motor Grader', serialNumber: 'JD672G-2022-0174', category: 'Motor_Grader', modelYear: 2022, hoursOrKm: 3100, condition: 'Good', fuelLevel: 70, status: 'available', estimatedValue: 55000000 },

  // --- WHEEL LOADERS ---
  { assetCode: 'WLD-001', name: 'CAT 950H Wheel Loader', serialNumber: 'CAT950H-2023-0612', category: 'Wheel_Loader', modelYear: 2023, hoursOrKm: 2100, condition: 'Good', fuelLevel: 80, status: 'available', estimatedValue: 38000000 },
  { assetCode: 'WLD-002', name: 'Komatsu WA380 Wheel Loader', serialNumber: 'KOMWA380-2022-0389', category: 'Wheel_Loader', modelYear: 2022, hoursOrKm: 3400, condition: 'Fair', fuelLevel: 45, status: 'checked_out', estimatedValue: 35000000 },

  // --- DUMP TRUCKS ---
  { assetCode: 'DMP-001', name: 'Hino 700 Tipper Truck (30T)', serialNumber: 'HINO700-2024-0831', category: 'Dump_Truck', modelYear: 2024, hoursOrKm: 18500, condition: 'Good', fuelLevel: 60, status: 'checked_out', estimatedValue: 28000000 },
  { assetCode: 'DMP-002', name: 'Isuzu FVZ 34T Tipper', serialNumber: 'ISUZUFVZ-2023-0445', category: 'Dump_Truck', modelYear: 2023, hoursOrKm: 42000, condition: 'Good', fuelLevel: 35, status: 'checked_out', estimatedValue: 25000000 },
  { assetCode: 'DMP-003', name: 'Hino 500 Tipper Truck (15T)', serialNumber: 'HINO500-2022-0267', category: 'Dump_Truck', modelYear: 2022, hoursOrKm: 67000, condition: 'Fair', fuelLevel: 50, status: 'available', estimatedValue: 18000000 },
  { assetCode: 'DMP-004', name: 'FAW J6P 40T Dump Truck', serialNumber: 'FAWJ6P-2024-0109', category: 'Dump_Truck', modelYear: 2024, hoursOrKm: 12000, condition: 'Good', fuelLevel: 85, status: 'available', estimatedValue: 22000000 },

  // --- COMPACTORS / ROLLERS ---
  { assetCode: 'ROL-001', name: 'Bomag BW211D-5 Single Drum Roller', serialNumber: 'BOMAG211-2024-0056', category: 'Compactor', modelYear: 2024, hoursOrKm: 650, condition: 'Good', fuelLevel: 92, status: 'available', estimatedValue: 32000000 },
  { assetCode: 'ROL-002', name: 'Dynapac CA2500 Vibratory Roller', serialNumber: 'DYNCA2500-2023-0183', category: 'Compactor', modelYear: 2023, hoursOrKm: 1400, condition: 'Good', fuelLevel: 55, status: 'checked_out', estimatedValue: 28000000 },
  { assetCode: 'ROL-003', name: 'Hamm HD 90i Tandem Roller', serialNumber: 'HAMMHD90-2022-0294', category: 'Compactor', modelYear: 2022, hoursOrKm: 2200, condition: 'Fair', fuelLevel: 40, status: 'available', estimatedValue: 24000000 },

  // --- WATER BOWSERS ---
  { assetCode: 'WTR-001', name: 'Sinotruk 20,000L Water Bowser', serialNumber: 'SINO-WTR-2023-0078', category: 'Water_Bowser', modelYear: 2023, hoursOrKm: 35000, condition: 'Good', fuelLevel: 70, status: 'checked_out', estimatedValue: 15000000 },
  { assetCode: 'WTR-002', name: 'Isuzu FTR 10,000L Water Tanker', serialNumber: 'ISUZU-WTR-2022-0156', category: 'Water_Bowser', modelYear: 2022, hoursOrKm: 52000, condition: 'Fair', fuelLevel: 30, status: 'available', estimatedValue: 12000000 },

  // --- CONCRETE MIXERS ---
  { assetCode: 'MIX-001', name: 'Howo 8m³ Concrete Transit Mixer', serialNumber: 'HOWO-MIX-2024-0041', category: 'Concrete_Mixer', modelYear: 2024, hoursOrKm: 8500, condition: 'Good', fuelLevel: 60, status: 'available', estimatedValue: 20000000 },

  // --- LOW-BED TRAILERS ---
  { assetCode: 'LBD-001', name: 'CIMC 60T Low-Bed Semi-Trailer', serialNumber: 'CIMC-LB-2023-0127', category: 'Low_Bed', modelYear: 2023, hoursOrKm: 28000, condition: 'Good', fuelLevel: null, status: 'available', estimatedValue: 18000000 },

  // --- PICKUP TRUCKS (SITE VEHICLES) ---
  { assetCode: 'PU-001', name: 'Toyota Hilux 2.8 GD-6 4x4 (Site PM)', serialNumber: 'TYT-HLX-2024-0912', category: 'Pickup', modelYear: 2024, hoursOrKm: 14000, condition: 'Good', fuelLevel: 65, status: 'checked_out', estimatedValue: 14000000 },
  { assetCode: 'PU-002', name: 'Toyota Hilux 2.4 GD-6 (Supervisor)', serialNumber: 'TYT-HLX-2023-0634', category: 'Pickup', modelYear: 2023, hoursOrKm: 38000, condition: 'Good', fuelLevel: 40, status: 'checked_out', estimatedValue: 12000000 },
  { assetCode: 'PU-003', name: 'Nissan Navara NP300 (Survey)', serialNumber: 'NIS-NAV-2022-0387', category: 'Pickup', modelYear: 2022, hoursOrKm: 56000, condition: 'Fair', fuelLevel: 25, status: 'available', estimatedValue: 9500000 },

  // --- CRANE ---
  { assetCode: 'CRN-001', name: 'XCMG QY25K5 25T Mobile Crane', serialNumber: 'XCMG-CRN-2023-0055', category: 'Crane', modelYear: 2023, hoursOrKm: 980, condition: 'Good', fuelLevel: 50, status: 'available', estimatedValue: 75000000 },

  // --- ASPHALT EQUIPMENT ---
  { assetCode: 'ASP-001', name: 'Vogele Super 1800-3i Asphalt Paver', serialNumber: 'VOGELE-1800-2024-0014', category: 'Paver', modelYear: 2024, hoursOrKm: 420, condition: 'Good', fuelLevel: 88, status: 'available', estimatedValue: 110000000 },
  { assetCode: 'ASP-002', name: 'Bitumen Distributor Truck (8,000L)', serialNumber: 'BIT-DIST-2023-0033', category: 'Bitumen_Distributor', modelYear: 2023, hoursOrKm: 15000, condition: 'Good', fuelLevel: 55, status: 'available', estimatedValue: 25000000 },

  // --- GENERATORS ---
  { assetCode: 'GEN-001', name: 'Cummins 250kVA Silent Diesel Generator', serialNumber: 'CUMM-250-2024-0089', category: 'Generator', modelYear: 2024, hoursOrKm: 320, condition: 'Good', fuelLevel: 75, status: 'checked_out', estimatedValue: 8000000 },
  { assetCode: 'GEN-002', name: 'Perkins 100kVA Portable Generator', serialNumber: 'PERK-100-2023-0214', category: 'Generator', modelYear: 2023, hoursOrKm: 1100, condition: 'Good', fuelLevel: 40, status: 'available', estimatedValue: 4500000 },
];

async function seed() {
  console.log('🚜 Seeding construction fleet vehicles...');

  // Fetch existing project IDs for assignment
  const projects = await prisma.project.findMany({ select: { id: true }, take: 5 });
  const projectIds = projects.map(p => p.id);

  let created = 0;
  let skipped = 0;

  for (const vehicle of FLEET) {
    // Check if already exists
    const existing = await prisma.asset.findUnique({ where: { assetCode: vehicle.assetCode } });
    if (existing) {
      skipped++;
      continue;
    }

    // Assign checked_out vehicles to random projects
    let currentProjectId = null;
    if (vehicle.status === 'checked_out' && projectIds.length > 0) {
      currentProjectId = projectIds[Math.floor(Math.random() * projectIds.length)];
    }

    await prisma.asset.create({
      data: {
        assetCode: vehicle.assetCode,
        name: vehicle.name,
        serialNumber: vehicle.serialNumber,
        category: vehicle.category,
        modelYear: vehicle.modelYear,
        hoursOrKm: vehicle.hoursOrKm,
        condition: vehicle.condition,
        fuelLevel: vehicle.fuelLevel,
        status: vehicle.status,
        estimatedValue: vehicle.estimatedValue,
        currentProjectId,
      },
    });
    created++;
  }

  console.log(`✅ Fleet seeding complete: ${created} created, ${skipped} skipped (already exist)`);
}

seed()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
