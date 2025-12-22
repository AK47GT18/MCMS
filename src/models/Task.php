<?php
namespace Mkaka\Models;

use Mkaka\Core\Model;
use Mkaka\Core\Authentication;
use Mkaka\Models\AuditLog;
use Mkaka\Models\Project;
use Mkaka\Models\Notification;
use Mkaka\Models\User;

class Task extends Model {
        protected $table = 'tasks';
        protected $primaryKey = 'id';
        protected $fillable = [
                    'project_id',
                    'task_code',
                    'task_name',
                    'description',
                    'start_date',
                    'end_date',
                    'duration_days',
                    'assigned_to',
                    'status',
                    'completion_percentage',
                    'dependencies',
                    'parent_task_id',
                    'priority',
                    'weight',
                    'estimated_hours',
                    'actual_hours',
                    'estimated_cost',
                    'actual_cost'
                    ];
protected $timestamps = true;
/**
 * Create task with automatic Gantt calculations (FR-03)
 */
public function createTask($data) {
    // Validate task data
    $this->validateTaskData($data);
    
    // Generate task code
    $data['task_code'] = $this->generateTaskCode($data['project_id']);
    
    // Calculate duration if not provided
    if (empty($data['duration_days']) && !empty($data['start_date']) && !empty($data['end_date'])) {
        $start = new DateTime($data['start_date']);
        $end = new DateTime($data['end_date']);
        $data['duration_days'] = $start->diff($end)->days + 1; // Include end date
    }
    
    // Set defaults
    if (empty($data['status'])) {
        $data['status'] = 'pending';
    }
    
    if (!isset($data['completion_percentage'])) {
        $data['completion_percentage'] = 0;
    }
    
    if (empty($data['weight'])) {
        $data['weight'] = 1;
    }
    
    if (empty($data['priority'])) {
        $data['priority'] = 'normal';
    }
    
    $this->db->beginTransaction();
    
    try {
        $taskId = $this->create($data);
        
        // Validate dependencies
        if (!empty($data['dependencies'])) {
            $this->validateDependencies($taskId, $data['dependencies']);
        }
        
        // Log task creation
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'task_created',
            'entity_type' => 'task',
            'entity_id' => $taskId,
            'details' => json_encode([
                'task_code' => $data['task_code'],
                'task_name' => $data['task_name'],
                'project_id' => $data['project_id']
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        // Notify assigned user
        if (!empty($data['assigned_to'])) {
            $this->notifyTaskAssignment($taskId, $data['assigned_to']);
        }
        
        // Update project completion
        $project = new Project();
        $project->calculateCompletion($data['project_id']);
        
        $this->db->commit();
        return $taskId;
        
    } catch (Exception $e) {
        $this->db->rollback();
        throw $e;
    }
}

/**
 * Validate task data
 */
private function validateTaskData($data) {
    $required = ['project_id', 'task_name', 'start_date', 'end_date'];
    
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Field '{$field}' is required");
        }
    }
    
    // Validate dates
    if (strtotime($data['start_date']) > strtotime($data['end_date'])) {
        throw new Exception("End date must be after start date");
    }
    
    // Validate project exists
    $project = new Project();
    if (!$project->find($data['project_id'])) {
        throw new Exception("Invalid project ID");
    }
}

/**
 * Generate unique task code
 */
private function generateTaskCode($projectId) {
    $project = new Project();
    $projectData = $project->find($projectId);
    
    $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE project_id = ?";
    $result = $this->db->query($sql, [$projectId]);
    $count = $result[0]['count'] + 1;
    
    return $projectData['project_code'] . '-T' . sprintf('%03d', $count);
}

/**
 * Validate task dependencies
 */
private function validateDependencies($taskId, $dependencies) {
    if (is_string($dependencies)) {
        $dependencies = json_decode($dependencies, true);
    }
    
    if (!is_array($dependencies)) {
        return true;
    }
    
    foreach ($dependencies as $depId) {
        // Check if dependency exists
        $depTask = $this->find($depId);
        if (!$depTask) {
            throw new Exception("Dependency task ID {$depId} not found");
        }
        
        // Check for circular dependencies
        if ($this->hasCircularDependency($taskId, $depId)) {
            throw new Exception("Circular dependency detected");
        }
    }
    
    return true;
}

/**
 * Check for circular dependencies
 */
private function hasCircularDependency($taskId, $depId, $visited = []) {
    if ($taskId == $depId) {
        return true;
    }
    
    if (in_array($depId, $visited)) {
        return false;
    }
    
    $visited[] = $depId;
    
    $depTask = $this->find($depId);
    if (empty($depTask['dependencies'])) {
        return false;
    }
    
    $dependencies = json_decode($depTask['dependencies'], true);
    if (!is_array($dependencies)) {
        return false;
    }
    
    foreach ($dependencies as $nextDepId) {
        if ($this->hasCircularDependency($taskId, $nextDepId, $visited)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Update task completion percentage (FR-04)
 */
public function updateCompletion($taskId, $percentage, $actualHours = null, $notes = null) {
    if ($percentage < 0 || $percentage > 100) {
        throw new Exception("Completion percentage must be between 0 and 100");
    }
    
    $task = $this->find($taskId);
    if (!$task) {
        throw new Exception("Task not found");
    }
    
    // Determine status based on percentage
    $status = $this->determineStatus($percentage);
    
    $updateData = [
        'completion_percentage' => $percentage,
        'status' => $status
    ];
    
    if ($actualHours !== null) {
        $updateData['actual_hours'] = $task['actual_hours'] + $actualHours;
    }
    
    $this->db->beginTransaction();
    
    try {
        $updated = $this->update($taskId, $updateData);
        
        // Log progress update
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'task_progress_updated',
            'entity_type' => 'task',
            'entity_id' => $taskId,
            'details' => json_encode([
                'task_code' => $task['task_code'],
                'old_percentage' => $task['completion_percentage'],
                'new_percentage' => $percentage,
                'notes' => $notes
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        // Update project completion (FR-04)
        $project = new Project();
        $project->calculateCompletion($task['project_id']);
        
        // Notify if task completed
        if ($percentage == 100 && $task['completion_percentage'] < 100) {
            $this->notifyTaskCompletion($taskId);
        }
        
        $this->db->commit();
        return $updated;
        
    } catch (Exception $e) {
        $this->db->rollback();
        throw $e;
    }
}

/**
 * Determine task status based on completion percentage
 */
private function determineStatus($percentage) {
    if ($percentage == 100) {
        return 'completed';
    } elseif ($percentage > 0) {
        return 'in_progress';
    } else {
        return 'pending';
    }
}

/**
 * Get tasks for project (for Gantt chart) (FR-03)
 */
public function getProjectTasks($projectId) {
    $sql = "SELECT t.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_name,
                   u.email as assigned_email,
                   CASE 
                       WHEN t.end_date < CURDATE() AND t.status != 'completed' THEN 'overdue'
                       ELSE t.status
                   END as display_status
            FROM {$this->table} t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = ?
            ORDER BY t.start_date ASC, t.task_code ASC";
    
    return $this->db->query($sql, [$projectId]);
}

/**
 * Get tasks assigned to user
 */
public function getUserTasks($userId, $filters = []) {
    $where = ["t.assigned_to = ?"];
    $params = [$userId];
    
    if (!empty($filters['status'])) {
        $where[] = "t.status = ?";
        $params[] = $filters['status'];
    }
    
    if (!empty($filters['project_id'])) {
        $where[] = "t.project_id = ?";
        $params[] = $filters['project_id'];
    }
    
    if (!empty($filters['priority'])) {
        $where[] = "t.priority = ?";
        $params[] = $filters['priority'];
    }
    
    $whereClause = implode(" AND ", $where);
    
    $sql = "SELECT t.*, 
                   p.project_name, 
                   p.project_code,
                   DATEDIFF(t.end_date, CURDATE()) as days_remaining
            FROM {$this->table} t
            JOIN projects p ON t.project_id = p.id
            WHERE {$whereClause}
            ORDER BY t.end_date ASC, t.priority DESC";
    
    return $this->db->query($sql, $params);
}

/**
 * Get overdue tasks
 */
public function getOverdueTasks($projectId = null) {
    $sql = "SELECT t.*, 
                   p.project_name,
                   p.project_code,
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_name,
                   DATEDIFF(CURDATE(), t.end_date) as days_overdue
            FROM {$this->table} t
            JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.end_date < CURDATE() 
              AND t.status != 'completed'";
    
    $params = [];
    
    if ($projectId) {
        $sql .= " AND t.project_id = ?";
        $params[] = $projectId;
    }
    
    $sql .= " ORDER BY t.end_date ASC";
    
    return $this->db->query($sql, $params);
}

/**
 * Get task dependencies
 */
public function getDependencies($taskId) {
    $task = $this->find($taskId);
    
    if (!$task || empty($task['dependencies'])) {
        return [];
    }
    
    $dependencyIds = json_decode($task['dependencies'], true);
    
    if (empty($dependencyIds) || !is_array($dependencyIds)) {
        return [];
    }
    
    $placeholders = implode(',', array_fill(0, count($dependencyIds), '?'));
    $sql = "SELECT t.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_name
            FROM {$this->table} t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id IN ($placeholders)";
    
    return $this->db->query($sql, $dependencyIds);
}

/**
 * Check if task can start (all dependencies completed)
 */
public function canStart($taskId) {
    $dependencies = $this->getDependencies($taskId);
    
    if (empty($dependencies)) {
        return true;
    }
    
    foreach ($dependencies as $dep) {
        if ($dep['status'] != 'completed') {
            return false;
        }
    }
    
    return true;
}

/**
 * Get dependent tasks (tasks that depend on this task)
 */
public function getDependentTasks($taskId) {
    $sql = "SELECT t.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_name
            FROM {$this->table} t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.dependencies LIKE ?";
    
    return $this->db->query($sql, ['%"' . $taskId . '"%']);
}

/**
 * Get tasks on critical path
 */
public function getCriticalPath($projectId) {
    // Get all project tasks
    $tasks = $this->getProjectTasks($projectId);
    
    if (empty($tasks)) {
        return [];
    }
    
    // Build task network
    $taskMap = [];
    foreach ($tasks as $task) {
        $taskMap[$task['id']] = $task;
        $taskMap[$task['id']]['earliest_start'] = 0;
        $taskMap[$task['id']]['earliest_finish'] = 0;
        $taskMap[$task['id']]['latest_start'] = PHP_INT_MAX;
        $taskMap[$task['id']]['latest_finish'] = PHP_INT_MAX;
        $taskMap[$task['id']]['slack'] = 0;
    }
    
    // Calculate earliest start/finish (forward pass)
    foreach ($taskMap as $id => $task) {
        $earliestStart = 0;
        
        if (!empty($task['dependencies'])) {
            $deps = json_decode($task['dependencies'], true);
            if (is_array($deps)) {
                foreach ($deps as $depId) {
                    if (isset($taskMap[$depId])) {
                        $earliestStart = max($earliestStart, $taskMap[$depId]['earliest_finish']);
                    }
                }
            }
        }
        
        $taskMap[$id]['earliest_start'] = $earliestStart;
        $taskMap[$id]['earliest_finish'] = $earliestStart + $task['duration_days'];
    }
    
    // Find project finish time
    $projectFinish = 0;
    foreach ($taskMap as $task) {
        $projectFinish = max($projectFinish, $task['earliest_finish']);
    }
    
    // Calculate latest start/finish (backward pass)
    foreach (array_reverse($taskMap, true) as $id => $task) {
        $dependents = $this->getDependentTasks($id);
        
        if (empty($dependents)) {
            $taskMap[$id]['latest_finish'] = $projectFinish;
        } else {
            $latestFinish = PHP_INT_MAX;
            foreach ($dependents as $dep) {
                if (isset($taskMap[$dep['id']])) {
                    $latestFinish = min($latestFinish, $taskMap[$dep['id']]['latest_start']);
                }
            }
            $taskMap[$id]['latest_finish'] = $latestFinish;
        }
        
        $taskMap[$id]['latest_start'] = $taskMap[$id]['latest_finish'] - $task['duration_days'];
        $taskMap[$id]['slack'] = $taskMap[$id]['latest_start'] - $taskMap[$id]['earliest_start'];
    }
    
    // Critical path tasks have zero slack
    $criticalPath = [];
    foreach ($taskMap as $task) {
        if ($task['slack'] == 0 && $task['status'] != 'completed') {
            $criticalPath[] = $task;
        }
    }
    
    return $criticalPath;
}

/**
 * Get task progress summary
 */
public function getProgressSummary($projectId) {
    $sql = "SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as on_hold,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN end_date < CURDATE() AND status != 'completed' THEN 1 ELSE 0 END) as overdue,
                AVG(completion_percentage) as avg_completion,
                SUM(estimated_hours) as total_estimated_hours,
                SUM(actual_hours) as total_actual_hours
            FROM {$this->table}
            WHERE project_id = ?";
    
    $result = $this->db->query($sql, [$projectId]);
    return $result ? $result[0] : null;
}

/**
 * Update task status
 */
public function updateStatus($taskId, $status, $notes = null) {
    $validStatuses = ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'];
    
    if (!in_array($status, $validStatuses)) {
        throw new Exception("Invalid task status");
    }
    
    $task = $this->find($taskId);
    if (!$task) {
        throw new Exception("Task not found");
    }
    
    $updateData = ['status' => $status];
    
    // Auto-update completion percentage based on status
    if ($status == 'completed') {
        $updateData['completion_percentage'] = 100;
    } elseif ($status == 'pending') {
        $updateData['completion_percentage'] = 0;
    }
    
    $this->db->beginTransaction();
    
    try {
        $updated = $this->update($taskId, $updateData);
        
        // Log status change
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'task_status_changed',
            'entity_type' => 'task',
            'entity_id' => $taskId,
            'details' => json_encode([
                'task_code' => $task['task_code'],
                'old_status' => $task['status'],
                'new_status' => $status,
                'notes' => $notes
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
        
        // Update project completion
        $project = new Project();
        $project->calculateCompletion($task['project_id']);
        
        $this->db->commit();
        return $updated;
        
    } catch (Exception $e) {
        $this->db->rollback();
        throw $e;
    }
}

/**
 * Assign task to user
 */
public function assignTask($taskId, $userId) {
    $task = $this->find($taskId);
    if (!$task) {
        throw new Exception("Task not found");
    }
    
    $user = new User();
    if (!$user->find($userId)) {
        throw new Exception("User not found");
    }
    
    $updated = $this->update($taskId, ['assigned_to' => $userId]);
    
    if ($updated) {
        $this->notifyTaskAssignment($taskId, $userId);
        
        // Log assignment
        $auditLog = new AuditLog();
        $auditLog->create([
            'user_id' => Authentication::user()['id'],
            'action' => 'task_assigned',
            'entity_type' => 'task',
            'entity_id' => $taskId,
            'details' => json_encode([
                'task_code' => $task['task_code'],
                'assigned_to' => $userId
            ]),
            'ip_address' => $_SERVER['REMOTE_ADDR']
        ]);
    }
    
    return $updated;
}

/**
 * Notify user of task assignment
 */
private function notifyTaskAssignment($taskId, $userId) {
    $task = $this->find($taskId);
    $project = new Project();
    $projectData = $project->find($task['project_id']);
    
    $notification = new Notification();
    $notification->create([
        'user_id' => $userId,
        'notification_type' => 'task_assigned',
        'title' => 'New Task Assignment',
        'message' => "You have been assigned task: {$task['task_name']} in project {$projectData['project_name']}",
        'entity_type' => 'task',
        'entity_id' => $taskId,
        'is_read' => 0,
        'priority' => $task['priority'] == 'high' ? 'high' : 'normal'
    ]);
}

/**
 * Notify when task is completed
 */
private function notifyTaskCompletion($taskId) {
    $task = $this->find($taskId);
    $project = new Project();
    $projectData = $project->find($task['project_id']);
    
    // Notify project manager
    if ($projectData['project_manager_id']) {
        $notification = new Notification();
        $notification->create([
            'user_id' => $projectData['project_manager_id'],
            'notification_type' => 'task_completed',
            'title' => 'Task Completed',
            'message' => "Task {$task['task_name']} has been completed in project {$projectData['project_name']}",
            'entity_type' => 'task',
            'entity_id' => $taskId,
            'is_read' => 0,
            'priority' => 'normal'
        ]);
    }
    
    // Notify dependent tasks' assignees
    $dependents = $this->getDependentTasks($taskId);
    foreach ($dependents as $dependent) {
        if ($dependent['assigned_to'] && $this->canStart($dependent['id'])) {
            $notification = new Notification();
            $notification->create([
                'user_id' => $dependent['assigned_to'],
                'notification_type' => 'task_can_start',
                'title' => 'Task Can Start',
                'message' => "Task {$dependent['task_name']} can now be started (dependencies completed)",
                'entity_type' => 'task',
                'entity_id' => $dependent['id'],
                'is_read' => 0,
                'priority' => 'normal'
            ]);
        }
    }
}

/**
 * Update task dates (for Gantt rescheduling)
 */
public function updateTaskDates($taskId, $startDate, $endDate) {
    $task = $this->find($taskId);
    if (!$task) {
        throw new Exception("Task not found");
    }
    
    // Calculate new duration
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    $duration = $start->diff($end)->days + 1;
    
    $this->update($taskId, [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'duration_days' => $duration
    ]);
    
    // Log date change
    $auditLog = new AuditLog();
    $auditLog->create([
        'user_id' => Authentication::user()['id'],
        'action' => 'task_dates_updated',
        'entity_type' => 'task',
        'entity_id' => $taskId,
        'details' => json_encode([
            'task_code' => $task['task_code'],
            'old_dates' => ['start' => $task['start_date'], 'end' => $task['end_date']],
            'new_dates' => ['start' => $startDate, 'end' => $endDate]
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    ]);
    
    return true;
}

/**
 * Add task comment/note
 */
public function addComment($taskId, $comment) {
    $sql = "INSERT INTO task_comments (task_id, user_id, comment, created_at) 
            VALUES (?, ?, ?, ?)";
    
    return $this->db->execute($sql, [
        $taskId,
        Authentication::user()['id'],
        $comment,
        date(DATETIME_FORMAT)
    ]);
}

/**
 * Get task comments
 */
public function getComments($taskId) {
    $sql = "SELECT tc.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as user_name
            FROM task_comments tc
            LEFT JOIN users u ON tc.user_id = u.id
            WHERE tc.task_id = ?
            ORDER BY tc.created_at DESC";
    
    return $this->db->query($sql, [$taskId]);
}
}