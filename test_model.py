"""
test_model.py — Verify model input/output and prevention
Run: python test_model.py
"""

import requests
import time
import json

API = "http://127.0.0.1:5000"

def test(name, payload, expected_label):
    r = requests.post(f"{API}/predict", json=payload)
    d = r.json()["data"]
    prob  = d["probability"]
    label = d["label"]
    ok    = "✅" if label == expected_label else "❌"
    print(f"  {ok} {name}")
    print(f"     Label    : {label.upper()}")
    print(f"     Prob     : {prob:.4f} ({round(prob*100)}%)")
    print(f"     Expected : {expected_label.upper()}")
    print()
    return label == expected_label

print("=" * 50)
print("  RANSOMGUARD — MODEL VERIFICATION TESTS")
print("=" * 50)

# ── TEST 1: Ransomware features ───────────────────────
print("\n[TEST 1] Ransomware disk I/O pattern")
test("High-entropy ransomware writes", {
    "lba": 999999999, "size": 999999, "flags": 255,
    "duration": 999999, "queue_depth": 32, "throughput": 99999999
}, "ransomware")

# ── TEST 2: Benign features ───────────────────────────
print("[TEST 2] Benign disk I/O pattern")
test("Normal file access", {
    "lba": 100000, "size": 4096, "flags": 1,
    "duration": 200, "queue_depth": 2, "throughput": 10000
}, "benign")

# ── TEST 3: Simulate ransomware alert + prevention ────
print("[TEST 3] Simulate ransomware detection → prevention")
alert_payload = {
    "type":         "process_killed",
    "pid":          99999,
    "process_name": "test_ransomware.exe",
    "probability":  0.9987,
    "label":        "ransomware",
    "action_taken": "terminated",
    "timestamp":    time.strftime("%Y-%m-%dT%H:%M:%S"),
}
r = requests.post(f"{API}/alert", json=alert_payload)
print(f"  Alert sent: {r.json()['success']}")

# Verify alert appears
r2 = requests.get(f"{API}/alerts?limit=5")
alerts = r2.json()["data"]["alerts"]
found = any(a.get("process_name") == "test_ransomware.exe" for a in alerts)
print(f"  {'✅' if found else '❌'} Alert stored in dashboard: {found}")
print()

# ── TEST 4: Monitor stats updated ─────────────────────
print("[TEST 4] Verify dashboard stats updated")
r = requests.get(f"{API}/monitor")
stats = r.json()["data"]
print(f"  Total predictions     : {stats['total_predictions']}")
print(f"  Ransomware detections : {stats['ransomware_detections']}")
print(f"  Processes killed      : {stats['processes_killed']}")
print(f"  Alert count           : {stats['alert_count']}")
print()

# ── TEST 5: Health check ──────────────────────────────
print("[TEST 5] Backend health")
r = requests.get(f"{API}/health")
h = r.json()["data"]
print(f"  {'✅' if h['model_loaded'] else '❌'} Model loaded : {h['model_loaded']}")
print(f"  Status       : {h['status']}")
print(f"  Uptime       : {h['uptime_secs']}s")
print()

print("=" * 50)
print("  All tests complete! Check dashboard for alerts.")
print("=" * 50)