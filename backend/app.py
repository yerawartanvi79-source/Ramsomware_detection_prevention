"""
backend/app.py — Flask API for RanSAP Ransomware Detection System
"""

import os
import time
import json
import threading
from datetime import datetime
from collections import deque

import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── BASE DIRECTORY ────────────────────────────────────────────
# Resolves to project root regardless of where gunicorn is launched from
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── MODEL LOADER ─────────────────────────────────────────────

class ModelServer:
    def __init__(self):
        self.model  = None
        self.scaler = None
        self.loaded = False
        self._lock  = threading.Lock()
        self._load()

    def _load(self):
        try:
            import tensorflow as tf

            # ✅ Absolute paths — works on Railway
            model_path  = os.path.join(BASE_DIR, "model", "ransomware_lstm_model.keras")
            scaler_path = os.path.join(BASE_DIR, "model", "scaler.pkl")

            if not os.path.exists(model_path):
                print(f"  Model file not found at: {model_path}")
                self.loaded = False
                return

            self.model = tf.keras.models.load_model(model_path)

            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                print(f"  Scaler loaded")
            else:
                self.scaler = None
                print(f"  No scaler found — using raw features")

            self.loaded = True
            print(f"  Model loaded successfully!")
            print(f"  Input shape: {self.model.input_shape}")

        except Exception as e:
            print(f"  Model not loaded: {e}")

    def predict(self, features):
        if not self.loaded:
            return {"error": "model_not_loaded", "probability": -1}

        with self._lock:
            try:
                arr = np.array(features, dtype=np.float32)

                if arr.ndim == 1:
                    if len(arr) == 600:
                        arr = arr.reshape(100, 6)
                    elif len(arr) == 6:
                        arr = np.tile(arr, (100, 1))
                    else:
                        return {"error": f"Expected 6 or 600 values, got {len(arr)}"}

                if self.scaler:
                    arr = self.scaler.transform(arr)

                X    = arr.reshape(1, 100, 6)
                prob = float(self.model.predict(X, verbose=0)[0][0])
                label = "ransomware" if prob >= 0.70 else "benign"

                return {
                    "probability": round(prob, 6),
                    "label":       label,
                    "confidence":  round(prob if prob >= 0.5 else 1 - prob, 6),
                    "threshold":   0.70,
                }

            except Exception as e:
                return {"error": str(e), "probability": -1}


# ── APP STATE ─────────────────────────────────────────────────

model_server  = ModelServer()
alert_store   = deque(maxlen=500)
alert_lock    = threading.Lock()
start_time    = time.time()

monitor_stats = {
    "engine_status":         "running",
    "watch_directory":       "test_folder",
    "total_predictions":     0,
    "ransomware_detections": 0,
    "processes_killed":      0,
    "alert_count":           0,
    "model":                 "ransomware_lstm_model.keras",
    "dataset":               "RanSAP 2022 (Cerber)",
    "window_size":           100,
    "threshold":             0.70,
}

# ── HELPERS ───────────────────────────────────────────────────

def ok(data, status=200):
    return jsonify({
        "success":   True,
        "data":      data,
        "timestamp": datetime.now().isoformat()
    }), status

def err(msg, status=400):
    return jsonify({
        "success":   False,
        "error":     msg,
        "timestamp": datetime.now().isoformat()
    }), status

# ── ROUTES ────────────────────────────────────────────────────

@app.route("/health")
def health():
    return ok({
        "status":       "ok",
        "model_loaded": model_server.loaded,
        "uptime_secs":  round(time.time() - start_time, 1),
        "version":      "2.0.0",
        "dataset":      "RanSAP 2022 (Cerber)",
    })

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return err("JSON body required")

    if "features" not in data:
        feature_names = ["lba", "size", "flags", "duration",
                         "queue_depth", "throughput"]
        features = [float(data.get(k, 0)) for k in feature_names]
    else:
        features = data["features"]

    result = model_server.predict(features)

    if "error" not in result:
        monitor_stats["total_predictions"] += 1
        if result["label"] == "ransomware":
            monitor_stats["ransomware_detections"] += 1

    return ok(result)

@app.route("/monitor")
def monitor():
    with alert_lock:
        recent = list(alert_store)[-10:]
    return ok({
        **monitor_stats,
        "recent_alerts": recent,
        "alert_count":   len(alert_store),
        "uptime_secs":   round(time.time() - start_time, 1),
    })

@app.route("/alert", methods=["POST"])
def receive_alert():
    data = request.get_json(silent=True)
    if not data:
        return err("Invalid JSON")

    data["received_at"] = datetime.now().isoformat()
    with alert_lock:
        alert_store.append(data)

    monitor_stats["alert_count"] = len(alert_store)
    if data.get("type") == "process_killed":
        monitor_stats["processes_killed"] += 1
    if data.get("label") == "ransomware":
        monitor_stats["ransomware_detections"] += 1

    print(f"  ALERT: {data.get('process_name','?')} "
          f"prob={data.get('probability','?')}")
    return ok({"stored": True})

@app.route("/alerts")
def get_alerts():
    limit = min(int(request.args.get("limit", 20)), 100)
    with alert_lock:
        all_alerts = list(alert_store)
    return ok({
        "alerts": list(reversed(all_alerts))[:limit],
        "total":  len(all_alerts)
    })

@app.route("/alerts/clear", methods=["DELETE"])
def clear_alerts():
    with alert_lock:
        count = len(alert_store)
        alert_store.clear()
    monitor_stats["alert_count"] = 0
    return ok({"cleared": count})

@app.route("/logs")
def get_logs():
    # ✅ Absolute path — works on Railway
    log_path = os.path.join(BASE_DIR, "logs", "detections.jsonl")
    if not os.path.exists(log_path):
        return ok({"logs": [], "total": 0})
    with open(log_path) as f:
        lines = f.readlines()
    limit  = min(int(request.args.get("limit", 50)), 200)
    parsed = []
    for line in lines[-limit:]:
        try:
            parsed.append(json.loads(line.strip()))
        except Exception:
            pass
    return ok({"logs": list(reversed(parsed)), "total": len(lines)})

@app.route("/simulate/benign")
def sim_benign():
    single   = [100000, 4096, 1, 200, 2, 10000]
    features = single * 100
    result   = model_server.predict(features)
    return ok({"type": "benign_simulation", "prediction": result})

@app.route("/simulate/ransom")
def sim_ransom():
    single   = [999999999, 999999, 255, 999999, 32, 99999999]
    features = single * 100
    result   = model_server.predict(features)
    return ok({"type": "ransomware_simulation", "prediction": result})

@app.route("/model/info")
def model_info():
    if not model_server.loaded:
        return err("Model not loaded", 503)
    return ok({
        "model_path":   "model/ransomware_lstm_model.keras",
        "input_shape":  str(model_server.model.input_shape),
        "output_shape": str(model_server.model.output_shape),
        "dataset":      "RanSAP 2022 (Cerber)",
        "features":     ["lba", "size", "flags", "duration",
                         "queue_depth", "throughput"],
        "window_size":  100,
        "threshold":    0.70,
    })

@app.errorhandler(404)
def not_found(e):
    return err("Endpoint not found", 404)

@app.errorhandler(500)
def server_error(e):
    return err(f"Server error: {e}", 500)

if __name__ == "__main__":
    os.makedirs(os.path.join(BASE_DIR, "logs"), exist_ok=True)
    port = int(os.environ.get("PORT", 5000))

    print("=" * 50)
    print("  RANSAP DETECTION — BACKEND API v2.0")
    print("=" * 50)
    print(f"  Model loaded : {model_server.loaded}")
    print(f"  Base dir     : {BASE_DIR}")
    print(f"  Dataset      : RanSAP 2022 (Cerber)")
    print(f"  Port         : {port}")
    print()

    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
