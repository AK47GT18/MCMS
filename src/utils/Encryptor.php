<?php
class Encryptor {
    
    private static $cipher = 'AES-256-CBC';
    
    /**
     * Get encryption key from config
     */
    private static function getKey() {
        $key = getenv('APP_KEY');
        if (!$key) {
            throw new Exception("Encryption key not set");
        }
        return substr(hash('sha256', $key, true), 0, 32);
    }
    
    /**
     * Encrypt data
     */
    public static function encrypt($data) {
        $key = self::getKey();
        $iv = random_bytes(openssl_cipher_iv_length(self::$cipher));
        
        $encrypted = openssl_encrypt($data, self::$cipher, $key, 0, $iv);
        
        if ($encrypted === false) {
            throw new Exception("Encryption failed");
        }
        
        // Combine IV and encrypted data
        return base64_encode($iv . $encrypted);
    }
    
    /**
     * Decrypt data
     */
    public static function decrypt($data) {
        $key = self::getKey();
        $data = base64_decode($data);
        
        $ivLength = openssl_cipher_iv_length(self::$cipher);
        $iv = substr($data, 0, $ivLength);
        $encrypted = substr($data, $ivLength);
        
        $decrypted = openssl_decrypt($encrypted, self::$cipher, $key, 0, $iv);
        
        if ($decrypted === false) {
            throw new Exception("Decryption failed");
        }
        
        return $decrypted;
    }
    
    /**
     * Hash password (FR-18)
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }
    
    /**
     * Verify password
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Generate random token
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Hash data (one-way)
     */
    public static function hash($data) {
        return hash('sha256', $data);
    }
}