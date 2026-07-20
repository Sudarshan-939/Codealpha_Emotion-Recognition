"""
Speech Emotion Recognition - Application Configuration
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
RAW_DATA_DIR = Path(os.getenv("RAW_DATA_DIR", str(DATA_DIR / "raw")))
FEATURES_DIR = Path(os.getenv("FEATURES_DIR", str(DATA_DIR / "features")))
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(BASE_DIR / "saved_models")))

# --- API ---
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:80,http://localhost").split(",")

# --- NVIDIA LLM ---
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "meta/llama-3.1-70b-instruct"

# --- Audio Processing ---
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "16000"))
MAX_AUDIO_DURATION = float(os.getenv("MAX_AUDIO_DURATION", "10"))
N_MFCC = int(os.getenv("N_MFCC", "40"))
N_MELS = int(os.getenv("N_MELS", "128"))
HOP_LENGTH = int(os.getenv("HOP_LENGTH", "512"))
N_FFT = 2048

# --- Training ---
RANDOM_SEED = int(os.getenv("RANDOM_SEED", "42"))
TEST_SIZE = float(os.getenv("TEST_SIZE", "0.2"))
VALIDATION_SIZE = float(os.getenv("VALIDATION_SIZE", "0.15"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))
EPOCHS = int(os.getenv("EPOCHS", "100"))
LEARNING_RATE = float(os.getenv("LEARNING_RATE", "0.001"))

# --- Dataset Emotions ---
EMOTIONS = ["neutral", "calm", "happy", "sad", "angry", "fearful", "disgust", "surprised"]
NUM_CLASSES = len(EMOTIONS)
