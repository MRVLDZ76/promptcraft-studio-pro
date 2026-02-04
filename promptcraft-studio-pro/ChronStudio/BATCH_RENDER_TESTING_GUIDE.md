# 🧪 Batch Render & Character Consistency Testing Guide

**Testing Date:** February 2, 2026  
**Frontend URL:** http://localhost:5174/  
**Test Duration:** ~20-30 minutes

---

## 🎯 Testing Objectives

1. ✅ Verify "Render All Videos" batch functionality works correctly
2. ✅ Confirm character reference images are used in video generation
3. ✅ Validate character consistency across multiple scenes
4. ✅ Test error handling and progress tracking
5. ✅ Optimize rendering delay if needed

---

## 🚀 Test Setup

### **Prerequisites:**
- [x] Frontend running on http://localhost:5174/
- [ ] Valid Google AI API key configured (`process.env.API_KEY`)
- [ ] Browser with good internet connection
- [ ] ~20 minutes for video generation

### **Recommended Test Project:**
- **Category:** Biblical or Historical
- **Mode:** Integrated (not External)
- **Characters:** 2-3 characters with distinct appearances
- **Scenes:** 3-5 scenes (manageable test size)
- **Duration:** 8-10 seconds per scene

---

## 📝 Testing Procedure

### **Phase 1: Character Setup (Step 2 - Casting & Assets)**

#### **Test Case 1.1: Create Test Characters**

1. **Open application:** http://localhost:5174/
2. **Select template:** Choose "Biblical" or "Historical"
3. **Navigate to Step 2:** Casting & Assets

**Create Character 1:**
- **Name:** `David`
- **Role:** `King and Shepherd`
- **Visual Description:**
  ```
  Middle-aged man with weathered olive skin, dark brown beard with gray streaks, 
  deep-set brown eyes, wearing simple shepherd's robe in earth tones, 
  leather belt, holding wooden staff. Strong but humble appearance.
  ```
- **Click:** "Generate Reference Image"
- **Wait:** ~10-15 seconds for image generation
- **Verify:** Image displays in character card
- **Screenshot:** Save as `test_character_david.png`

**Create Character 2:**
- **Name:** `Goliath`
- **Role:** `Giant Warrior`
- **Visual Description:**
  ```
  Towering giant over 9 feet tall, muscular build, bronze skin, 
  intimidating presence, wearing bronze scaled armor, large bronze helmet, 
  massive iron spear, thick black beard, fierce expression. Philistine warrior.
  ```
- **Click:** "Generate Reference Image"
- **Wait:** ~10-15 seconds
- **Verify:** Image displays
- **Screenshot:** Save as `test_character_goliath.png`

**Expected Results:**
- ✅ Both characters have distinct, high-quality reference images
- ✅ Visual descriptions saved to project data
- ✅ Images display in character cards
- ✅ No errors in browser console

---

### **Phase 2: Storyboard Generation (Step 3 - Storyboard)**

#### **Test Case 2.1: Generate Storyboard**

1. **Click:** "Confirm Cast" to proceed to Step 3
2. **Review content:** Ensure narrative content is present
3. **Click:** "Generate Sequences"
4. **Wait:** ~30-60 seconds for AI storyboard generation
5. **Verify:** 3-5 scenes generated

#### **Test Case 2.2: Verify Character Assignments**

**For Each Scene:**
- **Check:** Character thumbnails appear below scene description
- **Verify:** Correct characters assigned to each scene
  - Scene 1: David only
  - Scene 2: David only
  - Scene 3: Both David and Goliath
  - Scene 4: Both David and Goliath
  - Scene 5: David only

**Expected Results:**
- ✅ All scenes have character thumbnails
- ✅ `characterIds` array populated correctly
- ✅ Visual prompts reference character actions
- ✅ Character reference images visible in scene cards

**Screenshot:** Save entire storyboard view as `test_storyboard.png`

---

### **Phase 3: Batch Rendering Test (Step 4 - Production Studio)**

#### **Test Case 3.1: UI Verification**

1. **Click:** "Proceed to Production" (Step 4)
2. **Verify UI Elements:**
   - [ ] "Render All Videos" button visible in header (gradient primary-to-blue)
   - [ ] Button positioned left of "Publish to Social"
   - [ ] FilmIcon displayed
   - [ ] Button NOT disabled (if no rendering in progress)

**Screenshot:** Save header section as `test_ui_header.png`

#### **Test Case 3.2: Single Scene Test (Control)**

**Before batch testing, render ONE scene individually:**

1. **Select:** Scene 1 (David only)
2. **Click:** "Start Render" button on scene card
3. **Observe:**
   - [ ] Button becomes disabled
   - [ ] Scene status changes to "generating"
   - [ ] Spinner animation appears
4. **Wait:** ~60-90 seconds for video generation
5. **Verify:**
   - [ ] Scene status changes to "completed"
   - [ ] Video player appears with generated video
   - [ ] Video shows David with appearance matching reference image
   - [ ] Video controls work (play, pause, volume)

**Character Consistency Check:**
- **Compare:** Reference image (from Step 2) vs. generated video
- **Check:** Hair color, beard, clothing, facial features
- **Rating:** 1-10 for visual similarity
- **Notes:** Record any discrepancies

**Screenshot:** 
- Save completed scene as `test_single_render.png`
- Capture video frame showing character as `test_david_video_frame.png`

---

#### **Test Case 3.3: Batch Render ALL Videos** ⭐ **PRIMARY TEST**

1. **Click:** "Render All Videos" button in header
2. **Confirm Dialog:** 
   - Verify message shows correct scene count
   - Example: `Start batch rendering 4 scenes?`
   - Click "OK"

3. **Observe Batch Progress Indicator:**
   - [ ] Progress banner appears below header
   - [ ] Banner shows gradient primary/blue background
   - [ ] Spinning loader icon visible
   - [ ] Text reads "Batch Rendering in Progress"
   - [ ] Counter shows "1 / 4" format
   - [ ] Progress bar animates from 0% to 100%

4. **Monitor Scene Cards:**
   - [ ] Scene 2 status → "generating" → "completed"
   - [ ] Scene 3 status → "generating" → "completed"
   - [ ] Scene 4 status → "generating" → "completed"
   - [ ] 2-second pause between each render

5. **Track Timing:**
   - **Start Time:** [Record]
   - **Scene 2 Complete:** [Record] (~90s expected)
   - **Scene 3 Complete:** [Record] (~180s expected)
   - **Scene 4 Complete:** [Record] (~270s expected)
   - **Total Duration:** [Record]

6. **Completion:**
   - [ ] Progress indicator disappears
   - [ ] Alert shows: "Batch rendering complete! 4 scenes processed."
   - [ ] All scene cards show "completed" status
   - [ ] Video players appear on all scenes

**Expected Timing:**
- **4 scenes**: ~6-7 minutes total
- **Formula**: (Scenes × 90s) + (Scenes × 2s delay)

**Screenshot Sequence:**
- `test_batch_progress_25.png` (1/4 complete)
- `test_batch_progress_50.png` (2/4 complete)
- `test_batch_progress_75.png` (3/4 complete)
- `test_batch_progress_100.png` (4/4 complete)
- `test_all_completed.png` (final result)

---

### **Phase 4: Character Consistency Validation** 🎯 **CRITICAL**

#### **Test Case 4.1: David Consistency Check**

**Compare across all scenes featuring David:**

| Scene | Reference Image | Video Frame | Consistency Score | Notes |
|-------|----------------|-------------|-------------------|-------|
| 1 | `test_character_david.png` | [Screenshot] | __/10 | |
| 2 | Same | [Screenshot] | __/10 | |
| 5 | Same | [Screenshot] | __/10 | |

**Checklist for Each Scene:**
- [ ] Beard color matches (dark brown with gray)
- [ ] Facial structure consistent
- [ ] Clothing matches description (earth tones, leather belt)
- [ ] Age appearance consistent (middle-aged)
- [ ] Overall visual similarity score: 7+/10

#### **Test Case 4.2: Goliath Consistency Check**

**Compare across scenes featuring Goliath:**

| Scene | Reference Image | Video Frame | Consistency Score | Notes |
|-------|----------------|-------------|-------------------|-------|
| 3 | `test_character_goliath.png` | [Screenshot] | __/10 | |
| 4 | Same | [Screenshot] | __/10 | |

**Checklist:**
- [ ] Bronze armor visible and consistent
- [ ] Giant size relative to David (if both present)
- [ ] Black beard consistent
- [ ] Intimidating presence maintained
- [ ] Overall similarity score: 7+/10

#### **Test Case 4.3: Multi-Character Scene Analysis**

**Scenes 3 & 4 (Both characters):**

- [ ] Both characters appear in frame
- [ ] Size difference is appropriate (Goliath much taller)
- [ ] Individual character features maintained
- [ ] Characters positioned correctly per scene description
- [ ] No character feature "bleeding" (David doesn't have Goliath's armor, etc.)

**Screenshot:** Save multi-character scene as `test_multi_character.png`

---

### **Phase 5: Error Handling & Edge Cases**

#### **Test Case 5.1: Interrupted Batch Render**

1. **Start:** New batch render with remaining scenes
2. **Action:** Refresh browser mid-render (after 1st scene completes)
3. **Verify:**
   - [ ] Completed videos persist
   - [ ] Pending scenes remain in "pending" status
   - [ ] Can restart batch render
   - [ ] No data loss

#### **Test Case 5.2: Failed Scene Handling**

**Simulate failure:**
1. **Edit Scene:** Add prohibited content to prompt (if possible)
2. **Render:** Start batch render
3. **Verify:**
   - [ ] Error modal appears with safety filter message
   - [ ] Batch continues to next scene (doesn't stop completely)
   - [ ] Failed scene shows "failed" status
   - [ ] Can retry individual failed scenes

#### **Test Case 5.3: Button State Management**

**Verify button behavior:**
- [ ] Disabled when batch rendering active
- [ ] Disabled when individual scene rendering
- [ ] Enabled when all renders complete
- [ ] Shows "Rendering..." text during batch
- [ ] Shows "Render All Videos" when idle

---

## 📊 Performance Metrics

### **Timing Analysis:**

| Metric | Expected | Actual | Pass/Fail |
|--------|----------|--------|-----------|
| Single scene render | 60-90s | ___s | |
| Batch 4 scenes total | 6-7 min | ___min | |
| Delay between renders | 2s | ___s | |
| Progress bar accuracy | ±5% | ___% | |
| Character consistency | 7+/10 | ___/10 | |

### **API Rate Limiting:**

**Monitor browser console for:**
- [ ] No 429 (Too Many Requests) errors
- [ ] No timeout errors
- [ ] Successful completion of all renders
- [ ] 2-second delay sufficient for rate limiting

**If rate limiting occurs:**
- Increase delay in `VideoProduction.tsx`:
  ```typescript
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5s instead of 2s
  ```

---

## 🐛 Issue Tracking

### **Bugs Found:**

| Issue # | Description | Severity | Reproduction Steps | Screenshot |
|---------|-------------|----------|-------------------|------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### **Character Consistency Issues:**

| Scene # | Character | Issue Description | Expected | Actual |
|---------|-----------|-------------------|----------|--------|
| | | | | |

---

## ✅ Test Results Summary

### **Batch Rendering:**
- [ ] **PASS**: "Render All Videos" button works
- [ ] **PASS**: Progress indicator shows correctly
- [ ] **PASS**: All scenes render sequentially
- [ ] **PASS**: Completion notification appears
- [ ] **PASS**: No rate limiting errors

### **Character Consistency:**
- [ ] **PASS**: Reference images used in generation
- [ ] **PASS**: Character descriptions added to prompts
- [ ] **PASS**: Visual consistency score 7+/10
- [ ] **PASS**: Multi-character scenes work correctly
- [ ] **PASS**: No character feature mixing

### **Error Handling:**
- [ ] **PASS**: Failed scenes don't stop batch
- [ ] **PASS**: Button states update correctly
- [ ] **PASS**: Browser refresh doesn't lose data
- [ ] **PASS**: Error modals display properly

---

## 🔧 Recommended Adjustments

### **If Character Consistency < 7/10:**

1. **Enhance Visual Descriptions:**
   - Add more specific details (eye color, height, build)
   - Include distinctive features (scars, birthmarks)
   - Specify exact clothing items

2. **Improve Reference Images:**
   - Regenerate with more detailed prompts
   - Use different art styles (try "photorealistic" or "cinematic")
   - Ensure clear facial features

3. **Test Different Styles:**
   - Try "CINEMATIC_DRAMA" vs "GRITTY_REALISM"
   - Some styles maintain consistency better

### **If Rate Limiting Occurs:**

**Increase delay in VideoProduction.tsx (line ~141):**

```typescript
// Current
await new Promise(resolve => setTimeout(resolve, 2000)); // 2s

// Increase to 5s if 429 errors occur
await new Promise(resolve => setTimeout(resolve, 5000)); // 5s
```

### **If Batch Progress Inaccurate:**

**Check state updates in VideoProduction.tsx:**
- Verify `setBatchProgress()` called before each render
- Ensure counter increments correctly
- Add console logging for debugging

---

## 📋 Quick Test Checklist

**Quick 10-Minute Smoke Test:**

1. [ ] Create 2 characters with reference images
2. [ ] Generate 3-scene storyboard
3. [ ] Verify character thumbnails in scenes
4. [ ] Click "Render All Videos"
5. [ ] Confirm progress indicator works
6. [ ] Wait for all 3 scenes to complete (~5 min)
7. [ ] Compare first scene video to reference image
8. [ ] Rate character consistency 1-10

**Pass Criteria:** All 8 steps complete without errors, consistency score 7+

---

## 📸 Required Screenshots

**Minimum required for documentation:**

1. `test_character_david.png` - David reference image
2. `test_character_goliath.png` - Goliath reference image
3. `test_storyboard.png` - Full storyboard view
4. `test_ui_header.png` - "Render All Videos" button
5. `test_batch_progress.png` - Progress indicator mid-render
6. `test_all_completed.png` - All scenes completed
7. `test_david_comparison.png` - Split screen: reference vs. video
8. `test_multi_character.png` - Scene with both characters

---

## 🎬 Next Actions After Testing

### **If All Tests Pass:**
1. ✅ Document successful test results
2. ✅ Commit changes to repository
3. ✅ Update README with new features
4. ✅ Proceed to Week 7 comprehensive testing

### **If Issues Found:**
1. 🐛 Document bugs in issue tracker
2. 🔧 Adjust delay/prompts as needed
3. 🔄 Re-test specific failing scenarios
4. 📝 Update implementation based on findings

---

## 💡 Pro Tips

### **Best Practices:**
- **Test with diverse characters**: Different ages, genders, clothing styles
- **Use high-quality descriptions**: More detail = better consistency
- **Monitor console**: Keep DevTools open for errors
- **Save work frequently**: Project data persists in localStorage
- **Test edge cases**: Very long prompts, minimal descriptions, etc.

### **Common Issues:**
- **Vague descriptions → inconsistent results**: Be specific!
- **No reference image → poor consistency**: Always generate images
- **Complex multi-character scenes**: May need multiple reference images
- **Safety filters**: Avoid historical figures, real people names

---

**Happy Testing! 🚀**

*If you encounter any issues, check the browser console and refer to [CHARACTER_CONSISTENCY_GUIDE.md](./CHARACTER_CONSISTENCY_GUIDE.md) for troubleshooting.*
