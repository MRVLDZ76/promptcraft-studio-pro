# Supabase Setup Guide - PromptCraft Studio Pro

## 📋 Prerequisites

1. **Supabase Account**: Sign up at https://supabase.com
2. **Supabase CLI**: Install globally
   ```bash
   npm install -g supabase
   ```
3. **Project Created**: Create a new project in Supabase Dashboard

## 🗄️ Database Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire content from:
   ```
   supabase/migrations/20260112_init_schema.sql
   ```
5. Click **Run** to execute the schema

### Option 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref uuohwxcuqnaykpjhrcvu

# Push the migration
supabase db push
```

## 🚀 Deploy Edge Functions

### 1. Set Environment Secrets

```bash
# Set SerpAPI key
supabase secrets set SERPAPI_KEY=8497ce60ccb34a61b7bb371343928ddf60dfa38ce0133f9810e06c7cf9f74cd8 --project-ref uuohwxcuqnaykpjhrcvu

# Verify secrets
supabase secrets list --project-ref uuohwxcuqnaykpjhrcvu
```

### 2. Deploy the Proxy Function

```bash
# Deploy serpapi-proxy edge function
supabase functions deploy serpapi-proxy --project-ref uuohwxcuqnaykpjhrcvu --no-verify-jwt

# Verify deployment
supabase functions list --project-ref uuohwxcuqnaykpjhrcvu
```

## ⚙️ Environment Configuration

Update your `.env` file:

```env
# Supabase Configuration
VITE_USE_API_ENDPOINT=true
VITE_API_BASE_URL=https://uuohwxcuqnaykpjhrcvu.supabase.co/functions/v1
VITE_SUPABASE_URL=https://uuohwxcuqnaykpjhrcvu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b2h3eGN1cW5heWtwamhyY3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMDc1OTQsImV4cCI6MjA4Mzc4MzU5NH0.UQWnRudvver0K7aWtFxdJQCjLf22JnLW3t2ETa9BHVg

# SerpAPI
VITE_SERPAPI_KEY=8497ce60ccb34a61b7bb371343928ddf60dfa38ce0133f9810e06c7cf9f74cd8

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🧪 Testing

### Test Database Connection

```javascript
// In browser console or Node.js
import { supabase } from './services/supabaseClient';

// Test query
const { data, error } = await supabase.from('analyses').select('count');
console.log('Connection test:', data, error);
```

### Test Edge Function Locally

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve serpapi-proxy --env-file .env

# Test with curl (in another terminal)
curl -X POST http://localhost:54321/functions/v1/serpapi-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "youtube",
    "params": {"search_query": "climate debate"}
  }'
```

### Test Edge Function in Production

```bash
curl -X POST https://uuohwxcuqnaykpjhrcvu.supabase.co/functions/v1/serpapi-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "youtube",
    "params": {"search_query": "test"}
  }'
```

## 📊 Database Schema Overview

### Core Tables

#### `analyses`
Main table storing debate/solo analysis results
- **Fields**: 40+ columns including participants, configuration, results, scores
- **Indexes**: created_at, mode, user_id, video_id, search_vector (full-text)
- **Features**: Full-text search, temporal scoring, chain-of-thought storage

#### `fallacy_logs`
Individual fallacies extracted from analyses
- **Fields**: fallacy_type, speaker, severity, impact_score, quote
- **Indexes**: analysis_id, type, speaker, severity
- **Relationship**: Many fallacy_logs → One analysis

#### `creator_profiles`
Cached YouTube/Instagram creator data (7-day TTL)
- **Fields**: platform, username, followers, videos, verification status
- **Indexes**: platform, username, handle, expires_at
- **Cache**: 7 days to reduce API calls

#### `video_transcripts`
Cached video transcripts from SerpAPI (30-day TTL)
- **Fields**: video_id, transcript_text, snippets, languages
- **Indexes**: video_id, channel_id, expires_at
- **Cache**: 30 days for cost optimization

#### `wsdc_configurations`
WSDC weight presets (Academic, Content-Focused, etc.)
- **Fields**: content_weight, style_weight, strategy_weight
- **Presets**: 5 default configurations included
- **Validation**: Weights must sum to 100%

#### `channel_cache`
Lightweight 24hr cache for quick channel lookups
- **Fields**: channel_handle, channel_data (JSONB)
- **Cache**: 24 hours, auto-cleanup

#### `api_usage_logs`
Track API calls for cost monitoring
- **Fields**: api_type, endpoint, tokens_used, cost_usd
- **Purpose**: Monitor spending and usage patterns

### Utility Functions

- **`cleanup_expired_cache()`** - Remove expired cache entries
- **`increment_analysis_views(uuid)`** - Safely increment view count
- **`get_analysis_stats(user_uuid)`** - Calculate statistics
- **`update_updated_at_column()`** - Auto-update timestamps

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled. Current policies:

- **Public Read**: Analyses marked as `is_public=true`
- **Owner Read**: Users can read their own analyses
- **Public Insert**: Anyone can create analyses (adjust for production)
- **Owner Update**: Users can update their own analyses

### Production Security Recommendations

1. **Restrict Public Insert**: Require authentication
   ```sql
   DROP POLICY "Allow public insert analyses" ON analyses;
   CREATE POLICY "Allow authenticated insert" ON analyses 
     FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
   ```

2. **Enable Email Auth**: In Supabase Dashboard → Authentication → Providers

3. **Add Rate Limiting**: Use Supabase Edge Function middleware

4. **Implement API Key Rotation**: Store SerpAPI key in Supabase secrets

## 📈 Performance Optimization

### Automatic Optimizations

1. **Caching Strategy**:
   - Creator profiles: 7 days
   - Video transcripts: 30 days
   - Channel data: 24 hours

2. **Indexes**:
   - Full-text search on analyses
   - Composite indexes on common queries
   - GIN indexes on JSONB fields

3. **Auto-Cleanup**:
   - Scheduled function to remove expired cache
   - Set up cron job: `SELECT cron.schedule('cleanup', '0 2 * * *', 'SELECT cleanup_expired_cache()');`

### Manual Optimizations

```sql
-- Analyze tables for better query planning
ANALYZE analyses;
ANALYZE creator_profiles;
ANALYZE video_transcripts;

-- Vacuum to reclaim space
VACUUM FULL analyses;
```

## 🔄 Maintenance

### Weekly Tasks

```bash
# Cleanup expired cache
supabase db execute --sql "SELECT cleanup_expired_cache();"

# Check table sizes
supabase db execute --sql "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Monitor API Usage

```sql
-- Daily API costs
SELECT 
  DATE(created_at) as date,
  api_type,
  SUM(cost_usd) as total_cost,
  COUNT(*) as total_calls
FROM api_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), api_type
ORDER BY date DESC;
```

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify edge function is deployed: `supabase functions list`
2. Check `VITE_USE_API_ENDPOINT=true` in `.env`
3. Ensure edge function has `--no-verify-jwt` flag

### Database Connection Issues

```bash
# Test connection
supabase db ping --project-ref uuohwxcuqnaykpjhrcvu

# Check logs
supabase logs --project-ref uuohwxcuqnaykpjhrcvu
```

### Edge Function Errors

```bash
# View function logs
supabase functions logs serpapi-proxy --project-ref uuohwxcuqnaykpjhrcvu

# Redeploy
supabase functions deploy serpapi-proxy --project-ref uuohwxcuqnaykpjhrcvu --no-verify-jwt
```

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **SerpAPI Docs**: https://serpapi.com/docs

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Deploy edge function
3. ✅ Update `.env` file
4. ✅ Test connection
5. ⏭️ Implement analysis saving in frontend
6. ⏭️ Add user authentication (optional)
7. ⏭️ Set up monitoring dashboard
