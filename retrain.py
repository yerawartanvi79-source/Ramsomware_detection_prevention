"""
retrain.py — Retrain/fine-tune model with WannaCry RanSAP data
=================================================================
Run this when you have the WannaCry CSV files available.

Usage:
    python retrain.py --data "D:/path/to/wannacry/folder"

The WannaCry RanSAP folder should contain:
    ata_read.csv
    ata_write.csv
"""

import os
import gc
import argparse
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
import joblib

# ── CONFIG ────────────────────────────────────────────────────
MODEL_PATH  = "model/ransomware_lstm_model.keras"
SCALER_PATH = "model/scaler.pkl"
WINDOW_SIZE = 100
STEP_SIZE   = 50
CHUNK_SIZE  = 50000
MAX_ROWS    = 300000

# These 6 features match the model input shape (None, 100, 6)
FEATURE_COLS = ["lba", "size", "flags", "duration", "queue_depth", "throughput"]


def load_ransap_csv(filepath: str) -> np.ndarray:
    """Load a RanSAP CSV file in chunks to avoid memory issues."""
    chunks = []
    total  = 0

    try:
        for chunk in pd.read_csv(filepath, chunksize=CHUNK_SIZE, low_memory=True):
            # Find available feature columns
            available = [c for c in FEATURE_COLS if c in chunk.columns]

            if not available:
                # Try to use first 6 numeric columns if names don't match
                numeric_cols = chunk.select_dtypes(include=[np.number]).columns.tolist()
                available = numeric_cols[:6]
                if not available:
                    print(f"  [WARN] No usable columns in {filepath}")
                    print(f"  Available columns: {chunk.columns.tolist()}")
                    break

            chunk = chunk[available].fillna(0).astype(np.float32)

            # Pad to 6 features if fewer columns available
            while chunk.shape[1] < 6:
                chunk[f"pad_{chunk.shape[1]}"] = 0.0

            chunks.append(chunk.values[:, :6])
            total += len(chunk)

            if total >= MAX_ROWS:
                break

        if not chunks:
            return np.array([])

        data = np.vstack(chunks)[:MAX_ROWS]
        del chunks
        gc.collect()
        print(f"  Loaded {len(data):,} rows from {os.path.basename(filepath)}")
        return data

    except Exception as e:
        print(f"  [ERR] Could not load {filepath}: {e}")
        return np.array([])


def make_sequences(data: np.ndarray) -> np.ndarray:
    """Convert time series to sliding window sequences."""
    if len(data) < WINDOW_SIZE:
        return np.array([])

    seqs = []
    for i in range(0, len(data) - WINDOW_SIZE + 1, STEP_SIZE):
        seqs.append(data[i:i + WINDOW_SIZE])

    return np.array(seqs, dtype=np.float32)


def load_wannacry_data(wannacry_folder: str):
    """Load all CSV files from WannaCry folder."""
    print(f"\n  Loading WannaCry data from: {wannacry_folder}")
    all_data = []

    for fname in os.listdir(wannacry_folder):
        if fname.endswith(".csv"):
            fpath = os.path.join(wannacry_folder, fname)
            data  = load_ransap_csv(fpath)
            if len(data) > 0:
                all_data.append(data)

    if not all_data:
        print("  [ERR] No CSV data found!")
        return np.array([])

    combined = np.vstack(all_data)
    print(f"  Total WannaCry rows: {len(combined):,}")
    return combined


def generate_benign_data(n_rows: int = 50000) -> np.ndarray:
    """
    Generate synthetic benign disk I/O data.
    Benign: low, regular access patterns.
    Use this if you don't have real benign CSV files.
    """
    np.random.seed(42)
    data = np.column_stack([
        np.random.randint(0, int(1e8), n_rows),   # lba - sequential-ish
        np.random.randint(512, 65536, n_rows),     # size - normal file sizes
        np.random.randint(0, 3, n_rows),           # flags - normal ops
        np.random.randint(100, 10000, n_rows),     # duration - normal
        np.random.randint(1, 8, n_rows),           # queue_depth - low
        np.random.randint(1000, 100000, n_rows),   # throughput - normal
    ]).astype(np.float32)
    print(f"  Generated {n_rows:,} synthetic benign samples")
    return data


def retrain(wannacry_folder: str):
    print("=" * 55)
    print("  RETRAINING WITH WANNACRY RANSAP DATA")
    print("=" * 55)

    # ── Load WannaCry (ransomware) data ──────────────────
    ransom_data = load_wannacry_data(wannacry_folder)
    if len(ransom_data) == 0:
        print("No data found. Check your folder path.")
        return

    # ── Load or generate benign data ─────────────────────
    benign_path = os.path.join(os.path.dirname(wannacry_folder), "benign")
    if os.path.exists(benign_path):
        print(f"\n  Loading benign data from: {benign_path}")
        benign_csvs = [f for f in os.listdir(benign_path) if f.endswith(".csv")]
        benign_parts = []
        for f in benign_csvs[:5]:  # Use up to 5 benign files
            d = load_ransap_csv(os.path.join(benign_path, f))
            if len(d) > 0:
                benign_parts.append(d)
        benign_data = np.vstack(benign_parts) if benign_parts else generate_benign_data()
    else:
        print("\n  No benign folder found — using synthetic benign data")
        benign_data = generate_benign_data(len(ransom_data))

    # ── Make sequences ────────────────────────────────────
    print("\n  Building sequences...")
    ransom_seqs = make_sequences(ransom_data)
    benign_seqs = make_sequences(benign_data)

    # Balance dataset
    min_count   = min(len(ransom_seqs), len(benign_seqs), 10000)
    ransom_seqs = ransom_seqs[:min_count]
    benign_seqs = benign_seqs[:min_count]

    X = np.vstack([ransom_seqs, benign_seqs])
    y = np.array([1] * len(ransom_seqs) + [0] * len(benign_seqs))

    print(f"  Ransomware sequences : {len(ransom_seqs)}")
    print(f"  Benign sequences     : {len(benign_seqs)}")
    print(f"  Total                : {len(X)}")

    del ransom_data, benign_data, ransom_seqs, benign_seqs
    gc.collect()

    # ── Normalize ─────────────────────────────────────────
    n, t, f = X.shape
    X_2d    = X.reshape(-1, f)
    scaler  = MinMaxScaler()
    X_2d    = scaler.fit_transform(X_2d)
    X       = X_2d.reshape(n, t, f)
    joblib.dump(scaler, SCALER_PATH)
    print(f"\n  Scaler saved → {SCALER_PATH}")

    # ── Train/test split ──────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Load existing model and fine-tune ─────────────────
    print(f"\n  Loading existing model: {MODEL_PATH}")
    model = tf.keras.models.load_model(MODEL_PATH)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0005),
        loss="binary_crossentropy",
        metrics=["accuracy",
                 tf.keras.metrics.Precision(name="precision"),
                 tf.keras.metrics.Recall(name="recall")]
    )

    # ── Train ─────────────────────────────────────────────
    print(f"\n  Fine-tuning on WannaCry data...")
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=5,
            restore_best_weights=True, verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            MODEL_PATH, monitor="val_loss",
            save_best_only=True, verbose=1
        ),
    ]

    model.fit(
        X_train, y_train,
        validation_split=0.1,
        epochs=30,
        batch_size=64,
        callbacks=callbacks, 
        class_weight={0: 1.0, 1: 1.5},
        verbose=1,
    )

    # ── Evaluate ──────────────────────────────────────────
    print("\n  Evaluating...")
    y_prob = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_prob >= 0.5).astype(int)

    print(f"\n  Accuracy : {(y_pred == y_test).mean():.4f}")
    print(f"  F1 Score : {f1_score(y_test, y_pred):.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Benign','Ransomware'])}")

    print(f"\n  Model saved → {MODEL_PATH}")
    print("  Retraining complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data",
        required=True,
        help="Path to WannaCry RanSAP folder containing CSV files"
    )
    args = parser.parse_args()
    retrain(args.data)