export class DrawerManager {
    constructor() {
        this.drawerElement = null;
        this.overlayElement = null;
        this.contentContainer = null;
        this.headerTitle = null;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        // Create Drawer DOM structure if not exists
        if (!document.getElementById('global-drawer')) {
            const drawerHTML = `
                <div id="drawer-overlay" class="drawer-overlay"></div>
                <div id="global-drawer" class="drawer-panel">
                    <div class="drawer-header">
                        <h2 id="drawer-title" class="drawer-title">Details</h2>
                        <div id="drawer-close" class="drawer-close">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div id="drawer-content" class="drawer-content">
                        <!-- Content injected here -->
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', drawerHTML);
        }

        this.drawerElement = document.getElementById('global-drawer');
        this.overlayElement = document.getElementById('drawer-overlay');
        this.contentContainer = document.getElementById('drawer-content');
        this.headerTitle = document.getElementById('drawer-title');
        
        document.getElementById('drawer-close').addEventListener('click', () => this.close());
        this.overlayElement.addEventListener('click', () => this.close());
    }

    open(title, contentHTML) {
        this.isOpen = true;
        this.headerTitle.textContent = title;
        this.contentContainer.innerHTML = contentHTML;
        
        // Show visibility first (via class) which triggers styles
        requestAnimationFrame(() => {
            this.overlayElement.classList.add('show');
            this.drawerElement.classList.add('show');
        });
    }

    close() {
        this.isOpen = false;
        
        this.overlayElement.classList.remove('show');
        this.drawerElement.classList.remove('show');
        
        // Clear content after animation to prevent flickering
        setTimeout(() => {
            if (!this.isOpen) this.contentContainer.innerHTML = '';
        }, 350); // Matches CSS transition duration
    }
}

export const drawer = new DrawerManager();
window.drawer = drawer; // Expose globally for easy access
