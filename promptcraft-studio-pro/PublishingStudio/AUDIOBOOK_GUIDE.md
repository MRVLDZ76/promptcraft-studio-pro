# Audiobook Marketplace Guide (ACX/Audible & More)

## 📻 Overview

Publishing Studio now supports **professional audiobook specifications** for:
- ✅ **ACX/Audible** (Amazon - largest audiobook platform)
- ✅ **Findaway Voices** (Wide distribution - Spotify, Apple, Google, Kobo)
- ✅ **Author's Republic** (24+ retailers)
- ✅ **Google Play Audiobooks**
- ✅ **Spotify Audiobooks**

Your audiobooks will be generated with industry-standard specifications, ready to upload directly to these platforms.

---

## 🎯 Quick Start

### Step 1: Create Book with Audiobook Enabled
1. Navigate to **Publishing Studio**
2. Create new book (Steps 1-3)
3. **Step 3: AI Configuration** → Enable "Enable Audio"
4. Select voice model (Fable for fiction, Echo for non-fiction)

### Step 2: Configure Audiobook Specifications (Step 4)
In **Step 4: Output Formats**, enable **Audiobook**:

| Setting | Options | Recommendation |
|---------|---------|----------------|
| **Marketplace** | ACX/Audible, Findaway, Author's Republic | ACX/Audible (largest) |
| **Format** | MP3 (192kbps), MP3 (128kbps), M4B, WAV | MP3 192kbps for ACX |
| **Channel** | Mono or Stereo | Stereo (better quality) |
| **Chapter Markers** | Yes/No | Yes (better UX) |
| **Credits** | Opening, Closing, Both | Both (professional) |
| **Retail Sample** | Yes/No | Yes (required for ACX) |

### Step 3: Generate Audiobook
1. Complete prompt and create book
2. Wait for AI narration generation (5-15 minutes per hour of audio)
3. Download your ACX-ready audiobook files

---

## 📐 ACX/Audible Requirements (Most Popular)

### Technical Specifications
```
Format: MP3
Bitrate: 192 kbps CBR (Constant Bit Rate) ✓
Sample Rate: 44.1 kHz ✓
Channels: Mono or Stereo
Bit Depth: 16-bit
Peak Amplitude: -3dB to -6dB
RMS Level: -18dB to -23dB
Noise Floor: -60dB or lower
Room Tone: 0.5-1 second at start/end
```

### File Structure
```
YourBook_Opening.mp3        ← Opening credits (5-15 sec)
YourBook_01.mp3             ← Chapter 1
YourBook_02.mp3             ← Chapter 2
...
YourBook_15.mp3             ← Chapter 15
YourBook_Closing.mp3        ← Closing credits (5-20 sec)
YourBook_RetailSample.mp3   ← 5-minute sample (first chapter)
```

### Opening Credits Example
> *"This is [Book Title], written by [Author Name], narrated by [AI Voice/Narrator Name], produced by [Your Studio Name]."*

### Closing Credits Example
> *"This has been [Book Title], written by [Author Name], narrated by [AI Voice]. Copyright [Year] by [Copyright Holder]. Thank you for listening. If you enjoyed this audiobook, please leave a review."*

---

## 💰 Cost & Revenue

### Production Costs (AI vs Human)

| Method | Cost per Hour | Upfront | Quality | Best For |
|--------|---------------|---------|---------|----------|
| **AI TTS (OpenAI)** | ~$15 | ✅ Yes | Good | Budget, fast turnaround |
| **Human Narrator (PFH)** | ~$250 | ✅ Yes | Excellent | Premium, complex narration |
| **Royalty Share** | $0 | ❌ No | Excellent | No budget, split 50/50 |

### ACX Royalty Structure

**Exclusive Distribution** (Amazon/Audible/iTunes only):
- **40% royalty** on retail price
- Example: $19.95 audiobook = $7.98 per sale
- Free promotional codes
- Better discoverability

**Non-Exclusive Distribution** (anywhere):
- **25% royalty** on retail price
- Example: $19.95 audiobook = $4.99 per sale
- Can sell on multiple platforms

### Break-Even Analysis (AI Production)

**Example: 5-hour audiobook**
- Production Cost: 5 hours × $15 = **$75**
- Retail Price: **$19.95**
- Royalty per Sale (40%): **$7.98**
- **Break-Even: 10 sales** (75 ÷ 7.98 ≈ 10)

**Example: 10-hour audiobook**
- Production Cost: 10 hours × $15 = **$150**
- Retail Price: **$29.95**
- Royalty per Sale (40%): **$11.98**
- **Break-Even: 13 sales** (150 ÷ 11.98 ≈ 13)

---

## 🎙️ Voice Selection Guide

### OpenAI TTS Voices (Available in Publishing Studio)

| Voice | Gender | Tone | Best For | ACX Quality |
|-------|--------|------|----------|-------------|
| **Fable** | Male | Warm, storytelling | Fiction, children's books | ⭐⭐⭐⭐⭐ |
| **Echo** | Male | Authoritative, smooth | Non-fiction, business | ⭐⭐⭐⭐⭐ |
| **Onyx** | Male | Deep, dramatic | Thriller, mystery | ⭐⭐⭐⭐⭐ |
| **Nova** | Female | Energetic, young | YA, contemporary | ⭐⭐⭐⭐ |
| **Shimmer** | Female | Gentle, soothing | Romance, self-help | ⭐⭐⭐⭐⭐ |
| **Alloy** | Neutral | Balanced, clear | General narration | ⭐⭐⭐⭐ |

**💡 Recommendation:**
- **Fiction Novel** → Fable (male) or Shimmer (female)
- **Non-Fiction/Business** → Echo
- **Thriller/Mystery** → Onyx
- **Romance** → Shimmer
- **Self-Help** → Shimmer or Alloy
- **Children's Book** → Nova or Fable

---

## 📊 Audio Format Comparison

| Format | Bitrate | Quality | File Size (1 hour) | Best For |
|--------|---------|---------|-------------------|----------|
| **MP3 192kbps (ACX)** | 192 | Excellent | ~90 MB | ACX/Audible |
| **MP3 128kbps** | 128 | Good | ~60 MB | Spotify, Google Play |
| **M4B 64kbps** | 64 | Good | ~30 MB | Apple Books, mobile |
| **WAV Uncompressed** | N/A | Perfect | ~600 MB | Mastering, archive |

**💡 Recommendation:** Use **MP3 192kbps** for ACX - it's the gold standard.

---

## 🔊 Chapter Markers

### What Are Chapter Markers?
- Allow listeners to skip to specific chapters
- Show chapter titles in player
- Improve user experience significantly

### ACX/Audible Format
- Uses **ID3 tags** (CHAP frames)
- Each chapter gets a title and timestamp
- Example:
  ```
  Chapter 1: The Beginning (0:00:00)
  Chapter 2: A New Discovery (0:23:45)
  Chapter 3: The Turning Point (0:47:30)
  ```

### Benefits
✅ Better listener experience  
✅ Easy navigation  
✅ Professional presentation  
✅ Higher ratings/reviews  

**💡 Always enable chapter markers** - no downsides!

---

## 📦 File Delivery

### What You'll Get (ACX-Ready Package)

```
my_novel_audiobook/
├── MyNovel_Opening.mp3          (15 seconds)
├── MyNovel_01.mp3                (Chapter 1 - 23 min)
├── MyNovel_02.mp3                (Chapter 2 - 28 min)
├── MyNovel_03.mp3                (Chapter 3 - 19 min)
├── ...
├── MyNovel_15.mp3                (Chapter 15 - 22 min)
├── MyNovel_Closing.mp3           (20 seconds)
├── MyNovel_RetailSample.mp3      (5 minutes)
└── metadata.json                 (Book info, chapters, etc.)
```

### Metadata Included
- Book title, author, narrator
- Chapter titles and durations
- Total duration
- ISBN (if provided)
- Cover image (2400×2400 square)
- Genre, description
- Copyright information

---

## 🎨 Cover Requirements

### ACX/Audible Cover Specs
```
Dimensions: 2400 × 2400 pixels (SQUARE)
Min Size: 1200 × 1200 pixels
Format: JPG (not PNG)
Max File Size: 2 MB
Color Mode: RGB
Quality: High (no compression artifacts)
```

### Design Guidelines
- ✅ **Clear, readable title** (even at thumbnail size)
- ✅ **Author name prominent**
- ✅ **Professional design** (avoid amateur look)
- ✅ **No "audiobook" label** (implied)
- ❌ **No borders** (looks dated)
- ❌ **No excessive text** (cluttered)

**💡 Tip:** Use the same cover as your ebook/print book for brand consistency.

---

## 🚀 Distribution Strategies

### Strategy 1: ACX Exclusive (Beginner-Friendly)
```
Platform: ACX/Audible only
Royalty: 40%
Pros:
  ✅ Highest royalty rate
  ✅ Free promotional codes
  ✅ Better Amazon ranking
  ✅ Simple management
Cons:
  ❌ Only on Amazon ecosystem
  ❌ Locked in for 7 years
```
**Best For:** New audiobook authors, Amazon-focused strategy

### Strategy 2: Wide Distribution (Maximum Reach)
```
Platforms: ACX + Findaway Voices + Author's Republic
Royalty: 25% (ACX) + 80% (Findaway) + 70% (AR)
Pros:
  ✅ Maximum platform coverage
  ✅ Spotify, Apple, Google, Kobo, etc.
  ✅ Not locked into Amazon
Cons:
  ❌ Lower ACX royalty (25% vs 40%)
  ❌ More complex management
```
**Best For:** Established authors, wide audience

### Strategy 3: Premium Platforms Only
```
Platforms: ACX + Google Play + Spotify
Royalty: 25-40%
Pros:
  ✅ High-quality platforms only
  ✅ Good discoverability
Cons:
  ❌ Missing some smaller platforms
```
**Best For:** Premium productions, targeted distribution

---

## 🎓 Audiobook Pricing Guide

### ACX Pricing Requirements

| Duration | Min Price | Max Price | Recommended |
|----------|-----------|-----------|-------------|
| Under 1 hour | $7.00 | $10.00 | $7.99 |
| 1-3 hours | $7.00 | $15.00 | $9.99 |
| 3-5 hours | $10.00 | $20.00 | $14.99 |
| 5-10 hours | $15.00 | $25.00 | $19.95 |
| 10-20 hours | $20.00 | $30.00 | $24.95 |
| Over 20 hours | $25.00 | $35.00 | $29.95 |

### Pricing Formula
```
Sweet Spot = $1.50 - $2.50 per finished hour

Example: 8-hour audiobook
  Low: 8 × $1.50 = $12.00
  High: 8 × $2.50 = $20.00
  Recommended: $19.95
```

---

## ✅ Pre-Upload Checklist (ACX)

### Audio Quality
- [ ] Peak levels between -3dB and -6dB
- [ ] RMS around -18dB to -23dB
- [ ] Noise floor below -60dB
- [ ] No clicks, pops, or mouth noises
- [ ] 0.5-1 second room tone at start/end of each file

### File Requirements
- [ ] MP3 format, 192 kbps CBR
- [ ] 44.1 kHz sample rate, 16-bit
- [ ] Correct file naming (Title_01.mp3, etc.)
- [ ] Opening credits file (5-15 seconds)
- [ ] Closing credits file (5-20 seconds)
- [ ] Retail sample (5 minutes from beginning)

### Metadata
- [ ] Book title and subtitle
- [ ] Author name
- [ ] Narrator name (or "AI Narration")
- [ ] ISBN (optional but recommended)
- [ ] Publisher name
- [ ] Copyright year and holder
- [ ] Book description (under 4000 characters)
- [ ] Genre/categories

### Cover Image
- [ ] 2400×2400 pixels (square)
- [ ] JPG format
- [ ] Under 2 MB
- [ ] Professional design
- [ ] Readable at thumbnail size

---

## 🛠️ Troubleshooting

### "Audio quality does not meet ACX standards"
**Common Issues:**
- Peak levels too high (> -3dB) → **Solution:** Normalize to -4dB
- Peak levels too low (< -6dB) → **Solution:** Amplify slightly
- Noise floor too high → **Solution:** Apply noise reduction
- Clipping detected → **Solution:** Reduce gain, re-export

### "File format incorrect"
**Solution:** Ensure MP3 is 192 kbps CBR (not VBR), 44.1 kHz, 16-bit

### "Retail sample required"
**Solution:** Upload YourBook_RetailSample.mp3 (5 minutes from start)

### "Opening/closing credits missing"
**Solution:** Upload separate files for credits (5-20 seconds each)

---

## 💡 Pro Tips

### 1. Narrator Credits for AI
When using AI narration, credit it properly:
- **Good:** "Narrated by AI Voice (OpenAI Fable Model)"
- **Bad:** Pretending it's a human narrator
- **Why:** Transparency builds trust with listeners

### 2. Optimize for Listening Speed
- Use natural pacing (not too fast or slow)
- Pause between chapters (1-2 seconds)
- Clear pronunciation
- Consistent volume levels

### 3. Test Your Audiobook
Before uploading:
- Listen to first 15 minutes
- Check chapter transitions
- Verify credits are correct
- Test retail sample

### 4. Promotional Codes
ACX gives you 25-50 free promo codes to:
- Send to reviewers
- Share with fans
- Build launch buzz

### 5. Series Consistency
If creating a series:
- Use same narrator/voice
- Consistent audio quality
- Similar pricing
- Matching cover design style

---

## 📈 Marketing Your Audiobook

### Launch Strategy
1. **Pre-Order (if available)**
   - Build anticipation
   - Collect early reviews

2. **Launch Day**
   - Email list announcement
   - Social media posts
   - Request reviews from promo code recipients

3. **Post-Launch**
   - Encourage reviews
   - Run promotions (ACX has tools)
   - Cross-promote with ebook/print

### Getting Reviews
- Send promo codes to book bloggers
- Ask readers in your email list
- Include CTA in closing credits
- Engage with audiobook communities (r/audiobooks)

---

## 🆘 Support Resources

### Official Platform Help
- **ACX University:** https://www.acx.com/help/acx-university
- **Findaway Voices:** https://findawayvoices.com/resources
- **Author's Republic:** https://www.authorsrepublic.com/support

### Quality Control Tools
- **ACX Audio Lab:** Free tool to check audio quality
- **Audacity:** Free audio editor for fixes
- **ffmpeg:** Command-line tool for format conversion

### Communities
- **r/audiobooks:** Reddit community
- **ACX Facebook Group:** Tips from narrators/authors
- **Author's Republic Forum:** Distribution help

---

## 📝 Quick Reference: Marketplace Comparison

| Platform | Royalty | Distribution | ISBN Required | Best For |
|----------|---------|--------------|---------------|----------|
| **ACX Exclusive** | 40% | Amazon only | No | Beginners |
| **ACX Non-Exclusive** | 25% | Amazon + others | No | Wide reach |
| **Findaway Voices** | 80%* | 40+ retailers | No | Maximum reach |
| **Author's Republic** | 70% | 24+ retailers | No | Easy wide dist |
| **Google Play** | 70% | Google only | No | Android users |

*80% of net (after platform fees)

---

## 🎯 Example Configuration

### Fiction Novel (5 hours)
```
Marketplace: ACX/Audible (Exclusive)
Format: MP3 192kbps
Channel: Stereo
Voice: Fable (male storytelling)
Chapter Markers: Yes
Opening Credits: Yes
Closing Credits: Yes
Retail Sample: Yes (first 5 min)

Production Cost: $75 (5 × $15)
Retail Price: $19.95
Royalty/Sale: $7.98 (40%)
Break-Even: 10 sales
```

### Non-Fiction Guide (8 hours)
```
Marketplace: Wide (ACX + Findaway)
Format: MP3 192kbps
Channel: Stereo
Voice: Echo (authoritative)
Chapter Markers: Yes
Opening Credits: Yes
Closing Credits: Yes
Retail Sample: Yes

Production Cost: $120 (8 × $15)
Retail Price: $24.95
ACX Royalty: $6.24/sale (25%)
Findaway Royalty: ~$15/sale (80%)
```

---

**🎉 Happy Audiobook Publishing! Your stories are ready to be heard. 🎧**

---

**Last Updated:** February 4, 2026  
**Version:** 1.0
