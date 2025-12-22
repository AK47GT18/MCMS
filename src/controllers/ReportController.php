<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Models\SiteReport;

/**
 * Report Controller
 * 
 * @file ReportController.php
 * @description Site reports with geotagging (FR-14, FR-15)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class ReportController extends Controller {
    
    public function index() {
        $this->requireAuth();
        $this->authorize('site_reports.view');
        
        try {
            $projectId = $this->request->input('project_id');
            $startDate = $this->request->input('start_date');
            $endDate = $this->request->input('end_date');
            
            $siteReport = new SiteReport();
            
            if ($projectId) {
                $reports = $siteReport->getProjectReports($projectId, $startDate, $endDate);
            } else {
                $reports = $siteReport->all([], 'report_date DESC', 50);
            }
            
            $project = new Project();
            $projects = $project->getActiveProjects();
            
            return $this->view('reports/index', [
                'reports' => $reports,
                'projects' => $projects,
                'filters' => [
                    'project_id' => $projectId,
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading reports');
            return $this->redirect('/dashboard');
        }
    }
    
    public function create() {
        $this->requireAuth();
        $this->authorize('site_reports.create');
        
        $project = new Project();
        $projects = $project->getActiveProjects();
        
        return $this->view('reports/create', ['projects' => $projects]);
    }
    
    public function store() {
        $this->requireAuth();
        $this->authorize('site_reports.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'project_id' => 'required',
                'report_date' => 'required',
                'latitude' => 'required|numeric',
                'longitude' => 'required|numeric'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all required fields');
                return $this->redirect('/reports/create');
            }
            
            $photos = $_FILES['photos'] ?? [];
            
            $siteReport = new SiteReport();
            $reportId = $siteReport->createReport($this->request->all(), $photos);
            
            $this->flash('success', 'Site report created successfully');
            return $this->redirect('/reports/' . $reportId);
        } catch (Exception $e) {
            $this->flash('error', 'Error creating report: ' . $e->getMessage());
            return $this->redirect('/reports/create');
        }
    }
    
    public function show($id) {
        $this->requireAuth();
        $this->authorize('site_reports.view');
        
        try {
            $siteReport = new SiteReport();
            $reportData = $siteReport->getReportWithPhotos($id);
            
            if (!$reportData) {
                $this->flash('error', 'Report not found');
                return $this->redirect('/reports');
            }
            
            return $this->view('reports/show', $reportData);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading report');
            return $this->redirect('/reports');
        }
    }
    
    public function submit($id) {
        $this->requireAuth();
        $this->authorize('site_reports.create');
        
        try {
            $siteReport = new SiteReport();
            $siteReport->submitReport($id);
            
            return $this->json(['success' => true, 'message' => 'Report submitted for approval']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}