# ✅ Production Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Status
- [x] All TypeScript errors resolved (0 errors)
- [x] Development server running successfully on `localhost:3000`
- [x] Hot module reloading functional (verified with 30+ HMR updates)
- [x] All critical files created and documented

### ✅ Files Created
- [x] `/api/analyze.js` - Serverless backend API (200+ lines)
- [x] `.env.example` - Environment variable template
- [x] `vite-env.d.ts` - TypeScript environment definitions
- [x] `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- [x] `JSON_SCHEMA.md` - Structured output documentation
- [x] `QUICK_REFERENCE.md` - Quick start guide
- [x] `IMPLEMENTATION_SUMMARY.md` - Complete overview
- [x] `README.md` - Updated with production info

### ✅ Files Modified
- [x] `services/geminiService.ts` - Added API endpoint toggle, dynamic weights
- [x] `components/AnalysisStudio.tsx` - Editable WSDC weights UI
- [x] `tsconfig.json` - Added Vite client types
- [x] `types.ts` - Complete interfaces (previous session)

### ✅ Features Implemented
- [x] Editable WSDC weights (40/40/20 default)
- [x] Dynamic weight passing to LLM prompt
- [x] Live total validation (must sum to 100%)
- [x] Structured JSON output schema defined
- [x] Production/development mode toggle
- [x] Backend API with RAG pipeline
- [x] Comprehensive error handling
- [x] Input validation (weights, video size)

---

## Deployment Steps

### Step 1: Install Dependencies ⏱️ 2 minutes
```powershell
cd c:\Users\Elena\promptStudio\promptcraft-studio-pro
npm install @google/genai
npm install -g vercel
```

**Verification:**
- [ ] No npm errors
- [ ] `@google/genai` in `node_modules`
- [ ] `vercel` command available globally

---

### Step 2: Test API Locally ⏱️ 5 minutes
```powershell
# Start Vercel dev server (simulates serverless functions)
vercel dev
```

**Verification:**
- [ ] Server starts on `localhost:3000`
- [ ] API endpoint accessible at `/api/analyze`
- [ ] Test with curl/Postman:
  ```powershell
  curl -X POST http://localhost:3000/api/analyze `
    -H "Content-Type: application/json" `
    -d '{"prompt": "Test debate", "wsdcWeights": {"content": 40, "style": 40, "strategy": 20}, "participantA": {"name": "A"}, "mode": "arena"}'
  ```
- [ ] Response includes `{"success": true, "data": {...}}`

---

### Step 3: Deploy to Vercel ⏱️ 5 minutes
```powershell
# Login to Vercel (one-time setup)
vercel login

# Deploy to production
vercel --prod
```

**Prompts:**
- "Set up and deploy?" → Yes
- "Which scope?" → Select your account
- "Link to existing project?" → No
- "What's your project's name?" → `ai-arbiter-pro` (or your choice)
- "In which directory is your code located?" → `./`
- "Want to override settings?" → No

**Verification:**
- [ ] Deployment successful
- [ ] Deployment URL displayed (e.g., `vercel.apphttps://ai-arbiter-pro.`)
- [ ] Copy URL for next step

---

### Step 4: Configure Environment Variables ⏱️ 3 minutes

**Option A: Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Select your project (`ai-arbiter-pro`)
3. Settings → Environment Variables
4. Add:
   ```
   Name: GEMINI_API_KEY
   Value: your_actual_key_from_google_ai_studio
   Environment: Production
   ```
5. Add:
   ```
   Name: NODE_ENV
   Value: production
   Environment: Production
   ```
6. Click "Save"

**Option B: Vercel CLI**
```powershell
vercel env add GEMINI_API_KEY
# Paste your key when prompted
# Select "Production" environment

vercel env add NODE_ENV
# Enter "production"
# Select "Production" environment
```

**Verification:**
- [ ] Environment variables visible in dashboard
- [ ] `GEMINI_API_KEY` value hidden (secure)
- [ ] `NODE_ENV=production`

---

### Step 5: Update Frontend Configuration ⏱️ 2 minutes

**Create `.env.production` in project root:**
```env
# Production mode (use backend API)
VITE_USE_API_ENDPOINT=true
VITE_API_BASE_URL=https://ai-arbiter-pro.vercel.app

# Replace with your actual deployment URL
```

**Verification:**
- [ ] `.env.production` file created
- [ ] `VITE_API_BASE_URL` matches your Vercel deployment URL
- [ ] `VITE_USE_API_ENDPOINT=true`

---

### Step 6: Rebuild and Redeploy ⏱️ 3 minutes
```powershell
# Build with production environment
npm run build

# Deploy again with updated frontend config
vercel --prod
```

**Verification:**
- [ ] Build successful (no errors)
- [ ] `dist/` folder created
- [ ] Deployment completes successfully
- [ ] New deployment URL displayed (may be same as before)

---

### Step 7: Test Production Deployment ⏱️ 5 minutes

**Open browser and navigate to your deployment URL:**
```
https://ai-arbiter-pro.vercel.app
```

**Manual Tests:**
1. [ ] Page loads without errors
2. [ ] Upload a small test video (5-10MB)
3. [ ] Adjust WSDC weights (e.g., 50/30/20)
4. [ ] Click "ANALYZE VIDEO"
5. [ ] Wait for analysis to complete (15-30 seconds)
6. [ ] Verify structured JSON output displayed
7. [ ] Check Mind Palace panel shows reasoning
8. [ ] Verify temporal score graph appears
9. [ ] Check gamification stats (winner, points, etc.)

**Browser Console Check:**
- [ ] No console errors (red messages)
- [ ] Look for "🚀 Using production API endpoint" log
- [ ] Verify API calls go to `/api/analyze`

**Network Tab Check:**
- [ ] POST request to `/api/analyze` returns 200 status
- [ ] Response contains `{"success": true, "data": {...}}`
- [ ] Response time < 30 seconds

---

### Step 8: Monitor Performance ⏱️ 5 minutes

**Vercel Dashboard:**
1. Go to Project → Analytics tab
2. Check:
   - [ ] Request count increasing
   - [ ] Error rate = 0%
   - [ ] p95 latency < 15 seconds
   - [ ] Bandwidth usage reasonable

**Gemini API Usage:**
1. Go to https://aistudio.google.com/app/apikey
2. Check:
   - [ ] Token usage tracked
   - [ ] Within quota limits
   - [ ] No rate limit errors

---

## Post-Deployment (Optional)

### Setup Database (Supabase) ⏱️ 15 minutes
1. [ ] Create Supabase account at https://supabase.com
2. [ ] Create new project
3. [ ] Go to SQL Editor
4. [ ] Paste schema from `DEPLOYMENT_GUIDE.md`
5. [ ] Execute SQL
6. [ ] Add environment variables:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key
   ```
7. [ ] Redeploy: `vercel --prod`
8. [ ] Verify debates are being saved to database

### Setup Instagram OAuth ⏱️ 30 minutes
1. [ ] Create Facebook Developer App
2. [ ] Configure OAuth redirect URIs
3. [ ] Add Instagram Graph API permissions
4. [ ] Update `socialMediaService.ts`
5. [ ] Test Instagram profile fetching

---

## Troubleshooting

### Issue: API returns 500 error
**Solution:**
```powershell
# Check Vercel logs
vercel logs

# Look for error messages
# Common issues:
# - Missing GEMINI_API_KEY
# - Incorrect API key format
# - Quota exceeded
```

### Issue: Frontend still using client-side API
**Solution:**
```powershell
# Verify .env.production
cat .env.production
# Should show: VITE_USE_API_ENDPOINT=true

# Clear build cache
Remove-Item dist -Recurse -Force

# Rebuild
npm run build
vercel --prod
```

### Issue: CORS error in browser
**Solution:**
1. Check `VITE_API_BASE_URL` matches deployment URL exactly
2. Verify no typos (https vs http, trailing slashes, etc.)
3. Clear browser cache
4. Try incognito/private window

### Issue: JSON parsing failed
**Solution:**
1. Check Vercel logs for actual API response
2. Verify `responseMimeType: 'application/json'` in `/api/analyze.js`
3. Check Gemini API status page

### Issue: Weights validation fails
**Solution:**
1. Verify total equals 100 in UI
2. Check backend validation in `/api/analyze.js`
3. Test with default weights (40/40/20)

---

## Success Criteria

### ✅ Deployment Successful When:
- [ ] Application accessible at public URL
- [ ] Video analysis completes without errors
- [ ] Structured JSON output displays correctly
- [ ] Editable weights work and validate properly
- [ ] Mind Palace UI renders Chain of Thought
- [ ] Temporal scores graph displays
- [ ] No console errors in browser
- [ ] Vercel logs show successful API calls
- [ ] Cost tracking shows reasonable token usage

### 📊 Expected Performance:
- **First request (cold start)**: 5-10 seconds
- **Subsequent requests**: 3-5 seconds
- **Success rate**: > 99%
- **Error rate**: < 1%
- **Token usage**: 10K-15K tokens per analysis

---

## Cost Monitoring

### Daily Checks (First Week)
- [ ] Monitor Vercel invocation count
- [ ] Check Gemini API token usage
- [ ] Verify no unexpected errors
- [ ] Review user feedback (if applicable)

### Weekly Checks
- [ ] Analyze cost trends
- [ ] Optimize prompts if token usage high
- [ ] Review slow queries (>15s)
- [ ] Check database growth (if using Supabase)

### Monthly Checks
- [ ] Compare actual costs vs. estimates
- [ ] Evaluate Gemini Flash vs. Pro accuracy
- [ ] Review user analytics
- [ ] Plan feature enhancements

---

## Rollback Plan

### If Critical Issues Occur:
1. **Immediate:** Revert to previous deployment
   ```powershell
   vercel rollback
   ```

2. **Alternative:** Switch to development mode
   ```env
   # In .env.production
   VITE_USE_API_ENDPOINT=false
   ```
   - Client-side Gemini API (temporary fix)
   - Rebuild and redeploy

3. **Emergency:** Disable feature
   - Comment out analysis button
   - Display maintenance message
   - Fix issue locally, then redeploy

---

## Next Steps After Deployment

### Phase 1: Validation (Week 1)
- [ ] Run 20+ test analyses
- [ ] Collect accuracy metrics
- [ ] Fix any edge cases
- [ ] Optimize prompt if needed

### Phase 2: Enhancements (Month 1)
- [ ] Add database persistence
- [ ] Implement leaderboard
- [ ] Add Instagram OAuth
- [ ] Improve error messages

### Phase 3: Scale (Month 2+)
- [ ] Optimize for performance
- [ ] Add caching layer
- [ ] Implement user accounts
- [ ] Build admin dashboard

---

## Contact & Support

**Documentation:**
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete guide
- [JSON_SCHEMA.md](JSON_SCHEMA.md) - Output schema
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick commands

**External Resources:**
- Vercel Support: https://vercel.com/support
- Gemini API Docs: https://ai.google.dev/docs
- Supabase Docs: https://supabase.com/docs

---

## ✅ Final Checklist Summary

- [x] Code complete and error-free
- [x] Documentation comprehensive
- [ ] Dependencies installed
- [ ] API tested locally
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Frontend config updated
- [ ] Production deployment tested
- [ ] Performance monitored
- [ ] Ready for production traffic

---

**Estimated Total Deployment Time:** 30-45 minutes

**Status:** Ready to deploy! 🚀

**Command to start:**
```powershell
vercel --prod
```

---

**Last Updated:** 2026-01-19  
**Version:** 1.0.0
