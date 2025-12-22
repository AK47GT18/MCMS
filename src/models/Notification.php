<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;
use Mkaka\Models\Transaction;
use Mkaka\Models\User;
use Mkaka\Models\Project;
use Mkaka\Models\Contract;
use Mkaka\Models\Equipment;
use Mkaka\Models\SiteReport;

class Notification extends Model {
    protected $table = 'notifications';
    protected $primaryKey = 'id';
    protected $fillable = [
        'user_id',
        'notification_type',
        'title',
        'message',
        'entity_type',
        'entity_id',
        'is_read',
        'read_at',
        'priority'
    ];
    protected $timestamps = true;
    
    /**
     * Create approval notification (FR-23)
     */
    public function createApprovalNotification($entityId, $entityType) {
        $transaction = new Transaction();
        $entity = $transaction->find($entityId);
        
        if (!$entity) {
            return false;
        }
        
        // Determine approver based on amount
        $approverRole = $this->getApproverRole($entity['amount']);
        
        // Get users with approver role
        $userModel = new User();
        $approvers = $userModel->getUsersByRole($approverRole);
        
        foreach ($approvers as $approver) {
            $this->create([
                'user_id' => $approver['id'],
                'notification_type' => 'approval_required',
                'title' => 'Approval Required',
                'message' => "Transaction {$entity['transaction_code']} requires your approval (Amount: " . CURRENCY_SYMBOL . number_format($entity['amount']) . ")",
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'is_read' => 0,
                'priority' => 'high'
            ]);
            
            // Send email notification
            $this->sendEmailNotification($approver['email'], 'Approval Required', $entity);
        }
        
        return true;
    }
    
    /**
     * Get approver role based on amount
     */
    private function getApproverRole($amount) {
        if ($amount >= 50000000) { // 50M
            return ROLE_MANAGING_DIRECTOR;
        } elseif ($amount >= 20000000) { // 20M
            return ROLE_OPERATIONS_MANAGER;
        } else {
            return ROLE_FINANCE_OFFICER;
        }
    }
    
    /**
     * Create budget alert notification (FR-07)
     */
    public function createBudgetAlert($projectId, $percentage) {
        $project = new Project();
        $projectData = $project->find($projectId);
        
        if (!$projectData) {
            return false;
        }
        
        // Notify project manager and operations manager
        $recipients = [$projectData['project_manager_id']];
        
        $userModel = new User();
        $opsManagers = $userModel->getUsersByRole(ROLE_OPERATIONS_MANAGER);
        foreach ($opsManagers as $manager) {
            $recipients[] = $manager['id'];
        }
        
        $message = "Project {$projectData['project_name']} has reached {$percentage}% of budget allocation.";
        
        foreach (array_unique($recipients) as $userId) {
            $this->create([
                'user_id' => $userId,
                'notification_type' => 'budget_alert',
                'title' => 'Budget Alert',
                'message' => $message,
                'entity_type' => 'project',
                'entity_id' => $projectId,
                'is_read' => 0,
                'priority' => $percentage >= 100 ? 'critical' : 'high'
            ]);
        }
        
        return true;
    }
    
    /**
     * Create milestone deadline notification (FR-10)
     */
    public function createMilestoneDeadlineNotification($contractId, $milestoneId, $daysUntilDue) {
        $contract = new Contract();
        $contractData = $contract->find($contractId);
        
        if (!$contractData) {
            return false;
        }
        
        // Get milestone details
        $sql = "SELECT * FROM contract_milestones WHERE id = ?";
        $milestoneData = $this->db->query($sql, [$milestoneId]);
        
        if (empty($milestoneData)) {
            return false;
        }
        
        $milestone = $milestoneData[0];
        
        // Notify contract administrator and project manager
        $userModel = new User();
        $contractAdmins = $userModel->getUsersByRole(ROLE_CONTRACT_ADMIN);
        
        $recipients = [];
        if ($contractData['project_id']) {
            $project = new Project();
            $projectData = $project->find($contractData['project_id']);
            if ($projectData) {
                $recipients[] = $projectData['project_manager_id'];
            }
        }
        
        foreach ($contractAdmins as $admin) {
            $recipients[] = $admin['id'];
        }
        
        $message = "Contract {$contractData['contract_code']} milestone '{$milestone['milestone_name']}' is due in {$daysUntilDue} day(s).";
        
        foreach (array_unique($recipients) as $userId) {
            $this->create([
                'user_id' => $userId,
                'notification_type' => 'milestone_deadline',
                'title' => 'Milestone Deadline',
                'message' => $message,
                'entity_type' => 'contract',
                'entity_id' => $contractId,
                'is_read' => 0,
                'priority' => $daysUntilDue <= 1 ? 'high' : 'normal'
            ]);
        }
        
        return true;
    }
    
    /**
     * Create maintenance alert
     */
    public function createMaintenanceAlert($equipmentId) {
        $equipment = new Equipment();
        $equipmentData = $equipment->find($equipmentId);
        
        if (!$equipmentData) {
            return false;
        }
        
        // Notify equipment coordinator
        $userModel = new User();
        $coordinators = $userModel->getUsersByRole(ROLE_EQUIPMENT_COORDINATOR);
        
        $message = "Equipment {$equipmentData['equipment_name']} ({$equipmentData['equipment_id']}) maintenance is overdue.";
        
        foreach ($coordinators as $coordinator) {
            $this->create([
                'user_id' => $coordinator['id'],
                'notification_type' => 'maintenance_alert',
                'title' => 'Maintenance Overdue',
                'message' => $message,
                'entity_type' => 'equipment',
                'entity_id' => $equipmentId,
                'is_read' => 0,
                'priority' => 'high'
            ]);
        }
        
        return true;
    }
    
    /**
     * Create report submitted notification
     */
    public function createReportSubmittedNotification($reportId) {
        $siteReport = new SiteReport();
        $reportData = $siteReport->find($reportId);
        
        if (!$reportData) {
            return false;
        }
        
        // Notify project manager
        $project = new Project();
        $projectData = $project->find($reportData['project_id']);
        
        if ($projectData && $projectData['project_manager_id']) {
            $this->create([
                'user_id' => $projectData['project_manager_id'],
                'notification_type' => 'report_submitted',
                'title' => 'Site Report Submitted',
                'message' => "New site report {$reportData['report_code']} has been submitted for {$projectData['project_name']}.",
                'entity_type' => 'site_report',
                'entity_id' => $reportId,
                'is_read' => 0,
                'priority' => 'normal'
            ]);
        }
        
        return true;
    }
    
    /**
     * Send email notification
     */
    private function sendEmailNotification($email, $subject, $data) {
        // This would integrate with PHPMailer
        // Implementation depends on email configuration
        return true;
    }
    
    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId) {
        return $this->update($notificationId, [
            'is_read' => 1,
            'read_at' => date(DATETIME_FORMAT)
        ]);
    }
    
    /**
     * Get unread notifications for user
     */
    public function getUnreadNotifications($userId) {
        return $this->where([
            'user_id' => $userId,
            'is_read' => 0
        ]);
    }
    
    /**
     * Get all notifications for user
     */
    public function getUserNotifications($userId, $limit = 50) {
        $sql = "SELECT * FROM {$this->table} 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?";
        
        return $this->db->query($sql, [$userId, $limit]);
    }
}
