import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const latest = await prisma.requisition.findFirst({
        orderBy: { id: 'desc' },
        include: { items: true }
    });
    console.log(JSON.stringify(latest, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
