<?php
class Request {
    private $data;
    
    public function __construct() {
        $this->data = $this->parseRequest();
    }
    
    /**
     * Parse incoming request
     */
    private function parseRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                return $_GET;
            case 'POST':
                return $_POST;
            case 'PUT':
            case 'DELETE':
                parse_str(file_get_contents('php://input'), $data);
                return $data;
            default:
                return [];
        }
    }
    
    /**
     * Get request method
     */
    public function method() {
        return $_SERVER['REQUEST_METHOD'];
    }
    
    /**
     * Get request URI
     */
    public function uri() {
        return parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    }
    
    /**
     * Get input value
     */
    public function input($key, $default = null) {
        return $this->data[$key] ?? $default;
    }
    
    /**
     * Get all input
     */
    public function all() {
        return $this->data;
    }
    
    /**
     * Check if key exists
     */
    public function has($key) {
        return isset($this->data[$key]);
    }
    
    /**
     * Get only specified keys
     */
    public function only($keys) {
        return array_intersect_key($this->data, array_flip($keys));
    }
    
    /**
     * Get except specified keys
     */
    public function except($keys) {
        return array_diff_key($this->data, array_flip($keys));
    }
    
    /**
     * Check if request is AJAX
     */
    public function isAjax() {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * Check if request is JSON
     */
    public function isJson() {
        return isset($_SERVER['CONTENT_TYPE']) && 
               strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false;
    }
    
    /**
     * Get header value
     */
    public function header($key, $default = null) {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $key));
        return $_SERVER[$key] ?? $default;
    }
    
    /**
     * Get IP address
     */
    public function ip() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        }
        return $_SERVER['REMOTE_ADDR'];
    }
}