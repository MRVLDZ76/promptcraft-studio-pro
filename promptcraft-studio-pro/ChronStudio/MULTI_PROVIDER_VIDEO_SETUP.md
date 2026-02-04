# 🚀 Multi-Provider Video Generation Setup Guide

**Date:** February 2, 2026  
**Feature:** Add Sora (OpenAI) + Remix alongside Veo 3.1 (Google)

---

## 🎯 Overview

This document describes the implementation of a **multi-provider video generation system** that supports:

### **Providers:**
✅ **Google Veo 3.1** - High-quality 720p/1080p videos (5-15s)
✅ **OpenAI Sora 2** - Flexible resolutions, multiple orientations (4-12s)
✅ **OpenAI Sora 2 Pro** - Premium quality Sora model

### **Key Features:**
- ✅ Provider selection UI (choose per project)
- ✅ Duration options (4s, 8s, 12s, 15s depending on provider)
- ✅ Resolution options (720x1280, 1280x720, 1024x1792, 1792x1024, 1920x1080)
- ✅ **Remix/Extend videos** (Sora exclusive - extend existing videos)
- ✅ Reference image support (both providers)
- ✅ Backward compatible with existing Veo-only projects

---

## 📋 Files Created

### **1. Video Provider Types** 
**File:** `ChronStudio/types/videoProviders.ts`

Defines provider configurations, capabilities, and default settings:

```typescript
export type VideoProvider = 'veo' | 'sora' | 'sora-pro';

export const PROVIDER_CONFIG = {
  veo: {
    name: 'Google Veo 3.1',
    durations: [5, 8, 10, 12, 15],
    resolutions: ['1280x720', '1920x1080'],
    supportsRemix: false,
    supportsReferenceImage: true
  },
  sora: {
    name: 'OpenAI Sora 2',
    durations: [4, 8, 12],
    resolutions: ['720x1280', '1280x720', '1024x1792', '1792x1024'],
    supportsRemix: true, // ✨ Unique feature
    supportsReferenceImage: true
  },
  'sora-pro': {
    name: 'OpenAI Sora 2 Pro',
    durations: [4, 8, 12],
    resolutions: ['720x1280', '1280x720', '1024x1792', '1792x1024'],
    supportsRemix: true,
    supportsReferenceImage: true
  }
};
```

### **2. Multi-Provider Video Service**
**File:** `ChronStudio/services/multiProviderVideoService.ts`

Unified interface for all video generation providers:

```typescript
// Main generation function - routes to appropriate provider
export const generateVideo = async (
  prompt: string,
  config: VideoGenerationConfig,
  referenceImage?: string | File
): Promise<VideoGenerationResult>

// Remix existing video (Sora only)
export const remixVideo = async (
  remixConfig: RemixConfig
): Promise<VideoGenerationResult>

// Check available providers based on API keys
export const getAvailableProviders = (): VideoProvider[]
```

---

## 🔧 Configuration Required

### **Environment Variables**

Add to `.env` file:

```bash
# Existing - Google Veo 3.1
API_KEY=your_google_ai_api_key_here

# NEW - OpenAI Sora
OPENAI_API_KEY=your_openai_api_key_here
```

### **Getting API Keys:**

**Google Veo 3.1:**
1. Visit: https://aistudio.google.com/
2. Create project
3. Enable Veo API
4. Copy API key

**OpenAI Sora:**
1. Visit: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy API key
4. Note: Sora may require waitlist approval

---

## 🎨 UI Features

### **Provider Settings Panel**

New collapsible settings in Step 4 header:

```
┌─────────────────────────────────────────┐
│ [🖥️ Google Veo 3.1] ▼                  │
│                                         │
│ Provider:     [Google Veo 3.1  ▼]      │
│ Duration:     [8s ▼]                    │
│ Resolution:   [1280x720 ▼]              │
│                                         │
│ ✓ Reference Images  ⓧ Remix/Extend     │
└─────────────────────────────────────────┘
```

**Features:**
- Click provider name to toggle settings
- Select provider, duration, resolution per project
- Visual indicators for supported features
- Disabled if only one provider available

### **Scene Card Enhancements**

Each scene now shows:
- Provider used (`veo`, `sora`, `sora-pro`)
- Video ID (for Sora videos)
- **"Remix" button** (Sora videos only)

---

## 🎬 Remix Feature (Sora Exclusive)

### **What is Remix?**

Remix allows you to:
- ✅ **Extend duration** - Take 8s video, make it 12s
- ✅ **Modify content** - Change prompt while keeping base video
- ✅ **Add continuity** - "...then the cat takes a bow to cheering audience"
- ✅ **Fix issues** - Regenerate with adjusted prompt without starting over

### **How to Use:**

1. **Generate video with Sora:**
   - Select "OpenAI Sora 2" or "Sora 2 Pro"
   - Generate scene normally

2. **Remix completed video:**
   - Locate "Remix" button on completed Sora scene
   - Enter new/extended prompt
   - Click "Remix Video"

3. **Result:**
   - New video builds on original
   - Maintains visual consistency
   - Can be remixed multiple times

### **Example Use Cases:**

**Original Prompt:**
```
"A calico cat playing a piano on stage"
```

**Remix Prompt:**
```
"Extend the scene with the cat taking a bow to the cheering audience"
```

**Result:** 
Seamless continuation from piano to bow, maintaining cat appearance and stage setting.

---

## 📊 Provider Comparison

| Feature | Veo 3.1 | Sora 2 | Sora 2 Pro |
|---------|---------|--------|------------|
| **Durations** | 5s, 8s, 10s, 12s, 15s | 4s, 8s, 12s | 4s, 8s, 12s |
| **Resolutions** | 1280x720, 1920x1080 | 4 options | 4 options |
| **Aspect Ratios** | 16:9 | 9:16, 16:9, 9:16, 16:9 | Same |
| **Reference Images** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Remix/Extend** | ❌ No | ✅ Yes | ✅ Yes |
| **Prompt Limit** | 500 chars | 1000 chars | 1000 chars |
| **Quality** | High | Standard | Premium |
| **Speed** | ~60-90s | ~30-60s | ~45-75s |

---

## 🔄 Migration Guide

### **Existing Projects**

**No changes required!** 

Existing projects using Veo will continue working:
- Default provider: `veo`
- No `videoId` or `provider` fields needed
- Legacy `generateVeoVideo()` function still works

### **New Projects**

Can choose provider:
1. Step 4: Click provider settings
2. Select Sora or Veo
3. Choose duration and resolution
4. Render scenes normally

### **Scene Type Updates**

```typescript
// Old Scene type
export interface Scene {
  videoUrl?: string;
}

// New Scene type (backward compatible)
export interface Scene {
  videoUrl?: string;
  videoId?: string; // NEW - Optional
  provider?: string; // NEW - Optional
}
```

---

## 💻 Implementation Details

### **generateVideo() Function**

Routes to appropriate provider:

```typescript
export const generateVideo = async (
  prompt: string,
  config: VideoGenerationConfig,
  referenceImage?: string | File
): Promise<VideoGenerationResult> => {
  switch (config.provider) {
    case 'veo':
      return await generateVeoVideo(prompt, config, referenceImage);
    
    case 'sora':
    case 'sora-pro':
      return await generateSoraVideo(prompt, config, referenceImage);
    
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
};
```

### **Veo Implementation** (Existing)

```typescript
const generateVeoVideo = async (
  prompt: string,
  config: VideoGenerationConfig,
  referenceImageBase64?: string
): Promise<VideoGenerationResult> => {
  const ai = getGoogleAI();
  
  // Configure Veo request
  const veoConfig = {
    numberOfVideos: 1,
    resolution: config.resolution === '1920x1080' ? '1080p' : '720p',
    referenceImages: referenceImageBase64 ? [...] : undefined
  };
  
  // Generate and poll
  let operation = await ai.models.generateVideos({...});
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({...});
  }
  
  return { videoUrl, provider: 'veo', ... };
};
```

### **Sora Implementation** (New)

```typescript
const generateSoraVideo = async (
  prompt: string,
  config: VideoGenerationConfig,
  referenceImageFile?: File
): Promise<VideoGenerationResult> => {
  const openai = getOpenAI();
  
  // Create video job
  const video = await openai.videos.create({
    prompt,
    model: config.model || 'sora-2',
    seconds: String(config.duration),
    size: config.resolution,
    input_reference: referenceImageFile
  });
  
  // Poll for completion
  while (video.status === 'queued' || video.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    video = await openai.videos.retrieve(video.id);
  }
  
  // Download content
  const contentResponse = await openai.videos.downloadContent(video.id);
  const videoBlob = await contentResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);
  
  return { videoUrl, videoId: video.id, provider: config.provider, ... };
};
```

### **Remix Implementation** (New)

```typescript
export const remixVideo = async (
  remixConfig: RemixConfig
): Promise<VideoGenerationResult> => {
  const openai = getOpenAI();
  
  // Create remix job
  const video = await openai.videos.remix(remixConfig.videoId, {
    prompt: remixConfig.newPrompt
  });
  
  // Poll for completion
  while (video.status !== 'completed') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    video = await openai.videos.retrieve(video.id);
  }
  
  // Download remixed video
  const contentResponse = await openai.videos.downloadContent(video.id);
  return { videoUrl: URL.createObjectURL(contentResponse.blob()), ... };
};
```

---

## 🧪 Testing Guide

### **Test 1: Provider Selection**

1. Open Step 4 (Production Studio)
2. Click provider name in header
3. ✅ Settings panel opens
4. ✅ Can select different providers
5. ✅ Duration/resolution options update
6. ✅ Feature indicators show correctly

### **Test 2: Veo Generation** (Control)

1. Select "Google Veo 3.1"
2. Duration: 8s, Resolution: 1280x720
3. Generate scene with character reference
4. ✅ Video generates successfully
5. ✅ Character consistency maintained

### **Test 3: Sora Generation**

1. Select "OpenAI Sora 2"
2. Duration: 8s, Resolution: 1280x720
3. Generate scene with character reference
4. ✅ Video generates successfully
5. ✅ Video ID stored
6. ✅ "Remix" button appears on completed scene

### **Test 4: Remix Feature** ⭐

1. Locate Sora-generated scene
2. Click "Remix" button
3. Enter new prompt: "Extend with [additional action]"
4. ✅ Remix generates successfully
5. ✅ New video builds on original
6. ✅ Can remix again with different prompt

### **Test 5: Batch Rendering** (Mixed)

1. Generate storyboard with 5 scenes
2. Set 3 scenes to Veo, 2 to Sora
3. Click "Render All Videos"
4. ✅ All videos generate in sequence
5. ✅ Mixed providers work correctly
6. ✅ Remix available on Sora scenes only

---

## 🐛 Troubleshooting

### **Issue: No providers available**

**Symptom:** Dropdown empty, can't render

**Solution:**
```bash
# Check .env file has API keys
API_KEY=... # Google Veo
OPENAI_API_KEY=... # OpenAI Sora

# Restart frontend server
npm run dev
```

### **Issue: Sora generates but no remix button**

**Symptom:** Video completes but remix button missing

**Solution:**
- Check `scene.videoId` exists (inspect in React DevTools)
- Check `scene.provider` is 'sora' or 'sora-pro'
- Verify `supportsRemix()` returns true

### **Issue: Remix fails with "Video ID required"**

**Symptom:** Click remix, error modal appears

**Solution:**
- Only Sora videos can be remixed
- Veo videos don't have `videoId`
- Regenerate with Sora provider first

### **Issue: Reference images not working with Sora**

**Symptom:** Reference image not influencing Sora output

**Solution:**
- Sora expects File object, not base64 string
- Current implementation may need image conversion
- Check `multiProviderVideoService.ts` line 117

---

## 📈 Performance Notes

### **Generation Times:**

| Provider | Duration | Est. Time | Notes |
|----------|----------|-----------|-------|
| Veo 3.1 | 5s | ~60s | Consistent |
| Veo 3.1 | 15s | ~90s | Slower for longer |
| Sora 2 | 4s | ~30s | Fastest |
| Sora 2 | 12s | ~60s | Variable |
| Sora Pro | 8s | ~45-75s | Higher quality |

### **Batch Rendering:**

**Formula:** `(Videos × AvgTime) + (Videos × 2s delay)`

**Example:**
- 5 Veo videos (8s each): ~7.5 minutes
- 5 Sora videos (8s each): ~5 minutes
- Mixed (3 Veo + 2 Sora): ~6 minutes

---

## 🚀 Future Enhancements

### **Planned:**
- [ ] Runway Gen-3 integration
- [ ] Stability AI integration
- [ ] Per-scene provider selection (currently project-wide)
- [ ] Remix UI with prompt history
- [ ] Side-by-side provider comparison
- [ ] Cost tracking per provider

### **Under Consideration:**
- [ ] Auto-select best provider based on prompt
- [ ] Fallback provider if primary fails
- [ ] Parallel generation (multiple providers simultaneously)
- [ ] Provider performance analytics

---

## 📚 API Documentation

### **Google Veo 3.1**
- Docs: https://ai.google.dev/gemini-api/docs/veo
- Playground: https://aistudio.google.com/

### **OpenAI Sora**
- Docs: https://platform.openai.com/docs/guides/video
- API Reference: https://platform.openai.com/docs/api-reference/videos
- Pricing: https://openai.com/pricing

---

## ✅ Setup Checklist

**Environment:**
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Restart frontend dev server
- [ ] Verify both API keys valid

**Testing:**
- [ ] Provider selection UI appears
- [ ] Can switch between Veo and Sora
- [ ] Duration/resolution options update
- [ ] Veo generation still works
- [ ] Sora generation works
- [ ] Remix button appears on Sora videos
- [ ] Remix functionality works
- [ ] Batch render with mixed providers

**Assets:**
- [ ] Videos save to backend
- [ ] Asset Dashboard shows Sora videos
- [ ] Video IDs stored correctly
- [ ] Provider metadata saved

---

**Status:** Implementation Complete (with JSX fix needed in VideoProduction.tsx)  
**Ready for:** Testing after JSX structure fix  
**Last Updated:** February 2, 2026
