<?php
namespace Mkaka\Utils;

class Sanitizer {
    
    /**
     * Sanitize string for output
     */
    public static function string($value) {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Sanitize for HTML attribute
     */
    public static function attribute($value) {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Sanitize email
     */
    public static function email($value) {
        return filter_var($value, FILTER_SANITIZE_EMAIL);
    }
    
    /**
     * Sanitize URL
     */
    public static function url($value) {
        return filter_var($value, FILTER_SANITIZE_URL);
    }
    
    /**
     * Sanitize integer
     */
    public static function int($value) {
        return filter_var($value, FILTER_SANITIZE_NUMBER_INT);
    }
    
    /**
     * Sanitize float
     */
    public static function float($value) {
        return filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }
    
    /**
     * Strip tags but allow specific ones
     */
    public static function html($value, $allowedTags = '<p><br><strong><em><ul><ol><li>') {
        return strip_tags($value, $allowedTags);
    }
    
    /**
     * Sanitize filename
     */
    public static function filename($value) {
        // Remove directory separators
        $value = str_replace(['/', '\\', '..'], '', $value);
        // Remove special characters
        $value = preg_replace('/[^a-zA-Z0-9._-]/', '_', $value);
        return $value;
    }
    
    /**
     * Sanitize array recursively
     */
    public static function array($array) {
        $sanitized = [];
        
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = self::array($value);
            } else {
                $sanitized[$key] = self::string($value);
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Clean SQL input (for display, not querying - use prepared statements!)
     */
    public static function sql($value) {
        return htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Sanitize phone number
     */
    public static function phone($value) {
        return preg_replace('/[^0-9+]/', '', $value);
    }
    
    /**
     * Sanitize JSON
     */
    public static function json($value) {
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return json_encode(self::array($decoded));
        }
        return null;
    }
}
