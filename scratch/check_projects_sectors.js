const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const projects = await p.project.findMany({ select: { id: true, name: true, code: true } });
  console.log('=== PROJECTS ===');
  projects.forEach(pr => console.log(`  ID=${pr.id} | Code=${pr.code} | Name=${pr.name}`));

  const sectors = await p.sector.findMany({ include: { project: true } });
  console.log('\n=== SECTORS ===');
  sectors.forEach(s => console.log(`  ID=${s.id} | ProjectID=${s.projectId} | Name=${s.name}`));

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
