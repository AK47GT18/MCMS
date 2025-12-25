<?php
/**
 * Sidebar Partial
 * Displays application sidebar with navigation menu
 * Usage: <?php include 'partials/sidebar.php'; ?>
 */

$user = $user ?? $_SESSION['user'] ?? [];
$userRole = $user['role'] ?? 'guest';
$currentPage = $currentPage ?? '';
?>

<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <button class="sidebar-close" id="sidebarClose" aria-label="Close Sidebar">
            <span class="icon">✕</span>
        </button>
    </div>

    <div class="sidebar-content">
        <!-- Main Navigation -->
        <nav class="sidebar-nav">
            <div class="nav-section">
                <h3 class="nav-label">Main</h3>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/dashboard" class="nav-link <?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>">
                            <span class="nav-icon">📊</span>
                            <span class="nav-label">Dashboard</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Projects & Commitments -->
            <div class="nav-section">
                <h3 class="nav-section-title">Projects</h3>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/projects" class="nav-link <?php echo $currentPage === 'projects' ? 'active' : ''; ?>">
                            <span class="nav-icon">📋</span>
                            <span class="nav-label">Projects</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/commitments" class="nav-link <?php echo $currentPage === 'commitments' ? 'active' : ''; ?>">
                            <span class="nav-icon">✓</span>
                            <span class="nav-label">Commitments</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/contracts" class="nav-link <?php echo $currentPage === 'contracts' ? 'active' : ''; ?>">
                            <span class="nav-icon">📜</span>
                            <span class="nav-label">Contracts</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Resources -->
            <div class="nav-section">
                <h3 class="nav-section-title">Resources</h3>
                <ul class="nav-list">
                    <?php if (in_array($userRole, ['equipment_coordinator', 'admin'])): ?>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/equipment" class="nav-link <?php echo $currentPage === 'equipment' ? 'active' : ''; ?>">
                            <span class="nav-icon">⚙️</span>
                            <span class="nav-label">Equipment</span>
                        </a>
                    </li>
                    <?php endif; ?>

                    <?php if (in_array($userRole, ['field_supervisor', 'equipment_coordinator', 'admin'])): ?>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/sites" class="nav-link <?php echo $currentPage === 'sites' ? 'active' : ''; ?>">
                            <span class="nav-icon">📍</span>
                            <span class="nav-label">Sites</span>
                        </a>
                    </li>
                    <?php endif; ?>
                </ul>
            </div>

            <!-- Finance -->
            <?php if (in_array($userRole, ['finance_officer', 'admin'])): ?>
            <div class="nav-section">
                <h3 class="nav-section-title">Finance</h3>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/finance" class="nav-link <?php echo $currentPage === 'finance' ? 'active' : ''; ?>">
                            <span class="nav-icon">💰</span>
                            <span class="nav-label">Finance</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/budgets" class="nav-link <?php echo $currentPage === 'budgets' ? 'active' : ''; ?>">
                            <span class="nav-icon">💳</span>
                            <span class="nav-label">Budgets</span>
                        </a>
                    </li>
                </ul>
            </div>
            <?php endif; ?>

            <!-- Reports & Analytics -->
            <div class="nav-section">
                <h3 class="nav-section-title">Analytics</h3>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/reports" class="nav-link <?php echo $currentPage === 'reports' ? 'active' : ''; ?>">
                            <span class="nav-icon">📈</span>
                            <span class="nav-label">Reports</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/analytics" class="nav-link <?php echo $currentPage === 'analytics' ? 'active' : ''; ?>">
                            <span class="nav-icon">📊</span>
                            <span class="nav-label">Analytics</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Administration -->
            <?php if ($userRole === 'admin'): ?>
            <div class="nav-section">
                <h3 class="nav-section-title">Administration</h3>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/admin/users" class="nav-link <?php echo $currentPage === 'admin_users' ? 'active' : ''; ?>">
                            <span class="nav-icon">👥</span>
                            <span class="nav-label">Users</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/admin/roles" class="nav-link <?php echo $currentPage === 'admin_roles' ? 'active' : ''; ?>">
                            <span class="nav-icon">🔐</span>
                            <span class="nav-label">Roles & Permissions</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/admin/settings" class="nav-link <?php echo $currentPage === 'admin_settings' ? 'active' : ''; ?>">
                            <span class="nav-icon">⚙️</span>
                            <span class="nav-label">Settings</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/admin/logs" class="nav-link <?php echo $currentPage === 'admin_logs' ? 'active' : ''; ?>">
                            <span class="nav-icon">📋</span>
                            <span class="nav-label">Audit Logs</span>
                        </a>
                    </li>
                </ul>
            </div>
            <?php endif; ?>

            <!-- Support -->
            <div class="nav-section">
                <h3 class="nav-section-title">Support</h3>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/help" class="nav-link">
                            <span class="nav-icon">❓</span>
                            <span class="nav-label">Help Center</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo BASE_URL; ?>/contact" class="nav-link">
                            <span class="nav-icon">💬</span>
                            <span class="nav-label">Contact Support</span>
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
    </div>

    <div class="sidebar-footer">
        <a href="<?php echo BASE_URL; ?>/settings" class="sidebar-footer-link">
            <span class="icon">⚙️</span>
            <span>Settings</span>
        </a>
        <a href="<?php echo BASE_URL; ?>/logout" class="sidebar-footer-link logout">
            <span class="icon">🚪</span>
            <span>Logout</span>
        </a>
    </div>
</aside>
