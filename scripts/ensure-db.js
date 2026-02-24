/**
 * MCMS Database Assurance Script
 * Ensures PostgreSQL is running before starting the application.
 * Uses PowerShell to check and start the service if needed.
 */

const { execSync } = require('child_process');

async function ensurePostgres() {
  console.log('[DB-CHECK] Verifying PostgreSQL service status...');

  try {
    // 1. Check if the service is running
    // Note: User's service name was identified as 'postgresql-x64-18'
    const serviceName = 'postgresql-x64-18';
    
    const statusCmd = `powershell "Get-Service ${serviceName} | Select-Object -ExpandProperty Status"`;
    const status = execSync(statusCmd).toString().trim();

    console.log(`[DB-CHECK] Service ${serviceName} status: ${status}`);

    if (status !== 'Running') {
      console.log(`[DB-CHECK] Attempting to start service ${serviceName}...`);
      
      // Attempt to start the service. This usually requires elevation.
      // If it fails, we warn the user but let the app try to start anyway.
      try {
        execSync(`powershell "Start-Service ${serviceName}"`);
        console.log(`[DB-CHECK] Service ${serviceName} started successfully.`);
      } catch (startErr) {
        console.warn(`[DB-CHECK] [WARNING] Failed to start service automatically.`);
        console.warn(`[DB-CHECK] [REASON] ${startErr.message}`);
        console.warn(`[DB-CHECK] Please start the service manually: 'net start ${serviceName}' in Admin CMD.`);
      }
    } else {
      console.log('[DB-CHECK] PostgreSQL is already running.');
    }
  } catch (err) {
    console.error(`[DB-CHECK] [ERROR] Could not query service status: ${err.message}`);
    console.log('[DB-CHECK] Proceeding with application startup regardless...');
  }
}

// Execute
ensurePostgres();
