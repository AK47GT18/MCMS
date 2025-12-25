<?php
/**
 * Mkaka Construction Management System
 * Application Entry Point
 */

// Define application root constant
define('APP_ROOT', dirname(__DIR__));
define('URL_ROOT', '/MCMS/public');
define('SITE_NAME', 'Mkaka Construction Management System');

// Initialize Session
session_start();

// Load Config
require_once APP_ROOT . '/src/config/app.php';
require_once APP_ROOT . '/src/config/database.php';

// Autoloader (Simple implementation for standard PHP structure)
spl_autoload_register(function($className) {
    // Convert namespace to path
    // Mkaka\Core\Controller -> src/core/Controller.php
    // Mkaka\Controllers\DashboardController -> src/controllers/DashboardController.php
    
    $prefix = 'Mkaka\\';
    $baseDir = APP_ROOT . '/src/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $className, $len) !== 0) {
        return;
    }
    
    $relativeClass = substr($className, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    
    // Check specific directories if not found (convention mapping)
    if (!file_exists($file)) {
        // Try Core
        $coreFile = APP_ROOT . '/src/core/' . str_replace('Core\\', '', $relativeClass) . '.php';
        if (file_exists($coreFile)) {
            require $coreFile;
            return;
        }
        
        // Try Controllers
        $controllerFile = APP_ROOT . '/src/controllers/' . str_replace('Controllers\\', '', $relativeClass) . '.php';
        if (file_exists($controllerFile)) {
            require $controllerFile;
            return;
        }

        // Try Models
        $modelFile = APP_ROOT . '/src/models/' . str_replace('Models\\', '', $relativeClass) . '.php';
        if (file_exists($modelFile)) {
            require $modelFile;
            return;
        }
        
        // Try Services
        $serviceFile = APP_ROOT . '/src/services/' . str_replace('Services\\', '', $relativeClass) . '.php';
        if (file_exists($serviceFile)) {
            require $serviceFile;
            return;
        }
    } else {
        require $file;
    }
});

// Initialize Router
use Mkaka\Core\Router;

$router = new Router();

// Define Routes
// Dashboard
$router->get('/dashboard', 'Mkaka\Controllers\DashboardController@index');
$router->get('/', 'Mkaka\Controllers\DashboardController@index');

// Dashboard API
$router->get('/api/v1/dashboard/stats', 'Mkaka\Controllers\DashboardController@getStats');
$router->get('/api/v1/dashboard/charts/{type}', 'Mkaka\Controllers\DashboardController@getChartData');

// Projects
$router->get('/projects', 'Mkaka\Controllers\ProjectController@index');
$router->get('/projects/create', 'Mkaka\Controllers\ProjectController@create');
$router->get('/projects/{id}', 'Mkaka\Controllers\ProjectController@show');

// Tasks
$router->get('/api/v1/projects/{id}/tasks', 'Mkaka\Controllers\ProjectController@tasks');
$router->post('/api/v1/projects/{id}/tasks', 'Mkaka\Controllers\ProjectController@createTask');

// Gantt
$router->get('/api/v1/projects/{id}/gantt', 'Mkaka\Controllers\ProjectController@getGanttData');
$router->post('/api/v1/projects/{id}/gantt', 'Mkaka\Controllers\ProjectController@updateGanttData');

// Documents
$router->get('/api/v1/projects/{id}/documents', 'Mkaka\Controllers\ProjectController@getDocuments');
$router->get('/api/v1/documents/config/{id}', 'Mkaka\Controllers\DocumentController@getConfig');
$router->post('/api/v1/documents/upload', 'Mkaka\Controllers\DocumentController@upload');
$router->delete('/api/v1/documents/{id}', 'Mkaka\Controllers\DocumentController@delete');

// Finance
$router->get('/finance', 'Mkaka\Controllers\FinanceController@index');
$router->get('/finance/transactions', 'Mkaka\Controllers\FinanceController@transactions');
$router->post('/api/v1/finance/transactions', 'Mkaka\Controllers\FinanceController@storeTransaction');

// Contracts
$router->get('/contracts', 'Mkaka\Controllers\ContractController@index');

// Dispatch
$router->dispatch();
