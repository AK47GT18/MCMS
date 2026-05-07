const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. All baselines in the system
    const baselines = await prisma.materialPriceConfig.findMany({
        where: { isDeleted: false }
    });
    console.log('=== ALL BASELINES IN MaterialPriceConfig ===');
    baselines.forEach(b => {
        console.log(`  ${b.materialName} => ${b.basePrice} per ${b.unit}`);
    });

    // 2. All unique material names used in contracts
    const items = await prisma.contractItem.findMany({
        select: { materialName: true },
        distinct: ['materialName']
    });
    console.log('\n=== ALL UNIQUE MATERIALS IN CONTRACTS ===');
    items.forEach(i => {
        const match = baselines.find(b => b.materialName === i.materialName);
        console.log(`  ${i.materialName} => ${match ? 'HAS BASELINE: ' + match.basePrice : '*** NO BASELINE ***'}`);
    });

    // 3. Check CEN-01 contracts specifically
    const cenContracts = await prisma.contract.findMany({
        where: { project: { code: 'CEN-01' } },
        include: { items: true }
    });
    console.log('\n=== CEN-01 CONTRACTS ===');
    cenContracts.forEach(c => {
        console.log(`  ${c.refCode} | Status: ${c.status} | Contract Value: ${c.value}`);
        c.items.forEach(i => {
            console.log(`    Item: ${i.materialName} | qty=${i.quantity} | unitPrice=${i.unitPrice} | totalCost=${i.totalCost}`);
        });
    });
}

main().finally(() => prisma.$disconnect());
