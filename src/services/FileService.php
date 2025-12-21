<?php
class FileService {
    
    private $uploadDir;
    private $allowedTypes;
    private $maxFileSize;
    
    public function __construct() {
        $this->uploadDir = __DIR__ . '/../../public/uploads/';
        $this->allowedTypes = explode(',', getenv('ALLOWED_FILE_TYPES'));
        $this->maxFileSize = (int) getenv('MAX_UPLOAD_SIZE'); // bytes
    }
    
    /**
     * Upload file
     */
    public function uploadFile($file, $subfolder = '') {
        // Validate file
        $this->validateFile($file);
        
        // Generate unique filename
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = uniqid() . '_' . time() . '.' . $extension;
        
        // Create subfolder if doesn't exist
        $targetDir = $this->uploadDir . $subfolder;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        
        $targetPath = $targetDir . '/' . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new Exception('Failed to upload file');
        }
        
        return [
            'filename' => $filename,
            'filepath' => $subfolder . '/' . $filename,
            'filesize' => $file['size'],
            'original_name' => $file['name']
        ];
    }
    
    /**
     * Validate uploaded file
     */
    private function validateFile($file) {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new ValidationException(['file' => 'File upload error']);
        }
        
        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            $maxSizeMB = round($this->maxFileSize / 1024 / 1024, 2);
            throw new ValidationException([
                'file' => "File size exceeds maximum allowed size of {$maxSizeMB}MB"
            ]);
        }
        
        // Check file type
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowedTypes)) {
            throw new ValidationException([
                'file' => 'File type not allowed. Allowed types: ' . implode(', ', $this->allowedTypes)
            ]);
        }
        
        // Check if file is actually uploaded
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new ValidationException(['file' => 'Invalid file upload']);
        }
    }
    
    /**
     * Delete file
     */
    public function deleteFile($filepath) {
        $fullPath = $this->uploadDir . $filepath;
        
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        
        return false;
    }
    
    /**
     * Get file info
     */
    public function getFileInfo($filepath) {
        $fullPath = $this->uploadDir . $filepath;
        
        if (!file_exists($fullPath)) {
            return null;
        }
        
        return [
            'size' => filesize($fullPath),
            'modified' => filemtime($fullPath),
            'mime_type' => mime_content_type($fullPath)
        ];
    }
}
