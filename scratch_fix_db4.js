const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    const fsProject = await prisma.project.findFirst({
        where: { id: 31 }
    });
    const ec = await prisma.user.findFirst({ where: { role: 'Equipment_Coordinator' }});

    const sector = await prisma.sector.findFirst({
        where: { projectId: fsProject.id }
    });

    if (sector) {
        // 1. Deduct 16000 from Sector 25 Diesel Fuel
        const inv = await prisma.inventory.findFirst({
            where: { sectorId: sector.id, materialName: 'Diesel Fuel' }
        });

        if (inv) {
            await prisma.inventory.update({
                where: { id: inv.id },
                data: { quantityOnHand: Math.max(0, inv.quantityOnHand - 16000) }
            });
            console.log("Deducted 16000 from existing inventory.");
        }
    }

    // 2. Create the Requisition in transit
    const req = await prisma.requisition.create({
        data: {
            project: { connect: { id: fsProject.id } },
            submitter: { connect: { id: ec.id } },
            reqCode: 'REQ-126820-002',
            status: 'approved',
            dispatchStatus: 'in_transit',
            totalAmount: 0,
            priority: 'high',
            notes: 'Direct EC Dispatch - Reason: scheduled fulfillment for site works...',
            estimatedArrival: new Date(),
            dispatchedBy: 'Equipment Coordinator',
            dispatchedPhone: '0885620896',
            items: {
                create: [{
                    itemName: 'Diesel Fuel',
                    quantity: 16000,
                    unit: 'Litre',
                    unitPrice: 6687
                }]
            }
        }
    });

    console.log("Created missing In-Transit Requisition:", req.id);
}

fix()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
