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

<header class="app-header">
    <div class="header-container">
        <!-- Left Section -->
        <div class="header-left">
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle Sidebar">
                <span class="icon">☰</span>
            </button>
            <div class="header-logo">
                <a href="<?php echo BASE_URL; ?>/dashboard" class="logo-link">
                    <span class="logo-icon">🏗</span>
                    <span class="logo-text">MCMS</span>
                </a>
            </div>
        </div>

        <!-- Center Section - Search -->
        <div class="header-center">
            <form class="search-form" id="headerSearch">
                <input 
                    type="search" 
                    class="search-input" 
                    placeholder="Search projects, equipment, reports..." 
                    id="searchInput"
                    autocomplete="off"
                >
                <button type="submit" class="search-btn" aria-label="Search">
                    <span class="icon">🔍</span>
                </button>
                <div class="search-results" id="searchResults" style="display: none;"></div>
            </form>
        </div>

        <!-- Right Section - Icons & Profile -->
        <div class="header-right">
            <!-- Notifications -->
            <div class="header-item">
                <button class="notification-toggle" id="notificationToggle" aria-label="Notifications">
                    <span class="icon">🔔</span>
                    <?php if ($unreadCount > 0): ?>
                    <span class="badge"><?php echo $unreadCount; ?></span>
                    <?php endif; ?>
                </button>
                <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
                    <div class="notification-header">
                        <h3>Notifications</h3>
                        <button class="close-btn" aria-label="Close">×</button>
                    </div>
                    <div class="notification-list">
                        <?php if (!empty($notifications)): ?>
                            <?php foreach (array_slice($notifications, 0, 5) as $notif): ?>
                            <div class="notification-item <?php echo !$notif['read'] ? 'unread' : ''; ?>">
                                <div class="notification-content">
                                    <p class="notification-title"><?php echo htmlspecialchars($notif['title']); ?></p>
                                    <p class="notification-message"><?php echo htmlspecialchars($notif['message']); ?></p>
                                    <p class="notification-time"><?php echo htmlspecialchars($notif['time']); ?></p>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p class="empty-state">No notifications</p>
                        <?php endif; ?>
                    </div>
                    <div class="notification-footer">
                        <a href="<?php echo BASE_URL; ?>/notifications" class="view-all-link">View All</a>
                    </div>
                </div>
            </div>

            <!-- Help -->
            <div class="header-item">
                <button class="help-toggle" id="helpToggle" aria-label="Help" title="Help">
                    <span class="icon">?</span>
                </button>
            </div>

            <!-- User Profile -->
            <div class="header-item">
                <button class="profile-toggle" id="profileToggle" aria-label="User Profile">
                    <img src="<?php echo $userAvatar; ?>" alt="<?php echo $userName; ?>" class="profile-avatar">
                </button>
                <div class="profile-dropdown" id="profileDropdown" style="display: none;">
                    <div class="profile-header">
                        <img src="<?php echo $userAvatar; ?>" alt="<?php echo $userName; ?>" class="profile-image">
                        <div class="profile-info">
                            <p class="profile-name"><?php echo $userName; ?></p>
                            <p class="profile-role"><?php echo $userRole; ?></p>
                        </div>
                    </div>
                    <hr class="divider">
                    <ul class="profile-menu">
                        <li><a href="<?php echo BASE_URL; ?>/profile">👤 My Profile</a></li>
                        <li><a href="<?php echo BASE_URL; ?>/settings">⚙️ Settings</a></li>
                        <li><a href="<?php echo BASE_URL; ?>/help">❓ Help & Support</a></li>
                    </ul>
                    <hr class="divider">
                    <ul class="profile-menu">
                        <li><a href="<?php echo BASE_URL; ?>/logout" class="logout-link">🚪 Logout</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</header>
