# Image Search System v2.0 - Refactored

A modern, modular image search application powered by CLIP and Qdrant, completely refactored for better maintainability and user experience.

## ✨ What's New in v2.0

### Backend Improvements
- **Separation of Concerns**: Business logic moved to `service.py`, configuration to `config.py`
- **Clean API Routes**: Flask routes in `app.py` only handle HTTP requests, no business logic
- **Better Error Handling**: Comprehensive error handling and logging throughout
- **Modular Architecture**: Easy to extend and maintain

### Frontend Transformation
- **Modern, Professional Design**: Complete UI overhaul with a clean, responsive design
- **Modular JavaScript**: Separated into API, UI, and App controller modules
- **No More Inline Code**: All styles in CSS file, all scripts in JS files
- **Component-Based UI**: Reusable components for better maintainability
- **Toast Notifications**: Replaced all `alert()` calls with elegant toast notifications
- **SVG Icons**: Professional icons instead of emojis
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 📁 Project Structure

```
image-search-system/
│
├── app.py                  # Flask application with clean routes
├── service.py             # Core image search business logic
├── config.py              # Centralized configuration
│
├── static/
│   ├── style.css          # All application styles
│   └── js/
│       ├── api.js         # API communication module
│       ├── ui.js          # UI rendering and DOM manipulation
│       └── app.js         # Main application controller
│
├── templates/
│   ├── index.html         # Landing page
│   └── search.html        # Search application interface
│
├── qdrant_storage/        # Vector database storage
└── scraped_images/        # Image directory (configurable)
```

## 🚀 Quick Start

### Prerequisites
```bash
pip install flask torch torchvision open_clip qdrant-client Pillow
```

### Running the Application
```bash
python app.py
```

The application will start on `http://localhost:5000`

## 🔧 Configuration

Edit `config.py` to customize:
- Model settings (CLIP variant)
- Storage paths
- Server settings
- Search defaults

## 📖 API Endpoints

### Search
- `POST /api/search` - Search for images
  ```json
  {
    "query": "sunset beach",
    "top_k": 48,
    "min_score": 0.5
  }
  ```

### Indexing
- `POST /api/index` - Start indexing images
  ```json
  {
    "folder": "./path/to/images"
  }
  ```
- `GET /api/index/status` - Get indexing progress

### System
- `GET /api/stats` - Get system statistics
- `GET /api/health` - Health check
- `GET /api/image/<path>` - Serve image file

## 🎨 Frontend Architecture

### Modular JavaScript

**API Module (`api.js`)**: Handles all backend communication
- Centralized error handling
- Promise-based interface
- No DOM manipulation

**UI Module (`ui.js`)**: Manages all DOM operations
- Component creation functions
- State-agnostic rendering
- Toast notifications
- Modal management

**App Controller (`app.js`)**: Coordinates everything
- Event listener setup
- State management
- Business logic flow
- Module coordination

### Key Features
- **Keyboard Shortcuts**: `/` for search, `ESC` to close modal, arrows to navigate
- **Responsive Sidebar**: Collapsible on mobile with hamburger menu
- **Dynamic Filtering**: Real-time result filtering
- **Progress Tracking**: Visual indexing progress with ETA
- **Image Modal**: Full-size preview with metadata

## 🔄 Development Workflow

### Adding New Features

1. **Backend Feature**: Add business logic to `service.py`, expose via route in `app.py`
2. **API Call**: Add method to `api.js`
3. **UI Component**: Create rendering function in `ui.js`
4. **Wire It Up**: Connect in `app.js` with event handlers

### Styling Changes
All styles are in `static/style.css` with:
- CSS variables for theming
- Utility classes
- Component-specific styles
- Responsive breakpoints

## 🎯 Design Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **No Business Logic in Routes**: Flask routes are thin wrappers
3. **No DOM in API**: API module never touches the DOM
4. **Component-Based UI**: Reusable UI components
5. **State Management**: Centralized state in app controller
6. **Error Recovery**: Graceful error handling throughout

## 🔐 Security

- Path traversal protection in image serving
- Input validation on all endpoints
- Safe file path handling
- No direct file system access from frontend

## 🚦 Performance

- Batch processing for indexing
- GPU acceleration when available
- Lazy loading for images
- Efficient vector search with Qdrant
- Compiled model for faster inference

## 🛠️ Troubleshooting

### Common Issues

1. **CUDA not available**: System will fall back to CPU automatically
2. **Indexing slow**: Adjust `INDEXING_BATCH_SIZE` in `config.py`
3. **Memory issues**: Reduce batch size or image resolution
4. **Port in use**: Change `PORT` in `config.py`

## 📝 Future Enhancements

- [ ] Image upload functionality
- [ ] Similar image search
- [ ] Batch operations
- [ ] Export/import collections
- [ ] Advanced filtering (date, size, etc.)
- [ ] User authentication
- [ ] Search history
- [ ] Saved searches

## 📄 License

This is a refactored version of the original application, restructured for better maintainability and user experience.

---

**Note**: This application processes all images locally. Your images never leave your system, ensuring complete privacy.
