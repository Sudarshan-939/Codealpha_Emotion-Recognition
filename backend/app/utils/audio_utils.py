"""
Audio preprocessing utilities for Speech Emotion Recognition.
Handles resampling, silence trimming, normalization, and augmentation.
"""
import numpy as np
import librosa
import soundfile as sf
from pathlib import Path
from typing import Optional, Tuple

from app.config import SAMPLE_RATE, MAX_AUDIO_DURATION, HOP_LENGTH, N_FFT


def load_audio(
    file_path: str | Path,
    target_sr: int = SAMPLE_RATE,
    max_duration: float = MAX_AUDIO_DURATION,
) -> Tuple[np.ndarray, int]:
    """
    Load an audio file, resample to target_sr, and optionally trim to max_duration.

    Returns:
        (audio_array, sample_rate)
    """
    y, sr = librosa.load(str(file_path), sr=target_sr, mono=True)

    # Trim to max duration
    max_samples = int(max_duration * target_sr)
    if len(y) > max_samples:
        y = y[:max_samples]

    return y, target_sr


def trim_silence(
    y: np.ndarray,
    top_db: int = 25,
) -> np.ndarray:
    """Remove leading/trailing silence from audio."""
    trimmed, _ = librosa.effects.trim(y, top_db=top_db)
    return trimmed


def normalize_audio(y: np.ndarray) -> np.ndarray:
    """Peak-normalize audio to [-1, 1]."""
    peak = np.max(np.abs(y))
    if peak > 0:
        return y / peak
    return y


def preprocess_audio(
    file_path: str | Path,
    target_sr: int = SAMPLE_RATE,
    max_duration: float = MAX_AUDIO_DURATION,
    trim: bool = True,
    normalize: bool = True,
) -> Tuple[np.ndarray, int]:
    """
    Full audio preprocessing pipeline:
    1. Load & resample
    2. Trim silence
    3. Normalize
    4. Pad or truncate to fixed length
    """
    y, sr = load_audio(file_path, target_sr, max_duration)

    if trim:
        y = trim_silence(y)

    if normalize:
        y = normalize_audio(y)

    return y, sr


def augment_audio(
    y: np.ndarray,
    sr: int,
    pitch_shift_range: Tuple[float, float] = (-2.0, 2.0),
    time_stretch_range: Tuple[float, float] = (0.85, 1.15),
    noise_factor: float = 0.005,
) -> np.ndarray:
    """
    Apply random augmentation to an audio sample.
    Returns one randomly augmented version.
    """
    aug_type = np.random.choice(["pitch", "stretch", "noise", "none"], p=[0.3, 0.3, 0.3, 0.1])

    if aug_type == "pitch":
        n_steps = np.random.uniform(*pitch_shift_range)
        return librosa.effects.pitch_shift(y, sr=sr, n_steps=n_steps)

    elif aug_type == "stretch":
        rate = np.random.uniform(*time_stretch_range)
        stretched = librosa.effects.time_stretch(y, rate=rate)
        # Match length
        if len(stretched) > len(y):
            stretched = stretched[:len(y)]
        else:
            stretched = np.pad(stretched, (0, len(y) - len(stretched)))
        return stretched

    elif aug_type == "noise":
        noise = np.random.randn(len(y)) * noise_factor
        return y + noise

    return y
