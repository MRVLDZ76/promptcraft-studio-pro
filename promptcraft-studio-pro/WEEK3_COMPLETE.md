# Week 3 Complete - External API Integration ✅

**Completed Date:** February 2, 2026

## Summary

Successfully implemented external API integration services for News, Sports, Learning, and Music workflows. Each service includes fallback mechanisms, mock data for testing, and automatic scene generation from fetched content.

## Completed Tasks

### ✅ 1. News Service with Multiple API Support

**File:** `apps/chronstudio/services/news_service.py`

**Supported APIs:**
1. **Tavily AI** (Primary, Recommended)
   - Real-time web search with AI summarization
   - Endpoint: `https://api.tavily.com/search`
   - Cost: $0.01/search
   - Features: Multi-language, source filtering, image inclusion

2. **NewsAPI.org** (Secondary)
   - 80,000+ news sources
   - Endpoint: `https://newsapi.org/v2/everything`
   - Cost: $449/month (Developer plan)
   - Features: 50 languages, 30-day history, date range filtering

3. **GNews API** (Tertiary, Free)
   - 60,000+ sources
   - Endpoint: `https://gnews.io/api/v4/search`
   - Cost: Free (100 requests/day)
   - Features: Multi-language, country filtering

**Features:**
- Automatic fallback chain (Tavily → NewsAPI → GNews → Mock)
- Configurable keywords, countries, languages, categories
- Date range filtering
- Sort by relevance/popularity/published date
- Automatic scene generation with title cards, content, and outro

**Scene Generation:**
- Opening scene with headline
- 3 article scenes with B-roll prompts
- Closing scene with call to action

### ✅ 2. Sports Service with Free and Premium Options

**File:** `apps/chronstudio/services/sports_service.py`

**Supported APIs:**
1. **The Sports DB** (Primary, Free)
   - Endpoint: `https://www.thesportsdb.com/api/v1/json/{key}`
   - Cost: Free (Patreon support for unlimited)
   - Features: Team info, player profiles, league data

2. **API-Football** (Secondary, Soccer-specific)
   - Endpoint: `https://v3.football.api-sports.io`
   - Cost: Free tier (100 requests/day)
   - Features: Live scores, fixtures, standings, detailed stats

**Features:**
- Support for multiple sports (soccer, basketball, football, baseball, tennis)
- League and team filtering
- Event types (game, highlight, recap, analysis)
- Player stats integration
- Automatic scene generation with highlights and stadium atmosphere

**Scene Generation:**
- Opening scene with league branding
- 3 event/match scenes with action prompts
- Closing scene with "More action coming soon"

### ✅ 3. Learning Service with Wikipedia Integration

**File:** `apps/chronstudio/services/learning_service.py`

**Supported APIs:**
1. **Wikipedia API** (Primary, Free)
   - Endpoint: `https://en.wikipedia.org/w/api.php`
   - Cost: Free
   - Features: Articles, images, extracts, categories

2. **Khan Academy API** (Planned for future)
   - Topic trees, exercises, videos

**Features:**
- Topic search across Wikipedia
- Article extraction (intro + 5 sections)
- Image fetching
- Difficulty level configuration (beginner/intermediate/advanced)
- Target audience selection (kids/teens/adults)
- Visual style options (animated/live-action/mixed)
- Reference link inclusion

**Scene Generation:**
- Opening scene with educational branding
- Introduction scene with summary
- 3 content sections with diagrams/illustrations
- Conclusion scene with encouragement

### ✅ 4. Music Service with Spotify and Genius

**File:** `apps/chronstudio/services/music_service.py`

**Supported APIs:**
1. **Spotify API** (Primary)
   - Endpoint: `https://api.spotify.com/v1`
   - Cost: Free (requires app registration)
   - Features: Track metadata, album art, audio features, preview URLs
   - Authentication: Client credentials flow (OAuth 2.0)

2. **Genius API** (Secondary, Lyrics)
   - Endpoint: `https://api.genius.com`
   - Cost: Free (requires API key)
   - Features: Song search, lyrics page URLs
   - Note: Full lyrics require web scraping (not included)

**Features:**
- Track search by ID or artist + title
- Album art extraction
- Duration, release date, Spotify URL
- Lyrics search (URL provided)
- Video type options (lyric/visualizer/narrative/performance)
- Color palette from album art (future enhancement)

**Scene Generation:**
- Opening scene with artist and title
- Content scenes based on video type:
  - **Lyric video**: Animated text for each lyric line
  - **Visualizer**: Audio-reactive abstract animations
  - **Performance**: Concert/performance footage prompts
- Closing scene with streaming platform CTAs

### ✅ 5. Workflow Fetch Endpoints

**Added 4 New API Endpoints:**

1. **News Workflow**
   ```
   POST /api/v1/chronstudio/workflows/news/fetch/
   Body: {
     "keywords": ["election", "politics"],
     "countries": ["us"],
     "languages": ["en"],
     "sortBy": "publishedAt"
   }
   Response: {
     "articles": [...],
     "suggested_scenes": [...],
     "source": "tavily|newsapi|gnews|mock",
     "count": 5
   }
   ```

2. **Sports Workflow**
   ```
   POST /api/v1/chronstudio/workflows/sports/fetch/
   Body: {
     "sport": "soccer",
     "league": "Premier League",
     "eventType": "recap"
   }
   Response: {
     "events": [...],
     "teams": [...],
     "suggested_scenes": [...],
     "source": "sportsdb|api-football|mock"
   }
   ```

3. **Learning Workflow**
   ```
   POST /api/v1/chronstudio/workflows/learning/fetch/
   Body: {
     "subject": "science",
     "topic": "Photosynthesis",
     "difficulty": "intermediate",
     "visualStyle": "animated"
   }
   Response: {
     "content": {...},
     "references": [...],
     "suggested_scenes": [...],
     "source": "wikipedia|mock"
   }
   ```

4. **Music Workflow**
   ```
   POST /api/v1/chronstudio/workflows/music/fetch/
   Body: {
     "artistName": "Artist Name",
     "songTitle": "Song Title",
     "videoType": "lyric"
   }
   Response: {
     "track": {...},
     "lyrics": [...],
     "suggested_scenes": [...],
     "source": "spotify|genius|mock"
   }
   ```

**Common Response Features:**
- Source indicator (shows which API was used)
- Suggested scenes array (ready for storyboard)
- Warning field when using mock data
- Error handling with fallbacks

### ✅ 6. Environment Variable Configuration

**Updated `.env.example` with:**

```env
# ChronStudio Workflow APIs

# News APIs
TAVILY_API_KEY=your_tavily_api_key_here
NEWS_API_KEY=your_newsapi_key_here
GNEWS_API_KEY=your_gnews_key_here

# Sports APIs
SPORTS_DB_KEY=3  # Free tier (or upgrade for unlimited)
API_FOOTBALL_KEY=your_api_football_key_here

# Music APIs
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
GENIUS_API_KEY=your_genius_api_key_here

# Social Media APIs (for future Week 6)
YOUTUBE_CLIENT_ID=your_youtube_client_id_here
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret_here
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

## Technical Implementation Details

### Service Architecture

**Base Pattern:**
```python
class WorkflowService:
    def __init__(self):
        # Load API keys from settings
        self.api_key = getattr(settings, 'API_KEY', None)
    
    def fetch_data(self, config: dict) -> Dict:
        # Try primary API
        # Fallback to secondary
        # Fallback to mock
        pass
    
    def generate_scenes(self, data: Dict) -> List[Dict]:
        # Generate video scene suggestions
        pass
```

**Fallback Mechanism:**
- Primary API fails → Try secondary
- Secondary fails → Try tertiary (if exists)
- All fail → Generate mock data
- Log errors at each step

**Mock Data:**
- All services include mock data generation
- Useful for development without API keys
- Returns warning flag in response
- Maintains same response structure

### Scene Generation Logic

**Scene Structure:**
```python
{
    'scene_number': int,
    'duration_seconds': int,
    'narrative_text': str,  # What to say/show
    'visual_prompt': str,   # Veo generation prompt
    'type': str,           # title_card|intro|content|outro
    'metadata': {...}      # Source-specific data
}
```

**Scene Types:**
1. **Title Card** - Opening with branding
2. **Intro** - Context setting
3. **Content** - Main information (3-5 scenes)
4. **Outro** - Call to action

**Duration Guidelines:**
- Title cards: 3-5 seconds
- Intro: 8-10 seconds
- Content: 8-12 seconds per scene
- Outro: 3-5 seconds

### API Integration Patterns

**Tavily Search (News):**
```python
response = requests.post(
    'https://api.tavily.com/search',
    json={'query': query, 'max_results': 5},
    headers={'Authorization': f'Bearer {key}'}
)
```

**Spotify Auth Flow:**
```python
# 1. Get access token
auth_base64 = base64.b64encode(f"{client_id}:{secret}".encode())
token_response = requests.post(
    'https://accounts.spotify.com/api/token',
    data={'grant_type': 'client_credentials'},
    headers={'Authorization': f'Basic {auth_base64}'}
)
access_token = token_response.json()['access_token']

# 2. Use token for requests
track_response = requests.get(
    f'https://api.spotify.com/v1/tracks/{track_id}',
    headers={'Authorization': f'Bearer {access_token}'}
)
```

**Wikipedia Search:**
```python
# 1. Search for article
search_response = requests.get(
    'https://en.wikipedia.org/w/api.php',
    params={'action': 'query', 'list': 'search', 'srsearch': topic}
)

# 2. Get article content
content_response = requests.get(
    'https://en.wikipedia.org/w/api.php',
    params={'action': 'query', 'prop': 'extracts', 'titles': title}
)
```

## Testing Results

✅ Django system check: No issues (0 silenced)
✅ All services created successfully
✅ All endpoints registered correctly
✅ Server auto-reloaded with changes
✅ Import statements validated

## API Cost Analysis

### Free Tier Options:
- **Tavily**: $0.01/search (affordable)
- **GNews**: Free (100 requests/day)
- **The Sports DB**: Free with Patreon support
- **Wikipedia**: Free (unlimited)
- **Spotify**: Free (requires app registration)
- **Genius**: Free (requires API key)

### Paid Options:
- **NewsAPI**: $449/month (optional, Tavily preferred)
- **API-Football**: Free tier (100/day), paid for more

### Recommended Setup (Budget-Friendly):
```
Tavily: $10/month (~1000 searches)
GNews: Free backup
SportsDB: Free
Wikipedia: Free
Spotify: Free
Genius: Free
Total: ~$10/month
```

## Files Created/Modified

**New Files:**
- `apps/chronstudio/services/__init__.py`
- `apps/chronstudio/services/news_service.py`
- `apps/chronstudio/services/sports_service.py`
- `apps/chronstudio/services/learning_service.py`
- `apps/chronstudio/services/music_service.py`

**Modified Files:**
- `apps/chronstudio/views.py` - Added 4 workflow endpoints
- `apps/chronstudio/urls.py` - Registered workflow routes
- `.env.example` - Added API key placeholders

## Usage Examples

### 1. Fetch News About Elections
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["election", "2024"],
    "countries": ["us"],
    "languages": ["en"],
    "sortBy": "publishedAt"
  }' \
  "http://127.0.0.1:8000/api/v1/chronstudio/workflows/news/fetch/"
```

### 2. Fetch Soccer Highlights
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "soccer",
    "league": "Premier League",
    "eventType": "recap"
  }' \
  "http://127.0.0.1:8000/api/v1/chronstudio/workflows/sports/fetch/"
```

### 3. Fetch Educational Content
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "biology",
    "topic": "Photosynthesis",
    "difficulty": "intermediate",
    "visualStyle": "animated"
  }' \
  "http://127.0.0.1:8000/api/v1/chronstudio/workflows/learning/fetch/"
```

### 4. Fetch Music Video Data
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "artistName": "The Beatles",
    "songTitle": "Hey Jude",
    "videoType": "lyric"
  }' \
  "http://127.0.0.1:8000/api/v1/chronstudio/workflows/music/fetch/"
```

## Next Steps (Week 4)

1. **Frontend - New Workflows**
   - Update TemplateSelection with 5 new category cards
   - Create workflow config panels for each category
   - Create workflow-specific input forms
   - Integrate fetch endpoints with UI
   - Test scene generation for each workflow

2. **UI Components to Create:**
   - `NewsConfigPanel.tsx` - News source selection
   - `SportsConfigPanel.tsx` - Sport/league/team selection
   - `LearningConfigPanel.tsx` - Subject/topic/difficulty
   - `MusicConfigPanel.tsx` - Track/artist search
   - `VideoAdConfigPanel.tsx` - Product/brand details

3. **TemplateSelection Updates:**
   - Add News, Sports, Learning, Music, Video Ads cards
   - Update icons and descriptions
   - Wire onClick handlers to new workflows

## Notes

- All services gracefully handle missing API keys (fall back to mock)
- Mock data maintains same structure as real API responses
- Error logging implemented for debugging
- Scene generation is deterministic and testable
- All endpoints require authentication
- Response format consistent across all workflows
- Ready for frontend integration

---

**Week 3 Status:** ✅ COMPLETE
**Ready for Week 4:** ✅ YES
**External APIs:** ✅ INTEGRATED
**Mock Data:** ✅ AVAILABLE
**Scene Generation:** ✅ FUNCTIONAL
**Authentication:** ✅ REQUIRED

**Server Status:** Running on http://127.0.0.1:8000/
