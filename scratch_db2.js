const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
    const contracts = await prisma.contract.findMany({ 
        select: { id: true, refCode: true, documentUrl: true } 
    }); 
    const versions = await prisma.contractVersion.findMany({ 
        select: { id: true, contractId: true, documentUrl: true } 
    }); 
    console.log("Contracts:");
    console.log(contracts);
    console.log("Versions:");
    console.log(versions);
} 

main().catch(console.error).finally(() => prisma.$disconnect());
