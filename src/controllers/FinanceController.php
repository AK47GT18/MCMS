<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Models\Transaction;
use Mkaka\Models\Budget;
use Exception;

/**
 * Finance Controller
 * 
 * @file FinanceController.php
 * @description Finance management module (FR-09, FR-10, FR-24)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 */
class FinanceController extends Controller {
    
    /**
     * Finance Dashboard
     */
    public function index() {
        $this->requireAuth();
        $this->authorize('finance.view');
        
        try {
            $budgetModel = new Budget();
            $transactionModel = new Transaction();
            
            // Stats
            $stats = [
                'total_budget' => $budgetModel->getTotalBudget(),
                'total_expenses' => $transactionModel->getTotalExpenses(),
                'pending_approvals' => $transactionModel->countPendingApprovals(),
                'cash_on_hand' => $budgetModel->getCashOnHand()
            ];
            
            // Charts Data
            $charts = [
                'expenses_by_category' => $transactionModel->getExpensesByCategory(),
                'monthly_cashflow' => $transactionModel->getMonthlyCashflow()
            ];
            
            // Recent Transactions
            $recentTransactions = $transactionModel->getRecent(5);
            
            return $this->view('finance/index', [
                'stats' => $stats,
                'charts' => $charts,
                'recent_transactions' => $recentTransactions
            ]);
            
        } catch (Exception $e) {
            error_log("Finance dashboard error: " . $e->getMessage());
            $this->flash('error', 'Error loading finance dashboard');
            return $this->redirect('/dashboard');
        }
    }
    
    /**
     * List Transactions
     */
    public function transactions() {
        $this->requireAuth();
        $this->authorize('finance.view');
        
        try {
            $page = $this->request->input('page', 1);
            $filters = [
                'start_date' => $this->request->input('start_date'),
                'end_date' => $this->request->input('end_date'),
                'type' => $this->request->input('type'),
                'category' => $this->request->input('category')
            ];
            
            $transactionModel = new Transaction();
            $transactions = $transactionModel->getTransactions($filters, $page);
            
            return $this->view('finance/transactions', [
                'transactions' => $transactions['data'],
                'pagination' => $transactions,
                'filters' => $filters
            ]);
            
        } catch (Exception $e) {
            error_log("Transactions list error: " . $e->getMessage());
            $this->flash('error', 'Error loading transactions');
            return $this->redirect('/finance');
        }
    }

    /**
     * Create Transaction (AJAX)
     */
    public function storeTransaction() {
        $this->requireAuth();
        $this->authorize('finance.create');

        try {
            // Validation simple implementation
            $data = $this->request->all();
            if (empty($data['amount']) || empty($data['description'])) {
                return $this->json(['success' => false, 'message' => 'Missing required fields'], 400);
            }

            $transactionModel = new Transaction();
            $id = $transactionModel->create($data);

            return $this->json(['success' => true, 'id' => $id, 'message' => 'Transaction recorded']);

        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
