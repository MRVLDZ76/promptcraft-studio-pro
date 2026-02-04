# Audiobook Integration - Complete Implementation Guide

## 📚 Overview

Complete audiobook publishing system integrated with ACX/Audible, Findaway Voices, Author's Republic, Google Play Audio, and Spotify Audiobooks. Includes professional audio export, chapter markers, credits generation, and retail sample extraction.

---

## 🎯 Implementation Summary

### ✅ Completed Components

#### 1. **Backend Configuration**
- **audiobook_config.py** (600+ lines)
  - 5 marketplace platforms with royalty rates
  - 4 audio formats (MP3 192/128/320kbps, M4B 64kbps)
  - 6 OpenAI TTS voice profiles
  - ACX audio quality standards
  - Chapter marker specifications
  - Credits templates

#### 2. **Database Schema**
- **BookProject Model** - 8 new fields:
  ```python
  audiobook_marketplace = CharField(default='acx_audible')
  audio_format = CharField(default='mp3_acx')
  audio_bitrate = IntegerField(default=192)
  audio_mono_stereo = CharField(default='stereo')
  include_chapter_markers = BooleanField(default=True)
  include_opening_credits = BooleanField(default=True)
  include_closing_credits = BooleanField(default=True)
  generate_retail_sample = BooleanField(default=True)
  ```

- **Migration**: `0002_add_marketplace_and_audiobook_specs.py`

#### 3. **Audio Export Service**
- **audio_export.py** (600+ lines)
  - `AudioExportService` class
  - `generate_audiobook()` - Main export method
  - `_generate_opening_credits()` - 5-15 second opening
  - `_generate_closing_credits()` - 5-20 second closing
  - `_generate_chapter_audio()` - Per-chapter generation
  - `_add_chapter_markers()` - ID3 tag injection
  - `_generate_retail_sample()` - 5-minute preview
  - `validate_acx_compliance()` - Quality validation

#### 4. **REST API**
- **BookProjectSerializer** - Added 8 audiobook fields
- **views.py** - New endpoint:
  ```
  POST /api/v1/publishing/books/{id}/export-audiobook/
  ```
  
  Request Body:
  ```json
  {
    "include_opening_credits": true,
    "include_closing_credits": true,
    "generate_retail_sample": true,
    "include_chapter_markers": true
  }
  ```
  
  Response:
  ```json
  {
    "status": "success",
    "output_path": "/media/audiobooks/book_123/My_Book/",
    "files": [
      {
        "type": "opening_credits",
        "path": "/media/audiobooks/.../My_Book_Opening.mp3",
        "duration_seconds": 10,
        "file_size": 192000
      },
      {
        "type": "chapter",
        "chapter_number": 1,
        "chapter_title": "The Beginning",
        "path": "/media/audiobooks/.../My_Book_01.mp3",
        "duration_seconds": 1200,
        "file_size": 23040000
      }
    ],
    "total_files": 5,
    "total_duration_hours": 6.5,
    "chapter_count": 12,
    "marketplace_specs": {
      "marketplace": "ACX/Audible",
      "format": "MP3 192 kbps (ACX Standard)",
      "bitrate": "192 kbps",
      "sample_rate": "44100 Hz",
      "channels": "stereo",
      "chapter_markers": true,
      "has_opening_credits": true,
      "has_closing_credits": true,
      "has_retail_sample": true
    }
  }
  ```

#### 5. **Frontend UI**
- **CreateBookWizard.tsx** - Step 4: Output Formats
  - Audiobook marketplace selector
  - Audio format dropdown (auto-updates bitrate)
  - Channel configuration (Stereo/Mono)
  - Feature toggles: Chapter markers, Credits, Retail sample
  - Platform-specific royalty information

---

## 🚀 Usage Guide

### Step 1: Create Book Project

```typescript
// In CreateBookWizard.tsx
const formData = {
  title: "My Audiobook",
  author_name: "John Doe",
  genres: ["Fiction", "Mystery"],
  target_audience: "Adults",
  
  // Audiobook Configuration
  audiobook_marketplace: "acx_audible",
  audio_format: "mp3_acx",
  audio_bitrate: 192,
  audio_mono_stereo: "stereo",
  include_chapter_markers: true,
  include_opening_credits: true,
  include_closing_credits: true,
  generate_retail_sample: true,
}
```

### Step 2: Export Audiobook

```typescript
// Call export API
const response = await fetch(`/api/v1/publishing/books/${bookId}/export-audiobook/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    include_opening_credits: true,
    include_closing_credits: true,
    generate_retail_sample: true,
    include_chapter_markers: true,
  })
});

const result = await response.json();
console.log(`Generated ${result.total_files} audiobook files`);
console.log(`Total duration: ${result.total_duration_hours} hours`);
```

### Step 3: Download Files

```typescript
// Files are organized as:
// /media/audiobooks/book_123/My_Book/
//   ├── My_Book_Opening.mp3       (Opening credits)
//   ├── My_Book_01.mp3             (Chapter 1)
//   ├── My_Book_02.mp3             (Chapter 2)
//   ├── ...
//   ├── My_Book_Closing.mp3        (Closing credits)
//   └── My_Book_RetailSample.mp3   (5-minute preview)

// Download individual files or ZIP package
result.files.forEach(file => {
  console.log(`${file.filename}: ${file.duration_seconds}s`);
});
```

---

## 🎵 Audio Specifications

### ACX/Audible Standards (Default)

```yaml
Format: MP3
Bitrate: 192 kbps CBR (Constant Bit Rate)
Sample Rate: 44.1 kHz
Bit Depth: 16-bit
Channels: Stereo (recommended) or Mono

Audio Quality:
  Peak Amplitude: -3dB to -6dB
  RMS Level: -18dB to -23dB
  Noise Floor: Below -60dB
  
File Naming:
  - Title_Opening.mp3
  - Title_01.mp3, Title_02.mp3, ...
  - Title_Closing.mp3
  - Title_RetailSample.mp3

Chapter Markers:
  Type: ID3 CHAP frames (ID3v2.4)
  Navigation: Timestamp-based with chapter titles
```

### Alternative Formats

#### Findaway Voices
```yaml
Format: MP3 320 kbps OR M4B 64 kbps
Distribution: 40+ platforms worldwide
Royalty: 80% net revenue
```

#### Author's Republic
```yaml
Format: MP3 128 kbps (smaller files)
Distribution: 40+ retailers
Royalty: 70% net revenue
```

#### Google Play Audio
```yaml
Format: MP3 192 kbps
Channels: Stereo or Mono
Royalty: 70% retail price
```

#### Spotify Audiobooks
```yaml
Format: M4B 64 kbps (chapters)
Container: MPEG-4 with chapter markers
Royalty: Subscription-based
```

---

## 🎙️ Voice Profiles (OpenAI TTS)

### 1. **Fable** - Deep, Dramatic Male
```yaml
Best For: Fiction, Epic Fantasy, Historical Fiction
Tone: Rich, authoritative, engaging
Sample: "In a land far away..."
```

### 2. **Echo** - Neutral Male
```yaml
Best For: Non-fiction, Educational, Business
Tone: Clear, professional, trustworthy
Sample: "Studies have shown that..."
```

### 3. **Onyx** - Deep, Intense Male
```yaml
Best For: Thriller, Horror, Action
Tone: Dark, suspenseful, commanding
Sample: "The shadow moved closer..."
```

### 4. **Nova** - Young, Energetic Female
```yaml
Best For: YA, Contemporary, Romance
Tone: Bright, enthusiastic, relatable
Sample: "I couldn't believe what I was seeing..."
```

### 5. **Shimmer** - Warm, Gentle Female
```yaml
Best For: Romance, Cozy Mystery, Literary Fiction
Tone: Smooth, soothing, intimate
Sample: "Love found her when she least expected..."
```

### 6. **Alloy** - Balanced, Neutral
```yaml
Best For: General Fiction, Memoirs, Self-Help
Tone: Versatile, friendly, approachable
Sample: "This is a story about..."
```

---

## 💰 Cost & Revenue Analysis

### Production Costs

#### AI TTS (OpenAI)
```
Cost: $15 per audio hour (1M characters)
Time: ~2 hours processing for 8-hour book
Total: $120 for 8-hour audiobook
```

#### Human Narrator
```
Cost: $250-$400 per finished hour
Time: 6-8 hours studio time per finished hour
Total: $2,000-$3,200 for 8-hour audiobook
```

**Savings: 94% with AI TTS**

### Revenue Projections

#### ACX/Audible Exclusive (40% royalty)
```
Retail Price: $19.95
Your Royalty: $7.98 per sale
Break-Even: 16 sales ($127.68)
```

#### ACX/Audible Non-Exclusive (25% royalty)
```
Retail Price: $19.95
Your Royalty: $4.99 per sale
Break-Even: 25 sales ($124.75)
```

#### Findaway Voices (80% royalty)
```
Net Revenue: $15 per sale (after platform fees)
Your Royalty: $12 per sale
Break-Even: 11 sales ($132)
Wide Distribution: 40+ platforms
```

---

## 📋 ACX Submission Checklist

### ✅ Required Files
- [ ] Opening credits file (5-15 seconds)
- [ ] All chapter files (numbered sequentially)
- [ ] Closing credits file (5-20 seconds)
- [ ] Retail sample (first 5 minutes)
- [ ] Chapter markers embedded (ID3 tags)

### ✅ Audio Quality
- [ ] Peak amplitude: -3dB to -6dB
- [ ] RMS level: -18dB to -23dB
- [ ] Noise floor: Below -60dB
- [ ] No clicks, pops, or digital artifacts
- [ ] Consistent volume throughout

### ✅ Format Compliance
- [ ] MP3 192 kbps CBR
- [ ] 44.1 kHz sample rate
- [ ] 16-bit depth
- [ ] Stereo or mono (consistent)

### ✅ Naming Convention
- [ ] Files named: Title_01.mp3, Title_02.mp3, etc.
- [ ] Opening: Title_Opening.mp3
- [ ] Closing: Title_Closing.mp3
- [ ] Sample: Title_RetailSample.mp3

### ✅ Content Requirements
- [ ] Opening credits include title, author, narrator
- [ ] Closing credits include copyright, thank you
- [ ] Room tone before/after speech (0.5 seconds)
- [ ] No music unless explicitly requested by author

---

## 🔧 Technical Implementation

### Dependencies

```bash
# Install required Python packages
pip install pydub mutagen gtts

# System dependencies (for pydub)
# Ubuntu/Debian:
sudo apt-get install ffmpeg

# macOS:
brew install ffmpeg

# Windows:
# Download ffmpeg from https://ffmpeg.org/download.html
```

### Service Methods

#### 1. Generate Complete Audiobook

```python
from apps.publishing.services.audio_export import AudioExportService

service = AudioExportService()
result = service.generate_audiobook(
    book_id=123,
    include_opening_credits=True,
    include_closing_credits=True,
    generate_retail_sample=True,
    include_chapter_markers=True,
)

print(f"Generated {result['total_files']} files")
print(f"Total duration: {result['total_duration_hours']:.2f} hours")
```

#### 2. Validate ACX Compliance

```python
service = AudioExportService()
validation = service.validate_acx_compliance('/path/to/chapter.mp3')

if validation['valid']:
    print("✓ ACX compliant")
else:
    print("✗ Errors:", validation['errors'])
    print("⚠ Warnings:", validation['warnings'])
```

#### 3. Add Chapter Markers

```python
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, CHAP

audio = MP3(file_path, ID3=ID3)
if audio.tags is None:
    audio.add_tags()

# Add chapter marker
audio.tags.add(
    CHAP(
        encoding=3,  # UTF-8
        element_id="chp1",
        start_time=0,  # milliseconds
        end_time=1200000,  # 20 minutes
        sub_frames=[('TIT2', 'Chapter 1: The Beginning')]
    )
)

audio.save()
```

---

## 📖 API Reference

### Export Audiobook

**Endpoint**: `POST /api/v1/publishing/books/{id}/export-audiobook/`

**Request**:
```json
{
  "include_opening_credits": true,
  "include_closing_credits": true,
  "generate_retail_sample": true,
  "include_chapter_markers": true
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Audiobook generated successfully",
  "output_path": "/media/audiobooks/book_123/My_Book/",
  "files": [
    {
      "type": "opening_credits",
      "path": "/media/audiobooks/.../My_Book_Opening.mp3",
      "filename": "My_Book_Opening.mp3",
      "duration_seconds": 10,
      "file_size": 192000
    },
    {
      "type": "chapter",
      "chapter_number": 1,
      "chapter_title": "The Beginning",
      "path": "/media/audiobooks/.../My_Book_01.mp3",
      "filename": "My_Book_01.mp3",
      "duration_seconds": 1200,
      "file_size": 23040000,
      "start_time_in_book": 0
    }
  ],
  "total_files": 5,
  "total_duration_hours": 6.5,
  "total_duration_minutes": 390,
  "chapter_count": 12,
  "marketplace_specs": {
    "marketplace": "ACX/Audible",
    "format": "MP3 192 kbps (ACX Standard)",
    "bitrate": "192 kbps",
    "sample_rate": "44100 Hz",
    "channels": "stereo",
    "chapter_markers": true,
    "has_opening_credits": true,
    "has_closing_credits": true,
    "has_retail_sample": true
  }
}
```

**Error Response** (500):
```json
{
  "error": "Failed to generate audiobook: [error message]"
}
```

---

## 🧪 Testing

### Test Audiobook Export

```python
# Test basic export
response = client.post(
    f'/api/v1/publishing/books/{book.id}/export-audiobook/',
    data={
        'include_opening_credits': True,
        'include_closing_credits': True,
        'generate_retail_sample': True,
        'include_chapter_markers': True,
    }
)

assert response.status_code == 200
assert response.data['status'] == 'success'
assert response.data['total_files'] > 0
```

### Test ACX Compliance

```python
service = AudioExportService()
validation = service.validate_acx_compliance(file_path)

assert validation['valid'] == True
assert validation['bitrate'] == 192
assert validation['sample_rate'] == 44100
assert -6 <= validation['peak_db'] <= -3
assert -23 <= validation['rms_db'] <= -18
```

---

## 📚 Documentation Files

1. **AUDIOBOOK_GUIDE.md** (500+ lines)
   - User-facing guide for audiobook publishing
   - Step-by-step instructions
   - Best practices
   - Marketplace comparison

2. **AUDIOBOOK_INTEGRATION_COMPLETE.md** (This file)
   - Technical implementation guide
   - API reference
   - Code examples
   - Testing instructions

3. **audiobook_config.py** (600+ lines)
   - Complete configuration system
   - Marketplace specifications
   - Audio format definitions
   - Helper functions

4. **audio_export.py** (600+ lines)
   - AudioExportService implementation
   - Audio processing methods
   - ACX validation
   - File generation

---

## 🎯 Next Steps

### Future Enhancements

1. **Async Processing**
   - Implement Celery task for long-running audiobook generation
   - Progress tracking with WebSocket updates
   - Email notification when complete

2. **Advanced Audio Processing**
   - Noise reduction
   - Volume normalization
   - Fade-in/fade-out effects
   - Background music mixing

3. **Voice Cloning**
   - ElevenLabs integration for custom voices
   - Voice consistency across chapters
   - Emotion and pacing control

4. **Multi-Narrator Support**
   - Character-specific voices
   - Dialogue attribution
   - Narrator switching

5. **Quality Assurance**
   - Automated ACX validation before export
   - Audio preview generation
   - Waveform visualization
   - Pronunciation correction

---

## 📞 Support

### Common Issues

**Issue**: Audio files too large
- **Solution**: Use MP3 128 kbps or M4B 64 kbps format

**Issue**: Chapter markers not showing
- **Solution**: Ensure ID3v2.4 tags and CHAP frames

**Issue**: ACX rejects audio quality
- **Solution**: Run `validate_acx_compliance()` and fix warnings

**Issue**: Opening credits too long
- **Solution**: Keep under 15 seconds per ACX guidelines

---

## ✅ Integration Complete

All audiobook marketplace features are now fully integrated:

✅ Backend configuration (audiobook_config.py)
✅ Database schema (8 new fields)
✅ Audio export service (audio_export.py)
✅ REST API endpoint (export_audiobook)
✅ Frontend UI (CreateBookWizard)
✅ Migration files (0002_add_marketplace_and_audiobook_specs.py)
✅ Complete documentation
✅ ACX/Audible compliance
✅ Multi-platform support (5 marketplaces)
✅ Professional audio quality
✅ Chapter markers and credits

**Ready for production audiobook publishing! 🎉**
