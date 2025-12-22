<?php
namespace Mkaka\Exceptions;

/**
 * Custom Exception Classes
 * 
 * @project Mkaka Construction Management System
 * @author Anthony Kanjira (CEN/01/01/22)
 * @supervisor Mr. John Kaira
 */

// ============================================================================
// FILE: src/exceptions/ValidationException.php
// ============================================================================

/**
 * Validation Exception
 * 
 * Thrown when user input fails validation rules
 */
class ValidationException extends \Exception {
    
    /**
     * Validation errors array
     */
    protected $errors;
    
    /**
     * Constructor
     * 
     * @param array $errors Validation error messages
     * @param string $message General error message
     * @param int $code Error code
     */
    public function __construct($errors = [], $message = "Validation failed", $code = 422) {
        parent::__construct($message, $code);
        $this->errors = $errors;
    }
    
    /**
     * Get validation errors
     * 
     * @return array
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * Get first error message
     * 
     * @return string|null
     */
    public function getFirstError() {
        if (empty($this->errors)) {
            return null;
        }
        
        $firstField = array_key_first($this->errors);
        return is_array($this->errors[$firstField]) 
            ? $this->errors[$firstField][0] 
            : $this->errors[$firstField];
    }
    
    /**
     * Check if specific field has error
     * 
     * @param string $field Field name
     * @return bool
     */
    public function hasError($field) {
        return isset($this->errors[$field]);
    }
    
    /**
     * Get error for specific field
     * 
     * @param string $field Field name
     * @return string|array|null
     */
    public function getError($field) {
        return $this->errors[$field] ?? null;
    }
    
    /**
     * Convert to JSON response
     * 
     * @return array
     */
    public function toJson() {
        return [
            'success' => false,
            'error' => 'Validation failed',
            'message' => $this->getMessage(),
            'errors' => $this->errors,
            'code' => 'VALIDATION_ERROR'
        ];
    }
}
