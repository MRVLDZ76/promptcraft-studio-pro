# Video Production Setup Guide

## Quick Start Instructions

### Prerequisites
1. ✅ Python dependencies installed (already done)
2. ⚠️ Redis server (needs to be installed/started)
3. ⚠️ FFmpeg (needs to be installed for MoviePy)

---

## 1. Install Redis

### Option A: Windows (Recommended for Development)
Download from Microsoft Archive:
```
https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.msi
```

After installation, Redis runs as a Windows service automatically.

### Option B: Docker (Alternative)
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

### Test Redis Connection
```bash
redis-cli ping
# Should return: PONG
```

---

## 2. Install FFmpeg

### Windows
1. Download from: https://www.gyan.dev/ffmpeg/builds/
2. Extract to `C:\ffmpeg`
3. Add to PATH: `C:\ffmpeg\bin`
4. Test: Open new terminal and run `ffmpeg -version`

### Alternative (via Chocolatey)
```bash
choco install ffmpeg
```

---

## 3. Start Celery Worker

Open a new PowerShell terminal in the backend directory:

```powershell
cd C:\Users\Elena\promptStudio\backend
.\venv\Scripts\activate
celery -A config worker -l info --pool=solo
```

**Important**: Use `--pool=solo` on Windows (required due to multiprocessing issues)

You should see:
```
 -------------- celery@YourPC v5.4.0
---- **** -----
--- * ***  * -- Windows-11
-- * - **** ---
- ** ---------- [config]
- ** ---------- .> app:         promptcraft:0x...
- ** ---------- .> transport:   redis://localhost:6379/0
...
```

---

## 4. Start Celery Beat (Optional - Scheduled Tasks)

In another terminal:

```powershell
cd C:\Users\Elena\promptStudio\backend
.\venv\Scripts\activate
celery -A config beat -l info
```

This handles scheduled tasks like:
- Daily cleanup of old render jobs
- Monthly usage reset
- Subscription checks

---

## 5. Test Render Job Creation

### Via Django Shell
```powershell
cd C:\Users\Elena\promptStudio\backend
.\venv\Scripts\python.exe manage.py shell
```

```python
from apps.video_production.models import RenderJob
from apps.chronstudio.models import ChronStudioProject, ChronStudioScene
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(email='admin@example.com')

# Get a project with scenes
project = ChronStudioProject.objects.filter(
    user=user, 
    scenes__isnull=False
).first()

if project:
    # Get scene IDs
    scene_ids = list(project.scenes.values_list('id', flat=True))
    
    # Create render job
    job = RenderJob.objects.create(
        user=user,
        project=project,
        scene_ids=[str(sid) for sid in scene_ids[:3]],  # First 3 scenes
        style='dynamic',
        target_duration=60
    )
    
    print(f"Created render job: {job.id}")
    print(f"Status: {job.status}")
    
    # Trigger Celery task
    from apps.video_production.tasks import render_video_sequence
    result = render_video_sequence.delay(str(job.id))
    print(f"Celery task ID: {result.id}")
    
    # Check job after a moment
    job.refresh_from_db()
    print(f"Updated status: {job.status}")
    print(f"Progress: {job.progress_percentage}%")
```

### Via API (cURL)
```bash
# Get auth token first
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@example.com", "password": "admin123"}'

# Create render job
curl -X POST http://localhost:8000/api/v1/video-production/render-jobs/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "project": "project-uuid",
    "scene_ids": ["scene-uuid-1", "scene-uuid-2"],
    "style": "dynamic",
    "include_title_cards": true
  }'

# Check job status
curl http://localhost:8000/api/v1/video-production/render-jobs/{job-id}/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 6. Monitor Celery Tasks

### Check Active Tasks
```powershell
.\venv\Scripts\python.exe -c "from celery import Celery; app = Celery('promptcraft'); app.config_from_object('django.conf:settings', namespace='CELERY'); i = app.control.inspect(); print('Active:', i.active())"
```

### Check Redis Queue
```bash
redis-cli
> LLEN celery  # Check queue length
> KEYS *       # See all keys
```

---

## 7. Troubleshooting

### Error: "No module named 'celery'"
```bash
.\venv\Scripts\pip.exe install celery
```

### Error: "Error 61 connecting to localhost:6379"
Redis is not running. Start Redis service or Docker container.

### Error: "FFmpeg not found"
Install FFmpeg and add to PATH, or set `IMAGEIO_FFMPEG_EXE` environment variable.

### Celery worker won't start
On Windows, always use `--pool=solo` flag:
```bash
celery -A config worker -l info --pool=solo
```

### Task stuck in "queued" status
Check Celery worker is running and connected to Redis.

---

## 8. Development Workflow

### Terminal 1: Django Server
```powershell
cd C:\Users\Elena\promptStudio\backend
.\venv\Scripts\python.exe manage.py runserver
```

### Terminal 2: Celery Worker
```powershell
cd C:\Users\Elena\promptStudio\backend
celery -A config worker -l info --pool=solo
```

### Terminal 3: Frontend (Optional)
```powershell
cd C:\Users\Elena\promptStudio\promptcraft-studio-pro
npm run dev
```

---

## 9. Current Limitations (Phase 1)

- ✅ Infrastructure complete
- ✅ API endpoints working
- ✅ Celery tasks queue and execute
- ⚠️ Actual video downloading: **Not implemented** (Phase 2)
- ⚠️ Video concatenation: **Placeholder only** (Phase 2)
- ⚠️ Storage upload: **Placeholder URL** (Phase 2)
- ⚠️ LLM Director: **Not implemented** (Phase 3)

**Expected Behavior**: Jobs will complete immediately with a placeholder output URL. This is normal for Phase 1.

---

## 10. Next Steps

Ready to implement actual video processing? See:
- [VIDEO_SEQUENCING_IMPLEMENTATION_PLAN.md](VIDEO_SEQUENCING_IMPLEMENTATION_PLAN.md) - Full implementation roadmap
- [PHASE_1_COMPLETE_VIDEO_SEQUENCING.md](PHASE_1_COMPLETE_VIDEO_SEQUENCING.md) - What was just built

**Phase 2 Requirements:**
1. Implement video download helper
2. Implement MoviePy concatenation
3. Setup Supabase storage for uploads
4. Add progress callbacks
5. Error handling and retries

---

## Support

- Django Admin: http://localhost:8000/admin
- API Root: http://localhost:8000/api/v1/
- Render Jobs: http://localhost:8000/api/v1/video-production/render-jobs/
- Redis CLI: `redis-cli monitor` (watch commands in real-time)
- Celery Flower (optional monitoring): `pip install flower && celery -A config flower`
