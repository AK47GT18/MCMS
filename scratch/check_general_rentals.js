const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rentals = await prisma.contract.findMany({
    where: {
      OR: [
        { contractType: { contains: 'rental', mode: 'insensitive' } },
        { title: { contains: 'rental', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Rentals in contracts table:', JSON.stringify(rentals, null, 2));
}
main().catch(console.error);
