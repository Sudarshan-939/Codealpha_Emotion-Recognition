"""
Unified label mapping across RAVDESS, TESS, and EMO-DB datasets.
Normalizes all emotion labels to a shared 8-class taxonomy.
"""
from typing import Dict, Optional

# Canonical 8-class emotion taxonomy
CANONICAL_EMOTIONS = [
    "neutral", "calm", "happy", "sad", "angry", "fearful", "disgust", "surprised"
]

EMOTION_TO_IDX: Dict[str, int] = {e: i for i, e in enumerate(CANONICAL_EMOTIONS)}
IDX_TO_EMOTION: Dict[int, str] = {i: e for i, e in enumerate(CANONICAL_EMOTIONS)}

# ── RAVDESS filename conventions ──
# 01 = neutral, 02 = calm, 03 = happy, 04 = sad, 05 = angry,
# 06 = fearful, 07 = disgust, 08 = surprised
RAVDESS_MAP: Dict[str, str] = {
    "01": "neutral",
    "02": "calm",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fearful",
    "07": "disgust",
    "08": "surprised",
}

# ── TESS conventions ──
# Filenames contain the emotion word directly
TESS_MAP: Dict[str, str] = {
    "neutral": "neutral",
    "happy": "happy",
    "happiness": "happy",
    "sad": "sad",
    "sadness": "sad",
    "angry": "angry",
    "anger": "angry",
    "fear": "fearful",
    "disgust": "disgust",
    "pleasant_surprise": "surprised",
    "surprise": "surprised",
}

# ── EMO-DB conventions ──
# Three-letter codes in filenames: W=anger, E=disgust, A=fear,
# F=happiness, T=sadness, N=neutral, B=boredom
EMODB_MAP: Dict[str, str] = {
    "W": "angry",
    "E": "disgust",
    "A": "fearful",
    "F": "happy",
    "T": "sad",
    "N": "neutral",
    "B": "neutral",  # boredom → neutral
}


def normalize_emotion(raw_label: str, dataset: str) -> Optional[str]:
    """Map a dataset-specific emotion label to the canonical taxonomy."""
    raw_lower = raw_label.strip().lower()

    if dataset == "ravdess":
        return RAVDESS_MAP.get(raw_lower)
    elif dataset == "tess":
        return TESS_MAP.get(raw_lower)
    elif dataset == "emodb":
        # EMO-DB uses uppercase letter codes
        return EMODB_MAP.get(raw_label.strip().upper())
    else:
        # Fallback: try direct match
        if raw_lower in EMOTION_TO_IDX:
            return raw_lower
    return None


def emotion_to_index(emotion: str) -> int:
    """Convert canonical emotion string to integer index."""
    return EMOTION_TO_IDX[emotion]


def index_to_emotion(idx: int) -> str:
    """Convert integer index to canonical emotion string."""
    return IDX_TO_EMOTION[idx]
