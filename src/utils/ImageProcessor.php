<?php
/**
 * Image Processor Utility
 * 
 * @file ImageProcessor.php
 * @description Image manipulation and optimization for site reports
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

namespace Mkaka\Utils;

class ImageProcessor {
    
    private $image;
    private $imageType;
    private $width;
    private $height;
    private $originalPath;
    
    /**
     * Load image from file
     * 
     * @param string $filepath Path to image file
     * @return ImageProcessor Current instance for chaining
     * @throws Exception If file not found or invalid
     */
    public function load($filepath) {
        if (!file_exists($filepath)) {
            throw new Exception("Image file not found: {$filepath}");
        }
        
        $this->originalPath = $filepath;
        
        // Get image information
        $imageInfo = getimagesize($filepath);
        if (!$imageInfo) {
            throw new Exception("Invalid image file or unsupported format");
        }
        
        $this->width = $imageInfo[0];
        $this->height = $imageInfo[1];
        $this->imageType = $imageInfo[2];
        
        // Create image resource based on type
        switch ($this->imageType) {
            case IMAGETYPE_JPEG:
                $this->image = imagecreatefromjpeg($filepath);
                break;
                
            case IMAGETYPE_PNG:
                $this->image = imagecreatefrompng($filepath);
                break;
                
            case IMAGETYPE_GIF:
                $this->image = imagecreatefromgif($filepath);
                break;
                
            default:
                throw new Exception("Unsupported image type. Supported: JPEG, PNG, GIF");
        }
        
        if (!$this->image) {
            throw new Exception("Failed to create image resource");
        }
        
        Logger::debug('Image loaded', [
            'file' => basename($filepath),
            'dimensions' => "{$this->width}x{$this->height}",
            'type' => image_type_to_mime_type($this->imageType)
        ]);
        
        return $this;
    }
    
    /**
     * Resize image while maintaining or ignoring aspect ratio
     * 
     * @param int $width Target width
     * @param int $height Target height
     * @param bool $maintainAspectRatio Keep aspect ratio
     * @return ImageProcessor Current instance for chaining
     */
    public function resize($width, $height, $maintainAspectRatio = true) {
        if ($maintainAspectRatio) {
            // Calculate new dimensions maintaining aspect ratio
            $ratio = min($width / $this->width, $height / $this->height);
            $newWidth = (int)($this->width * $ratio);
            $newHeight = (int)($this->height * $ratio);
        } else {
            $newWidth = $width;
            $newHeight = $height;
        }
        
        // Create new image
        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        
        // Preserve transparency for PNG and GIF
        if ($this->imageType === IMAGETYPE_PNG || $this->imageType === IMAGETYPE_GIF) {
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
            $transparent = imagecolorallocatealpha($newImage, 255, 255, 255, 127);
            imagefilledrectangle($newImage, 0, 0, $newWidth, $newHeight, $transparent);
        }
        
        // Resample image
        imagecopyresampled(
            $newImage, $this->image,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $this->width, $this->height
        );
        
        // Replace old image
        imagedestroy($this->image);
        $this->image = $newImage;
        $this->width = $newWidth;
        $this->height = $newHeight;
        
        Logger::debug('Image resized', ['new_dimensions' => "{$newWidth}x{$newHeight}"]);
        
        return $this;
    }
    
    /**
     * Create square thumbnail
     * 
     * @param int $size Thumbnail size (width and height)
     * @return ImageProcessor Current instance for chaining
     */
    public function thumbnail($size) {
        // Calculate crop dimensions for square center crop
        $cropSize = min($this->width, $this->height);
        $x = ($this->width - $cropSize) / 2;
        $y = ($this->height - $cropSize) / 2;
        
        // Crop to square first
        $this->crop($x, $y, $cropSize, $cropSize);
        
        // Then resize to desired thumbnail size
        return $this->resize($size, $size, false);
    }
    
    /**
     * Crop image to specified dimensions
     * 
     * @param int $x Starting X coordinate
     * @param int $y Starting Y coordinate
     * @param int $width Crop width
     * @param int $height Crop height
     * @return ImageProcessor Current instance for chaining
     */
    public function crop($x, $y, $width, $height) {
        // Validate crop dimensions
        if ($x < 0 || $y < 0 || $width <= 0 || $height <= 0) {
            throw new Exception("Invalid crop dimensions");
        }
        
        if (($x + $width) > $this->width || ($y + $height) > $this->height) {
            throw new Exception("Crop dimensions exceed image boundaries");
        }
        
        $newImage = imagecreatetruecolor($width, $height);
        
        // Preserve transparency
        if ($this->imageType === IMAGETYPE_PNG || $this->imageType === IMAGETYPE_GIF) {
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
        }
        
        // Copy cropped portion
        imagecopy($newImage, $this->image, 0, 0, $x, $y, $width, $height);
        
        imagedestroy($this->image);
        $this->image = $newImage;
        $this->width = $width;
        $this->height = $height;
        
        return $this;
    }
    
    /**
     * Rotate image by angle
     * 
     * @param float $angle Rotation angle in degrees (counterclockwise)
     * @param int $bgColor Background color (default: transparent/white)
     * @return ImageProcessor Current instance for chaining
     */
    public function rotate($angle, $bgColor = 0) {
        $this->image = imagerotate($this->image, $angle, $bgColor);
        
        // Update dimensions
        $this->width = imagesx($this->image);
        $this->height = imagesy($this->image);
        
        return $this;
    }
    
    /**
     * Add watermark to image
     * 
     * @param string $watermarkPath Path to watermark image (PNG with transparency)
     * @param string $position Position (top-left, top-right, bottom-left, bottom-right, center)
     * @param int $opacity Opacity (0-100)
     * @param int $padding Padding from edges in pixels
     * @return ImageProcessor Current instance for chaining
     */
    public function watermark($watermarkPath, $position = 'bottom-right', $opacity = 50, $padding = 10) {
        if (!file_exists($watermarkPath)) {
            throw new Exception("Watermark file not found");
        }
        
        $watermark = imagecreatefrompng($watermarkPath);
        if (!$watermark) {
            throw new Exception("Failed to load watermark");
        }
        
        $watermarkWidth = imagesx($watermark);
        $watermarkHeight = imagesy($watermark);
        
        // Calculate position
        switch ($position) {
            case 'top-left':
                $destX = $padding;
                $destY = $padding;
                break;
            case 'top-right':
                $destX = $this->width - $watermarkWidth - $padding;
                $destY = $padding;
                break;
            case 'bottom-left':
                $destX = $padding;
                $destY = $this->height - $watermarkHeight - $padding;
                break;
            case 'bottom-right':
            default:
                $destX = $this->width - $watermarkWidth - $padding;
                $destY = $this->height - $watermarkHeight - $padding;
                break;
            case 'center':
                $destX = ($this->width - $watermarkWidth) / 2;
                $destY = ($this->height - $watermarkHeight) / 2;
                break;
        }
        
        // Apply watermark with opacity
        imagecopymerge(
            $this->image, $watermark,
            $destX, $destY,
            0, 0,
            $watermarkWidth, $watermarkHeight,
            $opacity
        );
        
        imagedestroy($watermark);
        
        return $this;
    }
    
    /**
     * Add text overlay to image (e.g., timestamp, location)
     * 
     * @param string $text Text to add
     * @param int $size Font size (1-5 for built-in fonts, or point size for TTF)
     * @param array $color RGB color array [R, G, B]
     * @param string $position Position (same as watermark)
     * @param int $padding Padding from edges
     * @param string|null $fontPath Path to TTF font file (optional)
     * @return ImageProcessor Current instance for chaining
     */
    public function addText($text, $size = 3, $color = [255, 255, 255], $position = 'bottom-right', $padding = 10, $fontPath = null) {
        $textColor = imagecolorallocate($this->image, $color[0], $color[1], $color[2]);
        
        // Add semi-transparent background for better readability
        $bgColor = imagecolorallocatealpha($this->image, 0, 0, 0, 75);
        
        if ($fontPath && file_exists($fontPath)) {
            // Use TrueType font
            $bbox = imagettfbbox($size, 0, $fontPath, $text);
            $textWidth = abs($bbox[4] - $bbox[0]);
            $textHeight = abs($bbox[5] - $bbox[1]);
        } else {
            // Use built-in font
            $textWidth = imagefontwidth($size) * strlen($text);
            $textHeight = imagefontheight($size);
        }
        
        // Calculate position
        switch ($position) {
            case 'top-left':
                $x = $padding;
                $y = $padding;
                break;
            case 'top-right':
                $x = $this->width - $textWidth - $padding;
                $y = $padding;
                break;
            case 'bottom-left':
                $x = $padding;
                $y = $this->height - $textHeight - $padding;
                break;
            case 'bottom-right':
            default:
                $x = $this->width - $textWidth - $padding;
                $y = $this->height - $textHeight - $padding;
                break;
            case 'center':
                $x = ($this->width - $textWidth) / 2;
                $y = ($this->height - $textHeight) / 2;
                break;
        }
        
        // Draw background rectangle
        imagefilledrectangle(
            $this->image,
            $x - 5, $y - 5,
            $x + $textWidth + 5, $y + $textHeight + 5,
            $bgColor
        );
        
        // Draw text
        if ($fontPath && file_exists($fontPath)) {
            imagettftext($this->image, $size, 0, $x, $y + $textHeight, $textColor, $fontPath, $text);
        } else {
            imagestring($this->image, $size, $x, $y, $text, $textColor);
        }
        
        return $this;
    }
    
    /**
     * Apply grayscale filter
     * 
     * @return ImageProcessor Current instance for chaining
     */
    public function grayscale() {
        imagefilter($this->image, IMG_FILTER_GRAYSCALE);
        return $this;
    }
    
    /**
     * Adjust brightness (-255 to 255)
     * 
     * @param int $level Brightness level
     * @return ImageProcessor Current instance for chaining
     */
    public function brightness($level) {
        imagefilter($this->image, IMG_FILTER_BRIGHTNESS, $level);
        return $this;
    }
    
    /**
     * Adjust contrast (-100 to 100)
     * 
     * @param int $level Contrast level
     * @return ImageProcessor Current instance for chaining
     */
    public function contrast($level) {
        imagefilter($this->image, IMG_FILTER_CONTRAST, $level);
        return $this;
    }
    
    /**
     * Apply blur filter
     * 
     * @param int $passes Number of blur passes
     * @return ImageProcessor Current instance for chaining
     */
    public function blur($passes = 1) {
        for ($i = 0; $i < $passes; $i++) {
            imagefilter($this->image, IMG_FILTER_GAUSSIAN_BLUR);
        }
        return $this;
    }
    
    /**
     * Sharpen image
     * 
     * @return ImageProcessor Current instance for chaining
     */
    public function sharpen() {
        $matrix = array(
            array(-1, -1, -1),
            array(-1, 16, -1),
            array(-1, -1, -1)
        );
        $divisor = 8;
        $offset = 0;
        
        imageconvolution($this->image, $matrix, $divisor, $offset);
        return $this;
    }
    
    /**
     * Save image to file
     * 
     * @param string $filepath Output file path
     * @param int $quality Quality (0-100 for JPEG, 0-9 for PNG)
     * @return string Saved file path
     */
    public function save($filepath, $quality = 90) {
        $directory = dirname($filepath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        
        $extension = strtolower(pathinfo($filepath, PATHINFO_EXTENSION));
        
        switch ($extension) {
            case 'jpg':
            case 'jpeg':
                $result = imagejpeg($this->image, $filepath, $quality);
                break;
                
            case 'png':
                // PNG quality: 0 (best compression) to 9 (no compression)
                $pngQuality = round((100 - $quality) / 11);
                $result = imagepng($this->image, $filepath, $pngQuality);
                break;
                
            case 'gif':
                $result = imagegif($this->image, $filepath);
                break;
                
            default:
                throw new Exception("Unsupported save format: {$extension}. Use jpg, png, or gif");
        }
        
        if (!$result) {
            throw new Exception("Failed to save image to: {$filepath}");
        }
        
        chmod($filepath, 0644);
        
        Logger::info('Image saved', [
            'file' => basename($filepath),
            'size' => filesize($filepath) . ' bytes'
        ]);
        
        return $filepath;
    }
    
    /**
     * Output image directly to browser
     * 
     * @param string $format Output format (jpeg, png, gif)
     * @param int $quality Quality setting
     */
    public function output($format = 'jpeg', $quality = 90) {
        switch ($format) {
            case 'jpeg':
            case 'jpg':
                header('Content-Type: image/jpeg');
                imagejpeg($this->image, null, $quality);
                break;
                
            case 'png':
                header('Content-Type: image/png');
                $pngQuality = round((100 - $quality) / 11);
                imagepng($this->image, null, $pngQuality);
                break;
                
            case 'gif':
                header('Content-Type: image/gif');
                imagegif($this->image);
                break;
                
            default:
                throw new Exception("Unsupported output format: {$format}");
        }
    }
    
    /**
     * Get current image dimensions
     * 
     * @return array Array with 'width' and 'height' keys
     */
    public function getDimensions() {
        return [
            'width' => $this->width,
            'height' => $this->height,
            'aspect_ratio' => round($this->width / $this->height, 2)
        ];
    }
    
    /**
     * Optimize image for web (resize if too large, compress)
     * 
     * @param int $maxWidth Maximum width
     * @param int $maxHeight Maximum height
     * @param int $quality JPEG quality
     * @return ImageProcessor Current instance for chaining
     */
    public function optimize($maxWidth = 1920, $maxHeight = 1080, $quality = 85) {
        // Resize if image is too large
        if ($this->width > $maxWidth || $this->height > $maxHeight) {
            $this->resize($maxWidth, $maxHeight, true);
        }
        
        // Apply slight sharpening after resize
        if ($this->width != imagesx($this->image)) {
            $this->sharpen();
        }
        
        return $this;
    }
    
    /**
     * Create multiple size versions of image
     * 
     * @param string $filepath Base file path
     * @param array $sizes Array of size definitions
     * @return array Array of created file paths
     * 
     * Example:
     * $sizes = [
     *     'thumb' => ['width' => 150, 'height' => 150, 'quality' => 85],
     *     'medium' => ['width' => 800, 'height' => 600, 'quality' => 90],
     *     'large' => ['width' => 1920, 'height' => 1080, 'quality' => 95]
     * ]
     */
    public function createSizes($filepath, $sizes = []) {
        $results = [];
        $directory = dirname($filepath);
        $filename = pathinfo($filepath, PATHINFO_FILENAME);
        $extension = pathinfo($filepath, PATHINFO_EXTENSION);
        
        foreach ($sizes as $name => $dimensions) {
            $newFilepath = "{$directory}/{$filename}_{$name}.{$extension}";
            
            // Clone current processor state
            $processor = clone $this;
            $processor->resize(
                $dimensions['width'], 
                $dimensions['height'], 
                $dimensions['maintain_ratio'] ?? true
            );
            $processor->save($newFilepath, $dimensions['quality'] ?? 90);
            
            $results[$name] = $newFilepath;
        }
        
        return $results;
    }
    
    /**
     * Get image file size
     * 
     * @return int|null File size in bytes, or null if not saved
     */
    public function getFileSize() {
        if ($this->originalPath && file_exists($this->originalPath)) {
            return filesize($this->originalPath);
        }
        return null;
    }
    
    /**
     * Get image MIME type
     * 
     * @return string MIME type
     */
    public function getMimeType() {
        return image_type_to_mime_type($this->imageType);
    }
    
    /**
     * Clone magic method for creating multiple versions
     */
    public function __clone() {
        $newImage = imagecreatetruecolor($this->width, $this->height);
        
        // Preserve transparency if applicable
        if ($this->imageType === IMAGETYPE_PNG || $this->imageType === IMAGETYPE_GIF) {
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
        }
        
        imagecopy($newImage, $this->image, 0, 0, 0, 0, $this->width, $this->height);
        $this->image = $newImage;
    }
    
    /**
     * Cleanup image resource on destruction
     */
    public function __destruct() {
        if (is_resource($this->image)) {
            imagedestroy($this->image);
        }
    }
}