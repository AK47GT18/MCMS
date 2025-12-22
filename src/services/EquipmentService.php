<?php
namespace Mkaka\Services;

use Mkaka\Repositories\EquipmentRepository;
use Mkaka\Services\AuditService;
use Mkaka\Services\GpsService;

class EquipmentService {
    
    private $equipmentRepository;
    private $auditService;
    private $gpsService;
    
    public function __construct() {
        $this->equipmentRepository = new EquipmentRepository();
        $this->auditService = new AuditService();
        $this->gpsService = new GpsService();
    }
    
    /**
     * Register new equipment (FR-11)
     */
    public function registerEquipment($data) {
        Authorization::require('equipment.create');
        
        $this->validateEquipmentData($data);
        
        $equipmentId = $this->equipmentRepository->create($data);
        
        $user = Authentication::user();
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'equipment_registered',
            'entity_type' => 'equipment',
            'entity_id' => $equipmentId,
            'details' => json_encode([
                'equipment_code' => $data['equipment_code'],
                'name' => $data['name'],
                'type' => $data['type']
            ])
        ]);
        
        return [
            'success' => true,
            'equipment_id' => $equipmentId,
            'message' => 'Equipment registered successfully'
        ];
    }
    
    /**
     * Check-out equipment with geotagging (FR-13)
     */
    public function checkOutEquipment($equipmentId, $data) {
        Authorization::require('equipment.checkout');
        
        // Validate GPS coordinates
        if (empty($data['latitude']) || empty($data['longitude'])) {
            throw new ValidationException([
                'gps' => 'GPS coordinates are required for equipment checkout'
            ]);
        }
        
        // Validate GPS within Malawi
        if (!$this->gpsService->validateMalawiCoordinates($data['latitude'], $data['longitude'])) {
            throw new ValidationException([
                'gps' => 'GPS coordinates must be within Malawi boundaries'
            ]);
        }
        
        // Check if equipment is available
        $equipment = $this->equipmentRepository->findById($equipmentId);
        
        if (!$equipment) {
            throw NotFoundException::equipment($equipmentId);
        }
        
        if ($equipment['status'] !== 'available') {
            throw new ValidationException([
                'status' => 'Equipment is not available for checkout'
            ]);
        }
        
        // Checkout equipment
        $user = Authentication::user();
        $data['user_id'] = $user['id'];
        
        $this->equipmentRepository->checkOut($equipmentId, $data);
        
        return [
            'success' => true,
            'message' => 'Equipment checked out successfully'
        ];
    }
    
    /**
     * Check-in equipment with geotagging (FR-13)
     */
    public function checkInEquipment($equipmentId, $data) {
        Authorization::require('equipment.checkin');
        
        // Validate GPS coordinates
        if (empty($data['latitude']) || empty($data['longitude'])) {
            throw new ValidationException([
                'gps' => 'GPS coordinates are required for equipment checkin'
            ]);
        }
        
        // Validate GPS within Malawi
        if (!$this->gpsService->validateMalawiCoordinates($data['latitude'], $data['longitude'])) {
            throw new ValidationException([
                'gps' => 'GPS coordinates must be within Malawi boundaries'
            ]);
        }
        
        // Check equipment status
        $equipment = $this->equipmentRepository->findById($equipmentId);
        
        if (!$equipment) {
            throw NotFoundException::equipment($equipmentId);
        }
        
        if ($equipment['status'] !== 'in_use') {
            throw new ValidationException([
                'status' => 'Equipment is not checked out'
            ]);
        }
        
        // Checkin equipment
        $user = Authentication::user();
        $data['user_id'] = $user['id'];
        
        $this->equipmentRepository->checkIn($equipmentId, $data);
        
        return [
            'success' => true,
            'message' => 'Equipment checked in successfully'
        ];
    }
    
    /**
     * Schedule maintenance (FR-12)
     */
    public function scheduleMaintenance($equipmentId, $data) {
        Authorization::require('maintenance.create');
        
        $this->validateMaintenanceData($data);
        
        $user = Authentication::user();
        $data['created_by'] = $user['id'];
        
        $this->equipmentRepository->scheduleMaintenance($equipmentId, $data);
        
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'maintenance_scheduled',
            'entity_type' => 'equipment',
            'entity_id' => $equipmentId,
            'details' => json_encode($data)
        ]);
        
        return [
            'success' => true,
            'message' => 'Maintenance scheduled successfully'
        ];
    }
    
    /**
     * Get equipment requiring maintenance (FR-12)
     */
    public function getMaintenanceDue() {
        Authorization::require('maintenance.view');
        
        return $this->equipmentRepository->getRequiringMaintenance();
    }
    
    private function validateEquipmentData($data) {
        $errors = [];
        
        if (empty($data['name'])) {
            $errors['name'] = 'Equipment name is required';
        }
        
        if (empty($data['type'])) {
            $errors['type'] = 'Equipment type is required';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
    
    private function validateMaintenanceData($data) {
        $errors = [];
        
        if (empty($data['scheduled_date'])) {
            $errors['scheduled_date'] = 'Scheduled date is required';
        }
        
        if (empty($data['description'])) {
            $errors['description'] = 'Description is required';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
}
