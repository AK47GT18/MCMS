<?php
namespace Mkaka\Core;

// src/core/RedisCache.php

class RedisCache {
    private static $redis = null;
    
    public static function getInstance() {
        if (self::$redis === null) {
            self::$redis = new Redis();
            self::$redis->connect(
                getenv('REDIS_HOST') ?: '127.0.0.1',
                getenv('REDIS_PORT') ?: 6379
            );
            if ($pass = getenv('REDIS_PASSWORD')) {
                self::$redis->auth($pass);
            }
        }
        return self::$redis;
    }
    
    public static function get($key) {
        $redis = self::getInstance();
        $value = $redis->get($key);
        return $value ? json_decode($value, true) : null;
    }
    
    public static function set($key, $value, $ttl = 3600) {
        $redis = self::getInstance();
        return $redis->setex($key, $ttl, json_encode($value));
    }
    
    public static function delete($key) {
        $redis = self::getInstance();
        return $redis->del($key);
    }
    
    public static function flush() {
        $redis = self::getInstance();
        return $redis->flushDB();
    }
}