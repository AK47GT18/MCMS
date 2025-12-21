<?php
/**
 * Security Configuration
 * 
 * @file security.php
 * @description Security settings and policies for Mkaka CMS
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

// Prevent direct access
defined('APP_ROOT') or die('Direct access not permitted');

return [
    /*
    |--------------------------------------------------------------------------
    | Password Hashing
    |--------------------------------------------------------------------------
    |
    | Password hashing algorithm and cost factor
    | Uses bcrypt (as per SRS requirement NFR-05)
    |
    */
    'password' => [
        'algorithm' => PASSWORD_BCRYPT,
        'cost' => 12, // Higher than SRS minimum of 10 for better security
        'requirements' => [
            'min_length' => 8,
            'require_uppercase' => true,
            'require_lowercase' => true,
            'require_numbers' => true,
            'require_special_chars' => true,
            'prevent_common_passwords' => true,
            'prevent_sequential' => true,
        ],
        'expiry_days' => 90,
        'prevent_reuse_count' => 5, // Can't reuse last 5 passwords
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | User authentication settings
    |
    */
    'authentication' => [
        'max_login_attempts' => 5,
        'lockout_duration' => 30, // minutes (as per SRS FR-17)
        'lockout_window' => 15, // minutes window for counting attempts
        'session_lifetime' => 120, // minutes
        'remember_me_duration' => 2592000, // 30 days in seconds
        'force_logout_on_password_change' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Role-Based Access Control (RBAC)
    |--------------------------------------------------------------------------
    |
    | User roles as defined in SRS (FR-02)
    |
    */
    'roles' => [
        'superadmin' => [
            'id' => 1,
            'name' => 'Super Administrator',
            'permissions' => ['*'], // All permissions
        ],
        'admin' => [
            'id' => 2,
            'name' => 'Administrator',
            'permissions' => ['users.*', 'settings.*', 'reports.*'],
        ],
        'managing_director' => [
            'id' => 3,
            'name' => 'Managing Director',
            'permissions' => ['view.*', 'reports.*', 'audit.*'],
        ],
        'operations_manager' => [
            'id' => 4,
            'name' => 'Operations Manager',
            'permissions' => ['view.*', 'reports.*', 'approve.*'],
        ],
        'project_manager' => [
            'id' => 5,
            'name' => 'Project Manager',
            'permissions' => ['projects.*', 'tasks.*', 'reports.view'],
        ],
        'finance_officer' => [
            'id' => 6,
            'name' => 'Finance Officer',
            'permissions' => ['transactions.*', 'budgets.*', 'approvals.submit'],
        ],
        'contract_administrator' => [
            'id' => 7,
            'name' => 'Contract Administrator',
            'permissions' => ['contracts.*', 'documents.*', 'milestones.*'],
        ],
        'equipment_coordinator' => [
            'id' => 8,
            'name' => 'Equipment Coordinator',
            'permissions' => ['equipment.*', 'maintenance.*', 'checkin.*'],
        ],
        'field_supervisor' => [
            'id' => 9,
            'name' => 'Field Supervisor',
            'permissions' => ['reports.create', 'reports.view', 'photos.upload'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | CSRF Protection
    |--------------------------------------------------------------------------
    |
    | Cross-Site Request Forgery protection settings
    |
    */
    'csrf' => [
        'enabled' => true,
        'token_name' => '_csrf_token',
        'token_length' => 32,
        'token_regenerate' => true, // Regenerate after each request
        'exclude_routes' => [
            'api/v1/*', // API uses different authentication
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SQL Injection Prevention
    |--------------------------------------------------------------------------
    |
    | Database security settings (as per SRS NFR-10)
    |
    */
    'database_security' => [
        'use_prepared_statements' => true, // MANDATORY
        'escape_output' => true,
        'validate_input' => true,
        'log_suspicious_queries' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | XSS Protection
    |--------------------------------------------------------------------------
    |
    | Cross-Site Scripting prevention
    |
    */
    'xss' => [
        'filter_input' => true,
        'escape_output' => true,
        'allowed_html_tags' => '<b><i><u><strong><em><p><br><ul><ol><li>',
        'strip_dangerous_tags' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTPS/SSL Configuration
    |--------------------------------------------------------------------------
    |
    | Force HTTPS for all communications (SRS requirement)
    |
    */
    'https' => [
        'force_https' => getenv('FORCE_HTTPS') === 'true',
        'hsts_enabled' => true,
        'hsts_max_age' => 31536000, // 1 year
        'hsts_include_subdomains' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Headers
    |--------------------------------------------------------------------------
    |
    | HTTP security headers to be sent with every response
    |
    */
    'headers' => [
        'X-Frame-Options' => 'SAMEORIGIN',
        'X-Content-Type-Options' => 'nosniff',
        'X-XSS-Protection' => '1; mode=block',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Content-Security-Policy' => "default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com cdnjs.cloudflare.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:;",
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Security
    |--------------------------------------------------------------------------
    |
    | Security settings for file uploads
    |
    */
    'file_upload' => [
        'max_size' => 10485760, // 10MB (as per SRS)
        'allowed_types' => [
            'image' => ['jpg', 'jpeg', 'png', 'gif'],
            'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
        ],
        'scan_for_viruses' => false, // Requires ClamAV - set true if available
        'validate_mime_type' => true,
        'prevent_php_upload' => true, // CRITICAL: Never allow PHP file uploads
        'sanitize_filename' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Audit Trail Configuration
    |--------------------------------------------------------------------------
    |
    | Audit logging settings (as per SRS FR-05, FR-16, FR-25, NFR-04)
    |
    */
    'audit' => [
        'enabled' => true,
        'log_logins' => true,
        'log_transactions' => true,
        'log_modifications' => true,
        'log_deletions' => true,
        'retention_days' => 730, // 2 years (SRS requirement NFR-04)
        'immutable' => true, // Cannot be modified or deleted (FR-25)
        'log_ip_address' => true,
        'log_user_agent' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Session Security
    |--------------------------------------------------------------------------
    |
    | Secure session handling
    |
    */
    'session' => [
        'secure' => true, // Only transmit over HTTPS
        'httponly' => true, // Not accessible via JavaScript
        'samesite' => 'Strict',
        'regenerate_id' => true, // Regenerate after login
        'name' => 'MKAKA_SESSION',
        'lifetime' => 7200, // 2 hours in seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | IP Whitelist/Blacklist
    |--------------------------------------------------------------------------
    |
    | IP-based access control
    |
    */
    'ip_control' => [
        'enabled' => false,
        'whitelist' => [
            // '192.168.1.100',
        ],
        'blacklist' => [
            // '10.0.0.1',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Prevent brute force and DoS attacks
    |
    */
    'rate_limiting' => [
        'enabled' => true,
        'login_attempts' => [
            'max_attempts' => 5,
            'window' => 900, // 15 minutes
        ],
        'api_requests' => [
            'max_requests' => 100,
            'window' => 3600, // 1 hour
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | GPS Validation Security
    |--------------------------------------------------------------------------
    |
    | GPS coordinate validation for geotagged reports (as per SRS FR-14)
    |
    */
    'gps_validation' => [
        'enabled' => getenv('GPS_VALIDATION_ENABLED') === 'true',
        'malawi_bounds' => [
            'min_lat' => -17.125,
            'max_lat' => -9.367,
            'min_lng' => 32.674,
            'max_lng' => 35.924,
        ],
        'require_photo_exif' => true,
        'validate_timestamp' => true,
        'max_location_age' => 3600, // seconds (1 hour)
    ],

    /*
    |--------------------------------------------------------------------------
    | Backup Encryption
    |--------------------------------------------------------------------------
    |
    | Encrypt database backups
    |
    */
    'backup_encryption' => [
        'enabled' => true,
        'algorithm' => 'AES-256-CBC',
        'key' => getenv('BACKUP_ENCRYPTION_KEY'),
    ],
];
