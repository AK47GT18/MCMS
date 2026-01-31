/**
 * Form Error Utility
 * Display and clear error messages in forms
 */

/**
 * Display an error message at the top of a form
 * @param {HTMLFormElement} form - The form element
 * @param {string} message - Error message to display
 */
export function displayFormError(form, message) {
    let errorEl = form.querySelector('.form-error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'form-error-message';
        errorEl.style.cssText = `
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        form.prepend(errorEl);
    }
    errorEl.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">error</span> ${message}`;
    errorEl.style.display = 'flex';
}

/**
 * Clear error message from a form
 * @param {HTMLFormElement} form - The form element
 */
export function clearFormError(form) {
    const errorEl = form.querySelector('.form-error-message');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

/**
 * Show loading state on a button
 * @param {HTMLButtonElement} btn - The button element
 * @param {string} loadingText - Text to show while loading
 */
export function showButtonLoading(btn, loadingText = 'Loading...') {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
}

/**
 * Reset button to original state
 * @param {HTMLButtonElement} btn - The button element
 */
export function resetButton(btn) {
    btn.textContent = btn.dataset.originalText || 'Submit';
    btn.disabled = false;
}

export default {
    displayFormError,
    clearFormError,
    showButtonLoading,
    resetButton
};
