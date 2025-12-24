/**
 * Pagination Component
 * Handles pagination controls and page navigation
 */

const PaginationComponent = (() => {
    const selectors = {
        nav: '.pagination-nav',
        pagination: '.pagination',
        item: '.pagination-item',
        link: '.pagination-link',
        info: '.pagination-info'
    };

    /**
     * Initialize pagination component
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
            if (link && !link.classList.contains('disabled') && !link.classList.contains('active')) {
                handlePageChange(link);
            }
        });
    };

    /**
     * Handle page change
     */
    const handlePageChange = (link) => {
        const href = link.getAttribute('href');
        if (href) {
            window.location.href = href;
        }
    };

    /**
     * Update pagination UI
     */
    const updatePagination = (currentPage, totalPages, baseUrl, queryParams = {}) => {
        const nav = document.querySelector(selectors.nav);
        if (!nav) return;

        // Create query string
        const query = Object.keys(queryParams).length > 0 
            ? '&' + new URLSearchParams(queryParams).toString() 
            : '';

        const pagination = nav.querySelector(selectors.pagination);
        if (!pagination) return;

        // Clear existing items except first (previous) and last (next)
        const items = pagination.querySelectorAll(selectors.item);
        items.forEach((item, index) => {
            if (index > 0 && index < items.length - 2) {
                item.remove();
            }
        });

        // Calculate page range
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        // Insert page numbers before last item (next button)
        const lastItem = pagination.lastElementChild;
        
        if (startPage > 1) {
            const ellipsis = createEllipsis();
            pagination.insertBefore(ellipsis, lastItem);
        }

        for (let i = startPage; i <= endPage; i++) {
            const item = createPageItem(i, currentPage, baseUrl, query);
            pagination.insertBefore(item, lastItem);
        }

        if (endPage < totalPages) {
            const ellipsis = createEllipsis();
            pagination.insertBefore(ellipsis, lastItem);
        }

        // Update info
        updateInfo(currentPage, totalPages);
    };

    /**
     * Create page item element
     */
    const createPageItem = (pageNum, currentPage, baseUrl, query) => {
        const li = document.createElement('li');
        li.className = 'pagination-item';

        if (pageNum === currentPage) {
            const span = document.createElement('span');
            span.className = 'pagination-link active';
            span.setAttribute('aria-current', 'page');
            span.textContent = pageNum;
            li.appendChild(span);
        } else {
            const a = document.createElement('a');
            a.className = 'pagination-link';
            a.href = `${baseUrl}?page=${pageNum}${query}`;
            a.textContent = pageNum;
            li.appendChild(a);
        }

        return li;
    };

    /**
     * Create ellipsis element
     */
    const createEllipsis = () => {
        const li = document.createElement('li');
        li.className = 'pagination-item';
        const span = document.createElement('span');
        span.className = 'pagination-ellipsis';
        span.textContent = '...';
        li.appendChild(span);
        return li;
    };

    /**
     * Update pagination info
     */
    const updateInfo = (currentPage, totalPages) => {
        const info = document.querySelector(selectors.info);
        if (info) {
            info.textContent = `Page ${currentPage} of ${totalPages}`;
        }
    };

    /**
     * Get current page from URL
     */
    const getCurrentPage = () => {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('page')) || 1;
    };

    return {
        init,
        updatePagination,
        getCurrentPage,
        handlePageChange
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PaginationComponent.init());
} else {
    PaginationComponent.init();
}
