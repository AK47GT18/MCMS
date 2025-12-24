<div id="<?php echo isset($modalId) ? htmlspecialchars($modalId) : 'generic-modal'; ?>" class="modal" style="display: none;">
    <div class="modal-content <?php echo isset($modalSize) ? htmlspecialchars($modalSize) : 'medium'; ?>">
        <div class="modal-header">
            <h2 class="modal-title"><?php echo isset($modalTitle) ? htmlspecialchars($modalTitle) : 'Modal'; ?></h2>
            <button class="modal-close" onclick="ModalManager.closeModal('<?php echo isset($modalId) ? htmlspecialchars($modalId) : 'generic-modal'; ?>')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <?php echo isset($modalContent) ? $modalContent : ''; ?>
        </div>
        <?php if (isset($modalFooter)): ?>
        <div class="modal-footer">
            <?php echo $modalFooter; ?>
        </div>
        <?php endif; ?>
    </div>
</div>
