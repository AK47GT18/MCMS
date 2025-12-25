<?php
/**
 * Projects - View Full Page
 * Complete project details and information
 */

$projectId = $_GET['id'] ?? null;
$pageTitle = 'Project Details';
$currentPage = 'projects';
$breadcrumbs = [
    ['name' => 'Projects', 'url' => BASE_URL . '/projects'],
    ['name' => 'Details']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1 id="projectTitle">Project Name</h1>
        <p id="projectStatus">Loading...</p>
    </div>
    <div class="header-actions">
        <a href="<?php echo BASE_URL; ?>/projects/<?php echo $projectId; ?>/edit" class="btn btn-secondary">
            <span class="icon">✏️</span> Edit
        </a>
        <button class="btn btn-danger" id="deleteBtn">
            <span class="icon">🗑️</span> Delete
        </button>
    </div>
</div>

<div class="project-detail-container">
    <!-- Project Overview -->
    <div class="detail-section">
        <h2>Overview</h2>
        <div class="detail-grid">
            <div class="detail-item">
                <label>Project Code</label>
                <p id="projectCode">--</p>
            </div>
            <div class="detail-item">
                <label>Location</label>
                <p id="projectLocation">--</p>
            </div>
            <div class="detail-item">
                <label>Budget</label>
                <p id="projectBudget">MWK 0</p>
            </div>
            <div class="detail-item">
                <label>Spent</label>
                <p id="projectSpent">MWK 0</p>
            </div>
        </div>
    </div>

    <!-- Project Stats -->
    <div class="detail-section">
        <h2>Progress</h2>
        <div class="progress-container">
            <div class="progress-item">
                <label>Overall Progress</label>
                <div class="progress-bar-large">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
                <p id="progressPercent">0%</p>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="detail-section">
        <div class="tabs">
            <button class="tab-button active" data-tab="information">Information</button>
            <button class="tab-button" data-tab="tasks">Tasks</button>
            <button class="tab-button" data-tab="equipment">Equipment</button>
            <button class="tab-button" data-tab="budget">Budget</button>
            <button class="tab-button" data-tab="documents">Documents</button>
        </div>

        <div class="tab-content" id="information">
            <div class="info-block">
                <h3>Description</h3>
                <p id="projectDescription">No description provided</p>
            </div>
            <div class="info-block">
                <h3>Timeline</h3>
                <p>Start Date: <strong id="startDate">--</strong></p>
                <p>End Date: <strong id="endDate">--</strong></p>
            </div>
        </div>

        <div class="tab-content" id="tasks" style="display: none;">
            <a href="<?php echo BASE_URL; ?>/projects/<?php echo $projectId; ?>/tasks" class="btn btn-primary">View All Tasks</a>
        </div>

        <div class="tab-content" id="equipment" style="display: none;">
            <p>Equipment assigned to this project will be shown here</p>
        </div>

        <div class="tab-content" id="budget" style="display: none;">
            <p>Budget details will be shown here</p>
        </div>

        <div class="tab-content" id="documents" style="display: none;">
            <div class="data-card">
                <div class="data-card-header">
                    <h3 class="card-title">Project Documents</h3>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="uploadDocument()">
                            <i class="fas fa-upload"></i> Upload
                        </button>
                    </div>
                </div>
                <table id="documentsTable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Uploaded By</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="documentsBody">
                        <tr><td colspan="5" class="loading"><i class="fas fa-spinner"></i> Loading documents...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <!-- OnlyOffice Editor Container (Hidden initially) -->
            <div id="onlyoffice-container" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; background:white;">
                <div style="height: 40px; background: var(--slate-900); display: flex; align-items: center; padding: 0 20px;">
                    <button class="btn btn-sm btn-secondary" onclick="closeEditor()" style="margin-left: auto;">Close Editor</button>
                </div>
                <div id="placeholder" style="height: calc(100% - 40px);"></div>
            </div>
        </div>
    </div>
</div>

<script>
// Documents Logic
async function loadDocuments(projectId) {
    const tbody = document.getElementById('documentsBody');
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}/documents`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            tbody.innerHTML = '';
            result.data.forEach(doc => {
                const icon = getFileIcon(doc.file_type);
                const row = `
                    <tr>
                        <td data-label="Name">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <i class="${icon}" style="font-size:20px; color:var(--slate-500);"></i>
                                <span>${doc.file_name}</span>
                            </div>
                        </td>
                        <td data-label="Type">${doc.document_type}</td>
                        <td data-label="Uploaded By">${doc.uploaded_by_name}</td>
                        <td data-label="Date">${new Date(doc.created_at).toLocaleDateString()}</td>
                        <td data-label="Actions">
                            <div class="btn-group">
                                <button class="btn btn-sm btn-primary" onclick="openOnlyOffice(${doc.id})"><i class="fas fa-edit"></i> Edit</button>
                                <button class="btn btn-sm btn-secondary" onclick="window.open('${doc.download_url}')"><i class="fas fa-download"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No documents found.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading documents.</td></tr>';
    }
}

function getFileIcon(type) {
    if(['doc','docx'].includes(type)) return 'fas fa-file-word text-blue';
    if(['xls','xlsx'].includes(type)) return 'fas fa-file-excel text-green';
    if(['ppt','pptx'].includes(type)) return 'fas fa-file-powerpoint text-orange';
    if(['pdf'].includes(type)) return 'fas fa-file-pdf text-red';
    return 'fas fa-file';
}

async function openOnlyOffice(docId) {
    const container = document.getElementById('onlyoffice-container');
    container.style.display = 'block';
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/documents/config/${docId}`);
        const data = await response.json();
        
        if (data.success) {
            new DocsAPI.DocEditor("placeholder", data.config);
        } else {
            alert('Error loading document config: ' + data.message);
            closeEditor();
        }
    } catch (e) {
        console.error(e);
        alert('Failed to connect to document server');
        closeEditor();
    }
}

function closeEditor() {
    document.getElementById('onlyoffice-container').style.display = 'none';
    document.getElementById('placeholder').innerHTML = '';
}

// Hook into existing tab navigation
document.querySelector('button[data-tab="documents"]').addEventListener('click', () => {
    loadDocuments(<?php echo $projectId; ?>);
});
</script>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadProjectDetails(<?php echo $projectId; ?>);
    setupTabNavigation();
});

async function loadProjectDetails(projectId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/${projectId}`);
        const data = await response.json();

        if (data.success) {
            const project = data.data;
            displayProjectDetails(project);
        }
    } catch (error) {
        console.error('Error loading project:', error);
        AlertsComponent?.error('Failed to load project details');
    }
}

function displayProjectDetails(project) {
    document.getElementById('projectTitle').textContent = project.name;
    document.getElementById('projectCode').textContent = project.code;
    document.getElementById('projectLocation').textContent = project.location;
    document.getElementById('projectBudget').textContent = 'MWK ' + project.budget.toLocaleString();
    document.getElementById('projectSpent').textContent = 'MWK ' + (project.spent || 0).toLocaleString();
    document.getElementById('projectDescription').textContent = project.description || 'No description provided';
    document.getElementById('startDate').textContent = new Date(project.start_date).toLocaleDateString();
    document.getElementById('endDate').textContent = new Date(project.end_date).toLocaleDateString();
    
    const progress = project.progress || 0;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressPercent').textContent = progress + '%';
}

function setupTabNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Show selected tab
            document.getElementById(tabName).style.display = 'block';
            
            // Update button states
            document.querySelectorAll('.tab-button').forEach(b => {
                b.classList.remove('active');
            });
            button.classList.add('active');
        });
    });
}

document.getElementById('deleteBtn')?.addEventListener('click', () => {
    ModalManager?.showConfirm(
        'Delete Project',
        'Are you sure you want to delete this project?',
        async () => {
            try {
                const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/projects/<?php echo $projectId; ?>`, {
                    method: 'DELETE',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    AlertsComponent?.success('Project deleted');
                    setTimeout(() => location.href = '<?php echo BASE_URL; ?>/projects', 1500);
                }
            } catch (error) {
                AlertsComponent?.error('Failed to delete project');
            }
        }
    );
});
</script>
