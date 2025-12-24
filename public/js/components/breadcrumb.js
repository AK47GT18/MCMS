/**
 * Breadcrumb Component
 * Handles breadcrumb navigation and updates
 */

const BreadcrumbComponent = (() => {
    const selectors = {
        nav: '.breadcrumb-nav',
        breadcrumb: '.breadcrumb',
        item: '.breadcrumb-item',
        link: '.breadcrumb-link'
    };

    /**
     * Initialize breadcrumb component
     */
    const init = () => {
        setupEventListeners();
    };

    /**
     * Setup event listeners
     */
    const setupEventListeners = () => {
        document.addEventListener('click', (e) => {
            const link = e.target.closest(selectors.link);
            if (link && link.getAttribute('href')) {
                handleNavigation(link);
            }
        });
    };

    /**
     * Handle breadcrumb navigation
     */
    const handleNavigation = (link) => {
        // Add active state to current breadcrumb
        const breadcrumbNav = link.closest(selectors.nav);
        if (breadcrumbNav) {
            breadcrumbNav.querySelectorAll(selectors.item).forEach((item) => {
                item.classList.remove('active');
            });
            link.closest(selectors.item).classList.add('active');
        }
    };

    /**
     * Update breadcrumb trail
     */
    const updateTrail = (breadcrumbs) => {
        const nav = document.querySelector(selectors.nav);
        if (!nav) return;

        const list = nav.querySelector(selectors.breadcrumb);
        if (!list) return;

        // Keep home link
        const homeItem = list.querySelector(`${selectors.item}:first-child`);
        
        // Remove all items except home
        list.querySelectorAll(selectors.item).forEach((item, index) => {
            if (index !== 0) item.remove();
        });

        // Add new breadcrumbs
        breadcrumbs.forEach((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const li = document.createElement('li');
            li.className = `breadcrumb-item ${isLast ? 'active' : ''}`;

            if (crumb.url && !isLast) {
                const link = document.createElement('a');
                link.href = crumb.url;
                link.className = 'breadcrumb-link';
                if (crumb.icon) link.innerHTML = `<span class="icon">${crumb.icon}</span>`;
                link.innerHTML += `<span>${crumb.name}</span>`;
                li.appendChild(link);
            } else {
                if (crumb.icon) li.innerHTML = `<span class="icon">${crumb.icon}</span>`;
                li.innerHTML += `<span>${crumb.name}</span>`;
            }

            list.appendChild(li);
        });
    };

    /**
     * Set active breadcrumb
     */
    const setActive = (index) => {
        const items = document.querySelectorAll(selectors.item);
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    };

    return {
        init,
        updateTrail,
        setActive,
        handleNavigation
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BreadcrumbComponent.init());
} else {
    BreadcrumbComponent.init();
}
