<?php
namespace Mkaka\Utils;

class DateHelper {
    
    /**
     * Format date for display
     */
    public static function format($date, $format = DISPLAY_DATE_FORMAT) {
        if (!$date) return '';
        
        $timestamp = is_numeric($date) ? $date : strtotime($date);
        return date($format, $timestamp);
    }
    
    /**
     * Format datetime for display
     */
    public static function formatDateTime($datetime, $format = DISPLAY_DATETIME_FORMAT) {
        return self::format($datetime, $format);
    }
    
    /**
     * Get relative time (e.g., "2 hours ago")
     */
    public static function relative($datetime) {
        $timestamp = is_numeric($datetime) ? $datetime : strtotime($datetime);
        $diff = time() - $timestamp;
        
        if ($diff < 60) {
            return 'just now';
        } elseif ($diff < 3600) {
            $minutes = floor($diff / 60);
            return $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 86400) {
            $hours = floor($diff / 3600);
            return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 604800) {
            $days = floor($diff / 86400);
            return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 2592000) {
            $weeks = floor($diff / 604800);
            return $weeks . ' week' . ($weeks > 1 ? 's' : '') . ' ago';
        } elseif ($diff < 31536000) {
            $months = floor($diff / 2592000);
            return $months . ' month' . ($months > 1 ? 's' : '') . ' ago';
        } else {
            $years = floor($diff / 31536000);
            return $years . ' year' . ($years > 1 ? 's' : '') . ' ago';
        }
    }
    
    /**
     * Calculate difference between dates
     */
    public static function diff($date1, $date2, $unit = 'days') {
        $dt1 = new DateTime($date1);
        $dt2 = new DateTime($date2);
        $diff = $dt1->diff($dt2);
        
        switch ($unit) {
            case 'years':
                return $diff->y;
            case 'months':
                return ($diff->y * 12) + $diff->m;
            case 'weeks':
                return floor($diff->days / 7);
            case 'days':
            default:
                return $diff->days;
            case 'hours':
                return ($diff->days * 24) + $diff->h;
            case 'minutes':
                return (($diff->days * 24) + $diff->h) * 60 + $diff->i;
        }
    }
    
    /**
     * Add time to date
     */
    public static function add($date, $amount, $unit = 'days') {
        $dt = new DateTime($date);
        $dt->modify("+{$amount} {$unit}");
        return $dt->format(DATE_FORMAT);
    }
    
    /**
     * Subtract time from date
     */
    public static function subtract($date, $amount, $unit = 'days') {
        $dt = new DateTime($date);
        $dt->modify("-{$amount} {$unit}");
        return $dt->format(DATE_FORMAT);
    }
    
    /**
     * Check if date is past
     */
    public static function isPast($date) {
        return strtotime($date) < time();
    }
    
    /**
     * Check if date is future
     */
    public static function isFuture($date) {
        return strtotime($date) > time();
    }
    
    /**
     * Check if date is today
     */
    public static function isToday($date) {
        return date('Y-m-d', strtotime($date)) === date('Y-m-d');
    }
    
    /**
     * Get start of week
     */
    public static function startOfWeek($date = null) {
        $date = $date ?: date('Y-m-d');
        $dt = new DateTime($date);
        $dt->modify('monday this week');
        return $dt->format(DATE_FORMAT);
    }
    
    /**
     * Get end of week
     */
    public static function endOfWeek($date = null) {
        $date = $date ?: date('Y-m-d');
        $dt = new DateTime($date);
        $dt->modify('sunday this week');
        return $dt->format(DATE_FORMAT);
    }
    
    /**
     * Get start of month
     */
    public static function startOfMonth($date = null) {
        $date = $date ?: date('Y-m-d');
        return date('Y-m-01', strtotime($date));
    }
    
    /**
     * Get end of month
     */
    public static function endOfMonth($date = null) {
        $date = $date ?: date('Y-m-d');
        return date('Y-m-t', strtotime($date));
    }
    
    /**
     * Get business days between dates
     */
    public static function businessDays($startDate, $endDate) {
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);
        $days = 0;
        
        while ($start <= $end) {
            $dayOfWeek = $start->format('N');
            if ($dayOfWeek < 6) { // Monday = 1, Sunday = 7
                $days++;
            }
            $start->modify('+1 day');
        }
        
        return $days;
    }
    
    /**
     * Convert to timezone
     */
    public static function toTimezone($datetime, $timezone = TIMEZONE) {
        $dt = new DateTime($datetime);
        $dt->setTimezone(new DateTimeZone($timezone));
        return $dt->format(DATETIME_FORMAT);
    }
    
    /**
     * Parse various date formats
     */
    public static function parse($dateString) {
        $formats = [
            DATE_FORMAT,
            DATETIME_FORMAT,
            DISPLAY_DATE_FORMAT,
            'd/m/Y',
            'm/d/Y',
            'Y/m/d'
        ];
        
        foreach ($formats as $format) {
            $date = DateTime::createFromFormat($format, $dateString);
            if ($date !== false) {
                return $date->format(DATE_FORMAT);
            }
        }
        
        return null;
    }
    
    /**
     * Get age from birthdate
     */
    public static function age($birthdate) {
        $birth = new DateTime($birthdate);
        $today = new DateTime();
        return $birth->diff($today)->y;
    }
    
    /**
     * Get day name
     */
    public static function dayName($date) {
        return date('l', strtotime($date));
    }
    
    /**
     * Get month name
     */
    public static function monthName($date) {
        return date('F', strtotime($date));
    }
}