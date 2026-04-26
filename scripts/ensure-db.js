/**
 * MCMS Database Assurance Script
 * Ensures PostgreSQL is running before starting the application.
 * Uses PowerShell to check and start the service with elevation support.
 */

const { execSync } = require('child_process');

/**
 * Finds the PostgreSQL service name dynamically
 */
function getPostgresService() {
  try {
    const cmd = `powershell "Get-Service *postgres* | Select-Object -First 1 -ExpandProperty Name"`;
    const result = execSync(cmd).toString().trim();
    return result || null;
  } catch (e) {
    return null;
  }
}

async function ensurePostgres() {
  console.log('[DB-CHECK] Verifying PostgreSQL service status...');

  // Detect service or fallback to common name
  const serviceName = getPostgresService() || 'postgresql-x64-18';
  
  try {
    const statusCmd = `powershell "Get-Service ${serviceName} | Select-Object -ExpandProperty Status"`;
    let status = 'Unknown';
    
    try {
      status = execSync(statusCmd).toString().trim();
    } catch (e) {
      console.warn(`[DB-CHECK] Could not find service: ${serviceName}`);
      return;
    }

    console.log(`[DB-CHECK] Service ${serviceName} status: ${status}`);

    if (status !== 'Running') {
      console.log(`[DB-CHECK] Attempting to start service ${serviceName}...`);
      
      try {
        // 1. Try standard start (works if already admin)
        execSync(`powershell "Start-Service ${serviceName}"`, { stdio: 'pipe' });
        console.log(`[DB-CHECK] Service ${serviceName} started successfully.`);
      } catch (startErr) {
        // 2. Try elevated start if standard fails
        console.log(`[DB-CHECK] Standard start failed (Permissions). Requesting elevation...`);
        
        try {
          // Trigger UAC prompt for 'net start'
          const elevateCmd = `powershell "Start-Process cmd -ArgumentList '/c net start ${serviceName}' -Verb RunAs -Wait"`;
          execSync(elevateCmd);
          
          // Verify if it actually started
          const newStatus = execSync(statusCmd).toString().trim();
          if (newStatus === 'Running') {
            console.log(`[DB-CHECK] Service ${serviceName} started successfully via elevated process.`);
          } else {
            throw new Error(`Service state is still '${newStatus}'`);
          }
        } catch (elevateErr) {
          console.warn(`[DB-CHECK] [WARNING] Failed to start service automatically.`);
          console.warn(`[DB-CHECK] [TIP] Run your terminal as Administrator to avoid this prompt.`);
          console.warn(`[DB-CHECK] Manual command: net start ${serviceName}`);
        }
      }
    } else {
      console.log('[DB-CHECK] PostgreSQL is already running.');
    }
  } catch (err) {
    console.error(`[DB-CHECK] [ERROR] Unexpected error during DB check: ${err.message}`);
  }
}

// Execute
ensurePostgres();

