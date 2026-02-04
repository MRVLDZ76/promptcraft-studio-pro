# 🔧 Python Installation Guide for Windows

## Problem Detected
Your system doesn't have Python installed properly. The error message shows:
```
no se encontró Python; ejecutar sin argumentos para instalar desde el Microsoft Store...
```

## ✅ Solution: Install Python 3.11

### Option 1: Direct Download (Recommended - 5 minutes)

1. **Download Python 3.11**
   - Visit: https://www.python.org/downloads/windows/
   - Download: **Python 3.11.8** (or latest 3.11.x)
   - Choose: "Windows installer (64-bit)"

2. **Install with Important Settings**
   - ✅ **CHECK**: "Add Python 3.11 to PATH" (CRITICAL!)
   - ✅ **CHECK**: "Install pip"
   - Click "Install Now"
   - Wait for installation to complete
   - Click "Disable path length limit" if prompted

3. **Verify Installation**
   ```powershell
   # Close and reopen PowerShell, then run:
   python --version
   # Should show: Python 3.11.x
   
   pip --version
   # Should show: pip 23.x.x
   ```

### Option 2: Using Chocolatey (If you have it)

```powershell
# Run as Administrator
choco install python311 -y
```

### Option 3: Using winget (Windows 10+)

```powershell
# Run as Administrator
winget install Python.Python.3.11
```

---

## 🔄 After Installing Python

### Step 1: Verify Python is Working
```powershell
# Close and reopen PowerShell
python --version
pip --version
```

### Step 2: Re-run Setup Script
```powershell
cd C:\Users\Elena\promptStudio\backend
.\setup.ps1
```

---

## 🐛 Still Having Issues?

### Issue: "python" command not found after installation

**Solution**: Add Python to PATH manually

1. Open "Edit System Environment Variables"
2. Click "Environment Variables"
3. Under "System Variables", find "Path"
4. Add these paths:
   ```
   C:\Users\Elena\AppData\Local\Programs\Python\Python311\
   C:\Users\Elena\AppData\Local\Programs\Python\Python311\Scripts\
   ```
5. Click OK, close all PowerShell windows
6. Open new PowerShell and try again

### Issue: Microsoft Store keeps opening

**Solution**: Disable Python App Execution Aliases

1. Open Settings
2. Go to Apps → Apps & features
3. Click "App execution aliases"
4. Turn OFF:
   - App Installer python.exe
   - App Installer python3.exe
5. Restart PowerShell

---

## 📦 Quick Manual Setup (If script still fails)

```powershell
# 1. Navigate to backend
cd C:\Users\Elena\promptStudio\backend

# 2. Create virtual environment (after Python is installed)
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 4. Upgrade pip
python -m pip install --upgrade pip

# 5. Install dependencies
pip install -r requirements.txt

# 6. Copy environment file
Copy-Item .env.example .env

# 7. Edit .env with your settings
notepad .env

# 8. Run migrations (will need PostgreSQL)
python manage.py migrate

# 9. Create superuser
python manage.py createsuperuser

# 10. Start server
python manage.py runserver
```

---

## 🗄️ Database Setup (PostgreSQL)

Since Docker is not installed, you have two options:

### Option A: Install PostgreSQL Locally (Recommended)

1. **Download PostgreSQL 15**
   - Visit: https://www.postgresql.org/download/windows/
   - Download installer
   - Run installer (default settings are fine)
   - Remember the password you set!

2. **Create Database**
   ```powershell
   # After installation, open PowerShell
   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
   
   # In psql prompt:
   CREATE DATABASE promptcraft_db;
   \q
   ```

3. **Update .env**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/promptcraft_db
   ```

### Option B: Use SQLite for Development (Easier)

Edit `config/settings/development.py`:

```python
# Comment out PostgreSQL, add SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**SQLite requires no installation!** Perfect for development.

---

## 🔴 Redis Setup (Optional for now)

Redis is only needed for:
- Rate limiting (can be disabled temporarily)
- Celery tasks (not needed for Week 1)

### Skip Redis for now:

1. Edit `config/settings/development.py`
2. Comment out Redis cache:
   ```python
   # CACHES = {
   #     'default': {
   #         'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
   #     }
   # }
   ```

3. Comment out rate limiting middleware in `config/settings/base.py`:
   ```python
   MIDDLEWARE = [
       # ... other middleware
       # 'apps.core.middleware.RateLimitMiddleware',  # Commented for now
   ]
   ```

---

## ✅ Minimal Setup (Get Running Fast)

If you just want to test the backend quickly:

```powershell
# 1. Install Python 3.11 from python.org
# 2. Open new PowerShell

cd C:\Users\Elena\promptStudio\backend

# Create venv
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Install only essential packages
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-decouple

# Use SQLite (edit settings/development.py)
# Comment out PostgreSQL, use SQLite

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

---

## 🎯 Next Steps After Python Installation

1. **Install Python 3.11** from python.org
2. **Verify**: `python --version` shows Python 3.11.x
3. **Re-run**: `.\setup.ps1`
4. **Or follow**: Manual setup steps above

---

## 📞 Need Help?

If you're still stuck:
1. Share the output of: `python --version`
2. Share the output of: `pip --version`
3. Share any error messages

---

**Start here**: Download Python 3.11 from https://www.python.org/downloads/
**Remember**: Check "Add Python to PATH" during installation!
