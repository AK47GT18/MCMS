<?php
/**
 * Confirmation Modal Partial
 * Reusable confirmation dialog for user actions
 * Usage: <?php include 'partials/modals/confirm-modal.php'; ?>
 * 
 * Variables:
 * - $confirmId (string): Unique modal ID
 * - $confirmTitle (string): Modal title
 * - $confirmMessage (string): Confirmation message
 * - $confirmDetails (string): Additional details (optional)
 * - $confirmBtnText (string): Primary button text - default 'Confirm'
 * - $confirmBtnClass (string): Primary button CSS class - default 'btn-danger'
 * - $cancelBtnText (string): Cancel button text - default 'Cancel'
 * - $onConfirm (string): JavaScript callback or action URL
 * - $size (string): Modal size - default 'md'
 */

$confirmId = $confirmId ?? 'confirmModal';
$confirmTitle = $confirmTitle ?? 'Confirm Action';
$confirmMessage = $confirmMessage ?? 'Are you sure?';
$confirmDetails = $confirmDetails ?? '';
$confirmBtnText = $confirmBtnText ?? 'Confirm';
$confirmBtnClass = $confirmBtnClass ?? 'btn-danger';
$cancelBtnText = $cancelBtnText ?? 'Cancel';
$onConfirm = $onConfirm ?? '';
$size = $size ?? 'md';
?>

<div class="modal fade" id="<?php echo htmlspecialchars($confirmId); ?>" tabindex="-1" role="dialog" aria-labelledby="<?php echo htmlspecialchars($confirmId); ?>Label" aria-hidden="true">
    <div class="modal-dialog modal-<?php echo htmlspecialchars($size); ?>" role="document">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h5 class="modal-title" id="<?php echo htmlspecialchars($confirmId); ?>Label">
                    ⚠️ <?php echo htmlspecialchars($confirmTitle); ?>
                </h5>
                <button type="button" class="modal-close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
                <p class="confirm-message">
                    <?php echo htmlspecialchars($confirmMessage); ?>
                </p>

                <?php if ($confirmDetails): ?>
                <div class="confirm-details">
                    <?php echo $confirmDetails; ?>
                </div>
                <?php endif; ?>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <?php echo htmlspecialchars($cancelBtnText); ?>
                </button>
                <button type="button" class="btn <?php echo htmlspecialchars($confirmBtnClass); ?>" id="confirmBtn" data-action="<?php echo htmlspecialchars($onConfirm); ?>">
                    <?php echo htmlspecialchars($confirmBtnText); ?>
                </button>
            </div>
        </div>
    </div>
</div>
