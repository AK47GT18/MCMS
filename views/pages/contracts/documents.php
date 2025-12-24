<?php
/**
 * Contracts Documents Page
 * Manage contract documents
 */

$contractId = $_GET['id'] ?? null;
$pageTitle = 'Contract Documents';
$currentPage = 'contracts';
$breadcrumbs = [
    ['name' => 'Contracts', 'url' => BASE_URL . '/contracts'],
    ['name' => 'Documents']
];
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📄 Contract Documents</h1>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary" id="uploadBtn">
            <span class="icon">⬆️</span> Upload Document
        </button>
    </div>
</div>

<div class="documents-list" id="documentsList">
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
                            <option value="agreement">Agreement</option>
                            <option value="terms">Terms & Conditions</option>
                            <option value="invoice">Invoice</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>File</label>
                        <input type="file" name="file" class="form-control" required>
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
    loadDocuments(<?php echo $contractId; ?>);
});

async function loadDocuments(contractId) {
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/${contractId}/documents`);
        const data = await response.json();

        if (data.success) {
            renderDocuments(data.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderDocuments(documents) {
    const container = document.getElementById('documentsList');
    container.innerHTML = '';

    if (!documents.length) {
        container.innerHTML = '<p class="text-center">No documents uploaded yet</p>';
        return;
    }

    documents.forEach(doc => {
        const div = document.createElement('div');
        div.className = 'document-item';
        div.innerHTML = `
            <div class="document-info">
                <h4>${doc.name}</h4>
                <p>${doc.type} • ${new Date(doc.uploadedAt).toLocaleDateString()}</p>
            </div>
            <div class="document-actions">
                <a href="${doc.url}" class="btn btn-sm btn-info">Download</a>
                <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id})">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

document.getElementById('uploadBtn')?.addEventListener('click', () => {
    ModalManager?.show('uploadModal');
});

document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/<?php echo $contractId; ?>/documents`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            AlertsComponent?.success('Document uploaded successfully');
            ModalManager?.hide('uploadModal');
            loadDocuments(<?php echo $contractId; ?>);
        } else {
            AlertsComponent?.error(data.message || 'Failed to upload document');
        }
    } catch (error) {
        console.error('Error:', error);
        AlertsComponent?.error('An error occurred');
    }
});

function deleteDocument(docId) {
    ModalManager?.showConfirm(
        'Delete Document',
        'Are you sure you want to delete this document?',
        async () => {
            try {
                const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/<?php echo $contractId; ?>/documents/${docId}`, {
                    method: 'DELETE',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();
                if (data.success) {
                    AlertsComponent?.success('Document deleted');
                    loadDocuments(<?php echo $contractId; ?>);
                }
            } catch (error) {
                AlertsComponent?.error('Failed to delete document');
            }
        }
    );
}
</script>
