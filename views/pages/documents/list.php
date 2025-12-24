<?php
/**
 * Documents Management Page
 * Manage project documents
 */

$pageTitle = 'Documents';
$currentPage = 'documents';
$breadcrumbs = [
    ['name' => 'Documents']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📁 Documents</h1>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" id="uploadBtn">
            <span class="icon">⬆️</span> Upload Document
        </button>
    </div>
</div>

<div class="filters-bar">
    <input type="text" class="form-control search-input" id="searchDocs" placeholder="Search documents...">
    <select class="form-control" id="typeFilter">
        <option value="">All Types</option>
        <option value="specification">Specification</option>
        <option value="drawing">Drawing</option>
        <option value="report">Report</option>
        <option value="contract">Contract</option>
        <option value="other">Other</option>
    </select>
</div>

<div class="documents-grid" id="documentsGrid">
    <div class="loading-skeleton"></div>
</div>

<!-- Upload Modal -->
<div class="modal fade" id="uploadModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Upload Document</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <form id="uploadForm" class="modal-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Document Type</label>
                        <select name="type" class="form-control" required>
                            <option value="">Select type</option>
                            <option value="specification">Specification</option>
                            <option value="drawing">Drawing</option>
                            <option value="report">Report</option>
                            <option value="contract">Contract</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Project</label>
                        <select name="project_id" class="form-control" required>
                            <option value="">Select project</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>File</label>
                        <input type="file" name="file" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-control" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary modal-submit">Upload</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
});

async function loadDocuments() {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/documents`);
        const data = await response.json();

        if (data.success) {
            renderDocuments(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderDocuments(documents) {
    const grid = document.getElementById('documentsGrid');
    grid.innerHTML = '';

    if (!documents.length) {
        grid.innerHTML = '<p class="text-center">No documents found</p>';
        return;
    }

    documents.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.innerHTML = `
            <div class="document-icon">📄</div>
            <h4>${doc.name}</h4>
            <p class="document-meta">${doc.type}</p>
            <p class="document-date">${new Date(doc.uploadedAt).toLocaleDateString()}</p>
            <div class="document-actions">
                <a href="${doc.url}" class="btn btn-sm btn-info">Download</a>
                <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id})">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('uploadBtn')?.addEventListener('click', () => {
    ModalManager?.show('uploadModal');
});

document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/documents`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Document uploaded successfully');
            ModalManager?.hide('uploadModal');
            loadDocuments();
        } else {
            AlertsComponent?.error(data.message || 'Failed to upload document');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});

function deleteDocument(id) {
    ModalManager?.showConfirm('Delete Document', 'Are you sure?', async () => {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/documents/${id}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            if (data.success) {
                AlertsComponent?.success('Document deleted');
                loadDocuments();
            }
        } catch (error) {
            AlertsComponent?.error('Failed to delete document');
        }
    });
}
</script>
