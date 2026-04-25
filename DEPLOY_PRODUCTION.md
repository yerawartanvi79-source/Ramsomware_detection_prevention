# 🚀 Production Deployment Guide - RanSAP v2.0

## ⚡ Prerequisites

- **Node.js 16+** (with npm)
- **Python 3.8+**
- **Git** (for version control)
- Model files: `model/ransomware_lstm_model.keras` and `model/scaler.pkl`

---

## ✅ Step 1: Local Build & Test (REQUIRED)

### 1.1 Install Dependencies
```powershell
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 1.2 Build Frontend
```powershell
npm run build
```

**Expected output:**
```
✓ 29 modules transformed.
dist/index.html                   0.67 kB │ gzip:  0.39 kB
dist/assets/index-Cn653KvA.css    1.42 kB │ gzip:  0.72 kB
dist/assets/index-CkxRxPu-.js   214.38 kB │ gzip: 65.82 kB
✓ built in 1.91s
```

### 1.3 Test Locally
```powershell
# Terminal 1: Run Backend
$env:FLASK_ENV = "development"
python backend/app.py
```

**Expected output:**
```
==================================================
  RANSAP DETECTION — BACKEND API v2.0
==================================================
  Model loaded : True
  Base dir     : D:\...\Ramsomware_detection_prevention
  Dataset      : RanSAP 2022 (Cerber)
  Port         : 5000

 * Running on http://0.0.0.0:5000
```

### 1.4 Verify API Works
```powershell
# Terminal 2: Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/  # Should return HTML
```

---

## 🌐 Step 2: Deploy to Railway.app (RECOMMENDED)

### 2.1 Create Railway Account
- Go to https://railway.app
- Sign up with GitHub

### 2.2 Create & Configure Project

**Option A: Deploy from Dashboard**
1. Go to Railway Dashboard
2. Create New Project → Deploy from GitHub
3. Select your repository
4. Railway auto-detects the project and builds
5. Click "Deploy"

**Option B: Deploy via CLI**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create and deploy
railway up
```

### 2.3 Configure Environment
In Railway Dashboard → Settings → Variables:
```
FLASK_ENV=production
PORT=8000
```

### 2.4 Verify Deployment
```powershell
# Get your Railway URL
railway logs

# Test health endpoint
curl https://<your-railway-url>.railway.app/health

# Test frontend (should return HTML)
curl https://<your-railway-url>.railway.app/
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "model_loaded": true,
    "version": "2.0.0"
  }
}
```

---

## 🐳 Step 3: Deploy with Docker (Local/Cloud)

### 3.1 Build Docker Image
```powershell
docker build -t ransomware-detection .
```

### 3.2 Run Container
```powershell
docker run -p 8000:8000 ransomware-detection
```

### 3.3 Verify
```powershell
curl http://localhost:8000/health
curl http://localhost:8000/  # Returns HTML
```

### 3.4 Deploy to Docker Hub
```powershell
# Tag image
docker tag ransomware-detection:latest yourusername/ransomware-detection:latest

# Push to Docker Hub
docker push yourusername/ransomware-detection:latest
```

---

## 🪟 Step 4: Deploy on Windows Server

### 4.1 Install Prerequisites
```powershell
# Install Python (add to PATH)
# Install Node.js (add to PATH)
# Install Git

# Verify
python --version
npm --version
node --version
```

### 4.2 Clone & Build
```powershell
cd C:\projects
git clone <your-repo-url>
cd Ramsomware_detection_prevention

# Install dependencies
pip install -r requirements.txt
cd frontend && npm install && cd ..

# Build frontend
npm run build
```

### 4.3 Create Windows Service

**Using NSSM (Non-Sucking Service Manager):**

```powershell
# Download NSSM from https://nssm.cc/download
# Extract to C:\tools\nssm-2.24

$nssm = "C:\tools\nssm-2.24\win64\nssm.exe"
$app_dir = "C:\projects\Ramsomware_detection_prevention"

# Install service
& $nssm install RansomwareDetection "python" "backend\app.py"
& $nssm set RansomwareDetection AppDirectory $app_dir
& $nssm set RansomwareDetection AppEnvironmentExtra "FLASK_ENV=production`nPORT=8000"

# Start service
& $nssm start RansomwareDetection

# View status
& $nssm status RansomwareDetection
```

### 4.4 Allow Firewall
```powershell
netsh advfirewall firewall add rule name="RansomwareDetection" `
  dir=in action=allow protocol=tcp localport=8000
```

### 4.5 Verify
```powershell
# Check service is running
Get-Service | Where-Object {$_.Name -like "*Ransom*"}

# Test endpoint
curl http://localhost:8000/health
```

---

## ☁️ Step 5: Deploy on Heroku

### 5.1 Install Heroku CLI
```powershell
# Using choco
choco install heroku-cli

# Or download from https://devcenter.heroku.com/
```

### 5.2 Deploy
```powershell
# Login
heroku login

# Create app
heroku create your-app-name

# Set buildpacks (needed for Node + Python)
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python

# Deploy
git push heroku main  # or master
```

### 5.3 Configure
```powershell
heroku config:set FLASK_ENV=production
heroku config:set PORT=8000

# View logs
heroku logs --tail
```

### 5.4 Verify
```powershell
curl https://your-app-name.herokuapp.com/health
```

---

## ✨ Step 6: Verification Checklist

After deployment, test these endpoints:

### Health Check
```powershell
curl https://your-deployment-url/health
```
Should return:
```json
{"success": true, "data": {"status": "ok", "model_loaded": true, ...}}
```

### Frontend Loads
```powershell
curl https://your-deployment-url/
```
Should return HTML (React index.html)

### Prediction API
```powershell
$body = @{
    features = @(100000, 4096, 1, 200, 2, 10000) * 100
} | ConvertTo-Json

curl -Method POST `
  -Uri "https://your-deployment-url/predict" `
  -ContentType "application/json" `
  -Body $body
```

### Monitor Endpoint
```powershell
curl https://your-deployment-url/monitor
```

### Simulation Endpoints
```powershell
# Test benign (should be low probability)
curl https://your-deployment-url/simulate/benign

# Test ransomware (should be high probability)
curl https://your-deployment-url/simulate/ransom
```

---

## 🔧 Troubleshooting

### ❌ "Model not loaded"
**Solution:**
```powershell
# Verify model files exist
ls model/
# Should show: ransomware_lstm_model.keras, scaler.pkl

# If missing, download or train model
python retrain.py
```

### ❌ "Frontend not found" or "Blank page"
**Solution:**
```powershell
# Rebuild frontend
npm run build

# Verify dist folder
ls frontend/dist/
# Should show: index.html, assets/

# Restart backend
python backend/app.py
```

### ❌ "Port already in use"
**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
python backend/app.py --port 5001
```

### ❌ "CORS errors"
**Solution:**
- CORS is enabled in `backend/app.py`
- Development: Backend runs on 5000, Frontend on 5173
- Production: Frontend served from same backend (no CORS needed)
- Rebuild frontend: `npm run build`

### ❌ "npm ERR! code ERESOLVE"
**Solution:**
```powershell
cd frontend
npm install --legacy-peer-deps
cd ..
npm run build
```

### ❌ "Missing terser"
**Solution:**
```powershell
cd frontend
npm install terser --save-dev
cd ..
npm run build
```

---

## 📊 Performance Tuning

### Backend Workers
Edit command to increase gunicorn workers:
```
gunicorn --workers 4 --timeout 120 backend.app:app
```

### Memory Optimization
```powershell
# Use tensorflow-cpu instead of tensorflow-gpu
pip uninstall tensorflow
pip install tensorflow-cpu
```

### Frontend Caching
Browser automatically caches built assets in `frontend/dist/assets/`

---

## 🔐 Security Best Practices

1. **Never commit .env files**
   - Already in .gitignore
   - Set variables in deployment platform

2. **Use HTTPS in production**
   - Railway/Heroku provide free SSL/TLS
   - Docker: Use nginx reverse proxy with SSL

3. **Change SECRET_KEY for production**
   - Set in `.env.production`

4. **Restrict CORS** (if needed):
   ```python
   CORS(app, resources={
       r"/api/*": {"origins": ["https://yourdomain.com"]}
   })
   ```

---

## 📝 Deployment Comparison

| Platform | Setup Time | Cost | Scalability | Monitoring |
|----------|-----------|------|------------|-----------|
| Railway | 5 min | Free tier available | ⭐⭐⭐⭐ | ✅ Dashboard |
| Heroku | 10 min | Paid only | ⭐⭐⭐ | ✅ Logs |
| Docker | 15 min | Varies | ⭐⭐⭐⭐⭐ | ✅ Custom |
| Windows | 30 min | Server cost | ⭐⭐ | ⚠️ Limited |

---

## 🚀 Recommended Deployment Path

### For Beginners: **Railway.app**
- Easiest setup
- Free tier generous
- Auto-deploys on git push
- Best for learning

### For Production: **Docker on Cloud**
- Most scalable
- Better control
- Cost-effective at scale
- Works anywhere

### For Enterprise: **Windows Server + SSL**
- On-premises control
- Windows integration
- Full audit trails
- Compliance-ready

---

## 📚 API Endpoints

### Core
- `GET /health` - Health check
- `GET /` - Serve frontend
- `POST /predict` - Analyze features
- `GET /monitor` - Get stats

### Alerts & Logs
- `GET /alerts` - List alerts
- `POST /alert` - Record alert
- `DELETE /alerts/clear` - Clear alerts
- `GET /logs` - Get detection logs

### Model
- `GET /model/info` - Model details
- `GET /simulate/benign` - Test benign
- `GET /simulate/ransom` - Test ransomware

---

## ✅ Post-Deployment Checklist

- [ ] Health check passes
- [ ] Frontend loads without errors
- [ ] API prediction works
- [ ] Model is loaded
- [ ] No CORS errors in browser console
- [ ] Logs are accessible
- [ ] Monitoring dashboard works
- [ ] Alerts can be sent and retrieved
- [ ] Performance is acceptable
- [ ] HTTPS is enabled (production)

---

## 🆘 Support & Debugging

### Enable Debug Logging
```powershell
$env:FLASK_ENV = "development"
$env:FLASK_DEBUG = "1"
python backend/app.py
```

### View Detailed Logs
```powershell
# Railway
railway logs --follow

# Heroku
heroku logs --tail --app your-app-name

# Local
python backend/app.py  # Logs to console
```

### Common Build Issues
1. **npm install fails** → Use `npm install --legacy-peer-deps`
2. **terser missing** → Use `npm install terser --save-dev`
3. **TensorFlow slow** → Use `tensorflow-cpu` instead
4. **Model not found** → Check absolute paths work from different directories

---

**Last Updated:** April 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅
