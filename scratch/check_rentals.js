const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.vehicleRentalContract.count();
  console.log('Vehicle Rental Contracts Count:', count);
  const all = await prisma.vehicleRentalContract.findMany({ include: { project: true } });
  console.log('All rentals:', JSON.stringify(all, null, 2));
}
main().catch(console.error);
