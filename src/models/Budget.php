<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;

/**
 * Budget Model - Complete Implementation
 * 
 * @file Budget.php
 * @description Project budget management (FR-07, FR-24)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class Budget extends Model {
    protected $table = 'budgets';
    protected $primaryKey = 'id';
    protected $fillable = [
        'project_id',
        'category',
        'allocated_amount',
        'spent_amount',
        'description'
    ];
    protected $timestamps = true;
    
    /**
     * Create budget allocation
     */
    public function createBudget($data) {
        // Initialize spent_amount to 0
        if (!isset($data['spent_amount'])) {
            $data['spent_amount'] = 0;
        }
        
        $budgetId = $this->create($data);
        
        // Log budget creation
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'budget_created',
            'entity_type' => 'budget',
            'entity_id' => $budgetId,
            'details' => json_encode($data),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        return $budgetId;
    }
    
    /**
     * Get budget by project and category
     */
    public function getProjectBudget($projectId, $category = null) {
        if ($category) {
            $result = $this->where([
                'project_id' => $projectId,
                'category' => $category
            ]);
            return $result ? $result[0] : null;
        }
        
        return $this->where(['project_id' => $projectId]);
    }
    
    /**
     * Calculate total budget utilization for project (FR-24)
     */
    public function calculateUtilization($projectId) {
        $sql = "SELECT 
                    SUM(allocated_amount) as total_budget,
                    SUM(spent_amount) as total_spent,
                    (SUM(spent_amount) / SUM(allocated_amount) * 100) as percentage_used,
                    SUM(allocated_amount - spent_amount) as remaining
                FROM {$this->table}
                WHERE project_id = ?";
        
        $result = $this->db->query($sql, [$projectId]);
        return $result ? $result[0] : null;
    }
    
    /**
     * Get budget breakdown by category (FR-24)
     */
    public function getCategoryBreakdown($projectId) {
        $sql = "SELECT 
                    b.category,
                    b.allocated_amount,
                    b.spent_amount,
                    (b.allocated_amount - b.spent_amount) as remaining,
                    (b.spent_amount / b.allocated_amount * 100) as percentage_used,
                    CASE 
                        WHEN (b.spent_amount / b.allocated_amount * 100) >= 100 THEN 'over_budget'
                        WHEN (b.spent_amount / b.allocated_amount * 100) >= 90 THEN 'critical'
                        WHEN (b.spent_amount / b.allocated_amount * 100) >= 80 THEN 'warning'
                        ELSE 'on_track'
                    END as status
                FROM {$this->table} b
                WHERE b.project_id = ?
                ORDER BY b.category";
        
        return $this->db->query($sql, [$projectId]);
    }
    
    /**
     * Update spent amount when transaction is approved
     */
    public function updateSpent($projectId, $category, $amount) {
        $budget = $this->getProjectBudget($projectId, $category);
        
        if (!$budget) {
            throw new Exception("Budget category not found for project");
        }
        
        $newSpent = $budget['spent_amount'] + $amount;
        $percentage = ($newSpent / $budget['allocated_amount']) * 100;
        
        $this->db->beginTransaction();
        
        try {
            // Update spent amount
            $this->update($budget['id'], ['spent_amount' => $newSpent]);
            
            // Check for budget alerts (FR-07)
            if ($percentage >= BUDGET_ALERT_THRESHOLD_1 && 
                $percentage < BUDGET_ALERT_THRESHOLD_2) {
                $this->triggerBudgetAlert($projectId, $category, 80);
            } elseif ($percentage >= BUDGET_ALERT_THRESHOLD_2 && 
                      $percentage < BUDGET_ALERT_THRESHOLD_3) {
                $this->triggerBudgetAlert($projectId, $category, 90);
            } elseif ($percentage >= BUDGET_ALERT_THRESHOLD_3) {
                $this->triggerBudgetAlert($projectId, $category, 100);
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Trigger budget alert notification (FR-07)
     */
    private function triggerBudgetAlert($projectId, $category, $percentage) {
        $notification = new Notification();
        
        $project = (new Project())->find($projectId);
        
        if (!$project) {
            return false;
        }
        
        // Create notification for project manager
        if ($project['project_manager_id']) {
            $notification->create([
                'user_id' => $project['project_manager_id'],
                'notification_type' => 'budget_alert',
                'title' => 'Budget Alert',
                'message' => "Project '{$project['project_name']}' - Category '{$category}' has reached {$percentage}% of allocated budget",
                'entity_type' => 'project',
                'entity_id' => $projectId,
                'is_read' => 0,
                'priority' => $percentage >= 100 ? 'critical' : 'high'
            ]);
        }
        
        // Notify operations manager
        $userModel = new User();
        $opsManagers = $userModel->where(['role_id' => ROLE_OPERATIONS_MANAGER]);
        
        foreach ($opsManagers as $manager) {
            $notification->create([
                'user_id' => $manager['id'],
                'notification_type' => 'budget_alert',
                'title' => 'Budget Alert',
                'message' => "Project '{$project['project_name']}' - Category '{$category}' has reached {$percentage}% of allocated budget",
                'entity_type' => 'project',
                'entity_id' => $projectId,
                'is_read' => 0,
                'priority' => $percentage >= 100 ? 'critical' : 'high'
            ]);
        }
        
        return true;
    }
    
    /**
     * Get categories over budget
     */
    public function getOverBudgetCategories($projectId = null) {
        $sql = "SELECT b.*, 
                       p.project_name,
                       (b.spent_amount - b.allocated_amount) as overrun_amount,
                       ((b.spent_amount - b.allocated_amount) / b.allocated_amount * 100) as overrun_percentage
                FROM {$this->table} b
                JOIN projects p ON b.project_id = p.id
                WHERE b.spent_amount > b.allocated_amount";
        
        $params = [];
        
        if ($projectId) {
            $sql .= " AND b.project_id = ?";
            $params[] = $projectId;
        }
        
        $sql .= " ORDER BY overrun_amount DESC";
        
        return $this->db->query($sql, $params);
    }
    
    /**
     * Get budget forecast (projected spending)
     */
    public function getForecast($projectId) {
        $project = (new Project())->find($projectId);
        $utilization = $this->calculateUtilization($projectId);
        
        if (!$project || !$utilization) {
            return null;
        }
        
        // Calculate days elapsed and remaining
        $startDate = new DateTime($project['start_date']);
        $endDate = new DateTime($project['end_date']);
        $today = new DateTime();
        
        $totalDays = $startDate->diff($endDate)->days;
        $elapsedDays = $startDate->diff($today)->days;
        $remainingDays = $today->diff($endDate)->days;
        
        // Calculate burn rate (spending per day)
        $burnRate = $elapsedDays > 0 ? $utilization['total_spent'] / $elapsedDays : 0;
        
        // Project final spending
        $projectedSpending = $utilization['total_spent'] + ($burnRate * $remainingDays);
        $projectedOverrun = $projectedSpending - $utilization['total_budget'];
        
        return [
            'current_spent' => $utilization['total_spent'],
            'current_budget' => $utilization['total_budget'],
            'remaining_days' => $remainingDays,
            'projected_spending' => $projectedSpending,
            'projected_overrun' => $projectedOverrun
        ];
    }
}
