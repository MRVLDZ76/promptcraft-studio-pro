# TranscriptAPI Integration Guide

## Overview

We've integrated [TranscriptAPI.com](https://transcriptapi.com/docs/api/) as the primary transcription service for YouTube videos, with Gemini as a fallback. This provides:

- ✅ **Faster transcription** - Retrieves existing YouTube transcripts instantly
- ✅ **Higher accuracy** - Uses YouTube's native transcripts when available
- ✅ **Better reliability** - Dedicated service with professional API
- ✅ **Cost optimization** - Reduces Gemini API usage
- ✅ **Automatic fallback** - Seamlessly falls back to Gemini when needed

## Service Hierarchy

### YouTube Transcription
1. **TranscriptAPI (Primary)**
   - Fast retrieval of YouTube native transcripts
   - High accuracy with proper timestamps
   - Handles multiple languages automatically
   
2. **Gemini Multimodal (Fallback)**
   - Used when TranscriptAPI fails
   - Can analyze video content directly
   - Works for videos without native transcripts

### Audio/Video Files
- **Gemini Multimodal Only**
  - Processes uploaded audio/video files
  - Supports speaker diarization
  - Custom transcription options

## API Configuration

### API Key
```typescript
const TRANSCRIPT_API_KEY = 'sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw';
```

### Endpoint
```
GET https://transcriptapi.com/api/v2/youtube/transcript
```

### Parameters
- `video_url` - YouTube URL or 11-character video ID
- `format` - Response format: `json` or `text`

### Authentication
```
Authorization: Bearer sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw
```

## Response Format

### TranscriptAPI Response
```json
{
  "video_id": "dQw4w9WgXcQ",
  "language": "en",
  "transcript": [
    {
      "text": "Never gonna give you up",
      "start": 0,
      "duration": 3.6
    },
    {
      "text": "Never gonna let you down",
      "start": 3.6,
      "duration": 3.4
    }
  ],
  "metadata": {
    "title": "Rick Astley - Never Gonna Give You Up"
  }
}
```

### Our Converted Format
```json
{
  "success": true,
  "source": "TranscriptAPI",
  "transcript": "Never gonna give you up Never gonna let you down",
  "segments": [
    {
      "text": "Never gonna give you up",
      "start": 0,
      "end": 3.6,
      "speaker": "A"
    },
    {
      "text": "Never gonna let you down",
      "start": 3.6,
      "end": 7.0,
      "speaker": "A"
    }
  ],
  "duration": 7.0,
  "language": "en",
  "confidence": 0.95,
  "speakers": ["A"],
  "wordCount": 10,
  "metadata": {
    "title": "Rick Astley - Never Gonna Give You Up",
    "source": "TranscriptAPI",
    "videoId": "dQw4w9WgXcQ"
  }
}
```

## Error Handling

### TranscriptAPI Error Codes

| Status | Error | Behavior |
|--------|-------|----------|
| 401 | Invalid or missing API key | **No fallback** - Return error immediately |
| 402 | Payment required or credits exhausted | **No fallback** - Return error immediately |
| 404 | Transcript unavailable | **Fallback to Gemini** |
| 422 | Invalid video_url | **No fallback** - Invalid request |
| 429 | Rate limited | **Fallback to Gemini** |
| 500 | Server error | **Fallback to Gemini** |

### Fallback Logic

```typescript
try {
  // Try TranscriptAPI first
  const result = await callTranscriptAPI(youtubeUrl);
  return { source: 'TranscriptAPI', ...result };
} catch (error) {
  // Check error type
  if (error.status === 401 || error.status === 402 || error.status === 422) {
    // Don't fallback for these errors
    return errorResponse(...);
  }
  
  // Fallback to Gemini for 404, 429, 500
  const geminiResult = await callGeminiForYouTubeTranscription(...);
  return { source: 'Gemini (fallback)', ...geminiResult };
}
```

## Usage Examples

### JavaScript/TypeScript
```typescript
const API_KEY = 'sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw';
const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const response = await fetch(
  `https://transcriptapi.com/api/v2/youtube/transcript?video_url=${videoUrl}&format=json`,
  {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  }
);

const data = await response.json();
console.log(data.transcript);
```

### Python
```python
import requests

API_KEY = 'sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw'
url = 'https://transcriptapi.com/api/v2/youtube/transcript'
params = {
    'video_url': 'dQw4w9WgXcQ',
    'format': 'json'
}

r = requests.get(
    url, 
    params=params, 
    headers={'Authorization': f'Bearer {API_KEY}'}, 
    timeout=30
)
r.raise_for_status()
print(r.json()['transcript'])
```

### Bash/cURL
```bash
API_KEY='sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw'
VIDEO='dQw4w9WgXcQ'

curl -s \
  -H "Authorization: Bearer $API_KEY" \
  "https://transcriptapi.com/api/v2/youtube/transcript?video_url=$VIDEO&format=json"
```

## Implementation Details

### Video ID Extraction
The service automatically handles various YouTube URL formats:
- Full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short URL: `https://youtu.be/VIDEO_ID`
- Embed URL: `https://www.youtube.com/embed/VIDEO_ID`
- Just ID: `VIDEO_ID` (11 characters)

```typescript
function extractYoutubeVideoId(urlOrId: string): string {
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match?.[1]) return match[1];
  }
  
  return urlOrId;
}
```

### Format Conversion
TranscriptAPI provides `start` and `duration`, we convert to `start` and `end`:

```typescript
function convertTranscriptAPIResponse(apiResponse: any): any {
  const segments = apiResponse.transcript || [];
  
  const convertedSegments = segments.map((seg: any) => ({
    text: seg.text,
    start: seg.start,
    end: seg.start + seg.duration, // Calculate end time
    speaker: 'A' // TranscriptAPI doesn't provide diarization
  }));
  
  return {
    transcript: segments.map(s => s.text).join(' '),
    segments: convertedSegments,
    duration: /* calculated from last segment */,
    language: apiResponse.language,
    confidence: 0.95,
    speakers: ['A'],
    wordCount: /* calculated */,
    metadata: {
      title: apiResponse.metadata?.title,
      source: 'TranscriptAPI',
      videoId: apiResponse.video_id
    }
  };
}
```

## Benefits

### Performance
- **Instant retrieval** - No video processing required
- **Reduced latency** - Direct API call vs. AI processing
- **Lower timeout risk** - Fast response times

### Accuracy
- **Native transcripts** - Uses YouTube's official transcripts
- **Proper timestamps** - Accurate segment timing
- **Language support** - Handles multiple languages automatically

### Reliability
- **Dedicated service** - Professional API infrastructure
- **Rate limiting** - Controlled usage patterns
- **Error handling** - Clear error messages and codes

### Cost Optimization
- **Reduced Gemini usage** - Only fallback when needed
- **Efficient caching** - TranscriptAPI handles caching
- **Credit management** - Track API usage separately

## Monitoring & Debugging

### Console Logs
```typescript
console.log('🔄 Calling TranscriptAPI for video: VIDEO_ID');
console.log('✅ TranscriptAPI success: N segments');
console.warn('⚠️ TranscriptAPI failed (STATUS): ERROR_DETAIL');
console.log('🔄 Falling back to Gemini...');
```

### Response Source Tracking
Every response includes a `source` field:
- `"TranscriptAPI"` - Primary service succeeded
- `"Gemini (fallback)"` - Fallback service used

### Error Tracking
```typescript
{
  "success": false,
  "error": "TranscriptAPI: Payment required or credits exhausted",
  "details": "Payment required or credits exhausted"
}
```

## Testing

### Test with Valid Video
```bash
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

### Test with Invalid Video (Should fallback)
```bash
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=INVALID_ID"
  }'
```

### Test Direct TranscriptAPI Call
```bash
curl -s \
  -H "Authorization: Bearer sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw" \
  "https://transcriptapi.com/api/v2/youtube/transcript?video_url=dQw4w9WgXcQ&format=json"
```

## FAQ

### Q: What if TranscriptAPI is down?
**A:** The system automatically falls back to Gemini for video analysis.

### Q: Do all YouTube videos have transcripts?
**A:** No. Videos without transcripts will get a 404 error from TranscriptAPI, triggering the Gemini fallback.

### Q: Can I use TranscriptAPI for non-YouTube content?
**A:** No. TranscriptAPI specializes in YouTube. For audio/video files, we use Gemini directly.

### Q: How do I monitor API usage?
**A:** Check TranscriptAPI dashboard for usage stats. The `source` field in responses tracks which service was used.

### Q: What about speaker diarization?
**A:** TranscriptAPI doesn't provide speaker diarization. If needed, Gemini fallback can identify multiple speakers.

### Q: Can I get plain text instead of JSON?
**A:** Yes. TranscriptAPI supports `format=text` parameter for plain text output.

## Future Enhancements

### Potential Improvements
1. **Caching Layer** - Cache TranscriptAPI responses to reduce API calls
2. **Usage Analytics** - Track success rates and fallback frequency
3. **Cost Tracking** - Monitor API costs per service
4. **Language Selection** - Support explicit language parameter
5. **Transcript Formats** - Support SRT, VTT, and other subtitle formats

### Configuration Options
```typescript
// Future: Move to environment variables
const TRANSCRIPT_API_KEY = Deno.env.get('TRANSCRIPT_API_KEY');
const ENABLE_TRANSCRIPT_API = Deno.env.get('ENABLE_TRANSCRIPT_API') === 'true';
const TRANSCRIPT_API_TIMEOUT = Number(Deno.env.get('TRANSCRIPT_API_TIMEOUT') || '30000');
```

## Support & Resources

- **TranscriptAPI Docs**: https://transcriptapi.com/docs/api/
- **Interactive API Docs**: https://transcriptapi.com/docs/api/ (Click "Try Interactive Doc")
- **OpenAPI Spec**: Available in interactive docs
- **Status Page**: Check TranscriptAPI website for service status

## Implementation Date
**January 26, 2026**

---

## Summary

The TranscriptAPI integration provides a robust, professional solution for YouTube transcription with intelligent fallback to Gemini. This architecture ensures:

✅ Maximum reliability through dual-service approach  
✅ Optimal performance using specialized services  
✅ Cost efficiency by reducing AI processing needs  
✅ Seamless user experience with automatic fallback  

The implementation is production-ready with comprehensive error handling and monitoring capabilities.
