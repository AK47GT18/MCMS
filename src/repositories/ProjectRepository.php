<?php
namespace Mkaka\Repositories;

use Mkaka\Core\Database;

/**
 * Base Repository Interface
 * 
 * @file RepositoryInterface.php
 * @description Defines standard repository methods
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

interface RepositoryInterface {
    public function find($id);
    public function all($conditions = [], $orderBy = null, $limit = null);
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function paginate($page = 1, $perPage = 25);
}

// ============================================
// ============================================

/**
 * Base Repository Class
 * 
 * @file BaseRepository.php
 * @description Abstract repository with common operations
 * @author Anthony Kanjira (CEN/01/01/22)
 */

abstract class BaseRepository implements RepositoryInterface {
    
    protected $model;
    protected $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->initializeModel();
    }
    
    /**
     * Initialize model instance (must be implemented by child)
     */
    abstract protected function initializeModel();
    
    /**
     * Find by ID
     */
    public function find($id) {
        return $this->model->find($id);
    }
    
    /**
     * Get all records
     */
    public function all($conditions = [], $orderBy = null, $limit = null) {
        return $this->model->all($conditions, $orderBy, $limit);
    }
    
    /**
     * Create record
     */
    public function create(array $data) {
        return $this->model->create($data);
    }
    
    /**
     * Update record
     */
    public function update($id, array $data) {
        return $this->model->update($id, $data);
    }
    
    /**
     * Delete record
     */
    public function delete($id) {
        return $this->model->delete($id);
    }
    
    /**
     * Paginate results
     */
    public function paginate($page = 1, $perPage = 25) {
        return $this->model->paginate($page, $perPage);
    }
    
    /**
     * Find by conditions
     */
    public function findBy($conditions) {
        return $this->model->where($conditions);
    }
    
    /**
     * Count records
     */
    public function count($conditions = []) {
        return $this->model->count($conditions);
    }
    
    /**
     * Check if record exists
     */
    public function exists($id) {
        return $this->find($id) !== null;
    }
}

// ============================================
// ============================================

/**
 * Project Repository
 * 
 * @file ProjectRepository.php
 * @description Handles all project-related data operations (FR-03, FR-04, FR-19, FR-24)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class ProjectRepository extends BaseRepository {
    
    protected function initializeModel() {
        $this->model = new Project();
    }
    
    /**
     * Create project with full initialization (FR-03)
     */
    public function createProject(array $data) {
        return $this->model->createProject($data);
    }
    
    /**
     * Get project with complete details
     */
    public function getProjectWithDetails($id) {
        return $this->model->getProjectDetails($id);
    }
    
    /**
     * Get project with manager information
     */
    public function getProjectWithManager($id) {
        return $this->model->getProjectWithManager($id);
    }
    
    /**
     * Get Gantt chart data (FR-03)
     */
    public function getGanttChartData($id) {
        return $this->model->getGanttChartData($id);
    }
    
    /**
     * Calculate project completion (FR-04)
     */
    public function calculateCompletion($id) {
        return $this->model->calculateCompletion($id);
    }
    
    /**
     * Calculate budget utilization (FR-24)
     */
    public function getBudgetUtilization($id) {
        return $this->model->calculateBudgetUtilization($id);
    }
    
    /**
     * Get projects by status
     */
    public function getByStatus($status) {
        return $this->model->getProjectsByStatus($status);
    }
    
    /**
     * Get active projects
     */
    public function getActiveProjects() {
        return $this->model->getActiveProjects();
    }
    
    /**
     * Get projects with filters and pagination
     */
    public function getProjectsWithFilters($filters = [], $page = 1, $perPage = 25) {
        return $this->model->getProjectsWithFilters($filters, $page, $perPage);
    }
    
    /**
     * Get projects by manager
     */
    public function getProjectsByManager($managerId) {
        return $this->findBy(['project_manager_id' => $managerId]);
    }
    
    /**
     * Update project status
     */
    public function updateStatus($id, $status) {
        return $this->model->updateStatus($id, $status);
    }
    
    /**
     * Get dashboard summary
     */
    public function getDashboardSummary($filters = []) {
        return $this->model->getDashboardSummary($filters);
    }
    
    /**
     * Generate status report (FR-19)
     */
    public function generateStatusReport($id) {
        return $this->model->generateStatusReport($id);
    }
    
    /**
     * Get project statistics
     */
    public function getProjectStatistics($id) {
        $project = $this->find($id);
        
        if (!$project) {
            return null;
        }
        
        return [
            'project' => $project,
            'completion' => $this->calculateCompletion($id),
            'budget' => $this->getBudgetUtilization($id),
            'tasks' => $this->getTaskStatistics($id),
            'team_size' => $this->getTeamSize($id),
            'duration' => $this->getProjectDuration($id)
        ];
    }
    
    /**
     * Get task statistics for project
     */
    private function getTaskStatistics($projectId) {
        $task = new Task();
        return $task->getProgressSummary($projectId);
    }
    
    /**
     * Get team size
     */
    private function getTeamSize($projectId) {
        $sql = "SELECT COUNT(DISTINCT assigned_to) as count 
                FROM tasks 
                WHERE project_id = ? AND assigned_to IS NOT NULL";
        
        $result = $this->db->query($sql, [$projectId]);
        return $result ? $result[0]['count'] : 0;
    }
    
    /**
     * Get project duration info
     */
    private function getProjectDuration($projectId) {
        $project = $this->find($projectId);
        
        if (!$project) {
            return null;
        }
        
        $start = new DateTime($project['start_date']);
        $end = new DateTime($project['end_date']);
        $today = new DateTime();
        
        $totalDays = $start->diff($end)->days;
        $elapsedDays = $start->diff($today)->days;
        $remainingDays = max(0, $today->diff($end)->days);
        
        return [
            'total_days' => $totalDays,
            'elapsed_days' => min($elapsedDays, $totalDays),
            'remaining_days' => $remainingDays,
            'percentage_elapsed' => $totalDays > 0 ? round(($elapsedDays / $totalDays) * 100, 2) : 0
        ];
    }
    
    /**
     * Get projects nearing deadline
     */
    public function getProjectsNearingDeadline($days = 30) {
        $targetDate = date('Y-m-d', strtotime("+{$days} days"));
        
        $sql = "SELECT p.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name,
                       DATEDIFF(p.end_date, CURDATE()) as days_remaining
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.end_date <= ? 
                  AND p.status = ?
                ORDER BY p.end_date ASC";
        
        return $this->db->query($sql, [$targetDate, PROJECT_STATUS_ACTIVE]);
    }
    
    /**
     * Get overdue projects
     */
    public function getOverdueProjects() {
        $sql = "SELECT p.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name,
                       DATEDIFF(CURDATE(), p.end_date) as days_overdue
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.end_date < CURDATE() 
                  AND p.status IN (?, ?)
                ORDER BY days_overdue DESC";
        
        return $this->db->query($sql, [PROJECT_STATUS_ACTIVE, PROJECT_STATUS_ON_HOLD]);
    }
    
    /**
     * Get projects by client
     */
    public function getProjectsByClient($clientName) {
        return $this->findBy(['client_name' => $clientName]);
    }
    
    /**
     * Get projects by location
     */
    public function getProjectsByLocation($location) {
        $sql = "SELECT * FROM projects WHERE location LIKE ? ORDER BY created_at DESC";
        return $this->db->query($sql, ["%{$location}%"]);
    }
    
    /**
     * Get projects by value range
     */
    public function getProjectsByValueRange($minValue, $maxValue) {
        $sql = "SELECT p.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.contract_value BETWEEN ? AND ?
                ORDER BY p.contract_value DESC";
        
        return $this->db->query($sql, [$minValue, $maxValue]);
    }
    
    /**
     * Get total contract value by status
     */
    public function getTotalValueByStatus() {
        $sql = "SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(contract_value) as total_value,
                    AVG(contract_value) as avg_value
                FROM projects
                GROUP BY status";
        
        return $this->db->query($sql);
    }
    
    /**
     * Get projects with budget alerts (FR-07)
     */
    public function getProjectsWithBudgetAlerts($threshold = 80) {
        $sql = "SELECT 
                    p.id,
                    p.project_code,
                    p.project_name,
                    p.contract_value,
                    COALESCE(SUM(t.amount), 0) as spent,
                    (COALESCE(SUM(t.amount), 0) / p.contract_value * 100) as percentage
                FROM projects p
                LEFT JOIN transactions t ON p.id = t.project_id 
                    AND t.status IN (?, ?)
                WHERE p.status = ?
                GROUP BY p.id
                HAVING percentage >= ?
                ORDER BY percentage DESC";
        
        return $this->db->query($sql, [
            TRANSACTION_STATUS_APPROVED,
            TRANSACTION_STATUS_PAID,
            PROJECT_STATUS_ACTIVE,
            $threshold
        ]);
    }
    
    /**
     * Get project performance metrics
     */
    public function getPerformanceMetrics($projectId = null) {
        $where = $projectId ? "WHERE p.id = ?" : "";
        $params = $projectId ? [$projectId] : [];
        
        $sql = "SELECT 
                    COUNT(*) as total_projects,
                    AVG(p.completion_percentage) as avg_completion,
                    SUM(p.contract_value) as total_value,
                    AVG(DATEDIFF(p.end_date, p.start_date)) as avg_duration,
                    COUNT(CASE WHEN p.status = ? THEN 1 END) as completed_count,
                    COUNT(CASE WHEN p.end_date < CURDATE() AND p.status != ? THEN 1 END) as overdue_count
                FROM projects p
                {$where}";
        
        $allParams = array_merge([PROJECT_STATUS_COMPLETED, PROJECT_STATUS_COMPLETED], $params);
        $result = $this->db->query($sql, $allParams);
        
        return $result ? $result[0] : null;
    }
    
    /**
     * Search projects
     */
    public function search($keyword) {
        $sql = "SELECT p.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.project_name LIKE ? 
                   OR p.project_code LIKE ?
                   OR p.client_name LIKE ?
                   OR p.location LIKE ?
                   OR p.description LIKE ?
                ORDER BY p.created_at DESC";
        
        $searchTerm = "%{$keyword}%";
        return $this->db->query($sql, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    /**
     * Get monthly project statistics
     */
    public function getMonthlyStatistics($year = null) {
        $year = $year ?: date('Y');
        
        $sql = "SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as projects_created,
                    SUM(contract_value) as total_value,
                    AVG(contract_value) as avg_value
                FROM projects
                WHERE YEAR(created_at) = ?
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC";
        
        return $this->db->query($sql, [$year]);
    }
    
    /**
     * Clone project structure (without data)
     */
    public function cloneProject($sourceId, $newName) {
        $sourceProject = $this->find($sourceId);
        
        if (!$sourceProject) {
            throw new Exception("Source project not found");
        }
        
        // Remove fields that shouldn't be cloned
        unset($sourceProject['id']);
        unset($sourceProject['project_code']);
        unset($sourceProject['created_at']);
        unset($sourceProject['updated_at']);
        unset($sourceProject['completion_percentage']);
        
        // Update name and status
        $sourceProject['project_name'] = $newName;
        $sourceProject['status'] = PROJECT_STATUS_PLANNING;
        
        return $this->createProject($sourceProject);
    }
    
    /**
     * Archive completed project
     */
    public function archiveProject($id) {
        $project = $this->find($id);
        
        if (!$project) {
            throw new Exception("Project not found");
        }
        
        if ($project['status'] !== PROJECT_STATUS_COMPLETED) {
            throw new Exception("Only completed projects can be archived");
        }
        
        // Move to archive table or add archived flag
        return $this->update($id, [
            'archived' => 1,
            'archived_at' => date(DATETIME_FORMAT)
        ]);
    }
    
    /**
     * Get archived projects
     */
    public function getArchivedProjects($page = 1, $perPage = 25) {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT p.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as manager_name
                FROM projects p
                LEFT JOIN users u ON p.project_manager_id = u.id
                WHERE p.archived = 1
                ORDER BY p.archived_at DESC
                LIMIT ? OFFSET ?";
        
        $data = $this->db->query($sql, [$perPage, $offset]);
        
        $countSql = "SELECT COUNT(*) as count FROM projects WHERE archived = 1";
        $total = $this->db->query($countSql)[0]['count'];
        
        return [
            'data' => $data,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage)
        ];
    }
    
    /**
     * Restore archived project
     */
    public function restoreProject($id) {
        return $this->update($id, [
            'archived' => 0,
            'archived_at' => null
        ]);
    }
    
    /**
     * Get project timeline
     */
    public function getProjectTimeline($id) {
        $sql = "SELECT 
                    'project' as event_type,
                    'Project Created' as event_name,
                    created_at as event_date,
                    NULL as user_name
                FROM projects WHERE id = ?
                
                UNION ALL
                
                SELECT 
                    'task' as event_type,
                    CONCAT('Task: ', task_name) as event_name,
                    created_at as event_date,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.project_id = ?
                
                UNION ALL
                
                SELECT 
                    'transaction' as event_type,
                    CONCAT('Transaction: ', transaction_code) as event_name,
                    created_at as event_date,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM transactions tr
                LEFT JOIN users u ON tr.submitted_by = u.id
                WHERE tr.project_id = ?
                
                UNION ALL
                
                SELECT 
                    'report' as event_type,
                    CONCAT('Site Report: ', report_code) as event_name,
                    created_at as event_date,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM site_reports sr
                LEFT JOIN users u ON sr.submitted_by = u.id
                WHERE sr.project_id = ?
                
                ORDER BY event_date DESC";
        
        return $this->db->query($sql, [$id, $id, $id, $id]);
    }
    
    /**
     * Export project data
     */
    public function exportProjectData($id) {
        $project = $this->getProjectWithDetails($id);
        
        if (!$project) {
            throw new Exception("Project not found");
        }
        
        // Get all related data
        $task = new Task();
        $tasks = $task->getProjectTasks($id);
        
        $transaction = new Transaction();
        $transactions = $transaction->getFinancialReport(['project_id' => $id]);
        
        $siteReport = new SiteReport();
        $reports = $siteReport->getProjectReports($id);
        
        return [
            'project' => $project,
            'tasks' => $tasks,
            'transactions' => $transactions,
            'site_reports' => $reports,
            'export_date' => date(DATETIME_FORMAT),
            'exported_by' => Authentication::user()['id']
        ];
    }
}