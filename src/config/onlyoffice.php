<?php
// OnlyOffice Configuration
defined('APP_ROOT') or die('Direct access not permitted');

return [
    'document_server_url' => getenv('ONLYOFFICE_URL') ?: 'http://localhost:8080',
    'jwt_secret' => getenv('ONLYOFFICE_JWT_SECRET') ?: 'mkaka_onlyoffice_secret_2026_change_in_production',
    'jwt_header' => 'Authorization',
    'verify_peer_off' => true, // Set to false in production with valid SSL
];
