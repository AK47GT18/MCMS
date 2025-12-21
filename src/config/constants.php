<?php
/**
 * Application Constants
 * 
 * @file constants.php
 * @description Global constants for Mkaka Construction Management System
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

// Prevent direct access
defined('APP_ROOT') or die('Direct access not permitted');

/*
|--------------------------------------------------------------------------
| Application Root
|--------------------------------------------------------------------------
*/
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

/*
|--------------------------------------------------------------------------
| Path Constants
|--------------------------------------------------------------------------
*/
define('SRC_PATH', APP_ROOT . '/src');
define('PUBLIC_PATH', APP_ROOT . '/public');
define('STORAGE_PATH', APP_ROOT . '/storage');
define('VIEWS_PATH', APP_ROOT . '/views');
define('LOGS_PATH', APP_ROOT . '/logs');
define('UPLOAD_PATH', PUBLIC_PATH . '/uploads');
define('CACHE_PATH', STORAGE_PATH . '/cache');
define('BACKUP_PATH', STORAGE_PATH . '/backups');

/*
|--------------------------------------------------------------------------
| URL Constants
|--------------------------------------------------------------------------
*/
define('BASE_URL', getenv('APP_URL') ?: 'http://localhost');
define('ASSETS_URL', BASE_URL . '/assets');
define('UPLOAD_URL', BASE_URL . '/uploads');
define('API_URL', BASE_URL . '/api/v1');

/*
|--------------------------------------------------------------------------
| Database Constants
|--------------------------------------------------------------------------
*/
define('DB_NAME', 'mcms');
define('DB_PREFIX', '');

/*
|--------------------------------------------------------------------------
| User Role Constants (as per SRS)
|--------------------------------------------------------------------------
*/
define('ROLE_SUPERADMIN', 1);
define('ROLE_ADMIN', 2);
define('ROLE_MANAGING_DIRECTOR', 3);
define('ROLE_OPERATIONS_MANAGER', 4);
define('ROLE_PROJECT_MANAGER', 5);
define('ROLE_FINANCE_OFFICER', 6);
define('ROLE_CONTRACT_ADMIN', 7);
define('ROLE_EQUIPMENT_COORDINATOR', 8);
define('ROLE_FIELD_SUPERVISOR', 9);

/*
|--------------------------------------------------------------------------
| Permission Constants
|--------------------------------------------------------------------------
*/
define('PERM_VIEW', 'view');
define('PERM_CREATE', 'create');
define('PERM_EDIT', 'edit');
define('PERM_DELETE', 'delete');
define('PERM_APPROVE', 'approve');
define('PERM_EXPORT', 'export');

/*
|--------------------------------------------------------------------------
| Project Status Constants
|--------------------------------------------------------------------------
*/
define('PROJECT_STATUS_PLANNING', 'planning');
define('PROJECT_STATUS_ACTIVE', 'active');
define('PROJECT_STATUS_ON_HOLD', 'on_hold');
define('PROJECT_STATUS_COMPLETED', 'completed');
define('PROJECT_STATUS_CANCELLED', 'cancelled');

/*
|--------------------------------------------------------------------------
| Transaction Status Constants (as per SRS FR-06)
|--------------------------------------------------------------------------
*/
define('TRANSACTION_STATUS_DRAFT', 'draft');
define('TRANSACTION_STATUS_PENDING', 'pending_approval');
define('TRANSACTION_STATUS_APPROVED', 'approved');
define('TRANSACTION_STATUS_REJECTED', 'rejected');
define('TRANSACTION_STATUS_PAID', 'paid');

/*
|--------------------------------------------------------------------------
| Contract Status Constants
|--------------------------------------------------------------------------
*/
define('CONTRACT_STATUS_DRAFT', 'draft');
define('CONTRACT_STATUS_PENDING_REVIEW', 'pending_review');
define('CONTRACT_STATUS_APPROVED', 'approved');
define('CONTRACT_STATUS_ACTIVE', 'active');
define('CONTRACT_STATUS_COMPLETED', 'completed');
define('CONTRACT_STATUS_TERMINATED', 'terminated');

/*
|--------------------------------------------------------------------------
| Equipment Status Constants
|--------------------------------------------------------------------------
*/
define('EQUIPMENT_STATUS_AVAILABLE', 'available');
define('EQUIPMENT_STATUS_IN_USE', 'in_use');
define('EQUIPMENT_STATUS_MAINTENANCE', 'maintenance');
define('EQUIPMENT_STATUS_RETIRED', 'retired');
define('EQUIPMENT_STATUS_DAMAGED', 'damaged');

/*
|--------------------------------------------------------------------------
| Site Report Status Constants
|--------------------------------------------------------------------------
*/
define('REPORT_STATUS_DRAFT', 'draft');
define('REPORT_STATUS_SUBMITTED', 'submitted');
define('REPORT_STATUS_APPROVED', 'approved');
define('REPORT_STATUS_REJECTED', 'rejected');

/*
|--------------------------------------------------------------------------
| File Upload Constants (as per SRS)
|--------------------------------------------------------------------------
*/
define('MAX_FILE_SIZE', 10485760); // 10MB
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif']);
define('ALLOWED_DOC_TYPES', ['pdf', 'doc', 'docx', 'xls', 'xlsx']);
define('ALLOWED_FILE_TYPES', array_merge(ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES));

/*
|--------------------------------------------------------------------------
| GPS Validation Constants (as per SRS FR-14)
|--------------------------------------------------------------------------
*/
define('MALAWI_MIN_LAT', -17.125);
define('MALAWI_MAX_LAT', -9.367);
define('MALAWI_MIN_LNG', 32.674);
define('MALAWI_MAX_LNG', 35.924);

/*
|--------------------------------------------------------------------------
| Budget Alert Thresholds (as per SRS FR-07)
|--------------------------------------------------------------------------
*/
define('BUDGET_ALERT_THRESHOLD_1', 80); // 80%
define('BUDGET_ALERT_THRESHOLD_2', 90); // 90%
define('BUDGET_ALERT_THRESHOLD_3', 100); // 100%

/*
|--------------------------------------------------------------------------
| Session Constants
|--------------------------------------------------------------------------
*/
define('SESSION_LIFETIME', 7200); // 2 hours in seconds
define('SESSION_NAME', 'MKAKA_SESSION');

/*
|--------------------------------------------------------------------------
| Password Constants (as per SRS FR-18)
|--------------------------------------------------------------------------
*/
define('PASSWORD_MIN_LENGTH', 8);
define('PASSWORD_REQUIRE_UPPERCASE', true);
define('PASSWORD_REQUIRE_LOWERCASE', true);
define('PASSWORD_REQUIRE_NUMBER', true);
define('PASSWORD_REQUIRE_SPECIAL', true);

/*
|--------------------------------------------------------------------------
| Login Security Constants (as per SRS FR-17)
|--------------------------------------------------------------------------
*/
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_DURATION', 1800); // 30 minutes in seconds
define('LOCKOUT_WINDOW', 900); // 15 minutes in seconds

/*
|--------------------------------------------------------------------------
| Pagination Constants
|--------------------------------------------------------------------------
*/
define('ITEMS_PER_PAGE', 25);
define('MAX_ITEMS_PER_PAGE', 100);

/*
|--------------------------------------------------------------------------
| Date/Time Format Constants
|--------------------------------------------------------------------------
*/
define('DATE_FORMAT', 'Y-m-d');
define('TIME_FORMAT', 'H:i:s');
define('DATETIME_FORMAT', 'Y-m-d H:i:s');
define('DISPLAY_DATE_FORMAT', 'd/m/Y');
define('DISPLAY_DATETIME_FORMAT', 'd/m/Y H:i');

/*
|--------------------------------------------------------------------------
| Currency Constants (Malawi Kwacha)
|--------------------------------------------------------------------------
*/
define('CURRENCY_CODE', 'MWK');
define('CURRENCY_SYMBOL', 'MK');
define('CURRENCY_DECIMALS', 2);

/*
|--------------------------------------------------------------------------
| Notification Constants (as per SRS FR-23)
|--------------------------------------------------------------------------
*/
define('NOTIFICATION_APPROVAL_TIMEOUT', 60); // minutes
define('CONTRACT_DEADLINE_NOTICE_DAYS', [7, 1]); // days before deadline

/*
|--------------------------------------------------------------------------
| Audit Trail Constants (as per SRS NFR-04)
|--------------------------------------------------------------------------
*/
define('AUDIT_RETENTION_DAYS', 730); // 2 years
define('AUDIT_LOG_IMMUTABLE', true);

/*
|--------------------------------------------------------------------------
| Performance Constants (as per SRS NFR-01, NFR-02, NFR-03)
|--------------------------------------------------------------------------
*/
define('DASHBOARD_LOAD_TIME_MAX', 40); // seconds
define('QUERY_TIMEOUT_MAX', 40); // seconds
define('REPORT_GENERATION_MAX', 40); // seconds

/*
|--------------------------------------------------------------------------
| API Version
|--------------------------------------------------------------------------
*/
define('API_VERSION', 'v1');
define('API_PREFIX', 'api/' . API_VERSION);

/*
|--------------------------------------------------------------------------
| HTTP Status Codes
|--------------------------------------------------------------------------
*/
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_NO_CONTENT', 204);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_FORBIDDEN', 403);
define('HTTP_NOT_FOUND', 404);
define('HTTP_METHOD_NOT_ALLOWED', 405);
define('HTTP_UNPROCESSABLE_ENTITY', 422);
define('HTTP_INTERNAL_SERVER_ERROR', 500);
define('HTTP_SERVICE_UNAVAILABLE', 503);

/*
|--------------------------------------------------------------------------
| Error Levels
|--------------------------------------------------------------------------
*/
define('ERROR_LEVEL_DEBUG', 'debug');
define('ERROR_LEVEL_INFO', 'info');
define('ERROR_LEVEL_WARNING', 'warning');
define('ERROR_LEVEL_ERROR', 'error');
define('ERROR_LEVEL_CRITICAL', 'critical');

/*
|--------------------------------------------------------------------------
| Cache Keys
|--------------------------------------------------------------------------
*/
define('CACHE_KEY_PREFIX', 'mkaka_');
define('CACHE_KEY_USER_SESSION', CACHE_KEY_PREFIX . 'user_session_');
define('CACHE_KEY_PROJECT_LIST', CACHE_KEY_PREFIX . 'projects_');
define('CACHE_KEY_DASHBOARD', CACHE_KEY_PREFIX . 'dashboard_');

/*
|--------------------------------------------------------------------------
| Queue Names
|--------------------------------------------------------------------------
*/
define('QUEUE_DEFAULT', 'default');
define('QUEUE_EMAILS', 'emails');
define('QUEUE_NOTIFICATIONS', 'notifications');
define('QUEUE_REPORTS', 'reports');
define('QUEUE_BACKUPS', 'backups');

/*
|--------------------------------------------------------------------------
| System Modules (as per SRS structure)
|--------------------------------------------------------------------------
*/
define('MODULE_DASHBOARD', 'dashboard');
define('MODULE_PROJECTS', 'projects');
define('MODULE_FINANCE', 'finance');
define('MODULE_CONTRACTS', 'contracts');
define('MODULE_EQUIPMENT', 'equipment');
define('MODULE_REPORTS', 'reports');
define('MODULE_USERS', 'users');
define('MODULE_SETTINGS', 'settings');

/*
|--------------------------------------------------------------------------
| File Type MIME Mappings
|--------------------------------------------------------------------------
*/
define('MIME_TYPES', [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'pdf'  => 'application/pdf',
    'doc'  => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls'  => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/*
|--------------------------------------------------------------------------
| Company Information
|--------------------------------------------------------------------------
*/
define('COMPANY_NAME', 'Mkaka Construction Company Limited');
define('COMPANY_SHORT_NAME', 'Mkaka Construction');
define('COMPANY_ESTABLISHED', '1993');
define('COMPANY_INCORPORATED', '2000');

/*
|--------------------------------------------------------------------------
| Development Information
|--------------------------------------------------------------------------
*/
define('DEVELOPER_NAME', 'Anthony Kanjira');
define('DEVELOPER_ID', 'CEN/01/01/22');
define('SUPERVISOR_NAME', 'Mr. John Kaira');
define('UNIVERSITY', 'University of Livingstonia');
define('DEPARTMENT', 'Computer Engineering Department');
define('PROJECT_TITLE', 'Mkaka Construction Management System');

/*
|--------------------------------------------------------------------------
| Version Information
|--------------------------------------------------------------------------
*/
define('VERSION', '1.0.0');
define('VERSION_NAME', 'Foundation');
define('RELEASE_DATE', '2026-05-01');
define('BUILD_NUMBER', '20260501');

/*
|--------------------------------------------------------------------------
| Feature Flags
|--------------------------------------------------------------------------
*/
define('FEATURE_PWA', true);
define('FEATURE_OFFLINE_MODE', true);
define('FEATURE_GPS_VALIDATION', true);
define('FEATURE_EMAIL_NOTIFICATIONS', true);
define('FEATURE_TWO_FACTOR_AUTH', false); // Future
define('FEATURE_MOBILE_APP', false); // Future

/*
|--------------------------------------------------------------------------
| Timezone
|--------------------------------------------------------------------------
*/
define('TIMEZONE', 'Africa/Blantyre'); // Malawi timezone (CAT)

/*
|--------------------------------------------------------------------------
| Regex Patterns
|--------------------------------------------------------------------------
*/
define('REGEX_EMAIL', '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/');
define('REGEX_PHONE_MW', '/^(\+265|0)?[1-9][0-9]{8}$/'); // Malawi phone format
define('REGEX_ALPHANUMERIC', '/^[a-zA-Z0-9]+$/');
define('REGEX_USERNAME', '/^[a-zA-Z0-9_]{3,20}$/');

// Load environment-specific constants
$env = getenv('APP_ENV') ?: 'production';
$envConstantsFile = __DIR__ . "/constants.{$env}.php";
if (file_exists($envConstantsFile)) {
    require_once $envConstantsFile;
}
