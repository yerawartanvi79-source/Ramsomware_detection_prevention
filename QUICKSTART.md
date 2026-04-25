# 🚀 Quick Start Guide - RanSAP v2.0

## ⚡ Fastest Setup (30 seconds)

### Automated Setup
```powershell
# Windows PowerShell
.\deploy.ps1 -Environment local

# This will:
# ✓ Check prerequisites
# ✓ Install all dependencies
# ✓ Build frontend
# ✓ Start backend server at http://localhost:5000
```

---

## 🛠️ Manual Setup

### 1. Install Dependencies
```powershell
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 2. Build Frontend
```powershell
npm run build
```

### 3. Start Backend
```powershell
python backend/app.py
```

Then open: **http://localhost:5000**

---

## 📦 For Production Deployment

**See:** [DEPLOY_PRODUCTION.md](DEPLOY_PRODUCTION.md)

### Quick Railway Deploy (2 minutes)
```powershell
# 1. Build
npm run build

# 2. Commit to Git
git add .
git commit -m "Deploy v2.0"

# 3. Deploy to Railway
npm install -g @railway/cli
railway login
railway up
```

Then access: **https://your-railway-url.railway.app**

---

## ✅ Verify It Works

```powershell
# Health check
curl http://localhost:5000/health

# Frontend loads
curl http://localhost:5000/

# Make prediction
$body = @{
    features = @(100000, 4096, 1, 200, 2, 10000) * 100
} | ConvertTo-Json

curl -Method POST `
  -Uri "http://localhost:5000/predict" `
  -Body $body
```

---

## 🆘 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `npm ERR! code ERESOLVE` | `cd frontend && npm install --legacy-peer-deps && cd ..` |
| `terser not found` | `cd frontend && npm install terser --save-dev && cd ..` |
| `Model not loaded` | Check `model/ransomware_lstm_model.keras` and `model/scaler.pkl` exist |
| Port 5000 in use | `netstat -ano \| findstr :5000` then `taskkill /PID <PID> /F` |
| Frontend not found | `npm run build` then restart `python backend/app.py` |

---

## 📚 Documentation

- **[DEPLOY_PRODUCTION.md](DEPLOY_PRODUCTION.md)** - Full deployment guide (Railway, Docker, Heroku, Windows)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed API & configuration reference
- **[README.md](README.md)** - Project overview

---

## 🚀 Deployment Platforms

1. **Railway.app** - ⭐ Recommended (free tier, easiest)
2. **Docker** - Most flexible
3. **Heroku** - Simple but paid
4. **Windows Server** - On-premises control

Choose one and follow steps in [DEPLOY_PRODUCTION.md](DEPLOY_PRODUCTION.md)

---

## 💡 Tips

- Frontend and backend are now **combined** (single deployment)
- Built frontend lives in `frontend/dist/`
- Backend serves frontend from root path `/`
- All API calls go to same origin
- Environment auto-detects (dev uses port 5173, prod uses 5000)
