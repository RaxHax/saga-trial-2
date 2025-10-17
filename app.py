# app.py
"""
Flask web application for image search.
This module handles HTTP routing and request/response processing only.
All business logic is delegated to the service module.
"""
import os
import logging
from flask import Flask, render_template, request, jsonify, send_file

from config import Config
from service import ImageSearchService


# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize configuration and service
config = Config()
service = ImageSearchService(config)


# ==================== ROUTES ====================

@app.route('/')
def home():
    """Render the home page."""
    return render_template('index.html')


@app.route('/search')
def search_page():
    """Render the search application page."""
    return render_template('search.html')


# ==================== API ENDPOINTS ====================

@app.route('/api/search', methods=['POST'])
def search_api():
    """
    Search for images matching a query.
    
    Expected JSON payload:
        - query (str): Search query text
        - top_k (int): Number of results to return (default: 48)
        - min_score (float): Minimum similarity score (default: 0.0)
    """
    try:
        data = request.json or {}
        query = data.get('query', '')
        top_k = min(int(data.get('top_k', config.DEFAULT_SEARCH_LIMIT)), config.MAX_SEARCH_LIMIT)
        min_score = float(data.get('min_score', 0.0))
        
        results = service.search(query, top_k, min_score)
        
        if 'error' in results:
            return jsonify(results), 400
        
        return jsonify(results)
        
    except ValueError as e:
        logger.error(f"Invalid parameter in search request: {e}")
        return jsonify({"error": "Invalid parameters"}), 400
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/index', methods=['POST'])
def start_indexing():
    """
    Start indexing images in a specified folder.
    
    Expected JSON payload:
        - folder (str): Path to folder containing images
    """
    try:
        data = request.json or {}
        image_folder = data.get('folder', config.BASE_IMAGE_DIR)
        
        if not os.path.isdir(image_folder):
            return jsonify({"error": f"Folder not found: {image_folder}"}), 404
            
        if service.start_indexing_thread(image_folder):
            return jsonify({
                "message": "Indexing started",
                "status": service.get_indexing_status()
            })
        else:
            return jsonify({"error": "Indexing already in progress"}), 400
            
    except Exception as e:
        logger.error(f"Indexing error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/index/status', methods=['GET'])
def get_indexing_status():
    """Get the current indexing status."""
    return jsonify(service.get_indexing_status())


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system and collection statistics."""
    return jsonify(service.get_stats())


@app.route('/api/image/<path:relative_path>')
def serve_image(relative_path):
    """
    Serve an image file from the image directory.
    
    Args:
        relative_path: Relative path to the image file
    """
    try:
        # Construct safe path
        safe_path = os.path.join(config.BASE_IMAGE_DIR, relative_path)
        real_path = os.path.realpath(safe_path)
        
        # Security check: ensure path is within allowed directory
        if not real_path.startswith(os.path.realpath(config.BASE_IMAGE_DIR)):
            logger.warning(f"Attempted access outside image directory: {relative_path}")
            return jsonify({"error": "Access denied"}), 403
            
        if os.path.exists(real_path) and os.path.isfile(real_path):
            return send_file(real_path)
        else:
            return jsonify({"error": "Image not found"}), 404
            
    except Exception as e:
        logger.error(f"Error serving image '{relative_path}': {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "healthy",
        "model_loaded": service.model is not None,
        "device": service.device,
        "version": "2.0.0"
    })


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors."""
    if request.path.startswith('/api/'):
        return jsonify({"error": "Endpoint not found"}), 404
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {error}")
    if request.path.startswith('/api/'):
        return jsonify({"error": "Internal server error"}), 500
    return render_template('500.html'), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    logger.info("\n" + "=" * 60)
    logger.info("Image Search System v2.0 Starting...")
    logger.info(f"Using device: {config.DEVICE}")
    logger.info(f"Server: http://{config.HOST}:{config.PORT}")
    logger.info("=" * 60 + "\n")
    
    app.run(
        debug=config.DEBUG,
        host=config.HOST,
        port=config.PORT
    )
