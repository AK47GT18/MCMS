<?php
/**
 * Header Partial
 * Displays application header with user profile and notifications
 * Usage: <?php include 'partials/header.php'; ?>
 */

$user = $user ?? $_SESSION['user'] ?? [];
$userName = htmlspecialchars($user['name'] ?? 'User');
$userRole = htmlspecialchars($user['role'] ?? 'Guest');
$userAvatar = htmlspecialchars($user['avatar'] ?? '/MCMS/public/images/default-avatar.png');
$notifications = $notifications ?? [];
$unreadCount = count(array_filter($notifications, fn($n) => !$n['read']));
?>

<div class="logo">
    <i class="fas fa-hard-hat"></i>
    <span>MCMS</span>
</div>

<div class="project-switcher" id="projectSwitcher">
    <i class="fas fa-building"></i>
    <span>Select Project...</span>
    <i class="fas fa-chevron-down" style="margin-left: auto; font-size: 12px;"></i>
</div>

<div class="top-actions">
    <!-- Search -->
    <button class="action-btn" aria-label="Search">
        <i class="fas fa-search"></i>
    </button>
    
    <!-- Notifications -->
    <div class="header-item">
        <button class="notification-toggle" id="notificationToggle">
            <i class="fas fa-bell"></i>
            <?php if ($unreadCount > 0): ?>
            <span class="badge"><?php echo $unreadCount; ?></span>
            <?php endif; ?>
        </button>
    </div>

    <!-- User Profile -->
    <div class="user-profile-dropdown">
        <div class="user-avatar">
            <?php echo substr($userName, 0, 2); ?>
        </div>
    </div>
</div>
