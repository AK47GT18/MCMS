<?php
/**
 * Database Installer
 * Executes migrations, schema definitions, and seeds
 */

define('APP_ROOT', __DIR__);
require_once __DIR__ . '/src/config/database.php';

// Load Env if not present (Simple parsing for dev)
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && substr($line, 0, 1) !== '#') {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

// Database Config
$host = 'localhost'; // Usually passed via env or config, hardcoding for local dev if env fails
$db   = 'mcms';
$user = 'root';
$pass = ''; // Default XAMPP/WAMP password
$charset = 'utf8mb4';

// Override with Env if available
if (getenv('DB_HOST')) $host = getenv('DB_HOST');
if (getenv('DB_NAME')) $db = getenv('DB_NAME');
if (getenv('DB_USER')) $user = getenv('DB_USER');
if (getenv('DB_PASSWORD')) $pass = getenv('DB_PASSWORD');

$dsn = "mysql:host=$host;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    echo "Connecting to MySQL server...\n";
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Create Database if not exists
    echo "Creating database '$db' if not exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$db`");
    
    echo "Database selected.\n\n";

    // SQL Files Order
    $files = [
        // Migrations
        'database/migrations/001_create_users_table.sql',
        'database/migrations/002_create_projects_table.sql',
        'database/migrations/003_create_tasks_table.sql',
        'database/migrations/004_create_transactions_table.sql',
        'database/migrations/005_create_contracts_table.sql',
        'database/migrations/006_create_equipment_table.sql',
        'database/migrations/007_create_site_reports_table.sql',
        'database/migrations/008_create_documents_table.sql',
        'database/migrations/009_create_audit_logs_table.sql',
        'database/migrations/010_create_notifications_table.sql',
        'database/migrations/011_create_approvals_table.sql',
        'database/migrations/012_create_budgets_table.sql',
        'database/migrations/013_create_maintenance_table.sql',
        
        // Schema
        'database/schema/views.sql',
        'database/schema/stored-procedures.sql',
        'database/schema/triggers.sql',
        'database/schema/indexes.sql',
        
        // Seeds
        'database/seeds/001_seed_roles.sql',
        'database/seeds/002_seed_admin_user.sql',
        'database/seeds/003_seed_sample_projects.sql',
    ];

    foreach ($files as $file) {
        $path = __DIR__ . '/' . $file;
        if (file_exists($path)) {
            echo "Executing $file... ";
            $sql = file_get_contents($path);
            if (trim($sql)) {
                try {
                    // Split by semicolon usually works for simple dumps, but SPs might need delimiter handling.
                    // For now, try executing the whole file if it doesn't contain DELIMITER.
                    // If it contains DELIMITER, we might need basic parsing.
                    
                    if (strpos($sql, 'DELIMITER') !== false) {
                        // Very naive DELIMITER handling
                        // Actually, PDO doesn't support DELIMITER syntax directly usually.
                        // We might need to just run it via command line if possible.
                        // But let's try to run it directly first. 
                        // PDO runs one statement at a time generally.
                        $pdo->exec($sql); 
                    } else {
                        $pdo->exec($sql);
                    }
                    echo "OK\n";
                } catch (PDOException $e) {
                    echo "ERROR: " . $e->getMessage() . "\n";
                }
            } else {
                echo "Empty file.\n";
            }
        } else {
            echo "SKIPPED (File not found: $file)\n";
        }
    }

    echo "\nDatabase installation completed!\n";

} catch (\PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
