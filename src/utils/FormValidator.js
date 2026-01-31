/**
 * MCMS Component - Form Validator
 * Handles inline form validation with regex patterns and accessibility support.
 */

export class FormValidator {
    constructor(form, options = {}) {
        this.form = form;
        this.options = {
            validateOnInput: true,
            validateOnBlur: true,
            errorClass: 'input-error',
            messageClass: 'error-message',
            ...options
        };

        // Memoize selectors
        this.inputs = Array.from(this.form.querySelectorAll('input, select, textarea'));
        this.submitButton = this.form.querySelector('button[type="submit"]');

        // Regex Patterns
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\d\s\+\-\(\)]{10,}$/, // Min 10 chars, allows format chars
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, // 8+ chars, 1 upper, 1 lower, 1 num
            required: /\S+/, // Non-empty
            url: /^https?:\/\/.+/,
            number: /^\d+$/,
        };

        this.init();
    }

    init() {
        // Disable native validation
        this.form.setAttribute('novalidate', 'true');

        this.inputs.forEach(input => {
            if (this.options.validateOnBlur) {
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                    if (input.type === 'password') this.checkPasswordStrength(input);
                });
            }
            if (this.options.validateOnInput) {
                // Debounced input handler
                const debouncedValidate = this.debounce(() => {
                    if (input.classList.contains(this.options.errorClass) || input.type === 'password') {
                        this.validateInput(input);
                    }
                    if (input.type === 'password') {
                        this.checkPasswordStrength(input);
                    }
                }, 300);

                input.addEventListener('input', debouncedValidate);
            }
        });

        // Optional: Attach to submit if not handled externally
        // this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    /**
     * Validate a single input
     * @param {HTMLElement} input 
     * @returns {boolean} isValid
     */
    validateInput(input) {
        const value = input.value.trim();
        const type = input.dataset.validate || input.type; // Use data-validate or fallback to type
        const isRequired = input.hasAttribute('required');
        
        let isValid = true;
        let message = '';

        // 1. Check Required
        if (isRequired && !this.patterns.required.test(value)) {
            isValid = false;
            message = 'This field is required.';
        } 
        // 2. Check Pattern (if not empty)
        else if (value && this.patterns[type]) {
            if (!this.patterns[type].test(value)) {
                isValid = false;
                message = this.getErrorMessage(type);
            }
        }
        // 3. Custom Match (e.g. Confirm Password)
        else if (input.dataset.match) {
            const target = this.form.querySelector(`#${input.dataset.match}`);
            if (target && value !== target.value) {
                isValid = false;
                message = 'Passwords do not match.';
            }
        }

        if (isValid) {
            this.clearError(input);
        } else {
            this.showError(input, message);
        }

        return isValid;
    }

    /**
     * Validate all fields
     * @returns {boolean} isFormValid
     */
    validate() {
        let isFormValid = true;
        this.inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isFormValid = false;
            }
        });
        return isFormValid;
    }

    showError(input, message) {
        input.classList.add(this.options.errorClass);
        input.setAttribute('aria-invalid', 'true');
        
        // Find or create error message element
        let errorEl = input.nextElementSibling;
        if (!errorEl || !errorEl.classList.contains(this.options.messageClass)) {
            errorEl = document.createElement('span');
            errorEl.className = this.options.messageClass;
            // A11y: Link error to input
            const errorId = `${input.id || input.name}-error`;
            errorEl.id = errorId;
            input.setAttribute('aria-describedby', errorId);
            input.parentNode.insertBefore(errorEl, input.nextSibling);
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    clearError(input) {
        input.classList.remove(this.options.errorClass);
        input.setAttribute('aria-invalid', 'false');
        
        const errorEl = input.nextElementSibling;
        if (errorEl && errorEl.classList.contains(this.options.messageClass)) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    getErrorMessage(type) {
        const messages = {
            email: 'Please enter a valid email address.',
            password: 'Must be 8+ chars with uppercase, lowercase, and number.',
            phone: 'Please enter a valid phone number (min 10 digits).',
            url: 'Please enter a valid URL (http/https).',
            number: 'Please enter a valid number.',
        };
        return messages[type] || 'Invalid format.';
    }
    
    /**
     * Get form data as object
     */
    getData() {
        const formData = new FormData(this.form);
        return Object.fromEntries(formData.entries());
    }

    /**
     * Debounce helper
     * @param {Function} func 
     * @param {number} wait 
     */
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * Check password strength and update UI
     * @param {HTMLElement} input 
     */
    checkPasswordStrength(input) {
        const value = input.value;
        let strength = 0;
        
        if (value.length > 8) strength++; // Length
        if (/[A-Z]/.test(value)) strength++; // Uppercase
        if (/[0-9]/.test(value)) strength++; // Number
        if (/[^a-zA-Z0-9]/.test(value)) strength++; // Special Char

        // Find or create strength meter
        let meter = input.nextElementSibling;
        if (meter && meter.classList.contains(this.options.messageClass)) {
            // Skip the error message element
            meter = meter.nextElementSibling;
        }

        if (!meter || !meter.classList.contains('password-strength-meter')) {
            meter = document.createElement('div');
            meter.className = 'password-strength-meter';
            meter.style.height = '4px';
            meter.style.marginTop = '4px';
            meter.style.borderRadius = '2px';
            meter.style.transition = 'width 0.3s, background 0.3s';
            
            // Insert after error message if it exists, or after input
            const ref = input.nextElementSibling;
            if (ref && ref.classList.contains(this.options.messageClass)) {
                ref.insertAdjacentElement('afterend', meter);
            } else {
                input.insertAdjacentElement('afterend', meter);
            }
        }

        // Update UI
        const colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']; // Gray, Red, Orange, Blue, Green
        const width = Math.min((strength + 1) * 20, 100);
        
        if (value.length === 0) {
            meter.style.width = '0%';
            meter.style.background = 'transparent';
        } else {
            meter.style.width = `${width}%`;
            meter.style.background = colors[strength];
        }
    }

    /**
     * Simulate async validation (e.g., check email availability)
     * @param {HTMLElement} input 
     */
    async validateAsync(input) {
        const type = input.dataset.validate || input.type;
        if (type === 'email' && input.value) {
            // Simulated API call
            return new Promise(resolve => {
                setTimeout(() => {
                    const isTaken = input.value.includes('taken'); // Mock logic
                    if (isTaken) {
                        this.showError(input, 'This email is already registered.');
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }, 500);
            });
        }
        return true;
    }
}
