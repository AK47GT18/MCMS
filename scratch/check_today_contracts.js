const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contracts = await prisma.contract.findMany({
        where: { status: { in: ['active', 'draft'] } },
        include: { items: true }
    });
    console.log(JSON.stringify(contracts, null, 2));
}

main().finally(() => prisma.$disconnect());
