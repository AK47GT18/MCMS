<?php
/**
 * AJAX Request Middleware
 * 
 * @file AjaxMiddleware.php
 * @description Validates and handles AJAX requests
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

namespace Mkaka\Middleware;

class AjaxMiddleware {
    
    /**
     * Handle AJAX request validation
     */
    public function handle() {
        // Check if request claims to be AJAX
        if (!$this->isAjaxRequest()) {
            $this->notAjaxRequest();
            return;
        }
        
        // Set JSON content type for response
        header('Content-Type: application/json');
        
        // Parse JSON body if present
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->parseJsonBody();
        }
        
        // Validate AJAX origin
        $this->validateAjaxOrigin();
    }
    
    /**
     * Check if request is AJAX
     */
    private function isAjaxRequest() {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * Handle non-AJAX request to AJAX-only endpoint
     */
    private function notAjaxRequest() {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'This endpoint only accepts AJAX requests'
        ]);
        exit;
    }
    
    /**
     * Parse JSON request body
     */
    private function parseJsonBody() {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            $json = file_get_contents('php://input');
            
            if ($json) {
                $data = json_decode($json, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Merge JSON data into $_POST for consistency
                    $_POST = array_merge($_POST, $data);
                    $_REQUEST = array_merge($_REQUEST, $data);
                } else {
                    $this->jsonParseError();
                }
            }
        }
    }
    
    /**
     * Handle JSON parse error
     */
    private function jsonParseError() {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON in request body'
        ]);
        exit;
    }
    
    /**
     * Validate AJAX request origin
     */
    private function validateAjaxOrigin() {
        $referer = $_SERVER['HTTP_REFERER'] ?? null;
        
        if (!$referer) {
            // Log suspicious AJAX request without referer
            LogMiddleware::logSecurityEvent('ajax_no_referer', [
                'uri' => $_SERVER['REQUEST_URI'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            ]);
        }
        
        // Additional validation can be added here
    }
    
    /**
     * Send JSON success response
     */
    public static function success($data = [], $message = 'Success', $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }
    
    /**
     * Send JSON error response
     */
    public static function error($message = 'Error occurred', $statusCode = 400, $errors = []) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ]);
        exit;
    }
    
    /**
     * Send validation error response
     */
    public static function validationError($errors, $message = 'Validation failed') {
        self::error($message, 422, $errors);
    }
    
    /**
     * Check if current request is AJAX
     */
    public static function isAjax() {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * Require AJAX request or exit
     */
    public static function requireAjax() {
        if (!self::isAjax()) {
            self::error('This endpoint only accepts AJAX requests', 400);
        }
    }
    
    /**
     * Send paginated response
     */
    public static function paginated($data, $pagination) {
        http_response_code(200);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $pagination['current_page'],
                'per_page' => $pagination['per_page'],
                'total' => $pagination['total'],
                'last_page' => $pagination['last_page']
            ]
        ]);
        exit;
    }
    
    /**
     * Send file download response (for AJAX file downloads)
     */
    public static function fileDownload($filePath, $fileName) {
        if (!file_exists($filePath)) {
            self::error('File not found', 404);
        }
        
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: public');
        
        readfile($filePath);
        exit;
    }
}