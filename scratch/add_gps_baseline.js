const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Adding GPS/Total Station baseline...');
    try {
        const create = await prisma.materialPriceConfig.upsert({
            where: { materialName: 'GPS/Total Station Hire' },
            update: { basePrice: 400000 },
            create: {
                materialName: 'GPS/Total Station Hire',
                category: 'Plant Hire',
                unit: 'Day',
                basePrice: 400000,
                phase: 'Phase 1: Clearing & Grubbing'
            }
        });
        console.log('Upsert successful:', create);
    } catch (error) {
        console.error('Error upserting material price:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
