
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssets() {
  try {
    const count = await prisma.asset.count();
    console.log('Total assets in DB:', count);
    
    const assets = await prisma.asset.findMany({ take: 5 });
    console.log('Sample assets:', JSON.stringify(assets, null, 2));
    
  } catch (err) {
    console.error('Error checking assets:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssets();
