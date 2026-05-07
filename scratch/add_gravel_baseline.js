const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Add Gravel (Fill) baseline - from seed.js line 428: cost = 8500 per m3
    await prisma.materialPriceConfig.upsert({
        where: { materialName: 'Gravel (Fill)' },
        update: { basePrice: 8500 },
        create: {
            materialName: 'Gravel (Fill)',
            category: 'Earthworks',
            unit: 'm3',
            basePrice: 8500,
            phase: 'Phase 1: Bush Clearing & Earthworks'
        }
    });
    console.log('Added: Gravel (Fill) => 8,500 per m3');
    console.log('Done.');
}

main().finally(() => prisma.$disconnect());
