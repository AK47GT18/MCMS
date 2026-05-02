const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { RESOURCE_MAPPING } = require('./seed-data.js');

async function seedResources() {
    console.log('Starting Resource DB Seed...');

    const uniqueMachines = new Map();
    const uniqueMaterials = new Map();

    // Extract unique machines and materials from mapping
    Object.values(RESOURCE_MAPPING).forEach(rt => {
        Object.values(rt.phases).forEach(phase => {
            phase.machinery.forEach(m => {
                const models = m.model.split(' / ');
                models.forEach(model => {
                    const cleanModel = model.trim();
                    if (!uniqueMachines.has(cleanModel)) {
                        uniqueMachines.set(cleanModel, m.type);
                    }
                });
            });

            phase.materials.forEach(m => {
                if (!uniqueMaterials.has(m.name)) {
                    uniqueMaterials.set(m.name, m);
                }
            });
        });
    });

    console.log(`Found ${uniqueMachines.size} unique machine models and ${uniqueMaterials.size} unique materials.`);

    // Seed Machines (Assets)
    for (const [model, category] of uniqueMachines.entries()) {
        const existing = await prisma.asset.findFirst({
            where: { name: model }
        });
        if (!existing) {
            await prisma.asset.create({
                data: {
                    name: model,
                    assetCode: 'EQ-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                    category: category,
                    status: 'available',
                    estimatedValue: 50000.00
                }
            });
            console.log(`Added Asset: ${model} (${category})`);
        }
    }

    // Seed Materials (MaterialPriceConfig)
    for (const [name, data] of uniqueMaterials.entries()) {
        const existing = await prisma.materialPriceConfig.findFirst({
            where: { materialName: name }
        });
        if (!existing) {
            // Check if there is an admin user to link to, if not use 1
            const user = await prisma.user.findFirst({ where: { role: 'Project_Manager' } });
            await prisma.materialPriceConfig.create({
                data: {
                    materialName: name,
                    unit: data.unit,
                    basePrice: data.price || 5000.00
                }
            });
            console.log(`Added Material: ${name} (${data.unit})`);
        }
    }

    console.log('Resource DB Seed Complete!');
}

seedResources().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
