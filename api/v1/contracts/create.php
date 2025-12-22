<?php
/**
 * POST /api/v1/contracts
 * Create new contract
 * 
 * @requires Authentication, contracts.create permission
 * @request JSON
 *   - contract_number: string (required)
 *   - title: string (required)
 *   - client_name: string (required)
 *   - start_date: date (required)
 *   - end_date: date (required)
 *   - contract_value: float (optional)
 *   - terms_conditions: string (optional)
 *   - assigned_to: int (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - contract: object
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    Authorization::require('contracts.create');
    
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $validator = new Validator();
    if (!$validator->validate($input, [
        'contract_number' => 'required',
        'title' => 'required|min:3',
        'client_name' => 'required|min:2',
        'start_date' => 'required',
        'end_date' => 'required'
    ])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'errors' => $validator->errors()
        ]);
        exit;
    }
    
    if (strtotime($input['start_date']) > strtotime($input['end_date'])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'errors' => ['end_date' => 'End date must be after start date']
        ]);
        exit;
    }
    
    $contractService = new ContractService();
    $contract = $contractService->createContract($input);
    
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'contract_created',
        'entity_type' => 'contract',
        'entity_id' => $contract['id'],
        'details' => json_encode(['contract_number' => $contract['contract_number']]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'contract' => $contract,
        'message' => 'Contract created successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Create contract API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
