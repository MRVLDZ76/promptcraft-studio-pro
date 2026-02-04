# 🚀 Simplified Setup - No Python Yet Installed

## Step 1: Install Python (REQUIRED)

### Download & Install Python 3.11

1. **Go to**: https://www.python.org/downloads/windows/
2. **Download**: Python 3.11.8 (Windows 64-bit installer)
3. **IMPORTANT**: ✅ Check "Add Python 3.11 to PATH"
4. **Click**: Install Now
5. **Wait**: For installation to complete
6. **Click**: "Disable path length limit" (if prompted)

### Verify Installation

Close all PowerShell windows and open a NEW one:

```powershell
python --version
# Should show: Python 3.11.8 (or similar)

pip --version
# Should show: pip 23.x.x
```

✅ **If you see version numbers, continue to Step 2**  
❌ **If not, see**: PYTHON_INSTALLATION.md for troubleshooting

---

## Step 2: Setup Backend (AFTER Python is installed)

### Quick Setup Commands

```powershell
# Navigate to backend
cd C:\Users\Elena\promptStudio\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an error about execution policy:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# Then try activating again
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install Django and essential packages
pip install -r requirements.txt

# Copy environment template
Copy-Item .env.example .env

# Open and edit .env
notepad .env
```

---

## Step 3: Database Setup (Choose One)

### Option A: SQLite (Easiest - No Installation)

**Edit**: `config\settings\development.py`

Find the DATABASES section and replace with:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**Save** and continue to Step 4.

### Option B: PostgreSQL (Production-like)

1. **Download**: https://www.postgresql.org/download/windows/
2. **Install**: PostgreSQL 15 (remember password!)
3. **Create Database**:
   ```powershell
   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
   
   # In psql prompt:
   CREATE DATABASE promptcraft_db;
   \q
   ```
4. **Edit .env**:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/promptcraft_db
   ```

---

## Step 4: Initialize Database

```powershell
# Make sure virtual environment is active (you should see (venv) in prompt)

# Create database tables
python manage.py migrate

# Create admin user
python manage.py createsuperuser
# Enter email, username, and password when prompted
```

---

## Step 5: Start Server

```powershell
# Start Django server
python manage.py runserver

# You should see:
# Starting development server at http://127.0.0.1:8000/
```

**Open browser**: http://localhost:8000/admin/

---

## ✅ Success Checklist

- [ ] Python 3.11 installed
- [ ] `python --version` works
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] Database configured (SQLite or PostgreSQL)
- [ ] Migrations completed
- [ ] Superuser created
- [ ] Server running
- [ ] Can access admin panel

---

## 🎯 What to Do Next

### Test the API

**Register a user** (use PowerShell):
```powershell
$body = @{
    email = "test@example.com"
    username = "testuser"
    password = "TestPass123!"
    password_confirm = "TestPass123!"
    full_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
    -Uri "http://localhost:8000/api/v1/auth/register/" `
    -Body $body `
    -ContentType "application/json"
```

**Check API docs**: http://localhost:8000/api/docs/

---

## 🐛 Common Issues

### Issue: "pip" not recognized

**Fix**: Close and reopen PowerShell after Python installation

### Issue: Can't activate virtual environment

**Fix**:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Issue: "django" module not found

**Fix**: Make sure virtual environment is activated
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Issue: Database errors

**Fix**: Use SQLite instead of PostgreSQL (see Step 3, Option A)

---

## 📚 Files to Check

- **PYTHON_INSTALLATION.md** - Detailed Python setup
- **SETUP_GUIDE.md** - Full setup guide
- **COMMANDS.md** - Quick reference

---

**Start here**: Install Python from python.org, then follow these steps!
