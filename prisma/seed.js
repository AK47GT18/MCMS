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
    
    // 1. Create Users
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
        { name: 'Malawi Cement', category: 'Materials', status: 'approved' },
        { name: 'CAT Rentals', category: 'Equipment', status: 'approved' },
        { name: 'Shire Steel', category: 'Materials', status: 'pending' },
        { name: 'Apex Security', category: 'Services', status: 'approved' }
    ];

    const vendorMap = [];
    for (const v of VENDORS) {
        const vendor = await prisma.vendor.create({
            data: {
                name: v.name,
                category: v.category,
                status: v.status,
                taxClearanceValid: true,
                taxClearanceExpiry: dateOffset(180)
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
                managerId: pm.id
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
                value: 50000000,
                startDate: p.startDate,
                endDate: p.endDate,
                status: 'active',
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
        const req = await prisma.requisition.create({
            data: {
                reqCode: `REQ-${p.code}-001`,
                projectId: project.id,
                vendorId: vendor.id,
                submittedBy: userMap['m.banda@mkaka.mw'].id, // Field Sup
                description: 'Emergency cement bags',
                totalAmount: 150000,
                status: 'approved',
                reviewedBy: userMap['s.jenkins@mkaka.mw'].id, // PM
                items: {
                    create: [
                        { itemName: 'Cement Bag', quantity: 50, unitPrice: 3000 }
                    ]
                }
            }
        });

        await prisma.transaction.create({
            data: {
                entryCode: `TRX-${p.code}-001`,
                requisitionId: req.id,
                projectId: project.id,
                description: 'Payment for Emergency cement',
                debit: 150000,
                createdBy: userMap['s.mwale@mkaka.mw'].id // Finance
            }
        });
        console.log(` > Added finance records for ${p.code}`);

        // 4.5 Incidents & Issues
        await prisma.safetyIncident.create({
            data: {
                projectId: project.id,
                reportedBy: userMap['m.banda@mkaka.mw'].id,
                incidentType: 'Near Miss',
                siteArea: 'Main Gate',
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
