const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fixRequisition() {
  // Update the unit price for Cement OPC (18,500 MWK per bag)
  await p.requisitionItem.update({
    where: { id: 1 },
    data: { unitPrice: 18500 }
  });

  // Update totalAmount: 100 bags x 18,500 = 1,850,000 MWK
  await p.requisition.update({
    where: { id: 1 },
    data: { totalAmount: 100 * 18500 }
  });

  const r = await p.requisition.findUnique({
    where: { id: 1 },
    include: { items: true }
  });

  console.log('Updated REQ-126820-001:');
  console.log('  Total Amount:', Number(r.totalAmount).toLocaleString(), 'MWK');
  r.items.forEach(i => {
    console.log('  Item:', i.itemName, '| Qty:', i.quantity, '| Unit Price:', Number(i.unitPrice).toLocaleString());
  });

  await p.$disconnect();
}

fixRequisition().catch(e => { console.error(e); process.exit(1); });
