# Video Rendering Integration Guide

## Overview

ChronStudio now has **server-side video concatenation** powered by MoviePy and Celery. This allows users to render all their scene videos into a single, professional output with transitions and effects.

## User Flow

### 1. Generate Scene Videos (Step 4: Production Studio)

Users click "Generate" on each scene to create individual video clips using Veo 3.1.

```
Scene 1: [✓ Completed] → video_url stored
Scene 2: [✓ Completed] → video_url stored  
Scene 3: [✓ Completed] → video_url stored
```

### 2. Finish Project → Render Options

When clicking "Finish Project", if scenes have videos, the **Render Modal** opens with options:

```
┌─────────────────────────────────────────┐
│  Render Options                         │
├─────────────────────────────────────────┤
│                                         │
│  3 scenes selected                      │
│                                         │
│  ☑ Crossfade Transitions (0.5s)        │
│  ☐ Title Cards (Phase 3)               │
│                                         │
│  [Cancel]  [Start Render] →            │
└─────────────────────────────────────────┘
```

### 3. Rendering Progress

Real-time progress updates every 2 seconds:

```
┌─────────────────────────────────────────┐
│  Rendering Video...                     │
├─────────────────────────────────────────┤
│  [████████████░░░░░░] 75%              │
│  Rendering scene 3/3                    │
│                                         │
│  ○ Analyzing ✓                          │
│  ○ Downloading ✓                        │
│  ○ Rendering (in progress)              │
│  ○ Uploading                            │
└─────────────────────────────────────────┘
```

### 4. Download Final Video

On completion:

```
┌─────────────────────────────────────────┐
│  ✓ Render Complete!                     │
│  Your video is ready                    │
│                                         │
│  [Download Video] ⬇                    │
└─────────────────────────────────────────┘
```

## Technical Architecture

### Frontend (React)

**RenderModal.tsx** - New component
- Options UI (transitions, title cards)
- Progress polling (every 2s)
- Status display
- Download link

**VideoProduction.tsx** - Updated
- Added `showRenderModal` state
- Modified `handleFinishProject` to check for completed scenes
- Opens modal instead of direct reset

**types.ts** - Updated
- Added optional `id?: string` to `ProjectData` interface

### Backend (Django)

**apps/chronstudio/views.py** - New endpoint
```python
POST /api/v1/chronstudio/projects/{id}/render/
```

Creates a render job with:
- Auto-selects all completed scenes (or use provided `scene_ids`)
- Validates scenes belong to project
- Starts Celery task
- Returns render job details

**apps/video_production/tasks.py** - Updated
- Real video download from scene `video_url`
- MoviePy concatenation with normalization
- Optional crossfade transitions
- Upload to storage backend
- Progress tracking (0-100%)
- Usage tracking (renders count)

**apps/video_production/utils.py** - Created
- `download_video()`: Stream download with progress
- `upload_video()`: Upload to Django storage
- `get_video_info()`: Extract metadata (duration, fps, resolution)
- `ensure_video_compatibility()`: Check if videos can concatenate
- `cleanup_temp_files()`: Cleanup utility

**apps/video_production/renderer.py** - Updated
- `concatenate_videos()`: Full MoviePy implementation
- `_normalize_clips()`: Resize to same resolution
- `_apply_crossfades()`: Fade transitions
- `create_title_card()`: 3 styles (minimal/cinematic/modern)

## API Endpoints

### Create Render Job (Convenience)

```http
POST /api/v1/chronstudio/projects/{project_id}/render/
Authorization: Bearer <token>
Content-Type: application/json

{
  "scene_ids": ["uuid1", "uuid2"],  // Optional, defaults to all completed
  "include_transitions": true,
  "include_title_cards": false,
  "title_card_style": "minimal"
}
```

**Response:**
```json
{
  "id": "render-job-uuid",
  "status": "queued",
  "progress_percentage": 0,
  "current_step": "",
  "project": "project-uuid",
  "scene_ids": ["scene1", "scene2"],
  "include_transitions": true,
  "celery_task_id": "task-uuid"
}
```

### Check Render Status

```http
GET /api/v1/video-production/render-jobs/{job_id}/
Authorization: Bearer <token>
```

**Response (In Progress):**
```json
{
  "id": "job-uuid",
  "status": "rendering",
  "progress_percentage": 65,
  "current_step": "Rendering scene 3/5",
  "output_video_url": null
}
```

**Response (Complete):**
```json
{
  "id": "job-uuid",
  "status": "completed",
  "progress_percentage": 100,
  "current_step": "Render complete!",
  "output_video_url": "https://storage.com/render_abc123.mp4",
  "output_duration_seconds": 45.2,
  "file_size_mb": 78.4,
  "total_render_time_seconds": 120
}
```

### Direct Render Job Creation

```http
POST /api/v1/video-production/render-jobs/
Authorization: Bearer <token>

{
  "project": "project-uuid",
  "scene_ids": ["scene1", "scene2"],
  "include_transitions": true,
  "include_title_cards": false
}
```

## Rendering Pipeline

### Phase 1: Analyzing (0-10%)
```python
job.status = 'analyzing'
job.current_step = 'Initializing render job...'
# Load scenes, validate they have videos
```

### Phase 2: Downloading (10-50%)
```python
job.status = 'downloading'
job.current_step = 'Downloading scene 1/3...'
# Download each scene's video_url to temp directory
# Progress: 10% + (scene_index / total_scenes * 40%)
```

### Phase 3: Rendering (50-85%)
```python
job.status = 'rendering'
job.current_step = 'Rendering final video...'
# MoviePy concatenation:
# 1. Load video clips
# 2. Normalize resolution
# 3. Apply crossfades (if enabled)
# 4. Write output (libx264 codec, aac audio)
```

### Phase 4: Uploading (85-100%)
```python
job.status = 'uploading'
job.current_step = 'Uploading final video...'
# Upload to Django storage backend
# Generate public URL
```

### Phase 5: Complete
```python
job.status = 'completed'
job.output_video_url = 'https://...'
job.output_duration_seconds = 45.2
job.total_render_time_seconds = 120
```

## Error Handling

### Frontend
- Network errors: Display error message in modal
- Invalid scenes: Show validation error
- Celery not running: Backend will return 500

### Backend
- Missing videos: "X scene(s) don't have generated videos yet"
- Download fails: Retry 3 times with exponential backoff
- Rendering fails: Update job status to 'failed', save error_message
- Cleanup: Temp files cleaned on success or error

### Celery Task Retry
```python
@shared_task(bind=True, max_retries=3)
def render_video_sequence(self, render_job_id):
    try:
        # ... rendering logic
    except Exception as e:
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        else:
            # Max retries reached
            raise
```

## Usage Tracking

After successful render:
```python
from apps.subscriptions.utils import track_usage

track_usage(
    user=job.user,
    resource_type='video_minutes',
    amount=float(job.output_duration_seconds) / 60
)

track_usage(
    user=job.user,
    resource_type='renders',
    amount=1
)
```

**Subscription Limits:**
- Free: 3 renders/month
- Pro: 100 renders/month
- Enterprise: Unlimited

## Testing Guide

### 1. Setup

Ensure Redis and Celery are running:
```powershell
# Terminal 1: Redis
docker run -d -p 6379:6379 redis:alpine

# Terminal 2: Celery Worker
cd backend
.\venv\Scripts\python.exe -m celery -A config worker -l info --pool=solo
```

### 2. Create Test Project

1. Open ChronStudio
2. Create a new project
3. Generate 2-3 scenes
4. Ensure each scene has `videoUrl` populated

### 3. Trigger Render

**Option A: Via UI**
1. Click "Finish Project"
2. Enable "Crossfade Transitions"
3. Click "Start Render"
4. Watch progress

**Option B: Via API**
```bash
curl -X POST http://127.0.0.1:8000/api/v1/chronstudio/projects/{id}/render/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"include_transitions": true}'
```

### 4. Monitor Progress

**Via UI**: Modal auto-polls every 2 seconds

**Via Celery Logs**:
```
[2026-02-02 20:00:00] INFO: Starting render job abc-123
[2026-02-02 20:00:05] INFO: Downloaded scene 1: scene_001.mp4
[2026-02-02 20:00:10] INFO: Downloaded scene 2: scene_002.mp4
[2026-02-02 20:00:15] INFO: Rendering 2 clips...
[2026-02-02 20:00:45] INFO: Rendering complete: 12.3s, 24.5 MB
[2026-02-02 20:00:50] INFO: Upload complete
[2026-02-02 20:00:50] INFO: Render job abc-123 completed in 50s
```

### 5. Verify Output

- Check `output_video_url` is accessible
- Download and play video
- Verify transitions work
- Check usage tracking updated

## Configuration

### Storage Backend

**Development (Local Storage)**
```python
# settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**Production (Supabase/S3)**
```python
# settings.py
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = 'your-bucket'
AWS_S3_REGION_NAME = 'us-east-1'
```

### Video Quality

Edit `apps/video_production/renderer.py`:
```python
# Default: 1080p, 24fps, 5Mbps
output_clip.write_videofile(
    output_path,
    codec='libx264',
    audio_codec='aac',
    fps=24,
    bitrate='5000k',  # Adjust quality here
    preset='medium',   # fast/medium/slow (speed vs quality)
    threads=4
)
```

### Transition Duration

Edit `apps/video_production/tasks.py`:
```python
renderer.concatenate_videos(
    video_paths=clips_to_render,
    output_path=output_path,
    transitions=use_transitions,
    transition_duration=0.5,  # Change to 1.0 for longer fades
    normalize=True
)
```

## Troubleshooting

### "No completed scenes found"
- Ensure scenes have `status='completed'` and `video_url` is not null
- Check backend logs for scene generation errors

### "Celery task not starting"
- Verify Redis is running: `redis-cli ping` → PONG
- Check Celery worker is running
- Look for errors in Celery logs

### "Download failed"
- Verify `scene.video_url` is accessible
- Check network connectivity
- Ensure URL is not expired (if using signed URLs)

### "Rendering failed"
- Check FFmpeg is installed: `ffmpeg -version`
- Verify MoviePy installation: `pip show moviepy`
- Check temp directory has space
- Look for codec errors in logs

### "Upload failed"
- Verify storage backend configuration
- Check permissions/credentials
- Ensure bucket/directory exists

## Future Enhancements (Phase 3)

### LLM Director
- Intelligent scene trimming (remove boring parts)
- Smart scene ordering
- Content-aware transitions
- Music/SFX integration

### Title Cards
- Scene numbers
- Chapter markers
- Custom text overlays
- 3 styles: minimal, cinematic, modern

### Advanced Editing
- Multi-track audio
- Color grading presets
- Speed ramping
- Picture-in-picture

### Export Formats
- Multiple resolutions (480p, 720p, 1080p, 4K)
- Different codecs (H.264, H.265, VP9)
- Social media presets (Instagram, YouTube, TikTok)

## Summary

✅ **Complete server-side rendering** with MoviePy  
✅ **Real-time progress tracking** with Celery  
✅ **Professional transitions** (crossfades)  
✅ **Usage tracking** against subscription limits  
✅ **Error handling** with retries  
✅ **Clean UI** with modal and progress bar  

Users can now:
1. Generate scene videos in ChronStudio
2. Click "Finish Project"
3. Choose rendering options
4. Monitor real-time progress
5. Download professional concatenated video

All powered by your Django backend with MoviePy and Celery! 🎬
