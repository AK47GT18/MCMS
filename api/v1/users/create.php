<?php
/**
 * POST /api/v1/users
 * Create new user
 * 
 * @requires Authentication, users.create permission
 * @request JSON
 *   - username: string (required, min 3)
 *   - email: string (required, valid email)
 *   - first_name: string (required)
 *   - last_name: string (required)
 *   - phone: string (required)
 *   - role_id: int (required)
 *   - password: string (required, min 8, complexity required)
 * 
 * @response JSON
 *   - success: boolean
 *   - user: object (created user without password)
 *   - message: string
 *   - errors: object (validation errors if failed)
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
    // Check authorization
    Authorization::require('users.create');
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // Validate input
    $validator = new Validator();
    if (!$validator->validate($input, [
        'username' => 'required|min:3|max:50',
        'email' => 'required|email',
        'first_name' => 'required|min:2',
        'last_name' => 'required|min:2',
        'phone' => 'required|min:10',
        'role_id' => 'required|numeric',
        'password' => 'required|min:8'
    ])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ]);
        exit;
    }
    
    // Check if username exists
    $userModel = new User();
    $existingUsername = $userModel->findByUsername($input['username']);
    if ($existingUsername) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists',
            'errors' => ['username' => 'This username is taken']
        ]);
        exit;
    }
    
    // Check if email exists
    $existingEmail = $userModel->findByEmail($input['email']);
    if ($existingEmail) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Email already exists',
            'errors' => ['email' => 'This email is registered']
        ]);
        exit;
    }
    
    // Create user
    $userService = new UserService();
    $user = $userService->createUser($input);
    
    // Log action
    $auditLog = new AuditLog();
    $currentUser = Authentication::user();
    $auditLog->create([
        'user_id' => $currentUser['id'],
        'action' => 'user_created',
        'entity_type' => 'user',
        'entity_id' => $user['id'],
        'details' => json_encode([
            'username' => $user['username'],
            'email' => $user['email'],
            'role_id' => $user['role_id']
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    // Remove password from response
    unset($user['password']);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'user' => $user,
        'message' => 'User created successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Create user API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An error occurred',
        'message' => $e->getMessage()
    ]);
}
