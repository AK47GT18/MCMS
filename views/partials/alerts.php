<?php
/**
 * Alerts Partial
 * Displays alert messages (success, error, warning, info)
 * Usage: <?php include 'partials/alerts.php'; ?>
 */
?>

<?php if (isset($_SESSION['alerts']) && !empty($_SESSION['alerts'])): ?>
<div class="alerts-container">
    <?php foreach ($_SESSION['alerts'] as $alert): ?>
    <div class="alert alert-<?php echo htmlspecialchars($alert['type']); ?> alert-dismissible fade show" role="alert">
        <div class="alert-content">
            <?php if ($alert['type'] === 'success'): ?>
                <span class="alert-icon">✓</span>
            <?php elseif ($alert['type'] === 'error'): ?>
                <span class="alert-icon">✕</span>
            <?php elseif ($alert['type'] === 'warning'): ?>
                <span class="alert-icon">⚠</span>
            <?php else: ?>
                <span class="alert-icon">ℹ</span>
            <?php endif; ?>
            
            <div class="alert-message">
                <?php if (isset($alert['title'])): ?>
                    <strong><?php echo htmlspecialchars($alert['title']); ?></strong><br>
                <?php endif; ?>
                <?php echo htmlspecialchars($alert['message']); ?>
            </div>
        </div>
        <button type="button" class="alert-close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
    <?php endforeach; ?>
</div>

<?php unset($_SESSION['alerts']); ?>
<?php endif; ?>
