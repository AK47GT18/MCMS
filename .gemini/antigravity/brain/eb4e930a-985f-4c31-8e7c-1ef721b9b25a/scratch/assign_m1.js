const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Assign M1 Road (ID 25) to Mike Banda (ID 3)
        const updatedProject = await prisma.project.update({
            where: { id: 25 },
            data: { 
                fieldSupervisorId: 3,
                status: 'active'
            }
        });
        console.log('Project updated:', updatedProject.name, 'assigned to Mike Banda');

        // Verify Mike Banda's projects
        const projects = await prisma.project.findMany({
            where: { fieldSupervisorId: 3 },
            select: { id: true, name: true, fieldSupervisorId: true }
        });
        console.log('Mike Banda Assigned Projects:', JSON.stringify(projects, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
