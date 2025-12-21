<?php
/**
 * Finance Controller
 * 
 * @file FinanceController.php
 * @description Financial transaction management (FR-05, FR-06, FR-07, FR-08, FR-20)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class FinanceController extends Controller {
    
    /**
     * List all transactions
     */
    public function index() {
        $this->requireAuth();
        $this->authorize('finance.view');
        
        try {
            $page = $this->request->input('page', 1);
            $filters = [
                'project_id' => $this->request->input('project_id'),
                'start_date' => $this->request->input('start_date'),
                'end_date' => $this->request->input('end_date'),
                'status' => $this->request->input('status')
            ];
            
            $transaction = new Transaction();
            $transactions = $transaction->getFinancialReport($filters);
            
            return $this->view('finance/index', [
                'transactions' => $transactions,
                'filters' => $filters
            ]);
            
        } catch (Exception $e) {
            error_log("Transactions list error: " . $e->getMessage());
            $this->flash('error', 'Error loading transactions');
            return $this->redirect('/dashboard');
        }
    }
    
    /**
     * Show create transaction form
     */
    public function create() {
        $this->requireAuth();
        $this->authorize('finance.create');
        
        $project = new Project();
        $projects = $project->getActiveProjects();
        
        return $this->view('finance/create', [
            'projects' => $projects
        ]);
    }
    
    /**
     * Store new transaction (FR-05)
     */
    public function store() {
        $this->requireAuth();
        $this->authorize('finance.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'project_id' => 'required',
                'transaction_type' => 'required',
                'amount' => 'required|numeric',
                'vendor_name' => 'required',
                'description' => 'required'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields correctly');
                return $this->redirect('/finance/create');
            }
            
            $transaction = new Transaction();
            $transactionId = $transaction->createTransaction($this->request->all());
            
            $this->flash('success', 'Transaction created successfully');
            return $this->redirect('/finance/' . $transactionId);
            
        } catch (Exception $e) {
            error_log("Create transaction error: " . $e->getMessage());
            $this->flash('error', 'Error creating transaction: ' . $e->getMessage());
            return $this->redirect('/finance/create');
        }
    }
    
    /**
     * Show transaction details
     */
    public function show($id) {
        $this->requireAuth();
        $this->authorize('finance.view');
        
        try {
            $transaction = new Transaction();
            $transactionData = $transaction->find($id);
            
            if (!$transactionData) {
                $this->flash('error', 'Transaction not found');
                return $this->redirect('/finance');
            }
            
            // Get audit trail
            $auditLog = new AuditLog();
            $auditTrail = $auditLog->getEntityAuditTrail('transaction', $id);
            
            return $this->view('finance/show', [
                'transaction' => $transactionData,
                'audit_trail' => $auditTrail
            ]);
            
        } catch (Exception $e) {
            error_log("Show transaction error: " . $e->getMessage());
            $this->flash('error', 'Error loading transaction');
            return $this->redirect('/finance');
        }
    }
    
    /**
     * Submit transaction for approval (FR-06)
     */
    public function submitForApproval($id) {
        $this->requireAuth();
        $this->authorize('finance.create');
        
        try {
            $transaction = new Transaction();
            $status = $transaction->submitForApproval($id);
            
            return $this->json([
                'success' => true,
                'message' => 'Transaction submitted for approval',
                'new_status' => $status
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error submitting transaction: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Show pending approvals
     */
    public function approvals() {
        $this->requireAuth();
        $this->authorize('finance.approve');
        
        try {
            $user = Authentication::user();
            $transaction = new Transaction();
            $pendingApprovals = $transaction->getPendingApprovals($user['id']);
            
            return $this->view('finance/approvals', [
                'transactions' => $pendingApprovals
            ]);
            
        } catch (Exception $e) {
            error_log("Approvals error: " . $e->getMessage());
            $this->flash('error', 'Error loading approvals');
            return $this->redirect('/dashboard');
        }
    }
    
    /**
     * Approve transaction (FR-06)
     */
    public function approve($id) {
        $this->requireAuth();
        $this->authorize('finance.approve');
        
        try {
            $user = Authentication::user();
            $transaction = new Transaction();
            $transaction->approveTransaction($id, $user['id']);
            
            return $this->json([
                'success' => true,
                'message' => 'Transaction approved successfully'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error approving transaction: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reject transaction
     */
    public function reject($id) {
        $this->requireAuth();
        $this->authorize('finance.approve');
        
        try {
            $user = Authentication::user();
            $reason = $this->request->input('reason');
            
            if (empty($reason)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Rejection reason is required'
                ], 400);
            }
            
            $transaction = new Transaction();
            $transaction->rejectTransaction($id, $user['id'], $reason);
            
            return $this->json([
                'success' => true,
                'message' => 'Transaction rejected'
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error rejecting transaction: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Flag suspicious transactions (FR-08)
     */
    public function flagSuspicious() {
        $this->requireAuth();
        $this->authorize('finance.view');
        
        try {
            $projectId = $this->request->input('project_id');
            
            $transaction = new Transaction();
            $suspicious = $transaction->flagSuspiciousTransactions($projectId);
            
            return $this->json([
                'success' => true,
                'data' => $suspicious
            ]);
            
        } catch (Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error checking suspicious transactions'
            ], 500);
        }
    }
    
    /**
     * Generate financial report (FR-20)
     */
    public function generateReport() {
        $this->requireAuth();
        $this->authorize('reports.view');
        
        try {
            $filters = [
                'project_id' => $this->request->input('project_id'),
                'start_date' => $this->request->input('start_date'),
                'end_date' => $this->request->input('end_date'),
                'category' => $this->request->input('category'),
                'vendor_id' => $this->request->input('vendor_id')
            ];
            
            $transaction = new Transaction();
            $report = $transaction->getFinancialReport($filters);
            
            return $this->view('finance/report', [
                'report' => $report,
                'filters' => $filters
            ]);
            
        } catch (Exception $e) {
            error_log("Generate report error: " . $e->getMessage());
            $this->flash('error', 'Error generating report');
            return $this->redirect('/finance');
        }
    }
    
    /**
     * Export financial report (FR-20)
     */
    public function exportReport() {
        $this->requireAuth();
        $this->authorize('finance.export');
        
        try {
            $format = $this->request->input('format', 'pdf');
            $filters = [
                'project_id' => $this->request->input('project_id'),
                'start_date' => $this->request->input('start_date'),
                'end_date' => $this->request->input('end_date')
            ];
            
            $transaction = new Transaction();
            $report = $transaction->getFinancialReport($filters);
            
            // TODO: Implement PDF/Excel export
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
}
