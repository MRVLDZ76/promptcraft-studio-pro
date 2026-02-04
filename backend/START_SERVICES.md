# Start PromptCraft Backend Services

## Quick Start (Recommended)

### Option 1: Start Redis with Docker (Easiest)
```powershell
# Start only Redis
docker-compose up -d redis

# Verify Redis is running
docker ps
# Should see: promptcraft-redis running on port 6379
```

### Option 2: Start All Services with Docker
```powershell
# Start everything (PostgreSQL, Redis, Django, Celery)
docker-compose up -d

# View logs
docker-compose logs -f
```

## Manual Development Setup

If you prefer running Django locally but need Redis:

### 1. Start Redis
```powershell
# Option A: Docker (recommended)
docker-compose up -d redis

# Option B: Download Redis for Windows
# https://github.com/tporadowski/redis/releases
# Extract and run: redis-server.exe
```

### 2. Start Django Server
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

### 3. Start Celery Worker
Open a new terminal:
```powershell
cd backend
.\start_celery_worker.ps1
```

## Verify Services

### Check Redis
```powershell
# Test Redis connection
docker exec -it promptcraft-redis redis-cli ping
# Should return: PONG
```

### Check Celery
```powershell
# In the Celery worker terminal, you should see:
# [tasks]
#   . apps.publishing.tasks.generate_book_outline
#   . apps.publishing.tasks.process_all_blocks
#   . apps.publishing.tasks.process_single_block
```

## Troubleshooting

### Error: "No connection to Redis"
**Solution**: Start Redis
```powershell
docker-compose up -d redis
```

### Error: "Celery worker not responding"
**Solution**: Restart Celery worker
```powershell
# Press Ctrl+C in the Celery terminal
# Then run again:
.\start_celery_worker.ps1
```

### Error: "Port 6379 already in use"
**Solution**: Another Redis instance is running
```powershell
# Stop Docker Redis
docker-compose down redis

# Or stop Windows Redis
# Find and close redis-server.exe in Task Manager
```

## Current Setup Status

Based on your terminals:
- ✅ Backend directory ready
- ❌ Redis NOT running (causing Celery errors)
- ❌ Celery worker NOT started

**Quick Fix:**
```powershell
# Terminal 1: Start Redis
docker-compose up -d redis

# Terminal 2: Start Celery (in backend directory)
cd C:\Users\Elena\promptStudio\backend
.\start_celery_worker.ps1
```

After this, book creation will work properly!
