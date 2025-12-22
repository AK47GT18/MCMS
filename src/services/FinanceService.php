<?php
namespace Mkaka\Services;

use Mkaka\Repositories\TransactionRepository;
use Mkaka\Repositories\ProjectRepository;
use Mkaka\Services\AuditService;
use Mkaka\Services\NotificationService;
use Mkaka\Services\ApprovalService;

class FinanceService {
    
    private $transactionRepository;
    private $projectRepository;
    private $auditService;
    private $notificationService;
    private $approvalService;
    
    public function __construct() {
        $this->transactionRepository = new TransactionRepository();
        $this->projectRepository = new ProjectRepository();
        $this->auditService = new AuditService();
        $this->notificationService = new NotificationService();
        $this->approvalService = new ApprovalService();
    }
    
    /**
     * Create transaction with audit trail (FR-05)
     */
    public function createTransaction($data) {
        // Check authorization
        Authorization::require('finance.create');
        
        // Validate input
        $this->validateTransactionData($data);
        
        // Set created by
        $user = Authentication::user();
        $data['created_by'] = $user['id'];
        
        // Create transaction (includes fraud detection FR-08)
        $transactionId = $this->transactionRepository->create($data);
        
        // Get transaction details
        $transaction = $this->transactionRepository->findById($transactionId);
        
        // Check if requires approval (FR-06)
        if ($this->requiresApproval($transaction)) {
            $this->approvalService->createApprovalRequest(
                'transaction',
                $transactionId,
                $this->getApprovers($transaction)
            );
        }
        
        // Check if flagged (FR-08)
        if ($transaction['is_flagged']) {
            $this->notifyFlaggedTransaction($transaction);
        }
        
        return [
            'success' => true,
            'transaction_id' => $transactionId,
            'is_flagged' => $transaction['is_flagged'],
            'flag_reason' => $transaction['flag_reason'],
            'message' => 'Transaction created successfully'
        ];
    }
    
    /**
     * Approve transaction (FR-06)
     */
    public function approveTransaction($transactionId, $remarks = null) {
        // Check authorization
        Authorization::require('finance.approve');
        
        $transaction = $this->transactionRepository->findById($transactionId);
        
        if (!$transaction) {
            throw NotFoundException::transaction($transactionId);
        }
        
        if ($transaction['status'] !== 'pending') {
            throw new ValidationException([
                'status' => 'Transaction is not pending approval'
            ]);
        }
        
        // Update status
        $user = Authentication::user();
        $this->transactionRepository->updateStatus(
            $transactionId,
            'approved',
            $user['id'],
            $remarks
        );
        
        // Notify creator
        $this->notificationService->notify([
            'user_id' => $transaction['created_by'],
            'title' => 'Transaction Approved',
            'message' => "Transaction {$transaction['transaction_code']} has been approved",
            'type' => 'approval',
            'entity_id' => $transactionId
        ]);
        
        // Check project budget status (FR-07)
        if ($transaction['project_id']) {
            $projectService = new ProjectService();
            $projectService->checkBudgetStatus($transaction['project_id']);
        }
        
        return [
            'success' => true,
            'message' => 'Transaction approved successfully'
        ];
    }
    
    /**
     * Reject transaction (FR-06)
     */
    public function rejectTransaction($transactionId, $remarks) {
        // Check authorization
        Authorization::require('finance.approve');
        
        if (empty($remarks)) {
            throw new ValidationException(['remarks' => 'Rejection reason is required']);
        }
        
        $transaction = $this->transactionRepository->findById($transactionId);
        
        if (!$transaction) {
            throw NotFoundException::transaction($transactionId);
        }
        
        if ($transaction['status'] !== 'pending') {
            throw new ValidationException([
                'status' => 'Transaction is not pending approval'
            ]);
        }
        
        // Update status
        $user = Authentication::user();
        $this->transactionRepository->updateStatus(
            $transactionId,
            'rejected',
            $user['id'],
            $remarks
        );
        
        // Notify creator
        $this->notificationService->notify([
            'user_id' => $transaction['created_by'],
            'title' => 'Transaction Rejected',
            'message' => "Transaction {$transaction['transaction_code']} has been rejected. Reason: $remarks",
            'type' => 'approval',
            'entity_id' => $transactionId
        ]);
        
        return [
            'success' => true,
            'message' => 'Transaction rejected'
        ];
    }
    
    /**
     * Generate financial report (FR-20)
     */
    public function generateReport($filters = []) {
        // Check authorization
        Authorization::require('reports.view');
        
        // Get report data
        $reportData = $this->transactionRepository->generateReport($filters);
        
        // Calculate summary
        $summary = [
            'total_expenses' => 0,
            'total_income' => 0,
            'net_amount' => 0,
            'transaction_count' => 0
        ];
        
        foreach ($reportData as $row) {
            $summary['total_expenses'] += $row['total_expenses'];
            $summary['total_income'] += $row['total_income'];
            $summary['net_amount'] += $row['net_amount'];
            $summary['transaction_count'] += $row['transaction_count'];
        }
        
        return [
            'summary' => $summary,
            'details' => $reportData,
            'filters' => $filters,
            'generated_at' => date(DATETIME_FORMAT)
        ];
    }
    
    /**
     * Check if transaction requires approval (FR-06)
     */
    private function requiresApproval($transaction) {
        // Define approval thresholds
        $thresholds = [
            'expense' => 1000000, // 1 million MWK
            'income' => 5000000   // 5 million MWK
        ];
        
        $threshold = $thresholds[$transaction['type']] ?? 0;
        
        return $transaction['amount'] >= $threshold;
    }
    
    /**
     * Get approvers for transaction
     */
    private function getApprovers($transaction) {
        // Get finance officers and operations manager
        $userRepository = new UserRepository();
        
        $financeOfficers = $userRepository->getByRole(ROLE_FINANCE_OFFICER);
        $opsManagers = $userRepository->getByRole(ROLE_OPERATIONS_MANAGER);
        
        return array_merge(
            array_column($financeOfficers, 'id'),
            array_column($opsManagers, 'id')
        );
    }
    
    /**
     * Notify about flagged transaction (FR-08)
     */
    private function notifyFlaggedTransaction($transaction) {
        $userRepository = new UserRepository();
        $financeOfficers = $userRepository->getByRole(ROLE_FINANCE_OFFICER);
        
        foreach ($financeOfficers as $officer) {
            $this->notificationService->notify([
                'user_id' => $officer['id'],
                'title' => 'Suspicious Transaction Detected',
                'message' => "Transaction {$transaction['transaction_code']} has been flagged: {$transaction['flag_reason']}",
                'type' => 'security_alert',
                'entity_id' => $transaction['id'],
                'priority' => 'high'
            ]);
        }
    }
    
    /**
     * Validate transaction data
     */
    private function validateTransactionData($data, $isUpdate = false) {
        $errors = [];
        
        if (!$isUpdate || isset($data['project_id'])) {
            if (empty($data['project_id'])) {
                $errors['project_id'] = 'Project is required';
            }
        }
        
        if (!$isUpdate || isset($data['type'])) {
            if (empty($data['type'])) {
                $errors['type'] = 'Transaction type is required';
            } elseif (!in_array($data['type'], ['expense', 'income'])) {
                $errors['type'] = 'Invalid transaction type';
            }
        }
        
        if (!$isUpdate || isset($data['category'])) {
            if (empty($data['category'])) {
                $errors['category'] = 'Category is required';
            }
        }
        
        if (!$isUpdate || isset($data['amount'])) {
            if (empty($data['amount']) || $data['amount'] <= 0) {
                $errors['amount'] = 'Amount must be greater than zero';
            }
        }
        
        if (!$isUpdate || isset($data['transaction_date'])) {
            if (empty($data['transaction_date'])) {
                $errors['transaction_date'] = 'Transaction date is required';
            }
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
    }
}