<?php
namespace Mkaka\Services;

use PHPMailer\PHPMailer\PHPMailer;

class EmailService {
    
    private $mailer;
    
    public function __construct() {
        // Initialize PHPMailer
        require_once __DIR__ . '/../../vendor/phpmailer/phpmailer/src/PHPMailer.php';
        require_once __DIR__ . '/../../vendor/phpmailer/phpmailer/src/SMTP.php';
        require_once __DIR__ . '/../../vendor/phpmailer/phpmailer/src/Exception.php';
        
        $this->mailer = new PHPMailer\PHPMailer\PHPMailer(true);
        $this->configureMailer();
    }
    
    /**
     * Configure mailer with settings
     */
    private function configureMailer() {
        $this->mailer->isSMTP();
        $this->mailer->Host = getenv('MAIL_HOST');
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = getenv('MAIL_USER');
        $this->mailer->Password = getenv('MAIL_PASS');
        $this->mailer->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $this->mailer->Port = getenv('MAIL_PORT');
        $this->mailer->setFrom(getenv('MAIL_FROM'), getenv('MAIL_FROM_NAME'));
    }
    
    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($email, $token) {
        $resetUrl = getenv('APP_URL') . "/reset-password/$token";
        
        $subject = 'Password Reset Request';
        $body = $this->renderTemplate('password-reset', [
            'reset_url' => $resetUrl,
            'expires_in' => '1 hour'
        ]);
        
        return $this->send($email, $subject, $body);
    }
    
    /**
     * Send budget alert email (FR-07)
     */
    public function sendBudgetAlert($project, $threshold, $utilization) {
        $subject = "Budget Alert: {$threshold}% Utilized - {$project['name']}";
        $body = $this->renderTemplate('budget-alert', [
            'project' => $project,
            'threshold' => $threshold,
            'utilization' => $utilization
        ]);
        
        $userRepo = new UserRepository();
        $manager = $userRepo->findById($project['manager_id']);
        
        if ($manager && $manager['email']) {
            return $this->send($manager['email'], $subject, $body);
        }
        
        return false;
    }
    
    /**
     * Send deadline reminder email (FR-10)
     */
    public function sendDeadlineReminder($contract, $timeframe) {
        $subject = "Contract Milestone Deadline: $timeframe";
        $body = $this->renderTemplate('deadline-reminder', [
            'contract' => $contract,
            'timeframe' => $timeframe
        ]);
        
        return $this->send($contract['manager_email'], $subject, $body);
    }
    
    /**
     * Send approval request email (FR-06)
     */
    public function sendApprovalRequest($approver, $entity) {
        $subject = 'Approval Request: ' . $entity['title'];
        $body = $this->renderTemplate('approval-request', [
            'entity' => $entity,
            'approver' => $approver
        ]);
        
        return $this->send($approver['email'], $subject, $body);
    }
    
    /**
     * Send generic notification email
     */
    public function sendNotification($data) {
        $subject = $data['title'];
        $body = $this->renderTemplate('notification', $data);
        
        return $this->send($data['email'], $subject, $body);
    }
    
    /**
     * Send email
     */
    private function send($to, $subject, $body) {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($to);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            $this->mailer->isHTML(true);
            
            return $this->mailer->send();
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Render email template
     */
    private function renderTemplate($template, $data = []) {
        $templatePath = __DIR__ . "/../../views/emails/$template.php";
        
        if (!file_exists($templatePath)) {
            return $data['message'] ?? 'Notification from Mkaka Construction Management System';
        }
        
        ob_start();
        extract($data);
        include $templatePath;
        return ob_get_clean();
    }
}