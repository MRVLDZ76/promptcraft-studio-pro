# Week 3 Quick Reference

## 🎯 What's New

### 1. Drag & Drop Reordering
**How to use:**
- Switch to edit mode
- Hover over any block
- Drag handle (⋮⋮⋮) appears on left
- Click and drag to new position
- Release to drop

**Technical:**
- Component: `DraggableBlock.tsx`
- Library: @dnd-kit (core, sortable, utilities)
- API: `PATCH /api/v1/publishing/blocks/bulk_update/`

### 2. AI Image Generation
**How to use:**
- Click "✨ Generate with AI" (right sidebar)
- Enter image description
- Select style (7 options)
- Select aspect ratio (4 options)
- Click "Generate"
- Wait 5-10 seconds
- Image auto-inserts

**Technical:**
- Component: `AIImageGeneratorModal.tsx`
- API: `POST /api/v1/publishing/generate-image/`
- Styles: Realistic, Artistic, Anime, Oil Painting, Watercolor, Sketch, 3D
- Ratios: 16:9, 1:1, 4:3, 9:16

### 3. Advanced Formatting
**How to use:**
- Click "Show Formatting Toolbar"
- Select text in chapter
- Advanced toolbar appears below basic toolbar
- Choose heading level, font size, colors

**Technical:**
- Component: `AdvancedFormatToolbar.tsx`
- Commands: formatBlock, fontSize, foreColor, hiliteColor, removeFormat
- Colors: 10 preset colors + custom

---

## 📦 New Files Created

1. **PublishingStudio/components/DraggableBlock.tsx** (52 lines)
   - Drag-and-drop wrapper
   - useSortable hook integration
   - Hover-to-show drag handle

2. **PublishingStudio/components/AIImageGeneratorModal.tsx** (170 lines)
   - Full-screen modal
   - Style and ratio selectors
   - Loading state with progress

3. **PublishingStudio/components/AdvancedFormatToolbar.tsx** (140 lines)
   - Heading selector (H1-H4, P)
   - Font size selector
   - Text and highlight color pickers

4. **PublishingStudio/WEEK3_IMPLEMENTATION.md** (420 lines)
   - Complete documentation
   - Architecture details
   - Testing checklist

---

## 🔧 Modified Files

**PublishingStudio/components/BookEditorWorkspace.tsx**
- Added imports: DraggableBlock, AIImageGeneratorModal, AdvancedFormatToolbar
- Added imports: @dnd-kit (DndContext, SortableContext, sensors)
- Added state: showAIGenerator, showAdvancedToolbar, sensors
- Added handler: handleDragEnd (block reordering)
- Added handler: handleGeneratedImage (AI image insertion)
- Updated render: Wrapped blocks in DraggableBlock + DndContext
- Updated render: Added advanced toolbar conditionally
- Updated render: Added AI generator modal
- Lines: 587 → 777 (+190 lines)

---

## 📊 Dependencies

**Added to package.json:**
```json
"@dnd-kit/core": "^6.1.0",
"@dnd-kit/sortable": "^8.0.0",
"@dnd-kit/utilities": "^3.2.2"
```

**Install command:**
```bash
cd promptcraft-studio-pro
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## ⚠️ Backend TODO

**New endpoint needed:**
```python
# backend/apps/publishing/views.py
# Add to ContentBlockViewSet

@action(detail=False, methods=['patch'], url_path='bulk_update')
def bulk_update_blocks(self, request):
    """Bulk update block sequence_order for drag-and-drop"""
    updates = request.data.get('updates', [])
    for update in updates:
        ContentBlock.objects.filter(id=update['id']).update(
            sequence_order=update['sequence_order']
        )
    return Response({'status': 'success'})
```

**Request body:**
```json
{
  "updates": [
    {"id": 1, "sequence_order": 0},
    {"id": 2, "sequence_order": 1},
    {"id": 3, "sequence_order": 2}
  ]
}
```

---

## 🧪 Quick Test

1. **Test drag & drop:**
   - Create book with multiple paragraphs
   - Switch to edit mode
   - Hover over paragraph → see drag handle
   - Drag to reorder
   - Check console for API call

2. **Test AI generation:**
   - Click "✨ Generate with AI"
   - Enter: "A majestic mountain at sunset"
   - Select style: "Oil Painting"
   - Click "Generate"
   - Wait for image to appear

3. **Test formatting:**
   - Click "Show Formatting Toolbar"
   - Select text
   - Change heading to "Heading 2"
   - Select red color
   - Verify formatting applied

---

## 📈 Progress

**Week 1**: 40% parity (MVP foundation)
**Week 2**: 70% parity (templates, inline editing)
**Week 3**: **85% parity** (drag & drop, AI images, advanced formatting)

**Next**: Week 4 - Layout controls, template customization, export (PDF/EPUB/HTML)

---

**Last Updated**: February 4, 2026
