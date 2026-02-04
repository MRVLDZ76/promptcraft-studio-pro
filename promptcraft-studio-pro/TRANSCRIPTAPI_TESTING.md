# TranscriptAPI Testing Guide

## Pre-Testing Checklist

- [ ] Supabase Edge Function deployed: `api-transcribe`
- [ ] TranscriptAPI key configured: `sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw`
- [ ] Gemini API key available in environment: `GEMINI_API_KEY`
- [ ] CORS headers properly configured

## Test Scenarios

### 1. Primary Service Success (TranscriptAPI)

**Test**: Popular YouTube video with native transcript

```bash
curl -X POST YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

**Expected Result**:
- Status: 200 OK
- `source`: "TranscriptAPI"
- `transcript`: Full text content
- `segments`: Array with start/end timestamps
- `metadata.title`: Video title
- Response time: < 2 seconds

**Validation**:
```typescript
const response = await fetch(...);
const data = await response.json();

assert(data.success === true);
assert(data.source === 'TranscriptAPI');
assert(data.segments.length > 0);
assert(data.metadata.videoId === 'dQw4w9WgXcQ');
```

---

### 2. Video ID Format (Not Full URL)

**Test**: Send just the 11-character video ID

```bash
curl -X POST YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "dQw4w9WgXcQ"
  }'
```

**Expected Result**:
- Status: 200 OK
- Same as Test 1 (should handle ID extraction)

---

### 3. Short URL Format

**Test**: YouTube short URL (youtu.be)

```bash
curl -X POST YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://youtu.be/dQw4w9WgXcQ"
  }'
```

**Expected Result**:
- Status: 200 OK
- Same as Test 1

---

### 4. Fallback Scenario (No Transcript Available)

**Test**: Video without native transcript (should trigger Gemini fallback)

```bash
curl -X POST YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "VIDEO_WITHOUT_TRANSCRIPT"
  }'
```

**Expected Result**:
- Status: 200 OK (if Gemini succeeds)
- `source`: "Gemini (fallback)"
- Console logs: "⚠️ TranscriptAPI failed (404)" → "🔄 Falling back to Gemini"

**Note**: Finding a video without transcripts can be tricky. Most popular videos have them.

---

### 5. Invalid Video ID

**Test**: Completely invalid video ID

```bash
curl -X POST YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "INVALID_ID_123"
  }'
```

**Expected Result**:
- Status: 400
- `success`: false
- `error`: "Invalid YouTube video URL"
- **No fallback** (422 error doesn't trigger fallback)

---

### 6. Audio File Upload (Gemini Direct)

**Test**: Upload audio file for transcription

```typescript
// Convert audio file to base64
const audioBase64 = await fileToBase64(audioFile);

const response = await fetch('YOUR_SUPABASE_URL/functions/v1/api-transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audio: audioBase64,
    mimeType: 'audio/mp3',
    options: {
      includeTimestamps: true,
      enableDiarization: true,
      maxSpeakers: 2
    }
  })
});
```

**Expected Result**:
- Status: 200 OK
- `source`: "file"
- Uses Gemini directly (no TranscriptAPI involved)

---

### 7. Video File Upload

**Test**: Upload video file

```typescript
const videoBase64 = await fileToBase64(videoFile);

const response = await fetch('YOUR_SUPABASE_URL/functions/v1/api-transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    video: videoBase64,
    mimeType: 'video/mp4'
  })
});
```

**Expected Result**:
- Status: 200 OK
- `source`: "file"

---

### 8. Rate Limiting (429)

**Test**: Rapid fire requests to trigger rate limit

```bash
for i in {1..20}; do
  curl -X POST YOUR_SUPABASE_URL/functions/v1/api-transcribe \
    -H "Content-Type: application/json" \
    -d '{"youtubeUrl": "dQw4w9WgXcQ"}' &
done
wait
```

**Expected Result**:
- First requests: 200 OK with TranscriptAPI
- After limit: Should fallback to Gemini
- Console logs: "⚠️ TranscriptAPI failed (429)" → "🔄 Falling back to Gemini"

---

### 9. CORS Preflight

**Test**: OPTIONS request for CORS

```bash
curl -X OPTIONS YOUR_SUPABASE_URL/functions/v1/api-transcribe \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected Result**:
- Status: 200 OK
- Headers include:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: ...`

---

### 10. Direct TranscriptAPI Test

**Test**: Bypass Supabase function, test TranscriptAPI directly

```bash
curl -s \
  -H "Authorization: Bearer sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw" \
  "https://transcriptapi.com/api/v2/youtube/transcript?video_url=dQw4w9WgXcQ&format=json" \
  | jq '.'
```

**Expected Result**:
```json
{
  "video_id": "dQw4w9WgXcQ",
  "language": "en",
  "transcript": [...],
  "metadata": {
    "title": "..."
  }
}
```

---

## Integration Tests

### JavaScript/TypeScript Test Suite

```typescript
import { describe, it, expect } from 'vitest';

describe('TranscriptAPI Integration', () => {
  const baseUrl = 'YOUR_SUPABASE_URL/functions/v1/api-transcribe';

  it('should transcribe YouTube video using TranscriptAPI', async () => {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      })
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('TranscriptAPI');
    expect(data.segments).toBeInstanceOf(Array);
    expect(data.segments.length).toBeGreaterThan(0);
  });

  it('should handle video ID without full URL', async () => {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtubeUrl: 'dQw4w9WgXcQ'
      })
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metadata.videoId).toBe('dQw4w9WgXcQ');
  });

  it('should return error for invalid video ID', async () => {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtubeUrl: 'INVALID'
      })
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should fallback to Gemini when TranscriptAPI fails', async () => {
    // This test requires a video without transcript
    // or mocking TranscriptAPI failure
    // Implementation depends on test infrastructure
  });
});
```

---

## Performance Benchmarks

### Expected Response Times

| Scenario | Expected Time | Service |
|----------|---------------|---------|
| TranscriptAPI success | < 2s | TranscriptAPI |
| Gemini fallback | 5-15s | Gemini |
| Audio file (small) | 3-10s | Gemini |
| Video file (small) | 5-20s | Gemini |

### Load Testing

```bash
# Apache Bench
ab -n 100 -c 10 -p request.json -T application/json \
  YOUR_SUPABASE_URL/functions/v1/api-transcribe

# wrk
wrk -t4 -c100 -d30s --latency \
  -s post.lua \
  YOUR_SUPABASE_URL/functions/v1/api-transcribe
```

---

## Monitoring Checklist

During testing, verify:

- [ ] Console logs show service selection
- [ ] Response `source` field is accurate
- [ ] Fallback triggers on appropriate errors
- [ ] No fallback on 401, 402, 422 errors
- [ ] Timestamps are properly converted
- [ ] Video metadata is included
- [ ] Error messages are descriptive
- [ ] CORS headers work cross-origin
- [ ] Response times meet benchmarks

---

## Troubleshooting

### TranscriptAPI Always Fails
- Check API key is correct
- Verify network connectivity to transcriptapi.com
- Check for rate limiting (429 errors)
- Verify video IDs are valid

### No Fallback to Gemini
- Ensure GEMINI_API_KEY is set
- Check fallback logic in code
- Verify error types that trigger fallback

### Segments Missing Timestamps
- Check conversion logic in `convertTranscriptAPIResponse`
- Verify TranscriptAPI response format
- Check for null/undefined values

### CORS Issues
- Verify corsHeaders in code
- Check OPTIONS request handling
- Ensure Origin header is allowed

---

## Test Data

### Working YouTube Video IDs
- `dQw4w9WgXcQ` - Rick Astley (music, English)
- `9bZkp7q19f0` - Gangnam Style (Korean)
- `kJQP7kiw5Fk` - Despacito (Spanish)

### Various URL Formats
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
https://www.youtube.com/embed/dQw4w9WgXcQ
dQw4w9WgXcQ
```

---

## Success Criteria

✅ All 10 test scenarios pass  
✅ Response times within benchmarks  
✅ Proper fallback behavior  
✅ Accurate error handling  
✅ CORS works cross-origin  
✅ Logging provides clear feedback  
✅ Format conversion is accurate  
✅ Video ID extraction works for all formats  

---

## Post-Testing

After successful testing:

1. Document any issues found
2. Update error handling if needed
3. Adjust timeout values if necessary
4. Monitor production usage
5. Track fallback frequency
6. Measure cost savings vs Gemini-only

---

## Support

For issues during testing:
1. Check Supabase function logs
2. Test TranscriptAPI directly (Test #10)
3. Verify environment variables
4. Review error messages
5. Check service status pages

---

**Last Updated**: January 26, 2026  
**Version**: 1.0
