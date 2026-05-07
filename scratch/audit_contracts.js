const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const items = await prisma.contractItem.findMany({
        where: { materialName: { in: ['GPS/Total Station Hire', 'Chainsaw Fuel', 'Survey Pegs & Paint'] } },
        include: { contract: true }
    });
    console.log(JSON.stringify(items, null, 2));
}

main().finally(() => prisma.$disconnect());
