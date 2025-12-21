<?php
/**
 * Email Configuration
 * 
 * @file email.php
 * @description Email and notification settings for Mkaka CMS
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

// Prevent direct access
defined('APP_ROOT') or die('Direct access not permitted');

return [
    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | SMTP configuration for sending emails (as per SRS IR-01)
    |
    */
    'default' => getenv('MAIL_MAILER') ?: 'smtp',

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    |
    | Email service configurations
    |
    */
    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'host' => getenv('MAIL_HOST') ?: 'smtp.example.com',
            'port' => getenv('MAIL_PORT') ?: 587,
            'encryption' => getenv('MAIL_ENCRYPTION') ?: 'tls', // tls or ssl
            'username' => getenv('MAIL_USER') ?: '',
            'password' => getenv('MAIL_PASS') ?: '',
            'timeout' => 30,
            'auth_mode' => null,
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => '/usr/sbin/sendmail -bs',
        ],

        'log' => [
            'transport' => 'log',
            'channel' => 'email',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    |
    | Default sender information
    |
    */
    'from' => [
        'address' => getenv('MAIL_FROM') ?: 'noreply@mkakaconstruction.com',
        'name' => getenv('MAIL_FROM_NAME') ?: 'Mkaka Construction',
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    |
    | When to send email notifications (as per SRS FR-23)
    |
    */
    'notifications' => [
        // Transaction approval notifications (FR-23)
        'transaction_approval' => [
            'enabled' => true,
            'send_within' => 60, // minutes (SRS: within 1 hour)
            'recipients' => 'approvers',
            'template' => 'emails/approval-request',
        ],

        // Budget alerts (FR-07)
        'budget_alerts' => [
            'enabled' => true,
            'thresholds' => [80, 90, 100], // percentage
            'recipients' => ['project_manager', 'finance_officer', 'operations_manager'],
            'template' => 'emails/budget-alert',
        ],

        // Contract deadline reminders (FR-10)
        'contract_deadlines' => [
            'enabled' => true,
            'advance_notice' => [7, 1], // days before deadline
            'recipients' => ['contract_administrator', 'project_manager'],
            'template' => 'emails/deadline-reminder',
        ],

        // Approval status updates
        'approval_updates' => [
            'approved' => [
                'enabled' => true,
                'template' => 'emails/approval-approved',
            ],
            'rejected' => [
                'enabled' => true,
                'template' => 'emails/approval-rejected',
            ],
        ],

        // User account notifications
        'user_account' => [
            'welcome' => [
                'enabled' => true,
                'template' => 'emails/welcome',
            ],
            'password_reset' => [
                'enabled' => true,
                'template' => 'emails/password-reset',
                'expiry' => 60, // minutes
            ],
            'password_changed' => [
                'enabled' => true,
                'template' => 'emails/password-changed',
            ],
        ],

        // System alerts
        'system_alerts' => [
            'maintenance_mode' => true,
            'backup_failure' => true,
            'security_breach' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Email Queue
    |--------------------------------------------------------------------------
    |
    | Queue emails for background sending (better performance)
    |
    */
    'queue' => [
        'enabled' => true,
        'connection' => 'database',
        'queue' => 'emails',
        'retry_after' => 90, // seconds
        'max_retries' => 3,
    ],

    /*
    |--------------------------------------------------------------------------
    | Email Templates
    |--------------------------------------------------------------------------
    |
    | Template configuration
    |
    */
    'templates' => [
        'path' => dirname(__DIR__, 2) . '/views/emails',
        'cache' => true,
        'default_layout' => 'layouts/email',
    ],

    /*
    |--------------------------------------------------------------------------
    | PHPMailer Configuration
    |--------------------------------------------------------------------------
    |
    | PHPMailer library settings (as per SRS)
    |
    */
    'phpmailer' => [
        'debug' => 0, // 0 = off, 1 = client, 2 = server
        'charset' => 'UTF-8',
        'word_wrap' => 50,
        'is_html' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Prevent email spam/abuse
    |
    */
    'rate_limit' => [
        'enabled' => true,
        'max_per_hour' => 100,
        'max_per_day' => 500,
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    |
    | Log all email sending attempts (as per IR-01)
    |
    */
    'logging' => [
        'enabled' => true,
        'log_success' => true,
        'log_failure' => true,
        'path' => dirname(__DIR__, 2) . '/logs/email',
    ],

    /*
    |--------------------------------------------------------------------------
    | Test Mode
    |--------------------------------------------------------------------------
    |
    | Redirect all emails to test address
    |
    */
    'test_mode' => [
        'enabled' => getenv('MAIL_TEST_MODE') === 'true',
        'redirect_to' => getenv('MAIL_TEST_ADDRESS') ?: 'test@example.com',
    ],
];
