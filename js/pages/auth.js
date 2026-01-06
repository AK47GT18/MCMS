
// --- AUTH & LOGIN LOGIC ---

export function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value : '';
    const btn = document.querySelector('.btn');
    
    // Simulation
    if (btn) {
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Authenticating...';
        btn.style.opacity = '0.7';
    }
    
    setTimeout(() => {
        // Mock Routing based on email hint (in real app, this is server-side)
        if(email.includes('finance')) window.location.href = 'fm.html';
        else if(email.includes('field')) window.location.href = 'fs.html';
        else if(email.includes('equip')) window.location.href = 'ec.html';
        else if(email.includes('contract')) window.location.href = 'ca.html';
        else window.location.href = 'pm.html'; // Default to PM
    }, 1000);
}

// FR-18 Logic
export function checkStrength(password) {
    let strength = 0;
    const bars = [
        document.getElementById('bar-1'), 
        document.getElementById('bar-2'), 
        document.getElementById('bar-3'), 
        document.getElementById('bar-4')
    ];
    const text = document.getElementById('strength-text');
    
    // Safety check if elements exist (in case function called elsewhere)
    if (!bars[0] || !text) return;

    if (password.length > 5) strength += 1;
    if (password.length > 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Special char bonus

    // Cap at 4
    if(strength > 4) strength = 4;

    // Reset
    bars.forEach(b => b.style.background = 'var(--slate-200)');
    
    // Colorize
    let color = 'var(--red)';
    let status = 'Weak';
    
    if(strength >= 2) { color = 'var(--orange)'; status = 'Moderate'; }
    if(strength >= 3) { color = 'var(--emerald)'; status = 'Strong'; }
    if(strength >= 4) { color = '#15803d'; status = 'Very Strong'; } // Dark green

    for(let i=0; i < strength; i++) {
        bars[i].style.background = color;
    }
    
    if(password.length === 0) {
        text.innerText = 'Enter Password';
        bars.forEach(b => b.style.background = 'var(--slate-200)');
    } else {
        text.innerText = status;
        text.style.color = color;
    }
}

// --- GLOBAL BINDINGS for HTML access ---
window.handleLogin = handleLogin;
window.checkStrength = checkStrength;

// Init Check
document.addEventListener('DOMContentLoaded', () => {
    const pwdInput = document.getElementById('passwordInput');
    if (pwdInput) {
        checkStrength(pwdInput.value);
    }
});
