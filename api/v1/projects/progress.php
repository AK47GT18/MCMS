<?php
/**
 * GET /api/v1/projects/:id/progress
 * Get project progress data formatted for Gantt chart visualization
 * 
 * @requires Authentication, projects.view permission
 * @param int id Project ID
 * @query boolean include_milestones (optional: include contract milestones)
 * @query boolean include_equipment (optional: include equipment assignments)
 * 
 * @response JSON
 *   - success: boolean
 *   - project: object
 *   - tasks: array (formatted for Gantt chart)
 *   - milestones: array (if include_milestones=true)
 *   - summary: object (overall progress stats)
 *   - gantt_data: object (formatted for charting library)
 */

require_once __DIR__ . '/../../../src/config/bootstrap.php';

header('Content-Type: application/json');

$authMiddleware = new AuthMiddleware();
$authMiddleware->handle();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    Authorization::require('projects.view');
    
    $projectId = (int)($_GET['id'] ?? 0);
    if (!$projectId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Project ID required']);
        exit;
    }
    
    $projectRepo = new ProjectRepository();
    $project = $projectRepo->find($projectId);
    
    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Project not found']);
        exit;
    }
    
    // Get all tasks for Gantt visualization
    $taskRepo = new TaskRepository();
    $allTasks = $taskRepo->getAllByProject($projectId);
    
    // Format tasks for Gantt chart
    $ganttTasks = [];
    $userRepo = new UserRepository();
    
    foreach ($allTasks as $task) {
        $assignedUser = $task['assigned_to'] ? $userRepo->find($task['assigned_to']) : null;
        
        $ganttTasks[] = [
            'id' => $task['id'],
            'name' => $task['name'],
            'description' => $task['description'],
            'start_date' => $task['start_date'],
            'end_date' => $task['end_date'],
            'progress' => (int)$task['progress_percent'],
            'priority' => $task['priority'],
            'status' => $task['status'],
            'assigned_to' => $task['assigned_to'],
            'assigned_user_name' => $assignedUser ? $assignedUser['name'] : null,
            'dependencies' => $task['depends_on'] ? explode(',', $task['depends_on']) : [],
            'estimated_hours' => (int)($task['estimated_hours'] ?? 0),
            'actual_hours' => (int)($task['actual_hours'] ?? 0)
        ];
    }
    
    // Get optional milestone data
    $milestones = [];
    if (!empty($_GET['include_milestones'])) {
        $contractRepo = new ContractRepository();
        $contracts = $contractRepo->getByProject($projectId);
        
        foreach ($contracts as $contract) {
            $contractMilestones = $contractRepo->getMilestones($contract['id']);
            foreach ($contractMilestones as $milestone) {
                $milestones[] = [
                    'id' => 'm_' . $milestone['id'],
                    'name' => $milestone['title'],
                    'date' => $milestone['due_date'],
                    'type' => 'milestone',
                    'contract_id' => $contract['id'],
                    'contract_name' => $contract['title']
                ];
            }
        }
    }
    
    // Calculate summary statistics
    $totalTasks = count($allTasks);
    $completedTasks = count(array_filter($allTasks, fn($t) => $t['status'] === 'completed'));
    $inProgressTasks = count(array_filter($allTasks, fn($t) => $t['status'] === 'in_progress'));
    $blockedTasks = count(array_filter($allTasks, fn($t) => $t['status'] === 'blocked'));
    
    $avgProgress = $totalTasks > 0 
        ? array_sum(array_map(fn($t) => $t['progress_percent'], $allTasks)) / $totalTasks
        : 0;
    
    $summary = [
        'total_tasks' => $totalTasks,
        'completed_tasks' => $completedTasks,
        'in_progress_tasks' => $inProgressTasks,
        'blocked_tasks' => $blockedTasks,
        'pending_tasks' => $totalTasks - $completedTasks - $inProgressTasks - $blockedTasks,
        'overall_progress_percent' => round($avgProgress, 2),
        'project_status' => $project['status'],
        'start_date' => $project['start_date'],
        'end_date' => $project['end_date'],
        'days_elapsed' => max(0, floor((time() - strtotime($project['start_date'])) / 86400)),
        'days_remaining' => max(0, floor((strtotime($project['end_date']) - time()) / 86400))
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'project' => [
            'id' => $project['id'],
            'name' => $project['name'],
            'description' => $project['description'],
            'status' => $project['status'],
            'start_date' => $project['start_date'],
            'end_date' => $project['end_date']
        ],
        'tasks' => $ganttTasks,
        'milestones' => $milestones,
        'summary' => $summary,
        'gantt_data' => [
            'tasks' => $ganttTasks,
            'milestones' => $milestones,
            'project_start' => $project['start_date'],
            'project_end' => $project['end_date']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Get project progress API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred']);
}
