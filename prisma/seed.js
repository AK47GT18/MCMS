const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ROLES = {
    PROJECT_MANAGER: 'Project_Manager',
    FINANCE_DIRECTOR: 'Finance_Director',
    FIELD_SUPERVISOR: 'Field_Supervisor',
    CONTRACT_ADMIN: 'Contract_Administrator',
    EQUIPMENT_COORDINATOR: 'Equipment_Coordinator',
    OPERATIONS_MANAGER: 'Operations_Manager',
    MANAGING_DIRECTOR: 'Managing_Director',
    SYSTEM_TECHNICIAN: 'System_Technician'
};

const USERS = [
    {
        name: 'Sarah Jenkins',
        role: ROLES.PROJECT_MANAGER,
        email: 's.jenkins@mkaka.mw',
        phone: '+265 991 234 567',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=0D8ABC&color=fff',
        permissions: ['read_all', 'write_project', 'approve_timesheets']
    },
    {
        name: 'Stefan Mwale',
        role: ROLES.FINANCE_DIRECTOR,
        email: 's.mwale@mkaka.mw',
        phone: '+265 882 111 222',
        avatarUrl: 'https://ui-avatars.com/api/?name=Stefan+Mwale&background=F97316&color=fff',
        permissions: ['read_all', 'write_finance', 'approve_budget']
    },
    {
        name: 'Mike Banda',
        role: ROLES.FIELD_SUPERVISOR,
        email: 'm.banda@mkaka.mw',
        phone: '+265 995 333 444',
        avatarUrl: 'https://ui-avatars.com/api/?name=Mike+Banda&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    },
    {
        name: 'John Kaira',
        role: ROLES.CONTRACT_ADMIN,
        email: 'j.kaira@mkaka.mw',
        phone: '+265 884 555 666',
        avatarUrl: 'https://ui-avatars.com/api/?name=John+Kaira&background=7C3AED&color=fff',
        permissions: ['read_contracts', 'write_contracts']
    },
    {
        name: 'Blessings Phiri',
        role: ROLES.EQUIPMENT_COORDINATOR,
        email: 'b.phiri@mkaka.mw',
        phone: '+265 993 777 888',
        avatarUrl: 'https://ui-avatars.com/api/?name=Blessings+Phiri&background=6366F1&color=fff',
        permissions: ['read_fleet', 'write_maintenance']
    },
    {
        name: 'Grace Chibwe',
        role: ROLES.OPERATIONS_MANAGER,
        email: 'g.chibwe@mkaka.mw',
        phone: '+265 889 999 000',
        avatarUrl: 'https://ui-avatars.com/api/?name=Grace+Chibwe&background=EC4899&color=fff',
        permissions: ['read_all', 'write_operations']
    },
    {
        name: 'David Mkaka',
        role: ROLES.MANAGING_DIRECTOR,
        email: 'd.mkaka@mkaka.mw',
        phone: '+265 991 123 456',
        avatarUrl: 'https://ui-avatars.com/api/?name=David+Mkaka&background=111827&color=fff',
        permissions: ['read_all', 'approve_high_value']
    },
    {
        name: 'Isaac Newton',
        role: ROLES.SYSTEM_TECHNICIAN,
        email: 'i.newton@mkaka.mw',
        phone: '+265 990 000 111',
        avatarUrl: 'https://ui-avatars.com/api/?name=Isaac+Newton&background=334155&color=fff',
        permissions: ['read_all', 'manage_system', 'manage_users']
    },
    {
        name: 'Arthony Kanjira',
        role: ROLES.SYSTEM_TECHNICIAN,
        email: 'arthonykanjira444@gmail.com',
        phone: '+265 999 111 222',
        avatarUrl: 'https://ui-avatars.com/api/?name=Arthony+Kanjira&background=000000&color=fff',
        permissions: ['read_all', 'manage_system', 'manage_users', 'bypass_rate_limit']
    },
    {
        name: 'Unilia Student',
        role: ROLES.PROJECT_MANAGER,
        email: 'cen-01-01-22@unilia.ac.mw',
        phone: '+265 888 333 444',
        avatarUrl: 'https://ui-avatars.com/api/?name=Unilia+Student&background=0D8ABC&color=fff',
        permissions: ['read_all', 'write_project']
    },
    {
        name: 'Timothy Phiri',
        role: ROLES.FIELD_SUPERVISOR,
        email: 't.phiri@mkaka.mw',
        phone: '+265 996 111 222',
        avatarUrl: 'https://ui-avatars.com/api/?name=Timothy+Phiri&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    },
    {
        name: 'Lumbani Gondwe',
        role: ROLES.FIELD_SUPERVISOR,
        email: 'l.gondwe@mkaka.mw',
        phone: '+265 885 222 333',
        avatarUrl: 'https://ui-avatars.com/api/?name=Lumbani+Gondwe&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    },
    {
        name: 'Chisomo Mwale',
        role: ROLES.FIELD_SUPERVISOR,
        email: 'c.mwale@mkaka.mw',
        phone: '+265 994 444 555',
        avatarUrl: 'https://ui-avatars.com/api/?name=Chisomo+Mwale&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    },
    {
        name: 'Memory Chirwa',
        role: ROLES.FIELD_SUPERVISOR,
        email: 'm.chirwa@mkaka.mw',
        phone: '+265 887 666 777',
        avatarUrl: 'https://ui-avatars.com/api/?name=Memory+Chirwa&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    },
    {
        name: 'Andrew Kumwenda',
        role: ROLES.FIELD_SUPERVISOR,
        email: 'a.kumwenda@mkaka.mw',
        phone: '+265 992 888 999',
        avatarUrl: 'https://ui-avatars.com/api/?name=Andrew+Kumwenda&background=10B981&color=fff',
        permissions: ['read_assigned', 'write_daily_logs']
    }
];

// Helper to get date offsets
const dateOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
};

async function main() {
    console.log('Start seeding ...');
    
    // 0. Cleanup (Selective for idempotency)
    console.log('--- Cleaning up existing operational data ---');
    await prisma.inventoryLog.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.sector.deleteMany();
    await prisma.roadLayer.deleteMany();
    await prisma.roadSpecification.deleteMany();
    await prisma.contractVersion.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.contractItem.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.assetLog.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.safetyIncident.deleteMany();
    await prisma.issue.deleteMany();
    await prisma.task.deleteMany();
    await prisma.materialPriceConfig.deleteMany();

    // 1. Create Material Price Configs (Baseline)
    console.log('--- Seeding Material Price Configurations ---');
    const MATERIAL_PRICES = [
        // Phase 1: Clearing & Grubbing
        { materialName: 'Survey Pegs & Paint', category: 'General', unit: 'Set', basePrice: 45000, phase: 'Phase 1: Clearing & Grubbing' },
        { materialName: 'Chainsaw Fuel', category: 'Fuel', unit: 'Litre', basePrice: 6687, phase: 'Phase 1: Clearing & Grubbing' },
        { materialName: 'Dust Suppressant', category: 'Chemicals', unit: 'Drum', basePrice: 450000, phase: 'Phase 1: Clearing & Grubbing' },
        
        // Phase 2: Earthworks
        { materialName: 'Borrow Fill (laterite)', category: 'Earthworks', unit: 'm3', basePrice: 15000, phase: 'Phase 2: Earthworks / Subgrade' },
        { materialName: 'Geogrid (stabilization)', category: 'Geosynthetics', unit: 'Roll', basePrice: 155000, phase: 'Phase 2: Earthworks / Subgrade' },
        { materialName: 'Geotextile Fabric', category: 'Geosynthetics', unit: 'Roll', basePrice: 45000, phase: 'Phase 2: Earthworks / Subgrade' },
        { materialName: 'Explosives (rock blasting)', category: 'Others', unit: 'kg', basePrice: 65000, phase: 'Phase 2: Earthworks / Subgrade' },
        { materialName: 'Earthworks Mobilization', category: 'Logistics', unit: 'Km', basePrice: 0, costPerKm: 5500000, phase: 'Phase 2: Earthworks / Subgrade' },
        
        // Phase 3: Sub-base
        { materialName: 'Gravel/Crushed Stone', category: 'Aggregates', unit: 'Tonne', basePrice: 28000, phase: 'Phase 3: Sub-base Construction' },
        { materialName: 'Soil Stabilizer (Liquid)', category: 'Chemicals', unit: 'Drum', basePrice: 1500000, phase: 'Phase 3: Sub-base Construction' },
        
        // Phase 4: Base Course
        { materialName: 'Aggregate Base', category: 'Aggregates', unit: 'Tonne', basePrice: 55000, phase: 'Phase 4: Base Course Construction' },
        { materialName: 'Crushed Stone (G1)', category: 'Aggregates', unit: 'Tonne', basePrice: 75000, phase: 'Phase 4: Base Course Construction' },
        { materialName: 'Crushed Stone (G2)', category: 'Aggregates', unit: 'Tonne', basePrice: 65000, phase: 'Phase 4: Base Course Construction' },
        { materialName: 'Bitumen Emulsion (Prime)', category: 'Bitumen', unit: 'Tonne', basePrice: 1200000, phase: 'Phase 4: Base Course Construction' },
        
        // Phase 5: Surfacing
        { materialName: 'Bitumen 60/70', category: 'Bitumen', unit: 'Tonne', basePrice: 1150000, phase: 'Phase 5: Surfacing' },
        { materialName: 'Bitumen 80/100', category: 'Bitumen', unit: 'Tonne', basePrice: 1250000, phase: 'Phase 5: Surfacing' },
        { materialName: 'Bitumen Emulsion (Tack)', category: 'Bitumen', unit: 'Tonne', basePrice: 1200000, phase: 'Phase 5: Surfacing' },
        { materialName: 'Aggregate Chippings 10/14mm', category: 'Aggregates', unit: 'm3', basePrice: 450000, phase: 'Phase 5: Surfacing' },
        { materialName: 'Aggregate Chippings 6/10mm', category: 'Aggregates', unit: 'm3', basePrice: 480000, phase: 'Phase 5: Surfacing' },
        { materialName: 'Ready-mix Concrete C30', category: 'Concrete', unit: 'm3', basePrice: 450000, phase: 'Phase 5: Surfacing' },
        { materialName: 'Stone Dust (filler)', category: 'Aggregates', unit: 'Tonne', basePrice: 45000, phase: 'Phase 5: Surfacing' },
        
        // Phase 6: Drainage
        { materialName: 'Portland Cement (50kg)', category: 'Cement', unit: 'Bag', basePrice: 18500, phase: 'Phase 6: Drainage' },
        { materialName: 'Gabion Boxes (2x1x1m)', category: 'Drainage', unit: 'Unit', basePrice: 95000, phase: 'Phase 6: Drainage' },
        { materialName: 'Reno Mattresses', category: 'Drainage', unit: 'Unit', basePrice: 85000, phase: 'Phase 6: Drainage' },
        { materialName: 'Precast U-drain Sections', category: 'Drainage', unit: 'm', basePrice: 155000, phase: 'Phase 6: Drainage' },
        { materialName: 'PVC Culvert Pipes (450mm)', category: 'Drainage', unit: 'Length', basePrice: 65000, phase: 'Phase 6: Drainage' },
        { materialName: 'Concrete Pipes (900mm)', category: 'Drainage', unit: 'Piece', basePrice: 85000, phase: 'Phase 6: Drainage' },
        { materialName: 'Standard Culvert Construction', category: 'Drainage', unit: 'Km', basePrice: 0, costPerKm: 18500000, phase: 'Phase 6: Drainage' },
        
        // Phase 7: Furniture
        { materialName: 'Road Marking Paint (White)', category: 'Road Furniture', unit: 'Bucket', basePrice: 75000, phase: 'Phase 7: Road Furniture & Accessories' },
        { materialName: 'Road Marking Paint (Yellow)', category: 'Road Furniture', unit: 'Bucket', basePrice: 75000, phase: 'Phase 7: Road Furniture & Accessories' },
        { materialName: 'Solar Street Light Set', category: 'Road Furniture', unit: 'Unit', basePrice: 450000, phase: 'Phase 7: Road Furniture & Accessories' },
        { materialName: 'Road Signs (Regulatory)', category: 'Road Furniture', unit: 'Unit', basePrice: 145000, phase: 'Phase 7: Road Furniture & Accessories' },
        { materialName: 'Cat Eyes/Studs (Glass)', category: 'Road Furniture', unit: 'Unit', basePrice: 15500, phase: 'Phase 7: Road Furniture & Accessories' },
        { materialName: 'Delineator Posts', category: 'Road Furniture', unit: 'Unit', basePrice: 22000, phase: 'Phase 7: Road Furniture & Accessories' },
        
        // Phase 8: Bridge
        { materialName: 'Structural Steel (Y32)', category: 'Metal', unit: 'Tonne', basePrice: 3200000, phase: 'Phase 8: Bridge Construction' },
        { materialName: 'Elastomeric Bearing Pads', category: 'Bridge Spec', unit: 'Each', basePrice: 255000, phase: 'Phase 8: Bridge Construction' },
        { materialName: 'Bridge Expansion Joint', category: 'Bridge Spec', unit: 'm', basePrice: 455000, phase: 'Phase 8: Bridge Construction' },
        
        // Phase 9: Site
        { materialName: 'Temporary Site Offices', category: 'Establishment', unit: 'Unit', basePrice: 25000000, phase: 'Phase 9: Site Establishment' },
        { materialName: 'Security Guards (Armed)', category: 'Services', unit: 'Man/Month', basePrice: 355000, phase: 'Phase 9: Site Establishment' },
        { materialName: 'Fuel Storage Tank (10kL)', category: 'Establishment', unit: 'Unit', basePrice: 12500000, phase: 'Phase 9: Site Establishment' },

        // Machinery & Labor Overrides (Optional but good for Everything)
        { materialName: 'Excavator Rental', category: 'Plant Hire', unit: 'Day', basePrice: 650000, phase: 'General' },
        { materialName: 'Grader Rental', category: 'Plant Hire', unit: 'Day', basePrice: 750000, phase: 'General' },
        { materialName: 'Site Engineer', category: 'Labor', unit: 'Month', basePrice: 2500000, phase: 'General' },
        { materialName: 'Skilled Artisan', category: 'Labor', unit: 'Day', basePrice: 45000, phase: 'General' },
        { materialName: 'GPS/Total Station Hire', category: 'Plant Hire', unit: 'Day', basePrice: 400000, phase: 'Phase 1: Clearing & Grubbing' },
        { materialName: 'Herbicide (stump treatment)', category: 'Material', unit: 'Litre', basePrice: 45000, phase: 'Phase 1: Clearing & Grubbing' }
    ];

    for (const mp of MATERIAL_PRICES) {
        await prisma.materialPriceConfig.create({
            data: mp
        });
    }
    console.log(` > Seeded ${MATERIAL_PRICES.length} material price definitions`);
    console.log('--- Seeding Users ---');
    const hashedPassword = await bcrypt.hash('Password@1', 10);
    const userMap = {}; // Map email to DB User object

    for (const user of USERS) {
        const userInDb = await prisma.user.upsert({
            where: { email: user.email },
            update: {
                role: user.role,
                passwordHash: hashedPassword,
                permissions: user.permissions,
                avatarUrl: user.avatarUrl,
                phone: user.phone
            },
            create: {
                name: user.name,
                email: user.email,
                role: user.role,
                passwordHash: hashedPassword,
                permissions: user.permissions,
                avatarUrl: user.avatarUrl,
                phone: user.phone
            },
        });
        userMap[user.email] = userInDb;
        console.log(`Upserted user: ${userInDb.name}`);
    }

    // 2. Create Vendors
    console.log('--- Seeding Vendors ---');
    const VENDORS = [
        { name: 'Malawi Cement', category: 'Materials', riskLevel: 'low', rating: 4.8 },
        { name: 'CAT Rentals', category: 'Equipment', riskLevel: 'medium', rating: 4.2 },
        { name: 'Shire Steel', category: 'Materials', riskLevel: 'low', rating: 4.5 },
        { name: 'Apex Security', category: 'Services', riskLevel: 'high', rating: 3.5 }
    ];

    const vendorMap = []; 
    for (const v of VENDORS) {
        const vendor = await prisma.vendor.upsert({
            where: { name: v.name },
            update: {
                category: v.category,
                riskLevel: v.riskLevel,
                rating: v.rating
            },
            create: {
                name: v.name,
                category: v.category,
                riskLevel: v.riskLevel,
                rating: v.rating
            }
        });
        vendorMap.push(vendor);
        console.log(`Created vendor: ${vendor.name}`);
    }

    // 3. Create Projects
    console.log('--- Seeding Projects ---');
    const PROJECTS = [
        {
            code: 'CEN-01',
            name: 'Unilia Library Complex',
            status: 'active',
            contractValue: 450000000.00,
            budgetTotal: 400000000.00,
            startDate: dateOffset(-60),
            endDate: dateOffset(300)
        },
        {
            code: 'MZ-05',
            name: 'Mzuzu Clinic Extension',
            status: 'planning',
            contractValue: 120000000.00,
            budgetTotal: 100000000.00,
            startDate: dateOffset(30),
            endDate: dateOffset(150)
        },
        {
            code: 'LIL-02',
            name: 'Area 18 Mall Access Road',
            status: 'completed', // Or use 'active' if you want it in active lists
            contractValue: 85000000.00,
            budgetTotal: 75000000.00,
            startDate: dateOffset(-200),
            endDate: dateOffset(-10)
        }
    ];

    const projectMap = {};

    for (const p of PROJECTS) {
        // Find PM (Sarah Jenkins)
        const pm = userMap['s.jenkins@mkaka.mw'];
        
        const project = await prisma.project.upsert({
            where: { code: p.code },
            update: {
                status: p.status,
                managerId: pm.id
            },
            create: {
                code: p.code,
                name: p.name,
                status: p.status,
                contractValue: p.contractValue,
                budgetTotal: p.budgetTotal,
                startDate: p.startDate,
                endDate: p.endDate,
                managerId: pm.id,
                fieldSupervisorId: p.code === 'CEN-01' ? userMap['m.banda@mkaka.mw'].id : null
            }
        });
        projectMap[p.code] = project;
        console.log(`Created project: ${project.name}`);

        // 4. Seed Data per Project
        
        // 4.1 Tasks
        if (p.code === 'CEN-01') {
           await prisma.task.createMany({
               data: [
                   { projectId: project.id, name: 'Site Clearing', startDate: dateOffset(-50), endDate: dateOffset(-45), progress: 100, statusClass: 'gantt-item-emerald' },
                   { projectId: project.id, name: 'Foundation', startDate: dateOffset(-40), endDate: dateOffset(-10), progress: 100, statusClass: 'gantt-item-emerald' },
                   { projectId: project.id, name: 'Steel Framing', startDate: dateOffset(-5), endDate: dateOffset(20), progress: 45, statusClass: 'gantt-item-orange' }
               ]
           });
           console.log(` > Added tasks for ${p.code}`);
        }

        // 4.2 Contracts
        const vendor = vendorMap[0]; // Malawi Cement 
        await prisma.contract.create({
            data: {
                refCode: `CTR-${p.code}-001`,
                title: `${p.name} - Cement Supply`,
                projectId: project.id,
                vendorId: vendor.id,
                vendorName: vendor.name,
                value: 50000000,
                startDate: p.startDate,
                endDate: p.endDate,
                status: 'active',
                items: {
                    create: [
                        { materialName: 'Portland Cement (50kg)', quantity: 5000, unit: 'Bags', unitPrice: 10000, totalCost: 50000000 }
                    ]
                },
                milestones: {
                    create: [
                        { description: 'Initial Deposit', value: 10000000, status: 'paid', dueDate: dateOffset(-55) },
                        { description: 'Foundation Completion', value: 20000000, status: 'scheduled', dueDate: dateOffset(-10) }
                    ]
                }
            }
        });
        console.log(` > Added contract for ${p.code}`);

        // 4.3 Assets (Fleet)
        await prisma.asset.create({
            data: {
                assetCode: `AST-${p.code}-01`,
                name: 'Caterpillar Excavator',
                category: 'Heavy Machinery',
                status: 'in_transit',
                currentProjectId: project.id,
                condition: 'Good',
                estimatedValue: 150000000
            }
        });
        console.log(` > Assigned asset to ${p.code}`);

        // 4.4 Requisitions & Transactions
        // NOTE: vendor_name column not in current migration, skipping
        // const req = await prisma.requisition.create({
        //     data: {
        //         reqCode: `REQ-${p.code}-001`,
        //         projectId: project.id,
        //         vendorName: 'Malawi Cement',
        //         submittedBy: userMap['m.banda@mkaka.mw'].id, // Field Sup
        //         totalAmount: 150000,
        //         status: 'approved',
        //         reviewedBy: userMap['s.jenkins@mkaka.mw'].id, // PM
        //         items: {
        //             create: [
        //                 { itemName: 'Cement Bag', quantity: 50, unitPrice: 3000 }
        //             ]
        //         }
        //     }
        // });

        // await prisma.transaction.create({
        //     data: {
        //         entryCode: `TRX-${p.code}-001`,
        //         requisitionId: req.id,
        //         projectId: project.id,
        //         description: 'Payment for Emergency cement',
        //         debit: 150000,
        //         createdBy: userMap['s.mwale@mkaka.mw'].id // Finance
        //     }
        // });
        console.log(` > Added finance records for ${p.code}`);

        // 4.6 Road Specifications & Phases
        const lengthKm = p.code === 'CEN-01' ? 12.5 : (p.code === 'MZ-05' ? 5.2 : 3.8);
        const spec = await prisma.roadSpecification.upsert({
            where: { projectId: project.id },
            update: {},
            create: {
                projectId: project.id,
                roadType: 'Bitumen',
                lengthKm: lengthKm,
                widthM: 7.5,
                lanes: 2,
                terrain: 'Rolling',
                geographicZone: 'Central Region',
                estimatedTotalLow: Number(p.budgetTotal) * 0.9,
                estimatedTotalHigh: Number(p.budgetTotal) * 1.1,
                approvedTotal: p.budgetTotal,
                reconciliationStatus: 'active'
            }
        });

        const ROAD_PHASES = [
            { number: 1, name: 'Phase 1: Bush Clearing & Earthworks', material: 'Gravel (Fill)', unit: 'm3', qtyPerKm: 2500, cost: 8500 },
            { number: 2, name: 'Phase 2: Sub-base Construction', material: 'Natural Gravel', unit: 'm3', qtyPerKm: 1800, cost: 12000 },
            { number: 3, name: 'Phase 3: Base Course (Stabilized)', material: 'Crushed Stone (G2)', unit: 'm3', qtyPerKm: 1500, cost: 25000 },
            { number: 4, name: 'Phase 4: Bitumen/Asphalt Surface', material: 'Bitumen (80/100)', unit: 'Liters', qtyPerKm: 45000, cost: 1800 },
            { number: 5, name: 'Phase 5: Drainage & Culverts', material: 'Concrete (Class 25)', unit: 'm3', qtyPerKm: 400, cost: 150000 },
            { number: 6, name: 'Phase 6: Signage & Markings', material: 'Road Paint', unit: 'Liters', qtyPerKm: 200, cost: 5500 }
        ];

        for (const phase of ROAD_PHASES) {
            const totalQty = Number(lengthKm) * phase.qtyPerKm;
            await prisma.roadLayer.create({
                data: {
                    specId: spec.id,
                    phaseNumber: phase.number,
                    phaseName: phase.name,
                    materialType: phase.material,
                    unit: phase.unit,
                    quantityPerKm: phase.qtyPerKm,
                    totalQuantity: totalQty,
                    unitCostLow: phase.cost * 0.95,
                    unitCostHigh: phase.cost * 1.05,
                    totalCostLow: totalQty * phase.cost * 0.95,
                    totalCostHigh: totalQty * phase.cost * 1.05,
                    approved: true
                }
            });
        }
        console.log(` > Seeded 6 construction phases for ${p.code}`);

        // 4.7 Sectors & Initial Inventory
        const sector1 = await prisma.sector.create({
            data: {
                projectId: project.id,
                name: 'Sector 1: Km 0 - Km 5',
                status: 'active',
                startDate: p.startDate
            }
        });

        await prisma.inventory.create({
            data: {
                sectorId: sector1.id,
                materialName: 'Portland Cement (50kg)',
                category: 'Materials',
                unit: 'Bags',
                quantityOnHand: 500,
                lowThreshold: 100
            }
        });

        await prisma.inventory.create({
            data: {
                sectorId: sector1.id,
                materialName: 'Bitumen (80/100)',
                category: 'Materials',
                unit: 'Liters',
                quantityOnHand: 10000,
                lowThreshold: 2000
            }
        });

        console.log(` > Established Sectors & Base Inventory for ${p.code}`);

        // 4.8 Incidents & Issues
        await prisma.safetyIncident.create({
            data: {
                projectId: project.id,
                reportedBy: userMap['m.banda@mkaka.mw'].id,
                type: 'Near Miss',
                severity: 'medium',
                location: 'Main Gate',
                description: 'Truck reversed too close to scaffolding.',
                status: 'resolved'
            }
        });

        await prisma.issue.create({
            data: {
                projectId: project.id,
                issueCode: `ISS-${p.code}-01`,
                category: 'Logistics',
                priority: 'High',
                description: 'Delay in steel delivery impacting schedule.',
                reportedBy: userMap['s.jenkins@mkaka.mw'].id,
                status: 'open'
            }
        });
        console.log(` > Added incidents/issues for ${p.code}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
