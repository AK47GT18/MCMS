import client from '../../../src/api/client.js';
import contractsApi from '../../../src/api/contracts.api.js';

export const CA_Handlers = {
    async handleUploadDocument() {
        const title = document.getElementById('doc_title').value;
        const documentType = document.getElementById('doc_type').value;
        const projectId = document.getElementById('doc_project_id').value;
        const description = document.getElementById('doc_description').value;
        const fileInput = document.getElementById('doc_file');
        const errorEl = document.getElementById('upload-doc-error');

        const contractValue = document.getElementById('doc_contract_value').value;

        if (!title || !projectId || !fileInput.files[0]) {
            errorEl.innerText = 'Please fill required fields and select a file.';
            errorEl.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('documentType', documentType);
        formData.append('projectId', projectId);
        formData.append('description', description);
        formData.append('contractValue', contractValue);
        formData.append('file', fileInput.files[0]);

        try {
            const result = await client.post('/documents', formData);
            if (result.success !== false) {
                window.toast.show('Document uploaded and PM notified', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Upload failed';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during upload.';
            errorEl.style.display = 'block';
        }
    },

    async handleUploadVersion(docId) {
        const notes = document.getElementById('ver_notes').value;
        const fileInput = document.getElementById('ver_file');
        const errorEl = document.getElementById('upload-ver-error');

        const contractValue = document.getElementById('doc_contract_value')?.value;

        if (!fileInput.files[0]) {
            errorEl.innerText = 'Please select a file.';
            errorEl.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('changeNotes', notes);
        if (contractValue) formData.append('contractValue', contractValue);
        formData.append('file', fileInput.files[0]);

        try {
            const result = await client.post(`/documents/${docId}/versions`, formData);
            if (result.success !== false) {
                window.toast.show('Document version updated', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Update failed';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during upload.';
            errorEl.style.display = 'block';
        }
    },

    async handleApproveContract(contractId) {
        try {
            const result = await client.post(`/contracts/${contractId}/approve`, {});
            if (result.success !== false) {
                window.toast.show('Contract approved and activated', 'success');
                window.app.caModule.refresh();
            } else {
                window.toast.show(result.error?.message || 'Approval failed', 'error');
            }
        } catch (error) {
            window.toast.show('Server error during approval.', 'error');
        }
    },

    async openEditContractDrawer(contractId) {
        const contract = this.data.contracts.find(c => c.id === contractId);
        if (contract) {
            window.drawer.open(`Edit Contract: ${contract.refCode}`, window.DrawerTemplates.editContract(contract));
        } else {
            window.toast.show('Contract not found', 'error');
        }
    },

    async handleUpdateContract(contractId) {
        // ... (existing code)
        const value = document.getElementById('edit_contract_value').value;
        const vendorName = document.getElementById('edit_contract_vendor').value;
        const startDate = document.getElementById('edit_contract_start').value;
        const endDate = document.getElementById('edit_contract_end').value;
        const status = document.getElementById('edit_contract_status').value;
        const errorEl = document.getElementById('edit-contract-error');

        try {
            const result = await client.put(`/contracts/${contractId}`, {
                value: value ? parseFloat(value) : null,
                vendorName,
                startDate: startDate || null,
                endDate: endDate || null,
                status
            });

            if (result.success !== false) {
                window.toast.show('Contract updated successfully', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Update failed';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during update.';
            errorEl.style.display = 'block';
        }
    },

    openEditDocumentDrawer(doc) {
        window.drawer.open(`Edit Document: ${doc.title}`, window.DrawerTemplates.editDocument(doc));
    },

    async handleUpdateDocumentDetails(docId) {
        const title = document.getElementById('edit_doc_title').value;
        const description = document.getElementById('edit_doc_description').value;
        const contractValue = document.getElementById('edit_doc_contract_value').value;
        const errorEl = document.getElementById('edit-doc-error');

        try {
            const result = await client.put(`/documents/${docId}`, {
                title,
                description,
                contractValue: contractValue ? parseFloat(contractValue) : null
            });

            if (result.success !== false) {
                window.toast.show('Document details updated', 'success');
                window.drawer.close();
                window.app.caModule.refresh();
            } else {
                errorEl.innerText = result.error?.message || 'Update failed';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Server error during update.';
            errorEl.style.display = 'block';
        }
    },

    async openUploadDrawer() {
        try {
            const res = await projects.getAll();
            const projectList = res.data || [];
            window.drawer.open('Upload New Document', window.DrawerTemplates.uploadDocument(projectList));
        } catch (error) {
            window.toast.show('Failed to load projects', 'error');
        }
    },

    openVersionDrawer(doc) {
        window.drawer.open(`Upload New Version: ${doc.title}`, window.DrawerTemplates.uploadDocumentVersion(doc));
    },

    openVersionHistoryDrawer(doc) {
        window.drawer.open(`Version History`, window.DrawerTemplates.documentVersionHistory(doc));
    }
};
