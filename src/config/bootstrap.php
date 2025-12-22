<?php
/**
 * ============================================
 * MCMS Bootstrap Configuration
 * ============================================
 * 
 * Main initialization file for all application features:
 * - Database connection & ORM
 * - Session management & security
 * - User authentication & authorization
 * - Error handling & logging
 * - Service dependencies
 * - Frontend library initialization
 * 
 * REQUIRED BY: All API endpoints, controllers, and views
 * LOADED BY: require_once __DIR__ . '/../../../src/config/bootstrap.php'
 */

// ============================================
// 1. ERROR HANDLING & DEBUGGING
// ============================================
/**
 * Purpose: Configure error display and logging
 * - Development: Show errors, detailed logs
 * - Production: Log only, no display
 */
error_reporting(E_ALL);
ini_set('display_errors', getenv('APP_ENV') === 'production' ? 0 : 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php-errors.log');

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("[ERROR] $errstr in $errfile:$errline");
    if (getenv('APP_ENV') !== 'production') {
        echo json_encode(['success' => false, 'error' => $errstr]);
    }
    return true;
});

set_exception_handler(function($exception) {
    error_log("[EXCEPTION] " . $exception->getMessage());
    if (getenv('APP_ENV') !== 'production') {
        echo json_encode(['success' => false, 'error' => $exception->getMessage()]);
    }
});

// ============================================
// 2. LOAD ENVIRONMENT CONFIGURATION
// ============================================
/**
 * Purpose: Load .env file with all settings
 * Contains: Database, API, OnlyOffice, Redis, JWT secrets
 * 
 * Usage: getenv('DB_HOST'), getenv('REDIS_PASSWORD'), etc.
 */
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $envLines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

// Set defaults if not in .env
if (!getenv('APP_ENV')) putenv('APP_ENV=development');
if (!getenv('APP_URL')) putenv('APP_URL=http://localhost');
if (!getenv('DB_HOST')) putenv('DB_HOST=localhost');
if (!getenv('DB_PORT')) putenv('DB_PORT=3306');
if (!getenv('REDIS_PASSWORD')) putenv('REDIS_PASSWORD=');

// ============================================
// 3. COMPOSER AUTOLOADER
// ============================================
/**
 * Purpose: Enable PSR-4 autoloading for all classes
 * Namespace: Mkaka\*
 * 
 * Example: new Mkaka\Models\Project() auto-loads from
 * src/models/Project.php
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// ============================================
// 4. LOAD CONFIGURATION FILES
// ============================================
/**
 * Purpose: Load specialized configuration for different features
 * Files:
 *   - constants.php: Application constants (roles, permissions, statuses)
 *   - database.php: Database configuration and connection pooling
 *   - email.php: Email service configuration
 *   - security.php: Security headers, CSRF, session config
 */
require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/email.php';
require_once __DIR__ . '/security.php';

// ============================================
// 5. INITIALIZE SESSION MANAGEMENT
// ============================================
/**
 * Purpose: Start secure PHP session with Redis backend
 * Features:
 *   - Redis session storage for distributed environments
 *   - HttpOnly, Secure cookies
 *   - SameSite=Strict CSRF protection
 *   - Session ID regeneration
 * 
 * Used By: Authentication, user state, flash messages
 */
use Mkaka\Core\Session;

$session = new Session();

// Make session globally available
if (!function_exists('session')) {
    function session() {
        global $session;
        return $session;
    }
}

// ============================================
// 6. INITIALIZE DATABASE CONNECTION
// ============================================
/**
 * Purpose: Connect to MySQL database with connection pooling
 * Features:
 *   - Single connection instance (Singleton pattern)
 *   - Prepared statements (SQL injection prevention)
 *   - Connection pooling for multiple queries
 * 
 * Usage:
 *   $db = Database::getInstance();
 *   $result = $db->query("SELECT * FROM users WHERE id = ?", [$userId]);
 */
use Mkaka\Core\Database;

try {
    $db = Database::getInstance();
    // Connection is lazy-loaded on first use
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    exit(json_encode(['success' => false, 'error' => 'Database connection failed']));
}

// ============================================
// 7. INITIALIZE REDIS CACHE & SESSIONS
// ============================================
/**
 * Purpose: Connect to Redis for caching and real-time features
 * Features:
 *   - Session storage (faster than file-based)
 *   - Cache for frequently queried data
 *   - Notification subscriptions
 *   - Real-time SSE connections
 * 
 * Usage:
 *   $redis = Redis::getInstance();
 *   $redis->set('key', 'value', 3600); // 1 hour expiry
 */
use Mkaka\Core\Redis;

if (extension_loaded('redis')) {
    try {
        $redis = Redis::getInstance();
        // Redis connection tested on first use
    } catch (Exception $e) {
        error_log("Redis connection warning: " . $e->getMessage());
        // Graceful degradation - app works without Redis
    }
}

// ============================================
// 8. AUTHENTICATION & USER CONTEXT
// ============================================
/**
 * Purpose: Load current user from session if authenticated
 * Features:
 *   - Session-based authentication
 *   - JWT tokens for API (future)
 *   - User object with permissions
 * 
 * Usage:
 *   $user = Authentication::user();
 *   $isLoggedIn = Authentication::check();
 *   Authorization::require('permission.name');
 */
use Mkaka\Core\Authentication;
use Mkaka\Core\Authorization;

// Initialize authentication system
Authentication::init();

// Make auth available globally
if (!function_exists('auth') && !function_exists('user')) {
    function auth() {
        return Authentication::class;
    }
    
    function user() {
        return Authentication::user();
    }
    
    function can($permission) {
        return Authorization::has($permission);
    }
}

// ============================================
// 9. ERROR/EXCEPTION CLASSES
// ============================================
/**
 * Purpose: Define custom exception classes for better error handling
 * Classes:
 *   - ValidationException: Input validation errors
 *   - NotFoundException: Resource not found
 *   - UnauthorizedException: Auth/permission issues
 *   - QueryException: Database errors
 */
class ValidationException extends Exception {
    public function __construct($errors = []) {
        $this->errors = $errors;
        parent::__construct('Validation failed');
    }
    
    public function toJson() {
        return [
            'success' => false,
            'errors' => $this->errors ?? []
        ];
    }
}

class NotFoundException extends Exception {
    public function __construct($entity = 'Resource', $id = null) {
        parent::__construct("$entity not found" . ($id ? " (ID: $id)" : ""));
    }
    
    public function toJson() {
        return [
            'success' => false,
            'error' => $this->getMessage()
        ];
    }
}

class UnauthorizedException extends Exception {
    public function __construct($message = 'Unauthorized') {
        parent::__construct($message);
    }
    
    public function toJson() {
        return [
            'success' => false,
            'error' => $this->getMessage()
        ];
    }
}

class QueryException extends Exception {
    public function __construct($message = 'Database query failed') {
        parent::__construct($message);
    }
    
    public function toJson() {
        return [
            'success' => false,
            'error' => 'Database error occurred'
        ];
    }
}

// ============================================
// 10. UTILITY FUNCTION HELPERS
// ============================================
/**
 * Purpose: Common helper functions used throughout application
 * Functions:
 *   - json_response(): Format JSON responses consistently
 *   - redirect(): HTTP redirect
 *   - abort(): Throw exception with status code
 *   - config(): Get configuration values
 */

if (!function_exists('json_response')) {
    /**
     * Return consistent JSON response format
     * 
     * Usage:
     *   return json_response(true, 'Success message', $data);
     */
    function json_response($success = true, $message = '', $data = null, $statusCode = 200) {
        http_response_code($statusCode);
        
        $response = ['success' => $success];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        header('Content-Type: application/json');
        return json_encode($response);
    }
}

if (!function_exists('abort')) {
    /**
     * Abort with error and status code
     * 
     * Usage:
     *   abort(404, 'User not found');
     */
    function abort($statusCode = 500, $message = 'Error') {
        http_response_code($statusCode);
        exit(json_encode(['success' => false, 'error' => $message]));
    }
}

if (!function_exists('config')) {
    /**
     * Get configuration value
     * 
     * Usage:
     *   config('database.host')
     */
    function config($key, $default = null) {
        return getenv(str_replace('.', '_', strtoupper($key))) ?? $default;
    }
}

// ============================================
// 11. FRONTEND LIBRARY INITIALIZATION
// ============================================
/**
 * Purpose: Initialize all frontend libraries and configurations
 * Includes:
 *   - DHTMLX Gantt chart setup
 *   - Leaflet map configuration
 *   - OnlyOffice document editor
 *   - Real-time notification settings
 *   - Modal/AJAX handlers
 *   - Photo upload validators
 */

// ===== DHTMLX GANTT CONFIGURATION =====
/**
 * GANTT CHART
 * Purpose: Project timeline visualization
 * Used For: /api/v1/projects/:id/progress endpoint
 * 
 * API Response Format:
 * {
 *   "tasks": [
 *     {"id": 1, "name": "Task", "start_date": "2024-01-15", 
 *      "duration": 5, "progress": 0.5, "status": "in_progress"}
 *   ],
 *   "milestones": [
 *     {"id": "m_1", "name": "Milestone", "date": "2024-01-20"}
 *   ]
 * }
 * 
 * Frontend Integration:
 * const response = await fetch('/api/v1/projects/1/progress.php');
 * const data = await response.json();
 * gantt.parse(data.gantt_data);
 */
define('GANTT_CONFIG', [
    'enabled' => true,
    'url' => getenv('APP_URL'),
    'library_cdn' => 'https://cdnjs.cloudflare.com/ajax/libs/dhtmlx-gantt/9.1.1',
    'css' => 'https://cdnjs.cloudflare.com/ajax/libs/dhtmlx-gantt/9.1.1/dhtmlxgantt.min.css',
    'js' => 'https://cdnjs.cloudflare.com/ajax/libs/dhtmlx-gantt/9.1.1/dhtmlxgantt.min.js',
    'date_format' => 'Y-m-d',
    'grid_width' => 400,
    'readonly' => false,
    'show_progress' => true,
    'columns' => [
        ['name' => 'text', 'label' => 'Task', 'width' => 200, 'tree' => true],
        ['name' => 'start_date', 'label' => 'Start', 'width' => 80, 'align' => 'center'],
        ['name' => 'duration', 'label' => 'Days', 'width' => 60, 'align' => 'center'],
        ['name' => 'progress', 'label' => 'Progress', 'width' => 80, 'align' => 'center']
    ]
]);

// ===== LEAFLET MAP CONFIGURATION =====
/**
 * LEAFLET MAPS
 * Purpose: GPS mapping and site visualization
 * Used For: 
 *   - /api/v1/reports/gps-validate (coordinate validation)
 *   - /api/v1/reports/site-reports (report locations)
 *   - /api/v1/modal-data/project-details (site boundaries)
 * 
 * API Response Format:
 * {
 *   "latitude": -13.5,
 *   "longitude": 34.5,
 *   "gps_validated": true,
 *   "distance_meters": 250.50
 * }
 * 
 * Frontend Integration:
 * L.map('map').setView([-13.5, 34.5], 13);
 * L.circleMarker([lat, lng]).addTo(map);
 */
define('LEAFLET_CONFIG', [
    'enabled' => true,
    'library_cdn' => 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4',
    'css' => 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'js' => 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    'tile_provider' => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'attribution' => '© OpenStreetMap contributors',
    'default_zoom' => 13,
    'default_center' => [-13.5, 34.5], // Malawi center
    'country_bounds' => [
        'north' => -9.23,
        'south' => -17.8,
        'west' => 32.67,
        'east' => 35.92
    ],
    'site_radius_meters' => 500, // Validation radius
    'marker_colors' => [
        'validated' => 'green',
        'invalid' => 'red',
        'pending' => 'yellow',
        'project' => 'blue'
    ]
]);

// ===== ONLYOFFICE CONFIGURATION =====
/**
 * ONLYOFFICE DOCUMENT EDITOR
 * Purpose: Real-time collaborative document editing
 * Used For: Contract documents, reports
 * 
 * Features:
 *   - JWT-signed editor config (security)
 *   - Real-time co-editing via Redis
 *   - Document version tracking
 *   - User permissions & tracking
 * 
 * API Backend: OnlyOfficeService.php
 * 
 * Frontend Integration:
 * const config = await fetch('/api/v1/contracts/get-document-config', 
 *   {method: 'POST', body: JSON.stringify({document_id, path})});
 * new DocsAPI.DocEditor('editor', config);
 */
define('ONLYOFFICE_CONFIG', [
    'enabled' => getenv('ONLYOFFICE_ENABLED') !== 'false',
    'document_server' => getenv('ONLYOFFICE_URL') ?: 'http://onlyoffice:80',
    'api_url' => 'http://onlyoffice:80/web-apps/apps/api/documents/api.js',
    'jwt_secret' => getenv('ONLYOFFICE_JWT_SECRET'),
    'jwt_enabled' => true,
    'jwt_header' => 'Authorization',
    'database' => [
        'host' => getenv('DB_HOST'),
        'port' => getenv('DB_PORT'),
        'name' => getenv('ONLYOFFICE_DB_NAME') ?: 'onlyoffice',
        'user' => getenv('ONLYOFFICE_DB_USER') ?: 'onlyoffice_user',
        'password' => getenv('ONLYOFFICE_DB_PASSWORD')
    ],
    'redis' => [
        'host' => getenv('REDIS_HOST') ?: 'redis',
        'port' => getenv('REDIS_PORT') ?: 6379,
        'password' => getenv('REDIS_PASSWORD')
    ],
    'supported_formats' => [
        'word' => ['doc', 'docx', 'odt', 'rtf'],
        'cell' => ['xls', 'xlsx', 'ods', 'csv'],
        'slide' => ['ppt', 'pptx', 'odp']
    ],
    'customization' => [
        'autosave' => true,
        'forcesave' => false,
        'compactHeader' => false,
        'hideRightMenu' => false
    ]
]);

// ===== REAL-TIME NOTIFICATIONS CONFIGURATION =====
/**
 * SERVER-SENT EVENTS (SSE) CONFIGURATION
 * Purpose: Real-time notification streaming to clients
 * Used For: /api/v1/notifications/subscribe endpoint
 * 
 * Features:
 *   - Browser EventSource API integration
 *   - Heartbeat to prevent connection timeout
 *   - Auto-reconnect on disconnect
 *   - Multiple event types
 * 
 * API Response Format:
 * event: notification_created
 * data: {"id": 1, "type": "report_created", "title": "New Report"}
 * 
 * event: heartbeat
 * data: {"timestamp": 1234567890}
 * 
 * Frontend Integration:
 * const source = new EventSource('/api/v1/notifications/subscribe.php');
 * source.addEventListener('notification_created', (e) => {
 *   const notification = JSON.parse(e.data);
 *   showNotification(notification);
 * });
 */
define('SSE_CONFIG', [
    'enabled' => true,
    'poll_interval' => 2, // seconds between checks
    'max_duration' => 300, // 5 minutes
    'heartbeat_interval' => 30, // seconds
    'event_types' => [
        'notification_created',
        'notification_read',
        'notification_deleted',
        'connected',
        'heartbeat',
        'error',
        'connection_closed'
    ],
    'redis_prefix' => 'notification_subscription:',
    'redis_ttl' => 300 // 5 minutes
]);

// ===== MODAL/AJAX CONFIGURATION =====
/**
 * MODAL DATA ENDPOINTS CONFIGURATION
 * Purpose: Lightweight JSON data for AJAX modal dialogs
 * Used For: 5 dedicated modal-data endpoints
 * 
 * Endpoints:
 *   - /api/v1/modal-data/project-details
 *   - /api/v1/modal-data/transaction-details
 *   - /api/v1/modal-data/equipment-status
 *   - /api/v1/modal-data/contract-milestone
 *   - /api/v1/modal-data/report-preview
 * 
 * Frontend Integration:
 * const data = await fetch('/api/v1/modal-data/project-details?id=1')
 *   .then(r => r.json());
 * showModal(buildModalContent(data));
 */
define('MODAL_CONFIG', [
    'enabled' => true,
    'endpoints' => [
        'project-details' => [
            'path' => '/api/v1/modal-data/project-details',
            'permission' => 'projects.view',
            'cache_ttl' => 300
        ],
        'transaction-details' => [
            'path' => '/api/v1/modal-data/transaction-details',
            'permission' => 'finance.view',
            'cache_ttl' => 300
        ],
        'equipment-status' => [
            'path' => '/api/v1/modal-data/equipment-status',
            'permission' => 'equipment.view',
            'cache_ttl' => 300
        ],
        'contract-milestone' => [
            'path' => '/api/v1/modal-data/contract-milestone',
            'permission' => 'contracts.view',
            'cache_ttl' => 300
        ],
        'report-preview' => [
            'path' => '/api/v1/modal-data/report-preview',
            'permission' => 'site_reports.view',
            'cache_ttl' => 300
        ]
    ],
    'max_payload_size' => 1000000 // 1MB
]);

// ===== PHOTO UPLOAD CONFIGURATION =====
/**
 * PHOTO UPLOAD CONFIGURATION
 * Purpose: File upload validation and storage for site reports
 * Used For: /api/v1/reports/:id/upload-photo endpoint
 * 
 * Features:
 *   - Multi-file support (max 5)
 *   - File size validation (5MB max)
 *   - Format validation (JPEG, PNG, WebP)
 *   - Secure directory structure
 *   - Metadata tracking
 * 
 * API Request:
 * POST /api/v1/reports/1/upload-photo.php
 * Content-Type: multipart/form-data
 * photos: [file1.jpg, file2.jpg, ...]
 * photo_description: ["description1", "description2"]
 * 
 * Frontend Integration:
 * const formData = new FormData();
 * formData.append('photos', fileInput.files[0]);
 * fetch(`/api/v1/reports/1/upload-photo.php`, {
 *   method: 'POST',
 *   body: formData
 * });
 */
define('PHOTO_CONFIG', [
    'enabled' => true,
    'upload_dir' => __DIR__ . '/../../public/uploads/reports',
    'max_files' => 5,
    'max_file_size' => 5 * 1024 * 1024, // 5MB
    'allowed_mimes' => [
        'image/jpeg',
        'image/png',
        'image/webp'
    ],
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
    'secure_naming' => true,
    'create_thumbnails' => true,
    'thumbnail_size' => 300,
    'compression_quality' => 85
]);

// ============================================
// 12. API ENDPOINT CONFIGURATION
// ============================================
/**
 * Purpose: Configure all API endpoints with permissions, cache, etc.
 * 
 * MODULES & ENDPOINTS:
 *   - Auth (4): login, logout, refresh, verify
 *   - Users (4): index, create, update, profile
 *   - Projects (7): index, create, update, delete, status, tasks, progress
 *   - Finance (5): transactions, create, approve, reject, budgets
 *   - Equipment (6): index, create, update, checkout, checkin, maintenance
 *   - Reports (4): list, create, gps-validate, upload-photo
 *   - Contracts (4): index, create, update, documents
 *   - Notifications (3): index, mark-read, subscribe
 *   - Modal-Data (5): project, transaction, equipment, contract, report
 */
define('API_CONFIG', [
    'version' => '1.0.0',
    'base_path' => '/api/v1',
    'timeout' => 30,
    'rate_limit_enabled' => true,
    'rate_limit_requests' => 100,
    'rate_limit_window' => 60, // seconds
    'cors_enabled' => false,
    'modules' => [
        'auth' => ['enabled' => true, 'cache' => false],
        'users' => ['enabled' => true, 'cache' => true, 'cache_ttl' => 300],
        'projects' => ['enabled' => true, 'cache' => true, 'cache_ttl' => 300],
        'finance' => ['enabled' => true, 'cache' => true, 'cache_ttl' => 60],
        'equipment' => ['enabled' => true, 'cache' => true, 'cache_ttl' => 300],
        'reports' => ['enabled' => true, 'cache' => true, 'cache_ttl' => 60],
        'contracts' => ['enabled' => true, 'cache' => true, 'cache_ttl' => 300],
        'notifications' => ['enabled' => true, 'cache' => false],
        'modal-data' => ['enabled' => true, 'cache' => true, 'cache_ttl' => 300]
    ]
]);

// ============================================
// 13. LOAD SERVICE PROVIDERS
// ============================================
/**
 * Purpose: Initialize service classes for business logic
 * Services provide:
 *   - Equipment checkout/checkin logic
 *   - Finance approval workflows
 *   - Report GPS validation
 *   - Notification sending
 *   - OnlyOffice integration
 * 
 * Usage:
 *   $equipmentService = new EquipmentService();
 *   $checkout = $equipmentService->checkOutEquipment($id, $data);
 */

// Services are lazy-loaded on demand
// No initialization needed here - they're loaded via:
// use Mkaka\Services\EquipmentService;
// use Mkaka\Services\FinanceService;
// use Mkaka\Services\ReportService;
// etc.

// ============================================
// 14. LOAD MIDDLEWARE
// ============================================
/**
 * Purpose: Initialize middleware classes for request processing
 * Middleware:
 *   - AuthMiddleware: Check authentication
 *   - RoleMiddleware: Check role-based permissions
 *   - CsrfMiddleware: Validate CSRF tokens
 *   - RateLimitMiddleware: Limit API requests
 *   - CorsMiddleware: Handle cross-origin requests
 * 
 * Usage in endpoints:
 *   $authMiddleware = new AuthMiddleware();
 *   $authMiddleware->handle();
 *   
 *   Authorization::require('permission.name');
 */

use Mkaka\Middleware\AuthMiddleware;
use Mkaka\Middleware\CsrfMiddleware;

// Middleware are instantiated in endpoints as needed

// ============================================
// 15. AUDIT LOGGING CONFIGURATION
// ============================================
/**
 * Purpose: Track all modifications for compliance & debugging
 * Logs:
 *   - User actions (create, update, delete, approve, etc.)
 *   - Timestamp and IP address
 *   - Before/after values for updates
 *   - Related entities
 * 
 * Used By: AuditLog service
 * Stored In: audit_logs table
 * 
 * Usage:
 *   $auditLog = new AuditLog();
 *   $auditLog->create([
 *       'user_id' => $userId,
 *       'action' => 'project_created',
 *       'entity_type' => 'project',
 *       'entity_id' => $projectId,
 *       'details' => json_encode($changes),
 *       'ip_address' => $_SERVER['REMOTE_ADDR']
 *   ]);
 */
define('AUDIT_CONFIG', [
    'enabled' => true,
    'log_table' => 'audit_logs',
    'retention_days' => 365,
    'actions_to_log' => [
        'create', 'update', 'delete', 'approve', 'reject',
        'checkout', 'checkin', 'status_change', 'upload',
        'mark_read', 'validate'
    ],
    'sensitive_fields' => [
        'password', 'token', 'secret', 'api_key'
    ]
]);

// ============================================
// 16. INITIALIZE REPOSITORIES
// ============================================
/**
 * Purpose: Data access layer classes for all entities
 * Repositories provide database abstraction:
 *   - Database queries via prepared statements
 *   - Entity mapping to objects
 *   - Query caching via Redis
 * 
 * Classes:
 *   - UserRepository, ProjectRepository, FinanceRepository
 *   - EquipmentRepository, ReportRepository, ContractRepository
 *   - NotificationRepository, AuditLogRepository
 * 
 * Usage:
 *   $userRepo = new UserRepository();
 *   $user = $userRepo->find($userId);
 *   $users = $userRepo->getAll(['role' => 'admin']);
 */

// Repositories are lazy-loaded on demand via:
// use Mkaka\Repositories\UserRepository;
// etc.

// ============================================
// 17. VALIDATION FRAMEWORK
// ============================================
/**
 * Purpose: Input validation for all API endpoints
 * Features:
 *   - Rule-based validation
 *   - Custom validation rules
 *   - Error message translation
 * 
 * Usage:
 *   $validator = new Validator();
 *   if (!$validator->validate($input, [
 *       'email' => 'required|email',
 *       'password' => 'required|min:8',
 *       'age' => 'numeric|min:18'
 *   ])) {
 *       throw new ValidationException($validator->errors());
 *   }
 */

use Mkaka\Core\Validator;

if (!function_exists('validate')) {
    function validate($data, $rules) {
        $validator = new Validator();
        return $validator->validate($data, $rules);
    }
}

// ============================================
// 18. INTERNATIONALIZATION (i18n)
// ============================================
/**
 * Purpose: Multi-language support (future enhancement)
 * Currently defaults to English
 */
define('APP_LOCALE', getenv('APP_LOCALE') ?: 'en');
define('SUPPORTED_LOCALES', ['en', 'sw', 'fr']); // Malawi context

// ============================================
// 19. FINAL INITIALIZATION CHECKS
// ============================================
/**
 * Purpose: Verify all critical systems are initialized
 * Checks:
 *   - Database connection
 *   - Session handler
 *   - Required permissions
 */

// Database availability
if (!isset($db)) {
    error_log("Bootstrap: Database not initialized");
}

// Session availability
if (!isset($session)) {
    error_log("Bootstrap: Session not initialized");
}

// ============================================
// 20. EXPORT GLOBAL HELPERS
// ============================================
/**
 * Purpose: Make common functions/classes easily available
 */
if (!function_exists('dd')) {
    /**
     * Debug dump - pretty print and die
     */
    function dd($data) {
        echo '<pre>';
        var_dump($data);
        echo '</pre>';
        die();
    }
}

if (!function_exists('logger')) {
    /**
     * Simple logging helper
     */
    function logger($message, $level = 'info') {
        $timestamp = date('Y-m-d H:i:s');
        $logFile = __DIR__ . '/../../logs/app.log';
        $logMessage = "[$timestamp] [$level] $message\n";
        error_log($logMessage, 3, $logFile);
    }
}

// ============================================
// BOOTSTRAP COMPLETE
// ============================================
/**
 * All systems initialized and ready:
 * ✓ Error handling
 * ✓ Environment configuration
 * ✓ PSR-4 Autoloader
 * ✓ Database connection
 * ✓ Session management
 * ✓ Authentication & authorization
 * ✓ Redis cache & notifications
 * ✓ Frontend library configs
 * ✓ API endpoints
 * ✓ Middleware
 * ✓ Validation
 * ✓ Audit logging
 * 
 * Application is ready to serve requests
 */

// Define bootstrap completion marker
define('BOOTSTRAP_INITIALIZED', true);

return [
    'gantt' => GANTT_CONFIG,
    'leaflet' => LEAFLET_CONFIG,
    'onlyoffice' => ONLYOFFICE_CONFIG,
    'sse' => SSE_CONFIG,
    'modal' => MODAL_CONFIG,
    'photo' => PHOTO_CONFIG,
    'api' => API_CONFIG,
    'audit' => AUDIT_CONFIG,
    'locale' => APP_LOCALE
];
