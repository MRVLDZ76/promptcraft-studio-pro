# ChronStudio Expansion Plan - Advanced Workflows & Asset Management

## Executive Summary

Expanding ChronStudio from 3 categories (Biblical, Historical, Custom) to 8 specialized workflows with full asset management, social media integration, and persistence.

## Phase 1: New Workflow Categories

### 1.1 News Workflow
**Use Case**: Automated news video creation based on real-time sources

**External APIs Options**:
- **Tavily AI** (Recommended): Real-time web search with summarization
  - Endpoint: `https://api.tavily.com/search`
  - Features: Multi-language, source filtering, date ranges
  - Cost: $0.01/search
  
- **NewsAPI.org**: Global news aggregator
  - Endpoint: `https://newsapi.org/v2/everything`
  - Features: 80,000+ sources, 50 languages, 30-day history
  - Cost: $449/month (Developer plan)

- **GNews API**: Free alternative
  - Endpoint: `https://gnews.io/api/v4/search`
  - Features: 60,000+ sources, multi-language
  - Cost: Free (100 requests/day)

**Parameters Needed**:
```typescript
interface NewsConfig {
  sources: string[];           // ['bbc', 'cnn', 'reuters']
  countries: string[];         // ['us', 'uk', 'es']
  languages: string[];         // ['en', 'es', 'fr']
  categories: string[];        // ['business', 'technology', 'sports']
  keywords: string[];          // Search terms
  dateRange: {
    from: string;              // ISO date
    to: string;
  };
  sortBy: 'relevance' | 'popularity' | 'publishedAt';
}
```

**Storyboard Generation**:
1. Fetch top 5 news articles matching criteria
2. Extract key facts, quotes, images
3. Generate 3-5 scene narrative from articles
4. Create visual prompts for news anchor/B-roll footage
5. Generate title cards with headlines

### 1.2 Sports Workflow
**Use Case**: Sports highlights, game recaps, player profiles

**External APIs Options**:
- **ESPN API**: Comprehensive sports data
  - Scores, schedules, standings, player stats
  - Real-time game updates
  
- **The Sports DB**: Free sports database
  - Endpoint: `https://www.thesportsdb.com/api/v1/json/{key}`
  - Features: Team info, player profiles, league data
  - Cost: Free (with Patreon support for unlimited)

- **API-Football**: Soccer-specific
  - Endpoint: `https://v3.football.api-sports.io`
  - Features: Live scores, fixtures, standings
  - Cost: $0/month (100 requests/day)

**Parameters Needed**:
```typescript
interface SportsConfig {
  sport: 'football' | 'basketball' | 'baseball' | 'soccer' | 'tennis';
  league: string;              // 'nfl', 'nba', 'mlb', 'premier-league'
  teams: string[];             // Team IDs or names
  players: string[];           // Player IDs or names
  eventType: 'game' | 'highlight' | 'recap' | 'analysis';
  date: string;                // Game date
  includeStats: boolean;       // Show player stats
}
```

### 1.3 Learning/Educational Workflow
**Use Case**: Educational videos, tutorials, explainers

**Content Sources**:
- **Wikipedia API**: Free encyclopedia content
  - Endpoint: `https://en.wikipedia.org/w/api.php`
  - Features: Articles, images, categories
  - Cost: Free

- **Khan Academy API**: Educational content
  - Topic tree, exercises, videos
  
- **YouTube Transcript API**: Extract transcripts from educational videos
  - Use as source material for summaries

**Parameters Needed**:
```typescript
interface LearningConfig {
  subject: string;             // 'mathematics', 'science', 'history'
  topic: string;               // Specific topic
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: 'kids' | 'teens' | 'adults';
  includeQuiz: boolean;        // Add quiz at end
  references: string[];        // URLs to source material
  visualStyle: 'animated' | 'live-action' | 'mixed';
}
```

### 1.4 Music Workflow
**Use Case**: Music videos, lyric videos, album promos

**Content Sources**:
- **Spotify API**: Track metadata, album art, artist info
  - Endpoint: `https://api.spotify.com/v1`
  - Features: Track details, audio features, lyrics (via Musixmatch)
  
- **Genius API**: Lyrics and annotations
  - Endpoint: `https://api.genius.com`
  - Features: Lyrics, song meanings, artist info

**Parameters Needed**:
```typescript
interface MusicConfig {
  trackId?: string;            // Spotify track ID
  artistName?: string;
  songTitle?: string;
  videoType: 'lyric' | 'visualizer' | 'narrative' | 'performance';
  syncToBeats: boolean;        // Sync visuals to beat
  colorPalette: string[];      // Hex colors from album art
  includeArtistFootage: boolean;
}
```

### 1.5 Video Ads Workflow
**Use Case**: Product ads, service promos, brand videos

**Parameters Needed**:
```typescript
interface VideoAdConfig {
  productName: string;
  brandName: string;
  tagline: string;
  keyFeatures: string[];       // Product highlights
  targetAudience: string;      // Demographics
  adDuration: 15 | 30 | 60;    // Seconds
  callToAction: string;        // "Buy Now", "Learn More"
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational';
  includeProductShots: boolean;
  includePricing: boolean;
}
```

## Phase 2: Database Schema Extensions

### 2.1 Enhanced Project Model
```python
# backend/apps/chronstudio/models.py

class ChronStudioProject(models.Model):
    CATEGORY_CHOICES = [
        ('BIBLICAL', 'Biblical'),
        ('HISTORICAL', 'Historical'),
        ('CUSTOM', 'Custom'),
        ('NEWS', 'News'),                    # NEW
        ('SPORTS', 'Sports'),                # NEW
        ('LEARNING', 'Learning'),            # NEW
        ('MUSIC', 'Music'),                  # NEW
        ('VIDEO_ADS', 'Video Ads'),          # NEW
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),                  # NEW - Just created
        ('in_progress', 'In Progress'),      # NEW - Actively editing
        ('pending_render', 'Pending Render'),# NEW - Awaiting video generation
        ('rendering', 'Rendering'),          # NEW - Currently rendering
        ('completed', 'Completed'),          # Finished
        ('archived', 'Archived'),            # Hidden from main view
        ('failed', 'Failed'),                # Rendering failed
    ]
    
    # Existing fields...
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=500)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    
    # NEW: Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    completion_percentage = models.IntegerField(default=0)  # 0-100
    
    # NEW: Workflow-specific config
    workflow_config = models.JSONField(default=dict, blank=True)
    # Stores NewsConfig, SportsConfig, etc. as JSON
    
    # NEW: Asset tracking
    thumbnail_url = models.URLField(blank=True, null=True)
    final_video_url = models.URLField(blank=True, null=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    
    # NEW: Social media uploads
    youtube_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    facebook_url = models.URLField(blank=True, null=True)
    
    # NEW: Organization
    folder = models.CharField(max_length=255, blank=True)  # User-defined folders
    tags = models.JSONField(default=list, blank=True)
    is_favorite = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'chronstudio_projects'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['user', 'is_favorite']),
        ]
```

### 2.2 Asset Model (New)
```python
class ChronStudioAsset(models.Model):
    """Track all generated assets"""
    ASSET_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('thumbnail', 'Thumbnail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE, related_name='assets')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES)
    file_url = models.URLField()
    file_size_mb = models.FloatField()
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    
    # Metadata
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chronstudio_assets'
        ordering = ['-created_at']
```

### 2.3 Social Media Upload Model (New)
```python
class SocialMediaUpload(models.Model):
    """Track social media uploads"""
    PLATFORM_CHOICES = [
        ('youtube', 'YouTube'),
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('published', 'Published'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Platform-specific config
    upload_config = models.JSONField(default=dict)
    # YouTube: title, description, tags, privacy, category
    # Instagram: caption, location
    # Facebook: message, privacy
    
    # Results
    platform_id = models.CharField(max_length=255, blank=True)  # Video ID on platform
    platform_url = models.URLField(blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'chronstudio_social_uploads'
```

## Phase 3: API Endpoints

### 3.1 Project Management Endpoints

```
GET    /api/v1/chronstudio/projects/
  Query params:
    - status: draft|in_progress|completed|archived
    - category: NEWS|SPORTS|LEARNING|etc
    - folder: string
    - is_favorite: boolean
    - search: string (title search)
    - ordering: -created_at|-updated_at|title
    - page: int

POST   /api/v1/chronstudio/projects/
  Body: { category, title, workflow_config, ... }

GET    /api/v1/chronstudio/projects/{id}/
PATCH  /api/v1/chronstudio/projects/{id}/
DELETE /api/v1/chronstudio/projects/{id}/

POST   /api/v1/chronstudio/projects/{id}/duplicate/
  Create a copy of the project

POST   /api/v1/chronstudio/projects/{id}/archive/
  Archive (soft delete)

POST   /api/v1/chronstudio/projects/{id}/restore/
  Restore from archive
```

### 3.2 Workflow-Specific Endpoints

```
POST   /api/v1/chronstudio/workflows/news/fetch/
  Body: NewsConfig
  Returns: { articles: [...], suggested_scenes: [...] }

POST   /api/v1/chronstudio/workflows/sports/fetch/
  Body: SportsConfig
  Returns: { games: [...], highlights: [...], suggested_scenes: [...] }

POST   /api/v1/chronstudio/workflows/learning/fetch/
  Body: LearningConfig
  Returns: { content: [...], references: [...], suggested_scenes: [...] }

POST   /api/v1/chronstudio/workflows/music/fetch/
  Body: MusicConfig
  Returns: { track_info: {...}, lyrics: [...], suggested_scenes: [...] }
```

### 3.3 Social Media Endpoints

```
POST   /api/v1/chronstudio/social/upload/
  Body: {
    project_id: uuid,
    platform: 'youtube'|'instagram'|'facebook',
    config: { title, description, tags, ... }
  }
  Returns: { upload_id, status }

GET    /api/v1/chronstudio/social/uploads/
  List all uploads for user

GET    /api/v1/chronstudio/social/uploads/{id}/
  Get upload status

POST   /api/v1/chronstudio/social/uploads/{id}/cancel/
  Cancel pending upload
```

### 3.4 Asset Management Endpoints

```
GET    /api/v1/chronstudio/assets/
  Query params:
    - project_id: uuid
    - asset_type: image|video|audio|thumbnail
    - page: int

GET    /api/v1/chronstudio/assets/{id}/
DELETE /api/v1/chronstudio/assets/{id}/

GET    /api/v1/chronstudio/dashboard/stats/
  Returns: {
    total_projects: int,
    by_category: { NEWS: 5, SPORTS: 3, ... },
    by_status: { draft: 2, completed: 10, ... },
    total_assets: int,
    total_storage_mb: float
  }
```

## Phase 4: Frontend Components

### 4.1 Enhanced Template Selection

```typescript
// Update types.ts
export enum ProjectCategory {
  BIBLICAL = 'BIBLICAL',
  HISTORICAL = 'HISTORICAL',
  CUSTOM = 'CUSTOM',
  NEWS = 'NEWS',
  SPORTS = 'SPORTS',
  LEARNING = 'LEARNING',
  MUSIC = 'MUSIC',
  VIDEO_ADS = 'VIDEO_ADS',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  PENDING_RENDER = 'pending_render',
  RENDERING = 'rendering',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  FAILED = 'failed',
}
```

### 4.2 Workflow Configuration Components

```
ChronStudio/components/workflows/
├── NewsConfigPanel.tsx      - News source selection
├── SportsConfigPanel.tsx    - Sport/league/team selection
├── LearningConfigPanel.tsx  - Subject/topic selection
├── MusicConfigPanel.tsx     - Track/artist selection
└── VideoAdConfigPanel.tsx   - Product/brand details
```

### 4.3 Asset Dashboard (New)

```
ChronStudio/components/AssetDashboard.tsx

Features:
- Grid/list view toggle
- Filter by category, status, date
- Search by title
- Bulk actions (archive, delete, download)
- Quick preview
- Continue editing button for pending projects
- Social media upload buttons
```

**Layout**:
```
┌─────────────────────────────────────────┐
│  My Projects                [+ New]      │
├─────────────────────────────────────────┤
│ [All] [News] [Sports] [Learning] [Music]│
│ [Completed] [In Progress] [Draft]        │
├─────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐           │
│ │ [IMG] │ │ [IMG] │ │ [IMG] │           │
│ │ Title │ │ Title │ │ Title │           │
│ │ News  │ │Sports │ │Draft  │           │
│ │ ✓     │ │ 75%   │ │[Edit] │           │
│ └───────┘ └───────┘ └───────┘           │
└─────────────────────────────────────────┘
```

### 4.4 Social Media Upload Modal

```typescript
interface SocialUploadModalProps {
  projectId: string;
  videoUrl: string;
  onClose: () => void;
}

Features:
- Platform selection (YouTube, Instagram, Facebook)
- Platform-specific fields (title, description, tags, privacy)
- Preview of video
- Upload progress
- Link to published video
```

## Phase 5: External API Integration

### 5.1 News Integration Service

```python
# backend/apps/chronstudio/services/news_service.py

import requests
from typing import List, Dict

class NewsService:
    def __init__(self):
        self.tavily_key = settings.TAVILY_API_KEY
        
    def fetch_news(self, config: dict) -> List[Dict]:
        """Fetch news articles from Tavily"""
        response = requests.post(
            'https://api.tavily.com/search',
            json={
                'query': ' '.join(config['keywords']),
                'search_depth': 'advanced',
                'max_results': 5,
                'include_answer': True,
                'include_raw_content': False,
            },
            headers={'Authorization': f'Bearer {self.tavily_key}'}
        )
        return response.json()['results']
        
    def generate_scenes_from_news(self, articles: List[Dict]) -> List[Dict]:
        """Generate scene narratives from news articles"""
        # Use Gemini to create scene breakdowns
        pass
```

### 5.2 Social Media Upload Services

```python
# backend/apps/chronstudio/services/youtube_service.py

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

class YouTubeService:
    def upload_video(self, video_path: str, metadata: dict) -> str:
        """Upload video to YouTube"""
        credentials = Credentials(token=user_youtube_token)
        youtube = build('youtube', 'v3', credentials=credentials)
        
        body = {
            'snippet': {
                'title': metadata['title'],
                'description': metadata['description'],
                'tags': metadata['tags'],
                'categoryId': metadata['category_id'],
            },
            'status': {
                'privacyStatus': metadata['privacy']
            }
        }
        
        media = MediaFileUpload(video_path, mimetype='video/mp4', resumable=True)
        request = youtube.videos().insert(
            part='snippet,status',
            body=body,
            media_body=media
        )
        
        response = request.execute()
        return f"https://youtube.com/watch?v={response['id']}"
```

## Phase 6: Implementation Roadmap

### Week 1: Database & Backend Foundation
- [ ] Add new category choices to models
- [ ] Create migration for status field
- [ ] Add workflow_config JSONField
- [ ] Create ChronStudioAsset model
- [ ] Create SocialMediaUpload model
- [ ] Run migrations

### Week 2: API Endpoints
- [ ] Update project serializers with new fields
- [ ] Add filtering/search to project list endpoint
- [ ] Create asset management endpoints
- [ ] Create dashboard stats endpoint
- [ ] Add project duplicate/archive endpoints

### Week 3: External API Integration
- [ ] Setup Tavily API for news
- [ ] Integrate The Sports DB API
- [ ] Integrate Wikipedia API for learning
- [ ] Integrate Spotify/Genius for music
- [ ] Create workflow fetch endpoints

### Week 4: Frontend - New Workflows
- [ ] Update ProjectCategory enum
- [ ] Create workflow config panels
- [ ] Update TemplateSelection with new categories
- [ ] Create workflow-specific input forms
- [ ] Test scene generation for each workflow

### Week 5: Asset Dashboard
- [ ] Create AssetDashboard component
- [ ] Implement grid/list views
- [ ] Add filtering and search
- [ ] Create project card component
- [ ] Add "Continue Editing" functionality
- [ ] Implement bulk actions

### Week 6: Social Media Integration
- [ ] Setup YouTube OAuth
- [ ] Setup Instagram Graph API
- [ ] Setup Facebook Graph API
- [ ] Create upload services
- [ ] Create upload modal component
- [ ] Implement upload progress tracking

### Week 7: Testing & Polish
- [ ] Test each workflow end-to-end
- [ ] Test persistence of pending projects
- [ ] Test social media uploads
- [ ] Test asset management
- [ ] Performance optimization
- [ ] UI/UX polish

## Phase 7: Configuration

### 7.1 Environment Variables

```env
# News APIs
TAVILY_API_KEY=tvly-xxxxx
NEWS_API_KEY=xxxxx
GNEWS_API_KEY=xxxxx

# Sports APIs
SPORTS_DB_KEY=xxxxx
API_FOOTBALL_KEY=xxxxx

# Music APIs
SPOTIFY_CLIENT_ID=xxxxx
SPOTIFY_CLIENT_SECRET=xxxxx
GENIUS_API_KEY=xxxxx

# Social Media
YOUTUBE_CLIENT_ID=xxxxx
YOUTUBE_CLIENT_SECRET=xxxxx
INSTAGRAM_APP_ID=xxxxx
INSTAGRAM_APP_SECRET=xxxxx
FACEBOOK_APP_ID=xxxxx
FACEBOOK_APP_SECRET=xxxxx
```

### 7.2 Subscription Limits

```python
# apps/subscriptions/models.py

class SubscriptionPlan(models.Model):
    # Add new limits
    max_projects = models.IntegerField(default=10)
    max_storage_gb = models.FloatField(default=1.0)
    allow_social_uploads = models.BooleanField(default=False)
    max_social_uploads_per_month = models.IntegerField(default=0)
    
    # Workflow access
    allow_news_workflow = models.BooleanField(default=True)
    allow_sports_workflow = models.BooleanField(default=True)
    allow_learning_workflow = models.BooleanField(default=True)
    allow_music_workflow = models.BooleanField(default=False)  # Pro only
    allow_video_ads_workflow = models.BooleanField(default=False)  # Pro only
```

**Tier Structure**:
- **Free**: 10 projects, News/Sports/Learning only, 1GB storage
- **Pro**: 100 projects, All workflows, Social uploads (50/month), 10GB storage
- **Enterprise**: Unlimited projects, All workflows, Unlimited social uploads, 100GB storage

## Summary

This plan provides:
1. **5 New Workflows**: News, Sports, Learning, Music, Video Ads with external API integration
2. **Asset Management**: Full dashboard to view/manage all projects by category, status, date
3. **Persistence**: All projects saved regardless of status with "Continue Editing" functionality
4. **Social Media**: Direct uploads to YouTube, Instagram, Facebook
5. **Organization**: Folders, tags, favorites, search, filtering
6. **Scalability**: Proper indexing, pagination, background tasks for uploads

**Estimated Development Time**: 7 weeks (1 developer)
**Estimated API Costs**: $50-100/month (depending on usage)

Ready to start implementation? Which phase should we begin with?
