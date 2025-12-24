<?php
/**
 * Base Modal Partial
 * Generic reusable modal template
 * Usage: <?php include 'partials/modals/base-modal.php'; ?>
 * 
 * Variables:
 * - $modalId (string): Unique modal ID
 * - $modalTitle (string): Modal header title
 * - $modalSize (string): 'sm', 'md', 'lg', 'xl' - default 'md'
 * - $modalContent (string): Modal body content (HTML)
 * - $modalFooter (string): Custom footer content (optional)
 * - $modalClass (string): Additional CSS classes
 * - $backdrop (bool): Show backdrop - default true
 * - $closable (bool): Show close button - default true
 */

$modalId = $modalId ?? 'baseModal';
$modalTitle = $modalTitle ?? 'Modal';
$modalSize = $modalSize ?? 'md';
$modalContent = $modalContent ?? '';
$modalFooter = $modalFooter ?? '';
$modalClass = $modalClass ?? '';
$backdrop = $backdrop ?? true;
$closable = $closable ?? true;
?>

<div class="modal fade" id="<?php echo htmlspecialchars($modalId); ?>" tabindex="-1" role="dialog" aria-labelledby="<?php echo htmlspecialchars($modalId); ?>Label" aria-hidden="true" data-backdrop="<?php echo $backdrop ? 'true' : 'false'; ?>">
    <div class="modal-dialog modal-<?php echo htmlspecialchars($modalSize); ?> <?php echo htmlspecialchars($modalClass); ?>" role="document">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h5 class="modal-title" id="<?php echo htmlspecialchars($modalId); ?>Label">
                    <?php echo htmlspecialchars($modalTitle); ?>
                </h5>
                <?php if ($closable): ?>
                <button type="button" class="modal-close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <?php endif; ?>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
                <?php echo $modalContent; ?>
            </div>

            <!-- Modal Footer -->
            <?php if ($modalFooter): ?>
            <div class="modal-footer">
                <?php echo $modalFooter; ?>
            </div>
            <?php else: ?>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save Changes</button>
            </div>
            <?php endif; ?>
        </div>
    </div>
</div>
