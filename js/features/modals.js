/**
 * Generic Modal Service
 * Handles centered verification popups (Success, Delete, Info)
 */

export function showConfirmationModal(type, title, message, onConfirm) {
    // 1. Create Overlay if not exists
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
        
        // Add minimal CSS if not present in stylesheets
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.innerHTML = `
                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px);
                    z-index: 9999; display: none; align-items: center; justify-content: center;
                    opacity: 0; transition: opacity 0.2s ease;
                }
                .modal-overlay.show { display: flex; opacity: 1; }
                .modal-card {
                    background: white; width: 90%; max-width: 400px;
                    border-radius: 12px; padding: 24px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    transform: scale(0.95); transition: transform 0.2s ease;
                }
                .modal-overlay.show .modal-card { transform: scale(1); }
                .modal-icon {
                    width: 48px; height: 48px; border-radius: 50%; display: flex;
                    align-items: center; justify-content: center; font-size: 20px;
                    margin-bottom: 16px;
                }
                .modal-icon.success { background: #DCFCE7; color: #166534; }
                .modal-icon.delete { background: #FEE2E2; color: #991B1B; }
                .modal-icon.info { background: #DBEAFE; color: #1E40AF; }
                
                .modal-title { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }
                .modal-text { font-size: 14px; color: #64748B; margin-bottom: 24px; line-height: 1.5; }
                
                .modal-actions { display: flex; gap: 12px; }
                .modal-btn {
                    flex: 1; padding: 10px; border-radius: 6px; font-size: 14px; font-weight: 600;
                    border: 1px solid #E2E8F0; background: white; cursor: pointer;
                    transition: all 0.2s;
                }
                .modal-btn:hover { background: #F8FAFC; }
                .modal-btn.primary { border: none; color: white; }
                .modal-btn.primary.success { background: #10B981; }
                .modal-btn.primary.success:hover { background: #059669; }
                .modal-btn.primary.delete { background: #EF4444; }
                .modal-btn.primary.delete:hover { background: #DC2626; }
            `;
            document.head.appendChild(style);
        }
    }

    // 2. Determine Style
    let iconClass = 'info';
    let iconHTML = '<i class="fas fa-info"></i>';
    let btnClass = 'primary';
    
    if (type === 'success') {
        iconClass = 'success';
        iconHTML = '<i class="fas fa-check"></i>';
        btnClass = 'primary success';
    } else if (type === 'delete') {
        iconClass = 'delete';
        iconHTML = '<i class="fas fa-trash"></i>';
        btnClass = 'primary delete';
    }

    // 3. Render Content
    overlay.innerHTML = `
        <div class="modal-card">
            <div class="modal-icon ${iconClass}">
                ${iconHTML}
            </div>
            <div class="modal-title">${title}</div>
            <div class="modal-text">${message}</div>
            <div class="modal-actions">
                <button class="modal-btn" id="modal-cancel">Cancel</button>
                <button class="modal-btn ${btnClass}" id="modal-confirm">Confirm</button>
            </div>
        </div>
    `;

    // 4. Bind Events
    const close = () => {
        overlay.classList.remove('show');
        setTimeout(() => { overlay.style.display = 'none'; }, 200);
    };

    document.getElementById('modal-cancel').onclick = close;
    document.getElementById('modal-confirm').onclick = () => {
        if(onConfirm) onConfirm();
        close();
    };

    // 5. Show
    overlay.style.display = 'flex';
    // Force reflow
    overlay.offsetHeight; 
    overlay.classList.add('show');
}
