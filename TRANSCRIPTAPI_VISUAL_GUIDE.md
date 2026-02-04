# TranscriptAPI Integration - Visual Guide

## Service Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Transcription Request                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Request Type?      │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    YouTube URL     Audio File      Video File
         │               │               │
         │               └───────┬───────┘
         │                       │
         ▼                       ▼
┌────────────────────┐   ┌──────────────┐
│  TranscriptAPI     │   │   Gemini     │
│    (Primary)       │   │  (Direct)    │
└─────────┬──────────┘   └──────┬───────┘
          │                     │
          ▼                     │
    ┌─────────┐                │
    │Success? │                │
    └────┬────┘                │
         │                     │
    ┌────┴────┐                │
    │         │                │
   YES       NO                │
    │         │                │
    │         ▼                │
    │   ┌─────────────┐        │
    │   │ Error Type? │        │
    │   └──────┬──────┘        │
    │          │                │
    │     ┌────┴────┐           │
    │     │         │           │
    │  401,402   404,429        │
    │   422      500            │
    │     │         │           │
    │     ▼         ▼           │
    │  ┌────┐  ┌────────┐      │
    │  │ERR │  │ Gemini │      │
    │  │    │  │Fallback│      │
    │  └────┘  └───┬────┘      │
    │              │           │
    └──────────────┴───────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  Return Result   │
        │  + source field  │
        └──────────────────┘
```

## Error Handling Decision Tree

```
TranscriptAPI Error
        │
        ▼
   ┌─────────┐
   │ Status? │
   └────┬────┘
        │
   ┌────┴────────────────────────────────┐
   │                                     │
   ▼                                     ▼
┌──────────────────────┐    ┌─────────────────────────┐
│ 401 - Invalid Key    │    │ 404 - No Transcript     │
│ 402 - No Credits     │    │ 429 - Rate Limited      │
│ 422 - Invalid URL    │    │ 500 - Server Error      │
└──────────┬───────────┘    └────────────┬────────────┘
           │                             │
           ▼                             ▼
   ┌────────────────┐          ┌──────────────────┐
   │  Return Error  │          │ Fallback to      │
   │  (No Fallback) │          │     Gemini       │
   └────────────────┘          └────────┬─────────┘
                                        │
                               ┌────────┴────────┐
                               │                 │
                               ▼                 ▼
                          ┌────────┐      ┌──────────┐
                          │Success │      │  Error   │
                          └────┬───┘      └─────┬────┘
                               │                 │
                               └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │  Return Result  │
                               │ source="Gemini  │
                               │   (fallback)"   │
                               └─────────────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│ Input: YouTube URL                                       │
│ "https://www.youtube.com/watch?v=dQw4w9WgXcQ"          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Extract Video ID                                         │
│ "dQw4w9WgXcQ"                                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ TranscriptAPI Request                                    │
│ GET https://transcriptapi.com/api/v2/youtube/transcript │
│ ?video_url=dQw4w9WgXcQ&format=json                      │
│ Authorization: Bearer sk_jTW...                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ TranscriptAPI Response                                   │
│ {                                                        │
│   "video_id": "dQw4w9WgXcQ",                            │
│   "language": "en",                                      │
│   "transcript": [                                        │
│     { "text": "Never gonna give you up",                │
│       "start": 0, "duration": 3.6 }                     │
│   ],                                                     │
│   "metadata": { "title": "Rick Astley..." }             │
│ }                                                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Convert to Standard Format                               │
│ - Calculate end times (start + duration)                 │
│ - Build full transcript text                             │
│ - Add speaker labels (default "A")                       │
│ - Extract metadata                                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Final Response                                           │
│ {                                                        │
│   "success": true,                                       │
│   "source": "TranscriptAPI",                            │
│   "transcript": "Never gonna give you up",              │
│   "segments": [                                          │
│     { "text": "...", "start": 0,                        │
│       "end": 3.6, "speaker": "A" }                      │
│   ],                                                     │
│   "duration": 3.6,                                       │
│   "language": "en",                                      │
│   "confidence": 0.95,                                    │
│   "speakers": ["A"],                                     │
│   "wordCount": 5,                                        │
│   "metadata": {                                          │
│     "title": "Rick Astley...",                          │
│     "source": "TranscriptAPI",                          │
│     "videoId": "dQw4w9WgXcQ"                            │
│   }                                                      │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
```

## Timeline Comparison

### Before TranscriptAPI Integration

```
0s              5s              10s             15s
│───────────────┼───────────────┼───────────────┤
│                                               │
│            Gemini Processing                  │
│         (AI Video Analysis)                   │
│                                               │
└───────────────────────────────────────────────┘
                                                 ▼
                                          Return Result
```

### After TranscriptAPI Integration

```
0s      1s      2s
│───────┼───────┤
│               │
│ TranscriptAPI │
│   (Primary)   │
│               │
└───────────────┘
                 ▼
          Return Result
          
          
If fallback needed:
0s      1s      2s      5s              10s             15s
│───────┼───────┼───────┼───────────────┼───────────────┤
│               │                                        │
│ TranscriptAPI │          Gemini Fallback              │
│   (Failed)    │       (AI Video Analysis)             │
│               │                                        │
└───────────────┴───────────────────────────────────────┘
                                                         ▼
                                                  Return Result
```

**Result**: 60-90% faster response time for most YouTube videos

## Cost Comparison

### Monthly Cost Estimate (1000 Requests)

```
Before (Gemini Only):
┌────────────────────────────────┐
│ 1000 requests × $0.005/request │
│ = $5.00/month                  │
└────────────────────────────────┘


After (TranscriptAPI + Gemini):
┌────────────────────────────────┐
│ 900 requests × $0.0001         │  ← TranscriptAPI (90%)
│ = $0.09                        │
│                                │
│ 100 requests × $0.005          │  ← Gemini fallback (10%)
│ = $0.50                        │
│                                │
│ Total = $0.59/month            │
└────────────────────────────────┘

Savings: $4.41/month (88% reduction)
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   YouTube    │  │    Audio     │  │    Video     │     │
│  │   Import     │  │    Upload    │  │    Upload    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function                          │
│              POST /functions/v1/api-transcribe              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Request Router                             │    │
│  │  • Detect request type (YouTube/Audio/Video)       │    │
│  │  • Route to appropriate service                    │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│         ┌─────────┼─────────┐                               │
│         │         │         │                               │
│         ▼         ▼         ▼                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │YouTube   │ │ Audio    │ │ Video    │                    │
│  │Handler   │ │ Handler  │ │ Handler  │                    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘                    │
│       │            │             │                          │
└───────┼────────────┼─────────────┼──────────────────────────┘
        │            │             │
        ▼            └─────┬───────┘
┌──────────────┐          │
│TranscriptAPI │          ▼
│  (Primary)   │    ┌──────────────┐
└──────┬───────┘    │    Gemini    │
       │            │  Multimodal  │
       │            └──────┬───────┘
       │                   │
       │                   │
       └───────┬───────────┘
               │
               ▼
      ┌─────────────────┐
      │ Format Converter │
      │  • Standardize   │
      │  • Add metadata  │
      └────────┬─────────┘
               │
               ▼
         Return JSON Response
```

## Service Selection Logic

```python
def transcribe(request):
    if request.has_youtube_url:
        # Try TranscriptAPI first
        try:
            result = transcript_api.get(youtube_url)
            return {
                "source": "TranscriptAPI",
                "data": result
            }
        except TranscriptAPIError as e:
            if e.status in [401, 402, 422]:
                # Don't fallback for these errors
                raise TranscriptionError(e)
            
            # Fallback to Gemini for 404, 429, 500
            result = gemini.transcribe_youtube(youtube_url)
            return {
                "source": "Gemini (fallback)",
                "data": result
            }
    
    elif request.has_audio_or_video:
        # Use Gemini directly for file uploads
        result = gemini.transcribe_file(file, mime_type)
        return {
            "source": "file",
            "data": result
        }
```

## Response Source Tracking

```
┌─────────────────────────────────────────────────────────┐
│ Monitor the "source" field in responses:                │
│                                                         │
│ ✅ "TranscriptAPI"      - Primary service succeeded    │
│ ⚠️  "Gemini (fallback)" - Fallback was used           │
│ 📁 "file"              - File upload processing       │
│                                                         │
│ High "Gemini (fallback)" rate indicates:               │
│   • Many videos without transcripts                    │
│   • TranscriptAPI issues                               │
│   • Rate limiting                                      │
└─────────────────────────────────────────────────────────┘
```

## URL Format Support

```
Supported Input Formats:
┌──────────────────────────────────────────────────────────┐
│ 1. Full URL                                              │
│    https://www.youtube.com/watch?v=dQw4w9WgXcQ          │
│                                                          │
│ 2. Short URL                                             │
│    https://youtu.be/dQw4w9WgXcQ                         │
│                                                          │
│ 3. Embed URL                                             │
│    https://www.youtube.com/embed/dQw4w9WgXcQ            │
│                                                          │
│ 4. Raw Video ID                                          │
│    dQw4w9WgXcQ                                          │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │ extractVideoId│
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ dQw4w9WgXcQ   │
                └───────────────┘
```

## Key Metrics Dashboard (Conceptual)

```
┌─────────────────────────────────────────────────────────┐
│                 Transcription Service Metrics            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Service Usage (Last 24h)                              │
│  ┌──────────────────────────────────────────┐          │
│  │ TranscriptAPI   ████████████████ 85%     │          │
│  │ Gemini Fallback ██ 10%                   │          │
│  │ File Upload     █ 5%                     │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Average Response Time                                  │
│  ┌──────────────────────────────────────────┐          │
│  │ TranscriptAPI:   1.8s ✅                 │          │
│  │ Gemini Fallback: 12.3s ⚠️                │          │
│  │ File Upload:     8.5s                    │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Error Rates                                            │
│  ┌──────────────────────────────────────────┐          │
│  │ 2xx Success: ████████████████ 95%        │          │
│  │ 4xx Errors:  █ 3%                        │          │
│  │ 5xx Errors:  █ 2%                        │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Cost Tracking (This Month)                            │
│  ┌──────────────────────────────────────────┐          │
│  │ TranscriptAPI:  $0.12                    │          │
│  │ Gemini:         $0.65                    │          │
│  │ Total:          $0.77                    │          │
│  │ Savings vs Old: $4.23 (85%)              │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

This visual guide provides multiple perspectives on the TranscriptAPI integration to help understand the architecture, flow, and benefits at a glance.
