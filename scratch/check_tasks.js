const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                project: {
                    code: 'PROJ-R8B12K'
                }
            },
            include: {
                project: true,
                dependency: true
            }
        });
        console.log(JSON.stringify(tasks, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
