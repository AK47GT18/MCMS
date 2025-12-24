<?php
/**
 * Breadcrumb Partial
 * Displays breadcrumb navigation trail
 * Usage: <?php include 'partials/breadcrumb.php'; ?>
 */

$breadcrumbs = $breadcrumbs ?? [];
$currentPage = $currentPage ?? 'Dashboard';
?>

<?php if (!empty($breadcrumbs) || $currentPage !== 'Dashboard'): ?>
<nav class="breadcrumb-nav" aria-label="breadcrumb">
    <ol class="breadcrumb">
        <li class="breadcrumb-item">
            <a href="<?php echo BASE_URL; ?>/dashboard" class="breadcrumb-link">
                <span class="icon">🏠</span>
                <span>Home</span>
            </a>
        </li>
        
        <?php foreach ($breadcrumbs as $index => $breadcrumb): ?>
            <li class="breadcrumb-item <?php echo $index === count($breadcrumbs) - 1 ? 'active' : ''; ?>">
                <?php if (isset($breadcrumb['url'])): ?>
                    <a href="<?php echo htmlspecialchars($breadcrumb['url']); ?>" class="breadcrumb-link">
                        <?php if (isset($breadcrumb['icon'])): ?>
                            <span class="icon"><?php echo htmlspecialchars($breadcrumb['icon']); ?></span>
                        <?php endif; ?>
                        <span><?php echo htmlspecialchars($breadcrumb['name']); ?></span>
                    </a>
                <?php else: ?>
                    <?php if (isset($breadcrumb['icon'])): ?>
                        <span class="icon"><?php echo htmlspecialchars($breadcrumb['icon']); ?></span>
                    <?php endif; ?>
                    <span><?php echo htmlspecialchars($breadcrumb['name']); ?></span>
                <?php endif; ?>
            </li>
        <?php endforeach; ?>

        <?php if ($currentPage !== 'Dashboard'): ?>
        <li class="breadcrumb-item active">
            <span><?php echo htmlspecialchars($currentPage); ?></span>
        </li>
        <?php endif; ?>
    </ol>
</nav>
<?php endif; ?>
