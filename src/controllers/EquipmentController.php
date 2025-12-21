<?php
/**
 * Equipment Controller
 * 
 * @file EquipmentController.php
 * @description Fleet and equipment management (FR-11, FR-12, FR-13)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class EquipmentController extends Controller {
    
    public function index() {
        $this->requireAuth();
        $this->authorize('equipment.view');
        
        try {
            $status = $this->request->input('status');
            $equipment = new Equipment();
            
            $equipmentList = $status ? 
                $equipment->getByStatus($status) : 
                $equipment->all();
            
            return $this->view('equipment/index', [
                'equipment' => $equipmentList,
                'status_filter' => $status
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading equipment');
            return $this->redirect('/dashboard');
        }
    }
    
    public function create() {
        $this->requireAuth();
        $this->authorize('equipment.create');
        return $this->view('equipment/create');
    }
    
    public function store() {
        $this->requireAuth();
        $this->authorize('equipment.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'equipment_name' => 'required',
                'equipment_type' => 'required',
                'purchase_date' => 'required'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields');
                return $this->redirect('/equipment/create');
            }
            
            $equipment = new Equipment();
            $equipmentId = $equipment->createEquipment($this->request->all());
            
            $this->flash('success', 'Equipment created successfully');
            return $this->redirect('/equipment/' . $equipmentId);
        } catch (Exception $e) {
            $this->flash('error', 'Error creating equipment');
            return $this->redirect('/equipment/create');
        }
    }
    
    public function show($id) {
        $this->requireAuth();
        $this->authorize('equipment.view');
        
        try {
            $equipment = new Equipment();
            $equipmentData = $equipment->find($id);
            
            if (!$equipmentData) {
                $this->flash('error', 'Equipment not found');
                return $this->redirect('/equipment');
            }
            
            $checkoutHistory = $equipment->getCheckoutHistory($id);
            $maintenance = new Maintenance();
            $maintenanceHistory = $maintenance->getEquipmentHistory($id);
            
            return $this->view('equipment/show', [
                'equipment' => $equipmentData,
                'checkout_history' => $checkoutHistory,
                'maintenance_history' => $maintenanceHistory
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading equipment');
            return $this->redirect('/equipment');
        }
    }
    
    public function checkOut($id) {
        $this->requireAuth();
        $this->authorize('equipment.checkin');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'project_id' => 'required',
                'assigned_to' => 'required',
                'latitude' => 'required|numeric',
                'longitude' => 'required|numeric'
            ]);
            
            if ($validator->fails()) {
                return $this->json(['success' => false, 'message' => 'Invalid data'], 400);
            }
            
            $gpsData = [
                'latitude' => $this->request->input('latitude'),
                'longitude' => $this->request->input('longitude'),
                'accuracy' => $this->request->input('accuracy', 0)
            ];
            
            $equipment = new Equipment();
            $equipment->checkOut(
                $id,
                $this->request->input('project_id'),
                $this->request->input('assigned_to'),
                $gpsData
            );
            
            return $this->json(['success' => true, 'message' => 'Equipment checked out']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function checkIn($id) {
        $this->requireAuth();
        $this->authorize('equipment.checkout');
        
        try {
            $gpsData = [
                'latitude' => $this->request->input('latitude'),
                'longitude' => $this->request->input('longitude'),
                'accuracy' => $this->request->input('accuracy', 0)
            ];
            
            $condition = $this->request->input('condition', 'good');
            
            $equipment = new Equipment();
            $equipment->checkIn($id, $gpsData, $condition);
            
            return $this->json(['success' => true, 'message' => 'Equipment checked in']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function scheduleMaintenance($id) {
        $this->requireAuth();
        $this->authorize('maintenance.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'type' => 'required',
                'scheduled_date' => 'required'
            ]);
            
            if ($validator->fails()) {
                return $this->json(['success' => false, 'message' => 'Invalid data'], 400);
            }
            
            $equipment = new Equipment();
            $maintenanceId = $equipment->scheduleMaintenance($id, $this->request->all());
            
            return $this->json([
                'success' => true,
                'message' => 'Maintenance scheduled',
                'maintenance_id' => $maintenanceId
            ]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function utilizationReport() {
        $this->requireAuth();
        $this->authorize('reports.view');
        
        try {
            $startDate = $this->request->input('start_date', date('Y-m-01'));
            $endDate = $this->request->input('end_date', date('Y-m-d'));
            
            $equipment = new Equipment();
            $report = $equipment->getUtilizationReport($startDate, $endDate);
            
            return $this->view('equipment/utilization-report', [
                'report' => $report,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error generating report');
            return $this->redirect('/equipment');
        }
    }
}
