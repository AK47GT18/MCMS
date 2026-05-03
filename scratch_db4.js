const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contract = await prisma.contract.findUnique({
        where: { id: 22 }
    });
    console.log('Contract:', JSON.stringify(contract, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
