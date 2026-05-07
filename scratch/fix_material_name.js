const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating material price configuration name...');
    try {
        const update = await prisma.materialPriceConfig.update({
            where: { materialName: 'Cement OPC' },
            data: { materialName: 'Portland Cement (50kg)' }
        });
        console.log('Update successful:', update);
    } catch (error) {
        if (error.code === 'P2025') {
            console.log('Material "Cement OPC" not found. Checking for "Portland Cement (50kg)"...');
            const existing = await prisma.materialPriceConfig.findUnique({
                where: { materialName: 'Portland Cement (50kg)' }
            });
            if (existing) {
                console.log('Portland Cement (50kg) already exists with price:', existing.basePrice.toString());
            } else {
                console.log('Neither material found. Please check database state.');
            }
        } else {
            console.error('Error updating material name:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
