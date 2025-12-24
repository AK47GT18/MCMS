/**
 * Form Validation Utilities
 */
const Validator = {
  /**
   * Validate email
   */
  email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },

  /**
   * Validate phone
   */
  phone(value) {
    const regex = /^[\d\s\-\+\(\)]+$/;
    return regex.test(value) && value.replace(/\D/g, '').length >= 9;
  },

  /**
   * Validate required field
   */
  required(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  /**
   * Validate min length
   */
  minLength(value, min) {
    return value.toString().length >= min;
  },

  /**
   * Validate max length
   */
  maxLength(value, max) {
    return value.toString().length <= max;
  },

  /**
   * Validate number
   */
  number(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  /**
   * Validate integer
   */
  integer(value) {
    return Number.isInteger(Number(value));
  },

  /**
   * Validate min value
   */
  min(value, min) {
    return Number(value) >= min;
  },

  /**
   * Validate max value
   */
  max(value, max) {
    return Number(value) <= max;
  },

  /**
   * Validate date
   */
  date(value) {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },

  /**
   * Validate form
   */
  validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;
    const errors = {};

    Object.keys(rules).forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (!field) return;

      const fieldRules = rules[fieldName];
      const value = field.value;

      fieldRules.forEach(rule => {
        const [ruleName, ruleValue] = rule.split(':');
        
        let valid = true;
        let message = '';

        switch(ruleName) {
          case 'required':
            valid = this.required(value);
            message = `${fieldName} is required`;
            break;
          case 'email':
            valid = this.email(value);
            message = `${fieldName} must be a valid email`;
            break;
          case 'phone':
            valid = this.phone(value);
            message = `${fieldName} must be a valid phone number`;
            break;
          case 'min':
            valid = this.min(value, ruleValue);
            message = `${fieldName} must be at least ${ruleValue}`;
            break;
          case 'max':
            valid = this.max(value, ruleValue);
            message = `${fieldName} must be at most ${ruleValue}`;
            break;
          case 'minLength':
            valid = this.minLength(value, ruleValue);
            message = `${fieldName} must be at least ${ruleValue} characters`;
            break;
        }

        if (!valid) {
          isValid = false;
          errors[fieldName] = message;
          
          // Add error class
          field.classList.add('is-invalid');
          
          // Show error message
          let errorEl = field.nextElementSibling;
          if (!errorEl || !errorEl.classList.contains('invalid-feedback')) {
            errorEl = document.createElement('div');
            errorEl.className = 'invalid-feedback';
            field.parentNode.insertBefore(errorEl, field.nextSibling);
          }
          errorEl.textContent = message;
        } else {
          field.classList.remove('is-invalid');
          const errorEl = field.nextElementSibling;
          if (errorEl && errorEl.classList.contains('invalid-feedback')) {
            errorEl.remove();
          }
        }
      });
    });

    return { isValid, errors };
  }
};