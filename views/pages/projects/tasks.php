<?php
/**
 * Projects - Tasks Page
 */
$projectId = $_GET['id'] ?? null;
if (!$projectId) {
    header('Location: ' . BASE_URL . '/projects');
    exit;
}

$pageTitle = 'Project Tasks';
$currentPage = 'projects';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="breadcrumb">
        <span>Project Management</span>
        <i class="fas fa-chevron-right"></i>
        <span><a href="<?php echo BASE_URL; ?>/projects/<?php echo $projectId; ?>">Project Details</a></span>
        <i class="fas fa-chevron-right"></i>
        <span>Tasks</span>
    </div>
    <div class="header-title">
        <h1>✓ Project Tasks</h1>
    </div>
    <div class="header-actions">
        <div class="view-toggle">
            <button class="btn btn-outline active" onclick="setView('kanban')" id="btnKanban"><i class="fas fa-columns"></i> Board</button>
            <button class="btn btn-outline" onclick="setView('list')" id="btnList"><i class="fas fa-list"></i> List</button>
        </div>
        <button class="btn btn-primary" onclick="showAddTaskModal()">
            <i class="fas fa-plus"></i> Add Task
        </button>
    </div>
</div>

<div class="content">
    <!-- Kanban View -->
    <div id="kanbanView" class="kanban-board">
        <div class="kanban-column" id="col-todo" ondrop="drop(event, 'todo')" ondragover="allowDrop(event)">
            <div class="column-header status-todo">To Do <span class="count">0</span></div>
            <div class="task-list" id="list-todo"></div>
        </div>
        <div class="kanban-column" id="col-in-progress" ondrop="drop(event, 'in-progress')" ondragover="allowDrop(event)">
            <div class="column-header status-in-progress">In Progress <span class="count">0</span></div>
            <div class="task-list" id="list-in-progress"></div>
        </div>
        <div class="kanban-column" id="col-review" ondrop="drop(event, 'review')" ondragover="allowDrop(event)">
            <div class="column-header status-review">Review <span class="count">0</span></div>
            <div class="task-list" id="list-review"></div>
        </div>
        <div class="kanban-column" id="col-completed" ondrop="drop(event, 'completed')" ondragover="allowDrop(event)">
            <div class="column-header status-completed">Completed <span class="count">0</span></div>
            <div class="task-list" id="list-completed"></div>
        </div>
    </div>

    <!-- List View -->
    <div id="listView" class="data-card" style="display:none;">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="tasksTableBody"></tbody>
        </table>
    </div>
</div>

<!-- Add Task Modal -->
<div id="addTaskModal" class="modal-overlay" style="display:none;">
    <div class="modal-container">
        <div class="modal-header">
            <h3>Add New Task</h3>
            <button class="modal-close" onclick="closeModal('addTaskModal')">&times;</button>
        </div>
        <form id="addTaskForm" onsubmit="return false">
            <div class="modal-body">
                <div class="form-group">
                    <label>Task Title <span class="text-red">*</span></label>
                    <input type="text" name="task_name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" class="form-textarea" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Assigned To</label>
                        <select name="assigned_to" class="form-select">
                             <!-- Populate via JS -->
                             <option value="1">John Doe</option>
                        </select>
                    </div>
                    <div class="form-group col-md-6">
                        <label>Priority</label>
                        <select name="priority" class="form-select">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Start Date</label>
                        <input type="date" name="start_date" class="form-input" required>
                    </div>
                    <div class="form-group col-md-6">
                        <label>Due Date</label>
                        <input type="date" name="end_date" class="form-input" required>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('addTaskModal')">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="submitTask()">Add Task</button>
            </div>
        </form>
    </div>
</div>

<style>
/* Kanban Styles */
.kanban-board {
    display: flex;
    gap: 1.5rem;
    overflow-x: auto;
    padding-bottom: 1rem;
    height: calc(100vh - 200px);
}

.kanban-column {
    flex: 1;
    min-width: 280px;
    background: var(--slate-50);
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
}

.column-header {
    padding: 1rem;
    font-weight: 600;
    border-bottom: 2px solid transparent;
    display: flex;
    justify-content: space-between;
}

.status-todo { border-color: var(--slate-400); }
.status-in-progress { border-color: var(--blue-500); }
.status-review { border-color: var(--orange); }
.status-completed { border-color: var(--green-500); }

.kanban-column .task-list {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
}

.task-card {
    background: white;
    padding: 1rem;
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    margin-bottom: 1rem;
    cursor: grab;
    transition: transform 0.2s, box-shadow 0.2s;
    border-left: 3px solid transparent;
}

.task-card:hover {
    box-shadow: var(--shadow);
    transform: translateY(-2px);
}

.task-card.priority-high { border-left-color: var(--red-500); }
.task-card.priority-medium { border-left-color: var(--orange); }
.task-card.priority-low { border-left-color: var(--green-500); }

.task-title { font-weight: 600; margin-bottom: 0.5rem; display: block; }
.task-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--slate-500); margin-top: 0.5rem; }

</style>

<script>
const projectId = <?php echo $projectId; ?>;
let allTasks = [];

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});

function setView(view) {
    document.getElementById('kanbanView').style.display = view === 'kanban' ? 'flex' : 'none';
    document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
    
    document.getElementById('btnKanban').classList.toggle('active', view === 'kanban');
    document.getElementById('btnList').classList.toggle('active', view === 'list');
}

async function loadTasks() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}/tasks`);
        const data = await response.json();
        if (data.success) {
            allTasks = data.data; // Assuming data structure matches
            // If data is just [tasks], use data.data.tasks or adapt based on API
            // For now assuming direct array in data.data or similar
            // Let's assume the API returns { success: true, tasks: [...] } based on previous usage
            const tasks = data.tasks || data.data || []; 
            renderKanban(tasks);
            renderList(tasks);
        }
    } catch (e) {
        console.error(e);
        AlertsComponent?.error('Failed to load tasks');
    }
}

function renderKanban(tasks) {
    // Clear lists
    ['todo', 'in-progress', 'review', 'completed'].forEach(s => {
        document.getElementById(`list-${s}`).innerHTML = '';
        document.querySelector(`#col-${s} .count`).textContent = '0';
    });

    tasks.forEach(task => {
        // Normalize status
        let status = task.status || 'todo';
        status = status.toLowerCase().replace('_', '-');
        if (!['todo', 'in-progress', 'review', 'completed'].includes(status)) status = 'todo';

        const card = document.createElement('div');
        card.className = `task-card priority-${task.priority || 'medium'}`;
        card.draggable = true;
        card.id = `task-${task.id}`;
        card.setAttribute('ondragstart', 'drag(event)');
        card.setAttribute('data-id', task.id);
        
        card.innerHTML = `
            <span class="task-title">${task.task_name || task.title}</span>
            <div class="task-desc">${(task.description || '').substring(0, 50)}...</div>
            <div class="task-meta">
                <span><i class="fas fa-user"></i> ${task.assigned_to_name || 'Unassigned'}</span>
                <span>${task.end_date || ''}</span>
            </div>
        `;
        
        const list = document.getElementById(`list-${status}`);
        if (list) list.appendChild(card);
    });

    // Update counts
    ['todo', 'in-progress', 'review', 'completed'].forEach(s => {
        const count = document.getElementById(`list-${s}`).children.length;
        document.querySelector(`#col-${s} .count`).textContent = count;
    });
}

function renderList(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';
    
    tasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${task.task_name || task.title}</td>
            <td>${task.assigned_to_name || 'Unassigned'}</td>
            <td>${task.end_date}</td>
            <td><span class="badge badge-${task.priority || 'medium'}">${task.priority || 'medium'}</span></td>
            <td><span class="status-badge status-${task.status}">${task.status}</span></td>
            <td>
                <button class="btn-icon"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Drag & Drop Logic
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

async function drop(ev, newStatus) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const card = document.getElementById(data);
    const taskId = card.getAttribute('data-id');
    
    // Optimistic UI update
    const targetList = document.getElementById(`list-${newStatus}`);
    targetList.appendChild(card);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}/tasks/${taskId}/status`, {
            method: 'POST', // or PUT/PATCH
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const res = await response.json();
        if (!res.success) throw new Error(res.message);
        
        AlertsComponent?.success('Task moved to ' + newStatus);
    } catch (e) {
        console.error(e);
        AlertsComponent?.error('Failed to update status');
        // Revert (reload tasks or moving back)
        loadTasks(); 
    }
}

// Modal Helpers
function showAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

async function submitTask() {
    const form = document.getElementById('addTaskForm');
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}/tasks`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Task added');
            closeModal('addTaskModal');
            loadTasks();
            form.reset();
        } else {
            AlertsComponent?.error(data.message);
        }
    } catch (e) {
        console.error(e);
        AlertsComponent?.error('Server Error');
    }
}
</script>
