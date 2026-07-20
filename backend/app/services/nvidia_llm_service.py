"""
NVIDIA LLM Integration Service.
Uses NVIDIA NIM-compatible OpenAI client to generate natural-language
explanations of speech emotion predictions.
"""
from openai import OpenAI
from typing import Dict, Optional
import logging

from app.config import NVIDIA_API_KEY, NVIDIA_BASE_URL, NVIDIA_MODEL

logger = logging.getLogger(__name__)

_client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    """Lazy-initialize and return the NVIDIA OpenAI client."""
    global _client
    if _client is None:
        if not NVIDIA_API_KEY:
            raise ValueError(
                "NVIDIA_API_KEY not set. Add it to your .env file. "
                "See .env.example for reference."
            )
        _client = OpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=NVIDIA_API_KEY,
        )
    return _client


def generate_emotion_insight(
    emotion: str,
    confidence: float,
    features_summary: Dict[str, float],
    max_retries: int = 2,
) -> str:
    """
    Generate a plain-language explanation of what vocal cues likely
    drove the model's emotion prediction.

    Args:
        emotion: Predicted emotion label (e.g., "angry")
        confidence: Prediction confidence (0.0 – 1.0)
        features_summary: Dictionary of acoustic feature statistics
        max_retries: Number of retry attempts on failure

    Returns:
        Natural language insight string
    """
    client = get_client()

    # Build a human-readable features summary
    features_text = ", ".join(
        f"{k}: {v:.4f}" for k, v in features_summary.items()
    )

    prompt = (
        f"A speech emotion recognition model predicted the speaker is feeling "
        f"'{emotion}' with {confidence:.0%} confidence based on the following "
        f"acoustic features from their speech: {features_text}.\n\n"
        f"In 2-3 clear, concise sentences, explain in plain language what vocal "
        f"cues (pitch, energy, speaking rate, spectral patterns, etc.) likely "
        f"drove this prediction. Be specific about the acoustic markers and "
        f"why they correlate with the {emotion} emotion. Write as if explaining "
        f"to someone unfamiliar with speech processing."
    )

    for attempt in range(max_retries + 1):
        try:
            completion = client.chat.completions.create(
                model=NVIDIA_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful speech science expert who explains "
                            "acoustic emotion analysis in accessible, plain language. "
                            "Be concise and specific about vocal cues."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=200,
            )
            return completion.choices[0].message.content.strip()

        except Exception as e:
            logger.warning(f"LLM attempt {attempt + 1} failed: {e}")
            if attempt == max_retries:
                # Fallback: return a basic insight without LLM
                return (
                    f"The model detected '{emotion}' with {confidence:.0%} confidence. "
                    f"The acoustic profile (energy: {features_summary.get('avg_rms_energy', 'N/A')}, "
                    f"speech rate: {features_summary.get('avg_zcr', 'N/A')}) is consistent with "
                    f"this emotional state."
                )

    return "Insight generation unavailable."
