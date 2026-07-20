"""
Model training pipeline for Speech Emotion Recognition.
Trains and evaluates CNN, LSTM, and CNN-LSTM hybrid architectures.
"""
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging

import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

from app.config import (
    FEATURES_DIR, MODELS_DIR, RANDOM_SEED, TEST_SIZE, VALIDATION_SIZE,
    BATCH_SIZE, EPOCHS, LEARNING_RATE, NUM_CLASSES, EMOTIONS
)
from app.models.architectures import build_model, compile_model, get_callbacks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_features(
    manifest_path: Path = FEATURES_DIR / "feature_manifest.csv",
    feature_type: str = "mfcc",
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Load features from the manifest.
    
    Returns:
        (X, y, emotion_names)
    """
    if not manifest_path.exists():
        raise FileNotFoundError(f"Feature manifest not found: {manifest_path}")
    
    manifest = pd.read_csv(manifest_path)
    
    X_list = []
    y_list = []
    emotions = []
    
    for _, row in manifest.iterrows():
        path_col = f"{feature_type}_path"
        if path_col not in row or pd.isna(row[path_col]):
            continue
        
        feat_path = Path(row[path_col])
        if not feat_path.exists():
            continue
        
        feat = np.load(str(feat_path))
        X_list.append(feat)
        y_list.append(row["emotion_idx"])
        emotions.append(row["emotion"])
    
    return X_list, np.array(y_list), emotions


def prepare_sequences(
    X_list: List[np.ndarray],
    target_time_steps: Optional[int] = None,
) -> np.ndarray:
    """
    Pad/truncate feature sequences to uniform length.
    """
    if not X_list:
        raise ValueError("No features to prepare")
    
    # Find max time steps
    max_t = max(x.shape[1] if x.ndim > 1 else x.shape[0] for x in X_list)
    
    if target_time_steps is not None:
        max_t = min(max_t, target_time_steps)
    
    prepared = []
    for x in X_list:
        if x.ndim == 1:
            x = x.reshape(1, -1)
        
        # x shape: (n_features, time)
        t = x.shape[1]
        if t > max_t:
            x = x[:, :max_t]
        elif t < max_t:
            pad_width = max_t - t
            x = np.pad(x, ((0, 0), (0, pad_width)), mode="constant")
        
        prepared.append(x)
    
    return np.array(prepared)


def prepare_cnn_data(
    X_list: List[np.ndarray],
    target_shape: Tuple[int, int] = (128, 128),
) -> np.ndarray:
    """
    Prepare data for CNN: reshape features into 2D spectrogram-like images.
    """
    prepared = []
    for x in X_list:
        # Resize to target shape using numpy interpolation
        from scipy.ndimage import zoom
        
        if x.ndim == 1:
            x = x.reshape(1, -1)
        
        # x shape: (features, time)
        zoom_factors = (
            target_shape[0] / x.shape[0],
            target_shape[1] / x.shape[1]
        )
        x_resized = zoom(x, zoom_factors, order=1)
        
        # Add channel dimension
        x_resized = x_resized[..., np.newaxis]
        prepared.append(x_resized)
    
    return np.array(prepared)


def train_and_evaluate(
    architecture: str,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    class_weights: Optional[Dict[int, float]] = None,
    save_dir: Path = MODELS_DIR,
) -> Dict:
    """
    Train a model and evaluate on test set.
    
    Returns:
        Dictionary with training history and evaluation metrics.
    """
    save_dir.mkdir(parents=True, exist_ok=True)
    model_path = save_dir / f"{architecture}_best.keras"
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Training {architecture.upper()}")
    logger.info(f"  Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
    logger.info(f"{'='*60}")
    
    # Build model
    input_shape = X_train.shape[1:]
    model = build_model(architecture, input_shape=input_shape, num_classes=NUM_CLASSES)
    model = compile_model(model, learning_rate=LEARNING_RATE)
    
    logger.info(f"Model summary:")
    model.summary(print_fn=logger.info)
    
    # Train
    callbacks = get_callbacks(
        patience=15,
        model_path=str(model_path)
    )
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1,
    )
    
    # Load best model
    model = keras.models.load_model(str(model_path))
    
    # Evaluate
    test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
    y_pred = model.predict(X_test, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    
    # Classification report
    report = classification_report(
        y_test, y_pred_classes,
        target_names=EMOTIONS[:NUM_CLASSES],
        output_dict=True,
        zero_division=0
    )
    
    cm = confusion_matrix(y_test, y_pred_classes)
    
    results = {
        "architecture": architecture,
        "test_accuracy": float(test_accuracy),
        "test_loss": float(test_loss),
        "macro_f1": report["macro avg"]["f1-score"],
        "weighted_f1": report["weighted avg"]["f1-score"],
        "per_class_f1": {EMOTIONS[i]: float(report[str(i)]["f1-score"]) for i in range(NUM_CLASSES) if str(i) in report},
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "epochs_trained": len(history.history["loss"]),
        "best_val_accuracy": float(max(history.history["val_accuracy"])),
        "model_path": str(model_path),
    }
    
    logger.info(f"\n{architecture.upper()} Results:")
    logger.info(f"  Test Accuracy: {test_accuracy:.4f}")
    logger.info(f"  Macro F1: {results['macro_f1']:.4f}")
    logger.info(f"  Weighted F1: {results['weighted_f1']:.4f}")
    
    return results, model, history


def run_training_pipeline(
    architectures: List[str] = ["cnn", "lstm", "cnn_lstm_hybrid"],
    data_dir: Path = FEATURES_DIR,
    save_dir: Path = MODELS_DIR,
) -> Dict[str, Dict]:
    """
    Full training pipeline: load data, train all architectures, compare results.
    """
    logger.info("Loading features...")
    
    # Load MFCC features
    X_list_mfcc, y, emotions = load_features(data_dir / "feature_manifest.csv", "mfcc")
    if not X_list_mfcc:
        raise ValueError("No MFCC features found. Run feature extraction first.")
    
    logger.info(f"Loaded {len(X_list_mfcc)} samples")
    
    # Compute class weights for imbalanced data
    unique, counts = np.unique(y, return_counts=True)
    total = len(y)
    class_weights = {int(c): total / (len(unique) * count) for c, count in zip(unique, counts)}
    logger.info(f"Class weights: {class_weights}")
    
    # Prepare data for different architectures
    # For CNN: 2D spectrogram images
    X_cnn = prepare_cnn_data(X_list_mfcc)
    
    # For LSTM: 3D sequences (stack MFCC + deltas)
    X_seq = prepare_sequences(X_list_mfcc)
    # For LSTM, flatten features per timestep: (batch, time, features)
    X_lstm = X_seq.transpose(0, 2, 1)  # (batch, time, features)
    
    # Split data
    np.random.seed(RANDOM_SEED)
    
    results = {}
    all_models = {}
    
    for arch in architectures:
        logger.info(f"\nPreparing data for {arch}...")
        
        if arch == "cnn":
            X = X_cnn
        else:
            X = X_lstm
        
        # Train/val/test split
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
        )
        
        relative_val = VALIDATION_SIZE / (1 - TEST_SIZE)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=relative_val, random_state=RANDOM_SEED, stratify=y_temp
        )
        
        # Train
        result, model, history = train_and_evaluate(
            arch, X_train, y_train, X_val, y_val, X_test, y_test,
            class_weights=class_weights, save_dir=save_dir
        )
        
        results[arch] = result
        all_models[arch] = model
    
    # Find best model
    best_arch = max(results, key=lambda k: results[k]["macro_f1"])
    logger.info(f"\n{'='*60}")
    logger.info(f"BEST MODEL: {best_arch.upper()}")
    logger.info(f"  Macro F1: {results[best_arch]['macro_f1']:.4f}")
    logger.info(f"  Accuracy: {results[best_arch]['test_accuracy']:.4f}")
    logger.info(f"{'='*60}")
    
    # Save best model as production
    production_dir = save_dir / "production"
    production_dir.mkdir(parents=True, exist_ok=True)
    
    import shutil
    best_model_path = results[best_arch]["model_path"]
    dest_path = production_dir / "model.keras"
    shutil.copy2(best_model_path, dest_path)
    results[best_arch]["production_model_path"] = str(dest_path)
    
    # Save training results
    results_path = save_dir / "training_results.json"
    # Clean results for JSON serialization
    serializable = {}
    for k, v in results.items():
        serializable[k] = {
            key: val for key, val in v.items()
            if key not in ["confusion_matrix", "classification_report"]
        }
        serializable[k]["confusion_matrix"] = v["confusion_matrix"]
    
    with open(results_path, "w") as f:
        json.dump(serializable, f, indent=2)
    
    logger.info(f"\nTraining results saved to {results_path}")
    logger.info(f"Production model saved to {dest_path}")
    
    return results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="SER Model Training")
    parser.add_argument(
        "--architectures", nargs="+",
        default=["cnn", "lstm", "cnn_lstm_hybrid"],
        help="Architectures to train"
    )
    parser.add_argument("--epochs", type=int, default=EPOCHS)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    args = parser.parse_args()
    
    EPOCHS = args.epochs
    BATCH_SIZE = args.batch_size
    
    run_training_pipeline(architectures=args.architectures)
