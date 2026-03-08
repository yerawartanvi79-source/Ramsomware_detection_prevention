# Ransomware Detection and Prevention System using LSTM

## Overview

This project implements a **behavior-based ransomware detection and prevention system** using an **LSTM deep learning model**.
The system monitors file system activity in real time and analyzes file behavior patterns to detect possible ransomware encryption attempts.

If ransomware-like behavior is detected, the system automatically triggers a **prevention mechanism** that:

* Creates backups of affected files
* Stops further encryption activity
* Alerts the user

The system combines **deep learning detection with real-time system monitoring** to protect files from ransomware attacks.

---

# Technologies Used

* Python
* TensorFlow / Keras (LSTM Model)
* Watchdog (File System Monitoring)
* NumPy & Pandas (Data Processing)

Libraries:

* watchdog
* tensorflow
* numpy
* pandas
* scikit-learn

---

# Project Architecture

The project follows a **modular pipeline architecture**.

```
            File System Activity
                    │
                    ▼
           monitor.py (Real-time monitoring)
                    │
                    ▼
        Feature Extraction / Behavior Data
                    │
                    ▼
           detector.py (LSTM Prediction)
                    │
         ┌──────────┴──────────┐
         │                     │
     Benign               Ransomware
         │                     │
         ▼                     ▼
  Continue Monitoring     prevention.py
                               │
                               ▼
                         backup.py
                               │
                               ▼
                    Stop Encryption Process
```

---

# Project Directory Structure

```
Ransomware_detection_prevention/
│
├── model/
│   └── lstm_model.h5
│
├── test_folder/
│   └── sample files used for testing detection
│
├── monitor.py
│   Monitors file system activity using watchdog
│
├── detector.py
│   Loads the trained LSTM model and predicts
│   whether activity is ransomware or normal
│
├── prevention.py
│   Executes prevention mechanisms when ransomware
│   is detected (triggered after model prediction)
│
├── backup.py
│   Creates backup of files before encryption spreads
│
├── main.py
│   Entry point of the system that starts monitoring
│
├── .gitignore
│
└── README.md
```

---

# System Workflow

### Step 1: File Monitoring

`monitor.py` continuously monitors file changes in the target directory using **Watchdog**.

Examples of monitored events:

* File modification
* File creation
* Rapid file writes
* Suspicious file renaming

---

### Step 2: Behavior Data Collection

The detected file activity is processed to extract behavior features such as:

* File modification frequency
* Entropy level
* Write operations
* Rename patterns

These features form the **input sequence for the LSTM model**.

---

### Step 3: Ransomware Detection (LSTM Model)

`detector.py` loads the **trained LSTM model** stored in the `model/` directory.

The model predicts whether the activity is:

* **0 → Normal Behavior**
* **1 → Ransomware Behavior**

Example pipeline:

```
File Event
   │
   ▼
Feature Extraction
   │
   ▼
LSTM Model Prediction
```

---

### Step 4: Prevention Trigger

If the model predicts **ransomware activity**, the system calls:

```
prevention.py
```

The prevention module performs the following actions.

---

### Step 5: File Backup

`backup.py` immediately creates copies of files to prevent data loss.

```
backup/
 └── protected files
```

---

### Step 6: Stop Encryption

The prevention module attempts to:

* Stop the suspicious process
* Prevent further encryption attempts
* Alert the user about ransomware activity

---

# How to Run the Project

## Step 1: Clone Repository

```
git clone https://github.com/yerawartanvi79-source/Ramsomware_detection_prevention.git
cd Ramsomware_detection_prevention
```

---

## Step 2: Create Virtual Environment

```
python3 -m venv venv
source venv/bin/activate
```

---

## Step 3: Install Dependencies

```
pip install -r requirements.txt
```

or

```
pip install watchdog tensorflow numpy pandas
```

---

## Step 4: Run the System

```
python main.py
```

The system will start monitoring the folder:

```
test_folder/
```

---

# Demonstration

1. Run the monitoring system.
2. Simulate ransomware-like file modifications inside `test_folder`.
3. The system will detect suspicious behavior using the LSTM model.
4. Prevention module will trigger automatically.

Expected Output Example:

```
Monitoring started...

File modification detected

LSTM Prediction: Ransomware

Triggering prevention module...

Backing up files...

Stopping suspicious process...
```

---

# Future Improvements

Possible improvements include:

* Process-level ransomware detection
* Network-based attack monitoring
* Advanced deep learning models
* Real-time dashboard for attack visualization
* Automatic system isolation during attack

---


