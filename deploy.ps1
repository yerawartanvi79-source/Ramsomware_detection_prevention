#!/usr/bin/env powershell
<#
.SYNOPSIS
    Automated deployment script for RanSAP Ransomware Detection System
.DESCRIPTION
    Sets up and deploys the application for production or local testing
.PARAMETER Environment
    Specify 'local', 'production', or 'docker'
#>

param(
    [ValidateSet('local', 'production', 'docker')]
    [string]$Environment = 'local'
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $color = @{
        "SUCCESS" = "Green"
        "ERROR" = "Red"
        "WARNING" = "Yellow"
        "INFO" = "Cyan"
    }
    Write-Host "[$Status] $Message" -ForegroundColor $color[$Status]
}

function Test-Prerequisites {
    Write-Host "`n" + "="*60
    Write-Host "  CHECKING PREREQUISITES" -ForegroundColor Cyan
    Write-Host "="*60 + "`n"
    
    # Check Node.js
    try {
        $node_version = & node --version
        Write-Status "Node.js installed: $node_version" "SUCCESS"
    } catch {
        Write-Status "Node.js not found. Download from https://nodejs.org/" "ERROR"
        exit 1
    }
    
    # Check Python
    try {
        $python_version = & python --version
        Write-Status "Python installed: $python_version" "SUCCESS"
    } catch {
        Write-Status "Python not found. Download from https://python.org/" "ERROR"
        exit 1
    }
    
    # Check Git
    try {
        $git_version = & git --version
        Write-Status "Git installed: $git_version" "SUCCESS"
    } catch {
        Write-Status "Git not found (optional)" "WARNING"
    }
    
    # Check model files
    if (-not (Test-Path "model\ransomware_lstm_model.keras")) {
        Write-Status "Model file missing: model/ransomware_lstm_model.keras" "ERROR"
        exit 1
    }
    Write-Status "Model file found" "SUCCESS"
    
    if (-not (Test-Path "model\scaler.pkl")) {
        Write-Status "Scaler file missing: model/scaler.pkl" "ERROR"
        exit 1
    }
    Write-Status "Scaler file found" "SUCCESS"
}

function Install-Dependencies {
    Write-Host "`n" + "="*60
    Write-Host "  INSTALLING DEPENDENCIES" -ForegroundColor Cyan
    Write-Host "="*60 + "`n"
    
    # Python dependencies
    Write-Status "Installing Python dependencies..." "INFO"
    & pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Failed to install Python dependencies" "ERROR"
        exit 1
    }
    Write-Status "Python dependencies installed" "SUCCESS"
    
    # Node dependencies
    Write-Status "Installing Node.js dependencies..." "INFO"
    Set-Location frontend
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Failed to install Node dependencies" "ERROR"
        exit 1
    }
    Write-Status "Node dependencies installed" "SUCCESS"
    Set-Location ..
    
    # Install terser if missing
    Write-Status "Ensuring terser is installed..." "INFO"
    Set-Location frontend
    & npm install terser --save-dev
    Set-Location ..
    Write-Status "Terser installed" "SUCCESS"
}

function Build-Frontend {
    Write-Host "`n" + "="*60
    Write-Host "  BUILDING FRONTEND" -ForegroundColor Cyan
    Write-Host "="*60 + "`n"
    
    Set-Location frontend
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Set-Location ..
        Write-Status "Frontend build failed" "ERROR"
        exit 1
    }
    Set-Location ..
    Write-Status "Frontend built successfully" "SUCCESS"
    
    # Verify build output
    if (-not (Test-Path "frontend\dist\index.html")) {
        Write-Status "Build output missing: frontend/dist/index.html" "ERROR"
        exit 1
    }
    Write-Status "Frontend build verified" "SUCCESS"
}

function Test-Backend {
    Write-Host "`n" + "="*60
    Write-Host "  TESTING BACKEND" -ForegroundColor Cyan
    Write-Host "="*60 + "`n"
    
    Write-Status "Testing Python imports..." "INFO"
    $test_script = @'
import sys
try:
    import tensorflow
    import flask
    import flask_cors
    import numpy
    import pandas
    import joblib
    print("✓ All imports successful")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)
'@
    
    & python -c $test_script
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Backend import test failed" "ERROR"
        exit 1
    }
    Write-Status "Backend dependencies verified" "SUCCESS"
}

function Start-LocalServer {
    Write-Host "`n" + "="*60
    Write-Host "  STARTING LOCAL SERVER" -ForegroundColor Green
    Write-Host "="*60 + "`n"
    
    Write-Status "Starting Flask server..." "INFO"
    Write-Host "`nServer will start at: http://localhost:5000`n"
    Write-Host "Frontend will be served from: http://localhost:5000`nAPI will be available at: http://localhost:5000/api`n`n"
    
    $env:FLASK_ENV = "development"
    $env:FLASK_DEBUG = "0"
    
    & python backend\app.py
}

function Build-Docker {
    Write-Host "`n" + "="*60
    Write-Host "  BUILDING DOCKER IMAGE" -ForegroundColor Cyan
    Write-Host "="*60 + "`n"
    
    if (-not (Test-Path "Dockerfile")) {
        Write-Status "Dockerfile not found" "ERROR"
        exit 1
    }
    
    Write-Status "Building Docker image..." "INFO"
    & docker build -t ransomware-detection .
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Docker build failed" "ERROR"
        exit 1
    }
    Write-Status "Docker image built successfully" "SUCCESS"
    
    Write-Host "`n" + "="*60
    Write-Host "  DOCKER BUILD COMPLETE" -ForegroundColor Green
    Write-Host "="*60
    Write-Host "`nTo run the container:`n"
    Write-Host "  docker run -p 8000:8000 ransomware-detection`n"
    Write-Host "Then access: http://localhost:8000`n"
}

function Show-DeploymentGuide {
    Write-Host "`n" + "="*60
    Write-Host "  NEXT STEPS: DEPLOYMENT" -ForegroundColor Green
    Write-Host "="*60 + "`n"
    
    Write-Host "Choose your deployment method:`n"
    Write-Host "1. Railway.app (Recommended)"
    Write-Host "   - Easiest setup"
    Write-Host "   - Free tier available"
    Write-Host "   - Steps: See DEPLOY_PRODUCTION.md - Step 2`n"
    
    Write-Host "2. Docker"
    Write-Host "   - Most flexible"
    Write-Host "   - Deploy anywhere"
    Write-Host "   - Steps: See DEPLOY_PRODUCTION.md - Step 3`n"
    
    Write-Host "3. Windows Server"
    Write-Host "   - On-premises"
    Write-Host "   - Full control"
    Write-Host "   - Steps: See DEPLOY_PRODUCTION.md - Step 4`n"
    
    Write-Host "4. Heroku"
    Write-Host "   - Simple deployment"
    Write-Host "   - Paid only"
    Write-Host "   - Steps: See DEPLOY_PRODUCTION.md - Step 5`n"
    
    Write-Host "For detailed instructions: see DEPLOY_PRODUCTION.md`n"
}

# Main execution
try {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗"
    Write-Host "║   RanSAP Ransomware Detection - Deployment Script v2.0    ║"
    Write-Host "║   Environment: $Environment".PadRight(56) + "║"
    Write-Host "╚════════════════════════════════════════════════════════════╝`n"
    
    Test-Prerequisites
    Install-Dependencies
    Build-Frontend
    Test-Backend
    
    if ($Environment -eq 'local') {
        Start-LocalServer
    } elseif ($Environment -eq 'docker') {
        Build-Docker
        Show-DeploymentGuide
    } else {
        Write-Status "Deployment setup complete! Run 'python backend/app.py' to start." "SUCCESS"
        Show-DeploymentGuide
    }
    
} catch {
    Write-Status "Script failed: $_" "ERROR"
    exit 1
}
