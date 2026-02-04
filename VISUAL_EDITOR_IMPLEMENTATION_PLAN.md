# 📐 Visual Book Editor - Implementation Plan

## 🎯 Goal
Add a **Designrr-style visual editor** so users can see, customize, and perfect their books before publishing.

---

## 🏗️ Architecture

### Current Flow (Automated Only)
```
User Input → AI Generation → Download PDF/EPUB
                ❌ No preview
                ❌ No customization
                ❌ No image placement
```

### New Flow (Hybrid: AI + Manual Control)
```
User Input → AI Generation → Visual Editor → Download
                                    ↓
                        ✅ Live preview
                        ✅ Drag & drop images
                        ✅ Edit text inline
                        ✅ Change templates
                        ✅ Customize layout
```

---

## 📋 Components to Build

### 1. BookEditorWorkspace Component (NEW)
**File:** `promptcraft-studio-pro/PublishingStudio/components/BookEditorWorkspace.tsx`

**Features:**
- **3-Column Layout:**
  - Left: Chapter/Section Navigator
  - Center: Live Preview Canvas
  - Right: Properties Panel
  
- **Canvas Capabilities:**
  - Render book content as interactive HTML
  - Click-to-edit text blocks
  - Drag-to-reposition images
  - Add new elements (text, images, shapes)
  - Zoom in/out (50%-200%)
  - Page navigation

- **Template System:**
  - 20+ starter templates (Modern, Classic, Minimal, Bold, etc.)
  - Switch templates with one click
  - Preview before applying

**Mockup:**
```tsx
<BookEditorWorkspace
  bookId={bookId}
  chapters={chapters}
  onSave={handleSave}
  onPublish={handlePublish}
/>
```

---

### 2. TemplateLibrary Component (NEW)
**File:** `promptcraft-studio-pro/PublishingStudio/components/TemplateLibrary.tsx`

**Templates to Create:**
```
1. Modern Minimal (clean, sans-serif, lots of whitespace)
2. Classic Novel (serif font, justified text, elegant)
3. Bold & Dynamic (large headings, colorful accents)
4. Academic Paper (formal, structured, citations)
5. Children's Book (playful fonts, image-heavy)
6. Business Report (professional, charts, tables)
7. Recipe Book (grid layouts, ingredient boxes)
8. Travel Guide (image galleries, maps)
9. Tech Manual (code blocks, screenshots)
10. Poetry Collection (centered text, artistic)
```

**Template Structure:**
```typescript
interface BookTemplate {
  id: string;
  name: string;
  category: 'modern' | 'classic' | 'bold' | 'professional';
  thumbnail: string;
  config: {
    fonts: {
      heading: string;
      body: string;
      accent: string;
    };
    colors: {
      primary: string;
      secondary: string;
      text: string;
      background: string;
    };
    layout: {
      pageSize: 'A4' | 'Letter' | 'Kindle';
      margins: { top: number; right: number; bottom: number; left: number; };
      columns: 1 | 2;
      lineHeight: number;
    };
    elements: {
      showPageNumbers: boolean;
      showHeaders: boolean;
      showFooters: boolean;
      chapterStartsNewPage: boolean;
    };
  };
}
```

---

### 3. ImageManager Component (NEW)
**File:** `promptcraft-studio-pro/PublishingStudio/components/ImageManager.tsx`

**Features:**
- **Image Sources:**
  - Upload from device
  - Generate with DALL-E 3 (existing integration)
  - Search royalty-free (Unsplash API)
  - AI-generated placeholder images
  
- **Image Editor:**
  - Crop & resize
  - Filters (grayscale, sepia, brightness)
  - Border & shadow effects
  - Caption text

- **Media Library:**
  - Personal image collection
  - Organized by project
  - Quick search & filter
  - Drag-to-canvas

**API Integration:**
```typescript
// Unsplash Free API
const searchImages = async (query: string) => {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${query}&client_id=${UNSPLASH_KEY}`
  );
  return response.json();
};
```

---

### 4. LivePreviewCanvas Component (NEW)
**File:** `promptcraft-studio-pro/PublishingStudio/components/LivePreviewCanvas.tsx`

**Renders book content as editable HTML:**
```tsx
<LivePreviewCanvas
  template={selectedTemplate}
  chapters={chapters}
  onTextEdit={(chapterId, blockId, newText) => {
    // Update content
  }}
  onImageAdd={(chapterId, position, imageUrl) => {
    // Add image to content
  }}
  onLayoutChange={(chapterId, newLayout) => {
    // Rearrange blocks
  }}
/>
```

**Features:**
- Content-editable divs for text
- Draggable image containers
- Live CSS updates (fonts, colors)
- Page breaks visualization
- Export-ready HTML/CSS

---

### 5. DraftEditor Component (NEW)
**File:** `promptcraft-studio-pro/PublishingStudio/components/DraftEditor.tsx`

**Distraction-free writing mode:**
```
┌─────────────────────────────────────────────┐
│  Chapter 3: The Battle                      │
├─────────────────────────────────────────────┤
│                                              │
│  The hero stood at the edge of the cliff... │
│                                              │
│  [Clean, minimal interface]                 │
│  [No formatting distractions]               │
│  [Focus on writing]                         │
│                                              │
│  Word count: 1,247                          │
└─────────────────────────────────────────────┘
```

**Features:**
- Markdown support
- Auto-save (already implemented!)
- Word count & reading time
- Export to chapters
- Merge drafts

---

## 🔧 Backend Updates

### 1. New API Endpoints

```python
# backend/apps/publishing/views.py

@action(detail=True, methods=['post'])
def apply_template(self, request, pk=None):
    """Apply a template to existing book"""
    book = self.get_object()
    template_id = request.data.get('template_id')
    
    # Apply template configuration
    # Update chapter layouts
    # Re-generate images with new style
    
    return Response({'status': 'applied'})

@action(detail=True, methods=['post'])
def update_chapter_layout(self, request, pk=None):
    """Update visual layout of chapter"""
    chapter = get_object_or_404(Chapter, pk=pk)
    
    layout_data = request.data.get('layout')
    # Save layout configuration
    
    return Response({'status': 'updated'})

@action(detail=True, methods=['post'])
def insert_image(self, request, pk=None):
    """Insert image into specific position"""
    block = get_object_or_404(ContentBlock, pk=pk)
    
    image_url = request.data.get('image_url')
    position = request.data.get('position')
    
    # Insert image at position
    
    return Response({'status': 'inserted'})
```

### 2. New Database Fields

```python
# backend/apps/publishing/models.py

class BookProject(models.Model):
    # ... existing fields ...
    
    # New template fields
    template_id = models.CharField(max_length=50, default='modern-minimal')
    custom_css = models.TextField(blank=True)  # User overrides
    
    # Layout preferences
    layout_config = models.JSONField(default=dict, blank=True)

class Chapter(models.Model):
    # ... existing fields ...
    
    # Visual layout
    layout_data = models.JSONField(default=dict, blank=True)
    custom_images = models.JSONField(default=list, blank=True)

class MediaAsset(models.Model):
    """User's personal media library"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(BookProject, on_delete=models.CASCADE, null=True)
    
    file = models.ImageField(upload_to='media_library/')
    thumbnail = models.ImageField(upload_to='media_library/thumbs/')
    
    title = models.CharField(max_length=200)
    alt_text = models.CharField(max_length=500, blank=True)
    source = models.CharField(max_length=20)  # 'upload', 'generated', 'unsplash'
    
    width = models.IntegerField()
    height = models.IntegerField()
    file_size = models.IntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 🎨 UI/UX Flow

### User Journey

**Scenario 1: AI-First, Manual Polish**
```
1. User creates book with AI (existing flow)
   → BookProject created, chapters generated
   
2. User clicks "Open Editor" button
   → Launches BookEditorWorkspace
   
3. User sees generated content in live preview
   → Can immediately see the book
   
4. User customizes:
   → Changes template from "Modern" to "Classic"
   → Uploads personal photo for Chapter 2
   → Adjusts heading colors
   → Edits a paragraph that AI got wrong
   
5. User clicks "Publish"
   → Exports PDF with all customizations
```

**Scenario 2: Manual-First, AI Assist**
```
1. User clicks "Start from Scratch"
   → Opens DraftEditor
   
2. User writes Chapter 1 manually
   → Auto-saves every second (already works!)
   
3. User clicks "AI Enhance"
   → AI improves grammar, adds descriptions
   
4. User opens Visual Editor
   → Selects template
   → Generates cover image
   → Adds illustrations between paragraphs
   
5. User publishes
```

---

## 📅 Implementation Timeline

### Phase 1: Core Editor (2 weeks)
- [ ] BookEditorWorkspace shell (3-column layout)
- [ ] LivePreviewCanvas (basic HTML rendering)
- [ ] Click-to-edit text blocks
- [ ] Save layout changes to backend
- [ ] Integration with existing BookProject

### Phase 2: Templates (1 week)
- [ ] TemplateLibrary component
- [ ] 5 starter templates (Modern, Classic, Bold, Minimal, Professional)
- [ ] Template switcher
- [ ] Apply template to existing book
- [ ] Save template preferences

### Phase 3: Image Management (1 week)
- [ ] ImageManager component
- [ ] Upload images to backend
- [ ] MediaAsset model & API
- [ ] Unsplash API integration
- [ ] Drag-and-drop images to canvas
- [ ] Basic image editor (crop, resize)

### Phase 4: Draft Editor (3 days)
- [ ] DraftEditor component
- [ ] Markdown support
- [ ] Merge drafts feature
- [ ] Export to chapters

### Phase 5: Advanced Features (1 week)
- [ ] Custom CSS editor
- [ ] Font picker (Google Fonts)
- [ ] Color palette customizer
- [ ] Page break controls
- [ ] Table of contents auto-generation
- [ ] Header/footer editor

### Phase 6: Polish & Testing (3 days)
- [ ] Responsive design
- [ ] Keyboard shortcuts
- [ ] Undo/redo system
- [ ] Export quality testing
- [ ] User testing & feedback

**Total: 5-6 weeks**

---

## 🚀 Quick Wins (MVP)

If you want to ship fast, start with:

### Week 1 MVP:
1. **Simple Visual Preview** (read-only)
   - Show generated book content in styled HTML
   - Template switcher (3 templates)
   - No editing, just viewing

2. **Image Upload**
   - Add custom images to chapters
   - Basic positioning (top, middle, bottom)

3. **Text Editing**
   - Edit chapter title
   - Edit chapter content (textarea)

This gets you 60% of Designrr's value in 1 week.

---

## 💡 Key Differentiators (Beat Designrr)

**What makes YOUR editor better:**

1. **AI-Native:**
   - Designrr: Manual writing, AI is optional
   - You: AI generates everything, manual editing is optional
   
2. **Context-Aware:**
   - Your AI knows the book's theme, characters, plot
   - Can regenerate sections while maintaining consistency
   
3. **Video Integration:**
   - Import transcript → Auto-format book
   - Designrr doesn't have this
   
4. **Debate Analysis:**
   - Turn debates into persuasive books
   - Unique to your platform

5. **Audio-First:**
   - Your audiobook generation is built-in
   - Designrr doesn't do audio

---

## 📚 Resources

### Libraries to Use

**Rich Text Editor:**
```bash
npm install slate slate-react  # Modular, customizable
# OR
npm install @tiptap/react @tiptap/starter-kit  # Easier, opinionated
```

**Drag & Drop:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable  # Modern, accessible
```

**PDF Export (client-side):**
```bash
npm install html2canvas jspdf  # Convert HTML preview to PDF
```

**Unsplash API:**
```bash
npm install unsplash-js
```

---

## 🎯 Success Metrics

**How to measure if this works:**

1. **Adoption Rate:**
   - % of users who open the editor
   - Target: 70%+ (people want to customize)

2. **Engagement:**
   - Average time in editor: 15+ minutes
   - Number of edits per book: 10+ changes
   
3. **Satisfaction:**
   - Survey: "How satisfied are you with the visual editor?"
   - Target: 4.5/5 stars

4. **Retention:**
   - Users with editor access return 2x more often
   - Create 3x more books per month

---

## 🔐 Pricing Strategy

**Designrr charges $27 lifetime.**

**Your advantage:** You have AI generation + video integration.

**Suggested tiers:**

| Feature | Free | Pro ($19/mo) | Enterprise ($49/mo) |
|---------|------|--------------|---------------------|
| AI Book Generation | 1/month | Unlimited | Unlimited |
| Visual Editor | ❌ | ✅ | ✅ |
| Templates | 3 basic | 20+ premium | 100+ + custom |
| Image Library | ❌ | ✅ (1000 images) | ✅ (unlimited) |
| Custom Branding | ❌ | ✅ | ✅ |
| Commercial License | ❌ | ❌ | ✅ |

Make the editor a **Pro-tier feature** to drive upgrades.

---

## 🎬 Next Steps

1. **Prototype Live Preview:**
   - Build simple HTML renderer for Chapter 1
   - Show user their AI-generated content styled
   - Get feedback: "Is this useful?"

2. **Template Gallery:**
   - Design 3 templates in Figma
   - Convert to CSS + HTML structure
   - Add template switcher button

3. **User Testing:**
   - Give 10 beta users access
   - Watch them use it (screen recording)
   - Iterate based on confusion points

4. **Iterate & Ship:**
   - Start with MVP (preview + image upload)
   - Add features weekly
   - Collect metrics

---

**The visual editor will be your competitive moat.** Designrr can't match your AI quality, and you'll soon offer a better editing experience. 🚀
