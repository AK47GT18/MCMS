/**
 * Navbar Component
 * Handles navbar interactions and mobile menu
 */

const NavbarComponent = (() => {
    const selectors = {
        navbar: '.navbar',
        menu: '.navbar-menu',
        item: '.navbar-item',
        link: '.navbar-link',
        toggle: '.navbar-toggle'
    };

    /**
     * Initialize navbar component
     */
    const init = () => {
        setupEventListeners();
        handleResponsive();
    };

    /**
     * Setup event listeners
     */
    const setupEventListeners = () => {
        // Active link highlighting
        document.addEventListener('click', (e) => {
            const link = e.target.closest(selectors.link);
            if (link) {
                setActiveLink(link);
            }
        });

        // Window resize for responsive
        window.addEventListener('resize', handleResponsive);
    };

    /**
     * Set active navbar link
     */
    const setActiveLink = (link) => {
        const navbar = link.closest(selectors.navbar);
        if (!navbar) return;

        navbar.querySelectorAll(selectors.link).forEach((l) => {
            l.classList.remove('active');
        });
        link.classList.add('active');
    };

    /**
     * Handle responsive navbar
     */
    const handleResponsive = () => {
        const navbar = document.querySelector(selectors.navbar);
        if (!navbar) return;

        const width = window.innerWidth;
        
        if (width < 768) {
            navbar.classList.add('mobile');
        } else {
            navbar.classList.remove('mobile');
        }
    };

    /**
     * Highlight current page
     */
    const setCurrentPage = (pageName) => {
        const links = document.querySelectorAll(selectors.link);
        links.forEach((link) => {
            link.classList.remove('active');
            if (link.textContent.toLowerCase().includes(pageName.toLowerCase())) {
                link.classList.add('active');
            }
        });
    };

    /**
     * Toggle mobile menu
     */
    const toggleMenu = () => {
        const navbar = document.querySelector(selectors.navbar);
        if (!navbar) return;
        navbar.classList.toggle('open');
    };

    /**
     * Close mobile menu
     */
    const closeMenu = () => {
        const navbar = document.querySelector(selectors.navbar);
        if (navbar) navbar.classList.remove('open');
    };

    return {
        init,
        setActiveLink,
        setCurrentPage,
        toggleMenu,
        closeMenu,
        handleResponsive
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NavbarComponent.init());
} else {
    NavbarComponent.init();
}
