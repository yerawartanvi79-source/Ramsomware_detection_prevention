# RanSAP - Ransomware Detection & Prevention System
## Deployment Guide v2.0

This guide provides step-by-step instructions to deploy both frontend and backend without error logs.

---

## 📋 Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Production Deployment](#production-deployment)
3. [Troubleshooting](#troubleshooting)
4. [API Endpoints](#api-endpoints)

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js 16+** (for frontend build)
- **Python 3.8+** (for backend)
- **npm** (comes with Node.js)
- **pip** (comes with Python)

### Step 1: Clone and Navigate to Project
```bash
cd d:\RansomeWareDet_PrevDL\Ramsomware_detection_prevention
```

### Step 2: Install Dependencies

#### Install Backend Dependencies
```bash
pip install -r requirements.txt
```

#### Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 3: Run in Development Mode

#### Option A: Run Frontend and Backend Separately (Recommended for Development)

**Terminal 1 - Run Backend:**
```bash
python backend/app.py
```
Expected output:
```
==================================================
  RANSAP DETECTION — BACKEND API v2.0
==================================================
  Model loaded : True
  Base dir     : d:\RansomeWareDet_PrevDL\Ramsomware_detection_prevention
  Dataset      : RanSAP 2022 (Cerber)
  Port         : 5000

 * Running on http://0.0.0.0:5000
```

**Terminal 2 - Run Frontend:**
```bash
cd frontend
npm run dev
```
Expected output:
```
  VITE v7.3.1  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Then access: **http://localhost:5173/**

#### Option B: Test Production Build Locally

```bash
# Build frontend
npm run build

# Verify backend can find the built frontend
python backend/app.py
```

Then access: **http://localhost:5000/**

---

## 🌐 Production Deployment

### Deployment Option 1: Railway.app (Recommended)

#### Step 1: Prepare Code
```bash
# Build frontend (Railway will do this automatically)
npm run build

# Ensure all files are tracked in git
git add .
git commit -m "Deploy v2.0 with frontend integration"
```

#### Step 2: Deploy to Railway
```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project (if new)
railway init

# Deploy
railway up
```

Or use Railway Dashboard:
1. Go to https://railway.app
2. Create new project
3. Select "Deploy from GitHub" and authorize
4. Select your repository
5. Click "Deploy"

#### Step 3: Configure Environment (in Railway Dashboard)
- Go to **Settings** → **Variables**
- Ensure these are set:
  ```
  PORT=8000
  FLASK_ENV=production
  ```

#### Step 4: Verify Deployment
```bash
# Get your Railway URL
railway logs

# Test API endpoint
curl https://your-railway-url.railway.app/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "model_loaded": true,
    "uptime_secs": 12.5,
    "version": "2.0.0"
  },
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

---

### Deployment Option 2: Heroku

#### Step 1: Install Heroku CLI
```bash
# Windows
choco install heroku-cli

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Deploy
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku main  # or master
```

#### Step 3: Configure Dyno
```bash
# View logs
heroku logs --tail

# Set environment variables
heroku config:set FLASK_ENV=production
```

---

### Deployment Option 3: Docker (Any Server)

#### Step 1: Create Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for building frontend
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Build frontend
RUN cd frontend && npm install && npm run build && cd ..

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "backend.app:app"]
```

#### Step 2: Build and Run
```bash
# Build Docker image
docker build -t ransomware-detection .

# Run container
docker run -p 8000:8000 ransomware-detection

# Verify
curl http://localhost:8000/health
```

---

### Deployment Option 4: Windows Server

#### Step 1: Install Prerequisites
```powershell
# Install Python (add to PATH)
# Install Node.js (add to PATH)
# Install Git

# Verify installations
python --version
npm --version
node --version
```

#### Step 2: Clone Repository
```powershell
git clone <your-repo-url>
cd Ramsomware_detection_prevention
```

#### Step 3: Build Frontend
```powershell
cd frontend
npm install
npm run build
cd ..
```

#### Step 4: Install Backend Dependencies
```powershell
pip install -r requirements.txt
```

#### Step 5: Run as Windows Service

**Using NSSM (Non-Sucking Service Manager):**
```powershell
# Download NSSM from https://nssm.cc/download

# Install service
nssm install RansomwareDetection "C:\Python311\Scripts\gunicorn.exe" "--bind 0.0.0.0:8000 --workers 2 --timeout 120 backend.app:app"

# Set working directory
nssm set RansomwareDetection AppDirectory "D:\RansomeWareDet_PrevDL\Ramsomware_detection_prevention"

# Start service
nssm start RansomwareDetection

# View logs
nssm dump RansomwareDetection
```

#### Step 6: Configure Firewall
```powershell
# Allow port 8000
netsh advfirewall firewall add rule name="Allow Port 8000" dir=in action=allow protocol=tcp localport=8000
```

#### Step 7: Verify
```powershell
curl http://localhost:8000/health
```

---

## ✅ Verification Checklist

After deployment, verify:

```bash
# 1. Health check
curl http://<your-url>/health
# Response: { "success": true, "model_loaded": true, ... }

# 2. Frontend loads
curl http://<your-url>/
# Should return HTML (not API response)

# 3. Test prediction
curl -X POST http://<your-url>/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [100000, 4096, 1, 200, 2, 10000, 100000, 4096, 1, 200, 2, 10000, 100000, 4096, 1, 200, 2, 10000, 100000, 4096, 1, 200, 2, 10000, 100000, 4096, 1, 200, 2, 10000, 100000, 4096, 1, 200, 2, 10000]}'
# Response: { "success": true, "data": { "probability": 0.xxx, "label": "benign", ... } }

# 4. API endpoints
curl http://<your-url>/monitor
curl http://<your-url>/alerts
curl http://<your-url>/model/info
```

---

## 🔧 Troubleshooting

### Issue: "Model not loaded"

**Solution:**
```bash
# Check if model files exist
ls -la model/

# Expected files:
# - ransomware_lstm_model.keras
# - scaler.pkl

# If missing, retrain:
python retrain.py
```

### Issue: "Frontend not found" or "Blank page"

**Solution:**
```bash
# Rebuild frontend
cd frontend
npm run build
cd ..

# Verify dist folder exists
ls -la frontend/dist/

# Restart backend
python backend/app.py
```

### Issue: "CORS errors" in browser console

**Solution:**
- CORS is already enabled in backend
- For development, ensure backend runs on port 5000
- For production, frontend is served by same backend (no CORS needed)

### Issue: "Port already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Issue: "TensorFlow not found"

**Solution:**
```bash
pip install --upgrade tensorflow-cpu
```

### Issue: "npm ERR! code ERESOLVE"

**Solution:**
```bash
cd frontend
npm install --legacy-peer-deps
cd ..
```

---

## 📡 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `POST /predict` - Make prediction
- `GET /monitor` - Get monitoring stats
- `POST /alert` - Send alert
- `GET /alerts` - Get recent alerts
- `DELETE /alerts/clear` - Clear all alerts
- `GET /logs` - Get detection logs
- `GET /model/info` - Get model information

### Simulation Endpoints
- `GET /simulate/benign` - Simulate benign activity
- `GET /simulate/ransom` - Simulate ransomware activity

### Frontend
- `GET /` - React frontend
- `GET /assets/*` - Static assets

---

## 🔐 Security Notes

1. **Change SECRET_KEY in production** (.env.production)
2. **Use HTTPS** in production (let Railway/Heroku handle this)
3. **Never commit .env files** (already in .gitignore)
4. **Set proper CORS origins** if needed:
   ```python
   # In backend/app.py:
   CORS(app, resources={r"/api/*": {"origins": ["https://yourdomain.com"]}})
   ```

---

## 📊 Performance Optimization

### For Production
1. **Gunicorn workers**: Currently set to 2. Increase if needed:
   ```
   gunicorn --workers 4 backend.app:app
   ```

2. **Frontend**: Already minified in build process

3. **Model**: Using TensorFlow-CPU for compatibility

4. **Caching**: Frontend assets cached by browser (verify via `Cache-Control` headers)

---

## 📝 Build Pipeline

### Automated Build (Railway)
1. Code pushed to GitHub
2. Railway detects changes
3. Runs `npm run build` (builds frontend)
4. Installs Python dependencies
5. Starts `gunicorn`
6. Frontend served from `frontend/dist/`

### Manual Build
```bash
npm run build
python backend/app.py
```

---

## ✨ What Changed in v2.0

✅ Frontend serves from backend (no separate deployment)
✅ Dynamic API URL detection (dev/prod)
✅ Better error handling
✅ Improved Procfile and railway.json
✅ Build script in package.json
✅ Environment configuration files
✅ Comprehensive deployment guide

---

## 🆘 Support

For issues:
1. Check logs: `railway logs` or `heroku logs --tail`
2. Verify model files exist
3. Ensure frontend built successfully
4. Check port isn't already in use
5. Try rebuilding: `npm run build`

---

**Last Updated:** 2024
**Version:** 2.0.0
**Status:** Production Ready
