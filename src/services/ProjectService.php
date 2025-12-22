<?php
namespace Mkaka\Services;

use Mkaka\Repositories\ProjectRepository;
use Mkaka\Services\AuditService;
use Mkaka\Services\NotificationService;
use Mkaka\Exceptions\ValidationException;

/**
 * Project and Finance Services
 * 
 * @project Mkaka Construction Management System
 * @author Anthony Kanjira (CEN/01/01/22)
 * @supervisor Mr. John Kaira
 */

// ============================================================================
// FILE: src/services/ProjectService.php
// ============================================================================

/**
 * Project Service (FR-03, FR-04, FR-07, FR-24)
 */
class ProjectService {
    
    private $projectRepository;
    private $auditService;
    private $notificationService;
    
    public function __construct() {
        $this->projectRepository = new ProjectRepository();
        $this->auditService = new AuditService();
        $this->notificationService = new NotificationService();
    }
    
    /**
     * Create new project (FR-03)
     */
    public function createProject($data) {
        // Check authorization
        Authorization::require('projects.create');
        
        // Validate input
        $this->validateProjectData($data);
        
        // Check if project code exists
        if (!empty($data['project_code']) && 
            $this->projectRepository->projectCodeExists($data['project_code'])) {
            throw new ValidationException(['project_code' => 'Project code already exists']);
        }
        
        // Create project
        $user = Authentication::user();
        $data['created_by'] = $user['id'];
        
        $projectId = $this->projectRepository->create($data);
        
        // Log project creation
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'project_created',
            'entity_type' => 'project',
            'entity_id' => $projectId,
            'details' => json_encode([
                'project_code' => $data['project_code'],
                'name' => $data['name'],
                'contract_value' => $data['contract_value']
            ])
        ]);
        
        // Send notification to project manager
        $this->notificationService->notify([
            'user_id' => $data['manager_id'],
            'title' => 'New Project Assigned',
            'message' => "You have been assigned as manager for project: {$data['name']}",
            'type' => 'project',
            'entity_id' => $projectId
        ]);
        
        return [
            'success' => true,
            'project_id' => $projectId,
            'message' => 'Project created successfully'
        ];
    }
    
    /**
     * Update project
     */
    public function updateProject($projectId, $data) {
        // Check authorization
        Authorization::require('projects.edit');
        
        // Validate project exists
        $project = $this->projectRepository->findById($projectId);
        if (!$project) {
            throw NotFoundException::project($projectId);
        }
        
        // Validate input
        $this->validateProjectData($data, true);
        
        // Update project
        $this->projectRepository->update($projectId, $data);
        
        // Log update
        $user = Authentication::user();
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'project_updated',
            'entity_type' => 'project',
            'entity_id' => $projectId,
            'details' => json_encode($data)
        ]);
        
        return [
            'success' => true,
            'message' => 'Project updated successfully'
        ];
    }
    
    /**
     * Update task completion and recalculate project progress (FR-04)
     */
    public function updateTaskCompletion($projectId, $taskId, $completionPercentage) {
        // Validate completion percentage
        if ($completionPercentage < 0 || $completionPercentage > 100) {
            throw new ValidationException([
                'completion_percentage' => 'Must be between 0 and 100'
            ]);
        }
        
        // Update task completion
        $db = Database::getInstance();
        $sql = "UPDATE tasks 
                SET completion_percentage = ?, 
                    updated_at = NOW()
                WHERE id = ? AND project_id = ?";
        
        $db->execute($sql, [$completionPercentage, $taskId, $projectId]);
        
        // Recalculate project completion (FR-04)
        $this->projectRepository->updateCompletionPercentage($projectId);
        
        // Log update
        $user = Authentication::user();
        $this->auditService->log([
            'user_id' => $user['id'],
            'action' => 'task_completion_updated',
            'entity_type' => 'task',
            'entity_id' => $taskId,
            'details' => json_encode([
                'project_id' => $projectId,
                'completion_percentage' => $completionPercentage
            ])
        ]);
        
        return [
            'success' => true,
            'message' => 'Task completion updated'
        ];
    }
    
    /**
     * Get budget utilization and trigger alerts if needed (FR-07, FR-24)
     */
    public function checkBudgetStatus($projectId) {
        $utilization = $this->projectRepository->getBudgetUtilization($projectId);
        
        if (!$utilization) {
            throw NotFoundException::project($projectId);
        }
        
        $percentage = $utilization['utilization_percentage'];
        
        // Trigger alerts at 80%, 90%, 100% (FR-07)
        if ($percentage >= 80 && $percentage < 90) {
            $this->triggerBudgetAlert($projectId, 80, $utilization);
        } elseif ($percentage >= 90 && $percentage < 100) {
            $this->triggerBudgetAlert($projectId, 90, $utilization);
        } elseif ($percentage >= 100) {
            $this->triggerBudgetAlert($projectId, 100, $utilization);
        }
        
        return $utilization;
    }
    
    /**
     * Trigger budget alert (FR-07)
     */
    private function triggerBudgetAlert($projectId, $threshold, $utilization) {
        $project = $this->projectRepository->findById($projectId);
        
        // Check if alert already sent for this threshold
        $cacheKey = "budget_alert_{$projectId}_{$threshold}";
        if (apcu_exists($cacheKey)) {
            return; // Alert already sent
        }
        
        // Send notification to project manager
        $this->notificationService->notify([
            'user_id' => $project['manager_id'],
            'title' => "Budget Alert: {$threshold}% Utilized",
            'message' => "Project '{$project['name']}' has reached {$threshold}% budget utilization. " .
                        "Spent: MWK " . number_format($utilization['total_spent'], 2) . " / " .
                        "Budget: MWK " . number_format($utilization['budget_allocated'], 2),
            'type' => 'budget_alert',
            'entity_id' => $projectId,
            'priority' => 'high'
        ]);
        
        // Send email
        $emailService = new EmailService();
        $emailService->sendBudgetAlert($project, $threshold, $utilization);
        
        // Mark alert as sent (cache for 24 hours)
        apcu_store($cacheKey, true, 86400);
    }
    
    /**
     * Validate project data
     */
    private function validateProjectData($data, $isUpdate = false) {
        $errors = [];
        
        if (!$isUpdate || isset($data['name'])) {
            if (empty($data['name'])) {
                $errors['name'] = 'Project name is required';
            }
        }
        
        if (!$isUpdate || isset($data['client_name'])) {
            if (empty($data['client_name'])) {
                $errors['client_name'] = 'Client name is required';
            }
        }
        
        if (!$isUpdate || isset($data['manager_id'])) {
            if (empty($data['manager_id'])) {
                $errors['manager_id'] = 'Project manager is required';
            }
        }
        
        if (!$isUpdate || isset($data['contract_value'])) {
            if (empty($data['contract_value']) || $data['contract_value'] <= 0) {
                $errors['contract_value'] = 'Contract value must be greater than zero';
            }
        }
        
        if (!$isUpdate || isset($data['start_date'])) {
            if (empty($data['start_date'])) {
                $errors['start_date'] = 'Start date is required';
            }
        }
        
        if (!$isUpdate || isset($data['end_date'])) {
            if (empty($data['end_date'])) {
                $errors['end_date'] = 'End date is required';
            } elseif (!empty($data['start_date']) && 
                     strtotime($data['end_date']) < strtotime($data['start_date'])) {
                $errors['end_date'] = 'End date must be after start date';
            }
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
}
