"""
Feature extraction for Speech Emotion Recognition.
Extracts MFCC, delta-MFCC, mel-spectrogram, chroma, ZCR, and RMS energy.
"""
import numpy as np
import librosa
from typing import Dict, Optional

from app.config import (
    SAMPLE_RATE, N_MFCC, N_MELS, HOP_LENGTH, N_FFT
)


def extract_mfcc(y: np.ndarray, sr: int) -> np.ndarray:
    """Extract MFCC features (N_MFCC coefficients × time frames)."""
    mfcc = librosa.feature.mfcc(
        y=y, sr=sr, n_mfcc=N_MFCC,
        hop_length=HOP_LENGTH, n_fft=N_FFT
    )
    return mfcc  # shape: (n_mfcc, time)


def extract_mfcc_deltas(y: np.ndarray, sr: int) -> np.ndarray:
    """Extract MFCC + first and second order deltas."""
    mfcc = extract_mfcc(y, sr)
    delta = librosa.feature.delta(mfcc)
    delta2 = librosa.feature.delta(mfcc, order=2)
    return np.vstack([mfcc, delta, delta2])  # shape: (3*n_mfcc, time)


def extract_mel_spectrogram(y: np.ndarray, sr: int) -> np.ndarray:
    """Extract log-mel spectrogram."""
    mel_spec = librosa.feature.melspectrogram(
        y=y, sr=sr, n_mels=N_MELS,
        hop_length=HOP_LENGTH, n_fft=N_FFT
    )
    log_mel = librosa.power_to_db(mel_spec, ref=np.max)
    return log_mel  # shape: (n_mels, time)


def extract_chroma(y: np.ndarray, sr: int) -> np.ndarray:
    """Extract chroma features."""
    chroma = librosa.feature.chroma_stft(
        y=y, sr=sr,
        hop_length=HOP_LENGTH, n_fft=N_FFT
    )
    return chroma  # shape: (12, time)


def extract_zcr(y: np.ndarray) -> np.ndarray:
    """Extract zero-crossing rate."""
    zcr = librosa.feature.zero_crossing_rate(y, hop_length=HOP_LENGTH)
    return zcr  # shape: (1, time)


def extract_rms(y: np.ndarray) -> np.ndarray:
    """Extract RMS energy."""
    rms = librosa.feature.rms(y=y, hop_length=HOP_LENGTH)
    return rms  # shape: (1, time)


def extract_all_features(
    y: np.ndarray,
    sr: int,
    include_chroma: bool = True,
    include_zcr: bool = True,
    include_rms: bool = True,
) -> Dict[str, np.ndarray]:
    """
    Extract all audio features and return as a dictionary.

    Returns dict with keys: mfcc, mfcc_deltas, mel_spectrogram, (optionally) chroma, zcr, rms
    """
    features = {
        "mfcc": extract_mfcc(y, sr),
        "mfcc_deltas": extract_mfcc_deltas(y, sr),
        "mel_spectrogram": extract_mel_spectrogram(y, sr),
    }

    if include_chroma:
        features["chroma"] = extract_chroma(y, sr)
    if include_zcr:
        features["zcr"] = extract_zcr(y)
    if include_rms:
        features["rms"] = extract_rms(y)

    return features


def get_features_summary(features: Dict[str, np.ndarray]) -> Dict[str, float]:
    """
    Compute a summary dict of extracted features for LLM insight generation.
    Returns scalar statistics that describe the audio's acoustic profile.
    """
    summary = {}

    # MFCC statistics
    mfcc = features.get("mfcc")
    if mfcc is not None:
        summary["mfcc_mean"] = float(np.mean(mfcc))
        summary["mfcc_std"] = float(np.std(mfcc))
        summary["mfcc_range"] = float(np.ptp(mfcc))

    # Mel spectrogram statistics
    mel = features.get("mel_spectrogram")
    if mel is not None:
        summary["mel_energy_mean"] = float(np.mean(mel))
        summary["mel_energy_std"] = float(np.std(mel))

    # ZCR → speech rate proxy
    zcr = features.get("zcr")
    if zcr is not None:
        summary["avg_zcr"] = float(np.mean(zcr))

    # RMS → loudness
    rms = features.get("rms")
    if rms is not None:
        summary["avg_rms_energy"] = float(np.mean(rms))
        summary["rms_std"] = float(np.std(rms))

    # Chroma
    chroma = features.get("chroma")
    if chroma is not None:
        summary["chroma_mean"] = float(np.mean(chroma))

    return summary
