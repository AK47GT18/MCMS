const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const contractsService = require('./src/services/contracts.service');

async function main() {
    const data = {
        refCode: 'TEST-100',
        title: 'Test Contract',
        documentUrl: '/uploads/documents/test.pdf',
        fileName: 'test.pdf',
        contractType: 'project',
        projectId: 1,
        value: 1000
    };
    
    // Simulate what happens in controller
    const result = await contractsService.create(data, 1);
    console.log("Created Contract:", result);
    
    const version = await prisma.contractVersion.findFirst({
        where: { contractId: result.id }
    });
    console.log("Created Version:", version);
}

main().catch(console.error).finally(() => prisma.$disconnect());
