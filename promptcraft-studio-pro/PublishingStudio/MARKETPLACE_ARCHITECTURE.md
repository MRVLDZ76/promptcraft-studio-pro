# Marketplace Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PUBLISHING STUDIO WORKFLOW                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: USER CREATES BOOK                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  CreateBookWizard (Frontend)                           │        │
│  │  ─────────────────────────────                         │        │
│  │  Step 4: Output Formats                                │        │
│  │                                                         │        │
│  │  ☑ PDF - Print-ready                                   │        │
│  │                                                         │        │
│  │  ┌──────────────────────────────────────────────────┐  │        │
│  │  │ 📚 Print-Ready PDF Specifications               │  │        │
│  │  │                                                  │  │        │
│  │  │ Marketplace:  [Amazon KDP          ▼]          │  │        │
│  │  │ Book Size:    [6" × 9" (Fiction)   ▼]          │  │        │
│  │  │                                                  │  │        │
│  │  │ Paper Type:   [White Paper         ▼]          │  │        │
│  │  │ ☑ Color Interior (+$$$)                        │  │        │
│  │  │ ☑ Include Bleed (0.125")                       │  │        │
│  │  │                                                  │  │        │
│  │  │ 📦 Amazon KDP specs will be applied.           │  │        │
│  │  └──────────────────────────────────────────────────┘  │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            │ formData                               │
│                            ▼                                        │
│  {                                                                  │
│    marketplace: "amazon_kdp",                                       │
│    trim_size: "kdp_6x9",                                           │
│    paper_type: "kdp_white",                                        │
│    include_bleed: true,                                            │
│    color_interior: false                                           │
│  }                                                                  │
│                            │                                        │
│                            │ POST /api/v1/publishing/books/         │
│                            ▼                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: BACKEND CREATES BOOKPROJECT                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  BookProject (Model)                                   │        │
│  │  ─────────────────────                                 │        │
│  │  ✓ title: "My Novel"                                   │        │
│  │  ✓ author_name: "Jane Doe"                             │        │
│  │  ✓ marketplace: "amazon_kdp"              ◄─── NEW     │        │
│  │  ✓ trim_size: "kdp_6x9"                   ◄─── NEW     │        │
│  │  ✓ paper_type: "kdp_white"                ◄─── NEW     │        │
│  │  ✓ include_bleed: true                    ◄─── NEW     │        │
│  │  ✓ color_interior: false                  ◄─── NEW     │        │
│  │  ✓ spine_width: 0.0 (calculated later)    ◄─── NEW     │        │
│  │  ✓ status: "DRAFT"                                     │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            │ Celery Task triggers                   │
│                            ▼                                        │
│  (Book content generation happens... 1-5 minutes)                   │
│                            │                                        │
│                            ▼                                        │
│  status → "COMPLETED"                                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: USER REQUESTS PDF EXPORT                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  BookEditor (Frontend)                                 │        │
│  │                                                         │        │
│  │  [Export ▼]  button clicked                            │        │
│  │       │                                                 │        │
│  │       └─> Select "PDF Document"                        │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            │ POST /api/v1/publishing/books/{id}/    │
│                            │      export/                           │
│                            ▼                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: BACKEND GENERATES PDF WITH MARKETPLACE SPECS               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  PDFExportService.generate_pdf(book_id)                │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  1. Load book & chapters from database                 │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  2. Calculate Spine Width                              │        │
│  │     ────────────────────────                            │        │
│  │     from marketplace_config import calculate_spine_width│        │
│  │                                                         │        │
│  │     spine = calculate_spine_width(                      │        │
│  │       page_count=200,                                   │        │
│  │       paper_type="kdp_white"                            │        │
│  │     )                                                   │        │
│  │     → spine_width = 0.46 inches                         │        │
│  │                                                         │        │
│  │     book.spine_width = 0.46                             │        │
│  │     book.save()                                         │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  3. Get Marketplace Specifications                      │        │
│  │     ────────────────────────────                        │        │
│  │     TRIM_SIZES["kdp_6x9"] = {                          │        │
│  │       width_inches: 6.0,                                │        │
│  │       height_inches: 9.0,                               │        │
│  │       width_points: 432,                                │        │
│  │       height_points: 648                                │        │
│  │     }                                                   │        │
│  │                                                         │        │
│  │     MARGIN_SPECS["kdp_recommended"] = {                │        │
│  │       inside_inches: 0.625,  (gutter)                  │        │
│  │       outside_inches: 0.5,                             │        │
│  │       top_inches: 0.5,                                 │        │
│  │       bottom_inches: 0.5                               │        │
│  │     }                                                   │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  4. Generate Dynamic CSS                                │        │
│  │     ─────────────────────                               │        │
│  │     @page {                                             │        │
│  │       size: 6in 9in;  ◄── From trim_size               │        │
│  │       margin-top: 0.5in;                                │        │
│  │       margin-bottom: 0.5in;                             │        │
│  │       margin-inside: 0.625in;  ◄── Gutter              │        │
│  │       margin-outside: 0.5in;                            │        │
│  │       bleed: 0.125in;  ◄── If enabled                  │        │
│  │       marks: crop;                                      │        │
│  │     }                                                   │        │
│  │                                                         │        │
│  │     @page :left {                                       │        │
│  │       margin-left: 0.5in;   (outside)                  │        │
│  │       margin-right: 0.625in; (inside)                  │        │
│  │     }                                                   │        │
│  │                                                         │        │
│  │     @page :right {                                      │        │
│  │       margin-left: 0.625in;  (inside)                  │        │
│  │       margin-right: 0.5in;   (outside)                 │        │
│  │     }                                                   │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  5. Render HTML Content                                 │        │
│  │     ────────────────────                                │        │
│  │     <div class="cover-page">                            │        │
│  │       <h1>My Novel</h1>                                 │        │
│  │       <p>by Jane Doe</p>                                │        │
│  │     </div>                                              │        │
│  │                                                         │        │
│  │     <div class="toc-page">                              │        │
│  │       <h2>Table of Contents</h2>                        │        │
│  │       <ul>...</ul>                                      │        │
│  │     </div>                                              │        │
│  │                                                         │        │
│  │     <div class="chapter" id="chapter-1">                │        │
│  │       <h2>Chapter 1: The Beginning</h2>                 │        │
│  │       <div class="text-block">...</div>                 │        │
│  │     </div>                                              │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  6. WeasyPrint: HTML + CSS → PDF                        │        │
│  │     ──────────────────────────────                      │        │
│  │     from weasyprint import HTML, CSS                    │        │
│  │                                                         │        │
│  │     html = HTML(string=html_content)                    │        │
│  │     css = CSS(string=css_content)                       │        │
│  │                                                         │        │
│  │     html.write_pdf(                                     │        │
│  │       target="book_42/My_Novel.pdf",                    │        │
│  │       stylesheets=[css]                                 │        │
│  │     )                                                   │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  7. Validate Against Marketplace Requirements           │        │
│  │     ──────────────────────────────────────              │        │
│  │     errors = validate_book_specs(                       │        │
│  │       page_count=200,                                   │        │
│  │       trim_size="kdp_6x9",                              │        │
│  │       marketplace="amazon_kdp"                          │        │
│  │     )                                                   │        │
│  │                                                         │        │
│  │     ✓ Page count >= 24  (OK)                            │        │
│  │     ✓ Page count <= 828 (OK)                            │        │
│  │     ✓ Trim size valid   (OK)                            │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  8. Return Export Response                              │        │
│  │     ───────────────────────                             │        │
│  │     {                                                   │        │
│  │       "file_path": "/media/exports/book_42/...",        │        │
│  │       "file_size": 2457600,                             │        │
│  │       "page_count": 200,                                │        │
│  │       "marketplace_specs": {                            │        │
│  │         "marketplace": "amazon_kdp",                    │        │
│  │         "trim_size": "6\" × 9\"",                       │        │
│  │         "bleed": "0.125\"",                             │        │
│  │         "spine_width": "0.4600\"",                      │        │
│  │         "validation_warnings": []                       │        │
│  │       }                                                 │        │
│  │     }                                                   │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            │ Response                               │
│                            ▼                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: USER DOWNLOADS PDF                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  ExportModal shows:                                     │        │
│  │                                                         │        │
│  │  ✓ Export Complete!                                     │        │
│  │                                                         │        │
│  │  Marketplace: Amazon KDP                                │        │
│  │  Trim Size: 6" × 9"                                     │        │
│  │  Spine Width: 0.46"                                     │        │
│  │  Page Count: 200                                        │        │
│  │                                                         │        │
│  │  [Download PDF] ◄── User clicks                         │        │
│  └────────────────────────────────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ✓ Print-ready PDF downloaded                                       │
│  ✓ Ready to upload to Amazon KDP                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPONENT INTERACTION                        │
└─────────────────────────────────────────────────────────────────────┘

Frontend                  API                    Backend
───────────            ─────────              ──────────────

CreateBookWizard  ───────────────────>  BookProjectSerializer
  formData:                                    │
  - marketplace                                │
  - trim_size                                  ▼
  - paper_type                          BookProject.objects.create()
  - include_bleed                              │
  - color_interior                             ▼
                                        BookProject (Model)
                                               │
                                               ▼
                                        (Content generation...)
                                               │
BookEditor/BookList                            ▼
  [Export PDF]      ───────────────────>  export_book_view()
                                               │
                                               ▼
                                        PDFExportService
                                               │
                                               ├─> marketplace_config.py
                                               │     - TRIM_SIZES
                                               │     - MARGIN_SPECS
                                               │     - calculate_spine_width()
                                               │     - validate_book_specs()
                                               │
                                               ├─> _render_html()
                                               ├─> _get_pdf_css()
                                               ├─> WeasyPrint
                                               │
                                               ▼
  ExportModal       <───────────────────  Export Response
  - file_path                                 - marketplace_specs
  - marketplace_specs                         - validation_warnings
  [Download]
```

## Marketplace Configuration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    marketplace_config.py                             │
└─────────────────────────────────────────────────────────────────────┘

TRIM_SIZES = {
  'kdp_6x9': {
    name: "6\" × 9\" (Standard Fiction)",
    width_inches: 6.0,
    height_inches: 9.0,
    width_points: 432,  ◄── Used in CSS
    height_points: 648,
    marketplace: "Amazon KDP",
    best_for: "Novels, memoirs",
    popular: True
  },
  ...
}
           │
           ▼
calculate_spine_width(page_count, paper_type)
           │
           ├─> Get pages_per_inch from PAPER_TYPES
           ├─> spine_width = (page_count / ppi) + 0.01
           ├─> Check minimum width (0.0625")
           └─> Return { spine_width_inches, warnings }
           │
           ▼
calculate_cover_dimensions(trim_size, page_count, paper_type, bleed)
           │
           ├─> Get trim dimensions
           ├─> Calculate spine_width
           ├─> cover_width = (trim_width × 2) + spine + (bleed × 2)
           ├─> cover_height = trim_height + (bleed × 2)
           ├─> Calculate spine position (x coordinates)
           ├─> Define safe zones (0.125" from edges)
           ├─> ISBN barcode position (bottom right, back)
           └─> Return full cover template specs
           │
           ▼
validate_book_specs(page_count, trim_size, marketplace)
           │
           ├─> Check page_count vs marketplace min/max
           ├─> Check if trim_size is recommended
           ├─> Check page_count is even
           └─> Return list of errors/warnings
```

## CSS Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  _get_pdf_css() Method                               │
└─────────────────────────────────────────────────────────────────────┘

Input:
  - book: BookProject instance
  - trim_specs: TRIM_SIZES['kdp_6x9']
  - margin_specs: MARGIN_SPECS['kdp_recommended']
  - use_marketplace_specs: True
           │
           ▼
Extract dimensions:
  - page_width = "6in"   (from trim_specs)
  - page_height = "9in"
  - margin_inside = "0.625in"  (gutter)
  - margin_outside = "0.5in"
  - bleed = "0.125in" (if book.include_bleed)
           │
           ▼
Generate CSS string:

@page {
  size: 6in 9in;                ◄── Print dimensions
  margin-top: 0.5in;
  margin-bottom: 0.5in;
  margin-left: 0.625in;         ◄── Gutter (inside)
  margin-right: 0.5in;          ◄── Outside
  bleed: 0.125in;               ◄── Extends beyond trim
  marks: crop;                  ◄── Trim guides
}

@page :left {
  margin-left: 0.5in;           ◄── Flip for left pages
  margin-right: 0.625in;
}

@page :right {
  margin-left: 0.625in;
  margin-right: 0.5in;
}
           │
           ▼
Return CSS string to WeasyPrint
```

## File Structure

```
backend/
├── apps/
│   └── publishing/
│       ├── models.py                          ◄── BookProject with marketplace fields
│       ├── serializers.py                     ◄── Expose marketplace fields via API
│       ├── views.py                           ◄── Export endpoints
│       ├── marketplace_config.py              ◄── NEW: Specifications (560 lines)
│       ├── services/
│       │   └── pdf_export.py                  ◄── Enhanced PDF generation
│       └── migrations/
│           └── 0002_add_marketplace_specs.py  ◄── NEW: Database migration

frontend/
└── promptcraft-studio-pro/
    └── PublishingStudio/
        ├── components/
        │   ├── CreateBookWizard.tsx           ◄── Marketplace selector UI
        │   ├── BookEditor.tsx
        │   ├── ExportModal.tsx
        │   └── ...
        ├── AMAZON_KDP_GUIDE.md                ◄── NEW: User documentation
        ├── MARKETPLACE_API.md                 ◄── NEW: Developer docs
        ├── MARKETPLACE_QUICK_REFERENCE.md     ◄── NEW: Quick reference
        └── MARKETPLACE_IMPLEMENTATION_SUMMARY.md ◄── NEW: This file
```

---

**Architecture Complete! 🏗️**  
All components integrated and documented.
