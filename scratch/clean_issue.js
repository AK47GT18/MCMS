const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    const issue = await prisma.issue.findUnique({where: {id: 26}});
    if (issue && issue.resolutionNotes) {
        const cleaned = issue.resolutionNotes
            .split('\n\n')
            .filter(n => !n.includes('installHook.js') && !n.includes('TypeError: Cannot read properties of null'))
            .join('\n\n');
        
        await prisma.issue.update({
            where: {id: 26},
            data: {resolutionNotes: cleaned}
        });
        console.log('Cleaned Issue 26');
    } else {
        console.log('Issue 26 not found or has no notes.');
    }
}

clean().catch(console.error).finally(() => prisma.$disconnect());
