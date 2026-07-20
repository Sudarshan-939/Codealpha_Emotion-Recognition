"""
Speech Emotion Recognition - Model Architectures
Optimized CNN, BiLSTM, and CNN-LSTM Hybrid architectures for high accuracy emotion classification.
"""
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from typing import Tuple, Optional

from app.config import NUM_CLASSES, N_MFCC, N_MELS


def build_cnn_model(
    input_shape: Tuple[int, int, int] = (128, 128, 1),
    num_classes: int = NUM_CLASSES,
    name: str = "cnn",
) -> Model:
    """
    Deep 2D CNN for mel-spectrogram image classification.
    Features: 4 Conv blocks with BatchNorm, SpatialDropout2D, Residual connections, GAP.
    """
    inputs = layers.Input(shape=input_shape, name="mel_input")

    # Block 1
    x = layers.Conv2D(32, (3, 3), padding="same", kernel_initializer="he_normal")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(32, (3, 3), padding="same", kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.2)(x)

    # Block 2
    x = layers.Conv2D(64, (3, 3), padding="same", kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(64, (3, 3), padding="same", kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)

    # Block 3
    x = layers.Conv2D(128, (3, 3), padding="same", kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(128, (3, 3), padding="same", kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.3)(x)

    # Block 4
    x = layers.Conv2D(256, (3, 3), padding="same", kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.35)(x)

    # Classification Head
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.4)(x)
    
    outputs = layers.Dense(num_classes, activation="softmax", name="emotion_output")(x)

    model = Model(inputs=inputs, outputs=outputs, name=name)
    return model


def build_lstm_model(
    input_shape: Tuple[int, int] = (128, N_MFCC * 3),
    num_classes: int = NUM_CLASSES,
    name: str = "lstm",
) -> Model:
    """
    Stacked BiLSTM for MFCC + Deltas time-sequence classification.
    Features: 2 BiLSTM layers + LayerNorm + Dropout + Dense classifier.
    """
    inputs = layers.Input(shape=input_shape, name="mfcc_input")

    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True, recurrent_dropout=0.1))(inputs)
    x = layers.LayerNormalization()(x)
    x = layers.Dropout(0.3)(x)

    x = layers.Bidirectional(layers.LSTM(64, return_sequences=False, recurrent_dropout=0.1))(x)
    x = layers.LayerNormalization()(x)
    x = layers.Dropout(0.3)(x)

    x = layers.Dense(128, kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.35)(x)
    
    outputs = layers.Dense(num_classes, activation="softmax", name="emotion_output")(x)

    model = Model(inputs=inputs, outputs=outputs, name=name)
    return model


def build_cnn_lstm_model(
    input_shape: Tuple[int, int] = (128, N_MFCC * 3),
    conv_filters: int = 64,
    lstm_units: int = 128,
    num_classes: int = NUM_CLASSES,
    name: str = "cnn_lstm_hybrid",
) -> Model:
    """
    SOTA CNN-LSTM Hybrid with Multi-Head Self-Attention.
    Input: MFCC sequence (time × 120)
    Architecture: 1D Conv feature extraction -> BiLSTM -> MultiHeadAttention -> GlobalAvgPool -> Softmax.
    """
    inputs = layers.Input(shape=input_shape, name="mfcc_input")

    # 1D Convolutional Feature Extractor over time
    x = layers.Conv1D(conv_filters, kernel_size=5, padding="same", kernel_initializer="he_normal")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling1D(pool_size=2)(x)
    x = layers.Dropout(0.2)(x)

    x = layers.Conv1D(conv_filters * 2, kernel_size=3, padding="same", kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.25)(x)

    # BiLSTM Temporal Extractor
    x = layers.Bidirectional(layers.LSTM(lstm_units, return_sequences=True))(x)
    x = layers.LayerNormalization()(x)
    x = layers.Dropout(0.3)(x)

    # Multi-Head Self-Attention
    attn = layers.MultiHeadAttention(num_heads=4, key_dim=32)(x, x)
    x = layers.Add()([x, attn])
    x = layers.LayerNormalization()(x)

    # Aggregation & Classification
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dense(128, kernel_initializer="he_normal")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.35)(x)
    
    outputs = layers.Dense(num_classes, activation="softmax", name="emotion_output")(x)

    model = Model(inputs=inputs, outputs=outputs, name=name)
    return model


def compile_model(
    model: Model,
    learning_rate: float = 0.001,
) -> Model:
    """Compile model with Adam optimizer and categorical crossentropy loss."""
    optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def get_callbacks(patience: int = 15, model_path: str = "best_model.keras"):
    """Get training callbacks for early stopping, learning rate reduction, and model checkpoints."""
    return [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=patience,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=4,
            min_lr=1e-5,
            verbose=1,
        ),
        keras.callbacks.ModelCheckpoint(
            model_path,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
    ]


MODEL_BUILDERS = {
    "cnn": build_cnn_model,
    "lstm": build_lstm_model,
    "cnn_lstm_hybrid": build_cnn_lstm_model,
}


def build_model(architecture: str, **kwargs) -> Model:
    """Build a model by architecture name."""
    if architecture not in MODEL_BUILDERS:
        raise ValueError(f"Unknown architecture: {architecture}. Choose from: {list(MODEL_BUILDERS.keys())}")
    return MODEL_BUILDERS[architecture](**kwargs)
