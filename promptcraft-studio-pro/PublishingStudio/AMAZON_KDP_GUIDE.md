# Amazon KDP & Marketplace Integration Guide

## 📚 Overview

Publishing Studio now supports **professional print-on-demand specifications** for:
- ✅ **Amazon KDP** (Kindle Direct Publishing)
- ✅ **IngramSpark** (Professional distribution)
- ✅ **Barnes & Noble Press**
- ✅ **Lulu**
- ✅ **Universal** (Compatible with all platforms)

Your PDFs will be generated with industry-standard specifications, ready to upload directly to these platforms.

---

## 🎯 Quick Start

### Step 1: Create a Book in Publishing Studio
1. Navigate to **Publishing Studio**
2. Click **"Create New Book"**
3. Fill in Steps 1-3 (Basic Info, Cover, AI Configuration)

### Step 2: Configure Print Specifications (Step 4)
In **Step 4: Output Formats**, enable **PDF** and configure:

| Setting | Options | Recommendation |
|---------|---------|----------------|
| **Marketplace** | Amazon KDP, IngramSpark, Barnes & Noble, Lulu, Universal | Amazon KDP (most popular) |
| **Book Size (Trim)** | 6×9, 5×8, 8.5×11, etc. | 6×9 for novels, 8.5×11 for workbooks |
| **Paper Type** | White, Cream, 50lb, 70lb | White (standard), Cream (classic fiction) |
| **Color Interior** | B&W or Full-Color | B&W (cheaper), Color (premium) |
| **Include Bleed** | Yes/No | Yes for color, Optional for B&W |

### Step 3: Generate Your Book
1. Complete **Step 5: Content Prompt**
2. Click **"Create Book"**
3. Wait for generation (1-5 minutes)
4. Download your print-ready PDF

---

## 📐 Trim Sizes Explained

### Standard Fiction (Most Popular)
- **6" × 9"** → Novels, memoirs, non-fiction (Amazon bestseller size)
- **5" × 8"** → Compact novels, poetry, essays
- **5.5" × 8.5"** → Trade paperbacks, textbooks

### Large Format
- **7" × 10"** → Workbooks, textbooks, cookbooks
- **8" × 10"** → Photography books, art books
- **8.5" × 11"** → Workbooks, manuals, journals (US Letter)

### Special Formats
- **5.25" × 8"** → Mass market paperbacks
- **8.5" × 8.5"** → Children's books, photo books (square)

**💡 Tip:** Choose 6×9 if unsure — it's the most versatile and cost-effective.

---

## 📄 Paper Types

| Paper | Best For | Appearance | Cost |
|-------|----------|------------|------|
| **White (KDP)** | Modern books, textbooks, workbooks | Bright white, high contrast | $ |
| **Cream (KDP)** | Classic fiction, memoirs, vintage look | Off-white, easier on eyes | $+ |
| **50lb White (IngramSpark)** | Standard trade paperbacks | Standard weight | $ |
| **70lb White (IngramSpark)** | Premium books, coffee table books | Thicker, luxurious | $$$ |

**💡 Tip:** Cream paper is popular for fiction novels (easier to read). White is better for textbooks with images.

---

## 🎨 Color Interior vs. Black & White

### Black & White (Recommended for Most Books)
- ✅ Lower printing cost (~$0.012/page)
- ✅ Faster production
- ✅ No bleed required
- ✅ Best for text-heavy books (novels, memoirs, guides)

### Full-Color Interior
- ✅ Beautiful images, photos, illustrations
- ✅ Premium appearance
- ❌ Higher cost (~$0.06-0.10/page)
- ❌ **Requires 0.125" bleed** (auto-enabled)
- ✅ Best for: Children's books, cookbooks, art books, textbooks with diagrams

**💡 Cost Example:**
- 200-page B&W book = ~$2.40 printing cost
- 200-page Color book = ~$12-20 printing cost

---

## 🖼️ Bleed Explained

**Bleed = 0.125 inches (3mm) extended area beyond the trim edge**

### When to Use Bleed:
- ✅ **Required:** Full-color interiors
- ✅ **Recommended:** Books with background colors/images
- ❌ **Optional:** Black & white text-only books

### What Bleed Does:
- Extends images/colors beyond the trim edge
- Prevents white borders if trimming is slightly off
- Industry standard for professional printing

**💡 Tip:** Bleed is auto-enabled for color books. Leave it enabled for best results.

---

## 📏 Margins & Safe Zones

Our system automatically applies **recommended margins**:

| Margin | Size | Purpose |
|--------|------|---------|
| **Inside (Gutter)** | 0.625" | Binding side — wider to prevent text loss |
| **Outside** | 0.5" | Away from binding |
| **Top/Bottom** | 0.5" | Header/footer space |

### Safe Zone Rules:
- ⚠️ Keep all text **0.125" away from edges**
- ⚠️ Keep critical content **0.375" from spine/gutter**
- ✅ Background colors/images can extend to bleed edge

---

## 🧮 Spine Width Calculation

**Spine width is auto-calculated based on:**
1. **Page count** (interior pages)
2. **Paper type** (thickness)
3. **Cover cardstock** (~0.01" added)

### Spine Width Formula:
```
spine_width = (page_count / pages_per_inch) + 0.01
```

### Example Calculations:

| Pages | Paper | Spine Width | Can Print Title? |
|-------|-------|-------------|------------------|
| 50 | White | 0.12" | ✅ Yes (barely) |
| 100 | White | 0.23" | ✅ Yes (good) |
| 200 | White | 0.46" | ✅ Yes (plenty of room) |
| 24 | White | 0.06" | ❌ Too thin (no title) |

**💡 Minimum spine width for title/barcode: 0.0625" (~50 pages)**

---

## 📦 Marketplace-Specific Requirements

### Amazon KDP
- **Page Range:** 24 - 828 pages
- **ISBN:** Optional (KDP provides free ISBN)
- **Bleed:** 0.125" for color, none for B&W
- **File Format:** PDF (300 DPI minimum)
- **Color Mode:** RGB or CMYK
- **Fonts:** Must be embedded

### IngramSpark
- **Page Range:** 18 - 800 pages
- **ISBN:** **Required** (must provide your own)
- **Bleed:** 0.125" required for all books
- **File Format:** PDF/X-1a:2001 (strict)
- **Color Mode:** CMYK only
- **Distribution:** Global bookstores, libraries

### Barnes & Noble Press
- **Page Range:** 24 - 800 pages
- **ISBN:** Optional (free ISBN provided)
- **Bleed:** 0.125" for color
- **File Format:** PDF (300 DPI)
- **Distribution:** Barnes & Noble stores + online

### Lulu
- **Page Range:** 2+ pages (most flexible)
- **ISBN:** Optional
- **Bleed:** 0.125" recommended
- **File Format:** PDF (flexible)

### Universal
- **Best for:** Publishing on multiple platforms
- **Uses:** 6×9 trim, white paper, 0.125" bleed
- **Compatible:** All major POD platforms

---

## 🎨 Cover Generation (Coming Soon)

Publishing Studio will soon support **full-wrap cover generation**:

### Cover Template Includes:
- **Back Cover** (left third)
- **Spine** (center strip)
- **Front Cover** (right third)
- **ISBN Barcode Placement** (bottom right, back cover)
- **Bleed Extension** (0.125" on all outer edges)

### Auto-Calculated:
- ✅ Total cover width = (trim_width × 2) + spine_width + (bleed × 2)
- ✅ Cover height = trim_height + (bleed × 2)
- ✅ Spine position (exact pixel coordinates)
- ✅ Safe zones (no text/images within 0.125" of edges)

**Example for 200-page 6×9 book:**
- Interior: 6" × 9"
- Spine: 0.46"
- Cover: 12.71" × 9.25" (with bleed)
- Cover @ 300 DPI: 3813 × 2775 pixels

---

## 🚀 Export Your Print-Ready PDF

### Option 1: From Book Editor
1. Open your completed book
2. Click **"Export"** button
3. Select **"PDF Document"**
4. Download your print-ready PDF

### Option 2: From Book List
1. Find your book in the list
2. Click **"⬇ Download"** icon
3. PDF is automatically generated with your marketplace specs

### What You'll Get:
- ✅ Print-ready PDF with correct trim size
- ✅ Embedded fonts (no font errors)
- ✅ 300 DPI resolution (sharp images)
- ✅ Proper margins and bleed
- ✅ Page numbers and headers
- ✅ Table of contents (if enabled)
- ✅ Cover page (if enabled)

### Validation Info:
The export will show:
- ✅ **Marketplace:** Amazon KDP
- ✅ **Trim Size:** 6" × 9"
- ✅ **Bleed:** 0.125"
- ✅ **Spine Width:** 0.46"
- ✅ **Page Count:** 200
- ⚠️ **Warnings:** (if any issues detected)

---

## ✅ Pre-Upload Checklist

Before uploading to Amazon KDP or other platforms:

### Content Validation:
- [ ] **Page count ≥ 24** (KDP minimum)
- [ ] **Page count is even** (books print in signatures)
- [ ] **All images are 300 DPI**
- [ ] **Fonts are embedded** (auto-handled)
- [ ] **No text in margins** (<0.25" from edge)

### Marketplace Requirements:
- [ ] **ISBN ready** (if using your own)
- [ ] **Author bio** (for back cover)
- [ ] **Book description** (for marketing)
- [ ] **Categories/keywords** (for discoverability)
- [ ] **Pricing set** (KDP calculator)

### Cover (If Uploading Separately):
- [ ] **Full-wrap cover** (front + spine + back)
- [ ] **Correct dimensions** (use cover template)
- [ ] **ISBN barcode** (bottom right, back cover)
- [ ] **0.125" bleed** on all outer edges
- [ ] **Spine text readable** (top-to-bottom orientation)

---

## 🛠️ Troubleshooting

### "Page count too low" (< 24 pages)
- **Solution:** Add more content. KDP requires minimum 24 pages.
- **Workaround:** Use larger font size or increase line spacing temporarily.

### "Spine too thin" (< 0.0625")
- **Issue:** Title/barcode won't fit on spine
- **Solution:** Add more pages (aim for 50+ for comfortable spine)

### "Invalid trim size for marketplace"
- **Issue:** Selected trim size not available on that platform
- **Solution:** Switch to a standard size (6×9, 5×8, 8.5×11)

### "Bleed required but not enabled"
- **Issue:** Color interior needs bleed
- **Solution:** Enable "Include Bleed" checkbox (auto-enabled for color)

### "File too large" (> 650 MB)
- **Issue:** Too many high-res images
- **Solution:** Reduce image count or use lower resolution (still 300 DPI)

---

## 📊 Cost Estimation

### KDP Printing Costs (Black & White):
- **Base:** $0.85 (fixed)
- **Per Page:** $0.012
- **Example:** 200-page book = $0.85 + (200 × $0.012) = **$3.25**

### KDP Printing Costs (Full-Color):
- **Base:** $3.65 (fixed)
- **Per Page:** $0.06
- **Example:** 50-page book = $3.65 + (50 × $0.06) = **$6.65**

### Pricing Formula:
```
Royalty = (List Price - Printing Cost - Distribution Fee) × Royalty %
```

**Example for $14.99 novel (200 pages, B&W):**
- Printing: $3.25
- Distribution (40%): $6.00
- Royalty (60%): = ($14.99 - $3.25 - $6.00) × 0.60 = **$3.44 per sale**

**💡 Use Amazon's [KDP Pricing Calculator](https://kdp.amazon.com/en_US/help/topic/G201834340)**

---

## 🎓 Advanced Tips

### 1. Optimize Page Count
- **Aim for multiples of 16** (standard signature size)
- 48, 64, 96, 128, 160, 192, 224, 256, 288, 320 pages

### 2. Choose Cream for Fiction
- Easier on eyes for long reading sessions
- Classic paperback feel
- Slightly more expensive (~5%)

### 3. Test Print First
- Order a proof copy before going live
- Check margins, spine alignment, image quality
- Costs ~$5-10 for proof

### 4. Global Distribution
- **KDP:** Amazon only
- **IngramSpark:** Global (bookstores, libraries, online)
- **Strategy:** Use both for maximum reach

### 5. Series Consistency
- Use same trim size for all books in a series
- Keep paper type consistent
- Use same spine width calculation

---

## 📚 Example Configurations

### Configuration 1: Standard Fiction Novel
```
Title: "The Last Sunset"
Marketplace: Amazon KDP
Trim Size: 6" × 9"
Paper: Cream
Interior: Black & White
Bleed: No
Result: Perfect for mass market fiction
```

### Configuration 2: Children's Picture Book
```
Title: "Adventures in Wonderland"
Marketplace: Amazon KDP
Trim Size: 8.5" × 8.5" (Square)
Paper: White
Interior: Full-Color
Bleed: Yes (required)
Result: Vibrant children's book
```

### Configuration 3: Professional Workbook
```
Title: "Master Python in 30 Days"
Marketplace: IngramSpark
Trim Size: 8.5" × 11" (Letter)
Paper: 50lb White
Interior: Black & White
Bleed: Yes
Result: Professional training manual
```

### Configuration 4: Premium Art Book
```
Title: "Modern Architecture"
Marketplace: IngramSpark
Trim Size: 8" × 10"
Paper: 70lb White
Interior: Full-Color
Bleed: Yes
Result: High-quality coffee table book
```

---

## 🔗 Resources

### Official Platform Guides:
- [Amazon KDP Specs](https://kdp.amazon.com/en_US/help/topic/G201834340)
- [IngramSpark Requirements](https://www.ingramspark.com/plan-your-book/print/formatting-and-file-prep)
- [Barnes & Noble Press Guide](https://press.barnesandnoble.com/support)

### Tools:
- [KDP Cover Calculator](https://kdp.amazon.com/en_US/cover-templates)
- [KDP Pricing Calculator](https://kdp.amazon.com/en_US/help/topic/G201834340)
- [ISBN Purchase (US)](https://www.myidentifiers.com/)

### Community:
- [KDP Community Forum](https://community.kdp.amazon.com/)
- [r/selfpublish](https://www.reddit.com/r/selfpublish/)
- [Alliance of Independent Authors](https://www.allianceindependentauthors.org/)

---

## ❓ FAQ

### Q: Do I need to buy an ISBN?
**A:** Not for Amazon KDP or Barnes & Noble (they provide free ISBNs). **Required** for IngramSpark.

### Q: What's the best trim size for a novel?
**A:** **6" × 9"** is the industry standard and most cost-effective.

### Q: Can I use the same PDF for multiple platforms?
**A:** Yes, if you use "Universal" settings. For best results, generate platform-specific PDFs.

### Q: How long does generation take?
**A:** 1-5 minutes for most books. Longer books (500+ pages) may take 10-15 minutes.

### Q: Can I edit after generation?
**A:** Yes! Use **Book Editor** or **Visual Workbench** to make changes, then re-export.

### Q: What if my book is rejected by KDP?
**A:** Check validation warnings in export. Common issues: margins, page count, fonts.

### Q: Can I publish on multiple platforms?
**A:** Yes! Generate separate PDFs for KDP, IngramSpark, etc. for best compliance.

---

## 🆘 Support

Need help? Contact us:
- **Documentation:** [Publishing Studio Docs](./README.md)
- **GitHub Issues:** [Report a bug](https://github.com/yourrepo/issues)
- **Email:** support@promptstudio.com

---

## 📝 Version History

- **v1.0** (2026-01-26) - Initial marketplace integration
  - Amazon KDP specifications
  - IngramSpark support
  - Trim sizes (7 options)
  - Bleed settings
  - Spine calculation
  - Cover template generation

---

**🎉 Happy Publishing! Your books are ready for the world. 📚**
