<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;
use Mkaka\Core\Authentication;
use Mkaka\Models\AuditLog;
use Mkaka\Models\Notification;
use Mkaka\Models\Budget;
use Mkaka\Models\Task;

/**
 * Project Model - Complete Implementation
 * 
 * @file Project.php
 * @description Comprehensive project management with Gantt charts (FR-03, FR-04, FR-19, FR-24)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class Project extends Model {
    protected $table = 'projects';
    protected $primaryKey = 'id';
    protected $fillable = [
        'project_code',
        'project_name',
        'client_name',
        'client_contact',
        'client_email',
        'contract_value',
        'start_date',
        'end_date',
        'expected_completion_date',
        'actual_completion_date',
        'status',
        'location',
        'latitude',
        'longitude',
        'description',
        'project_manager_id',
        'project_type',
        'priority',
        'completion_percentage'
    ];
    protected $timestamps = true;
    
    /**
     * Create project with Gantt chart initialization (FR-03)
     */
    public function createProject($data) {
        // Validate required fields
        $this->validateProjectData($data);
        
        // Generate unique project code
        $data['project_code'] = $this->generateProjectCode();
        $data['status'] = PROJECT_STATUS_PLANNING;
        $data['completion_percentage'] = 0;
        
        $this->db->beginTransaction();
        
        try {
            $projectId = $this->create($data);
            
            // Initialize budget if contract value provided
            if (!empty($data['contract_value'])) {
                $this->initializeProjectBudget($projectId, $data['contract_value']);
            }
            
            // Create audit log entry
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => Authentication::user()['id'],
                'action' => 'project_created',
                'entity_type' => 'project',
                'entity_id' => $projectId,
                'details' => json_encode([
                    'project_code' => $data['project_code'],
                    'project_name' => $data['project_name'],
                    'client' => $data['client_name'],
                    'contract_value' => $data['contract_value'] ?? 0
                ]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
            
            // Send notification to project manager
            if (!empty($data['project_manager_id'])) {
                $notification = new Notification();
                $notification->create([
                    'user_id' => $data['project_manager_id'],
                    'notification_type' => 'project_assigned',
                    'title' => 'New Project Assignment',
                    'message' => "You have been assigned as project manager for {$data['project_name']}",
                    'entity_type' => 'project',
                    'entity_id' => $projectId,
                    'is_read' => 0,
                    'priority' => 'high'
                ]);
            }
            
            $this->db->commit();
            return $projectId;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Validate project data
     */
    private function validateProjectData($data) {
        $required = ['project_name', 'client_name', 'start_date', 'end_date'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Field '{$field}' is required");
            }
        }
        
        // Validate dates
        if (strtotime($data['start_date']) > strtotime($data['end_date'])) {
            throw new Exception("End date must be after start date");
        }
        
        // Validate contract value if provided
        if (!empty($data['contract_value']) && $data['contract_value'] < 0) {
            throw new Exception("Contract value must be positive");
        }
    }
    
    /**
     * Generate unique project code
     */
    private function generateProjectCode() {
        $year = date('Y');
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE project_code LIKE ?";
        $result = $this->db->query($sql, ["PROJ-{$year}-%"]);
        $count = $result[0]['count'] + 1;
        
        return sprintf("PROJ-%s-%04d", $year, $count);
    }
    
    /**
     * Initialize project budget categories
     */
    private function initializeProjectBudget($projectId, $contractValue) {
        $budget = new Budget();
        
        // Default budget categories with percentage allocations
        $categories = [
            'labor' => 0.30,           // 30%
            'materials' => 0.35,       // 35%
            'equipment' => 0.15,       // 15%
            'subcontractors' => 0.10,  // 10%
            'overhead' => 0.05,        // 5%
            'contingency' => 0.05      // 5%
        ];
        
        foreach ($categories as $category => $percentage) {
            $budget->create([
                'project_id' => $projectId,
                'category' => $category,
                'allocated_amount' => $contractValue * $percentage,
                'description' => ucfirst($category) . ' budget allocation'
            ]);
        }
    }
    
    /**
     * Get project with full details including manager, budget, and progress (FR-19)
     */
    public function getProjectDetails($projectId) {
        $project = $this->getProjectWithManager($projectId);
        
        if (!$project) {
            return null;
        }
        
        return [
            'project' => $project,
            'completion' => $this->calculateCompletion($projectId),
            'budget' => $this->calculateBudgetUtilization($projectId),
            'tasks_summary' => $this->getTasksSummary($projectId),
            'gantt_data' => $this->getGanttChartData($projectId),
            'recent_activity' => $this->getRecentActivity($projectId),
            'team_members' => $this->getProjectTeam($projectId),
            'equipment_assigned' => $this->getAssignedEquipment($projectId),
            'upcoming_milestones' => $this->getUpcomingMilestones($projectId)
        ];
    }
    
    /**
     * Get project with manager details
     */
    public function getProjectWithManager($projectId) {
        $sql = "SELECT p.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name,
                       u.email as manager_email,
                       u.phone as manager_phone,
                       DATEDIFF(p.end_date, CURDATE()) as days_remaining,
                       DATEDIFF(CURDATE(), p.start_date) as days_elapsed
                FROM {$this->table} p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.id = ?";
        
        $result = $this->db->query($sql, [$projectId]);
        return $result ? $result[0] : null;
    }
    
    /**
     * Get Gantt chart data for project (FR-03)
     */
    public function getGanttChartData($projectId) {
        $task = new Task();
        $tasks = $task->getProjectTasks($projectId);
        
        $ganttData = [
            'tasks' => [],
            'links' => [],
            'project_start' => null,
            'project_end' => null
        ];
        
        $project = $this->find($projectId);
        $ganttData['project_start'] = $project['start_date'];
        $ganttData['project_end'] = $project['end_date'];
        
        foreach ($tasks as $taskData) {
            // Format task for Gantt chart
            $ganttData['tasks'][] = [
                'id' => $taskData['id'],
                'text' => $taskData['task_name'],
                'start_date' => date('d-m-Y', strtotime($taskData['start_date'])),
                'duration' => $taskData['duration_days'],
                'progress' => $taskData['completion_percentage'] / 100,
                'status' => $taskData['status'],
                'assigned_to' => $taskData['assigned_name'],
                'priority' => $taskData['priority'] ?? 'normal',
                'parent' => $taskData['parent_task_id'] ?? 0
            ];
            
            // Parse dependencies for links
            if (!empty($taskData['dependencies'])) {
                $dependencies = json_decode($taskData['dependencies'], true);
                if (is_array($dependencies)) {
                    foreach ($dependencies as $depId) {
                        $ganttData['links'][] = [
                            'id' => count($ganttData['links']) + 1,
                            'source' => $depId,
                            'target' => $taskData['id'],
                            'type' => '0' // finish-to-start
                        ];
                    }
                }
            }
        }
        
        return $ganttData;
    }
    
    /**
     * Calculate project completion percentage (FR-04)
     */
    public function calculateCompletion($projectId) {
        $sql = "SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                    SUM(weight) as total_weight,
                    SUM(CASE WHEN status = 'completed' THEN weight ELSE 0 END) as completed_weight,
                    SUM(completion_percentage * weight) / SUM(weight) as weighted_completion
                FROM tasks 
                WHERE project_id = ?";
        
        $result = $this->db->query($sql, [$projectId]);
        
        if ($result && $result[0]['total_tasks'] > 0) {
            $data = $result[0];
            $completion = round($data['weighted_completion'], 2);
            
            // Update project completion percentage
            $this->update($projectId, ['completion_percentage' => $completion]);
            
            return [
                'percentage' => $completion,
                'total_tasks' => $data['total_tasks'],
                'completed_tasks' => $data['completed_tasks'],
                'in_progress' => $data['total_tasks'] - $data['completed_tasks']
            ];
        }
        
        return ['percentage' => 0, 'total_tasks' => 0, 'completed_tasks' => 0, 'in_progress' => 0];
    }
    
    /**
     * Calculate budget utilization (FR-24)
     */
    public function calculateBudgetUtilization($projectId) {
        $sql = "SELECT 
                    p.contract_value,
                    COALESCE(SUM(t.amount), 0) as total_spent,
                    COUNT(DISTINCT t.category) as categories_used
                FROM {$this->table} p
                LEFT JOIN transactions t ON p.id = t.project_id 
                    AND t.status IN (?, ?)
                WHERE p.id = ?
                GROUP BY p.id, p.contract_value";
        
        $result = $this->db->query($sql, [
            TRANSACTION_STATUS_APPROVED, 
            TRANSACTION_STATUS_PAID, 
            $projectId
        ]);
        
        if ($result && $result[0]['contract_value'] > 0) {
            $data = $result[0];
            $percentage = ($data['total_spent'] / $data['contract_value']) * 100;
            
            // Get category breakdown
            $categoryBreakdown = $this->getBudgetCategoryBreakdown($projectId);
            
            return [
                'contract_value' => $data['contract_value'],
                'total_spent' => $data['total_spent'],
                'percentage' => round($percentage, 2),
                'remaining' => $data['contract_value'] - $data['total_spent'],
                'status' => $this->getBudgetStatus($percentage),
                'category_breakdown' => $categoryBreakdown
            ];
        }
        
        $project = $this->find($projectId);
        return [
            'contract_value' => $project['contract_value'] ?? 0,
            'total_spent' => 0,
            'percentage' => 0,
            'remaining' => $project['contract_value'] ?? 0,
            'status' => 'on_track',
            'category_breakdown' => []
        ];
    }
    
    /**
     * Get budget status based on percentage
     */
    private function getBudgetStatus($percentage) {
        if ($percentage >= 100) {
            return 'over_budget';
        } elseif ($percentage >= 90) {
            return 'critical';
        } elseif ($percentage >= 80) {
            return 'warning';
        } else {
            return 'on_track';
        }
    }
    
    /**
     * Get budget breakdown by category
     */
    private function getBudgetCategoryBreakdown($projectId) {
        $sql = "SELECT 
                    b.category,
                    b.allocated_amount,
                    COALESCE(SUM(t.amount), 0) as spent,
                    b.allocated_amount - COALESCE(SUM(t.amount), 0) as remaining,
                    (COALESCE(SUM(t.amount), 0) / b.allocated_amount * 100) as percentage
                FROM budgets b
                LEFT JOIN transactions t ON b.project_id = t.project_id 
                    AND b.category = t.category 
                    AND t.status IN (?, ?)
                WHERE b.project_id = ?
                GROUP BY b.id, b.category, b.allocated_amount
                ORDER BY b.category";
        
        return $this->db->query($sql, [
            TRANSACTION_STATUS_APPROVED,
            TRANSACTION_STATUS_PAID,
            $projectId
        ]);
    }
    
    /**
     * Get tasks summary for project
     */
    private function getTasksSummary($projectId) {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as on_hold,
                    SUM(CASE WHEN end_date < CURDATE() AND status != 'completed' THEN 1 ELSE 0 END) as overdue
                FROM tasks 
                WHERE project_id = ?";
        
        $result = $this->db->query($sql, [$projectId]);
        return $result ? $result[0] : null;
    }
    
    /**
     * Get recent activity for project
     */
    private function getRecentActivity($projectId, $limit = 20) {
        $sql = "SELECT al.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as user_name,
                       r.role_name
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE al.entity_type = 'project' AND al.entity_id = ? 
                   OR al.entity_type IN ('task', 'transaction', 'site_report') 
                      AND al.details LIKE ?
                ORDER BY al.created_at DESC 
                LIMIT ?";
        
        return $this->db->query($sql, [$projectId, "%\"project_id\":{$projectId}%", $limit]);
    }
    
    /**
     * Get project team members
     */
    private function getProjectTeam($projectId) {
        $sql = "SELECT DISTINCT 
                       u.id, 
                       CONCAT(u.first_name, ' ', u.last_name) as name,
                       u.email,
                       u.phone,
                       r.role_name,
                       'task_assigned' as assignment_type
                FROM tasks t
                JOIN users u ON t.assigned_to = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE t.project_id = ?
                
                UNION
                
                SELECT 
                       u.id,
                       CONCAT(u.first_name, ' ', u.last_name) as name,
                       u.email,
                       u.phone,
                       r.role_name,
                       'project_manager' as assignment_type
                FROM projects p
                JOIN users u ON p.project_manager_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE p.id = ?";
        
        return $this->db->query($sql, [$projectId, $projectId]);
    }
    
    /**
     * Get equipment assigned to project
     */
    private function getAssignedEquipment($projectId) {
        $sql = "SELECT e.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
                FROM equipment e
                LEFT JOIN users u ON e.assigned_to = u.id
                WHERE e.current_project_id = ?
                  AND e.status = ?
                ORDER BY e.equipment_name";
        
        return $this->db->query($sql, [$projectId, EQUIPMENT_STATUS_IN_USE]);
    }
    
    /**
     * Get upcoming milestones
     */
    private function getUpcomingMilestones($projectId) {
        $sql = "SELECT cm.*, c.contract_code
                FROM contract_milestones cm
                JOIN contracts c ON cm.contract_id = c.id
                WHERE c.project_id = ?
                  AND cm.status != 'completed'
                  AND cm.due_date >= CURDATE()
                ORDER BY cm.due_date ASC
                LIMIT 5";
        
        return $this->db->query($sql, [$projectId]);
    }
    
    /**
     * Update project status
     */
    public function updateStatus($projectId, $status) {
        $validStatuses = [
            PROJECT_STATUS_PLANNING,
            PROJECT_STATUS_ACTIVE,
            PROJECT_STATUS_ON_HOLD,
            PROJECT_STATUS_COMPLETED,
            PROJECT_STATUS_CANCELLED
        ];
        
        if (!in_array($status, $validStatuses)) {
            throw new Exception("Invalid project status");
        }
        
        $updateData = ['status' => $status];
        
        // Set actual completion date if completed
        if ($status == PROJECT_STATUS_COMPLETED) {
            $updateData['actual_completion_date'] = date(DATE_FORMAT);
            $updateData['completion_percentage'] = 100;
        }
        
        $updated = $this->update($projectId, $updateData);
        
        if ($updated) {
            // Log status change
            $auditLog = new AuditLog();
            $auditLog->create([
                'user_id' => Authentication::user()['id'],
                'action' => 'project_status_changed',
                'entity_type' => 'project',
                'entity_id' => $projectId,
                'details' => json_encode(['new_status' => $status]),
                'ip_address' => $_SERVER['REMOTE_ADDR']
            ]);
        }
        
        return $updated;
    }
    
    /**
     * Get projects by status
     */
    public function getProjectsByStatus($status) {
        return $this->where(['status' => $status]);
    }
    
    /**
     * Get active projects
     */
    public function getActiveProjects() {
        return $this->where(['status' => PROJECT_STATUS_ACTIVE]);
    }
    
    /**
     * Get projects dashboard summary (FR-21)
     */
    public function getDashboardSummary($filters = []) {
        $where = [];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = "p.status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['manager_id'])) {
            $where[] = "p.project_manager_id = ?";
            $params[] = $filters['manager_id'];
        }
        
        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
        
        $sql = "SELECT 
                    COUNT(*) as total_projects,
                    SUM(CASE WHEN p.status = ? THEN 1 ELSE 0 END) as planning,
                    SUM(CASE WHEN p.status = ? THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN p.status = ? THEN 1 ELSE 0 END) as on_hold,
                    SUM(CASE WHEN p.status = ? THEN 1 ELSE 0 END) as completed,
                    SUM(p.contract_value) as total_contract_value,
                    AVG(p.completion_percentage) as avg_completion
                FROM {$this->table} p
                {$whereClause}";
        
        $statusParams = [
            PROJECT_STATUS_PLANNING,
            PROJECT_STATUS_ACTIVE,
            PROJECT_STATUS_ON_HOLD,
            PROJECT_STATUS_COMPLETED
        ];
        
        $allParams = array_merge($statusParams, $params);
        $result = $this->db->query($sql, $allParams);
        
        return $result ? $result[0] : null;
    }
    
    /**
     * Get projects with pagination and filters
     */
    public function getProjectsWithFilters($filters = [], $page = 1, $perPage = ITEMS_PER_PAGE) {
        $offset = ($page - 1) * $perPage;
        $where = [];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = "p.status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['manager_id'])) {
            $where[] = "p.project_manager_id = ?";
            $params[] = $filters['manager_id'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(p.project_name LIKE ? OR p.project_code LIKE ? OR p.client_name LIKE ?)";
            $search = "%{$filters['search']}%";
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }
        
        if (!empty($filters['location'])) {
            $where[] = "p.location LIKE ?";
            $params[] = "%{$filters['location']}%";
        }
        
        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
        
        $sql = "SELECT p.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name,
                       (SELECT AVG(completion_percentage) FROM tasks WHERE project_id = p.id) as task_completion,
                       (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
                       DATEDIFF(p.end_date, CURDATE()) as days_remaining
                FROM {$this->table} p
                LEFT JOIN users u ON p.project_manager_id = u.id
                {$whereClause}
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?";
        
        $params[] = $perPage;
        $params[] = $offset;
        
        $data = $this->db->query($sql, $params);
        
        // Count total with same filters
        $countSql = "SELECT COUNT(*) as count FROM {$this->table} p {$whereClause}";
        $countParams = array_slice($params, 0, -2);
        $totalResult = $this->db->query($countSql, $countParams);
        $total = $totalResult[0]['count'];
        
        return [
            'data' => $data,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage)
        ];
    }
    
    /**
     * Generate project status report (FR-19)
     */
    public function generateStatusReport($projectId) {
        $project = $this->getProjectDetails($projectId);
        
        if (!$project) {
            throw new Exception("Project not found");
        }
        
        // Calculate project health metrics
        $health = $this->calculateProjectHealth($projectId);
        
        return [
            'project_info' => $project['project'],
            'completion_status' => $project['completion'],
            'budget_status' => $project['budget'],
            'schedule_status' => $this->getScheduleStatus($projectId),
            'tasks_summary' => $project['tasks_summary'],
            'team_performance' => $this->getTeamPerformance($projectId),
            'risks_issues' => $this->getProjectRisksIssues($projectId),
            'health_score' => $health,
            'recommendations' => $this->generateRecommendations($projectId, $health)
        ];
    }
    
    /**
     * Calculate project health score
     */
    private function calculateProjectHealth($projectId) {
        $completion = $this->calculateCompletion($projectId);
        $budget = $this->calculateBudgetUtilization($projectId);
        $schedule = $this->getScheduleStatus($projectId);
        
        // Weighted scoring: Completion 40%, Budget 30%, Schedule 30%
        $completionScore = $completion['percentage'];
        $budgetScore = 100 - min(100, $budget['percentage']);
        $scheduleScore = $schedule['on_schedule'] ? 100 : 50;
        
        $overallScore = (
            ($completionScore * 0.4) +
            ($budgetScore * 0.3) +
            ($scheduleScore * 0.3)
        );
        
        return [
            'overall_score' => round($overallScore, 2),
            'status' => $this->getHealthStatus($overallScore),
            'completion_score' => $completionScore,
            'budget_score' => $budgetScore,
            'schedule_score' => $scheduleScore
        ];
    }
    
    /**
     * Get health status label
     */
    private function getHealthStatus($score) {
        if ($score >= 80) return 'excellent';
        if ($score >= 60) return 'good';
        if ($score >= 40) return 'fair';
        return 'poor';
    }
    
    /**
     * Get schedule status
     */
    private function getScheduleStatus($projectId) {
        $project = $this->find($projectId);
        $completion = $this->calculateCompletion($projectId);
        
        $totalDays = (strtotime($project['end_date']) - strtotime($project['start_date'])) / 86400;
        $elapsedDays = (time() - strtotime($project['start_date'])) / 86400;
        
        $expectedCompletion = ($elapsedDays / $totalDays) * 100;
        $actualCompletion = $completion['percentage'];
        
        $variance = $actualCompletion - $expectedCompletion;
        
        return [
            'expected_completion' => round($expectedCompletion, 2),
            'actual_completion' => $actualCompletion,
            'variance' => round($variance, 2),
            'on_schedule' => $variance >= -5, // Within 5% tolerance
            'days_remaining' => max(0, ceil((strtotime($project['end_date']) - time()) / 86400))
        ];
    }
    
    /**
     * Get team performance metrics
     */
    private function getTeamPerformance($projectId) {
        $sql = "SELECT 
                       t.assigned_to,
                       CONCAT(u.first_name, ' ', u.last_name) as member_name,
                       COUNT(*) as total_tasks,
                       SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                       AVG(t.completion_percentage) as avg_completion,
                       SUM(CASE WHEN t.end_date < CURDATE() AND t.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.project_id = ?
                GROUP BY t.assigned_to
                ORDER BY completed_tasks DESC";
        
        return $this->db->query($sql, [$projectId]);
    }
    
    /**
     * Get project risks and issues
     */
    private function getProjectRisksIssues($projectId) {
        $issues = [];
        
        // Check budget issues
        $budget = $this->calculateBudgetUtilization($projectId);
        if ($budget['percentage'] >= 90) {
            $issues[] = [
                'type' => 'budget',
                'severity' => 'high',
                'description' => "Budget utilization at {$budget['percentage']}%"
            ];
        }
        
        // Check overdue tasks
        $tasksSummary = $this->getTasksSummary($projectId);
        if ($tasksSummary['overdue'] > 0) {
            $issues[] = [
                'type' => 'schedule',
                'severity' => 'medium',
                'description' => "{$tasksSummary['overdue']} tasks are overdue"
            ];
        }
        
        // Check equipment maintenance
        $sql = "SELECT COUNT(*) as overdue_maintenance
                FROM equipment e
                WHERE e.current_project_id = ?
                  AND e.next_maintenance_due < CURDATE()";
        
        $result = $this->db->query($sql, [$projectId]);
        if ($result[0]['overdue_maintenance'] > 0) {
            $issues[] = [
                'type' => 'equipment',
                'severity' => 'medium',
                'description' => "{$result[0]['overdue_maintenance']} equipment items have overdue maintenance"
            ];
        }
        
        return $issues;
    }
    
    /**
     * Generate recommendations based on project health
     */
    private function generateRecommendations($projectId, $health) {
        $recommendations = [];
        
        if ($health['budget_score'] < 70) {
            $recommendations[] = "Review budget allocation and consider cost optimization measures";
        }
        
        if ($health['schedule_score'] < 70) {
            $recommendations[] = "Accelerate task completion or adjust project timeline";
        }
        
        if ($health['completion_score'] < 50) {
            $recommendations[] = "Increase resource allocation to improve completion rate";
        }
        
        $tasksSummary = $this->getTasksSummary($projectId);
        if ($tasksSummary['overdue'] > 0) {
            $recommendations[] = "Prioritize and resolve {$tasksSummary['overdue']} overdue tasks";
        }
        
        return $recommendations;
    }
}