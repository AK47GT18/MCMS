<?php
/**
 * Loading Modal Partial
 * Modal with loading spinner for async operations
 * Usage: <?php include 'partials/modals/loading-modal.php'; ?>
 * 
 * Variables:
 * - $loadingId (string): Unique modal ID - default 'loadingModal'
 * - $loadingTitle (string): Modal title - default 'Processing'
 * - $loadingMessage (string): Loading message
 * - $showProgress (bool): Show progress bar - default false
 * - $spinnerType (string): 'spinner', 'dots', 'pulse' - default 'spinner'
 * - $backdrop (bool): Static backdrop - default true
 */

$loadingId = $loadingId ?? 'loadingModal';
$loadingTitle = $loadingTitle ?? 'Processing';
$loadingMessage = $loadingMessage ?? 'Please wait...';
$showProgress = $showProgress ?? false;
$spinnerType = $spinnerType ?? 'spinner';
$backdrop = $backdrop ?? true;
?>

<div class="modal fade" id="<?php echo htmlspecialchars($loadingId); ?>" tabindex="-1" role="dialog" aria-labelledby="<?php echo htmlspecialchars($loadingId); ?>Label" aria-hidden="true" data-backdrop="<?php echo $backdrop ? 'static' : 'false'; ?>" data-keyboard="false">
    <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-body text-center">
                <!-- Spinner -->
                <div class="loading-spinner loading-<?php echo htmlspecialchars($spinnerType); ?>">
                    <?php if ($spinnerType === 'spinner'): ?>
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <?php elseif ($spinnerType === 'dots'): ?>
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <?php else: ?>
                    <div class="loading-pulse"></div>
                    <?php endif; ?>
                </div>

                <!-- Title -->
                <h5 class="modal-title mt-3" id="<?php echo htmlspecialchars($loadingId); ?>Label">
                    <?php echo htmlspecialchars($loadingTitle); ?>
                </h5>

                <!-- Message -->
                <p class="loading-message text-muted mt-2">
                    <?php echo htmlspecialchars($loadingMessage); ?>
                </p>

                <!-- Progress Bar (Optional) -->
                <?php if ($showProgress): ?>
                <div class="progress mt-3" style="height: 6px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
