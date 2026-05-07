const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Searching for Mike Banda...');
    const mike = await prisma.user.findFirst({
        where: { name: { contains: 'Mike Banda' } }
    });
    
    if (!mike) {
        console.error('Mike Banda not found');
        return;
    }
    
    console.log('Found Mike Banda:', mike.id);

    let m1 = await prisma.project.findUnique({
        where: { code: 'M1' }
    });
    
    if (!m1) {
        console.log('M1 not found, checking for MZ-05 or CEN-01 to rename...');
        const firstProj = await prisma.project.findFirst();
        if (firstProj) {
            m1 = await prisma.project.update({
                where: { id: firstProj.id },
                data: { code: 'M1', name: 'M1 Main Highway' }
            });
            console.log('Renamed project to M1:', m1.id);
        } else {
            console.log('No projects found to assign.');
            return;
        }
    }
    
    await prisma.project.update({
        where: { id: m1.id },
        data: { fieldSupervisorId: mike.id }
    });
    
    console.log(`SUCCESS: Assigned Mike Banda (${mike.id}) to Project M1 (${m1.id})`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
