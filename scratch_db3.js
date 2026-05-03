const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const versions = await prisma.contractVersion.findMany({
        where: { id: 2 }
    });
    console.log(versions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
