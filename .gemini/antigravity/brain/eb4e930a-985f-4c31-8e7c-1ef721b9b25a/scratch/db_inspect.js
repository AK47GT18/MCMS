const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const projects = await prisma.project.findMany({
            include: { fieldSupervisor: true, _count: { select: { tasks: true } } }
        });
        console.log('--- PROJECTS ---');
        console.log(JSON.stringify(projects, null, 2));

        const tasks = await prisma.task.findMany();
        console.log('--- TASKS ---');
        console.log(JSON.stringify(tasks, null, 2));

        const users = await prisma.user.findMany({
            select: { id: true, name: true, role: true }
        });
        console.log('--- USERS ---');
        console.log(JSON.stringify(users, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
