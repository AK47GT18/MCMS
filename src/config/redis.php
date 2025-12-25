<?php
// Redis Configuration
defined('APP_ROOT') or die('Direct access not permitted');

return [
    'host' => getenv('REDIS_HOST') ?: 'redis',
    'port' => getenv('REDIS_PORT') ?: 6379,
    'password' => getenv('REDIS_PASSWORD') ?: 'mkaka_redis_pass_2026',
    'scheme' => 'tcp',
    'timeout' => 5,
];
