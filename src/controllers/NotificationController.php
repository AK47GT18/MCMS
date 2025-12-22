<?php
namespace Mkaka\Controllers;

use Mkaka\Core\Controller;
use Mkaka\Models\Notification;

/**
 * Notification Controller
 * 
 * @file NotificationController.php
 * @description Notification management (FR-23)
 * @author Anthony Kanjira (CEN/01/01/22)
 */

class NotificationController extends Controller {
    
    public function index() {
        $this->requireAuth();
        
        try {
            $user = Authentication::user();
            $notification = new Notification();
            $notifications = $notification->getUserNotifications($user['id']);
            
            return $this->view('notifications/index', [
                'notifications' => $notifications
            ]);
        } catch (Exception $e) {
            $this->flash('error', 'Error loading notifications');
            return $this->redirect('/dashboard');
        }
    }
    
    public function getUnread() {
        $this->requireAuth();
        
        try {
            $user = Authentication::user();
            $notification = new Notification();
            $unread = $notification->getUnreadNotifications($user['id']);
            
            return $this->json([
                'success' => true,
                'data' => $unread,
                'count' => count($unread)
            ]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => 'Error loading notifications'], 500);
        }
    }
    
    public function markAsRead($id) {
        $this->requireAuth();
        
        try {
            $notification = new Notification();
            $notification->markAsRead($id);
            
            return $this->json(['success' => true, 'message' => 'Notification marked as read']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function markAllAsRead() {
        $this->requireAuth();
        
        try {
            $user = Authentication::user();
            $notification = new Notification();
            $unread = $notification->getUnreadNotifications($user['id']);
            
            foreach ($unread as $notif) {
                $notification->markAsRead($notif['id']);
            }
            
            return $this->json(['success' => true, 'message' => 'All notifications marked as read']);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}