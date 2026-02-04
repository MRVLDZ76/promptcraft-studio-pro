# 🚀 PromptCraft Studio Pro - Django Backend Setup

## ✅ Week 1 Complete! 

You now have a production-ready Django backend structure with:
- ✅ User authentication (JWT)
- ✅ Custom User model with subscription support
- ✅ Rate limiting middleware
- ✅ Settings for dev/prod environments
- ✅ Celery configuration for async tasks
- ✅ API documentation setup (Swagger)
- ✅ Complete project structure

## 📋 Next Steps - Getting It Running

### Step 1: Install Dependencies (5 minutes)

```powershell
# Navigate to backend directory
cd c:\Users\Elena\promptStudio\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

### Step 2: Setup PostgreSQL Database (10 minutes)

Option A: Install PostgreSQL locally
```powershell
# Download from: https://www.postgresql.org/download/windows/
# Or use Docker:
docker run --name promptcraft-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Create database
psql -U postgres
CREATE DATABASE promptcraft_db;
\q
```

Option B: Use managed PostgreSQL (Recommended for production)
- Supabase (free tier)
- DigitalOcean ($15/month)
- AWS RDS

### Step 3: Setup Redis (5 minutes)

```powershell
# Install Redis for Windows
# Option 1: Download from https://github.com/tporadowski/redis/releases

# Option 2: Use Docker (easier)
docker run --name promptcraft-redis -p 6379:6379 -d redis:7-alpine

# Option 3: Use managed Redis
# - Redis Labs (free tier)
# - DigitalOcean ($15/month)
```

### Step 4: Configure Environment (5 minutes)

```powershell
# Copy example environment file
cp .env.example .env

# Edit .env with your settings (use VS Code or notepad)
code .env
```

**Required changes in .env:**
```env
# Generate a secure secret key (run this in Python):
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=your-generated-secret-key-here

# Database (if not using defaults)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/promptcraft_db

# Add your API keys
GEMINI_API_KEY=your_actual_gemini_key
SERPAPI_KEY=your_actual_serpapi_key
```

### Step 5: Run Migrations (2 minutes)

```powershell
# Make sure virtual environment is active
.\venv\Scripts\activate

# Run migrations to create database tables
python manage.py makemigrations
python manage.py migrate

# Create a superuser for admin access
python manage.py createsuperuser
# Enter: email, username, password
```

### Step 6: Test the Server (1 minute)

```powershell
# Start Django development server
python manage.py runserver

# You should see:
# Starting development server at http://127.0.0.1:8000/
```

**Test endpoints:**
- Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/
- API Schema: http://localhost:8000/api/schema/

### Step 7: Test Authentication API (5 minutes)

Using PowerShell or Postman:

**Register a new user:**
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

**Login:**
```powershell
$body = @{
    username = "testuser"
    password = "TestPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post `
    -Uri "http://localhost:8000/api/v1/auth/login/" `
    -Body $body `
    -ContentType "application/json"

# Save token for next requests
$token = $response.access
```

**Get current user:**
```powershell
Invoke-RestMethod -Method Get `
    -Uri "http://localhost:8000/api/v1/auth/me/" `
    -Headers @{Authorization="Bearer $token"}
```

## 🎉 Success Checklist

- [ ] Virtual environment created and activated
- [ ] All dependencies installed
- [ ] PostgreSQL running and database created
- [ ] Redis running
- [ ] .env file configured
- [ ] Migrations completed
- [ ] Superuser created
- [ ] Development server running
- [ ] Can access admin panel
- [ ] Can register new user via API
- [ ] Can login and get JWT token
- [ ] Can get current user info

## 📁 What We Created

```
backend/
├── manage.py                          ✅ Django management script
├── requirements.txt                   ✅ Python dependencies
├── .env.example                       ✅ Environment template
├── .gitignore                         ✅ Git ignore rules
├── README.md                          ✅ Documentation
│
├── config/                            ✅ Django configuration
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py                   ✅ Base settings
│   │   ├── development.py            ✅ Dev settings
│   │   └── production.py             ✅ Prod settings
│   ├── urls.py                       ✅ URL routing
│   ├── wsgi.py                       ✅ WSGI config
│   ├── asgi.py                       ✅ ASGI config
│   └── celery.py                     ✅ Celery config
│
└── apps/                              ✅ Django apps
    ├── accounts/                      ✅ COMPLETE - Authentication
    │   ├── models.py                 ✅ Custom User model
    │   ├── serializers.py            ✅ API serializers
    │   ├── views.py                  ✅ API views
    │   ├── urls.py                   ✅ URL routing
    │   ├── admin.py                  ✅ Admin config
    │   └── apps.py                   ✅ App config
    │
    ├── core/                          ✅ COMPLETE - Utilities
    │   ├── middleware.py             ✅ Rate limiting
    │   ├── exceptions.py             ✅ Custom exceptions
    │   ├── permissions.py            ✅ Custom permissions
    │   └── apps.py                   ✅ App config
    │
    ├── analyses/                      📋 TODO - Week 2
    │   └── (placeholder files)
    │
    └── subscriptions/                 📋 TODO - Week 2-3
        └── (placeholder files)
```

## 🚀 Week 2 Preview - What's Next

**Days 1-2: Analysis API**
- Create Analysis model (migrate from Supabase schema)
- Port geminiService.ts to Python
- Create `/api/v1/analyses/` endpoints
- Setup Celery task for async processing

**Days 3-4: Transcription & YouTube**
- Port serpApiService.ts to Python
- Create YouTube search proxy
- Implement transcript fetching
- Create `/api/v1/transcriptions/` endpoints

**Day 5: Testing**
- Unit tests for authentication
- Integration tests for API
- Fix any bugs

## 🛠️ Troubleshooting

**Problem: Can't install psycopg2-binary**
```powershell
# Install PostgreSQL development files first
# Or use: pip install psycopg2-binary --no-binary psycopg2-binary
```

**Problem: Redis connection failed**
```powershell
# Make sure Redis is running
docker ps  # Check if container is running
docker start promptcraft-redis  # Start if stopped
```

**Problem: Database connection failed**
```powershell
# Check PostgreSQL is running
# Verify DATABASE_URL in .env is correct
# Test connection: psql -U postgres -d promptcraft_db
```

**Problem: Module not found errors**
```powershell
# Make sure virtual environment is activated
.\venv\Scripts\activate
# Reinstall dependencies
pip install -r requirements.txt
```

## 📚 Resources

- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- JWT Docs: https://django-rest-framework-simplejwt.readthedocs.io/
- Celery Docs: https://docs.celeryq.dev/

## ✅ You're Ready!

Once you complete these steps, you'll have:
- ✅ Working Django backend
- ✅ User authentication with JWT
- ✅ Rate limiting
- ✅ Admin panel
- ✅ API documentation
- ✅ Ready for Week 2 development

**Next Task**: Week 2 - Build the Analysis API and integrate with your frontend!
