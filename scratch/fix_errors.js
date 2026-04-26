const fs = require('fs');

// 1. Fix limit=200 in FD_Records.js
const recordsPath = 'components/modules/fd/FD_Records.js';
if (fs.existsSync(recordsPath)) {
    let content = fs.readFileSync(recordsPath, 'utf8');
    content = content.replace(/limit=200/g, 'limit=100');
    fs.writeFileSync(recordsPath, content);
    console.log('Fixed limit=200 in FD_Records.js');
}

// 2. Fix approved by undefined in timelineExtension.service.js
const servicePath = 'src/services/timelineExtension.service.js';
if (fs.existsSync(servicePath)) {
    let content = fs.readFileSync(servicePath, 'utf8');
    // Ensure we have the user name in the notification
    // The issue is likely that pmUser passed from controller only has {id, role}
    // We can fetch the user name inside the approve function if it's missing
    const approveStart = 'async function approve(id, pmUser, pmComment) {';
    const nameFix = `  // Ensure pmUser has a name (might be missing from token)
  if (!pmUser.name) {
    const dbUser = await prisma.user.findUnique({ where: { id: pmUser.id }, select: { name: true } });
    if (dbUser) pmUser.name = dbUser.name;
  }
`;
    if (content.includes(approveStart)) {
        content = content.replace(approveStart, approveStart + '\n' + nameFix);
        fs.writeFileSync(servicePath, content);
        console.log('Fixed undefined name in timelineExtension.service.js');
    }
}
