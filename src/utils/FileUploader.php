<?php
namespace Mkaka\Utils;

class FileUploader {
    
    private $uploadPath = UPLOAD_PATH;
    private $allowedTypes = ALLOWED_FILE_TYPES;
    private $maxFileSize = MAX_FILE_SIZE;
    private $errors = [];
    
    /**
     * Upload single file
     */
    public function upload($file, $directory = '', $customName = null) {
        // Validate file
        if (!$this->validateFile($file)) {
            return [
                'success' => false,
                'errors' => $this->errors
            ];
        }
        
        // Prepare upload directory
        $targetDir = $this->uploadPath . '/' . trim($directory, '/');
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        
        // Generate safe filename
        $filename = $customName ?: $this->generateFilename($file['name']);
        $targetPath = $targetDir . '/' . $filename;
        
        // Check if file already exists
        if (file_exists($targetPath)) {
            $filename = $this->generateUniqueFilename($targetDir, $filename);
            $targetPath = $targetDir . '/' . $filename;
        }
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // Set proper permissions
            chmod($targetPath, 0644);
            
            // Log upload
            Logger::info('File uploaded', [
                'filename' => $filename,
                'size' => $file['size'],
                'type' => $file['type']
            ]);
            
            return [
                'success' => true,
                'filename' => $filename,
                'path' => $targetPath,
                'url' => $this->getFileUrl($directory, $filename),
                'size' => $file['size'],
                'mime_type' => mime_content_type($targetPath)
            ];
        }
        
        $this->errors[] = 'Failed to move uploaded file';
        return [
            'success' => false,
            'errors' => $this->errors
        ];
    }
    
    /**
     * Upload multiple files
     */
    public function uploadMultiple($files, $directory = '') {
        $results = [];
        
        // Handle $_FILES array structure
        if (isset($files['name']) && is_array($files['name'])) {
            $fileCount = count($files['name']);
            
            for ($i = 0; $i < $fileCount; $i++) {
                $file = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i]
                ];
                
                $results[] = $this->upload($file, $directory);
            }
        } else {
            // Array of file arrays
            foreach ($files as $file) {
                $results[] = $this->upload($file, $directory);
            }
        }
        
        return $results;
    }
    
    /**
     * Validate uploaded file
     */
    private function validateFile($file) {
        $this->errors = [];
        
        // Check if file was uploaded
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            $this->errors[] = 'No file was uploaded';
            return false;
        }
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $this->errors[] = $this->getUploadErrorMessage($file['error']);
            return false;
        }
        
        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            $this->errors[] = 'File size exceeds maximum allowed size of ' . 
                             $this->formatBytes($this->maxFileSize);
            return false;
        }
        
        // Check file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowedTypes)) {
            $this->errors[] = 'File type not allowed. Allowed types: ' . 
                             implode(', ', $this->allowedTypes);
            return false;
        }
        
        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowedMimes = array_values(MIME_TYPES);
        if (!in_array($mimeType, $allowedMimes)) {
            $this->errors[] = 'Invalid file MIME type';
            return false;
        }
        
        return true;
    }
    
    /**
     * Generate safe filename
     */
    private function generateFilename($originalName) {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $basename = pathinfo($originalName, PATHINFO_FILENAME);
        
        // Sanitize filename
        $basename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $basename);
        $basename = substr($basename, 0, 100); // Limit length
        
        // Add timestamp and random string
        $filename = $basename . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
        
        return $filename;
    }
    
    /**
     * Generate unique filename if file exists
     */
    private function generateUniqueFilename($directory, $filename) {
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $basename = pathinfo($filename, PATHINFO_FILENAME);
        
        $counter = 1;
        $newFilename = $filename;
        
        while (file_exists($directory . '/' . $newFilename)) {
            $newFilename = $basename . '_' . $counter . '.' . $extension;
            $counter++;
        }
        
        return $newFilename;
    }
    
    /**
     * Get file URL
     */
    private function getFileUrl($directory, $filename) {
        $path = trim($directory, '/');
        return UPLOAD_URL . ($path ? '/' . $path : '') . '/' . $filename;
    }
    
    /**
     * Delete file
     */
    public function delete($filepath) {
        if (file_exists($filepath)) {
            if (unlink($filepath)) {
                Logger::info('File deleted', ['path' => $filepath]);
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get upload error message
     */
    private function getUploadErrorMessage($errorCode) {
        switch ($errorCode) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'File is too large';
            case UPLOAD_ERR_PARTIAL:
                return 'File was only partially uploaded';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Missing temporary folder';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file to disk';
            case UPLOAD_ERR_EXTENSION:
                return 'File upload stopped by extension';
            default:
                return 'Unknown upload error';
        }
    }
    
    /**
     * Format bytes to human readable
     */
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;
        
        while ($bytes >= 1024 && $index < count($units) - 1) {
            $bytes /= 1024;
            $index++;
        }
        
        return round($bytes, 2) . ' ' . $units[$index];
    }
    
    /**
     * Get file info
     */
    public function getFileInfo($filepath) {
        if (!file_exists($filepath)) {
            return null;
        }
        
        return [
            'filename' => basename($filepath),
            'size' => filesize($filepath),
            'mime_type' => mime_content_type($filepath),
            'extension' => pathinfo($filepath, PATHINFO_EXTENSION),
            'modified' => filemtime($filepath),
            'readable' => is_readable($filepath),
            'writable' => is_writable($filepath)
        ];
    }
    
    /**
     * Set allowed file types
     */
    public function setAllowedTypes(array $types) {
        $this->allowedTypes = $types;
    }
    
    /**
     * Set max file size
     */
    public function setMaxFileSize($bytes) {
        $this->maxFileSize = $bytes;
    }
    
    /**
     * Get errors
     */
    public function getErrors() {
        return $this->errors;
    }
}