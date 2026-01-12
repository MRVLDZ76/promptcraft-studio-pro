# 🚀 AI Arbiter - Production Deployment Guide

## Overview

This guide provides **100% JavaScript** production deployment strategy. No Python required. The architecture follows a **frontend-first approach** with optional minimal backend for API key security and RAG processing.

---

## Architecture Decision

### ✅ **Recommended: Serverless Functions (Vercel/Netlify)**

**Why:**
- **No infrastructure management** - auto-scaling, zero DevOps
- **Free tier generous** - 100GB bandwidth, 100K invocations/month (Vercel)
- **Native integration** - deploy with `vercel --prod` or push to GitHub
- **Cold start acceptable** - 2-5s is fine for LLM tasks (LLM takes longer anyway)
- **Cost-effective** - ~$50/month at 10K analyses

**Alternative Options (Not Recommended for v1):**
- ❌ **Python FastAPI** - Adds complexity, requires separate hosting, Docker containers
- ❌ **Full Node.js server** - Over-engineering for this use case, more expensive
- ❌ **Client-side only** - Security risk (API keys exposed), CORS issues, rate limiting

---

## 📋 Deployment Checklist

### Phase 1: Local Development (Current State)
- [x] Application running on `localhost:3000`
- [x] Client-side Gemini API working
- [x] Editable WSDC weights implemented
- [x] Structured JSON output schema defined
- [ ] Test with sample debates to validate accuracy

### Phase 2: Backend API Setup
- [ ] Install dependencies: `npm install @google/genai`
- [ ] Verify `/api/analyze.js` exists (already created)
- [ ] Test locally with Vercel CLI: `npm i -g vercel && vercel dev`
- [ ] Verify API responds at `http://localhost:3000/api/analyze`

### Phase 3: Production Deployment (Vercel)
- [ ] Create Vercel account at https://vercel.com/signup
- [ ] Connect GitHub repository
- [ ] Configure environment variables in Vercel dashboard
- [ ] Deploy with `vercel --prod`
- [ ] Update `VITE_API_BASE_URL` to Vercel domain
- [ ] Set `VITE_USE_API_ENDPOINT=true` for frontend build

### Phase 4: Optional Enhancements
- [ ] Setup Supabase for gamification data persistence
- [ ] Implement leaderboard with PostgreSQL views
- [ ] Add Instagram OAuth flow
- [ ] Integrate D3.js argument graph visualization
- [ ] Add Manim video export pipeline

---

## 🛠️ Step-by-Step Deployment

### Step 1: Install Dependencies

```powershell
# Navigate to project root
cd c:\Users\Elena\promptStudio\promptcraft-studio-pro

# Install backend dependencies (for /api/analyze.js)
npm install @google/genai

# Optional: Install Vercel CLI for local testing
npm install -g vercel
```

### Step 2: Configure Environment Variables

**For Development (.env.local):**
```env
# Required
GEMINI_API_KEY=your_actual_key_from_google_ai_studio

# Development mode (client-side API calls)
VITE_USE_API_ENDPOINT=false
VITE_API_BASE_URL=http://localhost:3000
```

**For Production (Vercel Dashboard):**
```env
# Required
GEMINI_API_KEY=your_actual_key_from_google_ai_studio

# Optional (for database)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Environment
NODE_ENV=production
```

**For Frontend Build (.env.production):**
```env
# Production mode (backend API calls)
VITE_USE_API_ENDPOINT=true
VITE_API_BASE_URL=https://your-project.vercel.app
```

### Step 3: Test API Locally

```powershell
# Start Vercel dev server (simulates serverless functions)
vercel dev

# In another terminal, test the API
curl -X POST http://localhost:3000/api/analyze `
  -H "Content-Type: application/json" `
  -d '{
    "video": null,
    "prompt": "Analyze this debate on AI safety",
    "wsdcWeights": {"content": 40, "style": 40, "strategy": 20},
    "ragUrls": [],
    "calibration": {"country": "USA", "year": "2026"},
    "participantA": {"name": "Debater A"},
    "mode": "arena"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "gamification": {
      "winner": "A",
      "points_a": 85,
      "points_b": 72,
      "truth_pot": "$5000",
      "followers_a": "+1500",
      "followers_b": "+800",
      "award": "Master of Warrants"
    },
    "scores": {
      "content": {"a": 35, "b": 30},
      "style": {"a": 32, "b": 28},
      "strategy": {"a": 18, "b": 14},
      "total": {"a": 85, "b": 72}
    },
    "argument_nodes": [...],
    "temporal_scores": [...],
    "final_verdict": {...}
  },
  "metadata": {
    "processingTimeMs": 8543,
    "model": "gemini-1.5-pro"
  }
}
```

### Step 4: Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push code to GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import repository
4. Vercel auto-detects Vite config
5. Add environment variables in dashboard
6. Click "Deploy"
7. Get deployment URL: `https://your-project.vercel.app`

#### Option B: Vercel CLI
```powershell
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - What's your project's name? ai-arbiter-pro
# - In which directory is your code? ./
# - Want to override settings? No

# Copy deployment URL from output
```

#### Option C: Netlify Deployment
```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set GEMINI_API_KEY your_key_here
```

### Step 5: Update Frontend Configuration

After deployment, update `.env.production`:

```env
VITE_USE_API_ENDPOINT=true
VITE_API_BASE_URL=https://ai-arbiter-pro.vercel.app
```

Rebuild and redeploy frontend:
```powershell
npm run build
vercel --prod
```

---

## 🗄️ Database Setup (Optional - For Gamification)

### Supabase PostgreSQL Schema

```sql
-- Create debates table
CREATE TABLE debates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  debate_title TEXT,
  mode TEXT CHECK (mode IN ('arena', 'solo')),
  video_url TEXT,
  
  -- Participants
  participant_a_name TEXT NOT NULL,
  participant_a_followers TEXT,
  participant_a_level INT DEFAULT 1,
  participant_b_name TEXT,
  participant_b_followers TEXT,
  participant_b_level INT DEFAULT 1,
  
  -- Calibration
  calibration_country TEXT,
  calibration_year TEXT,
  calibration_demography TEXT,
  calibration_persona TEXT,
  
  -- Results (JSON)
  gamification JSONB,
  scores JSONB,
  argument_nodes JSONB,
  temporal_scores JSONB,
  final_verdict JSONB,
  
  -- WSDC Configuration
  wsdc_weights JSONB DEFAULT '{"content": 40, "style": 40, "strategy": 20}'::jsonb,
  
  -- Processing
  processing_time_ms INT,
  model_used TEXT DEFAULT 'gemini-1.5-pro'
);

-- Create index on created_at for leaderboard queries
CREATE INDEX idx_debates_created_at ON debates(created_at DESC);

-- Create index on winner for analytics
CREATE INDEX idx_debates_winner ON debates((gamification->>'winner'));

-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT 
  COALESCE(participant_a_name, participant_b_name) AS player_name,
  COUNT(*) AS total_debates,
  SUM(CASE WHEN gamification->>'winner' = 'A' AND participant_a_name IS NOT NULL THEN 1
           WHEN gamification->>'winner' = 'B' AND participant_b_name IS NOT NULL THEN 1
           ELSE 0 END) AS wins,
  AVG((scores->'total'->>'a')::float) AS avg_score,
  MAX(gamification->>'award') AS highest_award,
  SUM((gamification->>'points_a')::int + (gamification->>'points_b')::int) AS total_points
FROM debates
WHERE participant_a_name IS NOT NULL OR participant_b_name IS NOT NULL
GROUP BY player_name
ORDER BY wins DESC, total_points DESC
LIMIT 100;
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for leaderboard)
CREATE POLICY "Public read access" ON debates
  FOR SELECT USING (true);

-- Restrict insert to authenticated API calls only
CREATE POLICY "Authenticated insert only" ON debates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Update API to Save Results

Add to `/api/analyze.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for backend
);

// After successful analysis, save to database
const { data: savedDebate, error: dbError } = await supabase
  .from('debates')
  .insert({
    debate_title: `${participantA.name} vs ${participantB?.name || 'Solo'}`,
    mode,
    video_url: req.body.videoUrl || null,
    participant_a_name: participantA.name,
    participant_a_followers: participantA.followers,
    participant_a_level: participantA.level,
    participant_b_name: participantB?.name,
    participant_b_followers: participantB?.followers,
    participant_b_level: participantB?.level,
    calibration_country: calibration.country,
    calibration_year: calibration.year,
    gamification: jsonResponse.gamification,
    scores: jsonResponse.scores,
    argument_nodes: jsonResponse.argument_nodes,
    temporal_scores: jsonResponse.temporal_scores,
    final_verdict: jsonResponse.final_verdict,
    wsdc_weights: wsdcWeights,
    processing_time_ms: processingTime,
    model_used: 'gemini-1.5-pro'
  })
  .select()
  .single();

if (dbError) {
  console.error('Database save error:', dbError);
  // Don't fail the whole request, just log the error
}
```

---

## 📊 Cost Analysis

### Vercel (Recommended)

**Hobby Plan (Free Tier):**
- 100GB bandwidth/month
- 100K serverless function invocations
- 1000 build minutes
- **Supports ~3,000 analyses/month** (assuming 30MB avg video + 3s function time)
- **Cost: $0**

**Pro Plan ($20/month):**
- 1TB bandwidth
- 1M serverless function invocations
- Unlimited build minutes
- **Supports ~30,000 analyses/month**
- **Cost: $20/month**

### Gemini API Costs

**gemini-1.5-pro Pricing:**
- Input: $1.25 / 1M tokens
- Output: $5.00 / 1M tokens
- **Average per analysis**: ~10K input + 2K output tokens
- **Cost per analysis**: $0.025 (2.5 cents)
- **10K analyses = $250/month**

**gemini-1.5-flash Alternative (Faster, Cheaper):**
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens
- **Cost per analysis**: $0.0015 (0.15 cents)
- **10K analyses = $15/month**

### Supabase (Optional)

**Free Tier:**
- 500MB database storage
- 50K monthly active users
- 2GB bandwidth
- **Supports ~10K debates stored**
- **Cost: $0**

**Pro Plan ($25/month):**
- 8GB database storage
- 100K monthly active users
- 250GB bandwidth
- **Cost: $25/month**

### Total Monthly Costs

| Volume | Vercel | Gemini Pro | Gemini Flash | Supabase | **Total (Flash)** | **Total (Pro)** |
|--------|--------|------------|--------------|----------|-------------------|-----------------|
| 1K/mo  | Free   | $25        | $1.5         | Free     | **$1.50**         | **$25**         |
| 10K/mo | $20    | $250       | $15          | Free     | **$35**           | **$270**        |
| 50K/mo | $20    | $1,250     | $75          | $25      | **$120**          | **$1,295**      |

**Recommendation:** Start with `gemini-1.5-flash` for 10-15x cost savings. Upgrade to `pro` only if accuracy requirements demand it.

---

## 🔐 Security Best Practices

### 1. API Key Management
- ✅ **DO:** Store `GEMINI_API_KEY` in Vercel environment variables only
- ❌ **DON'T:** Expose API keys in client-side code
- ✅ **DO:** Use `VITE_USE_API_ENDPOINT=true` in production
- ❌ **DON'T:** Commit `.env.local` to Git (add to `.gitignore`)

### 2. CORS Configuration
- ✅ **DO:** Whitelist specific origins in production:
  ```javascript
  const allowedOrigins = ['https://ai-arbiter.vercel.app'];
  if (allowedOrigins.includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  ```
- ❌ **DON'T:** Use `Access-Control-Allow-Origin: *` in production

### 3. Rate Limiting
Add to `/api/analyze.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP
  message: 'Too many analysis requests. Try again later.'
});

export default limiter(handler);
```

### 4. Input Validation
```javascript
// Validate video size (max 100MB)
if (video && Buffer.byteLength(video, 'base64') > 100 * 1024 * 1024) {
  return res.status(413).json({ error: 'Video too large (max 100MB)' });
}

// Validate WSDC weights
if (wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy !== 100) {
  return res.status(400).json({ error: 'WSDC weights must sum to 100' });
}
```

---

## 🧪 Testing Checklist

### Unit Tests (Optional)
```powershell
npm install --save-dev vitest @testing-library/react

# Create test/__tests__/api.test.ts
npm run test
```

### Manual Testing
- [ ] Test with 10MB video file
- [ ] Test with 50MB video file
- [ ] Test with invalid WSDC weights (sum ≠ 100)
- [ ] Test with missing required fields
- [ ] Test with empty RAG URLs
- [ ] Test with malformed JSON
- [ ] Test concurrent requests (10+ parallel)
- [ ] Test cold start latency (first request after 5min idle)

### Load Testing (Before Launch)
```powershell
# Install artillery
npm install -g artillery

# Create artillery.yml config
artillery run artillery.yml

# Expected results:
# - p95 latency < 15s
# - Success rate > 99%
# - No memory leaks
```

---

## 📈 Monitoring & Analytics

### Vercel Analytics
1. Enable in dashboard: Project Settings → Analytics
2. Track:
   - Request volume
   - Error rate
   - p95 latency
   - Bandwidth usage

### Supabase Logs
```sql
-- Query slow analyses
SELECT 
  id, 
  debate_title, 
  processing_time_ms,
  created_at
FROM debates
WHERE processing_time_ms > 10000
ORDER BY processing_time_ms DESC
LIMIT 20;

-- Query error rate
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN final_verdict IS NULL THEN 1 ELSE 0 END) AS errors
FROM debates
GROUP BY hour
ORDER BY hour DESC;
```

### Custom Logging
Add to `/api/analyze.js`:
```javascript
console.log({
  timestamp: new Date().toISOString(),
  event: 'analysis_complete',
  processingTimeMs,
  mode,
  ragSourcesUsed: ragUrls.length,
  wsdcWeights,
  winner: jsonResponse.gamification.winner,
  tokensUsed: result.usageMetadata?.totalTokenCount || 0
});
```

---

## 🚨 Troubleshooting

### Issue: "API endpoint error: 500"
**Solution:**
1. Check Vercel logs: `vercel logs`
2. Verify `GEMINI_API_KEY` is set
3. Test locally: `vercel dev`
4. Check API quota limits in Google AI Studio

### Issue: "CORS error from browser"
**Solution:**
1. Verify `VITE_API_BASE_URL` matches deployed domain
2. Check CORS headers in `/api/analyze.js`
3. Clear browser cache and try again

### Issue: "Structured JSON parsing failed"
**Solution:**
1. Log raw response: `console.log('Raw response:', responseText)`
2. Check if Gemini returned markdown-wrapped JSON
3. Verify `responseMimeType: 'application/json'` is set
4. Try regex extraction fallback

### Issue: "Cold start takes 10+ seconds"
**Solution:**
1. Implement warming ping: `setInterval(() => fetch('/api/health'), 5 * 60 * 1000)`
2. Upgrade to Vercel Pro (faster cold starts)
3. Or accept initial latency (subsequent requests are fast)

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Environment variables configured in Vercel
- [ ] Database schema applied in Supabase
- [ ] CORS whitelist configured
- [ ] Rate limiting enabled
- [ ] Error tracking setup (e.g., Sentry)
- [ ] Monitoring dashboard configured
- [ ] API documentation written

### Launch Day
- [ ] Deploy to production: `vercel --prod`
- [ ] Verify deployment URL works
- [ ] Run smoke tests (5-10 sample analyses)
- [ ] Monitor Vercel logs for errors
- [ ] Check database write success
- [ ] Verify leaderboard query works
- [ ] Test from multiple devices/browsers

### Post-Launch (Week 1)
- [ ] Monitor error rate daily
- [ ] Track API costs in Google Cloud Console
- [ ] Collect user feedback
- [ ] Analyze slow queries (>10s)
- [ ] Optimize prompts if accuracy issues
- [ ] Plan v1.1 features based on usage patterns

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Gemini API:** https://ai.google.dev/docs
- **Supabase Docs:** https://supabase.com/docs
- **LangChain.js:** https://js.langchain.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html

---

## 🎯 Next Steps

1. **Test API locally:**
   ```powershell
   vercel dev
   ```

2. **Deploy to Vercel:**
   ```powershell
   vercel --prod
   ```

3. **Update frontend config:**
   ```env
   VITE_USE_API_ENDPOINT=true
   VITE_API_BASE_URL=https://your-project.vercel.app
   ```

4. **Rebuild and redeploy frontend:**
   ```powershell
   npm run build
   vercel --prod
   ```

5. **Monitor and iterate** 🚀

---

**Need help?** Check the troubleshooting section or review the API endpoint code in `/api/analyze.js`.
