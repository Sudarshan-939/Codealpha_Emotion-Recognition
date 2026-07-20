"""
Dataset download and preprocessing pipeline.
Supports RAVDESS, TESS, and EMO-DB datasets from Kaggle.
"""
import os
import json
import argparse
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Tuple
import logging

from app.config import (
    RAW_DATA_DIR, FEATURES_DIR, SAMPLE_RATE,
    RANDOM_SEED, N_MELS, HOP_LENGTH, N_MFCC
)
from app.utils.label_map import normalize_emotion, EMOTION_TO_IDX
from app.utils.audio_utils import preprocess_audio, augment_audio
from app.utils.feature_extraction import extract_mfcc, extract_mel_spectrogram

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─── Dataset-specific metadata parsers ───

def parse_ravdess_filename(filename: str) -> Dict:
    """Parse RAVDESS filename: 03-01-01-01-01-01-01.wav
    Modality-VocalChannel-Emotion-Intensity-Statement-Repetition-Actor"""
    parts = filename.replace(".wav", "").split("-")
    return {
        "modality": parts[0],
        "vocal_channel": parts[1],
        "emotion_code": parts[2],
        "intensity": parts[3],
        "statement": parts[4],
        "repetition": parts[5],
        "actor": parts[6],
        "gender": "female" if int(parts[6]) % 2 == 0 else "male",
    }


def parse_tess_filename(filename: str) -> Dict:
    """Parse TESS filename: OAF_back_angry.wav or YAF_back_angry.wav"""
    parts = filename.replace(".wav", "").split("_")
    speaker = parts[0]  # OAF or YAF
    emotion_word = parts[-1]
    return {
        "speaker": speaker,
        "age_group": "older" if speaker == "OAF" else "younger",
        "emotion_word": emotion_word,
    }


def parse_emodb_filename(filename: str) -> Dict:
    """Parse EMO-DB filename: 03a01Fa.wav → emotion code is 5th char"""
    code = filename[5] if len(filename) >= 6 else ""
    return {
        "emotion_code": code,
        "actor": filename[:2],
    }


# ─── Download ───

def download_datasets():
    """Download datasets from Kaggle."""
    try:
        import kagglehub
    except ImportError:
        logger.error("kagglehub not installed. Run: pip install kagglehub")
        return

    datasets = {
        "ravdess": "uwrfkaggler/ravdess-emotional-speech-audio",
        "tess": "ejlok1/toronto-emotional-speech-set-tess",
        "emodb": "piyushagni5/berlin-database-of-emotional-speech-emodb",
    }

    for name, path in datasets.items():
        dest = RAW_DATA_DIR / name
        if dest.exists() and any(dest.iterdir()):
            logger.info(f"Dataset '{name}' already exists at {dest}, skipping download.")
            continue
        logger.info(f"Downloading {name} from Kaggle...")
        try:
            download_path = kagglehub.dataset_download(path, force_download=False)
            # Move to our structure
            import shutil
            if dest.exists():
                shutil.rmtree(dest)
            shutil.move(str(download_path), str(dest))
            logger.info(f"Downloaded {name} → {dest}")
        except Exception as e:
            logger.error(f"Failed to download {name}: {e}")


# ─── Metadata scan ───

def scan_dataset_metadata(dataset_name: str) -> pd.DataFrame:
    """Scan a dataset directory and return a DataFrame of audio file metadata."""
    raw_dir = RAW_DATA_DIR / dataset_name
    records = []

    for wav_path in sorted(raw_dir.rglob("*.wav")):
        fname = wav_path.name
        rel_path = str(wav_path.relative_to(RAW_DATA_DIR))

        if dataset_name == "ravdess":
            meta = parse_ravdess_filename(fname)
            emotion_raw = meta["emotion_code"]
        elif dataset_name == "tess":
            meta = parse_tess_filename(fname)
            emotion_raw = meta["emotion_word"]
        elif dataset_name == "emodb":
            meta = parse_emodb_filename(fname)
            emotion_raw = meta["emotion_code"]
        else:
            continue

        canonical = normalize_emotion(emotion_raw, dataset_name)
        if canonical is None:
            logger.warning(f"Could not map emotion '{emotion_raw}' for {rel_path}")
            continue

        records.append({
            "file_path": str(wav_path),
            "relative_path": rel_path,
            "dataset": dataset_name,
            "emotion_raw": emotion_raw,
            "emotion": canonical,
            "emotion_idx": EMOTION_TO_IDX[canonical],
            **meta,
        })

    return pd.DataFrame(records)


def scan_all_datasets() -> pd.DataFrame:
    """Scan all available datasets and combine metadata."""
    frames = []
    for ds_name in ["ravdess", "tess", "emodb"]:
        ds_dir = RAW_DATA_DIR / ds_name
        if ds_dir.exists():
            logger.info(f"Scanning {ds_name}...")
            df = scan_dataset_metadata(ds_name)
            logger.info(f"  Found {len(df)} files")
            frames.append(df)
        else:
            logger.warning(f"Dataset '{ds_name}' not found at {ds_dir}")

    if frames:
        return pd.concat(frames, ignore_index=True)
    return pd.DataFrame()


# ─── Feature extraction & caching ───

def extract_features_for_dataset(
    metadata: pd.DataFrame,
    output_dir: Path = FEATURES_DIR,
    augment: bool = True,
    n_augmented: int = 2,
):
    """
    Extract and save features for all files in the metadata DataFrame.
    Optionally applies data augmentation.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    feature_records = []

    total = len(metadata)
    for i, row in metadata.iterrows():
        if (i + 1) % 50 == 0 or i == 0:
            logger.info(f"  Processing {i+1}/{total}: {row['file_path']}")

        try:
            y, sr = preprocess_audio(row["file_path"])

            # Extract core features
            mfcc = extract_mfcc(y, sr)
            mel = extract_mel_spectrogram(y, sr)

            # Save as numpy arrays
            file_id = Path(row["relative_path"]).stem.replace("/", "_")
            np.save(output_dir / f"{file_id}_mfcc.npy", mfcc)
            np.save(output_dir / f"{file_id}_mel.npy", mel)

            feature_records.append({
                "file_id": file_id,
                "file_path": row["file_path"],
                "dataset": row["dataset"],
                "emotion": row["emotion"],
                "emotion_idx": row["emotion_idx"],
                "mfcc_path": str(output_dir / f"{file_id}_mfcc.npy"),
                "mel_path": str(output_dir / f"{file_id}_mel.npy"),
                "augmented": False,
            })

            # Data augmentation
            if augment:
                for aug_i in range(n_augmented):
                    y_aug = augment_audio(y, sr)
                    mfcc_aug = extract_mfcc(y_aug, sr)
                    mel_aug = extract_mel_spectrogram(y_aug, sr)

                    aug_id = f"{file_id}_aug{aug_i}"
                    np.save(output_dir / f"{aug_id}_mfcc.npy", mfcc_aug)
                    np.save(output_dir / f"{aug_id}_mel.npy", mel_aug)

                    feature_records.append({
                        "file_id": aug_id,
                        "file_path": row["file_path"],
                        "dataset": row["dataset"],
                        "emotion": row["emotion"],
                        "emotion_idx": row["emotion_idx"],
                        "mfcc_path": str(output_dir / f"{aug_id}_mfcc.npy"),
                        "mel_path": str(output_dir / f"{aug_id}_mel.npy"),
                        "augmented": True,
                    })

        except Exception as e:
            logger.error(f"  Error processing {row['file_path']}: {e}")
            continue

    # Save feature manifest
    manifest_df = pd.DataFrame(feature_records)
    manifest_path = output_dir / "feature_manifest.csv"
    manifest_df.to_csv(manifest_path, index=False)
    logger.info(f"Feature manifest saved to {manifest_path} ({len(manifest_df)} entries)")

    return manifest_df


def get_class_weights(metadata: pd.DataFrame) -> Dict[int, float]:
    """Compute class weights for imbalanced datasets."""
    counts = metadata["emotion_idx"].value_counts().sort_index()
    total = len(metadata)
    n_classes = len(counts)
    weights = {}
    for idx, count in counts.items():
        weights[int(idx)] = total / (n_classes * count)
    return weights


# ─── CLI ───

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SER Data Pipeline")
    parser.add_argument("--download", action="store_true", help="Download datasets from Kaggle")
    parser.add_argument("--scan", action="store_true", help="Scan and print dataset metadata")
    parser.add_argument("--extract", action="store_true", help="Extract features from datasets")
    parser.add_argument("--no-augment", action="store_true", help="Skip data augmentation")
    args = parser.parse_args()

    if args.download:
        download_datasets()

    if args.scan:
        meta = scan_all_datasets()
        print(f"\nTotal files: {len(meta)}")
        if not meta.empty:
            print(f"\nEmotion distribution:")
            print(meta["emotion"].value_counts().to_string())
            print(f"\nDataset distribution:")
            print(meta["dataset"].value_counts().to_string())

    if args.extract:
        meta = scan_all_datasets()
        if not meta.empty:
            extract_features_for_dataset(meta, augment=not args.no_augment)
