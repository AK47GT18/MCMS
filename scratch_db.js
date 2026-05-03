const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
    const versions = await prisma.contractVersion.findMany({ 
        orderBy: { createdAt: 'desc' }, 
        take: 3 
    }); 
    console.log(versions.map(v => ({ id: v.id, url: v.documentUrl }))); 
} 

main().catch(console.error).finally(() => prisma.$disconnect());
