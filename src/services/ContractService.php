<?php
namespace Mkaka\Services;

use Mkaka\Repositories\ContractRepository;
use Mkaka\Services\AuditService;
use Mkaka\Services\NotificationService;

class ContractService {
    
    private $contractRepository;
    private $auditService;
    private $notificationService;
    
    public function __construct() {
        $this->contractRepository = new ContractRepository();
        $this->auditService = new AuditService();
        $this->notificationService = new NotificationService();
    }
    
    /**
     * Create contract with version control (FR-09)
     */
    public function createContract($data) {
        Authorization::require('contracts.create');
        
        $this->validateContractData($data);
        
        $user = Authentication::user();
        $data['created_by'] = $user['id'];
        
        $contractId = $this->contractRepository->create($data);
        
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'contract_created',
            'entity_type' => 'contract',
            'entity_id' => $contractId,
            'details' => json_encode([
                'contract_number' => $data['contract_number'],
                'title' => $data['title'],
                'vendor_id' => $data['vendor_id']
            ])
        ]);
        
        return [
            'success' => true,
            'contract_id' => $contractId,
            'message' => 'Contract created successfully'
        ];
    }
    
    /**
     * Add milestone with deadline tracking (FR-10)
     */
    public function addMilestone($contractId, $data) {
        Authorization::require('contracts.edit');
        
        $this->validateMilestoneData($data);
        
        $this->contractRepository->addMilestone($contractId, $data);
        
        $user = Authentication::user();
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'milestone_added',
            'entity_type' => 'contract',
            'entity_id' => $contractId,
            'details' => json_encode($data)
        ]);
        
        return [
            'success' => true,
            'message' => 'Milestone added successfully'
        ];
    }
    
    /**
     * Upload contract document with version control (FR-09)
     */
    public function uploadDocument($contractId, $file) {
        Authorization::require('documents.create');
        
        $fileService = new FileService();
        $uploadResult = $fileService->uploadFile($file, 'contracts');
        
        $user = Authentication::user();
        $this->contractRepository->addDocument($contractId, [
            'filename' => $uploadResult['filename'],
            'filepath' => $uploadResult['filepath'],
            'filesize' => $uploadResult['filesize'],
            'uploaded_by' => $user['id']
        ]);
        
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'contract_document_uploaded',
            'entity_type' => 'contract',
            'entity_id' => $contractId,
            'details' => json_encode(['filename' => $uploadResult['filename']])
        ]);
        
        return [
            'success' => true,
            'message' => 'Document uploaded successfully'
        ];
    }
    
    /**
     * Check and send milestone deadline reminders (FR-10)
     * Called by scheduled task
     */
    public function sendMilestoneReminders() {
        // Get milestones due in 7 days
        $contracts7Days = $this->contractRepository->getContractsWithUpcomingMilestones(7);
        
        foreach ($contracts7Days as $contract) {
            if ($contract['days_remaining'] == 7) {
                $this->sendMilestoneNotification($contract, '7 days');
            }
        }
        
        // Get milestones due in 1 day
        $contracts1Day = $this->contractRepository->getContractsWithUpcomingMilestones(1);
        
        foreach ($contracts1Day as $contract) {
            if ($contract['days_remaining'] == 1) {
                $this->sendMilestoneNotification($contract, '1 day');
            }
        }
    }
    
    private function sendMilestoneNotification($contract, $timeframe) {
        // Send notification
        if ($contract['manager_email']) {
            $this->notificationService->notify([
                'user_id' => null,
                'email' => $contract['manager_email'],
                'title' => "Contract Milestone Deadline: $timeframe",
                'message' => "Milestone '{$contract['milestone_title']}' for contract {$contract['contract_number']} is due in $timeframe",
                'type' => 'deadline_reminder'
            ]);
            
            // Send email
            $emailService = new EmailService();
            $emailService->sendDeadlineReminder($contract, $timeframe);
        }
    }
    
    private function validateContractData($data, $isUpdate = false) {
        $errors = [];
        
        if (!$isUpdate && empty($data['title'])) {
            $errors['title'] = 'Contract title is required';
        }
        
        if (!$isUpdate && empty($data['project_id'])) {
            $errors['project_id'] = 'Project is required';
        }
        
        if (!$isUpdate && empty($data['vendor_id'])) {
            $errors['vendor_id'] = 'Vendor is required';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
    
    private function validateMilestoneData($data) {
        $errors = [];
        
        if (empty($data['title'])) {
            $errors['title'] = 'Milestone title is required';
        }
        
        if (empty($data['due_date'])) {
            $errors['due_date'] = 'Due date is required';
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
}