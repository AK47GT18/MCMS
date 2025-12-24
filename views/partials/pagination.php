<?php
/**
 * Pagination Partial
 * Displays pagination controls for data tables
 * Usage: <?php include 'partials/pagination.php'; ?>
 * Required: $currentPage, $totalPages, $baseUrl
 */

$currentPage = $currentPage ?? 1;
$totalPages = $totalPages ?? 1;
$baseUrl = $baseUrl ?? '';
$queryParams = $queryParams ?? [];

if ($totalPages <= 1) {
    return;
}

$startPage = max(1, $currentPage - 2);
$endPage = min($totalPages, $currentPage + 2);
?>

<nav class="pagination-nav" aria-label="Pagination">
    <ul class="pagination">
        <!-- Previous Button -->
        <li class="pagination-item">
            <?php if ($currentPage > 1): ?>
                <a href="<?php echo $baseUrl . '?page=1' . ($queryParams ? '&' . http_build_query($queryParams) : ''); ?>" class="pagination-link" title="First Page">
                    <span class="icon">«</span>
                </a>
            <?php else: ?>
                <span class="pagination-link disabled" aria-disabled="true">
                    <span class="icon">«</span>
                </span>
            <?php endif; ?>
        </li>

        <li class="pagination-item">
            <?php if ($currentPage > 1): ?>
                <a href="<?php echo $baseUrl . '?page=' . ($currentPage - 1) . ($queryParams ? '&' . http_build_query($queryParams) : ''); ?>" class="pagination-link" title="Previous Page">
                    <span class="icon">‹</span>
                </a>
            <?php else: ?>
                <span class="pagination-link disabled" aria-disabled="true">
                    <span class="icon">‹</span>
                </span>
            <?php endif; ?>
        </li>

        <!-- Page Numbers -->
        <?php if ($startPage > 1): ?>
            <li class="pagination-item">
                <span class="pagination-ellipsis">...</span>
            </li>
        <?php endif; ?>

        <?php for ($i = $startPage; $i <= $endPage; $i++): ?>
            <li class="pagination-item">
                <?php if ($i === $currentPage): ?>
                    <span class="pagination-link active" aria-current="page">
                        <?php echo $i; ?>
                    </span>
                <?php else: ?>
                    <a href="<?php echo $baseUrl . '?page=' . $i . ($queryParams ? '&' . http_build_query($queryParams) : ''); ?>" class="pagination-link">
                        <?php echo $i; ?>
                    </a>
                <?php endif; ?>
            </li>
        <?php endfor; ?>

        <?php if ($endPage < $totalPages): ?>
            <li class="pagination-item">
                <span class="pagination-ellipsis">...</span>
            </li>
        <?php endif; ?>

        <!-- Next Button -->
        <li class="pagination-item">
            <?php if ($currentPage < $totalPages): ?>
                <a href="<?php echo $baseUrl . '?page=' . ($currentPage + 1) . ($queryParams ? '&' . http_build_query($queryParams) : ''); ?>" class="pagination-link" title="Next Page">
                    <span class="icon">›</span>
                </a>
            <?php else: ?>
                <span class="pagination-link disabled" aria-disabled="true">
                    <span class="icon">›</span>
                </span>
            <?php endif; ?>
        </li>

        <li class="pagination-item">
            <?php if ($currentPage < $totalPages): ?>
                <a href="<?php echo $baseUrl . '?page=' . $totalPages . ($queryParams ? '&' . http_build_query($queryParams) : ''); ?>" class="pagination-link" title="Last Page">
                    <span class="icon">»</span>
                </a>
            <?php else: ?>
                <span class="pagination-link disabled" aria-disabled="true">
                    <span class="icon">»</span>
                </span>
            <?php endif; ?>
        </li>
    </ul>

    <!-- Page Info -->
    <div class="pagination-info">
        <p>Page <strong><?php echo $currentPage; ?></strong> of <strong><?php echo $totalPages; ?></strong></p>
    </div>
</nav>
