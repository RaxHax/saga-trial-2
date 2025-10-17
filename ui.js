// static/js/ui.js

/**
 * UI Module
 * Handles all DOM manipulation and UI rendering
 */
const UI = (function() {
    'use strict';
    
    // Cache DOM elements
    const elements = {};
    
    /**
     * Initialize DOM element references
     * @private
     */
    function initElements() {
        elements.sidebar = document.querySelector('.sidebar');
        elements.hamburger = document.querySelector('.hamburger');
        elements.searchInput = document.querySelector('.search-input');
        elements.resultsGrid = document.querySelector('.results-grid');
        elements.loadingState = document.querySelector('.loading-state');
        elements.emptyState = document.querySelector('.empty-state');
        elements.modal = document.querySelector('.modal');
        elements.toastContainer = document.querySelector('.toast-container');
        elements.statsBox = document.querySelector('.stats-box');
        elements.progressContainer = document.querySelector('.progress-container');
        elements.filterBar = document.querySelector('.filter-bar');
    }
    
    /**
     * Create an SVG icon element
     * @private
     */
    function createIcon(type) {
        const icons = {
            search: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>',
            settings: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.93 1.11-1.11l3.593.718a1.875 1.875 0 0 1 1.328 1.328l.718 3.593c.069.55-.568 1.02-1.11 1.11l-3.593.718a1.875 1.875 0 0 1-1.328-1.328l-.718-3.593Z" /></svg>',
            grid: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>',
            close: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>',
            menu: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>',
            success: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>',
            warning: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>',
            folder: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>',
            image: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>'
        };
        return icons[type] || '';
    }
    
    /**
     * Create an image card component
     * @private
     */
    function createImageCard(result, index) {
        const scorePercent = Math.round(result.score * 100);
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.index = index;
        
        card.innerHTML = `
            <img class="image-card-img" 
                 src="${API.getImageUrl(result.path)}" 
                 alt="${result.filename}"
                 loading="lazy">
            <div class="image-card-info">
                <div class="image-score">${scorePercent}% match</div>
                <div class="image-filename" title="${result.filename}">${result.filename}</div>
                ${result.description && result.description !== 'No description' 
                    ? `<div class="image-description">${result.description}</div>` 
                    : ''}
            </div>
        `;
        
        return card;
    }
    
    /**
     * Create a toast notification
     * @private
     */
    function createToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        toast.innerHTML = `
            <div class="toast-icon">${createIcon(type)}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
        `;
        
        return toast;
    }
    
    return {
        /**
         * Initialize the UI
         */
        init() {
            initElements();
        },
        
        /**
         * Toggle sidebar visibility
         */
        toggleSidebar() {
            if (elements.sidebar) {
                elements.sidebar.classList.toggle('open');
            }
        },
        
        /**
         * Show loading state
         */
        showLoading() {
            if (elements.loadingState) {
                elements.loadingState.classList.remove('hidden');
            }
            if (elements.resultsGrid) {
                elements.resultsGrid.classList.add('hidden');
            }
            if (elements.emptyState) {
                elements.emptyState.classList.add('hidden');
            }
        },
        
        /**
         * Hide loading state
         */
        hideLoading() {
            if (elements.loadingState) {
                elements.loadingState.classList.add('hidden');
            }
        },
        
        /**
         * Render search results
         * @param {Array} results - Array of search results
         */
        renderResults(results) {
            this.hideLoading();
            
            if (!elements.resultsGrid) return;
            
            if (!results || results.length === 0) {
                this.showEmptyState('No results found', 'Try adjusting your search query');
                return;
            }
            
            elements.resultsGrid.innerHTML = '';
            elements.resultsGrid.classList.remove('hidden');
            
            results.forEach((result, index) => {
                const card = createImageCard(result, index);
                elements.resultsGrid.appendChild(card);
            });
            
            if (elements.emptyState) {
                elements.emptyState.classList.add('hidden');
            }
        },
        
        /**
         * Show empty state
         * @param {string} title - Title text
         * @param {string} description - Description text
         */
        showEmptyState(title, description) {
            this.hideLoading();
            
            if (elements.emptyState) {
                elements.emptyState.innerHTML = `
                    <div class="empty-icon">${createIcon('image')}</div>
                    <div class="empty-title">${title}</div>
                    <div class="empty-description">${description}</div>
                `;
                elements.emptyState.classList.remove('hidden');
            }
            
            if (elements.resultsGrid) {
                elements.resultsGrid.classList.add('hidden');
            }
        },
        
        /**
         * Show toast notification
         * @param {string} type - Toast type (success, error, warning)
         * @param {string} title - Toast title
         * @param {string} message - Toast message
         * @param {number} duration - Duration in milliseconds
         */
        showToast(type, title, message, duration = 3000) {
            if (!elements.toastContainer) {
                // Create toast container if it doesn't exist
                const container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
                elements.toastContainer = container;
            }
            
            const toast = createToast(type, title, message);
            elements.toastContainer.appendChild(toast);
            
            // Auto remove after duration
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },
        
        /**
         * Update statistics display
         * @param {Object} stats - Statistics object
         */
        updateStats(stats) {
            const totalImages = document.getElementById('total-images');
            const deviceInfo = document.getElementById('device-info');
            const statusBadge = document.getElementById('status-badge');
            
            if (totalImages) {
                totalImages.textContent = stats.total_images.toLocaleString();
            }
            if (deviceInfo) {
                deviceInfo.textContent = stats.device.toUpperCase();
            }
            if (statusBadge) {
                statusBadge.textContent = stats.is_indexing ? 'Indexing' : 'Ready';
                statusBadge.className = `badge ${stats.is_indexing ? 'badge-warning' : 'badge-success'}`;
            }
        },
        
        /**
         * Update progress bar
         * @param {Object} status - Indexing status object
         */
        updateProgress(status) {
            if (!elements.progressContainer) return;
            
            const percent = status.total > 0 
                ? Math.round((status.progress / status.total) * 100) 
                : 0;
            
            const progressFill = elements.progressContainer.querySelector('.progress-fill');
            const progressText = elements.progressContainer.querySelector('.progress-text');
            const progressPercent = elements.progressContainer.querySelector('.progress-percent');
            
            if (progressFill) {
                progressFill.style.width = `${percent}%`;
            }
            if (progressText) {
                progressText.textContent = status.message;
            }
            if (progressPercent) {
                progressPercent.textContent = `${percent}%`;
            }
            
            if (status.is_indexing) {
                elements.progressContainer.classList.remove('hidden');
            } else if (percent === 100) {
                setTimeout(() => {
                    elements.progressContainer.classList.add('hidden');
                }, 3000);
            }
        },
        
        /**
         * Open image modal
         * @param {Object} image - Image data
         */
        openModal(image) {
            if (!elements.modal) return;
            
            const modalImage = elements.modal.querySelector('.modal-image');
            const modalFilename = elements.modal.querySelector('#modal-filename');
            const modalScore = elements.modal.querySelector('#modal-score');
            const modalDescription = elements.modal.querySelector('#modal-description');
            
            if (modalImage) {
                modalImage.src = API.getImageUrl(image.path);
                modalImage.alt = image.filename;
            }
            if (modalFilename) {
                modalFilename.textContent = image.filename;
            }
            if (modalScore) {
                modalScore.textContent = `${Math.round(image.score * 100)}% match`;
            }
            if (modalDescription) {
                modalDescription.textContent = image.description || 'No description';
            }
            
            elements.modal.classList.add('active');
        },
        
        /**
         * Close modal
         */
        closeModal() {
            if (elements.modal) {
                elements.modal.classList.remove('active');
            }
        },
        
        /**
         * Get search input value
         */
        getSearchQuery() {
            return elements.searchInput ? elements.searchInput.value.trim() : '';
        },
        
        /**
         * Clear search input
         */
        clearSearch() {
            if (elements.searchInput) {
                elements.searchInput.value = '';
            }
        },
        
        /**
         * Get filter values
         */
        getFilters() {
            const topK = document.getElementById('results-count');
            const minScore = document.getElementById('min-score');
            
            return {
                topK: topK ? parseInt(topK.value) : 48,
                minScore: minScore ? parseFloat(minScore.value) : 0.0
            };
        }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
