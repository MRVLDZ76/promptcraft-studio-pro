# Video Sequencing Implementation Plan for PromptCraft Studio Pro

## 🎯 Executive Summary

**Goal**: Enable automatic sequencing/stitching of multiple ChronStudio scene videos into a single cohesive video story.

**Recommended Architecture**: **Hybrid FFmpeg + LLM Director** (Best fit for your existing stack)

**Why This Approach**:
- ✅ Leverages your existing Django backend
- ✅ Integrates with your Gemini AI service (already in use)
- ✅ Cost-controlled (no per-render API fees)
- ✅ Ties into subscription usage tracking
- ✅ Provides intelligent content-aware editing

---

## 📊 Current Architecture Analysis

### What You Have
```
Frontend: React 19 + TypeScript
Backend: Django 5.1.5 + DRF
AI: Google Gemini (apps/analyses/services/gemini_service.py)
Storage: Supabase (implied from project structure)
Subscriptions: 3-tier with usage tracking
Video Processing: ChronStudio (scenes → individual videos)
Transcription: Already integrated (audio/video)
```

### What's Missing
```
❌ Async task queue (Celery + Redis)
❌ Video manipulation library (MoviePy or FFmpeg)
❌ Video merge/sequencing logic
❌ Progress tracking for long renders
❌ Usage tracking for video rendering minutes
```

---

## 🏗️ Recommended Architecture

### Phase 1: Foundation (Week 1-2)
**Infrastructure Setup**

```yaml
New Dependencies:
  - celery==5.4.0              # Async task queue
  - redis==5.0.1               # Message broker
  - moviepy==1.0.3             # Python FFmpeg wrapper
  - ffmpeg-python==0.2.0       # Alternative wrapper
  
New Apps:
  - apps/video_production/     # Video rendering engine
    - tasks.py                 # Celery tasks
    - director.py              # LLM-based editing decisions
    - renderer.py              # FFmpeg orchestration
    - models.py                # RenderJob, VideoSequence
```

**Why MoviePy over raw FFmpeg**:
- ✅ Python-native (easier error handling)
- ✅ Built-in transitions (crossfade, fade in/out)
- ✅ Frame-level manipulation
- ✅ Automatic codec handling
- ✅ Timeline composition (like video editing software)

**Why Celery**:
- ✅ Industry standard for Django async tasks
- ✅ Progress tracking built-in
- ✅ Retry logic for failed renders
- ✅ Scales horizontally (add more workers)
- ✅ Handles video rendering without blocking web server

---

### Phase 2: Smart Director (Week 2-3)
**LLM Integration for Intelligent Sequencing**

#### The "Director Agent" Flow
```python
# Pseudocode workflow
scenes = ChronStudioScene.objects.filter(project=project_id)

# 1. Gather metadata
scene_data = [
    {
        "scene_number": scene.scene_number,
        "duration": scene.duration_seconds,
        "narrative_text": scene.narrative_text,
        "characters": scene.character_ids,
        "video_url": scene.video_url
    }
    for scene in scenes
]

# 2. Ask Gemini to create Edit Decision List (EDL)
prompt = f"""
You are a professional video editor. I have {len(scenes)} video clips for a story.
Each clip has narrative text, characters, and duration.

YOUR TASK:
1. Analyze the narrative flow
2. Suggest optimal order (may differ from scene_number if it improves story)
3. Identify scenes that need trimming (remove dead air/pauses)
4. Suggest transition types (hard_cut, crossfade, fade_to_black)
5. Add title cards between major sections if needed
6. Optimize for maximum emotional impact

CONSTRAINTS:
- Final video should be {target_duration} seconds
- Maintain narrative coherence
- Respect character continuity

SCENE DATA:
{json.dumps(scene_data, indent=2)}

OUTPUT FORMAT (JSON):
{{
  "edit_plan": [
    {{
      "scene_id": "uuid",
      "start_time": 0.5,      # Trim start
      "end_time": 4.8,        # Trim end  
      "transition_in": "fade",
      "transition_out": "crossfade",
      "position_in_final": 1,
      "reasoning": "Strong opening hook"
    }}
  ],
  "title_cards": [
    {{
      "text": "Chapter 1: The Beginning",
      "position": 0,
      "duration": 2
    }}
  ],
  "background_music": {{
    "mood": "epic",
    "volume": 0.3
  }}
}}
"""

edl = gemini_service.generate_edit_decision_list(prompt)

# 3. Execute the plan
render_video_from_edl(edl, scenes, output_path)
```

#### Key Intelligence Features
1. **Content-Aware Trimming**: Remove boring parts based on narrative analysis
2. **Smart Ordering**: May reorder scenes for better storytelling
3. **Transition Selection**: Choose transitions that match mood (fade for drama, hard cut for action)
4. **Pacing Optimization**: Slow down emotional moments, speed up action
5. **Title Card Insertion**: Add section dividers automatically
6. **Music Suggestions**: Recommend mood and volume for background audio

---

### Phase 3: Implementation Details

#### 1. Database Models (`apps/video_production/models.py`)
```python
class RenderJob(models.Model):
    """Track video rendering jobs"""
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('analyzing', 'Analyzing Content'),    # LLM Director
        ('rendering', 'Rendering Video'),      # FFmpeg
        ('uploading', 'Uploading'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    progress_percentage = models.IntegerField(default=0)
    
    # Input
    scene_ids = models.JSONField()  # List of ChronStudioScene IDs
    render_settings = models.JSONField(default=dict)  # User preferences
    
    # LLM Director Output
    edit_decision_list = models.JSONField(null=True, blank=True)
    director_reasoning = models.TextField(blank=True)
    
    # Output
    output_video_url = models.URLField(blank=True)
    output_duration_seconds = models.IntegerField(default=0)
    file_size_mb = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Metrics
    rendering_started_at = models.DateTimeField(null=True, blank=True)
    rendering_completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'render_jobs'
        ordering = ['-created_at']
```

#### 2. Celery Task (`apps/video_production/tasks.py`)
```python
from celery import shared_task
from moviepy.editor import VideoFileClip, concatenate_videoclips, TextClip, CompositeVideoClip
from .director import VideoDirectorAgent
from .renderer import VideoRenderer
import tempfile
import os

@shared_task(bind=True)
def render_video_sequence(self, render_job_id: str):
    """
    Main Celery task for video rendering
    Updates progress in real-time
    """
    job = RenderJob.objects.get(id=render_job_id)
    
    try:
        # Update status
        job.status = 'analyzing'
        job.save()
        self.update_state(state='PROGRESS', meta={'progress': 10})
        
        # 1. Gather scene videos
        scenes = ChronStudioScene.objects.filter(
            id__in=job.scene_ids
        ).order_by('scene_number')
        
        # 2. LLM Director: Generate Edit Decision List
        director = VideoDirectorAgent()
        edl = director.create_edit_plan(
            scenes=scenes,
            target_duration=job.render_settings.get('target_duration', None),
            style=job.render_settings.get('style', 'dynamic')
        )
        
        job.edit_decision_list = edl
        job.director_reasoning = edl.get('reasoning', '')
        job.save()
        self.update_state(state='PROGRESS', meta={'progress': 30})
        
        # 3. Download videos to temp directory
        job.status = 'rendering'
        job.save()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            downloaded_scenes = []
            for scene in scenes:
                local_path = os.path.join(tmpdir, f"scene_{scene.scene_number}.mp4")
                download_video(scene.video_url, local_path)
                downloaded_scenes.append(local_path)
            
            self.update_state(state='PROGRESS', meta={'progress': 50})
            
            # 4. Execute rendering based on EDL
            renderer = VideoRenderer()
            output_path = os.path.join(tmpdir, 'final_output.mp4')
            
            renderer.render_from_edl(
                edl=edl,
                scene_videos=downloaded_scenes,
                output_path=output_path,
                progress_callback=lambda p: self.update_state(
                    state='PROGRESS', 
                    meta={'progress': 50 + int(p * 0.4)}
                )
            )
            
            self.update_state(state='PROGRESS', meta={'progress': 90})
            
            # 5. Upload to Supabase/Storage
            job.status = 'uploading'
            job.save()
            
            final_url = upload_to_storage(output_path, job.id)
            
            # 6. Update job
            job.status = 'completed'
            job.output_video_url = final_url
            job.output_duration_seconds = get_video_duration(output_path)
            job.file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
            job.rendering_completed_at = timezone.now()
            job.save()
            
            # 7. Track usage
            from apps.subscriptions.utils import track_usage
            track_usage(
                user=job.user,
                resource_type='video_minutes',
                amount=job.output_duration_seconds / 60
            )
            
            self.update_state(state='SUCCESS', meta={'progress': 100})
            
    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)
        job.save()
        raise
```

#### 3. LLM Director (`apps/video_production/director.py`)
```python
from apps.analyses.services.gemini_service import GeminiService
import json

class VideoDirectorAgent:
    """Uses LLM to make intelligent editing decisions"""
    
    def __init__(self):
        self.gemini = GeminiService()
    
    def create_edit_plan(self, scenes, target_duration=None, style='dynamic'):
        """
        Generate Edit Decision List using Gemini
        
        Args:
            scenes: QuerySet of ChronStudioScene objects
            target_duration: Target length in seconds (None = use all content)
            style: 'dynamic' | 'contemplative' | 'action_packed'
        """
        scene_data = []
        for scene in scenes:
            scene_data.append({
                'scene_number': scene.scene_number,
                'duration': scene.duration_seconds,
                'narrative': scene.narrative_text,
                'visual_prompt': scene.visual_prompt,
                'characters': scene.character_ids,
                'video_url': scene.video_url,
                'id': str(scene.id)
            })
        
        prompt = self._build_director_prompt(scene_data, target_duration, style)
        
        response = self.gemini.analyze_video_content(
            transcript=json.dumps(scene_data),
            prompt=prompt,
            response_format='json'
        )
        
        # Parse and validate EDL
        edl = json.loads(response)
        return self._validate_edl(edl, scenes)
    
    def _build_director_prompt(self, scene_data, target_duration, style):
        duration_constraint = ""
        if target_duration:
            duration_constraint = f"- Target duration: {target_duration} seconds (trim if needed)"
        
        style_instructions = {
            'dynamic': "Use varied pacing. Quick cuts for action, longer holds for emotion.",
            'contemplative': "Slow, thoughtful pacing. Longer scenes, subtle transitions.",
            'action_packed': "Fast pacing. Quick cuts. Energetic transitions."
        }
        
        return f"""
You are an expert video editor and storyteller.

TASK: Analyze these {len(scene_data)} video scenes and create an optimal Edit Decision List (EDL).

SCENES:
{json.dumps(scene_data, indent=2)}

REQUIREMENTS:
{duration_constraint}
- Style: {style_instructions[style]}
- Maintain narrative coherence
- Remove dead air or weak moments
- Suggest appropriate transitions
- Add title cards if it improves storytelling
- Consider character continuity

OUTPUT (JSON):
{{
  "edit_plan": [
    {{
      "scene_id": "uuid",
      "order": 1,              # Position in final video
      "trim_start": 0.5,       # Seconds to trim from start
      "trim_end": 0.3,         # Seconds to trim from end
      "transition_in": "fade" | "crossfade" | "hard_cut",
      "transition_duration": 0.5,
      "speed_multiplier": 1.0, # 0.8 = slow-mo, 1.5 = fast
      "reason": "Why this edit decision"
    }}
  ],
  "title_cards": [
    {{
      "text": "Chapter Title",
      "position": 0,           # Insert before this scene order
      "duration": 2.5,
      "style": "minimal"
    }}
  ],
  "audio_guidance": {{
    "music_mood": "epic" | "melancholic" | "uplifting",
    "music_volume": 0.3,     # 0-1 relative to dialogue
    "fade_music_for_dialogue": true
  }},
  "reasoning": "Overall editing strategy explanation"
}}
"""
    
    def _validate_edl(self, edl, scenes):
        """Ensure EDL is valid and references real scenes"""
        # Validation logic
        scene_ids = {str(s.id) for s in scenes}
        
        for edit in edl.get('edit_plan', []):
            if edit['scene_id'] not in scene_ids:
                raise ValueError(f"EDL references non-existent scene: {edit['scene_id']}")
        
        return edl
```

#### 4. Video Renderer (`apps/video_production/renderer.py`)
```python
from moviepy.editor import *
import moviepy.video.fx.all as vfx

class VideoRenderer:
    """Executes the Edit Decision List using MoviePy"""
    
    def render_from_edl(self, edl, scene_videos, output_path, progress_callback=None):
        """
        Render final video based on Edit Decision List
        
        Args:
            edl: Dict from VideoDirectorAgent
            scene_videos: List of local video file paths
            output_path: Where to save final video
            progress_callback: Function to call with progress (0-1)
        """
        clips = []
        
        # Map scene IDs to file paths
        scene_map = {
            edit['scene_id']: path 
            for edit, path in zip(edl['edit_plan'], scene_videos)
        }
        
        # Sort by order
        sorted_edits = sorted(edl['edit_plan'], key=lambda x: x['order'])
        
        for i, edit in enumerate(sorted_edits):
            # Load video
            video_path = scene_map[edit['scene_id']]
            clip = VideoFileClip(video_path)
            
            # Apply trim
            start = edit.get('trim_start', 0)
            end = clip.duration - edit.get('trim_end', 0)
            clip = clip.subclip(start, end)
            
            # Apply speed
            speed = edit.get('speed_multiplier', 1.0)
            if speed != 1.0:
                clip = clip.fx(vfx.speedx, speed)
            
            # Apply transitions
            transition_in = edit.get('transition_in', 'hard_cut')
            if transition_in == 'fade':
                clip = clip.fadein(edit.get('transition_duration', 0.5))
            elif transition_in == 'crossfade' and i > 0:
                clip = clip.crossfadein(edit.get('transition_duration', 0.5))
            
            clips.append(clip)
            
            # Progress update
            if progress_callback:
                progress_callback(i / len(sorted_edits))
        
        # Add title cards
        for title_card in edl.get('title_cards', []):
            text_clip = self._create_title_card(
                text=title_card['text'],
                duration=title_card['duration'],
                style=title_card.get('style', 'minimal')
            )
            # Insert at position
            clips.insert(title_card['position'], text_clip)
        
        # Concatenate all clips
        final_video = concatenate_videoclips(clips, method="compose")
        
        # Write output
        final_video.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            fps=30,
            preset='medium',  # Balance quality/speed
            threads=4
        )
        
        # Cleanup
        for clip in clips:
            clip.close()
        final_video.close()
    
    def _create_title_card(self, text, duration, style='minimal'):
        """Generate a title card clip"""
        if style == 'minimal':
            txt_clip = TextClip(
                text,
                fontsize=70,
                color='white',
                font='Arial-Bold',
                size=(1920, 1080),
                method='caption',
                align='center'
            )
            txt_clip = txt_clip.set_duration(duration)
            txt_clip = txt_clip.on_color(
                size=(1920, 1080),
                color=(0, 0, 0),
                pos='center'
            )
            return txt_clip.fadein(0.5).fadeout(0.5)
```

---

## 💰 Cost & Usage Tracking Integration

### Update Subscription Models
```python
# Already exists, just ensure video_minutes is tracked:
# apps/subscriptions/models.py

class UsageTracking(models.Model):
    video_minutes_processed = models.IntegerField(default=0)  # ✅ Already exists
    
    # Add new field for rendered videos
    rendered_videos_count = models.IntegerField(default=0)  # NEW
```

### Update Subscription Plans
```python
# apps/subscriptions/models.py

class SubscriptionPlan(models.Model):
    max_video_length = models.IntegerField(default=0)  # Already exists
    
    # Add rendering limits
    max_renders_per_month = models.IntegerField(default=0)  # NEW
    # Free: 3, Pro: 50, Enterprise: unlimited
```

### Track Usage After Render
```python
# In the Celery task after successful render:

from apps.subscriptions.utils import track_usage

# Track video minutes
track_usage(
    user=job.user,
    resource_type='video_minutes',
    amount=job.output_duration_seconds / 60
)

# Track render count
track_usage(
    user=job.user,
    resource_type='renders',
    amount=1
)
```

---

## 🚀 Implementation Timeline

### Week 1: Infrastructure
- [ ] Install Celery, Redis, MoviePy
- [ ] Configure Celery workers
- [ ] Create `apps/video_production` app
- [ ] Database models (RenderJob)
- [ ] Basic endpoint: `POST /api/v1/video-production/render/`

### Week 2: Core Rendering
- [ ] Implement basic video concatenation (no LLM)
- [ ] File download/upload helpers
- [ ] Progress tracking via Celery
- [ ] Frontend: Render job status component
- [ ] Test with 3-5 scene videos

### Week 3: LLM Director
- [ ] Integrate Gemini for EDL generation
- [ ] Implement `VideoDirectorAgent`
- [ ] Test with sample projects
- [ ] Add user preferences (style, duration)

### Week 4: Polish & Features
- [ ] Title card generation
- [ ] Transition effects
- [ ] Background music integration (optional)
- [ ] Usage tracking integration
- [ ] Error handling and retries
- [ ] Admin panel for monitoring jobs

---

## 📱 Frontend Integration

### New Component: `VideoProductionStudio.tsx`
```typescript
export const VideoProductionStudio: React.FC = () => {
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [progress, setProgress] = useState(0);
  
  const handleRender = async (projectId: string) => {
    // 1. Create render job
    const job = await videoProductionService.createRenderJob({
      project_id: projectId,
      settings: {
        style: 'dynamic',
        target_duration: 120, // 2 minutes
        include_title_cards: true
      }
    });
    
    setRenderJob(job);
    
    // 2. Poll for progress
    const pollInterval = setInterval(async () => {
      const updated = await videoProductionService.getRenderJob(job.id);
      setProgress(updated.progress_percentage);
      
      if (updated.status === 'completed') {
        clearInterval(pollInterval);
        alert('Video ready!');
        window.open(updated.output_video_url);
      } else if (updated.status === 'failed') {
        clearInterval(pollInterval);
        alert(`Render failed: ${updated.error_message}`);
      }
    }, 2000);
  };
  
  return (
    <div>
      <h2>Video Production Studio</h2>
      {progress > 0 && (
        <ProgressBar value={progress} max={100} />
      )}
      <button onClick={() => handleRender(currentProjectId)}>
        Render Final Video
      </button>
    </div>
  );
};
```

---

## ⚡ Performance Optimizations

### 1. Video Resolution Scaling
```python
# Render at 720p for faster processing, upscale if needed
clip = clip.resize(height=720)
```

### 2. Caching
```python
# Cache downloaded scenes in Redis
# If same project rendered multiple times, reuse downloads
```

### 3. Parallel Processing
```python
# Use multiple Celery workers
# Each worker handles one render job
celery -A config worker -l info --concurrency=4
```

### 4. Preview Mode
```python
# Generate low-res preview first (fast)
# User approves, then render full quality
if settings.preview_mode:
    clip = clip.resize(height=480)
    preset = 'ultrafast'
```

---

## 🎯 Competitive Advantages

Your implementation will be **superior** to using cloud APIs because:

1. **Intelligence**: LLM Director makes content-aware decisions (cloud APIs just merge blindly)
2. **Cost**: No per-render fees. You control the compute.
3. **Integration**: Seamless with your existing ChronStudio workflow
4. **Customization**: Full control over transitions, pacing, style
5. **Privacy**: Videos never leave your infrastructure
6. **Monetization**: Renders count against subscription limits

---

## 📊 Comparison Table

| Feature | Cloud APIs | Your Implementation |
|---------|-----------|---------------------|
| Cost per render | $0.10-$0.50 | Server CPU time only |
| Intelligence | None | LLM Director |
| Setup time | 1 day | 2-3 weeks |
| Customization | Limited | Full control |
| Integration | REST API | Native Django |
| Privacy | Third-party | Your servers |
| Scalability | Infinite | Your infrastructure |

---

## 🔧 Alternative: Shotstack Hybrid Approach

If you want to **start fast** and **scale later**:

### Phase 1 (MVP - 2 days)
- Use Shotstack API for actual rendering
- Keep LLM Director for intelligent EDL generation
- Shotstack executes the EDL you generate

### Phase 2 (Scale - Later)
- Switch to MoviePy once you hit volume
- Reuse all the LLM Director code
- Just swap the renderer backend

```python
# apps/video_production/renderer.py

class VideoRenderer:
    def __init__(self, backend='moviepy'):
        self.backend = backend
    
    def render_from_edl(self, edl, ...):
        if self.backend == 'shotstack':
            return self._render_shotstack(edl)
        else:
            return self._render_moviepy(edl)
```

---

## ✅ Final Recommendation

**Go with MoviePy + LLM Director** because:

1. You already have Django expertise
2. You're building a premium product (not a quick MVP)
3. Video rendering is your **core feature**, not a commodity
4. Your subscription model requires cost control
5. LLM Director gives you a **competitive moat**

**Timeline**: 3-4 weeks for full implementation
**Cost**: $0 in APIs, just server CPU time
**Payoff**: Intelligent, automated video production that competitors can't match

---

## 🎬 Next Steps

1. **Proof of Concept**: Create a simple Celery task that merges 2 videos using MoviePy
2. **Test LLM Prompt**: Feed sample scene data to Gemini, validate EDL output
3. **Frontend Mockup**: Design the "Render Video" button in ChronStudio
4. **Resource Planning**: Estimate server CPU needs (rendering is heavy!)

Would you like me to start implementing Phase 1 (Infrastructure Setup)?
