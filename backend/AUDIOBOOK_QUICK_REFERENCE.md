# Audiobook Quick Reference

## 🎯 Quick Commands

### Install Dependencies
```bash
cd backend
pip install -r audiobook_requirements.txt
sudo apt-get install ffmpeg  # Ubuntu/Debian
brew install ffmpeg          # macOS
```

### Run Migration
```bash
python manage.py migrate publishing
```

### Verify Setup
```bash
python verify_audiobook_setup.py
```

### Run Tests
```bash
python manage.py test apps.publishing.tests.test_audiobook_export
```

---

## 🎵 Supported Formats

| Format | Bitrate | Use Case | Platform |
|--------|---------|----------|----------|
| MP3 192 kbps | 192 | ACX/Audible Standard | ACX |
| MP3 128 kbps | 128 | Smaller files | Author's Republic |
| MP3 320 kbps | 320 | Highest quality | Findaway |
| M4B 64 kbps | 64 | Chapters, streaming | Spotify |

---

## 🏪 Marketplace Comparison

| Platform | Royalty | Distribution | Exclusive? |
|----------|---------|--------------|------------|
| ACX/Audible | 40% | Audible, Amazon, iTunes | Yes |
| ACX/Audible | 25% | Audible, Amazon, iTunes | No |
| Findaway | 80% | 40+ platforms | No |
| Author's Republic | 70% | 40+ retailers | No |
| Google Play | 70% | Google Play Books | No |
| Spotify | Varies | Spotify app | No |

---

## 📋 API Quick Reference

### Export Audiobook
```bash
POST /api/v1/publishing/books/123/export-audiobook/

{
  "include_opening_credits": true,
  "include_closing_credits": true,
  "generate_retail_sample": true,
  "include_chapter_markers": true
}
```

### Response Structure
```json
{
  "status": "success",
  "output_path": "/media/audiobooks/book_123/My_Book/",
  "total_files": 5,
  "total_duration_hours": 6.5,
  "chapter_count": 12,
  "marketplace_specs": {
    "marketplace": "ACX/Audible",
    "format": "MP3 192 kbps",
    "bitrate": "192 kbps"
  }
}
```

---

## 🔧 Python Quick Reference

### Generate Audiobook
```python
from apps.publishing.services.audio_export import AudioExportService

service = AudioExportService()
result = service.generate_audiobook(
    book_id=123,
    include_opening_credits=True,
    include_closing_credits=True,
    generate_retail_sample=True,
    include_chapter_markers=True
)
```

### Validate ACX Compliance
```python
validation = service.validate_acx_compliance('/path/to/audio.mp3')

if validation['valid']:
    print(f"✓ ACX Compliant")
else:
    print("Errors:", validation['errors'])
```

---

## 🎙️ Voice Recommendations

| Genre | Recommended Voice | Tone |
|-------|------------------|------|
| Fiction | Fable | Deep, dramatic |
| Non-Fiction | Echo | Clear, professional |
| Thriller | Onyx | Intense, suspenseful |
| YA | Nova | Young, energetic |
| Romance | Shimmer | Warm, gentle |
| General | Alloy | Balanced, neutral |

---

## 💰 Cost Calculations

### AI TTS (OpenAI)
- **$15 per audio hour**
- 8-hour book = $120
- Processing: 2 hours

### Human Narrator
- **$250-$400 per finished hour**
- 8-hour book = $2,000-$3,200
- Studio time: 48-64 hours

**Savings: 94% with AI**

---

## ✅ ACX Checklist

### Audio Quality
- [ ] Peak: -3dB to -6dB
- [ ] RMS: -18dB to -23dB
- [ ] Noise floor: < -60dB
- [ ] 192 kbps CBR
- [ ] 44.1 kHz sample rate

### Files Required
- [ ] Opening credits (5-15 sec)
- [ ] All chapters (numbered)
- [ ] Closing credits (5-20 sec)
- [ ] Retail sample (5 min)
- [ ] Chapter markers (ID3 tags)

### Naming Convention
```
Title_Opening.mp3
Title_01.mp3
Title_02.mp3
...
Title_Closing.mp3
Title_RetailSample.mp3
```

---

## 🐛 Troubleshooting

### Audio files too large
→ Use MP3 128 kbps or M4B 64 kbps

### Chapter markers not working
→ Ensure ID3v2.4 tags with CHAP frames

### ACX rejects quality
→ Run `validate_acx_compliance()`

### Missing ffmpeg error
→ Install ffmpeg: `apt-get install ffmpeg`

---

## 📚 Documentation Files

1. **AUDIOBOOK_GUIDE.md** - User guide (500+ lines)
2. **AUDIOBOOK_INTEGRATION_COMPLETE.md** - Technical docs
3. **AUDIOBOOK_IMPLEMENTATION_SUMMARY.md** - Implementation summary
4. **AUDIOBOOK_QUICK_REFERENCE.md** - This file

---

## 🎯 UI Fields (CreateBookWizard.tsx)

```typescript
audiobook_marketplace: 'acx_audible'  // Platform
audio_format: 'mp3_acx'               // Format
audio_bitrate: 192                    // kbps
audio_mono_stereo: 'stereo'           // Channels
include_chapter_markers: true         // ID3 tags
include_opening_credits: true         // Opening file
include_closing_credits: true         // Closing file
generate_retail_sample: true          // 5-min preview
```

---

## 📁 File Locations

```
backend/
├── apps/publishing/
│   ├── audiobook_config.py           # Configuration
│   ├── services/audio_export.py      # Export service
│   └── migrations/0002_*.py          # Database migration

frontend/
└── components/CreateBookWizard.tsx   # UI component

docs/
├── AUDIOBOOK_GUIDE.md
├── AUDIOBOOK_INTEGRATION_COMPLETE.md
└── AUDIOBOOK_QUICK_REFERENCE.md
```

---

**Last Updated**: January 2026  
**Status**: ✅ Production Ready
