const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Activating all projects currently in planning...');
  const result = await prisma.project.updateMany({
    where: { status: 'planning' },
    data: { status: 'active' }
  });
  console.log(`Successfully activated ${result.count} projects.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
