<?php
class Response {
    private $statusCode = 200;
    private $headers = [];
    private $content = '';
    
    /**
     * Set status code
     */
    public function status($code) {
        $this->statusCode = $code;
        return $this;
    }
    
    /**
     * Set header
     */
    public function header($key, $value) {
        $this->headers[$key] = $value;
        return $this;
    }
    
    /**
     * Set content
     */
    public function setContent($content) {
        $this->content = $content;
        return $this;
    }
    
    /**
     * Send JSON response
     */
    public function json($data, $status = 200) {
        $this->status($status);
        $this->header('Content-Type', 'application/json');
        $this->setContent(json_encode($data));
        return $this->send();
    }
    
    /**
     * Redirect to URL
     */
    public function redirect($url, $status = 302) {
        $this->status($status);
        $this->header('Location', $url);
        return $this->send();
    }
    
    /**
     * Send response
     */
    public function send() {
        http_response_code($this->statusCode);
        
        foreach ($this->headers as $key => $value) {
            header("$key: $value");
        }
        
        echo $this->content;
        return $this;
    }
    
    /**
     * Download file
     */
    public function download($filePath, $fileName = null) {
        if (!file_exists($filePath)) {
            throw new Exception("File not found");
        }
        
        $fileName = $fileName ?: basename($filePath);
        
        $this->header('Content-Type', 'application/octet-stream');
        $this->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        $this->header('Content-Length', filesize($filePath));
        
        readfile($filePath);
        exit;
    }
}
