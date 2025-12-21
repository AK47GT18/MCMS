<?php
/**
 * Contract Controller
 * 
 * @file ContractController.php
 * @description Contract lifecycle management (FR-09, FR-10)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class ContractController extends Controller {
    
    /**
     * List all contracts
     */
    public function index() {
        $this->requireAuth();
        $this->authorize('contracts.view');
        
        try {
            $page = $this->request->input('page', 1);
            $status = $this->request->input('status');
            
            $contract = new Contract();
            
            $conditions = [];
            if ($status) {
                $conditions['status'] = $status;
            }
            
            $contracts = $contract->all($conditions, 'created_at DESC');
            
            return $this->view('contracts/index', [
                'contracts' => $contracts,
                'status_filter' => $status
            ]);
            
        } catch (Exception $e) {
            error_log("Contracts list error: " . $e->getMessage());
            $this->flash('error', 'Error loading contracts');
            return $this->redirect('/dashboard');
        }
    }
    
    /**
     * Show create contract form
     */
    public function create() {
        $this->requireAuth();
        $this->authorize('contracts.create');
        
        $project = new Project();
        $projects = $project->getActiveProjects();
        
        return $this->view('contracts/create', [
            'projects' => $projects
        ]);
    }
    
    /**
     * Store new contract (FR-09)
     */
    public function store() {
        $this->requireAuth();
        $this->authorize('contracts.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'contract_title' => 'required',
                'vendor_name' => 'required',
                'contract_value' => 'required|numeric',
                'start_date' => 'required',
                'end_date' => 'required'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields correctly');
                return $this->redirect('/contracts/create');
            }
            
            $contract = new Contract();
            $contractId = $contract->createContract($this->request->all());
            
            $this->flash('success', 'Contract created successfully');
            return $this->redirect('/contracts/' . $contractId);
            
        } catch (Exception $e) {
            error_log("Create contract error: " . $e->getMessage());
            $this->flash('error', 'Error creating contract: ' . $e->getMessage());
            return $this->redirect('/contracts/create');
        }
    }
    
    /**
     * Show contract details
     */
    public function show($id) {
        $this->requireAuth();
        $this->authorize('contracts.view');
        
        try {
            $contract = new Contract();
            $contractSummary = $contract->getContractSummary($id);
            
            if (!$contractSummary) {
                $this->flash('error', 'Contract not found');
                return $this->redirect('/contracts');
            }
            
            return $this->view('contracts/show', [
                'contract' => $contractSummary
            ]);
            
        } catch (Exception $e) {
            error_log("Show contract error: " . $e->getMessage());
            $this->flash('error', 'Error loading contract');
            return $this->redirect('/contracts');
        }
    }
    
    /**
     * Show edit contract form
     */
    public function edit($id) {
        $this->requireAuth();
        $this->authorize('contracts.edit');
        
        try {
            $contract = new Contract();
            $contractData = $contract->find($id);
            
            if (!$contractData) {
                $this->flash('error', 'Contract not found');
                return $this->redirect('/contracts');
            }
            
            $project = new Project();
            $projects = $project->getActiveProjects();
            
            return $this->view('contracts/edit', [
                'contract' => $contractData,
                'projects' => $projects
            ]);
            
        } catch (Exception $e) {
            error_log("Edit contract error: " . $e->getMessage());
            $this->flash('error', 'Error loading contract');
            return $this->redirect('/contracts');
        }
    }
    
    /**
     * Update contract
     */
    public function update($id) {
        $this->requireAuth();
        $this->authorize('contracts.edit');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'contract_title' => 'required',
                'vendor_name' => 'required',
                'contract_value' => 'required|numeric'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields correctly');
                return $this->redirect('/contracts/' . $id . '/edit');
            }
            
            $contract = new Contract();
            $contract->update($id, $this->request->all());
            
            $this->flash('success', 'Contract updated successfully');
            return $this->redirect('/contracts/' . $id);
            
        } catch (Exception $e) {
            error_log("Update contract error: " . $e->getMessage());
            $this->flash('error', 'Error updating contract');
            return $this->redirect('/contracts/' . $id . '/edit');
        }
    }
    
    /**
     * Upload contract document (FR-09)
     */
    public function uploadDocument($id) {
        $this->requireAuth();
        $this->authorize('contracts.edit');
        
        try {
            if (!isset($_FILES['document']) || $_FILES['document']['error'] !== UPLOAD_ERR_OK) {
                return $this->json([
                    'success' => false,
                    'message' => 'No file uploaded or upload error'
                ], 400);
            }
            
            $file = $_FILES['document'];
            $documentType = $this->request->input('document_type', 'contract');
            
            $contract = new Contract();
            $documentId = $contract->uploadDocument($id, $file['tmp_name'], $documentType);
            
            return $this->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'document_id' => $documentId
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error uploading document: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get document versions (FR-09)
     */
    public function getDocumentVersions($id) {
        $this->requireAuth();
        $this->authorize('contracts.view');
        
        try {
            $documentType = $this->request->input('document_type');
            
            $contract = new Contract();
            $versions = $contract->getDocumentVersions($id, $documentType);
            
            return $this->json([
                'success' => true,
                'data' => $versions
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error loading document versions'
            ], 500);
        }
    }
    
    /**
     * Add milestone (FR-10)
     */
    public function addMilestone($id) {
        $this->requireAuth();
        $this->authorize('milestones.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'name' => 'required',
                'due_date' => 'required'
            ]);
            
            if ($validator->fails()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Please fill all required fields'
                ], 400);
            }
            
            $contract = new Contract();
            $contract->addMilestone($id, $this->request->all());
            
            return $this->json([
                'success' => true,
                'message' => 'Milestone added successfully'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error adding milestone: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update milestone status
     */
    public function updateMilestoneStatus($contractId, $milestoneId) {
        $this->requireAuth();
        $this->authorize('milestones.edit');
        
        try {
            $status = $this->request->input('status');
            $completion = $this->request->input('completion_percentage');
            
            $contract = new Contract();
            $contract->updateMilestoneStatus($milestoneId, $status, $completion);
            
            return $this->json([
                'success' => true,
                'message' => 'Milestone updated successfully'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error updating milestone: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Show upcoming deadlines (FR-10)
     */
    public function upcomingDeadlines() {
        $this->requireAuth();
        $this->authorize('contracts.view');
        
        try {
            $days = $this->request->input('days', 30);
            
            $contract = new Contract();
            $upcomingContracts = $contract->getUpcomingDeadlines($days);
            
            return $this->view('contracts/deadlines', [
                'contracts' => $upcomingContracts,
                'days' => $days
            ]);
            
        } catch (Exception $e) {
            error_log("Upcoming deadlines error: " . $e->getMessage());
            $this->flash('error', 'Error loading deadlines');
            return $this->redirect('/contracts');
        }
    }
    
    /**
     * Update contract status
     */
    public function updateStatus($id) {
        $this->requireAuth();
        $this->authorize('contracts.edit');
        
        try {
            $status = $this->request->input('status');
            $user = Authentication::user();
            
            $contract = new Contract();
            $contract->updateStatus($id, $status, $user['id']);
            
            return $this->json([
                'success' => true,
                'message' => 'Contract status updated'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error updating status: ' . $e->getMessage()
            ], 500);
        }
    }
}