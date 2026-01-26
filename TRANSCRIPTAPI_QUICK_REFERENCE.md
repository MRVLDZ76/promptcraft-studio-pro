# TranscriptAPI Quick Reference

## API Endpoint
```
POST /functions/v1/api-transcribe
```

## YouTube Transcription Flow

```mermaid
graph TD
    A[YouTube URL Request] --> B{TranscriptAPI}
    B -->|Success| C[Return Transcript]
    B -->|404/429/500| D{Gemini Available?}
    B -->|401/402/422| E[Return Error]
    D -->|Yes| F[Gemini Fallback]
    D -->|No| E
    F -->|Success| G[Return Transcript]
    F -->|Fail| E
```

## Request Examples

### YouTube Video
```typescript
const response = await fetch('/functions/v1/api-transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })
});
```

### Audio/Video File
```typescript
const response = await fetch('/functions/v1/api-transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audio: base64AudioData,
    mimeType: 'audio/mp3',
    options: {
      includeTimestamps: true,
      enableDiarization: true,
      maxSpeakers: 2
    }
  })
});
```

## Response Format

```typescript
{
  success: true,
  source: 'TranscriptAPI' | 'Gemini (fallback)' | 'file',
  transcript: string,
  segments: Array<{
    text: string,
    start: number,
    end: number,
    speaker: string
  }>,
  duration: number,
  language: string,
  confidence: number,
  speakers: string[],
  wordCount: number,
  metadata: {
    title?: string,
    source: string,
    videoId?: string
  }
}
```

## Error Handling

| Status | Description | Action |
|--------|-------------|--------|
| 200 | Success | Use response data |
| 400 | Bad request | Check request format |
| 401 | TranscriptAPI auth failed | Contact admin |
| 402 | TranscriptAPI credits exhausted | Contact admin |
| 429 | Rate limited | Retry or fallback active |
| 500 | Server error | Check logs |

## Test Commands

### Test TranscriptAPI Directly
```bash
curl -H "Authorization: Bearer sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw" \
  "https://transcriptapi.com/api/v2/youtube/transcript?video_url=dQw4w9WgXcQ&format=json"
```

### Test Supabase Function
```bash
curl -X POST YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Service Credentials

- **TranscriptAPI Key**: `sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw`
- **Gemini Key**: Stored in `GEMINI_API_KEY` environment variable

## Features

✅ Automatic service selection  
✅ Intelligent fallback mechanism  
✅ Error handling and retry logic  
✅ YouTube URL format flexibility  
✅ Multiple response formats  
✅ Comprehensive logging  

## Monitoring

Check response `source` field to track which service was used:
- `"TranscriptAPI"` - Primary service ✅
- `"Gemini (fallback)"` - Fallback used ⚠️
- `"file"` - File upload processing

## Documentation
See [TRANSCRIPTAPI_INTEGRATION.md](./TRANSCRIPTAPI_INTEGRATION.md) for complete documentation.
