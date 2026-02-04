# Marketplace API Reference

## Quick Integration Guide for Developers

### New BookProject Fields

```python
# In apps/publishing/models.py
class BookProject(models.Model):
    # ... existing fields ...
    
    # Marketplace & Print Specifications (NEW)
    marketplace = models.CharField(max_length=50, default='universal')
    trim_size = models.CharField(max_length=50, default='kdp_6x9')
    paper_type = models.CharField(max_length=50, default='kdp_white')
    include_bleed = models.BooleanField(default=True)
    color_interior = models.BooleanField(default=False)
    spine_width = models.FloatField(default=0.0)  # Auto-calculated
    cover_template_url = models.URLField(blank=True)  # Auto-generated
```

### API Request Example

```typescript
// Create book with marketplace specs
const bookData = {
  title: "My Novel",
  author_name: "Jane Doe",
  project_type: "NOVEL",
  
  // Marketplace specifications (NEW)
  marketplace: "amazon_kdp",
  trim_size: "kdp_6x9",
  paper_type: "kdp_white",
  include_bleed: true,
  color_interior: false,
  
  // Output formats
  generate_pdf: true,
  generate_epub: true,
  
  // Content
  user_prompt: "A mystery novel set in Victorian London..."
};

const response = await fetch('/api/v1/publishing/books/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(bookData)
});
```

### API Response

```json
{
  "id": 42,
  "title": "My Novel",
  "marketplace": "amazon_kdp",
  "trim_size": "kdp_6x9",
  "paper_type": "kdp_white",
  "include_bleed": true,
  "color_interior": false,
  "spine_width": 0.46,
  "estimated_pages": 200,
  "pdf_url": "/media/exports/book_42/My_Novel.pdf",
  "status": "COMPLETED"
}
```

### Export Endpoint

```bash
# Generate PDF with marketplace specs
POST /api/v1/publishing/books/{id}/export/

{
  "format": "pdf",
  "include_cover": true,
  "include_toc": true
}

# Response includes marketplace compliance info
{
  "file_path": "/media/exports/book_42/My_Novel.pdf",
  "file_size": 2457600,
  "page_count": 200,
  "marketplace_specs": {
    "marketplace": "amazon_kdp",
    "trim_size": "6\" × 9\"",
    "trim_dimensions": "6.0\" × 9.0\"",
    "bleed": "0.125\"",
    "spine_width": "0.4600\"",
    "paper_type": "kdp_white",
    "color_interior": false,
    "validation_warnings": []
  }
}
```

### Cover Template Endpoint (NEW)

```bash
# Generate cover template with spine calculation
GET /api/v1/publishing/books/{id}/cover-template/

# Response
{
  "book_id": 42,
  "dimensions": {
    "total_width_inches": 12.71,
    "total_height_inches": 9.25,
    "total_width_pixels_300dpi": 3813,
    "total_height_pixels_300dpi": 2775
  },
  "spine": {
    "width_inches": 0.46,
    "start_position_inches": 6.125,
    "end_position_inches": 6.585
  },
  "isbn_barcode": {
    "x_inches": 10.585,
    "y_inches": 0.425,
    "width_inches": 1.5,
    "height_inches": 1.0,
    "note": "Bottom right of back cover"
  },
  "warnings": []
}
```

### Available Marketplaces

```python
MARKETPLACES = [
    'amazon_kdp',      # Amazon KDP
    'ingram_spark',    # IngramSpark
    'barnes_noble',    # Barnes & Noble Press
    'lulu',            # Lulu
    'universal'        # Compatible with all
]
```

### Available Trim Sizes

```python
TRIM_SIZES = [
    'kdp_6x9',         # 6" × 9" (Standard Fiction)
    'kdp_5x8',         # 5" × 8" (Compact)
    'kdp_5.5x8.5',     # 5.5" × 8.5" (Digest)
    'kdp_5.25x8',      # 5.25" × 8" (Mass Market)
    'kdp_7x10',        # 7" × 10" (Large Format)
    'kdp_8x10',        # 8" × 10" (Premium)
    'kdp_8.5x11',      # 8.5" × 11" (Letter)
    'ingram_8.5x8.5',  # 8.5" × 8.5" (Square)
]
```

### Available Paper Types

```python
PAPER_TYPES = [
    'kdp_white',       # White Paper (Standard)
    'kdp_cream',       # Cream Paper (Classic)
    'ingram_50lb',     # 50lb White (IngramSpark)
    'ingram_70lb',     # 70lb Premium (IngramSpark)
]
```

### Python Helper Functions

```python
from apps.publishing.marketplace_config import (
    calculate_spine_width,
    calculate_cover_dimensions,
    validate_book_specs,
    get_recommended_settings
)

# Calculate spine width
spine = calculate_spine_width(page_count=200, paper_type='kdp_white')
# Returns: {'spine_width_inches': 0.46, 'warnings': []}

# Calculate cover dimensions
cover = calculate_cover_dimensions(
    trim_size_key='kdp_6x9',
    page_count=200,
    paper_type='kdp_white',
    include_bleed=True
)
# Returns full cover specs with spine position, safe zones, etc.

# Validate specs
errors = validate_book_specs(
    page_count=200,
    trim_size='kdp_6x9',
    marketplace='amazon_kdp'
)
# Returns: [] if valid, list of errors if invalid

# Get recommendations
settings = get_recommended_settings(
    marketplace='amazon_kdp',
    genre='novel'
)
# Returns: recommended trim size, paper type, notes
```

### TypeScript Types

```typescript
interface MarketplaceSpecs {
  marketplace: 'amazon_kdp' | 'ingram_spark' | 'barnes_noble' | 'lulu' | 'universal';
  trim_size: 'kdp_6x9' | 'kdp_5x8' | 'kdp_5.5x8.5' | 'kdp_5.25x8' | 'kdp_7x10' | 'kdp_8x10' | 'kdp_8.5x11' | 'ingram_8.5x8.5';
  paper_type: 'kdp_white' | 'kdp_cream' | 'ingram_50lb' | 'ingram_70lb';
  include_bleed: boolean;
  color_interior: boolean;
  spine_width?: number;  // Read-only, auto-calculated
  cover_template_url?: string;  // Read-only, auto-generated
}

interface BookProject {
  // ... existing fields ...
  marketplace: string;
  trim_size: string;
  paper_type: string;
  include_bleed: boolean;
  color_interior: boolean;
  spine_width: number;
  cover_template_url: string;
}
```

### Migration Command

```bash
# Run this to add new fields to database
python manage.py makemigrations publishing
python manage.py migrate publishing
```

### Testing

```python
# Test spine calculation
from apps.publishing.marketplace_config import calculate_spine_width

spine = calculate_spine_width(page_count=100, paper_type='kdp_white')
assert spine['spine_width_inches'] > 0.2
assert len(spine['warnings']) == 0

# Test cover dimensions
from apps.publishing.marketplace_config import calculate_cover_dimensions

cover = calculate_cover_dimensions('kdp_6x9', page_count=200, include_bleed=True)
assert cover['cover_width_inches'] == 12.71  # (6 * 2) + spine + (0.125 * 2)
assert cover['spine']['width_inches'] > 0.4

# Test validation
from apps.publishing.marketplace_config import validate_book_specs

errors = validate_book_specs(page_count=10, trim_size='kdp_6x9', marketplace='amazon_kdp')
assert 'minimum 24 pages' in str(errors)
```

### Frontend Integration

```typescript
// In CreateBookWizard.tsx, formData already includes:
const [formData, setFormData] = useState({
  // ... existing fields ...
  marketplace: 'amazon_kdp',
  trim_size: 'kdp_6x9',
  paper_type: 'kdp_white',
  include_bleed: true,
  color_interior: false,
});

// Automatically updates when user changes marketplace selector
<select
  value={formData.marketplace}
  onChange={(e) => updateFormData('marketplace', e.target.value)}
>
  <option value="amazon_kdp">Amazon KDP</option>
  <option value="ingram_spark">IngramSpark</option>
  {/* ... */}
</select>
```

### Complete Workflow

```
1. User selects marketplace (e.g., "Amazon KDP")
2. User chooses trim size (e.g., "6 × 9")
3. User selects paper type (e.g., "White")
4. User enables color interior (if needed)
5. System auto-enables bleed for color
6. User creates book → Backend generates content
7. On export:
   - Calculate spine width based on page count
   - Apply marketplace-specific margins
   - Generate PDF with correct dimensions
   - Add bleed if enabled
   - Return marketplace compliance info
8. User downloads print-ready PDF
9. User uploads to Amazon KDP (or other platform)
```

### Key Files Modified

```
backend/
  apps/publishing/
    models.py                    # Added marketplace fields
    serializers.py               # Added fields to serializer
    marketplace_config.py        # NEW: Marketplace specifications
    services/pdf_export.py       # Enhanced PDF generation
    migrations/
      0002_add_marketplace_specs.py  # NEW: Migration

frontend/
  PublishingStudio/
    components/
      CreateBookWizard.tsx       # Added marketplace selector UI
    AMAZON_KDP_GUIDE.md          # NEW: User documentation
```

### Read-Only Fields

These fields are **auto-calculated** and should NOT be updated by frontend:
- `spine_width` - Calculated during PDF export
- `cover_template_url` - Generated on demand
- `estimated_pages` - Based on word count
- `random_seed` - Auto-generated on creation

### Validation Rules

```python
# Page count validation
if page_count < 24:
    raise ValidationError("KDP requires minimum 24 pages")

if page_count % 2 != 0:
    warnings.append("Page count should be even")

# Trim size validation
if trim_size not in MARKETPLACE_PRESETS[marketplace]['recommended_trim_sizes']:
    warnings.append(f"Non-standard trim size for {marketplace}")

# Bleed validation
if color_interior and not include_bleed:
    raise ValidationError("Color interior requires bleed")
```

### Cost Implications

The frontend should inform users:
- **Color Interior**: Significantly increases printing cost (~5x)
- **Premium Paper (70lb)**: +30% cost
- **Bleed**: No additional cost, but required for color
- **Larger Trim Sizes**: Higher printing cost (more paper)

---

## Quick Commands

```bash
# Run migrations
python manage.py makemigrations publishing
python manage.py migrate

# Test marketplace config
python manage.py shell
>>> from apps.publishing.marketplace_config import *
>>> calculate_spine_width(200, 'kdp_white')

# Generate test book with marketplace specs
curl -X POST http://localhost:8000/api/v1/publishing/books/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "marketplace": "amazon_kdp",
    "trim_size": "kdp_6x9",
    "generate_pdf": true
  }'
```

---

**Questions? Check [AMAZON_KDP_GUIDE.md](./AMAZON_KDP_GUIDE.md) for user documentation.**
