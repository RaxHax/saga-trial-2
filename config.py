# config.py
"""
Application configuration module.
All configuration settings are centralized here.
"""
import torch
import os


class Config:
    """Application configuration settings."""
    
    # Model Configuration
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    MODEL_NAME = 'ViT-B-32'
    PRETRAINED = 'laion2b_s34b_b79k'
    
    # Storage Configuration
    QDRANT_PATH = "./qdrant_storage"
    COLLECTION_NAME = "image_search_v2"
    
    # Image Processing Configuration
    BASE_IMAGE_DIR = os.path.realpath("./scraped_images")
    IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
    INDEXING_BATCH_SIZE = 128
    
    # Server Configuration
    HOST = '0.0.0.0'
    PORT = 5000
    DEBUG = False
    
    # Search Configuration
    DEFAULT_SEARCH_LIMIT = 48
    MAX_SEARCH_LIMIT = 200
