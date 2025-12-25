<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Models\Document;

/**
 * Document Controller
 * 
 * @file DocumentController.php
 * @description Document management (FR-22)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class DocumentController extends Controller {
    
    public function search() {
        $this->requireAuth();
        $this->authorize('documents.view');
        
        try {
            $criteria = [
                'entity_type' => $this->request->input('entity_type'),
                'document_type' => $this->request->input('document_type'),
                'start_date' => $this->request->input('start_date'),
                'end_date' => $this->request->input('end_date'),
                'keyword' => $this->request->input('keyword'),
                'project_name' => $this->request->input('project_name')
            ];
            
            $document = new Document();
            $results = $document->searchDocuments($criteria);
            
            return $this->view('documents/search', [
                'documents' => $results,
                'criteria' => $criteria
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error searching documents');
            return $this->redirect('/dashboard');
        }
    }
    
    public function upload() {
        $this->requireAuth();
        $this->authorize('documents.create');
        
        try {
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                return $this->json(['success' => false, 'message' => 'No file uploaded'], 400);
            }
            
            $file = $_FILES['file'];
            $entityType = $this->request->input('entity_type');
            $entityId = $this->request->input('entity_id');
            $documentType = $this->request->input('document_type');
            $description = $this->request->input('description');
            
            $document = new Document();
            $documentId = $document->uploadDocument($file, $entityType, $entityId, $documentType, $description);
            
            return $this->json([
                'success' => true,
                'message' => 'Document uploaded',
                'document_id' => $documentId
            ]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function download($id) {
        $this->requireAuth();
        $this->authorize('documents.view');
        
        try {
            $document = new Document();
            $doc = $document->find($id);
            
            if (!$doc || !file_exists($doc['file_path'])) {
                $this->flash('error', 'Document not found');
                return $this->redirect('/dashboard');
            }
            
            return $this->response->download($doc['file_path'], $doc['file_name']);
        } catch (Exception $e) {
            $this->flash('error', 'Error downloading document');
            return $this->redirect('/dashboard');
        }
    }
    
    /**
     * Get OnlyOffice configuration for a document
     */
    public function getConfig($id) {
        $this->requireAuth();
        $this->authorize('documents.view');
        
        try {
            $document = new Document();
            $doc = $document->find($id);
            
            if (!$doc) {
                return $this->json(['success' => false, 'message' => 'Document not found'], 404);
            }
            
            $config = require __DIR__ . '/../config/onlyoffice.php';
            $user = Authentication::user();
            
            $docConfig = [
                'document' => [
                    'fileType' => pathinfo($doc['file_name'], PATHINFO_EXTENSION),
                    'key' => $doc['file_key'] ?? md5($doc['id'] . $doc['updated_at']),
                    'title' => $doc['file_name'],
                    'url' => BASE_URL . '/documents/download/' . $id,
                    'permissions' => [
                        'comment' => true,
                        'download' => true,
                        'edit' => $this->can('documents.edit'),
                        'print' => true,
                        'review' => true
                    ]
                ],
                'documentType' => $this->getDocumentType(pathinfo($doc['file_name'], PATHINFO_EXTENSION)),
                'editorConfig' => [
                    'callbackUrl' => BASE_URL . '/api/v1/documents/callback/' . $id,
                    'user' => [
                        'id' => (string)$user['id'],
                        'name' => $user['first_name'] . ' ' . $user['last_name']
                    ],
                    'customization' => [
                        'autosave' => true,
                        'forcesave' => true,
                    ]
                ]
            ];
            
            // Generate JWT
            $docConfig['token'] = $this->generateJWT($docConfig, $config['jwt_secret']);
            
            return $this->json([
                'success' => true,
                'config' => $docConfig,
                'serverUrl' => $config['document_server_url']
            ]);
            
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    private function getDocumentType($extension) {
        $types = [
            'word' => ['doc', 'docx', 'txt', 'odt', 'rtf'],
            'cell' => ['xls', 'xlsx', 'csv', 'ods'],
            'slide' => ['ppt', 'pptx', 'odp']
        ];
        
        foreach ($types as $type => $extensions) {
            if (in_array(strtolower($extension), $extensions)) {
                return $type;
            }
        }
        
        return 'word'; // Default
    }
    
    private function generateJWT($payload, $secret) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function delete($id) {
        $this->requireAuth();
        $this->authorize('documents.delete');
        
        try {
            $document = new Document();
            $document->deleteDocument($id);
            
            return $this->json(['success' => true, 'message' => 'Document deleted']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}