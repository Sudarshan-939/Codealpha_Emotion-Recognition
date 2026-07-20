"""
Training pipeline for Speech Emotion Recognition models.
Supports CNN, LSTM, and CNN-LSTM hybrid architectures.
"""
from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

from app.config import SAVED_MODELS_DIR, DATA_FEATURES_DIR, NUM_EMOTIONS
from app.models.cnn_model import MODEL_BUILDERS, compile_model
from app.utils.label_map import EMOTION_TO_INDEX

logger = logging.getLogger(__name__)


def load_features(
    dataset_name: str = "combined",
    feature_type: str = "mfcc",
) -> tuple[np.ndarray, np.ndarray]:
    """
    Load pre-extracted features and labels.

    Returns:
        (X, y) where X is feature array and y is one-hot encoded labels
    """
    features_dir = DATA_FEATURES_DIR / dataset_name

    X_path = features_dir / f"X_{feature_type}.npy"
    y_path = features_dir / "y_labels.npy"

    if not X_path.exists() or not y_path.exists():
        raise FileNotFoundError(
            f"Feature files not found in {features_dir}. "
            "Run the feature extraction pipeline first."
        )

    X = np.load(str(X_path))
    y = np.load(str(y_path))

    logger.info("Loaded features: X=%s, y=%s", X.shape, y.shape)
    return X, y


def augment_data(X: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Simple data augmentation: add Gaussian noise to create synthetic samples.
    """
    noise_factor = 0.01
    X_noisy = X + noise_factor * np.random.randn(*X.shape)
    X_aug = np.concatenate([X, X_noisy], axis=0)
    y_aug = np.concatenate([y, y], axis=0)

    # Shuffle
    indices = np.random.permutation(len(X_aug))
    return X_aug[indices], y_aug[indices]


def train_model(
    model_name: str = "cnn_lstm_hybrid",
    dataset_name: str = "combined",
    feature_type: str = "mfcc",
    epochs: int = 50,
    batch_size: int = 32,
    learning_rate: float = 0.001,
    augment: bool = True,
) -> dict:
    """
    Train a model and save the best checkpoint.

    Returns:
        dict with training metrics and model path
    """
    logger.info("Training model: %s on dataset: %s", model_name, dataset_name)

    # Load features
    X, y = load_features(dataset_name, feature_type)

    # Train/validation/test split (80/10/10)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=np.argmax(y, axis=1)
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=np.argmax(y_temp, axis=1)
    )

    logger.info(
        "Splits — train: %d, val: %d, test: %d",
        len(X_train), len(X_val), len(X_test),
    )

    # Augment training data
    if augment:
        X_train, y_train = augment_data(X_train, y_train)
        logger.info("After augmentation — train: %d", len(X_train))

    # Build and compile model
    builder = MODEL_BUILDERS[model_name]
    model = builder()
    model = compile_model(model, learning_rate=learning_rate)
    model.summary(print_fn=logger.info)

    # Compute class weights for imbalanced data
    y_labels = np.argmax(y_train, axis=1)
    class_weights = compute_class_weight(
        class_weight="balanced",
        classes=np.arange(NUM_EMOTIONS),
        y=y_labels,
    )
    class_weight_dict = dict(enumerate(class_weights))

    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_f1_macro",
            patience=10,
            mode="max",
            restore_best_weights=True,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
        ),
    ]

    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1,
    )

    # Evaluate on test set
    test_results = model.evaluate(X_test, y_test, verbose=0)
    test_metrics = dict(zip(model.metrics_names, test_results))

    # Save model
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = SAVED_MODELS_DIR / f"{model_name}.keras"
    model.save(str(model_path))
    logger.info("Model saved to %s", model_path)

    return {
        "model_name": model_name,
        "dataset": dataset_name,
        "feature_type": feature_type,
        "test_metrics": {k: float(v) for k, v in test_metrics.items()},
        "epochs_trained": len(history.history["loss"]),
        "model_path": str(model_path),
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Train all architectures
    for name in MODEL_BUILDERS:
        try:
            result = train_model(model_name=name)
            logger.info("Training complete for %s: %s", name, result["test_metrics"])
        except FileNotFoundError:
            logger.warning("Skipping %s — no feature files found", name)
        except Exception as e:
            logger.error("Failed to train %s: %s", name, e)
