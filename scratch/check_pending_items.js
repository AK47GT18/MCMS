const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const items = await prisma.contractItem.findMany({
        include: { contract: true }
    });
    
    const pending = items.filter(item => {
        const remaining = Number(item.quantity) - Number(item.receivedQty || 0);
        return remaining > 0;
    });
    
    console.log(JSON.stringify(pending, null, 2));
}

main().finally(() => prisma.$disconnect());
