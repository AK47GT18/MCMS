const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Unassign Mike Banda (ID 3) from everything except M1 Road (ID 25)
        await prisma.project.updateMany({
            where: { 
                fieldSupervisorId: 3,
                NOT: { id: 25 }
            },
            data: { fieldSupervisorId: null }
        });
        
        console.log('Unassigned Mike Banda from other projects.');

        // Ensure M1 Road (ID 25) is assigned to him
        await prisma.project.update({
            where: { id: 25 },
            data: { fieldSupervisorId: 3 }
        });
        console.log('Verified M1 Road (ID 25) is assigned to Mike Banda.');

        // Verify final state
        const projects = await prisma.project.findMany({
            where: { fieldSupervisorId: 3 },
            select: { id: true, name: true, fieldSupervisorId: true }
        });
        console.log('Final Mike Banda Assigned Projects:', JSON.stringify(projects, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
