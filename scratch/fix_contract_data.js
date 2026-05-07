const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Fixing Contract Item Values ---');

    // 1. Fix GPS/Total Station Hire (VND-25-94673)
    const gpsItem = await prisma.contractItem.findFirst({
        where: { materialName: 'GPS/Total Station Hire', contract: { refCode: 'VND-25-94673' } }
    });
    if (gpsItem) {
        await prisma.contractItem.update({
            where: { id: gpsItem.id },
            data: { quantity: 1, unitPrice: 500000, totalCost: 500000 }
        });
        console.log('Fixed GPS Item: Set Qty to 1, Total to 500,000');
    }

    // 2. Fix Survey Pegs & Paint (CON-MOSLGNR9)
    const pegsItem = await prisma.contractItem.findFirst({
        where: { materialName: 'Survey Pegs & Paint', contract: { refCode: 'CON-MOSLGNR9' } }
    });
    if (pegsItem) {
        await prisma.contractItem.update({
            where: { id: pegsItem.id },
            data: { unitPrice: 45000, totalCost: 900000 } // 20 * 45,000
        });
        console.log('Fixed Pegs Item: Set Unit Price to 45,000, Total to 900,000');
    }

    // 3. Fix Chainsaw Fuel (CON-MOSNLJ84)
    const fuelItem = await prisma.contractItem.findFirst({
        where: { materialName: 'Chainsaw Fuel', contract: { refCode: 'CON-MOSNLJ84' } }
    });
    if (fuelItem) {
        await prisma.contractItem.update({
            where: { id: fuelItem.id },
            data: { unitPrice: 6687, totalCost: 3677850 } // 550 * 6687
        });
        console.log('Fixed Fuel Item: Set Unit Price to 6,687, Total to 3,677,850');
    }

    console.log('--- Database Correction Complete ---');
}

main().finally(() => prisma.$disconnect());
