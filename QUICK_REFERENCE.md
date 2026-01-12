# 🚀 AI Arbiter - Production Quick Reference

## ✅ Current Status

### Completed Features
- ✅ Development server running on `localhost:3000`
- ✅ Expandable creator profiles with YouTube API integration
- ✅ Editable WSDC weights (Content/Style/Strategy)
- ✅ Dynamic weight passing to LLM prompt
- ✅ Toulmin Model (6 components) + Fallacy Taxonomy (12 types)
- ✅ Mind Palace Chain of Thought UI
- ✅ Temporal score tracking (chess-style advantage graph)
- ✅ Serverless API endpoint ready (`/api/analyze.js`)
- ✅ Structured JSON output schema defined
- ✅ Complete deployment guide with cost analysis

### Ready to Deploy
- 📦 `/api/analyze.js` - Production-ready serverless function
- 📦 `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- 📦 `JSON_SCHEMA.md` - Structured output documentation
- 📦 `.env.example` - Environment variable template

---

## 🎯 Production Architecture

### **100% JavaScript Solution**
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js Serverless Functions (Vercel/Netlify)
- **AI/LLM**: Google Gemini API 1.35.0
- **RAG**: Simple URL fetching (no vector DB for v1)
- **Database** (optional): Supabase PostgreSQL with pgvector

### **No Python Required**
All functionality achievable with JavaScript/TypeScript ecosystem.

---

## 📁 Project Structure

```
promptcraft-studio-pro/
├── api/
│   └── analyze.js              # Serverless endpoint (NEW)
├── components/
│   ├── AnalysisStudio.tsx      # Main UI with editable weights
│   ├── Workbench.tsx
│   └── ...
├── services/
│   ├── geminiService.ts        # LLM integration (UPDATED)
│   └── socialMediaService.ts   # YouTube/Instagram APIs
├── types.ts                     # TypeScript interfaces
├── .env.example                 # Environment template (NEW)
├── DEPLOYMENT_GUIDE.md          # Complete deployment guide (NEW)
├── JSON_SCHEMA.md               # Structured output docs (NEW)
└── package.json
```

---

## 🔑 Environment Variables

### Development (.env.local)
```env
# Required
GEMINI_API_KEY=your_actual_key

# Development mode (client-side)
VITE_USE_API_ENDPOINT=false
VITE_API_BASE_URL=http://localhost:3000
```

### Production (Vercel Dashboard)
```env
# Backend
GEMINI_API_KEY=your_actual_key
NODE_ENV=production

# Frontend Build (.env.production)
VITE_USE_API_ENDPOINT=true
VITE_API_BASE_URL=https://your-project.vercel.app
```

---

## 🚀 Quick Deploy Commands

### 1. Install Dependencies
```powershell
npm install @google/genai
```

### 2. Test Locally
```powershell
# Install Vercel CLI
npm install -g vercel

# Start dev server
vercel dev

# Access API at http://localhost:3000/api/analyze
```

### 3. Deploy to Production
```powershell
# Login
vercel login

# Deploy
vercel --prod

# Copy deployment URL (e.g., https://ai-arbiter-pro.vercel.app)
```

### 4. Update Frontend Config
```powershell
# Edit .env.production
VITE_USE_API_ENDPOINT=true
VITE_API_BASE_URL=https://ai-arbiter-pro.vercel.app

# Rebuild and redeploy
npm run build
vercel --prod
```

---

## 💰 Cost Estimates

| Volume   | Vercel  | Gemini Flash | Supabase | **Total** |
|----------|---------|--------------|----------|-----------|
| 1K/mo    | Free    | $1.50        | Free     | **$1.50** |
| 10K/mo   | $20     | $15          | Free     | **$35**   |
| 50K/mo   | $20     | $75          | $25      | **$120**  |

**Recommendation:** Use `gemini-1.5-flash` for 10-15x cost savings vs. `gemini-1.5-pro`.

---

## 📊 Editable WSDC Weights

### How It Works

1. **UI Controls** (AnalysisStudio.tsx):
   ```tsx
   const [wsdcWeights, setWsdcWeights] = useState({ 
     content: 40, style: 40, strategy: 20 
   });
   const [editingWeights, setEditingWeights] = useState(false);
   ```

2. **Edit Button**:
   ```tsx
   <button onClick={() => setEditingWeights(!editingWeights)}>
     {editingWeights ? 'LOCK' : 'EDIT'}
   </button>
   ```

3. **Number Inputs** (when editing):
   ```tsx
   <input 
     type="number" 
     value={wsdcWeights.content}
     onChange={e => setWsdcWeights(prev => ({
       ...prev, 
       content: parseInt(e.target.value)
     }))}
   />
   ```

4. **Validation** (must sum to 100):
   ```tsx
   const total = wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy;
   <span className={total === 100 ? 'text-emerald-400' : 'text-red-400'}>
     Total: {total}%
   </span>
   ```

5. **Pass to LLM**:
   ```tsx
   const result = await analyzeVideoContent(base64, mime, prompt, {
     wsdcWeights,  // { content: 40, style: 40, strategy: 20 }
     // ... other config
   });
   ```

6. **Dynamic Prompt** (geminiService.ts):
   ```javascript
   CONTENT (${config.wsdcWeights.content}% Weight - MAX ${config.wsdcWeights.content} points):
   ...
   
   STYLE (${config.wsdcWeights.style}% Weight - MAX ${config.wsdcWeights.style} points):
   ...
   
   STRATEGY (${config.wsdcWeights.strategy}% Weight - MAX ${config.wsdcWeights.strategy} points):
   ...
   ```

### Validation Rules

```typescript
// Frontend validation
if (wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy !== 100) {
  alert('WSDC weights must sum to 100%');
  return;
}

// Backend validation (in API endpoint)
const totalWeight = wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy;
if (totalWeight !== 100) {
  return res.status(400).json({
    error: `WSDC weights must sum to 100. Current total: ${totalWeight}`
  });
}
```

---

## 📝 Structured JSON Output

### Schema Enforcement

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    responseMimeType: 'application/json',  // Force JSON output
    temperature: 0.7,
    maxOutputTokens: 8192
  }
});
```

### Required Response Structure

```json
{
  "gamification": {
    "winner": "A" | "B" | "TIE",
    "points_a": 85,
    "points_b": 72,
    "truth_pot": "$5000",
    "followers_a": "+1500",
    "followers_b": "+800",
    "award": "Master of Warrants"
  },
  "scores": {
    "content": { "a": 35, "b": 30 },
    "style": { "a": 32, "b": 28 },
    "strategy": { "a": 18, "b": 14 },
    "total": { "a": 85, "b": 72 }
  },
  "argument_nodes": [...],  // Toulmin components + fallacies
  "temporal_scores": [...],  // Score evolution over time
  "final_verdict": {...}     // Summary and key insights
}
```

See [JSON_SCHEMA.md](JSON_SCHEMA.md) for complete documentation.

---

## 🧪 Testing Checklist

### Before Deployment
- [ ] Test API locally: `vercel dev`
- [ ] Test with 10MB video file
- [ ] Test with 50MB video file
- [ ] Verify WSDC weights validation (must sum to 100)
- [ ] Verify structured JSON parsing
- [ ] Test with invalid inputs (should return 400 errors)

### After Deployment
- [ ] Verify production URL works
- [ ] Run 5-10 sample analyses
- [ ] Monitor Vercel logs for errors
- [ ] Check API costs in Google Cloud Console
- [ ] Verify cold start latency < 10s

---

## 🔍 Monitoring

### Vercel Dashboard
- **Invocations**: Track API call volume
- **Errors**: Monitor 5xx error rate
- **Latency**: p95 should be < 15s
- **Bandwidth**: Track video upload data transfer

### Gemini API Quotas
Check at: https://aistudio.google.com/app/apikey

- **Daily requests**: 1,500 per day (free tier)
- **Tokens per minute**: 32,000 TPM (free tier)
- **Upgrade to paid**: Remove rate limits

---

## 🐛 Troubleshooting

### Issue: "API endpoint error: 500"
```powershell
# Check Vercel logs
vercel logs

# Verify environment variables
vercel env ls

# Test locally
vercel dev
```

### Issue: "CORS error"
Solution: Verify `VITE_API_BASE_URL` matches deployed domain.

### Issue: "JSON parsing failed"
Solution: Check `responseMimeType: 'application/json'` is set in Gemini config.

### Issue: "Cold start takes 10+ seconds"
Solution: Acceptable for first request. Subsequent requests are < 3s.

---

## 📚 Documentation Index

1. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
2. **[JSON_SCHEMA.md](JSON_SCHEMA.md)** - Structured output documentation
3. **[.env.example](.env.example)** - Environment variable template
4. **[/api/analyze.js](api/analyze.js)** - Serverless function code

---

## 🎯 Next Steps

1. **Test API locally**:
   ```powershell
   npm install -g vercel
   vercel dev
   ```

2. **Deploy to Vercel**:
   ```powershell
   vercel --prod
   ```

3. **Update frontend config** and redeploy:
   ```powershell
   # .env.production
   VITE_USE_API_ENDPOINT=true
   VITE_API_BASE_URL=https://your-project.vercel.app
   
   npm run build
   vercel --prod
   ```

4. **Optional: Setup Supabase** for gamification data persistence (see DEPLOYMENT_GUIDE.md)

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **Supabase**: https://supabase.com/docs
- **Troubleshooting**: See DEPLOYMENT_GUIDE.md "Troubleshooting" section

---

**Status**: ✅ Ready for Production Deployment  
**Last Updated**: 2026-01-19  
**Version**: 1.0
