const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const items = await p.inventory.findMany({
    include: { sector: { include: { project: true } } },
    take: 20
  });
  
  console.log('=== INVENTORY RECORDS ===');
  items.forEach(i => {
    console.log(`  SectorID=${i.sectorId} (${i.sector?.name}) | ProjectID=${i.sector?.projectId} (${i.sector?.project?.name || 'N/A'}) | ${i.materialName}: ${i.quantityOnHand} ${i.unit}`);
  });
  
  console.log('\n=== SECTORS ===');
  const sectors = await p.sector.findMany({ include: { project: true }, take: 10 });
  sectors.forEach(s => {
    console.log(`  SectorID=${s.id} | ProjectID=${s.projectId} (${s.project?.name}) | Name: ${s.name}`);
  });
  
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
