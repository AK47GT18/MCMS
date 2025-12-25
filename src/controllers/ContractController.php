<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Models\Contract;
use Exception;

/**
 * Contract Controller
 * 
 * @file ContractController.php
 * @description Contract management module (FR-11, FR-38)
 * @author Anthony Kanjira (CEN/01/01/22)
 * @project Mkaka Construction Management System
 */
class ContractController extends Controller {
    
    /**
     * Contracts Dashboard
     */
    public function index() {
        $this->requireAuth();
        $this->authorize('contracts.view');
        
        try {
            $contractModel = new Contract();
            
            // Stats
            $stats = [
                'active' => $contractModel->countByStatus('active'),
                'expiring_soon' => $contractModel->countExpiringSoon(30), // 30 days
                'pending_signatures' => $contractModel->countByStatus('pending_signature'),
                'total_value' => $contractModel->getTotalValue()
            ];
            
            // Recent Contracts
            $recentContracts = $contractModel->getRecent(5);
            
            return $this->view('contracts/index', [
                'stats' => $stats,
                'recent_contracts' => $recentContracts
            ]);
            
        } catch (Exception $e) {
            error_log("Contracts dashboard error: " . $e->getMessage());
            $this->flash('error', 'Error loading contracts dashboard');
            return $this->redirect('/dashboard');
        }
    }
    
    /**
     * List All Contracts
     */
    public function list() {
        $this->requireAuth();
        $this->authorize('contracts.view');
        
        // Implementation for full list with filters
        // For now redirect to dashboard or implement list logic
        return $this->index(); 
    }
}