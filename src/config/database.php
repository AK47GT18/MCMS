<?php
/**
 * Database Configuration
 * 
 * @file database.php
 * @description Database connection configuration for Mkaka Construction Management System
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

// Prevent direct access
defined('APP_ROOT') or die('Direct access not permitted');

return [
    /*
    |--------------------------------------------------------------------------
    | Default Database Connection
    |--------------------------------------------------------------------------
    |
    | This is the connection that will be used by default for database operations
    |
    */
    'default' => getenv('DB_CONNECTION') ?: 'mysql',

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Database connection settings for different environments
    |
    */
    'connections' => [
        'mysql' => [
            'driver'    => 'mysql',
            'host'      => getenv('DB_HOST') ?: 'localhost',
            'port'      => getenv('DB_PORT') ?: '3306',
            'database'  => getenv('DB_NAME') ?: 'mcms',
            'username'  => getenv('DB_USER') ?: 'root',
            'password'  => getenv('DB_PASS') ?: '',
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix'    => '',
            'strict'    => true,
            'engine'    => 'InnoDB',
            'options'   => [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_PERSISTENT         => false,
            ],
        ],

        'testing' => [
            'driver'    => 'mysql',
            'host'      => 'localhost',
            'port'      => '3306',
            'database'  => 'mcms_test',
            'username'  => 'root',
            'password'  => '',
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix'    => '',
            'strict'    => true,
            'engine'    => 'InnoDB',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all migrations that have been run
    |
    */
    'migrations' => 'migrations',

    /*
    |--------------------------------------------------------------------------
    | Connection Pool Settings
    |--------------------------------------------------------------------------
    |
    | Settings for database connection pooling
    |
    */
    'pool' => [
        'min_connections' => 2,
        'max_connections' => 10,
        'idle_timeout'    => 300, // seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Query Logging
    |--------------------------------------------------------------------------
    |
    | Enable query logging for debugging (disable in production)
    |
    */
    'log_queries' => getenv('DB_LOG_QUERIES') === 'true',
    'slow_query_threshold' => 1000, // milliseconds

    /*
    |--------------------------------------------------------------------------
    | Backup Settings
    |--------------------------------------------------------------------------
    |
    | Automated backup configuration
    |
    */
    'backup' => [
        'enabled'   => true,
        'path'      => dirname(__DIR__, 2) . '/storage/backups/database',
        'schedule'  => 'daily', // daily, weekly, monthly
        'retention' => 30, // days
        'compress'  => true,
    ],
];
