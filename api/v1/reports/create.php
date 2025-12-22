<?php
require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

$csrfMiddleware = new CsrfMiddleware();
$csrfMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $reportService = new ReportService();
    $result = $reportService->createSiteReport($input);
    
    http_response_code(201);
    echo json_encode($result);
    
} catch (ValidationException $e) {
    http_response_code(422);
    echo json_encode($e->toJson());
    
} catch (Exception $e) {
    error_log("Create site report API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}