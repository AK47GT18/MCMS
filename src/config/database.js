/**
 * MCMS Configuration - Prisma Database Client
 * Singleton pattern for Prisma client to prevent multiple connections
 */

const { PrismaClient } = require('@prisma/client');

// Create singleton instance
let prisma = null;

/**
 * Get or create Prisma client instance
 * @returns {PrismaClient} Prisma client instance
 */
function getClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
    
    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }
  return prisma;
}

/**
 * Connect to database
 * @returns {Promise<void>}
 */
async function connect() {
  const client = getClient();
  await client.$connect();
  console.log('✅ Database connected successfully');
}

/**
 * Disconnect from database
 * @returns {Promise<void>}
 */
async function disconnect() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('📴 Database disconnected');
  }
}

module.exports = {
  getClient,
  connect,
  disconnect,
  // Direct access to prisma for convenience
  get prisma() {
    return getClient();
  }
};
