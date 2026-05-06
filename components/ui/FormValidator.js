/**
 * MCMS Inline Form Validation Utility
 * Provides regex-based inline validation with real-time feedback.
 * 
 * Usage:
 *   window.V.attach('#my-input', 'required|minLen:3|alpha');
 *   window.V.validateForm('#my-form');           // returns true/false
 *   window.V.checkField(inputEl);                // validate single field
 */

// ────────────────────────────────────────────
// Regex patterns
// ────────────────────────────────────────────
const RX = {
    email:    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    phone:    /^(\+?\d{1,3}[\s-]?)?\d{7,15}$/,
    alpha:    /^[A-Za-z\s'-]+$/,
    alphaNum: /^[A-Za-z0-9\s\-_.]+$/,
    numeric:  /^\d+(\.\d+)?$/,
    integer:  /^\d+$/,
    currency: /^\d{1,3}(,?\d{3})*(\.\d{1,2})?$/,
    date:     /^\d{4}-\d{2}-\d{2}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    noSpecial:/^[A-Za-z0-9\s]+$/,
    url:      /^https?:\/\/.+/,
    mwkCode:  /^[A-Z]{2,4}-\d{2,4}$/,            // e.g. CEN-01
    hasLetters: /[a-zA-Z]/,
};

// ────────────────────────────────────────────
// Rule messages (user-friendly)
// ────────────────────────────────────────────
const MSGS = {
    required:  'This field is required',
    minLen:    (n) => `Must be at least ${n} characters`,
    maxLen:    (n) => `Cannot exceed ${n} characters`,
    min:       (n) => `Minimum value is ${n}`,
    max:       (n) => `Maximum value is ${n}`,
    email:     'Enter a valid email address',
    phone:     'Enter a valid phone number',
    alpha:     'Only letters and spaces allowed',
    alphaNum:  'Only letters, numbers allowed',
    numeric:   'Enter a valid number',
    integer:   'Enter a whole number',
    currency:  'Enter a valid amount (e.g. 50,000.00)',
    date:      'Enter a valid date',
    password:  'Min 8 chars with uppercase, lowercase & number',
    noSpecial: 'Special characters not allowed',
    url:       'Enter a valid URL',
    mwkCode:   'Format: ABC-01',
    match:     (label) => `Does not match ${label}`,
    select:    'Please select an option',
    minWords:  (n) => `Enter at least ${n} words`,
    futureDate:'Date must be in the future',
    hasLetters:'Must contain at least one letter',
};

// ────────────────────────────────────────────
// Core engine
// ────────────────────────────────────────────

/** Clear any existing validation message beside an input */
function clearMsg(el) {
    el.classList.remove('v-error', 'v-ok');
    const existing = el.parentElement?.querySelector('.v-msg');
    if (existing) existing.remove();
}

/** Show an error beside an input */
function showErr(el, msg) {
    clearMsg(el);
    el.classList.add('v-error');
    const span = document.createElement('div');
    span.className = 'v-msg v-msg-err';
    span.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${msg}`;
    el.insertAdjacentElement('afterend', span);
}

/** Show success state */
function showOk(el) {
    clearMsg(el);
    el.classList.add('v-ok');
}

/** Evaluate a single rule against a value */
function evalRule(rule, val, el) {
    const [name, param] = rule.split(':');

    switch (name) {
        case 'required':
            if (el?.tagName === 'SELECT') return val && val !== '' && !val.startsWith('Select') && !val.startsWith('Loading');
            return val.trim().length > 0;
        case 'minLen':
            return val.length >= Number(param);
        case 'maxLen':
            return val.length <= Number(param);
        case 'min':
            return Number(val) >= Number(param);
        case 'max':
            return Number(val) <= Number(param);
        case 'minWords':
            return val.trim().split(/\s+/).filter(Boolean).length >= Number(param);
        case 'select':
            return val && val !== '' && !val.startsWith('Select') && !val.startsWith('Loading') && !val.startsWith('--');
        case 'futureDate': {
            if (!val) return false;
            const d = new Date(val);
            const today = new Date();
            today.setHours(0,0,0,0);
            return d >= today;
        }
        case 'match': {
            const target = document.getElementById(param);
            return target && val === target.value;
        }
        default:
            // Regex-based rules
            if (RX[name]) return RX[name].test(val);
            return true;
    }
}

/** Get user-friendly message for a rule */
function ruleMsg(rule) {
    const [name, param] = rule.split(':');
    const fn = MSGS[name];
    if (typeof fn === 'function') return fn(param);
    return fn || 'Invalid value';
}

/** Validate a single field; returns true if valid */
function checkField(el) {
    const rules = (el.dataset.vrules || '').split('|').filter(Boolean);
    if (rules.length === 0) { clearMsg(el); return true; }

    const val = el.value ?? '';

    // Skip validation if field isn't required and is empty
    if (!rules.includes('required') && val.trim() === '') {
        clearMsg(el);
        return true;
    }

    for (const rule of rules) {
        if (!evalRule(rule, val, el)) {
            showErr(el, ruleMsg(rule));
            return false;
        }
    }
    showOk(el);
    return true;
}

/**
 * Attach live validation to a single input.
 * @param {string|Element} selector  CSS selector or DOM element
 * @param {string} rules             Pipe-delimited rules, e.g. 'required|minLen:3|alpha'
 */
function attach(selector, rules) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;

    el.dataset.vrules = rules;

    // Debounced live check on input
    let t;
    const handler = () => { clearTimeout(t); t = setTimeout(() => checkField(el), 350); };

    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
    el.addEventListener('blur', () => checkField(el));
}

/**
 * Bulk-attach rules to many fields.
 * @param {Object} map  { '#selector': 'rules', ... }
 */
function attachAll(map) {
    for (const [sel, rules] of Object.entries(map)) {
        attach(sel, rules);
    }
}

/**
 * Validate every [data-vrules] input inside a container.
 * @param {string|Element} container  CSS selector or DOM element
 * @returns {boolean} true if ALL fields pass
 */
function validateForm(container) {
    const root = typeof container === 'string' ? document.querySelector(container) : (container || document);
    if (!root) return false;

    const fields = root.querySelectorAll('[data-vrules]');
    let allOk = true;
    let firstBad = null;

    fields.forEach(el => {
        if (!checkField(el)) {
            allOk = false;
            if (!firstBad) firstBad = el;
        }
    });

    if (!allOk && firstBad) {
        // Shake the submit button
        const btn = root.querySelector('.btn-primary, .btn-action');
        if (btn) {
            btn.classList.add('v-shake');
            setTimeout(() => btn.classList.remove('v-shake'), 500);
        }
        // Scroll first error into view
        firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstBad.focus();
    }

    return allOk;
}

/**
 * Password strength checker.
 * Updates a strength bar + label beside the input.
 * @param {HTMLInputElement} el  Password input element
 */
function checkPasswordStrength(el) {
    const val = el.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
        { min: 0, cls: '',         label: '' },
        { min: 1, cls: 'pw-weak',  label: 'Weak' },
        { min: 3, cls: 'pw-fair',  label: 'Fair' },
        { min: 4, cls: 'pw-good',  label: 'Good' },
        { min: 5, cls: 'pw-strong', label: 'Strong' },
    ];

    let level = levels[0];
    for (const l of levels) { if (score >= l.min) level = l; }

    // Find or create strength bar
    let bar = el.parentElement?.querySelector('.v-pw-bar');
    let label = el.parentElement?.querySelector('.v-pw-label');

    if (!bar && val.length > 0) {
        bar = document.createElement('div');
        bar.className = 'v-pw-bar';
        bar.innerHTML = '<div class="v-pw-fill"></div>';
        el.insertAdjacentElement('afterend', bar);

        label = document.createElement('div');
        label.className = 'v-pw-label';
        bar.insertAdjacentElement('afterend', label);
    }

    if (bar) {
        const fill = bar.querySelector('.v-pw-fill');
        fill.className = 'v-pw-fill ' + level.cls;
    }
    if (label) {
        label.textContent = level.label;
        label.style.color = level.cls === 'pw-weak' ? 'var(--red)'
                          : level.cls === 'pw-fair' ? 'var(--amber)'
                          : level.cls === 'pw-good' ? 'var(--blue)'
                          : level.cls === 'pw-strong' ? 'var(--emerald)'
                          : 'var(--slate-400)';
    }
}

/**
 * Add a character counter below a textarea.
 * @param {string} id        Element ID
 * @param {number} minChars  Minimum required
 * @param {number} maxChars  Maximum allowed (0 = no max)
 */
function charCounter(id, minChars = 0, maxChars = 0) {
    const el = document.getElementById(id);
    if (!el) return;

    let helper = el.parentElement?.querySelector('.v-helper');
    if (!helper) {
        helper = document.createElement('div');
        helper.className = 'v-helper';
        el.insertAdjacentElement('afterend', helper);
    }

    const update = () => {
        const len = el.value.length;
        const minLabel = minChars > 0 ? `min ${minChars}` : '';
        const maxLabel = maxChars > 0 ? `max ${maxChars}` : '';
        const range = [minLabel, maxLabel].filter(Boolean).join(' / ');
        const ok = (minChars === 0 || len >= minChars) && (maxChars === 0 || len <= maxChars);
        helper.innerHTML = `<span style="color: ${ok ? 'var(--emerald)' : 'var(--slate-400)'}">${len} chars</span><span>${range}</span>`;
    };

    el.addEventListener('input', update);
    update();
}

// ────────────────────────────────────────────
// Export as global
// ────────────────────────────────────────────
const V = {
    attach,
    attachAll,
    checkField,
    validateField: checkField, // Alias for template consistency
    validateForm,
    checkPasswordStrength,
    charCounter,
    clearMsg,
    showErr,
    showOk,
    attachListeners: (container) => {
        const root = typeof container === 'string' ? document.querySelector(container) : (container || document);
        if (!root) return;
        const fields = root.querySelectorAll('[data-vrules]');
        fields.forEach(el => attach(el, el.dataset.vrules));
    },
    RX,
};

export default V;
