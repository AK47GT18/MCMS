<?php
/**
 * Projects - Tasks Page
 * Manage project tasks and milestones
 */

$projectId = $_GET['id'] ?? null;
$pageTitle = 'Project Tasks';
$currentPage = 'projects';
$breadcrumbs = [
    ['name' => 'Projects', 'url' => BASE_URL . '/projects'],
    ['name' => 'Tasks']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>✓ Project Tasks</h1>
        <p>Manage tasks and milestones</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" id="addTaskBtn">
            <span class="icon">➕</span> Add Task
        </button>
    </div>
</div>

<div class="tasks-container">
    <div class="tasks-board" id="tasksBoard">
        <div class="task-column" data-status="todo">
            <h3>To Do</h3>
            <div class="task-list" id="todoList"></div>
        </div>
        <div class="task-column" data-status="in-progress">
            <h3>In Progress</h3>
            <div class="task-list" id="inProgressList"></div>
        </div>
        <div class="task-column" data-status="review">
            <h3>Review</h3>
            <div class="task-list" id="reviewList"></div>
        </div>
        <div class="task-column" data-status="completed">
            <h3>Completed</h3>
            <div class="task-list" id="completedList"></div>
        </div>
    </div>
</div>

<!-- Add Task Modal -->
<div class="modal fade" id="addTaskModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add Task</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="taskForm" class="modal-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Task Title</label>
                        <input type="text" name="title" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Assigned To</label>
                        <select name="assigned_to" class="form-control" required>
                            <option value="">Select team member</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Due Date</label>
                        <input type="date" name="due_date" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select name="priority" class="form-control">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Add Task</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        ModalManager?.show('addTaskModal');
    });
});

async function loadTasks() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/<?php echo $projectId; ?>/tasks`);
        const data = await response.json();

        if (data.success) {
            renderTasks(data.data);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function renderTasks(tasks) {
    const statuses = ['todo', 'in-progress', 'review', 'completed'];
    
    statuses.forEach(status => {
        const list = document.getElementById(status === 'in-progress' ? 'inProgressList' : status === 'todo' ? 'todoList' : status === 'review' ? 'reviewList' : 'completedList');
        const statusTasks = tasks.filter(t => t.status === status);

        list.innerHTML = '';
        statusTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.innerHTML = `
                <h4>${task.title}</h4>
                <p>${task.description}</p>
                <div class="task-meta">
                    <span class="priority ${task.priority}">${task.priority}</span>
                    <span class="due-date">${task.due_date}</span>
                </div>
            `;
            list.appendChild(card);
        });
    });
}
</script>
