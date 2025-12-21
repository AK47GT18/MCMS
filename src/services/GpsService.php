<?php
class GpsService {
    
    // Malawi boundaries from SRS
    private const MALAWI_MIN_LAT = -17.125;
    private const MALAWI_MAX_LAT = -9.367;
    private const MALAWI_MIN_LNG = 32.674;
    private const MALAWI_MAX_LNG = 35.924;
    
    /**
     * Validate coordinates are within Malawi (FR-14)
     */
    public function validateMalawiCoordinates($latitude, $longitude) {
        return ($latitude >= self::MALAWI_MIN_LAT && 
                $latitude <= self::MALAWI_MAX_LAT &&
                $longitude >= self::MALAWI_MIN_LNG && 
                $longitude <= self::MALAWI_MAX_LNG);
    }
    
    /**
     * Extract GPS data from image EXIF (FR-15)
     */
    public function extractGpsFromImage($imagePath) {
        // Check if file exists
        if (!file_exists($imagePath)) {
            return null;
        }
        
        // Read EXIF data
        $exif = @exif_read_data($imagePath);
        
        if (!$exif || !isset($exif['GPSLatitude'], $exif['GPSLongitude'])) {
            return null;
        }
        
        // Convert GPS coordinates
        $latitude = $this->convertGpsCoordinate(
            $exif['GPSLatitude'],
            $exif['GPSLatitudeRef']
        );
        
        $longitude = $this->convertGpsCoordinate(
            $exif['GPSLongitude'],
            $exif['GPSLongitudeRef']
        );
        
        // Extract timestamp
        $timestamp = null;
        if (isset($exif['DateTimeOriginal'])) {
            $timestamp = date('Y-m-d H:i:s', strtotime($exif['DateTimeOriginal']));
        }
        
        return [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'timestamp' => $timestamp,
            'altitude' => $exif['GPSAltitude'] ?? null,
            'camera_make' => $exif['Make'] ?? null,
            'camera_model' => $exif['Model'] ?? null
        ];
    }
    
    /**
     * Convert GPS coordinate from EXIF format to decimal
     */
    private function convertGpsCoordinate($coordinate, $hemisphere) {
        if (!is_array($coordinate) || count($coordinate) < 3) {
            return null;
        }
        
        // Convert degrees, minutes, seconds to decimal
        $degrees = $this->evaluateFraction($coordinate[0]);
        $minutes = $this->evaluateFraction($coordinate[1]);
        $seconds = $this->evaluateFraction($coordinate[2]);
        
        $decimal = $degrees + ($minutes / 60) + ($seconds / 3600);
        
        // Adjust for hemisphere
        if ($hemisphere == 'S' || $hemisphere == 'W') {
            $decimal *= -1;
        }
        
        return round($decimal, 7);
    }
    
    /**
     * Evaluate fraction string from EXIF
     */
    private function evaluateFraction($fraction) {
        if (is_numeric($fraction)) {
            return $fraction;
        }
        
        $parts = explode('/', $fraction);
        if (count($parts) == 2 && $parts[1] != 0) {
            return $parts[0] / $parts[1];
        }
        
        return 0;
    }
    
    /**
     * Calculate distance between two GPS points (Haversine formula)
     */
    public function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // km
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        $distance = $earthRadius * $c;
        
        return round($distance, 2);
    }
}