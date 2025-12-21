<?php
/**
 * Application Configuration
 * 
 * @file app.php
 * @description Core application settings for Mkaka Construction Management System
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

// Prevent direct access
defined('APP_ROOT') or die('Direct access not permitted');

return [
    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application displayed throughout the UI
    |
    */
    'name' => getenv('APP_NAME') ?: 'Mkaka Construction Management System',
    'short_name' => 'Mkaka CMS',
    'description' => 'Comprehensive construction project management platform',

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This determines the application environment
    | Options: development, staging, production
    |
    */
    'env' => getenv('APP_ENV') ?: 'production',

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When enabled, detailed error messages with stack traces will be shown
    | WARNING: NEVER enable this in production!
    |
    */
    'debug' => getenv('APP_DEBUG') === 'true',

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | The root URL for the application
    |
    */
    'url' => getenv('APP_URL') ?: 'http://localhost',
    'asset_url' => getenv('ASSET_URL') ?: null,

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Default timezone for the application (Malawi uses CAT - Central Africa Time)
    |
    */
    'timezone' => 'Africa/Blantyre',

    /*
    |--------------------------------------------------------------------------
    | Application Locale
    |--------------------------------------------------------------------------
    |
    | Default locale and available locales
    |
    */
    'locale' => 'en',
    'fallback_locale' => 'en',
    'available_locales' => ['en'],

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | 32-character random string for encryption/decryption
    | Generate with: openssl rand -base64 32
    |
    */
    'key' => getenv('APP_KEY') ?: 'base64:your_32_character_key_here',
    'cipher' => 'AES-256-CBC',

    /*
    |--------------------------------------------------------------------------
    | Application Version
    |--------------------------------------------------------------------------
    |
    | Current version of the application
    |
    */
    'version' => '1.0.0',
    'release_date' => '2026-05-01',

    /*
    |--------------------------------------------------------------------------
    | Maintenance Mode
    |--------------------------------------------------------------------------
    |
    | Enable maintenance mode to display "under maintenance" page
    |
    */
    'maintenance' => [
        'enabled' => false,
        'message' => 'System is currently under maintenance. Please check back soon.',
        'retry_after' => 3600, // seconds
        'allowed_ips' => [], // IPs that can access during maintenance
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    |
    | Application logging settings
    |
    */
    'logging' => [
        'enabled' => true,
        'level' => getenv('LOG_LEVEL') ?: 'error', // debug, info, warning, error, critical
        'path' => dirname(__DIR__, 2) . '/logs',
        'max_files' => 30,
        'channels' => [
            'application' => true,
            'security' => true,
            'audit' => true,
            'error' => true,
            'ajax' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Company Information
    |--------------------------------------------------------------------------
    |
    | Information about Mkaka Construction Company Limited
    |
    */
    'company' => [
        'name' => 'Mkaka Construction Company Limited',
        'established' => '1993',
        'incorporated' => '2000',
        'registration_number' => 'MCA-2000-XXX',
        'address' => [
            'street' => 'Industrial Area',
            'city' => 'Lilongwe',
            'country' => 'Malawi',
            'postal_code' => '',
        ],
        'contact' => [
            'phone' => '+265 xxx xxx xxx',
            'email' => 'info@mkakaconstruction.com',
            'website' => 'https://mkakaconstruction.com',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | System Limits
    |--------------------------------------------------------------------------
    |
    | Various system limits and constraints
    |
    */
    'limits' => [
        'max_projects' => null, // null = unlimited
        'max_users' => 100,
        'max_file_uploads_per_request' => 10,
        'session_lifetime' => 120, // minutes
        'password_expiry_days' => 90,
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable/disable specific features
    |
    */
    'features' => [
        'project_management' => true,
        'financial_management' => true,
        'contract_management' => true,
        'equipment_tracking' => true,
        'site_reports' => true,
        'gps_validation' => true,
        'email_notifications' => true,
        'mobile_app' => false, // Future feature
        'api_access' => true,
        'two_factor_auth' => false, // Future feature
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Application caching settings
    |
    */
    'cache' => [
        'enabled' => true,
        'driver' => 'file', // file, redis, memcached
        'path' => dirname(__DIR__, 2) . '/storage/cache',
        'ttl' => 3600, // seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Paths
    |--------------------------------------------------------------------------
    |
    | Important application paths
    |
    */
    'paths' => [
        'root' => dirname(__DIR__, 2),
        'app' => dirname(__DIR__),
        'public' => dirname(__DIR__, 2) . '/public',
        'storage' => dirname(__DIR__, 2) . '/storage',
        'views' => dirname(__DIR__, 2) . '/views',
        'logs' => dirname(__DIR__, 2) . '/logs',
        'uploads' => dirname(__DIR__, 2) . '/public/uploads',
    ],
];
