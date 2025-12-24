<?php
/**
 * Navbar Partial
 * Displays navigation bar with menu items
 * Usage: <?php include 'partials/navbar.php'; ?>
 */

$user = $user ?? $_SESSION['user'] ?? [];
$userRole = $user['role'] ?? 'guest';
$currentPage = $currentPage ?? '';
?>

<nav class="navbar" role="navigation" aria-label="Main Navigation">
    <div class="navbar-container">
        <ul class="navbar-menu">
            <!-- Dashboard -->
            <li class="navbar-item">
                <a href="<?php echo BASE_URL; ?>/dashboard" class="navbar-link <?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>">
                    <span class="icon">📊</span>
                    <span>Dashboard</span>
                </a>
            </li>

            <!-- Projects (All Roles) -->
            <li class="navbar-item">
                <a href="<?php echo BASE_URL; ?>/projects" class="navbar-link <?php echo $currentPage === 'projects' ? 'active' : ''; ?>">
                    <span class="icon">📋</span>
                    <span>Projects</span>
                </a>
            </li>

            <!-- Equipment (Visible to Equipment Coordinators) -->
            <?php if (in_array($userRole, ['equipment_coordinator', 'admin'])): ?>
            <li class="navbar-item">
                <a href="<?php echo BASE_URL; ?>/equipment" class="navbar-link <?php echo $currentPage === 'equipment' ? 'active' : ''; ?>">
                    <span class="icon">⚙️</span>
                    <span>Equipment</span>
                </a>
            </li>
            <?php endif; ?>

            <!-- Finance (Visible to Finance Officers) -->
            <?php if (in_array($userRole, ['finance_officer', 'admin'])): ?>
            <li class="navbar-item">
                <a href="<?php echo BASE_URL; ?>/finance" class="navbar-link <?php echo $currentPage === 'finance' ? 'active' : ''; ?>">
                    <span class="icon">💰</span>
                    <span>Finance</span>
                </a>
            </li>
            <?php endif; ?>

            <!-- Contracts -->
            <li class="navbar-item">
                <a href="<?php echo BASE_URL; ?>/contracts" class="navbar-link <?php echo $currentPage === 'contracts' ? 'active' : ''; ?>">
                    <span class="icon">📜</span>
                    <span>Contracts</span>
                </a>
            </li>

            <!-- Reports -->
            <li class="navbar-item">
                <a href="<?php echo BASE_URL; ?>/reports" class="navbar-link <?php echo $currentPage === 'reports' ? 'active' : ''; ?>">
                    <span class="icon">📈</span>
                    <span>Reports</span>
                </a>
            </li>
        </ul>
    </div>
</nav>
