# Phase 1 Testing Guide

## Quick Start - Test the Integration

### 1. **Build and Run**

```powershell
# Navigate to project directory
cd c:\Users\Elena\promptStudio\promptcraft-studio-pro

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

### 2. **Access Narrative Mode**

1. Open browser to `http://localhost:5173` (or displayed URL)
2. Look at the sidebar navigation
3. Find the new section: **"Narrative Production"**
4. Click **"Video Stories"**

### 3. **Test Features**

#### **Navigation**
- ✅ Click "Video Stories" - should display placeholder UI
- ✅ Click "Next" button - step counter should increment
- ✅ Click "Back" button - step counter should decrement
- ✅ Click "Reset" - should show confirmation dialog

#### **State Persistence**
- ✅ Navigate between steps
- ✅ Refresh page (F5)
- ✅ Check if step position is maintained

#### **Mode Switching**
- ✅ Switch to "Debate Analysis" - should work
- ✅ Switch to "Prompt Builder" - should work
- ✅ Switch back to "Video Stories" - should remember step

#### **No Regressions**
- ✅ Test AI Arbiter (Debate Analysis)
- ✅ Test Prompt Builder
- ✅ Test Veo Video
- ✅ All other modes should work normally

### 4. **Expected UI**

```
Narrative Production Studio
────────────────────────────

[Film Icon]

Create biblical, historical, or custom 
narrative videos with AI-powered 
storyboarding and character management.

CURRENT STEP
┌──────────────────────────┐
│ [1] Template Selection   │
│     Step 1 of 5          │
└──────────────────────────┘

[← Back]  [Next →]  [Reset]

Phase 1 Integration: Components 
are being migrated from ChronStudio.
Full functionality coming soon!
```

### 5. **localStorage Inspection**

Open browser DevTools (F12) → Application → Local Storage:

```javascript
// Key: narrative_project_state
{
  "projectData": {
    "category": "CUSTOM",
    "mode": "INTEGRATED",
    "title": "",
    "segment": "",
    "content": "",
    "contextNote": "",
    "summary": "",
    "setting": {
      "year": "",
      "region": "",
      "landscape": ""
    },
    "style": "CINEMATIC_DRAMA",
    "characters": [],
    "storyboard": []
  },
  "currentStep": 0,
  "lastUpdated": 1737072000000
}
```

### 6. **Console Check**

Open DevTools Console - should see:
- ✅ No errors
- ✅ No warnings
- ✅ Clean startup

### 7. **Build Verification**

```powershell
# Test production build
npm run build

# Expected output:
# ✅ vite v6.x building for production...
# ✅ transforming...
# ✅ rendering chunks...
# ✅ build successful
```

## Troubleshooting

### Issue: Module not found
```
Solution: npm install
```

### Issue: TypeScript errors
```
Solution: Check imports in App.tsx match file locations
```

### Issue: Sidebar not showing new section
```
Solution: 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check App.tsx navGroups array
```

### Issue: localStorage not persisting
```
Solution:
1. Check browser privacy settings
2. Ensure localStorage enabled
3. Check DevTools → Application → Storage
```

## Success Criteria

- [ ] Narrative Production section visible in sidebar
- [ ] "Video Stories" navigation item clickable
- [ ] Placeholder UI displays correctly
- [ ] Step navigation (Back/Next) works
- [ ] State persists on page refresh
- [ ] No errors in console
- [ ] No regression in other modes
- [ ] Production build succeeds

## Next Steps

Once Phase 1 is verified:
1. Review [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)
2. Begin Phase 2 (Service Integration)
3. Follow [INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md)

---

**Status**: Ready for testing ✅
**Estimated Test Time**: 5-10 minutes
**Required**: Browser, Node.js 18+, npm

