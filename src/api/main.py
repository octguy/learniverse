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
    
    # Device settings
    FORCE_CPU = os.getenv("FORCE_CPU", "false").lower() in ("true", "1", "yes")
    
    # API settings
    API_TITLE = "Vietnamese Comment Moderation API"
    API_VERSION = "0.1.0"
    API_DESCRIPTION = """
    AI service for detecting toxic, offensive, and hate speech in Vietnamese comments.
    
    ## Classes
    - **CLEAN**: Normal, non-toxic comment
    - **OFFENSIVE**: Toxic behavior or offensive language (bad words)
    - **HATE**: Targeted hate speech against groups
    
    ## Usage
    Send a POST request to `/predict` with a comment or list of comments.
    """
    
    # Inference settings
    MAX_BATCH_SIZE = 64
    MAX_TEXT_LENGTH = 1000  # characters


settings = Settings()


# ============================================================================
# Request/Response Models
# ============================================================================

class CommentRequest(BaseModel):
    """Request model for single comment."""
    text: str = Field(..., min_length=1, max_length=settings.MAX_TEXT_LENGTH)
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "Sản phẩm này tốt lắm!"
                }
            ]
        }
    }


class BatchCommentRequest(BaseModel):
    """Request model for batch comments."""
    texts: List[str] = Field(..., min_length=1, max_length=settings.MAX_BATCH_SIZE)


class PredictionResult(BaseModel):
    """Prediction result for a single comment."""
    text: str
    predicted_class: str  # CLEAN, OFFENSIVE, or HATE
    predicted_label: int  # 0, 1, or 2
    probabilities: dict  # {"CLEAN": 0.x, "OFFENSIVE": 0.x, "HATE": 0.x}
    confidence: float  # Confidence of predicted class
    is_flagged: bool  # True if OFFENSIVE or HATE


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
        if settings.FORCE_CPU:
            self.device = torch.device("cpu")
            print("Forcing CPU usage (FORCE_CPU=true)")
        else:
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
    
    def predict(self, text: str) -> PredictionResult:
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
            logits = outputs["logits"][0]
            probs = torch.softmax(logits, dim=0).cpu().numpy()
        
        # Get prediction
        label_names = self.config.get("label_names", ["CLEAN", "OFFENSIVE", "HATE"])
        pred_label = int(probs.argmax())
        pred_class = label_names[pred_label]
        confidence = float(probs[pred_label])
        
        # Create result
        return PredictionResult(
            text=text,
            predicted_class=pred_class,
            predicted_label=pred_label,
            probabilities={
                label_names[i]: float(probs[i]) 
                for i in range(len(label_names))
            },
            confidence=confidence,
            is_flagged=(pred_label > 0)  # OFFENSIVE or HATE
        )
    
    def predict_batch(self, texts: List[str]) -> List[PredictionResult]:
        """Make predictions for a batch of texts."""
        return [self.predict(text) for text in texts]


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
        result = model_manager.predict(request.text)
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
        results = model_manager.predict_batch(request.texts)
        
        # Calculate summary
        total = len(results)
        flagged = sum(1 for r in results if r.is_flagged)
        clean = sum(1 for r in results if r.predicted_class == "CLEAN")
        offensive = sum(1 for r in results if r.predicted_class == "OFFENSIVE")
        hate = sum(1 for r in results if r.predicted_class == "HATE")
        
        summary = {
            "total": total,
            "flagged": flagged,
            "flagged_percentage": flagged / total * 100 if total > 0 else 0,
            "clean_count": clean,
            "offensive_count": offensive,
            "hate_count": hate,
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
    """Get information about prediction classes."""
    return {
        "task": "3-class classification",
        "classes": [
            {
                "label": 0,
                "name": "CLEAN",
                "description": "Normal, non-toxic comment",
            },
            {
                "label": 1,
                "name": "OFFENSIVE",
                "description": "Toxic behavior or offensive language (bad words like đụ, vl, etc.)",
            },
            {
                "label": 2,
                "name": "HATE",
                "description": "Targeted hate speech against groups (ethnicity, religion, etc.)",
            },
        ],
        "note": "Each comment is assigned exactly one class. OFFENSIVE and HATE are considered flagged."
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
