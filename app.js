// static/js/app.js

/**
 * Main Application Controller
 * Coordinates between API and UI modules
 */
const App = (function() {
    'use strict';
    
    // Application state
    let state = {
        currentResults: [],
        currentView: 'search',
        isIndexing: false,
        indexingPollInterval: null
    };
    
    /**
     * Initialize the application
     */
    function init() {
        // Initialize UI
        UI.init();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load initial data
        loadInitialData();
        
        // Check if indexing is already in progress
        checkIndexingStatus();
        
        console.log('Application initialized successfully');
    }
    
    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Hamburger menu
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', () => UI.toggleSidebar());
        }
        
        // Search input
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
        
        // Search button
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
        
        // Filter changes
        const resultsCount = document.getElementById('results-count');
        const minScore = document.getElementById('min-score');
        if (resultsCount) {
            resultsCount.addEventListener('change', performSearch);
        }
        if (minScore) {
            minScore.addEventListener('change', performSearch);
        }
        
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => handleNavigation(item));
        });
        
        // Image cards (using event delegation)
        const resultsGrid = document.querySelector('.results-grid');
        if (resultsGrid) {
            resultsGrid.addEventListener('click', handleImageClick);
        }
        
        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => UI.closeModal());
        }
        
        // Modal backdrop click
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UI.closeModal();
                }
            });
        }
        
        // Indexing form
        const indexForm = document.getElementById('index-form');
        if (indexForm) {
            indexForm.addEventListener('submit', handleIndexSubmit);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    /**
     * Handle keyboard shortcuts
     */
    function handleKeyboardShortcuts(e) {
        // Focus search with /
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) searchInput.focus();
        }
        
        // Close modal with Escape
        if (e.key === 'Escape') {
            UI.closeModal();
        }
        
        // Navigate images in modal with arrow keys
        const modal = document.querySelector('.modal');
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                navigateModalImage(-1);
            } else if (e.key === 'ArrowRight') {
                navigateModalImage(1);
            }
        }
    }
    
    /**
     * Load initial data
     */
    async function loadInitialData() {
        try {
            const stats = await API.getStats();
            UI.updateStats(stats);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }
    
    /**
     * Check if indexing is in progress
     */
    async function checkIndexingStatus() {
        try {
            const status = await API.getIndexingStatus();
            if (status.is_indexing) {
                startIndexingPoll();
            }
        } catch (error) {
            console.error('Failed to check indexing status:', error);
        }
    }
    
    /**
     * Perform search
     */
    async function performSearch() {
        const query = UI.getSearchQuery();
        if (!query) {
            UI.showToast('warning', 'Empty Query', 'Please enter a search term');
            return;
        }
        
        const filters = UI.getFilters();
        
        UI.showLoading();
        
        try {
            const results = await API.search(query, filters.topK, filters.minScore);
            
            if (results.error) {
                throw new Error(results.error);
            }
            
            state.currentResults = results.results;
            UI.renderResults(state.currentResults);
            
            // Update result count
            const resultCount = document.querySelector('.result-count');
            if (resultCount) {
                resultCount.textContent = `${results.count} results for "${query}"`;
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            UI.showToast('error', 'Search Failed', error.message);
            UI.showEmptyState('Search Error', 'Unable to perform search. Please try again.');
        }
    }
    
    /**
     * Handle navigation between views
     */
    function handleNavigation(navItem) {
        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');
        
        // Get view name
        const viewName = navItem.dataset.view;
        if (!viewName) return;
        
        // Update current view
        state.currentView = viewName;
        
        // Show/hide appropriate views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });
        
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            UI.toggleSidebar();
        }
    }
    
    /**
     * Handle image click
     */
    function handleImageClick(e) {
        const card = e.target.closest('.image-card');
        if (!card) return;
        
        const index = parseInt(card.dataset.index);
        if (state.currentResults[index]) {
            UI.openModal(state.currentResults[index]);
        }
    }
    
    /**
     * Navigate between images in modal
     */
    function navigateModalImage(direction) {
        const modal = document.querySelector('.modal');
        if (!modal || !modal.classList.contains('active')) return;
        
        // Find current image index
        const modalImage = modal.querySelector('.modal-image');
        if (!modalImage) return;
        
        const currentSrc = modalImage.src;
        let currentIndex = -1;
        
        state.currentResults.forEach((result, index) => {
            if (currentSrc.includes(encodeURIComponent(result.path))) {
                currentIndex = index;
            }
        });
        
        if (currentIndex === -1) return;
        
        // Calculate new index
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = state.currentResults.length - 1;
        if (newIndex >= state.currentResults.length) newIndex = 0;
        
        // Update modal
        UI.openModal(state.currentResults[newIndex]);
    }
    
    /**
     * Handle index form submission
     */
    async function handleIndexSubmit(e) {
        e.preventDefault();
        
        const folderInput = document.getElementById('folder-path');
        if (!folderInput) return;
        
        const folder = folderInput.value.trim();
        if (!folder) {
            UI.showToast('warning', 'Invalid Input', 'Please enter a folder path');
            return;
        }
        
        try {
            const response = await API.startIndexing(folder);
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            UI.showToast('success', 'Indexing Started', response.message);
            startIndexingPoll();
            
        } catch (error) {
            console.error('Failed to start indexing:', error);
            UI.showToast('error', 'Indexing Failed', error.message);
        }
    }
    
    /**
     * Start polling for indexing status
     */
    function startIndexingPoll() {
        if (state.indexingPollInterval) {
            clearInterval(state.indexingPollInterval);
        }
        
        state.isIndexing = true;
        
        state.indexingPollInterval = setInterval(async () => {
            try {
                const status = await API.getIndexingStatus();
                
                // Update UI
                UI.updateProgress(status);
                
                // Update stats if needed
                if (!status.is_indexing) {
                    clearInterval(state.indexingPollInterval);
                    state.indexingPollInterval = null;
                    state.isIndexing = false;
                    
                    // Reload stats
                    const stats = await API.getStats();
                    UI.updateStats(stats);
                    
                    // Show completion toast
                    if (status.progress === status.total && status.total > 0) {
                        UI.showToast('success', 'Indexing Complete', status.message);
                    }
                }
                
            } catch (error) {
                console.error('Failed to poll indexing status:', error);
                clearInterval(state.indexingPollInterval);
                state.indexingPollInterval = null;
                state.isIndexing = false;
            }
        }, 1000);
    }
    
    /**
     * Public API
     */
    return {
        init,
        performSearch,
        getState: () => state
    };
})();

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
