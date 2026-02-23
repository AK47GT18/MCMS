const usersService = require('../src/services/users.service');
const bcrypt = require('bcryptjs');

async function test() {
  console.log('--- Starting User Management Verification ---');

  try {
    // 1. Test getAll with role filter
    console.log('\nTesting role filter (Project_Manager)...');
    const pmUsers = await usersService.getAll({ role: 'Project_Manager' });
    console.log(`Found ${pmUsers.users.length} Project Managers`);
    const allArePMs = pmUsers.users.every(u => u.role === 'Project_Manager');
    console.log('Verification:', allArePMs ? 'PASS' : 'FAIL');

    // 2. Test getAll with isLocked filter
    console.log('\nTesting isLocked filter (true)...');
    const lockedUsers = await usersService.getAll({ isLocked: true });
    console.log(`Found ${lockedUsers.users.length} Locked users`);
    const allAreLocked = lockedUsers.users.every(u => u.isLocked === true);
    console.log('Verification:', allAreLocked ? 'PASS' : 'FAIL');

    // 3. Test getAll with search filter
    if (pmUsers.users.length > 0) {
      const firstUser = pmUsers.users[0];
      console.log(`\nTesting search filter for "${firstUser.name}"...`);
      const searchResult = await usersService.getAll({ search: firstUser.name });
      const found = searchResult.users.some(u => u.id === firstUser.id);
      console.log('Verification:', found ? 'PASS' : 'FAIL');
    }

    // 4. Test password update
    console.log('\nTesting password update for first user...');
    const testUser = (await usersService.getAll({ limit: 1 })).users[0];
    const newPassword = 'NewSecretPassword123!';
    
    await usersService.update(testUser.id, { password: newPassword });
    console.log('Password update called.');

    // Direct DB check for passwordHash (we need to bypass service's select to see it)
    const { prisma } = require('../src/config/database');
    const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    
    const isMatch = await bcrypt.compare(newPassword, updatedUser.passwordHash);
    console.log('Password hashing verification:', isMatch ? 'PASS' : 'FAIL');
    console.log('mustChangePassword set to true:', updatedUser.mustChangePassword ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    process.exit();
  }
}

test();
