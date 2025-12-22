<?php
/**
 * GET /api/v1/modal-data/contract-milestone
 * Get detailed contract milestone information for modal display
 * 
 * @requires Authentication, contracts.view permission
 * @query int id Contract ID (required)
 * 
 * @response JSON
 *   - success: boolean
 *   - contract: object
 *   - milestones: array
 *   - documents: array
 *   - timeline: object
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    Authorization::require('contracts.view');
    
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Contract ID is required']);
        exit;
    }
    
    $contractId = (int)$_GET['id'];
    $contractRepo = new ContractRepository();
    $contract = $contractRepo->find($contractId);
    
    if (!$contract) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Contract not found']);
        exit;
    }
    
    // Get all milestones for this contract
    $milestones = $contractRepo->getMilestones($contractId);
    
    // Get contract documents
    $documentRepo = new DocumentRepository();
    $documents = $documentRepo->getByEntity('contract', $contractId);
    
    // Calculate timeline progress
    $startDate = strtotime($contract['start_date']);
    $endDate = strtotime($contract['end_date']);
    $now = time();
    
    $totalDays = ($endDate - $startDate) / 86400;
    $elapsedDays = ($now - $startDate) / 86400;
    $progressPercent = min(100, max(0, ($elapsedDays / $totalDays) * 100));
    
    // Get milestone progress
    $completedMilestones = count(array_filter($milestones, fn($m) => $m['status'] === 'completed'));
    $totalMilestones = count($milestones);
    
    $timeline = [
        'start_date' => $contract['start_date'],
        'end_date' => $contract['end_date'],
        'days_elapsed' => max(0, floor($elapsedDays)),
        'days_remaining' => max(0, floor(($endDate - $now) / 86400)),
        'total_days' => floor($totalDays),
        'progress_percent' => round($progressPercent, 2),
        'milestone_progress' => $completedMilestones . '/' . $totalMilestones,
        'status' => $contract['status']
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'contract' => $contract,
        'milestones' => $milestones,
        'documents' => $documents,
        'timeline' => $timeline
    ]);
    
} catch (Exception $e) {
    error_log("Modal contract milestone API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
