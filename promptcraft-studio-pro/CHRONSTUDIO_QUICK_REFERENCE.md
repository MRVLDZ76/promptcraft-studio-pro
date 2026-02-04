# ChronStudio Quick Reference 🎬

## Access ChronStudio
1. Open http://localhost:5173
2. Click **"Video Stories"** in sidebar (under "Narrative Production")

## 5-Step Workflow

### 1️⃣ Template Selection
**What it does**: Choose your narrative type and production mode

**Options**:
- 📖 **Biblical Narrative** - Scripture-based stories with theological accuracy
- 🌍 **Historical Event** - Period-accurate historical recreations  
- ✨ **Custom Creative** - Fiction, sci-fi, marketing, etc.

**Production Modes**:
- 🎨 **Integrated Studio** - Generate videos directly in the app
- 📋 **External/Prompt Only** - Generate prompts for Google Studio Flow/Whisk

---

### 2️⃣ Source Input
**What it does**: Import or create your narrative content

**Biblical Mode** 📖:
1. Select translation (BSB, KJV, WEB, ESV, etc.)
2. Choose book (Genesis, Exodus, 1 Samuel, etc.)
3. Pick chapter number
4. Click **"Import Text"**
5. Add context notes (camera style, tone, etc.)
6. Click **"Analyze Source"**

**Historical Mode** 🌍:
1. Enter topic (e.g., "Battle of Waterloo")
2. Click **"Fetch Context"** (AI researches it)
3. Review generated content
4. Add style notes
5. Click **"Analyze Source"**

**Custom Mode** ✨:
1. Enter title and segment
2. Paste your script or outline
3. Add visual style notes
4. Click **"Analyze Source"**

**What happens**: Gemini AI extracts:
- ✅ Project summary (logline)
- ✅ Setting (year, region, landscape)
- ✅ Characters (with visual/voice descriptions)

---

### 3️⃣ Casting (Character Library)
**What it does**: Generate or refine character assets

**Integrated Mode** 🎨:
1. Review AI-extracted characters
2. Edit details (click pencil icon)
3. Hover over character card
4. Click **"Generate Asset"** - creates reference image
5. Save favorites to library (click bookmark icon)
6. Click **"Confirm Cast"**

**External Mode** 📋:
1. Review character descriptions
2. Click **"Copy Prompt"** on each card
3. Paste into Whisk or other image generators
4. Click **"Confirm Cast"**

**Library Features**:
- 📚 **Open Library** - Import saved characters from past projects
- 🔄 **Update Library** - Sync project changes to global library
- ↩️ **Revert** - Reset to library defaults

---

### 4️⃣ Storyboard
**What it does**: Break narrative into visual scenes

**Steps**:
1. Click **"Aesthetic"** button to choose style:
   - 🎬 Cinematic Drama (8K photorealism, ARRI Alexa)
   - 📹 Documentary (handheld, 16mm grain)
   - 🎨 Animated Stylized (Pixar quality)
   - 🌈 Retro Futurism (synthwave, neon)
   - 🎭 Gritty Realism (desaturated, high contrast)
   - 🧚 Fairytale (ethereal, soft focus)
   - 🎮 Low Poly 3D (PS1 aesthetic)
   - 📷 Vintage Kodachrome (1960s saturated)
   - 🌀 Surreal Dreamscape (magic realism)
   - ✏️ Pencil Sketch (charcoal, artistic)
   - 🌃 Neo Noir (wet streets, moody blues)

2. Click **"Generate Sequences"**
3. Review scenes:
   - 📝 Narrative text
   - 🎥 Visual prompt (for Veo)
   - 👤 Character assignments

4. **Drag to reorder** scenes
5. Click **"Enter Production"**

---

### 5️⃣ Production
**What it does**: Generate videos or export prompts

**Integrated Mode** 🎨:
1. Click **"Start Render"** on each scene
2. Wait 2-4 minutes per scene (Veo 3.1)
3. Watch status: `pending` → `generating` → `completed`
4. Preview videos in embedded player
5. Click **"Export Project"**:
   - 📦 **Production Package (ZIP)** - Source clips + FFmpeg script
   - 🎞️ **Rendered Sequence (MP4)** - Single stitched file
   - 📁 **Individual Clips (ZIP)** - Separate video files
6. Choose quality: High (1080p) / Medium (720p) / Low (480p)
7. Click **"Download Package"**
8. Click **"Finish Project"** when done

**External Mode** 📋:
1. Review each scene's prompt
2. Click **"Copy Full Context"** (includes narrative + visual prompt)
3. Paste into Google Studio Flow or other tools
4. Mark as copied (checkmark appears)
5. Ensure all scenes copied
6. Click **"Finish Project"**

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous step (Steps 2-5) |
| `→` | Next step (Steps 1-4) |
| `Esc` | Close modals |

---

## Tips & Tricks 💡

### For Better Results
1. **Context Notes Matter** - Describe camera style, color palette, mood
   - Example: "Warm golden hour lighting, handheld camera, intimate close-ups"

2. **Character Consistency** - Save characters to library and reuse across projects
   - Biblical characters (David, Moses, etc.) can be standardized

3. **Style Selection** - Match style to content:
   - Biblical → Cinematic Drama or Vintage Kodachrome
   - Historical → Documentary or Gritty Realism
   - Sci-Fi → Retro Futurism or Neo Noir

4. **Scene Length** - Keep scenes 5-8 seconds for best Veo results
   - Shorter scenes = better consistency
   - Longer scenes = more room for variation

5. **Character Prompts** - Be specific about era, clothing, age
   - Instead of: "Old man"
   - Better: "60-year-old shepherd, weathered face, simple wool robe, bronze age Israel"

### Troubleshooting

**❌ "API_KEY not found"**
- Create `.env` file in `promptcraft-studio-pro/`
- Add: `API_KEY=your_google_ai_studio_api_key`

**❌ Video generation fails**
- Veo 3.1 is experimental - rate limits may apply
- Wait 30 seconds between generations
- Check console (F12) for detailed errors

**❌ Bible API doesn't load**
- Check internet connection
- Try BSB translation (most reliable)
- Clear browser cache and reload

**❌ Character images fail**
- Simplify visual descriptions
- Remove special characters from names
- Wait 30 seconds and retry

---

## Example Workflow: David vs Goliath

### Step 1: Template
- Select **Biblical Narrative**
- Choose **Integrated Studio**

### Step 2: Source Input
- Translation: **BSB**
- Book: **1 Samuel**
- Chapter: **17**
- Click **Import Text**
- Context note: "Epic battle scene, warm desert lighting, handheld camera for intensity"
- Click **Analyze Source**

### Step 3: Casting
AI extracts:
- David (young shepherd, sling, determined expression)
- Goliath (giant Philistine warrior, bronze armor, spear)
- Saul (king of Israel, troubled face, royal robes)

Generate reference images for all three.

### Step 4: Storyboard
- Choose **Cinematic Drama** style
- Click **Generate Sequences**
- AI creates ~8-12 scenes:
  1. Goliath's challenge (8s)
  2. David volunteers (6s)
  3. David chooses stones (5s)
  4. Goliath mocks David (7s)
  5. David slings stone (5s)
  6. Goliath falls (6s)
  7. Victory celebration (8s)

### Step 5: Production
- Render all scenes (total: ~25 minutes)
- Export as **Production Package**
- Quality: **High (1080p)**
- Open in DaVinci Resolve or Premiere Pro
- Add music, color grading, transitions
- Export final video

---

## Export Formats Explained

### 📦 Production Package (ZIP)
**Contains**:
- `assets/scene_001.mp4`, `scene_002.mp4`, etc.
- `project_manifest.json` (metadata, prompts, narrative)
- `ffmpeg_concat_list.txt` (scene order)
- `render_sequence.sh` (auto-stitch script)

**Best for**: Professional editing, color grading, adding music

**How to use**:
```bash
# Extract ZIP
# Navigate to folder
# Run:
ffmpeg -f concat -safe 0 -i ffmpeg_concat_list.txt -c copy full_movie.mp4
```

### 🎞️ Rendered Sequence (MP4/WebM)
**Contains**: Single stitched video file

**Best for**: Quick preview, sharing on social media

**Quality**: Depends on browser codec support (MP4 preferred, WebM fallback)

### 📁 Individual Clips (ZIP)
**Contains**: Just the video files, no scripts

**Best for**: Selective scene usage, manual editing

---

## API Rate Limits (Approximate)

| Service | Limit | Cooldown |
|---------|-------|----------|
| Gemini 3 Flash | 60 requests/minute | 1s |
| Gemini 3 Pro | 15 requests/minute | 4s |
| Gemini Image | 10 requests/minute | 6s |
| Veo 3.1 | 5 videos/minute | 12s |

**Recommendation**: Generate scenes one at a time, don't batch-generate all at once.

---

## Project Storage

### Auto-Save
- ✅ Saves every change automatically
- ✅ Persists through browser refresh
- ✅ Storage key: `chronos_current_project`

### Character Library
- ✅ Global across all projects
- ✅ Storage key: `chronos_character_library`
- ✅ Can import/export manually via browser DevTools

### Manual Backup (Advanced)
```javascript
// Open browser console (F12)
// Export project:
copy(localStorage.getItem('chronos_current_project'))
// Paste into text file and save

// Import project:
localStorage.setItem('chronos_current_project', `PASTE_JSON_HERE`)
location.reload()
```

---

## Support & Resources

### Documentation
- 📄 [CHRONSTUDIO_INTEGRATION_COMPLETE.md](./CHRONSTUDIO_INTEGRATION_COMPLETE.md) - Full technical documentation
- 📄 [CHRONSTUDIO_ANALYSIS.md](./CHRONSTUDIO_ANALYSIS.md) - Original ChronStudio breakdown
- 📄 [INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md) - Integration strategy

### API Documentation
- [Google Generative AI](https://ai.google.dev/docs) - Gemini & Veo docs
- [HelloAO Bible API](https://bible.helloao.org/api) - Scripture API reference

### Troubleshooting
Check browser console (F12 → Console tab) for detailed error messages.

---

**Happy Storytelling!** 🎬✨
