<?php
namespace Mkaka\Core;

abstract class Controller {
    protected $request;
    protected $response;
    protected $session;
    
    public function __construct() {
        $this->request = new Request();
        $this->response = new Response();
        $this->session = new Session();
    }
    
    /**
     * Render view
     */
    protected function view($view, $data = []) {
        extract($data);
        
        $viewFile = APP_ROOT . "/views/{$view}.php";
        
        if (!file_exists($viewFile)) {
            throw new Exception("View not found: {$view}");
        }
        
        ob_start();
        require $viewFile;
        $content = ob_get_clean();
        
        // Load layout
        require APP_ROOT . '/views/layouts/main.php';
    }
    
    /**
     * Return JSON response
     */
    protected function json($data, $status = 200) {
        return $this->response->json($data, $status);
    }
    
    /**
     * Redirect to URL
     */
    protected function redirect($url, $status = 302) {
        return $this->response->redirect($url, $status);
    }
    
    /**
     * Check if user is authenticated
     */
    protected function requireAuth() {
        if (!Authentication::check()) {
            $this->redirect('/login');
            exit;
        }
    }
    
    /**
     * Check if user has permission
     */
    protected function authorize($permission) {
        if (!Authorization::can($permission)) {
            $this->response->json(['error' => 'Unauthorized'], 403);
            exit;
        }
    }
    
    /**
     * Validate request data
     */
    protected function validate($data, $rules) {
        $validator = new Validator();
        return $validator->validate($data, $rules);
    }
    
    /**
     * Get flash message
     */
    protected function flash($key, $message = null) {
        if ($message === null) {
            return $this->session->getFlash($key);
        }
        $this->session->setFlash($key, $message);
    }
}
