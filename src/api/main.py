"""
FastAPI service for Vietnamese comment moderation.
"""

import os
import json
from pathlib import Path
from typing import List, Optional
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import local modules
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from preprocessing.text_preprocessor import VietnameseTextPreprocessor
from models.bilstm import BiLSTMClassifier
from models.dataset import Vocabulary


# ============================================================================
# Configuration
# ============================================================================

class Settings:
    """Application settings."""
    
    # Paths
    BASE_DIR = Path(__file__).parent.parent.parent
    MODELS_DIR = BASE_DIR / "data" / "models" / "deployment"
    
    # Model files
    WEIGHTS_FILE = MODELS_DIR / "model_weights.pt"
    CONFIG_FILE = MODELS_DIR / "config.json"
    VOCAB_FILE = MODELS_DIR / "vocab.json"
    
    # API settings
    API_TITLE = "Vietnamese Comment Moderation API"
    API_VERSION = "0.1.0"
    API_DESCRIPTION = """
    AI service for detecting toxic, offensive, and hate speech in Vietnamese comments.
    
    ## Labels
    - **toxic_offensive**: Toxic behavior or offensive language (bad words)
    - **hate_speech**: Targeted hate speech
    
    ## Usage
    Send a POST request to `/predict` with a comment or list of comments.
    """
    
    # Inference settings
    DEFAULT_THRESHOLD = 0.5
    MAX_BATCH_SIZE = 64
    MAX_TEXT_LENGTH = 1000  # characters


settings = Settings()


# ============================================================================
# Request/Response Models
# ============================================================================

class CommentRequest(BaseModel):
    """Request model for single comment."""
    text: str = Field(..., min_length=1, max_length=settings.MAX_TEXT_LENGTH)
    threshold: Optional[float] = Field(
        default=settings.DEFAULT_THRESHOLD,
        ge=0.0, le=1.0,
        description="Classification threshold (0-1)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "Sản phẩm này tốt lắm!",
                    "threshold": 0.5
                }
            ]
        }
    }


class BatchCommentRequest(BaseModel):
    """Request model for batch comments."""
    texts: List[str] = Field(..., min_length=1, max_length=settings.MAX_BATCH_SIZE)
    threshold: Optional[float] = Field(
        default=settings.DEFAULT_THRESHOLD,
        ge=0.0, le=1.0
    )


class PredictionResult(BaseModel):
    """Prediction result for a single comment."""
    text: str
    toxic_offensive: bool
    hate_speech: bool
    probabilities: dict
    is_flagged: bool  # True if any label is positive


class PredictionResponse(BaseModel):
    """Response for single prediction."""
    success: bool
    result: PredictionResult


class BatchPredictionResponse(BaseModel):
    """Response for batch prediction."""
    success: bool
    results: List[PredictionResult]
    summary: dict  # Statistics about the batch


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    device: str


# ============================================================================
# Model Manager
# ============================================================================

class ModelManager:
    """Manages model loading and inference."""
    
    def __init__(self):
        self.model: Optional[BiLSTMClassifier] = None
        self.vocab: Optional[Vocabulary] = None
        self.preprocessor: Optional[VietnameseTextPreprocessor] = None
        self.config: Optional[dict] = None
        self.device: torch.device = torch.device("cpu")
        self.is_loaded: bool = False
    
    def load(self):
        """Load model, vocabulary, and preprocessor."""
        print("Loading model...")
        
        # Check if files exist
        if not settings.WEIGHTS_FILE.exists():
            raise FileNotFoundError(f"Model weights not found: {settings.WEIGHTS_FILE}")
        if not settings.CONFIG_FILE.exists():
            raise FileNotFoundError(f"Config not found: {settings.CONFIG_FILE}")
        if not settings.VOCAB_FILE.exists():
            raise FileNotFoundError(f"Vocabulary not found: {settings.VOCAB_FILE}")
        
        # Set device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        # Load config
        with open(settings.CONFIG_FILE, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        print(f"Loaded config: {self.config}")
        
        # Load vocabulary
        self.vocab = Vocabulary.load(settings.VOCAB_FILE)
        print(f"Loaded vocabulary: {len(self.vocab)} tokens")
        
        # Initialize model
        self.model = BiLSTMClassifier(
            vocab_size=self.config["vocab_size"],
            embedding_dim=self.config["embedding_dim"],
            hidden_dim=self.config["hidden_dim"],
            num_layers=self.config["num_layers"],
            num_labels=self.config["num_labels"],
            dropout=self.config["dropout"],
            padding_idx=self.config["padding_idx"],
        )
        
        # Load weights
        state_dict = torch.load(settings.WEIGHTS_FILE, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()
        print("Loaded model weights")
        
        # Initialize preprocessor
        self.preprocessor = VietnameseTextPreprocessor(
            lowercase=True,
            remove_urls=True,
            remove_emails=True,
            remove_phones=True,
            remove_emojis=False,
            normalize_teencode=True,
            normalize_repeated_chars=True,
            word_segmentation=True,
        )
        print("Initialized preprocessor")
        
        self.is_loaded = True
        print("Model loading complete!")
    
    def predict(self, text: str, threshold: float = 0.5) -> PredictionResult:
        """Make prediction for a single text."""
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")
        
        # Preprocess
        processed = self.preprocessor.preprocess(text)
        
        # Tokenize
        tokens = self.vocab.encode(processed)
        max_len = self.config["max_seq_length"]
        
        if len(tokens) > max_len:
            tokens = tokens[:max_len]
        
        # Create attention mask and pad
        attention_mask = [1] * len(tokens)
        padding = max_len - len(tokens)
        tokens = tokens + [self.vocab.pad_idx] * padding
        attention_mask = attention_mask + [0] * padding
        
        # Prepare tensors
        input_ids = torch.tensor([tokens], dtype=torch.long).to(self.device)
        mask = torch.tensor([attention_mask], dtype=torch.long).to(self.device)
        
        # Inference
        with torch.no_grad():
            outputs = self.model(input_ids, mask)
            probs = outputs["probabilities"][0].cpu().numpy()
        
        # Create result
        toxic_offensive = bool(probs[0] >= threshold)
        hate_speech = bool(probs[1] >= threshold)
        
        return PredictionResult(
            text=text,
            toxic_offensive=toxic_offensive,
            hate_speech=hate_speech,
            probabilities={
                "toxic_offensive": float(probs[0]),
                "hate_speech": float(probs[1]),
            },
            is_flagged=toxic_offensive or hate_speech
        )
    
    def predict_batch(
        self, 
        texts: List[str], 
        threshold: float = 0.5
    ) -> List[PredictionResult]:
        """Make predictions for a batch of texts."""
        return [self.predict(text, threshold) for text in texts]


# Global model manager
model_manager = ModelManager()


# ============================================================================
# FastAPI Application
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    # Startup
    try:
        model_manager.load()
    except FileNotFoundError as e:
        print(f"Warning: {e}")
        print("Model will not be available until files are added.")
    
    yield
    
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint."""
    return {
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy" if model_manager.is_loaded else "model_not_loaded",
        model_loaded=model_manager.is_loaded,
        device=str(model_manager.device),
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(request: CommentRequest):
    """
    Predict labels for a single comment.
    
    Returns:
        Prediction result with labels and probabilities.
    """
    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please add model files to data/models/deployment/"
        )
    
    try:
        result = model_manager.predict(request.text, request.threshold)
        return PredictionResponse(success=True, result=result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
async def predict_batch(request: BatchCommentRequest):
    """
    Predict labels for multiple comments.
    
    Returns:
        List of prediction results and summary statistics.
    """
    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please add model files to data/models/deployment/"
        )
    
    try:
        results = model_manager.predict_batch(request.texts, request.threshold)
        
        # Calculate summary
        total = len(results)
        flagged = sum(1 for r in results if r.is_flagged)
        toxic_offensive = sum(1 for r in results if r.toxic_offensive)
        hate_speech = sum(1 for r in results if r.hate_speech)
        
        summary = {
            "total": total,
            "flagged": flagged,
            "flagged_percentage": flagged / total * 100 if total > 0 else 0,
            "toxic_offensive_count": toxic_offensive,
            "hate_speech_count": hate_speech,
        }
        
        return BatchPredictionResponse(
            success=True,
            results=results,
            summary=summary
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@app.get("/labels", tags=["Info"])
async def get_labels():
    """Get information about prediction labels."""
    return {
        "labels": [
            {
                "name": "toxic_offensive",
                "description": "Toxic behavior or offensive language (including bad words like đụ, vl, etc.)",
            },
            {
                "name": "hate_speech", 
                "description": "Targeted hate speech against groups (based on ethnicity, religion, etc.)",
            },
        ],
        "note": "A comment can have multiple labels (multi-label classification)."
    }


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Disable in production
    )
