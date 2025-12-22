<?php
/**
 * GPS Extractor Utility
 * 
 * @file GpsExtractor.php
 * @description Extract GPS data from images (FR-14, FR-15)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

namespace Mkaka\Utils;

class GpsExtractor {
    
    /**
     * Extract GPS coordinates from image (FR-15)
     * 
     * @param string $imagePath Path to image file
     * @return array|null GPS data or null if not found
     * @throws Exception If validation fails or file not found
     */
    public static function extractFromImage($imagePath) {
        if (!file_exists($imagePath)) {
            throw new Exception("Image file not found: {$imagePath}");
        }
        
        if (!function_exists('exif_read_data')) {
            throw new Exception("EXIF extension not available. Please enable php_exif extension.");
        }
        
        // Read EXIF data
        $exif = @exif_read_data($imagePath, 0, true);
        
        if (!$exif || !isset($exif['GPS'])) {
            throw new Exception("No GPS data found in image");
        }
        
        $gps = $exif['GPS'];
        
        // Check if required GPS data exists
        if (!isset($gps['GPSLatitude']) || !isset($gps['GPSLongitude']) ||
            !isset($gps['GPSLatitudeRef']) || !isset($gps['GPSLongitudeRef'])) {
            throw new Exception("Incomplete GPS data in image");
        }
        
        // Convert coordinates to decimal degrees
        $latitude = self::convertToDecimal($gps['GPSLatitude'], $gps['GPSLatitudeRef']);
        $longitude = self::convertToDecimal($gps['GPSLongitude'], $gps['GPSLongitudeRef']);
        
        // Validate coordinates are within Malawi boundaries (FR-14)
        if (!self::validateMalawiCoordinates($latitude, $longitude)) {
            throw new Exception(
                "GPS coordinates ({$latitude}, {$longitude}) are outside Malawi boundaries. " .
                "Expected: Latitude " . MALAWI_MIN_LAT . " to " . MALAWI_MAX_LAT . ", " .
                "Longitude " . MALAWI_MIN_LNG . " to " . MALAWI_MAX_LNG
            );
        }
        
        // Extract additional metadata
        $result = [
            'latitude' => round($latitude, 6),
            'longitude' => round($longitude, 6),
            'altitude' => isset($gps['GPSAltitude']) ? self::convertAltitude($gps['GPSAltitude']) : null,
            'timestamp' => self::extractTimestamp($exif),
            'camera' => self::extractCameraInfo($exif),
            'accuracy' => self::calculateAccuracy($gps),
            'location_string' => self::formatCoordinates($latitude, $longitude),
            'raw_exif' => $gps
        ];
        
        // Log successful extraction
        Logger::info('GPS data extracted from image', [
            'file' => basename($imagePath),
            'latitude' => $result['latitude'],
            'longitude' => $result['longitude']
        ]);
        
        return $result;
    }
    
    /**
     * Convert GPS coordinates to decimal degrees
     * 
     * @param array $coordinate GPS coordinate array [degrees, minutes, seconds]
     * @param string $ref Reference (N/S for latitude, E/W for longitude)
     * @return float Decimal degrees
     */
    private static function convertToDecimal($coordinate, $ref) {
        $degrees = count($coordinate) > 0 ? self::gps2Num($coordinate[0]) : 0;
        $minutes = count($coordinate) > 1 ? self::gps2Num($coordinate[1]) : 0;
        $seconds = count($coordinate) > 2 ? self::gps2Num($coordinate[2]) : 0;
        
        // Calculate decimal degrees
        $decimal = $degrees + ($minutes / 60) + ($seconds / 3600);
        
        // Apply hemisphere reference
        if ($ref == 'S' || $ref == 'W') {
            $decimal *= -1;
        }
        
        return $decimal;
    }
    
    /**
     * Convert GPS fraction to number
     * 
     * @param string $coordPart Coordinate part (e.g., "41/1")
     * @return float Numeric value
     */
    private static function gps2Num($coordPart) {
        $parts = explode('/', $coordPart);
        
        if (count($parts) <= 0) {
            return 0;
        }
        
        if (count($parts) == 1) {
            return (float)$parts[0];
        }
        
        // Handle division
        $numerator = floatval($parts[0]);
        $denominator = floatval($parts[1]);
        
        if ($denominator == 0) {
            return 0;
        }
        
        return $numerator / $denominator;
    }
    
    /**
     * Convert altitude from EXIF format
     * 
     * @param string $altitude Altitude value
     * @return float Altitude in meters
     */
    private static function convertAltitude($altitude) {
        return round(self::gps2Num($altitude), 2);
    }
    
    /**
     * Extract timestamp from EXIF data
     * 
     * @param array $exif Complete EXIF data
     * @return string|null Formatted timestamp
     */
    private static function extractTimestamp($exif) {
        // Try different timestamp fields in order of preference
        $timestampFields = [
            ['GPS', 'GPSDateStamp'],
            ['EXIF', 'DateTimeOriginal'],
            ['EXIF', 'DateTimeDigitized'],
            ['IFD0', 'DateTime']
        ];
        
        foreach ($timestampFields as $field) {
            list($section, $key) = $field;
            if (isset($exif[$section][$key])) {
                $timestamp = $exif[$section][$key];
                
                // Handle GPS timestamp separately (combine date and time)
                if ($section == 'GPS' && $key == 'GPSDateStamp') {
                    $time = isset($exif['GPS']['GPSTimeStamp']) ? 
                            self::formatGPSTime($exif['GPS']['GPSTimeStamp']) : '00:00:00';
                    return str_replace(':', '-', $timestamp) . ' ' . $time;
                }
                
                return $timestamp;
            }
        }
        
        return null;
    }
    
    /**
     * Format GPS time from array
     * 
     * @param array $timeArray GPS time array [hours, minutes, seconds]
     * @return string Formatted time (HH:MM:SS)
     */
    private static function formatGPSTime($timeArray) {
        $hours = isset($timeArray[0]) ? self::gps2Num($timeArray[0]) : 0;
        $minutes = isset($timeArray[1]) ? self::gps2Num($timeArray[1]) : 0;
        $seconds = isset($timeArray[2]) ? self::gps2Num($timeArray[2]) : 0;
        
        return sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
    }
    
    /**
     * Extract camera information from EXIF
     * 
     * @param array $exif Complete EXIF data
     * @return array|null Camera information
     */
    private static function extractCameraInfo($exif) {
        $camera = [];
        
        // Camera make and model
        if (isset($exif['IFD0']['Make'])) {
            $camera['make'] = trim($exif['IFD0']['Make']);
        }
        
        if (isset($exif['IFD0']['Model'])) {
            $camera['model'] = trim($exif['IFD0']['Model']);
        }
        
        // Camera settings
        if (isset($exif['EXIF']['ExposureTime'])) {
            $camera['exposure_time'] = $exif['EXIF']['ExposureTime'];
        }
        
        if (isset($exif['EXIF']['FNumber'])) {
            $camera['f_number'] = $exif['EXIF']['FNumber'];
        }
        
        if (isset($exif['EXIF']['ISOSpeedRatings'])) {
            $camera['iso'] = $exif['EXIF']['ISOSpeedRatings'];
        }
        
        if (isset($exif['EXIF']['FocalLength'])) {
            $camera['focal_length'] = $exif['EXIF']['FocalLength'];
        }
        
        return !empty($camera) ? $camera : null;
    }
    
    /**
     * Calculate GPS accuracy from DOP values
     * 
     * @param array $gps GPS EXIF data
     * @return float|null Estimated accuracy in meters
     */
    private static function calculateAccuracy($gps) {
        // Check for DOP (Dilution of Precision) values
        if (isset($gps['GPSDOP'])) {
            $dop = self::gps2Num($gps['GPSDOP']);
            // Rough estimation: DOP * 5 meters
            return round($dop * 5, 2);
        }
        
        return null;
    }
    
    /**
     * Validate coordinates are within Malawi boundaries (FR-14)
     * 
     * @param float $latitude Latitude in decimal degrees
     * @param float $longitude Longitude in decimal degrees
     * @return bool True if within Malawi
     */
    public static function validateMalawiCoordinates($latitude, $longitude) {
        $withinLatitude = ($latitude >= MALAWI_MIN_LAT && $latitude <= MALAWI_MAX_LAT);
        $withinLongitude = ($longitude >= MALAWI_MIN_LNG && $longitude <= MALAWI_MAX_LNG);
        
        return $withinLatitude && $withinLongitude;
    }
    
    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     * 
     * @param float $lat1 First latitude
     * @param float $lon1 First longitude
     * @param float $lat2 Second latitude
     * @param float $lon2 Second longitude
     * @param string $unit Unit of measurement (km or mi)
     * @return float Distance
     */
    public static function calculateDistance($lat1, $lon1, $lat2, $lon2, $unit = 'km') {
        $earthRadius = $unit === 'mi' ? 3959 : 6371; // Miles or Kilometers
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        $distance = $earthRadius * $c;
        
        return round($distance, 2);
    }
    
    /**
     * Format coordinates for display
     * 
     * @param float $latitude Latitude
     * @param float $longitude Longitude
     * @param string $format Format type (decimal, dms, or link)
     * @return string Formatted coordinates
     */
    public static function formatCoordinates($latitude, $longitude, $format = 'decimal') {
        switch ($format) {
            case 'dms': // Degrees, Minutes, Seconds
                return self::convertToDMS($latitude, 'lat') . ', ' . 
                       self::convertToDMS($longitude, 'lng');
            
            case 'link': // Google Maps link
                return "https://www.google.com/maps?q={$latitude},{$longitude}";
            
            case 'decimal':
            default:
                return round($latitude, 6) . ', ' . round($longitude, 6);
        }
    }
    
    /**
     * Convert decimal degrees to DMS (Degrees, Minutes, Seconds) format
     * 
     * @param float $decimal Decimal degrees
     * @param string $type Coordinate type (lat or lng)
     * @return string Formatted DMS string
     */
    private static function convertToDMS($decimal, $type) {
        $degrees = floor(abs($decimal));
        $minutesDecimal = (abs($decimal) - $degrees) * 60;
        $minutes = floor($minutesDecimal);
        $seconds = round(($minutesDecimal - $minutes) * 60, 2);
        
        // Determine direction
        if ($type == 'lat') {
            $direction = $decimal >= 0 ? 'N' : 'S';
        } else {
            $direction = $decimal >= 0 ? 'E' : 'W';
        }
        
        return "{$degrees}° {$minutes}' {$seconds}\" {$direction}";
    }
    
    /**
     * Check if image has GPS data
     * 
     * @param string $imagePath Path to image file
     * @return bool True if GPS data exists
     */
    public static function hasGpsData($imagePath) {
        if (!file_exists($imagePath) || !function_exists('exif_read_data')) {
            return false;
        }
        
        $exif = @exif_read_data($imagePath, 0, true);
        
        return isset($exif['GPS']) && 
               isset($exif['GPS']['GPSLatitude']) && 
               isset($exif['GPS']['GPSLongitude']);
    }
    
    /**
     * Extract all EXIF data from image
     * 
     * @param string $imagePath Path to image file
     * @return array|null All EXIF data
     */
    public static function extractAllExif($imagePath) {
        if (!file_exists($imagePath)) {
            return null;
        }
        
        if (!function_exists('exif_read_data')) {
            return null;
        }
        
        return @exif_read_data($imagePath, 0, true);
    }
    
    /**
     * Strip GPS data from image (for privacy)
     * 
     * @param string $imagePath Source image path
     * @param string|null $outputPath Output path (if null, overwrites source)
     * @return string Output file path
     * @throws Exception If operation fails
     */
    public static function stripGpsData($imagePath, $outputPath = null) {
        if (!file_exists($imagePath)) {
            throw new Exception("Image file not found");
        }
        
        $outputPath = $outputPath ?: $imagePath;
        
        // Get image info
        $imageInfo = getimagesize($imagePath);
        if (!$imageInfo) {
            throw new Exception("Invalid image file");
        }
        
        $imageType = $imageInfo[2];
        
        // Load and save image (this strips EXIF data)
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $image = imagecreatefromjpeg($imagePath);
                imagejpeg($image, $outputPath, 90);
                imagedestroy($image);
                break;
                
            case IMAGETYPE_PNG:
                $image = imagecreatefrompng($imagePath);
                imagepng($image, $outputPath, 9);
                imagedestroy($image);
                break;
                
            default:
                throw new Exception("Unsupported image type for GPS stripping");
        }
        
        Logger::info('GPS data stripped from image', ['file' => basename($imagePath)]);
        
        return $outputPath;
    }
    
    /**
     * Get reverse geocoding (location name from coordinates)
     * Note: This is a placeholder - requires external API integration
     * 
     * @param float $latitude Latitude
     * @param float $longitude Longitude
     * @return array Location information
     */
    public static function reverseGeocode($latitude, $longitude) {
        // This would integrate with:
        // - OpenStreetMap Nominatim (free)
        // - Google Maps Geocoding API
        // - MapBox Geocoding API
        
        // Placeholder response
        return [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'country' => 'Malawi',
            'region' => self::getMalawiRegion($latitude, $longitude),
            'formatted_address' => self::formatCoordinates($latitude, $longitude, 'dms'),
            'map_link' => self::formatCoordinates($latitude, $longitude, 'link')
        ];
    }
    
    /**
     * Determine Malawi region from coordinates (approximate)
     * 
     * @param float $latitude Latitude
     * @param float $longitude Longitude
     * @return string Region name
     */
    private static function getMalawiRegion($latitude, $longitude) {
        // Approximate regional boundaries
        if ($latitude > -11) {
            return 'Northern Region';
        } elseif ($latitude > -14) {
            return 'Central Region';
        } else {
            return 'Southern Region';
        }
    }
    
    /**
     * Validate GPS data quality
     * 
     * @param array $gpsData GPS data array
     * @return array Validation result with quality score
     */
    public static function validateGpsQuality($gpsData) {
        $score = 100;
        $issues = [];
        
        // Check for required fields
        if (!isset($gpsData['latitude']) || !isset($gpsData['longitude'])) {
            $score -= 100;
            $issues[] = 'Missing coordinates';
            return ['score' => 0, 'quality' => 'invalid', 'issues' => $issues];
        }
        
        // Check accuracy
        if (isset($gpsData['accuracy'])) {
            if ($gpsData['accuracy'] > 50) {
                $score -= 30;
                $issues[] = 'Low accuracy (>' . $gpsData['accuracy'] . 'm)';
            } elseif ($gpsData['accuracy'] > 20) {
                $score -= 15;
                $issues[] = 'Moderate accuracy (' . $gpsData['accuracy'] . 'm)';
            }
        }
        
        // Check timestamp
        if (!isset($gpsData['timestamp'])) {
            $score -= 10;
            $issues[] = 'No timestamp';
        }
        
        // Check altitude
        if (!isset($gpsData['altitude'])) {
            $score -= 5;
            $issues[] = 'No altitude data';
        }
        
        // Determine quality level
        if ($score >= 90) {
            $quality = 'excellent';
        } elseif ($score >= 70) {
            $quality = 'good';
        } elseif ($score >= 50) {
            $quality = 'fair';
        } else {
            $quality = 'poor';
        }
        
        return [
            'score' => $score,
            'quality' => $quality,
            'issues' => $issues
        ];
    }
}