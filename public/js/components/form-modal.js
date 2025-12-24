/**
 * Form Modal Component
 * Handles form submission within modals
 */

const FormModalComponent = (() => {
    const selectors = {
        modal: '.modal',
        form: '.modal-form',
        submitBtn: '.modal-submit',
        inputs: 'input, textarea, select'
    };

    /**
     * Initialize form modal component
     */
    const init = () => {
        setupEventListeners();
    };

    /**
     * Setup event listeners
     */
    const setupEventListeners = () => {
        // Form submission
        document.addEventListener('submit', (e) => {
            const form = e.target.closest(selectors.form);
            if (form) {
                handleSubmit(e, form);
            }
        });

        // Auto-save on input change (optional)
        document.addEventListener('change', (e) => {
            const input = e.target.closest(selectors.inputs);
            if (input) {
                const modal = input.closest(selectors.modal);
                if (modal) {
                    validateField(input);
                }
            }
        });
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e, form) => {
        e.preventDefault();

        // Validate form
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // Show loading
        const modal = form.closest(selectors.modal);
        const submitBtn = form.querySelector(selectors.submitBtn);
        const originalText = submitBtn?.textContent;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
        }

        try {
            // Get form data
            const formData = new FormData(form);
            const action = form.getAttribute('action');
            const method = form.getAttribute('method') || 'POST';

            // Submit form
            const response = await fetch(action, {
                method: method,
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (result.success) {
                // Show success message
                if (AlertsComponent) {
                    AlertsComponent.success(result.message || 'Form submitted successfully');
                }

                // Close modal
                if (modal && ModalManager) {
                    ModalManager.hide(modal.id);
                }

                // Trigger callback
                if (result.callback && typeof window[result.callback] === 'function') {
                    window[result.callback](result);
                }

                // Reset form
                form.reset();
                form.classList.remove('was-validated');
            } else {
                // Show error
                if (AlertsComponent) {
                    AlertsComponent.error(result.message || 'Form submission failed');
                }

                // Show field errors
                if (result.errors && typeof result.errors === 'object') {
                    Object.keys(result.errors).forEach((field) => {
                        showFieldError(form, field, result.errors[field]);
                    });
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            if (AlertsComponent) {
                AlertsComponent.error('An error occurred while submitting the form');
            }
        } finally {
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    };

    /**
     * Validate field
     */
    const validateField = (input) => {
        const isValid = input.checkValidity();
        const formGroup = input.closest('.form-group');

        if (formGroup) {
            if (isValid) {
                formGroup.classList.remove('has-error');
                const errorMsg = formGroup.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            } else {
                formGroup.classList.add('has-error');
            }
        }
    };

    /**
     * Show field-specific error
     */
    const showFieldError = (form, fieldName, errorMessage) => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');

            let errorMsg = formGroup.querySelector('.error-message');
            if (!errorMsg) {
                errorMsg = document.createElement('span');
                errorMsg.className = 'error-message';
                formGroup.appendChild(errorMsg);
            }
            errorMsg.textContent = errorMessage;
        }
    };

    /**
     * Clear form errors
     */
    const clearErrors = (form) => {
        form.querySelectorAll('.form-group.has-error').forEach((group) => {
            group.classList.remove('has-error');
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });
    };

    /**
     * Populate form from data
     */
    const populateForm = (form, data) => {
        Object.keys(data).forEach((key) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    };

    /**
     * Reset form to initial state
     */
    const resetForm = (form) => {
        form.reset();
        clearErrors(form);
        form.classList.remove('was-validated');
    };

    return {
        init,
        handleSubmit,
        validateField,
        showFieldError,
        clearErrors,
        populateForm,
        resetForm
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FormModalComponent.init());
} else {
    FormModalComponent.init();
}
