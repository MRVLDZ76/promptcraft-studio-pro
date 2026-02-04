# Quick Reference: Book Marketplace Specifications

## 🚀 Most Common Configurations

### Fiction Novel (Amazon KDP)
```
Marketplace: Amazon KDP
Trim Size: 6" × 9"
Paper: Cream
Interior: Black & White
Bleed: No
→ Classic paperback, $3-5 printing cost for 200 pages
```

### Children's Book (Full Color)
```
Marketplace: Amazon KDP
Trim Size: 8.5" × 8.5" (Square)
Paper: White
Interior: Full-Color
Bleed: Yes (required)
→ Vibrant illustrations, $12-20 printing cost for 50 pages
```

### Workbook/Manual (Letter Size)
```
Marketplace: IngramSpark or Amazon KDP
Trim Size: 8.5" × 11"
Paper: White (50lb)
Interior: Black & White
Bleed: Optional
→ Professional training materials, $5-8 printing cost for 200 pages
```

---

## 📐 Trim Size Cheat Sheet

| Size | When to Use | Cost |
|------|-------------|------|
| **6" × 9"** | 90% of novels, memoirs, non-fiction | $ |
| **5" × 8"** | Compact novels, poetry | $ |
| **8.5" × 11"** | Workbooks, journals, planners | $$ |
| **8.5" × 8.5"** | Children's books, photo books | $$$ |

**Rule of Thumb:** Larger = more expensive to print

---

## 💰 Cost Comparison (Amazon KDP)

### 200-Page Book Printing Cost

| Configuration | Cost | Retail Price Example | Royalty @ $14.99 |
|---------------|------|---------------------|------------------|
| B&W, 6×9, White | $3.25 | $14.99 | $3.44 (23%) |
| B&W, 8.5×11, White | $4.85 | $19.99 | $4.19 (21%) |
| Color, 6×9, White | $15.25 | $29.99 | $2.74 (9%) |

**💡 Key Insight:** Color is 4-5x more expensive than B&W

---

## ✅ Pre-Upload Checklist

Before uploading to Amazon KDP:
- [ ] Page count ≥ 24 (KDP minimum)
- [ ] Page count is even number
- [ ] Margins ≥ 0.25" from edge
- [ ] If color: bleed enabled
- [ ] ISBN ready (or use KDP free ISBN)
- [ ] Cover image ready (if separate)
- [ ] Book description written
- [ ] Categories/keywords chosen

---

## 🎨 Bleed Quick Guide

**When do I need bleed?**
- ✅ Full-color interior → **Always**
- ✅ Images extend to page edge → **Yes**
- ❌ Text-only black & white → **No**

**What is bleed?**
- Extra 0.125" (3mm) beyond trim edge
- Prevents white borders if trimming is slightly off
- Background colors/images extend to bleed edge
- Text stays inside safe zone (0.25" from edge)

---

## 📊 Page Count Impact

| Pages | Spine Width | Can Print Spine? | Printing Cost (B&W) |
|-------|-------------|------------------|---------------------|
| 24 | 0.06" | ❌ Too thin | $1.14 |
| 50 | 0.12" | ✅ Barely | $1.45 |
| 100 | 0.23" | ✅ Good | $2.05 |
| 200 | 0.46" | ✅ Plenty of room | $3.25 |
| 400 | 0.91" | ✅ Wide spine | $5.65 |

**Sweet Spot:** 100-300 pages for most books

---

## 🎯 Marketplace Comparison

| Platform | Free ISBN? | Distribution | Best For |
|----------|-----------|--------------|----------|
| **Amazon KDP** | ✅ Yes | Amazon only | Fast launch, easy |
| **IngramSpark** | ❌ No | Global | Bookstores, libraries |
| **Barnes & Noble** | ✅ Yes | B&N stores | US market |
| **Lulu** | ❌ Optional | Online | Flexible options |

**Strategy:** Start with KDP, expand to IngramSpark later

---

## 🔥 Common Mistakes

### ❌ Mistake #1: Too Few Pages
**Problem:** Less than 24 pages  
**Solution:** Add more content or use 50-page minimum

### ❌ Mistake #2: Text in Margins
**Problem:** Text closer than 0.25" from edge  
**Solution:** Our system applies proper margins automatically

### ❌ Mistake #3: Color Without Bleed
**Problem:** Color interior but no bleed  
**Solution:** Bleed auto-enables when color is selected

### ❌ Mistake #4: Wrong Trim Size
**Problem:** Non-standard size for genre  
**Solution:** Use 6×9 for fiction, 8.5×11 for workbooks

---

## 💡 Pro Tips

1. **Order Proof Copy First**
   - Costs $5-10
   - Check margins, spine, image quality before going live

2. **Use Cream Paper for Fiction**
   - Easier on eyes for long reading
   - Classic paperback feel
   - Only ~5% more expensive

3. **Plan for Series Consistency**
   - Use same trim size for all books in series
   - Looks professional on bookshelf
   - Easier for readers to collect

4. **Target Page Count Sweet Spots**
   - 96, 128, 160, 192, 224, 256, 288 pages
   - Aligns with signature printing (multiples of 16)
   - Slightly lower cost per page

5. **Start Simple**
   - First book: B&W, 6×9, white paper
   - Get comfortable with process
   - Expand to color/special formats later

---

## 📱 Mobile Quick Reference

**Best Defaults:**
- Marketplace: Amazon KDP
- Size: 6" × 9"
- Paper: White
- Interior: B&W
- Bleed: No

**When in doubt, use these settings.**

---

## 🆘 Need Help?

- **Full Guide:** See `AMAZON_KDP_GUIDE.md`
- **Developer Docs:** See `MARKETPLACE_API.md`
- **Amazon KDP Help:** https://kdp.amazon.com/help
- **Spine Calculator:** https://kdp.amazon.com/cover-templates

---

**Last Updated:** January 26, 2026  
**Version:** 1.0
