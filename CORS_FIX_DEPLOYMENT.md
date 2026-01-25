# Analysis API CORS Fix - Deployment Guide

## 🔍 Problem Identified

The CORS error was caused by:
1. **Missing Supabase Edge Function**: The `/api/analyze` endpoint didn't exist on Supabase
2. **Wrong URL pattern**: Frontend was calling `/api/analyze` but Supabase uses `/api-analyze` (function name directly)
3. **Format mismatch**: The existing `api/analyze.js` was in Vercel format (Node.js), not Supabase Edge Function format (Deno)

## ✅ Solution Applied

### Files Created/Modified:

1. **`supabase/functions/api-analyze/index.ts`** (NEW)
   - Created Supabase Edge Function with proper Deno runtime
   - Full CORS headers support for preflight OPTIONS requests
   - Gemini API integration for debate analysis
   - RAG source fetching capability
   - WSDC scoring matrix

2. **`services/geminiService.ts`** (MODIFIED)
   - Added smart URL detection for Supabase vs Vercel endpoints
   - Supabase: `{base}/api-analyze`
   - Vercel: `{base}/api/analyze`

## 🚀 Deployment Steps

### Step 1: Set Supabase Environment Variables

Set the GEMINI_API_KEY in your Supabase project:

```bash
# Using Supabase CLI
supabase secrets set GEMINI_API_KEY=AIzaSyCY3udTgn0702PvBSGsgZgZOG-JBbr9Ph8
```

Or via Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/uuohwxcuqnaykpjhrcvu/settings/edge-functions
2. Add secret: `GEMINI_API_KEY`

### Step 2: Deploy Edge Function

```bash
cd promptcraft-studio-pro

# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref uuohwxcuqnaykpjhrcvu

# Deploy the function
supabase functions deploy api-analyze --no-verify-jwt
```

The `--no-verify-jwt` flag allows public access without authentication.

### Step 3: Verify Deployment

Test the endpoint:

```bash
curl -X OPTIONS "https://uuohwxcuqnaykpjhrcvu.supabase.co/functions/v1/api-analyze" -v
```

Expected response: `HTTP/2 200` with CORS headers.

### Step 4: Deploy Frontend Changes

```bash
# Commit and push to trigger Vercel deployment
git add .
git commit -m "fix: CORS error for analysis API - add Supabase Edge Function"
git push origin main
```

## 📋 CORS Headers Configuration

The Edge Function includes these headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
};
```

## 🔗 Endpoint URLs

| Environment | URL |
|-------------|-----|
| Production (Supabase) | `https://uuohwxcuqnaykpjhrcvu.supabase.co/functions/v1/api-analyze` |
| Fallback (Vercel) | `https://promptcraft-studio-pro.vercel.app/api/analyze` |

## 🧪 Testing

After deployment, test in browser console:

```javascript
fetch('https://uuohwxcuqnaykpjhrcvu.supabase.co/functions/v1/api-analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Test analysis',
    wsdcWeights: { content: 40, style: 40, strategy: 20 },
    calibration: {},
    participantA: { name: 'Test' },
    mode: 'solo'
  })
}).then(r => r.json()).then(console.log);
```

## 📝 Notes

- The Supabase Edge Function uses Deno runtime (not Node.js)
- JWT verification is disabled for public access
- The function calls Gemini API directly using REST (not SDK)
- RAG sources are fetched and cleaned before analysis
