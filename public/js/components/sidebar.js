/**
 * Sidebar Component
 * Handles sidebar toggle, navigation, and responsive behavior
 */

const SidebarComponent = (() => {
    const selectors = {
        sidebar: '#sidebar',
        toggle: '#sidebarToggle',
        close: '#sidebarClose',
        overlay: '.sidebar-overlay',
        navLink: '.nav-link',
        navSection: '.nav-section',
        content: '.sidebar-content'
    };

    let isOpen = false;

    /**
     * Initialize sidebar component
     */
    const init = () => {
        setupEventListeners();
        handleResponsive();
        setupNavigation();
    };

    /**
     * Setup event listeners
     */
    const setupEventListeners = () => {
        // Toggle button
        const toggle = document.querySelector(selectors.toggle);
        if (toggle) {
            toggle.addEventListener('click', () => toggleSidebar());
        }

        // Close button
        const close = document.querySelector(selectors.close);
        if (close) {
            close.addEventListener('click', () => closeSidebar());
        }

        // Overlay click
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector(selectors.sidebar);
            if (sidebar && sidebar.classList.contains('open')) {
                if (e.target.classList.contains('sidebar-overlay') || 
                    (!sidebar.contains(e.target) && !e.target.closest(selectors.toggle))) {
                    closeSidebar();
                }
            }
        });

        // Window resize
        window.addEventListener('resize', handleResponsive);

        // Close on link click (mobile)
        document.addEventListener('click', (e) => {
            const link = e.target.closest(selectors.navLink);
            if (link && window.innerWidth < 768) {
                closeSidebar();
            }
        });
    };

    /**
     * Toggle sidebar
     */
    const toggleSidebar = () => {
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    };

    /**
     * Open sidebar
     */
    const openSidebar = () => {
        const sidebar = document.querySelector(selectors.sidebar);
        if (!sidebar) return;

        sidebar.classList.add('open');
        isOpen = true;

        // Add overlay
        if (window.innerWidth < 768) {
            createOverlay();
        }
    };

    /**
     * Close sidebar
     */
    const closeSidebar = () => {
        const sidebar = document.querySelector(selectors.sidebar);
        if (!sidebar) return;

        sidebar.classList.remove('open');
        isOpen = false;

        // Remove overlay
        const overlay = document.querySelector(selectors.overlay);
        if (overlay) overlay.remove();
    };

    /**
     * Create overlay for mobile
     */
    const createOverlay = () => {
        let overlay = document.querySelector(selectors.overlay);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
    };

    /**
     * Setup navigation
     */
    const setupNavigation = () => {
        document.querySelectorAll(selectors.navLink).forEach((link) => {
            link.addEventListener('click', (e) => {
                setActiveLink(link);
            });
        });

        // Highlight current page
        highlightCurrentPage();
    };

    /**
     * Set active navigation link
     */
    const setActiveLink = (link) => {
        document.querySelectorAll(selectors.navLink).forEach((l) => {
            l.classList.remove('active');
        });
        link.classList.add('active');
    };

    /**
     * Highlight current page
     */
    const highlightCurrentPage = () => {
        const currentPath = window.location.pathname;
        document.querySelectorAll(selectors.navLink).forEach((link) => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.replace(window.location.origin, ''))) {
                link.classList.add('active');
            }
        });
    };

    /**
     * Handle responsive behavior
     */
    const handleResponsive = () => {
        const width = window.innerWidth;
        const sidebar = document.querySelector(selectors.sidebar);

        if (width >= 768) {
            // Desktop: keep sidebar open
            if (sidebar) sidebar.classList.remove('mobile');
            closeSidebar();
        } else {
            // Mobile: collapse sidebar
            if (sidebar) sidebar.classList.add('mobile');
        }
    };

    /**
     * Toggle navigation section
     */
    const toggleSection = (sectionTitle) => {
        const sections = document.querySelectorAll(selectors.navSection);
        sections.forEach((section) => {
            const title = section.querySelector('.nav-section-title');
            if (title && title.textContent === sectionTitle) {
                section.classList.toggle('expanded');
            }
        });
    };

    /**
     * Expand all sections
     */
    const expandAll = () => {
        document.querySelectorAll(selectors.navSection).forEach((section) => {
            section.classList.add('expanded');
        });
    };

    /**
     * Collapse all sections
     */
    const collapseAll = () => {
        document.querySelectorAll(selectors.navSection).forEach((section) => {
            section.classList.remove('expanded');
        });
    };

    return {
        init,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        toggleSection,
        expandAll,
        collapseAll,
        setActiveLink,
        highlightCurrentPage
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SidebarComponent.init());
} else {
    SidebarComponent.init();
}
