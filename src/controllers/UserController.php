<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Models\User;

/**
 * User Controller
 * 
 * @file UserController.php
 * @description User management
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class UserController extends Controller {
    
    public function index() {
        $this->requireAuth();
        $this->authorize('users.view');
        
        try {
            $page = $this->request->input('page', 1);
            $userModel = new User();
            $users = $userModel->getActiveUsers($page);
            
            return $this->view('users/index', [
                'users' => $users['data'],
                'pagination' => $users
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading users');
            return $this->redirect('/dashboard');
        }
    }
    
    public function create() {
        $this->requireAuth();
        $this->authorize('users.create');
        
        $sql = "SELECT * FROM roles ORDER BY role_name";
        $db = Database::getInstance();
        $roles = $db->query($sql);
        
        return $this->view('users/create', ['roles' => $roles]);
    }
    
    public function store() {
        $this->requireAuth();
        $this->authorize('users.create');
        
        try {
            $validator = $this->validate($this->request->all(), [
                'username' => 'required|min:3',
                'email' => 'required|email',
                'password' => 'required|min:8',
                'first_name' => 'required',
                'last_name' => 'required',
                'role_id' => 'required'
            ]);
            
            if ($validator->fails()) {
                $this->flash('error', 'Please fill all fields correctly');
                return $this->redirect('/users/create');
            }
            
            $userModel = new User();
            $userId = $userModel->createUser($this->request->all());
            
            $this->flash('success', 'User created successfully');
            return $this->redirect('/users/' . $userId);
        } catch (Exception $e) {
            $this->flash('error', 'Error creating user: ' . $e->getMessage());
            return $this->redirect('/users/create');
        }
    }
    
    public function show($id) {
        $this->requireAuth();
        $this->authorize('users.view');
        
        try {
            $userModel = new User();
            $user = $userModel->getUserWithRole($id);
            
            if (!$user) {
                $this->flash('error', 'User not found');
                return $this->redirect('/users');
            }
            
            $auditLog = new AuditLog();
            $activity = $auditLog->getUserActivity($id, null, null);
            
            return $this->view('users/show', [
                'user' => $user,
                'activity' => $activity
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading user');
            return $this->redirect('/users');
        }
    }
    
    public function edit($id) {
        $this->requireAuth();
        $this->authorize('users.edit');
        
        try {
            $userModel = new User();
            $user = $userModel->find($id);
            
            if (!$user) {
                $this->flash('error', 'User not found');
                return $this->redirect('/users');
            }
            
            $sql = "SELECT * FROM roles ORDER BY role_name";
            $db = Database::getInstance();
            $roles = $db->query($sql);
            
            return $this->view('users/edit', [
                'user' => $user,
                'roles' => $roles
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading user');
            return $this->redirect('/users');
        }
    }
    
    public function update($id) {
        $this->requireAuth();
        $this->authorize('users.edit');
        
        try {
            $data = $this->request->except(['password', 'password_confirmation']);
            
            $userModel = new User();
            $userModel->update($id, $data);
            
            $this->flash('success', 'User updated successfully');
            return $this->redirect('/users/' . $id);
        } catch (Exception $e) {
            $this->flash('error', 'Error updating user');
            return $this->redirect('/users/' . $id . '/edit');
        }
    }
    
    public function deactivate($id) {
        $this->requireAuth();
        $this->authorize('users.edit');
        
        try {
            $userModel = new User();
            $userModel->deactivate($id);
            
            return $this->json(['success' => true, 'message' => 'User deactivated']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function activate($id) {
        $this->requireAuth();
        $this->authorize('users.edit');
        
        try {
            $userModel = new User();
            $userModel->activate($id);
            
            return $this->json(['success' => true, 'message' => 'User activated']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
