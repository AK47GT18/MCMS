<?php
/**
 * Projects - Edit Page
 */
$projectId = $_GET['id'] ?? null;
if (!$projectId) {
    header('Location: ' . BASE_URL . '/projects');
    exit;
}

$pageTitle = 'Edit Project';
$currentPage = 'projects';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="breadcrumb">
        <span>Project Management</span>
        <i class="fas fa-chevron-right"></i>
        <span><a href="<?php echo BASE_URL; ?>/projects/<?php echo $projectId; ?>">Project Details</a></span>
        <i class="fas fa-chevron-right"></i>
        <span>Edit Project</span>
    </div>
    <div class="header-title">
        <h1>✏️ Edit Project</h1>
    </div>
</div>

<div class="content">
    <div class="edit-container">
        <div class="tabs-vertical">
            <button class="tab-item active" onclick="switchTab('details')"><i class="fas fa-info-circle"></i> Details</button>
            <button class="tab-item" onclick="switchTab('timeline')"><i class="fas fa-calendar-alt"></i> Timeline</button>
            <button class="tab-item" onclick="switchTab('financials')"><i class="fas fa-coins"></i> Financials</button>
            <button class="tab-item" onclick="switchTab('team')"><i class="fas fa-users"></i> Team</button>
        </div>

        <div class="edit-form-area">
            <div id="loadingOverlay" style="display:flex; justify-content:center; align-items:center; height:300px;">
                <div class="loading-spinner"></div>
            </div>

            <form id="editProjectForm" style="display:none;" onsubmit="return false;">
                <!-- Details Tab -->
                <div class="tab-pane active" id="details">
                    <h3 class="form-section-title">Project Details</h3>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Project Name <span class="text-red">*</span></label>
                            <input type="text" name="name" class="form-input" required>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Project Code <span class="text-red">*</span></label>
                            <input type="text" name="code" class="form-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-textarea" rows="4"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Location <span class="text-red">*</span></label>
                            <input type="text" name="location" class="form-input" required>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Type</label>
                            <select name="type" class="form-select">
                                <option value="construction">Construction</option>
                                <option value="renovation">Renovation</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Timeline Tab -->
                <div class="tab-pane" id="timeline">
                    <h3 class="form-section-title">Timeline & Schedule</h3>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Start Date <span class="text-red">*</span></label>
                            <input type="date" name="start_date" class="form-input" required>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Expected End Date <span class="text-red">*</span></label>
                            <input type="date" name="end_date" class="form-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" class="form-select">
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <!-- Financials Tab -->
                <div class="tab-pane" id="financials">
                    <h3 class="form-section-title">Financials</h3>
                    <div class="form-group">
                        <label>Total Budget (MWK) <span class="text-red">*</span></label>
                        <div class="input-group">
                            <span class="input-prefix">MWK</span>
                            <input type="number" name="budget" class="form-input" required min="0" step="0.01">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Client Name</label>
                            <input type="text" name="client" class="form-input">
                        </div>
                        <div class="form-group col-md-6">
                            <label>Contract Value</label>
                            <input type="number" name="contract_value" class="form-input">
                        </div>
                    </div>
                </div>

                <!-- Team Tab -->
                <div class="tab-pane" id="team">
                    <h3 class="form-section-title">Team Assignment</h3>
                    <div class="form-group">
                        <label>Project Manager <span class="text-red">*</span></label>
                        <select name="manager_id" class="form-select" required id="managerSelect">
                            <option value="">Select Manager</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Site Supervisor</label>
                        <input type="text" name="supervisor" class="form-input">
                    </div>
                </div>

                <div class="form-actions-fixed">
                    <button type="button" class="btn btn-secondary" onclick="history.back()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="saveProject()">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
.edit-container {
    display: flex;
    gap: 2rem;
    background: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    min-height: 500px;
    overflow: hidden;
}

.tabs-vertical {
    width: 200px;
    background: var(--slate-50);
    border-right: 1px solid var(--slate-200);
    padding-top: 1rem;
}

.tab-item {
    display: block;
    width: 100%;
    padding: 1rem 1.5rem;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    border-left: 3px solid transparent;
    color: var(--slate-600);
    font-weight: 500;
    transition: all 0.2s;
}

.tab-item:hover {
    background: var(--slate-100);
    color: var(--orange);
}

.tab-item.active {
    background: white;
    border-left-color: var(--orange);
    color: var(--orange);
    font-weight: 700;
}

.tab-item i {
    width: 20px;
    margin-right: 10px;
}

.edit-form-area {
    flex: 1;
    padding: 2rem;
    position: relative;
    padding-bottom: 80px; /* Space for fixed actions */
}

.tab-pane {
    display: none;
    animation: fadeIn 0.3s ease;
}

.tab-pane.active {
    display: block;
}

.form-actions-fixed {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 1rem 2rem;
    background: white;
    border-top: 1px solid var(--slate-100);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}
</style>

<script>
const projectId = <?php echo $projectId; ?>;

document.addEventListener('DOMContentLoaded', () => {
    loadProjectData();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
    
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

async function loadProjectData() {
    try {
        // Load managers for dropdown
        // In real app, separate API call. Here assuming we fetch common data or use static for dev
        const managerRes = await fetch('<?php echo BASE_URL; ?>/api/v1/users?role=project_manager'); 
        // Note: You need to implement /api/v1/users endpoint or mock it.
        // Mocking for now:
        const managers = [
            {id: 1, name: 'John Doe'}, 
            {id: 2, name: 'Jane Smith'}
        ];
        
        const select = document.getElementById('managerSelect');
        managers.forEach(m => {
            select.innerHTML += `<option value="${m.id}">${m.name}</option>`;
        });

        // Load Project
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}`);
        const result = await response.json();
        
        if (result.success) {
            populateForm(result.data);
            document.getElementById('loadingOverlay').style.display = 'none';
            document.getElementById('editProjectForm').style.display = 'block';
        } else {
            AlertsComponent?.error('Failed to load project data');
        }
    } catch (e) {
        console.error(e);
        AlertsComponent?.error('Server Error');
    }
}

function populateForm(data) {
    const form = document.getElementById('editProjectForm');
    for (const [key, value] of Object.entries(data)) {
        const input = form.elements[key];
        if (input) {
            input.value = value;
        }
    }
}

async function saveProject() {
    const form = document.getElementById('editProjectForm');
    const formData = new FormData(form);
    
    // Add PUT method spoofing if needed by backend, though native fetch supports PUT
    // Using POST with _method or direct PUT
    const dataObj = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}`, {
            method: 'PUT', // or POST if using method spoofing
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(dataObj)
        });
        
        const result = await response.json();
        
        if (result.success) {
            AlertsComponent?.success('Project details updated!');
        } else {
            AlertsComponent?.error(result.message || 'Update failed');
        }
    } catch (e) {
        console.error(e);
        AlertsComponent?.error('Server Error');
    }
}
</script>
