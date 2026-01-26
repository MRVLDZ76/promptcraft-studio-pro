# File Storage Implementation - Quick Guide

**Date**: January 26, 2026  
**Status**: ✅ Implemented  
**Storage**: Supabase Storage

---

## 🎯 What Was Implemented

### 1. **File Storage Service** 
[services/fileStorageService.ts](../services/fileStorageService.ts)
- Upload files to Supabase Storage buckets
- Download files from storage
- Delete files and manage storage
- Calculate storage usage per user
- Generate file hashes for duplicate detection

### 2. **Asset Persistence**
[services/resultPersistenceService.ts](../services/resultPersistenceService.ts)
- `saveFileAsset()` - Upload file + save metadata to database
- Automatic bucket selection based on MIME type
- Content hash generation for deduplication

### 3. **UI Integration**
[components/AnalysisStudio.tsx](../components/AnalysisStudio.tsx)
- File uploads now automatically saved to storage
- Asset IDs tracked in metadata
- Public URLs accessible for later retrieval

---

## 📦 Storage Buckets

| Bucket | Purpose | Size Limit | MIME Types |
|--------|---------|------------|------------|
| `videos` | Video files | 500MB | mp4, webm, mov, mkv |
| `audio` | Audio files | 100MB | mp3, wav, ogg, webm, m4a |
| `transcripts` | Subtitle files | 10MB | txt, srt, vtt |
| `documents` | Documents | 50MB | pdf, txt, json, csv |
| `images` | Image files | 10MB | jpg, png, gif, webp, svg |

---

## 🚀 Setup Instructions

### Step 1: Initialize Storage Buckets

**Option A: Via Supabase Dashboard** (Recommended)
1. Go to https://uuohwxcuqnaykpjhrcvu.supabase.co/project/_/storage
2. Click "Create Bucket" for each:
   - `videos` (public, 500MB limit)
   - `audio` (public, 100MB limit)
   - `transcripts` (public, 10MB limit)
   - `documents` (public, 50MB limit)
   - `images` (public, 10MB limit)

**Option B: Via Code**
```javascript
// In browser console or Node.js
import { initializeStorageBuckets } from './services/fileStorageService';
await initializeStorageBuckets();
```

### Step 2: Verify Setup
Upload a test file via the UI to confirm storage is working.

---

## 💾 How Files Are Saved

### Upload Flow

```
User uploads file
     ↓
handleVideoUpload() called
     ↓
inputProcessor.processFile() - Extract transcript
     ↓
saveFileAsset() - Upload to storage
     ↓
┌─────────────────────────────────┐
│ 1. Generate file hash           │
│ 2. Upload to Supabase bucket    │
│ 3. Get public URL               │
│ 4. Save metadata to database    │
│    - asset_uploads table        │
│    - s3_path = storage path     │
│    - source_url = public URL    │
└─────────────────────────────────┘
     ↓
Asset ID returned & stored in metadata
     ↓
File accessible via public URL forever
```

### Database Record

When a file is uploaded, this is saved to `asset_uploads` table:

```json
{
  "id": "uuid",
  "user_id": "anonymous",
  "filename": "debate.mp4",
  "asset_type": "video",
  "source_type": "file_upload",
  "file_size_bytes": 45678901,
  "mime_type": "video/mp4",
  "s3_path": "anonymous/1737918234_abc123_debate.mp4",
  "source_url": "https://uuohwxcuqnaykpjhrcvu.supabase.co/storage/v1/object/public/videos/anonymous/...",
  "content_hash": "sha256_hash_here",
  "status": "ready"
}
```

---

## 📋 API Reference

### Upload Functions

```typescript
// Upload any file type (auto-detects bucket)
import { saveFileAsset } from './services/resultPersistenceService';

const asset = await saveFileAsset(file, {
  userId: 'user123',
  title: 'My Video',
  description: 'Debate recording',
  tags: ['debate', 'politics'],
});

console.log(asset.storageUrl); // Public URL
console.log(asset.id); // Asset database ID
```

```typescript
// Upload specific file types
import { 
  uploadVideo, 
  uploadAudio, 
  uploadTranscript 
} from './services/fileStorageService';

const result = await uploadVideo(videoFile, 'user123');
// Returns: { success, path, publicUrl, size }
```

### Retrieve Files

```typescript
import { getPublicUrl, downloadFile } from './services/fileStorageService';

// Get URL
const url = getPublicUrl('videos', 'path/to/file.mp4');

// Download blob
const blob = await downloadFile('videos', 'path/to/file.mp4');
```

### Delete Files

```typescript
import { deleteFile, deleteFiles } from './services/fileStorageService';

// Delete single file
await deleteFile('videos', 'path/to/file.mp4');

// Delete multiple
await deleteFiles('videos', ['file1.mp4', 'file2.mp4']);
```

### Storage Management

```typescript
import { 
  getUserStorageUsage, 
  formatBytes, 
  listUserFiles 
} from './services/fileStorageService';

// Check user's storage usage
const bytes = await getUserStorageUsage('user123');
console.log(formatBytes(bytes)); // "45.6 MB"

// List user's files in bucket
const files = await listUserFiles('videos', 'user123');
```

---

## 🔐 Security & Access

### Public Access
- All buckets are **PUBLIC** by default
- Files accessible via public URL without authentication
- Anyone with the URL can view/download

### Private Files (Future)
To make buckets private:
1. Set `public: false` when creating bucket
2. Update RLS policies in [20260126_storage_setup.sql](../supabase/migrations/20260126_storage_setup.sql)
3. Use signed URLs with expiration

---

## 🧪 Testing

### Test File Upload

1. Open AnalysisStudio
2. Click "Upload Video/Audio"
3. Select a file
4. Check console for: `💾 File saved to storage: https://...`
5. Verify in Supabase Dashboard > Storage > videos

### Test File Retrieval

```javascript
// In browser console
import { supabase } from './services/supabaseClient';

// List all files
const { data } = await supabase.storage.from('videos').list();
console.log(data);

// Get specific file URL
const { data: urlData } = supabase.storage
  .from('videos')
  .getPublicUrl('your-file-path.mp4');
console.log(urlData.publicUrl);
```

---

## 📊 Storage Limits

### Current Supabase Free Tier
- **Total storage**: 1GB
- **Bandwidth**: 2GB/month
- **File size**: 50MB per file (configurable per bucket)

### Bucket Limits (Configured)
- Videos: 500MB per file
- Audio: 100MB per file
- Transcripts: 10MB per file
- Documents: 50MB per file
- Images: 10MB per file

---

## 🚨 Troubleshooting

### "Bucket not found"
→ Run bucket initialization (see Step 1 above)

### "File too large"
→ Check bucket size limits
→ Compress file or upgrade Supabase plan

### "Upload failed: 403 Forbidden"
→ Check RLS policies in storage.objects table
→ Verify SUPABASE_ANON_KEY is correct

### Files not appearing in database
→ Check `asset_uploads` table
→ Verify `saveAssetUpload()` succeeded
→ Check console for errors

---

## 🎯 Next Steps

1. **Initialize buckets** via Supabase Dashboard
2. **Test upload** a video file to verify
3. **Implement user auth** to replace 'anonymous' user ID
4. **Add file browser** to view uploaded assets
5. **Implement cleanup** - delete old files after 30 days

---

**Files Modified:**
- ✅ `services/fileStorageService.ts` (new, 400+ lines)
- ✅ `services/resultPersistenceService.ts` (added saveFileAsset)
- ✅ `components/AnalysisStudio.tsx` (integrated storage)
- ✅ `supabase/migrations/20260126_storage_setup.sql` (new)
- ✅ `scripts/initStorage.js` (new)

**Ready to use!** Just initialize the buckets and start uploading.
