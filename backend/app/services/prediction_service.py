"""
Prediction service: loads a trained model and performs inference on audio input.
"""
import tempfile
import numpy as np
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple

import librosa
from tensorflow import keras

from app.config import MODELS_DIR, EMOTIONS, NUM_CLASSES, SAMPLE_RATE
from app.utils.audio_utils import preprocess_audio
from app.utils.feature_extraction import extract_mfcc, extract_mel_spectrogram, get_features_summary
from app.services.nvidia_llm_service import generate_emotion_insight

logger = logging.getLogger(__name__)

# Global model cache
_models: Dict[str, keras.Model] = {}


def clear_model_cache():
    """Clear cached models in memory so updated models on disk are reloaded."""
    global _models
    _models.clear()


def get_model(architecture: str = "production") -> keras.Model:
    """Load and cache a trained model."""
    global _models

    if architecture in _models:
        return _models[architecture]

    if architecture == "production":
        model_path = MODELS_DIR / "production" / "model.keras"
    else:
        model_path = MODELS_DIR / f"{architecture}_best.keras"

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found at {model_path}. "
            f"Train a model first: python -m app.training"
        )

    model = keras.models.load_model(str(model_path))
    _models[architecture] = model
    logger.info(f"Loaded model: {architecture} from {model_path}")
    return model


def predict_emotion(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    architecture: str = "production",
) -> Dict:
    """
    Predict emotion from raw audio bytes.

    Args:
        audio_bytes: Raw audio file bytes (.wav, .mp3)
        filename: Original filename (for format detection)
        architecture: Model architecture to use

    Returns:
        Dictionary with prediction results
    """
    suffix = Path(filename).suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        y, sr = preprocess_audio(tmp_path)
        model = get_model(architecture)
        input_shape = model.input_shape
        logger.info(f"Model input shape: {input_shape}")

        if len(input_shape) == 4:
            # CNN model: 2D spectrogram (1, 128, 128, 1)
            features = extract_mel_spectrogram(y, sr)
            from scipy.ndimage import zoom
            target_h = input_shape[1] if input_shape[1] is not None else 128
            target_w = input_shape[2] if input_shape[2] is not None else 128
            zoom_factors = (
                target_h / features.shape[0],
                target_w / features.shape[1]
            )
            features = zoom(features, zoom_factors, order=1)
            features = features[np.newaxis, ..., np.newaxis]
        else:
            # LSTM / Hybrid model: MFCC + Deltas (1, 128, 120)
            mfcc = extract_mfcc(y, sr)
            delta = librosa.feature.delta(mfcc)
            delta2 = librosa.feature.delta(mfcc, order=2)
            features = np.vstack([mfcc, delta, delta2]).T  # (time, 120)
            
            target_time = input_shape[1] if input_shape[1] is not None else 128
            if features.shape[0] > target_time:
                features = features[:target_time, :]
            elif features.shape[0] < target_time:
                pad = target_time - features.shape[0]
                features = np.pad(features, ((0, pad), (0, 0)), mode="constant")

            features = features[np.newaxis, ...]

        predictions = model.predict(features, verbose=0)[0]
        pred_idx = int(np.argmax(predictions))
        confidence = float(predictions[pred_idx])

        per_class = {
            EMOTIONS[i]: float(predictions[i])
            for i in range(NUM_CLASSES)
        }

        raw_features = {
            "mfcc": extract_mfcc(y, sr),
            "mel_spectrogram": extract_mel_spectrogram(y, sr),
        }
        features_summary = get_features_summary(raw_features)

        result = {
            "emotion": EMOTIONS[pred_idx],
            "confidence": confidence,
            "per_class_scores": per_class,
            "features_summary": features_summary,
            "model_architecture": architecture,
        }

        return result

    finally:
        import os
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def predict_with_insight(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    architecture: str = "production",
) -> Dict:
    """Predict emotion and generate LLM-powered insight."""
    prediction = predict_emotion(audio_bytes, filename, architecture)

    try:
        insight = generate_emotion_insight(
            emotion=prediction["emotion"],
            confidence=prediction["confidence"],
            features_summary=prediction["features_summary"],
        )
    except Exception as e:
        logger.warning(f"Insight generation failed: {e}")
        insight = (
            f"The model predicted '{prediction['emotion']}' with "
            f"{prediction['confidence']:.0%} confidence."
        )

    prediction["insight"] = insight
    return prediction


def list_available_models() -> Dict[str, Dict]:
    """List all available trained models."""
    models_info = {}

    production_path = MODELS_DIR / "production" / "model.keras"
    if production_path.exists():
        models_info["production"] = {
            "path": str(production_path),
            "status": "available",
        }

    for arch in ["cnn", "lstm", "cnn_lstm_hybrid"]:
        model_path = MODELS_DIR / f"{arch}_best.keras"
        if model_path.exists():
            models_info[arch] = {
                "path": str(model_path),
                "status": "available",
            }

    results_path = MODELS_DIR / "training_results.json"
    if results_path.exists():
        import json
        with open(results_path) as f:
            results = json.load(f)
        for arch, info in results.items():
            if arch in models_info:
                models_info[arch].update({
                    "test_accuracy": info.get("test_accuracy"),
                    "macro_f1": info.get("macro_f1"),
                })

    return models_info
