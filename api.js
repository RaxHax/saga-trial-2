// static/js/api.js

/**
 * API Module
 * Handles all communication with the backend API
 */
const API = (function() {
    'use strict';
    
    const BASE_URL = '';  // Using relative URLs
    
    /**
     * Make a fetch request with error handling
     * @private
     */
    async function request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    return {
        /**
         * Search for images
         * @param {string} query - Search query text
         * @param {number} topK - Number of results to return
         * @param {number} minScore - Minimum similarity score
         */
        async search(query, topK = 48, minScore = 0.0) {
            return request(`${BASE_URL}/api/search`, {
                method: 'POST',
                body: JSON.stringify({ query, top_k: topK, min_score: minScore })
            });
        },
        
        /**
         * Start indexing images
         * @param {string} folder - Folder path to index
         */
        async startIndexing(folder) {
            return request(`${BASE_URL}/api/index`, {
                method: 'POST',
                body: JSON.stringify({ folder })
            });
        },
        
        /**
         * Get indexing status
         */
        async getIndexingStatus() {
            return request(`${BASE_URL}/api/index/status`);
        },
        
        /**
         * Get system statistics
         */
        async getStats() {
            return request(`${BASE_URL}/api/stats`);
        },
        
        /**
         * Health check
         */
        async healthCheck() {
            return request(`${BASE_URL}/api/health`);
        },
        
        /**
         * Get image URL
         * @param {string} path - Relative path to image
         */
        getImageUrl(path) {
            return `${BASE_URL}/api/image/${encodeURIComponent(path)}`;
        }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
