import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const reqs = await prisma.requisition.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: {
            id: true,
            reqCode: true,
            dispatchedBy: true,
            dispatchedPhone: true,
            notes: true,
            createdAt: true
        }
    });
    console.log(JSON.stringify(reqs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
