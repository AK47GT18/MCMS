const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get ALL contracts for project 25 (M1 Road) with their items
    const contracts = await prisma.contract.findMany({
        where: { projectId: 25 },
        include: { items: true }
    });

    console.log('=== ALL CONTRACTS FOR PROJECT 25 (M1 Road) ===\n');
    for (const c of contracts) {
        console.log(`--- ${c.refCode} ---`);
        console.log(`  Title:    ${c.title}`);
        console.log(`  Status:   ${c.status}`);
        console.log(`  Value:    ${c.value} (this is the ACTUAL contract value from FD)`);
        console.log(`  Vendor:   ${c.vendorName}`);
        console.log(`  Items:`);
        for (const item of c.items) {
            console.log(`    - ${item.materialName}: qty=${item.quantity}, unitPrice=${item.unitPrice}, totalCost=${item.totalCost}, receivedQty=${item.receivedQty}`);
        }
        console.log('');
    }
}

main().finally(() => prisma.$disconnect());
