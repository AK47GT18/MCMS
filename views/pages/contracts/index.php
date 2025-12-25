<?php
/**
 * Contracts Dashboard
 */
$pageTitle = 'Contracts Management';
$currentPage = 'contracts';
?>

<?php include __DIR__ . '/../../layouts/main.php'; ?>

<div class="page-header">
    <div class="header-title">
        <h1>📜 Contract Administrator</h1>
        <p>Manage contracts, vendors, and compliance</p>
    </div>
    <div class="header-actions">
        <button class="btn btn-primary">
            <i class="fas fa-plus"></i> New Contract
        </button>
    </div>
</div>

<div class="content">
    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon bg-green-light text-green">
                <i class="fas fa-file-contract"></i>
            </div>
            <div class="stat-details">
                <h3>Active Contracts</h3>
                <p class="stat-value"><?php echo $stats['active'] ?? 0; ?></p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-red-light text-red">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="stat-details">
                <h3>Expiring Soon</h3>
                <p class="stat-value"><?php echo $stats['expiring_soon'] ?? 0; ?></p>
                <div class="stat-trend text-red">需 Action</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-orange-light text-orange">
                <i class="fas fa-pen-nib"></i>
            </div>
            <div class="stat-details">
                <h3>Pending Signatures</h3>
                <p class="stat-value"><?php echo $stats['pending_signatures'] ?? 0; ?></p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon bg-blue-light text-blue">
                <i class="fas fa-coins"></i>
            </div>
            <div class="stat-details">
                <h3>Total Value</h3>
                <p class="stat-value">MWK <?php echo number_format($stats['total_value'] ?? 0); ?></p>
            </div>
        </div>
    </div>

    <!-- Contracts Table -->
    <div class="data-card mt-4">
        <div class="card-header">
            <h3>Recent Contracts</h3>
            <div class="card-actions">
                <button class="btn btn-sm btn-outline">View All</button>
            </div>
        </div>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Project</th>
                        <th>Vendor/Client</th>
                        <th>Value</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($recent_contracts)): ?>
                        <?php foreach($recent_contracts as $c): ?>
                        <tr>
                            <td>
                                <div class="font-bold"><?php echo htmlspecialchars($c['title']); ?></div>
                                <div class="text-sm text-gray"><?php echo $c['reference_no']; ?></div>
                            </td>
                            <td><?php echo htmlspecialchars($c['project_name'] ?? 'N/A'); ?></td>
                            <td><?php echo htmlspecialchars($c['party_name']); ?></td>
                            <td>MWK <?php echo number_format($c['value']); ?></td>
                            <td><?php echo date('M d, Y', strtotime($c['end_date'])); ?></td>
                            <td>
                                <span class="status-badge status-<?php echo strtolower($c['status']); ?>">
                                    <?php echo $c['status']; ?>
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon"><i class="fas fa-eye"></i></button>
                                    <button class="btn-icon"><i class="fas fa-file-pdf"></i></button>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr><td colspan="7" class="text-center">No active contracts found</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
