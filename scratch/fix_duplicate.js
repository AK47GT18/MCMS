const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Correct the inventory to 16,000 (remove the duplicate)
  await prisma.inventory.update({
    where: { id: 65 },
    data: { quantityOnHand: 16000 }
  });
  console.log('Inventory corrected to 16,000L');

  // 2. Mark the requisition as fulfilled
  await prisma.requisition.update({
    where: { id: 5 },
    data: { 
      status: 'fulfilled',
      dispatchStatus: 'delivered'
    }
  });
  console.log('Requisition 5 marked as fulfilled');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
