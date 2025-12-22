// api/v1/projects/index.php
<?php
require_once __DIR__ . '/../../../vendor/autoload.php';

use Mkaka\Core\Request;
use Mkaka\Core\Response;
use Mkaka\Services\ProjectService;
use Mkaka\Middleware\AuthMiddleware;

// Middleware
$auth = new AuthMiddleware();
$auth->handle();

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

$request = new Request();
$response = new Response();
$service = new ProjectService();

try {
    switch ($request->method()) {
        case 'GET':
            $filters = [
                'status' => $request->input('status'),
                'manager_id' => $request->input('manager_id'),
                'search' => $request->input('search')
            ];
            
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 25);
            
            $projects = $service->getProjects($filters, $page, $perPage);
            
            echo json_encode([
                'success' => true,
                'data' => $projects
            ]);
            break;
            
        case 'POST':
            $data = $request->all();
            $result = $service->createProject($data);
            
            echo json_encode($result);
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}