const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.asset.count();
  console.log('Asset Count:', count);
  const all = await prisma.asset.findMany();
  console.log('All assets:', JSON.stringify(all, null, 2));
}
main().catch(console.error);
