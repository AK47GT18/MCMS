const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Syncing Contract Total Values ---');

    const contractsToFix = [
        { ref: 'VND-25-94673', value: 500000 },
        { ref: 'CON-MOSNLJ84', value: 3677850 },
        { ref: 'CON-MOSLGNR9', value: 900000 }
    ];

    for (const target of contractsToFix) {
        const contract = await prisma.contract.findFirst({
            where: { refCode: target.ref },
            include: { items: true }
        });

        if (contract) {
            // Update the JSON materialsList as well to keep it in sync with the items table
            const updatedMaterialsList = contract.items.map(item => ({
                name: item.materialName,
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                totalCost: Number(item.totalCost)
            }));

            await prisma.contract.update({
                where: { id: contract.id },
                data: {
                    value: target.value,
                    status: 'active', // Restore to active
                    materialsList: JSON.stringify(updatedMaterialsList)
                }
            });
            console.log(`Updated ${target.ref}: Value = ${target.value}, Status = active`);
        }
    }

    console.log('--- Sync Complete ---');
}

main().finally(() => prisma.$disconnect());
