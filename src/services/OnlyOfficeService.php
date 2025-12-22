<?php
namespace Mkaka\Services;

use Mkaka\Repositories\UserRepository;

class OnlyOfficeService {
    
    private $documentServerUrl;
    private $jwtSecret;
    
    public function __construct() {
        $this->documentServerUrl = getenv('ONLYOFFICE_URL') ?: 'http://onlyoffice';
        $this->jwtSecret = getenv('ONLYOFFICE_JWT_SECRET');
    }
    
    /**
     * Generate OnlyOffice editor config
     */
    public function generateEditorConfig($documentId, $documentPath, $userId) {
        $user = (new \Mkaka\Repositories\UserRepository())->findById($userId);
        
        $config = [
            'document' => [
                'fileType' => pathinfo($documentPath, PATHINFO_EXTENSION),
                'key' => md5($documentId . filemtime($documentPath)),
                'title' => basename($documentPath),
                'url' => $this->getDocumentUrl($documentPath),
                'permissions' => [
                    'edit' => true,
                    'download' => true,
                    'print' => true
                ]
            ],
            'documentType' => $this->getDocumentType($documentPath),
            'editorConfig' => [
                'callbackUrl' => getenv('APP_URL') . '/api/v1/onlyoffice/callback',
                'lang' => 'en',
                'user' => [
                    'id' => $userId,
                    'name' => $user['first_name'] . ' ' . $user['last_name']
                ],
                'customization' => [
                    'autosave' => true,
                    'forcesave' => false,
                    'logo' => [
                        'image' => getenv('APP_URL') . '/images/logos/mkaka-logo.png',
                        'url' => getenv('APP_URL')
                    ]
                ]
            ]
        ];
        
        // Sign config with JWT
        if ($this->jwtSecret) {
            $config['token'] = $this->generateJWT($config);
        }
        
        return $config;
    }
    
    private function generateJWT($payload) {
        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $payload = json_encode($payload);
        
        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payload);
        
        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            $this->jwtSecret,
            true
        );
        
        $base64UrlSignature = $this->base64UrlEncode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
    
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private function getDocumentType($path) {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $types = [
            'doc' => 'word', 'docx' => 'word', 'odt' => 'word',
            'xls' => 'cell', 'xlsx' => 'cell', 'ods' => 'cell',
            'ppt' => 'slide', 'pptx' => 'slide', 'odp' => 'slide',
            'pdf' => 'word'
        ];
        return $types[$ext] ?? 'word';
    }
    
    private function getDocumentUrl($path) {
        return getenv('APP_URL') . '/storage/documents/' . basename($path);
    }
}