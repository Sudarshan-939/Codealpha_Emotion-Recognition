"""
API Router for prediction endpoints.
"""
import time
import random
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Optional

from app.services.prediction_service import predict_emotion, predict_with_insight, list_available_models

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["prediction"])

# Demo emotions for fallback when no model is trained yet
_DEMO_EMOTIONS = ["neutral", "calm", "happy", "sad", "angry", "fearful", "disgust", "surprised"]


def _make_demo_prediction(architecture: str) -> Dict:
    """Return a realistic-looking demo prediction when no model is available."""
    # Pick a random dominant emotion
    dominant = random.choice(_DEMO_EMOTIONS)
    scores = {e: round(random.uniform(0.02, 0.15), 4) for e in _DEMO_EMOTIONS}
    dominant_score = round(random.uniform(0.45, 0.85), 4)
    scores[dominant] = dominant_score
    # Normalise so they sum to 1
    total = sum(scores.values())
    scores = {e: round(v / total, 4) for e, v in scores.items()}
    return {
        "emotion": dominant,
        "confidence": scores[dominant],
        "per_class_scores": scores,
        "model_architecture": f"{architecture} (demo — no model trained)",
        "features_summary": {},
        "insight": (
            f"[Demo Mode] No trained model was found. "
            f"This is a simulated result showing the '{dominant}' emotion. "
            f"Train a model first by running `python -m app.training` in the backend directory."
        ),
    }

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a"}
MAX_FILE_SIZE_MB = 25


class PredictionResponse(BaseModel):
    emotion: str
    confidence: float
    per_class_scores: Dict[str, float]
    model_architecture: str
    processing_time_ms: float


class InsightResponse(BaseModel):
    emotion: str
    confidence: float
    per_class_scores: Dict[str, float]
    model_architecture: str
    insight: str
    processing_time_ms: float


class HealthResponse(BaseModel):
    status: str
    version: str
    models_available: int


class ModelInfo(BaseModel):
    name: str
    path: str
    status: str
    test_accuracy: Optional[float] = None
    macro_f1: Optional[float] = None


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(..., description="Audio file (.wav, .mp3, .ogg, .flac, .m4a)"),
    architecture: str = Query(default="production", description="Model architecture to use"),
):
    """
    Upload an audio file and get the predicted emotion with confidence scores.
    
    - **file**: Audio file to analyze
    - **architecture**: Model to use ('production', 'cnn', 'lstm', 'cnn_lstm_hybrid')
    """
    start_time = time.time()
    
    # Validate file extension
    if file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    else:
        file.filename = "audio.wav"
    
    # Validate file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {size_mb:.1f}MB. Maximum: {MAX_FILE_SIZE_MB}MB"
        )
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")
    
    try:
        result = predict_emotion(content, file.filename, architecture)
        elapsed = (time.time() - start_time) * 1000
        result["processing_time_ms"] = round(elapsed, 2)
        return PredictionResponse(**result)
    except FileNotFoundError:
        # No model trained yet — return a demo prediction
        logger.warning("No model found; returning demo prediction")
        demo = _make_demo_prediction(architecture)
        demo["processing_time_ms"] = round((time.time() - start_time) * 1000, 2)
        return PredictionResponse(**{k: v for k, v in demo.items() if k in PredictionResponse.model_fields})
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict/insight", response_model=InsightResponse)
async def predict_with_llm_insight(
    file: UploadFile = File(..., description="Audio file (.wav, .mp3, .ogg, .flac, .m4a)"),
    architecture: str = Query(default="production", description="Model architecture to use"),
):
    """
    Upload an audio file and get the predicted emotion with an LLM-generated
    plain-language insight explaining the acoustic cues.
    
    - **file**: Audio file to analyze
    - **architecture**: Model to use
    """
    start_time = time.time()
    
    # Validate file extension
    if file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    else:
        file.filename = "audio.wav"
    
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {size_mb:.1f}MB. Maximum: {MAX_FILE_SIZE_MB}MB"
        )
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")
    
    try:
        result = predict_with_insight(content, file.filename, architecture)
        elapsed = (time.time() - start_time) * 1000
        result["processing_time_ms"] = round(elapsed, 2)
        return InsightResponse(**result)
    except FileNotFoundError:
        # No model trained yet — return a demo prediction with insight
        logger.warning("No model found; returning demo insight prediction")
        demo = _make_demo_prediction(architecture)
        demo["processing_time_ms"] = round((time.time() - start_time) * 1000, 2)
        return InsightResponse(**{k: v for k, v in demo.items() if k in InsightResponse.model_fields})
    except Exception as e:
        logger.exception("Prediction with insight failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/models", response_model=list[ModelInfo])
async def get_available_models():
    """
    List all available trained models with their performance metrics.
    """
    models = list_available_models()
    return [
        ModelInfo(name=name, **info)
        for name, info in models.items()
    ]


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Service health check endpoint.
    """
    models = list_available_models()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        models_available=len(models),
    )
