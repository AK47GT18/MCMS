<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Models\Project;
use Mkaka\Models\Task;

/**
 * Project Controller
 * 
 * @file ProjectController.php
 * @description Project and task management with Gantt charts (FR-03, FR-04, FR-19)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 * @supervisor Mr. John Kaira
 */

class ProjectController extends Controller {
    
    /**
     * List all projects
     */
    public function index() {
        $this->requireAuth();
        $this->authorize('projects.view');
        
        try {
            $page = $this->request->input('page', 1);
            $search = $this->request->input('search');
            $status = $this->request->input('status');
            
            $filters = [];
            if ($search) $filters['search'] = $search;
            if ($status) $filters['status'] = $status;
            
            $project = new Project();
            $projects = $project->getProjectsWithFilters($filters, $page);
            
            return $this->view('projects/index', [
                'projects' => $projects['data'],
                'pagination' => $projects,
                'filters' => $filters
            ]);
            
        } catch (Exception $e) {
            error_log("Projects list error: " . $e->getMessage());
            $this->flash('error', 'Error loading projects');
            return $this->redirect('/dashboard');
        }
    }
    
    /**
     * Show create project form
     */
    public function create() {
        $this->requireAuth();
        $this->authorize('projects.create');
        
        $userModel = new User();
        $projectManagers = $userModel->getUsersByRole(ROLE_PROJECT_MANAGER);
        
        return $this->view('projects/create', [
            'managers' => $projectManagers
        ]);
    }
    
    /**
     * Store new project (FR-03)
     */
    public function store() {
        $this->requireAuth();
        $this->authorize('projects.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'project_name' => 'required|min:3',
                'client_name' => 'required',
                'start_date' => 'required',
                'end_date' => 'required',
                'contract_value' => 'numeric'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields correctly');
                return $this->redirect('/projects/create');
            }
            
            $project = new Project();
            $projectId = $project->createProject($this->request->all());
            
            $this->flash('success', 'Project created successfully');
            return $this->redirect('/projects/' . $projectId);
            
        } catch (Exception $e) {
            error_log("Create project error: " . $e->getMessage());
            $this->flash('error', 'Error creating project: ' . $e->getMessage());
            return $this->redirect('/projects/create');
        }
    }
    
    /**
     * Show project details (FR-19)
     */
    public function show($id) {
        $this->requireAuth();
        $this->authorize('projects.view');
        
        try {
            $project = new Project();
            $projectDetails = $project->getProjectDetails($id);
            
            if (!$projectDetails) {
                $this->flash('error', 'Project not found');
                return $this->redirect('/projects');
            }
            
            return $this->view('projects/show', [
                'project' => $projectDetails
            ]);
            
        } catch (Exception $e) {
            error_log("Show project error: " . $e->getMessage());
            $this->flash('error', 'Error loading project details');
            return $this->redirect('/projects');
        }
    }
    
    /**
     * Show edit project form
     */
    public function edit($id) {
        $this->requireAuth();
        $this->authorize('projects.edit');
        
        try {
            $project = new Project();
            $projectData = $project->find($id);
            
            if (!$projectData) {
                $this->flash('error', 'Project not found');
                return $this->redirect('/projects');
            }
            
            $userModel = new User();
            $projectManagers = $userModel->getUsersByRole(ROLE_PROJECT_MANAGER);
            
            return $this->view('projects/edit', [
                'project' => $projectData,
                'managers' => $projectManagers
            ]);
            
        } catch (Exception $e) {
            error_log("Edit project error: " . $e->getMessage());
            $this->flash('error', 'Error loading project');
            return $this->redirect('/projects');
        }
    }
    
    /**
     * Update project
     */
    public function update($id) {
        $this->requireAuth();
        $this->authorize('projects.edit');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'project_name' => 'required|min:3',
                'client_name' => 'required',
                'start_date' => 'required',
                'end_date' => 'required'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields correctly');
                return $this->redirect('/projects/' . $id . '/edit');
            }
            
            $project = new Project();
            $project->update($id, $this->request->all());
            
            $this->flash('success', 'Project updated successfully');
            return $this->redirect('/projects/' . $id);
            
        } catch (Exception $e) {
            error_log("Update project error: " . $e->getMessage());
            $this->flash('error', 'Error updating project');
            return $this->redirect('/projects/' . $id . '/edit');
        }
    }
    
    /**
     * Update project status
     */
    public function updateStatus($id) {
        $this->requireAuth();
        $this->authorize('projects.edit');
        
        try {
            $status = $this->request->input('status');
            
            $project = new Project();
            $project->updateStatus($id, $status);
            
            return $this->json([
                'success' => true,
                'message' => 'Project status updated'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error updating status: ' . $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Show project Gantt chart (FR-03)
     */
    public function gantt($id) {
        $this->requireAuth();
        $this->authorize('projects.view');
        
        try {
            $project = new Project();
            $projectData = $project->find($id);
            
            if (!$projectData) {
                $this->flash('error', 'Project not found');
                return $this->redirect('/projects');
            }
            
            $ganttData = $project->getGanttChartData($id);
            
            return $this->view('projects/gantt', [
                'project' => $projectData,
                'gantt_data' => $ganttData
            ]);
            
        } catch (Exception $e) {
            error_log("Gantt chart error: " . $e->getMessage());
            $this->flash('error', 'Error loading Gantt chart');
            return $this->redirect('/projects/' . $id);
        }
    }
    
    /**
     * Get Gantt data (AJAX)
     */
    public function getGanttData($id) {
        $this->requireAuth();
        $this->authorize('projects.view');
        
        try {
            $project = new Project();
            $ganttData = $project->getGanttChartData($id);
            
            return $this->json([
                'success' => true,
                'data' => $ganttData
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error loading Gantt data'
            ], 500);
        }
    }
    
    /**
     * Show project tasks
     */
    public function tasks($id) {
        $this->requireAuth();
        $this->authorize('tasks.view');
        
        try {
            $project = new Project();
            $projectData = $project->find($id);
            
            if (!$projectData) {
                $this->flash('error', 'Project not found');
                return $this->redirect('/projects');
            }
            
            $task = new Task();
            $tasks = $task->getProjectTasks($id);
            $tasksSummary = $task->getProgressSummary($id);
            
            return $this->view('projects/tasks', [
                'project' => $projectData,
                'tasks' => $tasks,
                'summary' => $tasksSummary
            ]);
            
        } catch (Exception $e) {
            error_log("Tasks error: " . $e->getMessage());
            $this->flash('error', 'Error loading tasks');
            return $this->redirect('/projects/' . $id);
        }
    }
    
    /**
     * Create task (FR-03)
     */
    public function createTask($projectId) {
        $this->requireAuth();
        $this->authorize('tasks.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'task_name' => 'required',
                'start_date' => 'required',
                'end_date' => 'required'
            ]);
            
            if ($validator->fails()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Please fill all required fields'
                ], 400);
            }
            
            $taskData = $this->request->all();
            $taskData['project_id'] = $projectId;
            
            $task = new Task();
            $taskId = $task->createTask($taskData);
            
            return $this->json([
                'success' => true,
                'message' => 'Task created successfully',
                'task_id' => $taskId
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error creating task: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update task completion (FR-04)
     */
    public function updateTaskCompletion($projectId, $taskId) {
        $this->requireAuth();
        $this->authorize('tasks.edit');
        
        try {
            $percentage = $this->request->input('completion_percentage');
            $actualHours = $this->request->input('actual_hours');
            $notes = $this->request->input('notes');
            
            $task = new Task();
            $task->updateCompletion($taskId, $percentage, $actualHours, $notes);
            
            return $this->json([
                'success' => true,
                'message' => 'Task progress updated'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error updating task: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update task status
     */
    public function updateTaskStatus($projectId, $taskId) {
        $this->requireAuth();
        $this->authorize('tasks.edit');
        
        try {
            $status = $this->request->input('status');
            $notes = $this->request->input('notes');
            
            $task = new Task();
            $task->updateStatus($taskId, $status, $notes);
            
            return $this->json([
                'success' => true,
                'message' => 'Task status updated'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error updating status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate project status report (FR-19)
     */
    public function generateReport($id) {
        $this->requireAuth();
        $this->authorize('reports.view');
        
        try {
            $project = new Project();
            $report = $project->generateStatusReport($id);
            
            return $this->view('projects/report', [
                'report' => $report
            ]);
            
        } catch (Exception $e) {
            error_log("Generate report error: " . $e->getMessage());
            $this->flash('error', 'Error generating report');
            return $this->redirect('/projects/' . $id);
        }
    }
    
    /**
     * Export project report
     */
    public function exportReport($id) {
        $this->requireAuth();
        $this->authorize('reports.export');
        
        try {
            $format = $this->request->input('format', 'pdf');
            
            $project = new Project();
            $report = $project->generateStatusReport($id);
            
            // TODO: Implement PDF/Excel export
            // For now, return JSON
            return $this->json([
                'success' => true,
                'data' => $report
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error exporting report'
            ], 500);
        }
    }
    
    /**
     * Get project budget summary (FR-24)
     */
    public function getBudget($id) {
        $this->requireAuth();
        $this->authorize('finance.view');
        
        try {
            $project = new Project();
            $budget = $project->calculateBudgetUtilization($id);
            
            return $this->json([
                'success' => true,
                'data' => $budget
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error loading budget'
            ], 500);
        }
    }
}