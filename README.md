<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Arbiter - Debate Analysis Studio

**The Crystal Box of Argumentation™** - Transparent AI-powered debate analysis with editable WSDC weights, Toulmin deconstruction, and comprehensive fallacy detection.

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com)
[![Tech](https://img.shields.io/badge/Tech-React%2019%20%7C%20TypeScript%20%7C%20Gemini%20API-blue)](https://github.com)
[![Architecture](https://img.shields.io/badge/Architecture-100%25%20JavaScript-yellow)](https://github.com)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Local Development

```powershell
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 3. Run development server
npm run dev

# 4. Open browser at http://localhost:3000
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | 📋 Complete overview of what was built |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | ⚡ Quick commands and status |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | 🚀 Step-by-step production deployment |
| **[JSON_SCHEMA.md](JSON_SCHEMA.md)** | 📊 Structured output documentation |
| **[AI_ARBITER_IMPLEMENTATION.md](AI_ARBITER_IMPLEMENTATION.md)** | 🧠 AI architecture and Toulmin model |
| **[SOCIAL_MEDIA_INTEGRATION.md](SOCIAL_MEDIA_INTEGRATION.md)** | 👤 Creator profile API integration |

---

## ✨ Key Features

### 🎯 Editable WSDC Weights
Dynamically adjust Content/Style/Strategy weights (default: 40/40/20) to customize scoring criteria. Weights are passed directly to LLM prompt for transparent calibration.

**Example:**
```typescript
wsdcWeights: { content: 50, style: 30, strategy: 20 }
```

### 🧠 Toulmin Argumentation Model
Complete deconstruction of arguments into 6 components:
- **CLAIM**: Central thesis
- **GROUNDS**: Supporting evidence
- **WARRANT**: Logical bridge
- **BACKING**: Authority/theory
- **QUALIFIER**: Degree of certainty
- **REBUTTAL**: Counter-arguments

### 🚨 Comprehensive Fallacy Detection
12-type taxonomy including:
Ad Hominem, Strawman, Slippery Slope, False Dilemma, Appeal to Authority, Hasty Generalization, Post Hoc, Red Herring, Circular Reasoning, Appeal to Emotion, Bandwagon, No True Scotsman

### 🧪 Mind Palace Chain of Thought
Sherlock-style reasoning visualization with cyan neon UI and temporal score graphs.

### 📊 Structured JSON Output
Guaranteed JSON format for database persistence:
```json
{
  "gamification": { "winner": "A", "points_a": 85, ... },
  "scores": { "content": {...}, "style": {...}, ... },
  "argument_nodes": [...],
  "temporal_scores": [...],
  "final_verdict": {...}
}
```

### 👤 Social Media Integration
Expandable creator profiles with YouTube API integration (Instagram framework ready).

---

## 🏗️ Architecture

### Frontend
- **React 19** + TypeScript 5.8 + Vite 6.2
- **TailwindCSS** with cyberpunk aesthetic (Cyan #00b8ff, Magenta #bd00ff)
- **Client-side** Gemini API for development
- **Backend API** integration for production

### Backend (Production)
- **Serverless Functions** (Vercel/Netlify)
- **Node.js** with Gemini API 1.35.0
- **Simple RAG** (URL fetching, no vector DB for v1)
- **Optional Supabase** PostgreSQL for gamification data

### 100% JavaScript Solution
- No Python required
- LangChain.js available if needed (future)
- Complete TypeScript type safety

---

## 💰 Production Costs

| Volume | Vercel | Gemini Flash | Total/Month |
|--------|--------|--------------|-------------|
| 1K     | Free   | $1.50        | **$1.50**   |
| 10K    | $20    | $15          | **$35**     |
| 50K    | $20    | $75          | **$95**     |

**Recommendation:** Use `gemini-1.5-flash` for cost efficiency. Upgrade to `gemini-1.5-pro` only if accuracy testing shows significant gaps.

---

## 🚀 Production Deployment

### Quick Deploy (Vercel)

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard:
# - GEMINI_API_KEY=your_key
# - NODE_ENV=production

# Update frontend (.env.production):
# - VITE_USE_API_ENDPOINT=true
# - VITE_API_BASE_URL=https://promptcraft-studio-pro.vercel.app

# Rebuild and redeploy
npm run build
vercel --prod
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.

---

## 🧪 Testing

```powershell
# Test API locally
vercel dev

# Access at http://localhost:3000/api/analyze

# Example request:
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze this debate",
    "wsdcWeights": {"content": 40, "style": 40, "strategy": 20},
    "participantA": {"name": "Debater A"},
    "mode": "arena"
  }'
```

---

## 📊 Project Structure

```
promptcraft-studio-pro/
├── api/
│   └── analyze.js              # Serverless API endpoint
├── components/
│   ├── AnalysisStudio.tsx      # Main UI (editable weights)
│   ├── Workbench.tsx
│   └── ...
├── services/
│   ├── geminiService.ts        # LLM integration
│   └── socialMediaService.ts   # YouTube/Instagram APIs
├── types.ts                     # TypeScript interfaces
├── vite-env.d.ts               # Vite environment types
├── .env.example                # Environment template
├── DEPLOYMENT_GUIDE.md         # Deployment instructions
├── JSON_SCHEMA.md              # Output schema docs
└── IMPLEMENTATION_SUMMARY.md   # Complete overview
```

---

## 🛠️ Development

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_key_from_google_ai_studio

# Development mode (default)
VITE_USE_API_ENDPOINT=false
VITE_API_BASE_URL=http://localhost:3000

# Optional (for database)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
```

### Available Scripts

```json
{
  "dev": "vite",              // Start dev server
  "build": "vite build",      // Production build
  "preview": "vite preview"   // Preview production build
}
```

---

## 🔐 Security

- ✅ API keys stored in serverless environment variables
- ✅ Never exposed in client-side code (production mode)
- ✅ CORS configured for specific origins
- ✅ Rate limiting enabled (10 req/15min per IP)
- ✅ Input validation (video size, WSDC weights)
- ✅ HTTPS enforced (automatic with Vercel)

---

## 📈 Monitoring

### Vercel Dashboard
- Request volume and error rates
- p95 latency (target: <15s)
- Bandwidth usage

### Gemini API
- Token usage tracking
- Quota monitoring at [Google AI Studio](https://aistudio.google.com/app/apikey)

### Optional: Supabase Analytics
- Debate count and winner statistics
- Leaderboard rankings
- Processing time analysis

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| TypeScript errors | ✅ Fixed - `vite-env.d.ts` added |
| API 500 error | Check Vercel logs: `vercel logs` |
| CORS error | Verify `VITE_API_BASE_URL` matches domain |
| JSON parsing failed | Check `responseMimeType: 'application/json'` |
| Cold start slow | Expected for first request (2-5s) |

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) "Troubleshooting" section for details.

---

## 🎯 Roadmap

### ✅ Phase 1 (Complete)
- Editable WSDC weights
- Toulmin Model + Fallacy detection
- Structured JSON output
- Production-ready backend
- Complete documentation

### 🔄 Phase 2 (Optional)
- Supabase database integration
- Leaderboard component
- Instagram OAuth flow
- D3.js argument graph visualization

### 📅 Phase 3 (Future)
- Manim video export
- Whisper transcription
- Real-time streaming analysis
- Multi-language support

---

## 📞 Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **Supabase**: https://supabase.com/docs
- **LangChain.js**: https://js.langchain.com/docs

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎉 Status

**✅ Production Ready - Deploy Now!**

```powershell
vercel --prod
```

---

**Last Updated**: 2026-01-19  
**Version**: 1.0.0  
**Tech Stack**: React 19 | TypeScript 5.8 | Vite 6.2 | Gemini API 1.35.0
