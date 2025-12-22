<?php
namespace Mkaka\Core;

class Validator {
    private $errors = [];
    
    /**
     * Validate data against rules
     */
    public function validate($data, $rules) {
        $this->errors = [];
        
        foreach ($rules as $field => $ruleString) {
            $fieldRules = explode('|', $ruleString);
            
            foreach ($fieldRules as $rule) {
                $this->applyRule($field, $data[$field] ?? null, $rule);
            }
        }
        
        return empty($this->errors);
    }
    
    /**
     * Apply validation rule
     */
    private function applyRule($field, $value, $rule) {
        if (strpos($rule, ':') !== false) {
            list($ruleName, $ruleValue) = explode(':', $rule);
        } else {
            $ruleName = $rule;
            $ruleValue = null;
        }
        
        switch ($ruleName) {
            case 'required':
                if (empty($value)) {
                    $this->errors[$field][] = "$field is required";
                }
                break;
                
            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[$field][] = "$field must be a valid email";
                }
                break;
                
            case 'min':
                if (strlen($value) < $ruleValue) {
                    $this->errors[$field][] = "$field must be at least $ruleValue characters";
                }
                break;
                
            case 'max':
                if (strlen($value) > $ruleValue) {
                    $this->errors[$field][] = "$field must not exceed $ruleValue characters";
                }
                break;
                
            case 'numeric':
                if (!is_numeric($value)) {
                    $this->errors[$field][] = "$field must be numeric";
                }
                break;
                
            case 'alpha':
                if (!ctype_alpha($value)) {
                    $this->errors[$field][] = "$field must contain only letters";
                }
                break;
                
            case 'alphanumeric':
                if (!ctype_alnum($value)) {
                    $this->errors[$field][] = "$field must be alphanumeric";
                }
                break;
                
            case 'url':
                if (!filter_var($value, FILTER_VALIDATE_URL)) {
                    $this->errors[$field][] = "$field must be a valid URL";
                }
                break;
        }
    }
    
    /**
     * Get validation errors
     */
    public function errors() {
        return $this->errors;
    }
    
    /**
     * Check if validation failed
     */
    public function fails() {
        return !empty($this->errors);
    }
}
