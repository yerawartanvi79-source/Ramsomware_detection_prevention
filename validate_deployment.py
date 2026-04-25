#!/usr/bin/env python3
"""
Deployment validation script - tests all components before deployment
"""

import os
import sys
import json
import subprocess
from pathlib import Path

class DeploymentValidator:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.passed = 0
        self.failed = 0
        self.warnings = 0

    def print_section(self, title):
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}")

    def check(self, name, condition, fix_hint=""):
        status = "✅ PASS" if condition else "❌ FAIL"
        print(f"  {status}: {name}")
        if condition:
            self.passed += 1
        else:
            self.failed += 1
            if fix_hint:
                print(f"        Fix: {fix_hint}")

    def warning(self, name, message=""):
        print(f"  ⚠️  WARNING: {name}")
        if message:
            print(f"        {message}")
        self.warnings += 1

    def validate_structure(self):
        self.print_section("1. Project Structure")
        
        # Check required directories
        required_dirs = [
            "model",
            "backend",
            "frontend",
            "frontend/src",
            "frontend/dist",
            "logs",
        ]
        
        for dir_name in required_dirs:
            path = self.base_dir / dir_name
            self.check(
                f"Directory exists: {dir_name}/",
                path.exists(),
                f"Create: mkdir {dir_name}"
            )

    def validate_model_files(self):
        self.print_section("2. Model Files")
        
        model_dir = self.base_dir / "model"
        
        keras_file = model_dir / "ransomware_lstm_model.keras"
        self.check(
            "Model file (*.keras) exists",
            keras_file.exists(),
            "Train model or download pre-trained model"
        )
        
        scaler_file = model_dir / "scaler.pkl"
        self.check(
            "Scaler file (*.pkl) exists",
            scaler_file.exists(),
            "Train model with scaler"
        )

    def validate_backend(self):
        self.print_section("3. Backend Files")
        
        backend_files = [
            "backend/app.py",
            "requirements.txt",
            "Procfile",
            "railway.json",
            ".env.development",
            ".env.production",
        ]
        
        for file in backend_files:
            path = self.base_dir / file
            self.check(
                f"File exists: {file}",
                path.exists(),
                f"Create file: {file}"
            )

    def validate_frontend(self):
        self.print_section("4. Frontend Files")
        
        frontend_files = [
            "frontend/package.json",
            "frontend/vite.config.js",
            "frontend/src/App.jsx",
            "frontend/index.html",
        ]
        
        for file in frontend_files:
            path = self.base_dir / file
            self.check(
                f"File exists: {file}",
                path.exists(),
                f"Create file: {file}"
            )
        
        # Check if frontend is built
        dist_index = self.base_dir / "frontend/dist/index.html"
        if not dist_index.exists():
            self.warning(
                "Frontend not built",
                "Run: npm run build"
            )

    def validate_python_dependencies(self):
        self.print_section("5. Python Dependencies")
        
        try:
            import tensorflow
            self.check("TensorFlow installed", True)
        except ImportError:
            self.check("TensorFlow installed", False, "pip install tensorflow-cpu")
        
        try:
            import flask
            self.check("Flask installed", True)
        except ImportError:
            self.check("Flask installed", False, "pip install flask")
        
        try:
            import flask_cors
            self.check("Flask-CORS installed", True)
        except ImportError:
            self.check("Flask-CORS installed", False, "pip install flask-cors")
        
        try:
            import psutil
            self.check("psutil installed", True)
        except ImportError:
            self.check("psutil installed", False, "pip install psutil")

    def validate_node_dependencies(self):
        self.print_section("6. Node Dependencies")
        
        package_json = self.base_dir / "frontend/package.json"
        if package_json.exists():
            with open(package_json) as f:
                pkg = json.load(f)
            
            required = ["react", "react-dom"]
            for dep in required:
                has_dep = dep in pkg.get("dependencies", {})
                self.check(
                    f"npm package exists: {dep}",
                    has_dep,
                    f"cd frontend && npm install {dep}"
                )
        
        node_modules = self.base_dir / "frontend/node_modules"
        if not node_modules.exists():
            self.warning(
                "node_modules not installed",
                "Run: cd frontend && npm install"
            )

    def validate_configuration(self):
        self.print_section("7. Configuration Files")
        
        # Check Procfile
        procfile = self.base_dir / "Procfile"
        if procfile.exists():
            with open(procfile) as f:
                content = f.read()
            self.check(
                "Procfile has gunicorn command",
                "gunicorn" in content,
                "Update Procfile with gunicorn command"
            )
        
        # Check railway.json
        railway_json = self.base_dir / "railway.json"
        if railway_json.exists():
            try:
                with open(railway_json) as f:
                    config = json.load(f)
                self.check(
                    "railway.json is valid JSON",
                    True
                )
                self.check(
                    "railway.json has build config",
                    "build" in config,
                    "Add build configuration"
                )
            except:
                self.check("railway.json is valid JSON", False, "Fix JSON syntax")

    def validate_app_config(self):
        self.print_section("8. Application Configuration")
        
        app_file = self.base_dir / "backend/app.py"
        if app_file.exists():
            with open(app_file) as f:
                content = f.read()
            
            self.check(
                "Backend serves static files",
                "frontend/dist" in content,
                "Update backend/app.py to serve static files"
            )
            
            self.check(
                "CORS enabled",
                "CORS" in content,
                "Add CORS support to Flask"
            )
            
            self.check(
                "Error handlers defined",
                "@app.errorhandler" in content,
                "Add error handlers"
            )
        
        app_jsx = self.base_dir / "frontend/src/App.jsx"
        if app_jsx.exists():
            with open(app_jsx) as f:
                content = f.read()
            
            self.check(
                "Frontend uses environment API URL",
                "getApiBase" in content or "VITE_API_BASE" in content,
                "Update App.jsx to use environment variables"
            )

    def validate_deployment_docs(self):
        self.print_section("9. Documentation")
        
        docs = [
            "DEPLOYMENT.md",
            "QUICKSTART.md",
            "README.md",
        ]
        
        for doc in docs:
            path = self.base_dir / doc
            self.check(
                f"Documentation exists: {doc}",
                path.exists(),
                f"Create: {doc}"
            )

    def run_tests(self):
        self.print_section("10. Running Tests")
        
        try:
            # Test backend import
            sys.path.insert(0, str(self.base_dir))
            from backend import app as backend_app
            self.check("Backend imports successfully", True)
        except Exception as e:
            self.check("Backend imports successfully", False, str(e))

    def generate_report(self):
        self.print_section("VALIDATION REPORT")
        
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print(f"\n  Total Checks: {total}")
        print(f"  ✅ Passed: {self.passed}")
        print(f"  ❌ Failed: {self.failed}")
        print(f"  ⚠️  Warnings: {self.warnings}")
        print(f"  Success Rate: {success_rate:.1f}%")
        
        if self.failed == 0:
            print(f"\n  🎉 All checks passed! Ready for deployment.")
            return 0
        else:
            print(f"\n  ⚠️  Fix {self.failed} issue(s) before deployment.")
            return 1

    def run(self):
        print("\n" + "="*60)
        print("  DEPLOYMENT VALIDATION v2.0")
        print("  Ransomware Detection & Prevention System")
        print("="*60)
        
        self.validate_structure()
        self.validate_model_files()
        self.validate_backend()
        self.validate_frontend()
        self.validate_python_dependencies()
        self.validate_node_dependencies()
        self.validate_configuration()
        self.validate_app_config()
        self.validate_deployment_docs()
        self.run_tests()
        
        return self.generate_report()


if __name__ == "__main__":
    validator = DeploymentValidator()
    exit_code = validator.run()
    sys.exit(exit_code)
