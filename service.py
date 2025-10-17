# service.py
"""
Core image search service module.
This module contains all business logic for image search, indexing, and embedding generation.
It is completely independent of the web framework.
"""
import logging
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
import open_clip
from PIL import Image
from qdrant_client import QdrantClient, models


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ImageSearchService:
    """
    Service for indexing and searching images using CLIP embeddings and Qdrant.
    """
    
    def __init__(self, config):
        """
        Initialize the image search service.
        
        Args:
            config: Configuration object with necessary settings
        """
        self.config = config
        self.device = self.config.DEVICE
        self._initialize_model()
        self._initialize_qdrant()
        self._initialize_indexing_state()
        
    def _initialize_model(self):
        """Initialize the CLIP model and preprocessor."""
        logger.info(f"Initializing CLIP model on device: {self.device}")
        
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            self.config.MODEL_NAME, 
            pretrained=self.config.PRETRAINED
        )
        self.model = self.model.to(self.device)
        self.model.eval()
        
        # Compile model for GPU if available
        if self.device == "cuda":
            logger.info("Compiling model for GPU acceleration...")
            try:
                self.model = torch.compile(self.model)
                logger.info("Model compiled successfully.")
            except Exception as e:
                logger.warning(f"Model compilation failed, continuing without it: {e}")
        
        self.tokenizer = open_clip.get_tokenizer(self.config.MODEL_NAME)
        
    def _initialize_qdrant(self):
        """Initialize Qdrant client and create collection if necessary."""
        self.qdrant_client = QdrantClient(path=self.config.QDRANT_PATH)
        
        try:
            self.qdrant_client.get_collection(collection_name=self.config.COLLECTION_NAME)
            logger.info(f"Using existing collection: '{self.config.COLLECTION_NAME}'")
        except Exception:
            self.qdrant_client.create_collection(
                collection_name=self.config.COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=512, 
                    distance=models.Distance.COSINE
                ),
            )
            logger.info(f"Created new collection: '{self.config.COLLECTION_NAME}'")
            
    def _initialize_indexing_state(self):
        """Initialize the indexing status tracking."""
        self.indexing_status = {
            "is_indexing": False,
            "progress": 0,
            "total": 0,
            "message": "Not started",
            "start_time": None,
            "estimated_time": "N/A"
        }
        self.lock = threading.Lock()
        
    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate text embedding using CLIP.
        
        Args:
            text: Text to embed
            
        Returns:
            List of embedding values or None if error
        """
        try:
            text_input = self.tokenizer([text]).to(self.device)
            with torch.no_grad(), torch.amp.autocast(
                device_type=self.device, 
                enabled=(self.device == 'cuda')
            ):
                text_features = self.model.encode_text(text_input)
                text_features /= text_features.norm(dim=-1, keepdim=True)
            return text_features.cpu().numpy()[0].tolist()
        except Exception as e:
            logger.error(f"Error generating text embedding: {e}")
            return None
            
    def _generate_id(self, path: Path) -> str:
        """Generate unique ID for a file path."""
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(path.absolute())))
        
    def _embed_image_batch(self, image_paths: List[Path]) -> Optional[List]:
        """
        Embed a batch of images.
        
        Args:
            image_paths: List of paths to images
            
        Returns:
            Numpy array of embeddings or None if error
        """
        try:
            images = []
            for path in image_paths:
                img = Image.open(path).convert("RGB")
                images.append(img)
                
            image_tensors = [self.preprocess(img).unsqueeze(0) for img in images]
            batch_tensor = torch.cat(image_tensors).to(self.device)
            
            with torch.no_grad(), torch.amp.autocast(
                device_type=self.device, 
                enabled=(self.device == 'cuda')
            ):
                image_features = self.model.encode_image(batch_tensor)
                image_features /= image_features.norm(dim=-1, keepdim=True)
                
            return image_features.cpu().numpy()
        except Exception as e:
            logger.error(f"Error processing batch starting with {image_paths[0]}: {e}")
            return None
            
    def start_indexing_thread(self, image_folder: str) -> bool:
        """
        Start indexing in a background thread.
        
        Args:
            image_folder: Path to folder containing images
            
        Returns:
            True if indexing started, False if already in progress
        """
        import os
        absolute_image_folder = os.path.realpath(image_folder)
        
        with self.lock:
            if self.indexing_status["is_indexing"]:
                logger.warning("Indexing is already in progress.")
                return False
                
            self.indexing_status.update({
                "is_indexing": True,
                "progress": 0,
                "total": 0,
                "message": "Starting...",
                "start_time": time.time(),
                "estimated_time": "Calculating..."
            })
            
        thread = threading.Thread(
            target=self.index_images, 
            args=(absolute_image_folder,)
        )
        thread.daemon = True
        thread.start()
        return True
        
    def index_images(self, image_folder: str):
        """
        Index all images in the specified folder.
        
        Args:
            image_folder: Path to folder containing images
        """
        logger.info(f"Starting to index images in '{image_folder}'...")
        
        # Find all image files
        image_paths = sorted([
            p for p in Path(image_folder).rglob("*") 
            if p.suffix.lower() in self.config.IMAGE_EXTENSIONS
        ])
        total_images = len(image_paths)
        
        with self.lock:
            self.indexing_status.update({
                "total": total_images,
                "message": f"Found {total_images} images."
            })
            
        errors = 0
        
        # Process images in batches
        for i in range(0, total_images, self.config.INDEXING_BATCH_SIZE):
            batch_paths = image_paths[i:i + self.config.INDEXING_BATCH_SIZE]
            embeddings = self._embed_image_batch(batch_paths)
            
            if embeddings is None:
                errors += len(batch_paths)
                continue
                
            # Prepare points for Qdrant
            points = []
            for path, embedding in zip(batch_paths, embeddings):
                # Try to load description from .txt file
                txt_path = path.with_suffix('.txt')
                description = "No description"
                if txt_path.exists():
                    try:
                        description = txt_path.read_text(encoding='utf-8').strip()
                    except Exception:
                        pass
                        
                points.append(models.PointStruct(
                    id=self._generate_id(path),
                    vector=embedding.tolist(),
                    payload={
                        "filename": path.name,
                        "path": str(path.absolute()),
                        "relative_path": str(path.relative_to(self.config.BASE_IMAGE_DIR)),
                        "description": description
                    }
                ))
                
            # Upsert points to Qdrant
            if points:
                self.qdrant_client.upsert(
                    collection_name=self.config.COLLECTION_NAME,
                    points=points
                )
                
            # Update progress
            with self.lock:
                progress = min(i + self.config.INDEXING_BATCH_SIZE, total_images)
                self.indexing_status["progress"] = progress
                
                # Calculate ETA
                elapsed = time.time() - self.indexing_status["start_time"]
                if progress > 0:
                    rate = progress / elapsed
                    eta = (total_images - progress) / rate if rate > 0 else 0
                    self.indexing_status["estimated_time"] = (
                        f"{int(eta // 60)}m {int(eta % 60)}s remaining"
                    )
                    
                self.indexing_status["message"] = (
                    f"Processed {progress}/{total_images} images"
                )
                
        # Finalize indexing
        with self.lock:
            success_count = total_images - errors
            final_message = f"Completed! Indexed {success_count} images."
            if errors > 0:
                final_message += f" ({errors} errors)"
                
            self.indexing_status.update({
                "is_indexing": False,
                "message": final_message
            })
            
        logger.info(final_message)
        
    def search(self, query: str, top_k: int = 12, min_score: float = 0.0) -> Dict:
        """
        Search for images matching the query.
        
        Args:
            query: Search query text
            top_k: Maximum number of results to return
            min_score: Minimum similarity score threshold
            
        Returns:
            Dictionary containing search results
        """
        if not query:
            return {"error": "Query is required"}
            
        # Generate query embedding
        query_vector = self.generate_embedding(query)
        if query_vector is None:
            return {"error": "Failed to process query"}
            
        # Search in Qdrant
        try:
            results = self.qdrant_client.search(
                collection_name=self.config.COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k,
                with_payload=True
            )
            
            # Format results
            formatted_results = []
            for res in results:
                if res.score >= min_score:
                    formatted_results.append({
                        "score": float(res.score),
                        "filename": res.payload.get('filename'),
                        "path": res.payload.get('relative_path'),
                        "description": res.payload.get('description', 'No description'),
                    })
                    
            return {
                "query": query,
                "results": formatted_results,
                "count": len(formatted_results)
            }
        except Exception as e:
            logger.error(f"Search error: {e}")
            return {"error": str(e)}
            
    def get_stats(self) -> Dict:
        """
        Get statistics about the image collection.
        
        Returns:
            Dictionary containing statistics
        """
        try:
            collection_info = self.qdrant_client.get_collection(self.config.COLLECTION_NAME)
            points_count = collection_info.points_count
        except Exception:
            points_count = 0
            
        return {
            "total_images": points_count,
            "device": self.device,
            "model": self.config.MODEL_NAME,
            "is_indexing": self.indexing_status["is_indexing"]
        }
        
    def get_indexing_status(self) -> Dict:
        """
        Get current indexing status.
        
        Returns:
            Dictionary containing indexing status
        """
        with self.lock:
            return self.indexing_status.copy()
