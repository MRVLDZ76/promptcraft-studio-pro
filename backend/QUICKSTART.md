# 🚀 Quick Start - Django Backend

## ⚡ 3-Minute Setup

```powershell
# 1. Navigate to backend
cd c:\Users\Elena\promptStudio\backend

# 2. Run setup script (does everything automatically)
.\setup.ps1

# 3. Start server
python manage.py runserver
```

**Done!** 🎉 Visit http://localhost:8000/admin/

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `setup.ps1` | Automated setup script |
| `SETUP_GUIDE.md` | Detailed instructions |
| `WEEK1_COMPLETE.md` | What we built |
| `COMMANDS.md` | Quick reference |
| `.env.example` | Config template |

---

## 📍 Important URLs

```
Admin Panel:     http://localhost:8000/admin/
API Docs:        http://localhost:8000/api/docs/
API Schema:      http://localhost:8000/api/schema/
```

---

## 🔐 Test Authentication

```powershell
# Register
$body = @{
    email = "test@example.com"
    username = "test"
    password = "Pass123!"
    password_confirm = "Pass123!"
    full_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
    -Uri "http://localhost:8000/api/v1/auth/register/" `
    -Body $body -ContentType "application/json"

# Login
$body = @{username = "test"; password = "Pass123!"} | ConvertTo-Json
$r = Invoke-RestMethod -Method Post `
    -Uri "http://localhost:8000/api/v1/auth/login/" `
    -Body $body -ContentType "application/json"
$token = $r.access

# Get user
Invoke-RestMethod -Method Get `
    -Uri "http://localhost:8000/api/v1/auth/me/" `
    -Headers @{Authorization="Bearer $token"}
```

---

## 📦 What's Included

✅ User authentication (JWT)  
✅ Rate limiting  
✅ Admin interface  
✅ API documentation  
✅ Docker support  
✅ Celery async tasks  
✅ 60+ dependencies installed  

---

## 🐛 Troubleshooting

**Problem: Can't activate venv**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Problem: PostgreSQL not running**
```powershell
docker-compose up -d db
```

**Problem: Redis not running**
```powershell
docker-compose up -d redis
```

---

## 📚 Read Next

1. **SETUP_GUIDE.md** - Detailed setup
2. **WEEK1_COMPLETE.md** - What we built
3. **COMMANDS.md** - All commands

---

## 🎯 Next Week

**Week 2: Analysis API**
- Port Gemini service to Python
- Create analysis endpoints
- Implement async processing
- Connect to frontend

---

**Questions?** Check `SETUP_GUIDE.md` for detailed help!
