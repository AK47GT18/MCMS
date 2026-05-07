const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Adding Herbicide baseline...');
    try {
        const create = await prisma.materialPriceConfig.upsert({
            where: { materialName: 'Herbicide (stump treatment)' },
            update: { basePrice: 45000 },
            create: {
                materialName: 'Herbicide (stump treatment)',
                category: 'Material',
                unit: 'Litre',
                basePrice: 45000,
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
