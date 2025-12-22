<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;

/**
 * Dashboard Controller
 * 
 * @file DashboardController.php
 * @description Main dashboard with real-time visualizations (FR-21)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class DashboardController extends Controller {
    
    /**
     * Show main dashboard (FR-21)
     */
    public function index() {
        $this->requireAuth();
        
        try {
            $user = Authentication::user();
            $roleId = $user['role_id'];
            
            // Get dashboard data based on role
            $data = $this->getDashboardData($roleId, $user['id']);
            
            return $this->view('dashboard/index', $data);
            
        } catch (Exception $e) {
            error_log("Dashboard error: " . $e->getMessage());
            $this->flash('error', 'Error loading dashboard');
            return $this->redirect('/');
        }
    }
    
    /**
     * Get dashboard data based on user role
     */
    private function getDashboardData($roleId, $userId) {
        $project = new Project();
        $transaction = new Transaction();
        $equipment = new Equipment();
        $notification = new Notification();
        
        $data = [
            'user' => Authentication::user(),
            'notifications' => $notification->getUnreadNotifications($userId),
            'notification_count' => count($notification->getUnreadNotifications($userId))
        ];
        
        // Role-specific data
        switch ($roleId) {
            case ROLE_MANAGING_DIRECTOR:
            case ROLE_OPERATIONS_MANAGER:
                $data = array_merge($data, $this->getExecutiveDashboard());
                break;
            
            case ROLE_PROJECT_MANAGER:
                $data = array_merge($data, $this->getProjectManagerDashboard($userId));
                break;
            
            case ROLE_FINANCE_OFFICER:
                $data = array_merge($data, $this->getFinanceDashboard());
                break;
            
            case ROLE_CONTRACT_ADMIN:
                $data = array_merge($data, $this->getContractDashboard());
                break;
            
            case ROLE_EQUIPMENT_COORDINATOR:
                $data = array_merge($data, $this->getEquipmentDashboard());
                break;
            
            case ROLE_FIELD_SUPERVISOR:
                $data = array_merge($data, $this->getFieldDashboard($userId));
                break;
            
            default:
                $data = array_merge($data, $this->getBasicDashboard());
        }
        
        return $data;
    }
    
    /**
     * Executive dashboard data
     */
    private function getExecutiveDashboard() {
        $project = new Project();
        $transaction = new Transaction();
        $contract = new Contract();
        
        $projectSummary = $project->getDashboardSummary();
        $activeProjects = $project->getActiveProjects();
        
        // Financial overview
        $sql = "SELECT 
                    SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as pending_amount,
                    SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as approved_amount,
                    COUNT(CASE WHEN status = ? THEN 1 END) as pending_count
                FROM transactions
                WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAYS)";
        
        $db = Database::getInstance();
        $financialData = $db->query($sql, [
            TRANSACTION_STATUS_PENDING,
            TRANSACTION_STATUS_APPROVED,
            TRANSACTION_STATUS_PENDING
        ]);
        
        return [
            'project_summary' => $projectSummary,
            'active_projects' => $activeProjects,
            'financial_summary' => $financialData[0],
            'recent_projects' => $project->getProjectsWithFilters([], 1, 5)['data'],
            'budget_alerts' => $this->getBudgetAlerts(),
            'performance_metrics' => $this->getPerformanceMetrics()
        ];
    }
    
    /**
     * Project manager dashboard
     */
    private function getProjectManagerDashboard($userId) {
        $project = new Project();
        $task = new Task();
        
        $myProjects = $project->getProjectsWithFilters(['manager_id' => $userId]);
        $myTasks = $task->getUserTasks($userId);
        $overdueTasks = $task->getOverdueTasks();
        
        // Filter overdue tasks for manager's projects
        $projectIds = array_column($myProjects['data'], 'id');
        $myOverdueTasks = array_filter($overdueTasks, function($task) use ($projectIds) {
            return in_array($task['project_id'], $projectIds);
        });
        
        return [
            'my_projects' => $myProjects['data'],
            'my_tasks' => $myTasks,
            'overdue_tasks' => $myOverdueTasks,
            'project_count' => $myProjects['total'],
            'tasks_summary' => [
                'total' => count($myTasks),
                'in_progress' => count(array_filter($myTasks, fn($t) => $t['status'] == 'in_progress')),
                'completed' => count(array_filter($myTasks, fn($t) => $t['status'] == 'completed'))
            ]
        ];
    }
    
    /**
     * Finance dashboard
     */
    private function getFinanceDashboard() {
        $transaction = new Transaction();
        $approval = new Approval();
        
        $user = Authentication::user();
        $pendingApprovals = $transaction->getPendingApprovals($user['id']);
        
        // Monthly financial summary
        $sql = "SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_amount
                FROM transactions
                WHERE status = ?
                  AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month DESC";
        
        $db = Database::getInstance();
        $monthlyData = $db->query($sql, [TRANSACTION_STATUS_APPROVED]);
        
        return [
            'pending_approvals' => $pendingApprovals,
            'approval_count' => count($pendingApprovals),
            'monthly_summary' => $monthlyData,
            'recent_transactions' => $transaction->all([], 'created_at DESC', 10)
        ];
    }
    
    /**
     * Contract dashboard
     */
    private function getContractDashboard() {
        $contract = new Contract();
        
        $upcomingDeadlines = $contract->getUpcomingDeadlines(30);
        
        // Contract status summary
        $sql = "SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(contract_value) as total_value
                FROM contracts
                GROUP BY status";
        
        $db = Database::getInstance();
        $statusSummary = $db->query($sql);
        
        return [
            'upcoming_deadlines' => $upcomingDeadlines,
            'status_summary' => $statusSummary,
            'recent_contracts' => $contract->all([], 'created_at DESC', 10)
        ];
    }
    
    /**
     * Equipment dashboard
     */
    private function getEquipmentDashboard() {
        $equipment = new Equipment();
        $maintenance = new Maintenance();
        
        $availableEquipment = $equipment->getByStatus(EQUIPMENT_STATUS_AVAILABLE);
        $inUseEquipment = $equipment->getByStatus(EQUIPMENT_STATUS_IN_USE);
        $maintenanceEquipment = $equipment->getByStatus(EQUIPMENT_STATUS_MAINTENANCE);
        
        $upcomingMaintenance = $maintenance->getUpcomingMaintenance(7);
        $overdueMaintenance = $equipment->checkOverdueMaintenance();
        
        return [
            'equipment_summary' => [
                'available' => count($availableEquipment),
                'in_use' => count($inUseEquipment),
                'maintenance' => count($maintenanceEquipment),
                'total' => $equipment->count()
            ],
            'upcoming_maintenance' => $upcomingMaintenance,
            'overdue_maintenance' => $overdueMaintenance,
            'recent_checkouts' => $this->getRecentCheckouts()
        ];
    }
    
    /**
     * Field supervisor dashboard
     */
    private function getFieldDashboard($userId) {
        $siteReport = new SiteReport();
        $task = new Task();
        $equipment = new Equipment();
        
        $myTasks = $task->getUserTasks($userId, ['status' => 'in_progress']);
        
        // Get projects where user has tasks
        $projectIds = array_unique(array_column($myTasks, 'project_id'));
        
        $myReports = [];
        foreach ($projectIds as $projectId) {
            $reports = $siteReport->getProjectReports($projectId);
            $myReports = array_merge($myReports, array_filter($reports, function($r) use ($userId) {
                return $r['submitted_by'] == $userId;
            }));
        }
        
        return [
            'my_tasks' => $myTasks,
            'my_reports' => array_slice($myReports, 0, 10),
            'task_count' => count($myTasks),
            'report_count' => count($myReports)
        ];
    }
    
    /**
     * Basic dashboard for other roles
     */
    private function getBasicDashboard() {
        $project = new Project();
        
        return [
            'active_projects' => $project->getActiveProjects(),
            'recent_activity' => $this->getRecentActivity()
        ];
    }
    
    /**
     * Get budget alerts
     */
    private function getBudgetAlerts() {
        $sql = "SELECT 
                    p.id,
                    p.project_name,
                    p.contract_value,
                    SUM(t.amount) as spent,
                    (SUM(t.amount) / p.contract_value * 100) as percentage
                FROM projects p
                LEFT JOIN transactions t ON p.id = t.project_id 
                    AND t.status IN (?, ?)
                WHERE p.status = ?
                GROUP BY p.id
                HAVING percentage >= ?
                ORDER BY percentage DESC";
        
        $db = Database::getInstance();
        return $db->query($sql, [
            TRANSACTION_STATUS_APPROVED,
            TRANSACTION_STATUS_PAID,
            PROJECT_STATUS_ACTIVE,
            BUDGET_ALERT_THRESHOLD_1
        ]);
    }
    
    /**
     * Get performance metrics
     */
    private function getPerformanceMetrics() {
        $sql = "SELECT 
                    AVG(completion_percentage) as avg_completion,
                    COUNT(CASE WHEN status = ? THEN 1 END) as active_count,
                    COUNT(CASE WHEN status = ? THEN 1 END) as completed_count,
                    SUM(contract_value) as total_value
                FROM projects
                WHERE status IN (?, ?)";
        
        $db = Database::getInstance();
        $result = $db->query($sql, [
            PROJECT_STATUS_ACTIVE,
            PROJECT_STATUS_COMPLETED,
            PROJECT_STATUS_ACTIVE,
            PROJECT_STATUS_COMPLETED
        ]);
        
        return $result ? $result[0] : null;
    }
    
    /**
     * Get recent equipment checkouts
     */
    private function getRecentCheckouts() {
        $sql = "SELECT ecl.*, 
                       e.equipment_name,
                       p.project_name,
                       CONCAT(u.first_name, ' ', u.last_name) as assigned_name
                FROM equipment_checkout_log ecl
                JOIN equipment e ON ecl.equipment_id = e.id
                LEFT JOIN projects p ON ecl.project_id = p.id
                LEFT JOIN users u ON ecl.assigned_to = u.id
                ORDER BY ecl.checkout_date DESC
                LIMIT 10";
        
        $db = Database::getInstance();
        return $db->query($sql);
    }
    
    /**
     * Get recent system activity
     */
    private function getRecentActivity() {
        $auditLog = new AuditLog();
        return $auditLog->getRecentActivity(20);
    }
    
    /**
     * Get dashboard statistics (AJAX)
     */
    public function getStats() {
        $this->requireAuth();
        
        try {
            $user = Authentication::user();
            $stats = $this->getDashboardData($user['role_id'], $user['id']);
            
            return $this->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error loading statistics'
            ], 500);
        }
    }
    
    /**
     * Get chart data (AJAX)
     */
    public function getChartData($type) {
        $this->requireAuth();
        
        try {
            $data = [];
            
            switch ($type) {
                case 'project-completion':
                    $data = $this->getProjectCompletionData();
                    break;
                
                case 'budget-utilization':
                    $data = $this->getBudgetUtilizationData();
                    break;
                
                case 'monthly-expenses':
                    $data = $this->getMonthlyExpensesData();
                    break;
                
                case 'equipment-utilization':
                    $data = $this->getEquipmentUtilizationData();
                    break;
                
                default:
                    throw new Exception("Invalid chart type");
            }
            
            return $this->json([
                'success' => true,
                'data' => $data
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error loading chart data'
            ], 500);
        }
    }
    
    /**
     * Get project completion chart data
     */
    private function getProjectCompletionData() {
        $sql = "SELECT 
                    project_name,
                    completion_percentage
                FROM projects
                WHERE status IN (?, ?)
                ORDER BY completion_percentage DESC
                LIMIT 10";
        
        $db = Database::getInstance();
        return $db->query($sql, [PROJECT_STATUS_ACTIVE, PROJECT_STATUS_PLANNING]);
    }
    
    /**
     * Get budget utilization chart data
     */
    private function getBudgetUtilizationData() {
        $sql = "SELECT 
                    p.project_name,
                    p.contract_value,
                    COALESCE(SUM(t.amount), 0) as spent
                FROM projects p
                LEFT JOIN transactions t ON p.id = t.project_id 
                    AND t.status IN (?, ?)
                WHERE p.status = ?
                GROUP BY p.id
                ORDER BY p.project_name";
        
        $db = Database::getInstance();
        return $db->query($sql, [
            TRANSACTION_STATUS_APPROVED,
            TRANSACTION_STATUS_PAID,
            PROJECT_STATUS_ACTIVE
        ]);
    }
    
    /**
     * Get monthly expenses chart data
     */
    private function getMonthlyExpensesData() {
        $sql = "SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    SUM(amount) as total
                FROM transactions
                WHERE status IN (?, ?)
                  AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC";
        
        $db = Database::getInstance();
        return $db->query($sql, [
            TRANSACTION_STATUS_APPROVED,
            TRANSACTION_STATUS_PAID
        ]);
    }
    
    /**
     * Get equipment utilization chart data
     */
    private function getEquipmentUtilizationData() {
        $equipment = new Equipment();
        
        $startDate = date('Y-m-d', strtotime('-30 days'));
        $endDate = date('Y-m-d');
        
        return $equipment->getUtilizationReport($startDate, $endDate);
    }
}