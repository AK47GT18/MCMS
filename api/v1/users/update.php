<?php
/**
 * PUT /api/v1/users/:id
 * Update user
 * 
 * @requires Authentication, users.edit permission
 * @param int id User ID
 * @request JSON
 *   - email: string (optional)
 *   - first_name: string (optional)
 *   - last_name: string (optional)
 *   - phone: string (optional)
 *   - role_id: int (optional)
 *   - is_active: boolean (optional)
 * 
 * @response JSON
 *   - success: boolean
 *   - user: object (updated user)
 *   - message: string
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check authorization
    Authorization::require('users.edit');
    
    // Get user ID from URL
    $userId = (int)($_GET['id'] ?? 0);
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        exit;
    }
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // Get user repository
    $userRepo = new UserRepository();
    $user = $userRepo->find($userId);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    // Validate provided fields only
    $rules = [];
    if (isset($input['email'])) {
        $rules['email'] = 'email';
        // Check for duplicate
        if ($input['email'] !== $user['email']) {
            $existing = $userRepo->findByEmail($input['email']);
            if ($existing) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'errors' => ['email' => 'This email is already registered']
                ]);
                exit;
            }
        }
    }
    if (isset($input['first_name'])) $rules['first_name'] = 'min:2';
    if (isset($input['last_name'])) $rules['last_name'] = 'min:2';
    if (isset($input['phone'])) $rules['phone'] = 'min:10';
    if (isset($input['role_id'])) $rules['role_id'] = 'numeric';
    
    // Validate
    if ($rules) {
        $validator = new Validator();
        if (!$validator->validate($input, $rules)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ]);
            exit;
        }
    }
    
    // Update user
    $updated = $userRepo->update($userId, $input);
    
    if (!$updated) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update user']);
        exit;
    }
    
    // Log action
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'user_updated',
        'entity_type' => 'user',
        'entity_id' => $userId,
        'details' => json_encode(array_keys($input)),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Get updated user
    $updatedUser = $userRepo->find($userId);
    unset($updatedUser['password']);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user' => $updatedUser,
        'message' => 'User updated successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Update user API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred',
        'message' => $e->getMessage()
    ]);
}
