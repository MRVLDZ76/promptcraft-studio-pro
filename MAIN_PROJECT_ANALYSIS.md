# PromptCraft Studio Pro - Main Project Analysis

## 🎯 Executive Summary

**PromptCraft Studio Pro** is a comprehensive AI-powered creative suite with a primary focus on **debate/argumentation analysis** (AI Arbiter) and supplementary tools for **prompt engineering, video generation, image editing, audio synthesis, and transcription**.

---

## 🏗️ Project Architecture

### **Primary Mode: AI Arbiter (Debate Analysis Studio)**
The flagship feature - a sophisticated debate analysis system with:
- **Toulmin Model Deconstruction**: 6-component argumentation analysis
- **Fallacy Detection**: 12-type taxonomy
- **WSDC Scoring**: Editable weights (Content/Style/Strategy)
- **RAG Enhancement**: Vector search with Supabase + pgvector
- **Social Media Integration**: YouTube/Instagram creator profiles
- **Live Debate Mode**: Real-time scoring and fact-checking
- **Export System**: JSON, PDF, CSV formats

### **Secondary Modes: Creative Tools**
1. **Prompt Builder**: Image prompt construction with visual ingredients
2. **Veo Video**: Google Veo 2.0 video generation
3. **Storyboard**: Multi-clip sequence planning
4. **Nano Editor**: Image editing with Gemini
5. **AI Speech**: Text-to-speech synthesis
6. **Transcribe**: Audio/video transcription

---

## 📦 Component Inventory

### **Main Components (12 total)**
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `AnalysisStudio.tsx` | Debate analysis UI | WSDC weights, Toulmin model, fallacy detection, RAG, social profiles |
| `Workbench.tsx` | Prompt builder UI | Visual ingredients, character management, style presets |
| `OutputEngine.tsx` | Image generation | Gemini image API, QA linting, history management |
| `VideoStudio.tsx` | Video generation | Veo 2.0, reference images, motion presets |
| `ImageEditor.tsx` | Image editing | Upload + AI editing with Gemini |
| `AudioStudio.tsx` | TTS synthesis | Text-to-speech generation |
| `TranscriptionStudio.tsx` | Transcription | Audio/video → text with Gemini |
| `FactVerificationPanel.tsx` | Fact-checking UI | Tavily/Exa integration, claim verification |
| `LiveDebatePanel.tsx` | Live debate UI | Real-time scoring, fact-checking, speaker diarization |
| `TimestampLink.tsx` | Video navigation | Seekable timestamps, transcript timeline |
| `ChannelVideoSelector.tsx` | YouTube integration | Channel video browsing, selection |
| `VideoSearchModal.tsx` | Video search | SerpAPI YouTube search |

---

## 🔧 Service Inventory

### **Core Services (17 total)**
| Service | Purpose | Dependencies |
|---------|---------|--------------|
| `geminiService.ts` | AI orchestration (text, image, video) | Google Gemini API |
| `geminiServiceRAG.ts` | RAG-enhanced analysis | Gemini + Vector Store |
| `scoringEngine.ts` | WSDC scoring logic | Fallacy detection, Toulmin analysis |
| `supabaseClient.ts` | Database integration | Supabase (PostgreSQL + pgvector) |
| `vectorStoreService.ts` | Embeddings storage/search | Supabase + embeddings |
| `embeddingService.ts` | Text embedding generation | Gemini embeddings API |
| `chunkingService.ts` | Text chunking for RAG | Token-based splitting |
| `inputProcessor.ts` | Multi-source input handling | YouTube, video, text |
| `serpApiService.ts` | YouTube API integration | SerpAPI |
| `tavilyService.ts` | Fact verification | Tavily Search API |
| `factVerificationService.ts` | Claim checking orchestration | Tavily + Exa |
| `socialMediaService.ts` | Creator profiles | YouTube/Instagram APIs |
| `speakerDiarizationService.ts` | Speaker identification | Gemini AI |
| `liveDebateService.ts` | Live debate management | Real-time scoring |
| `multiLanguageService.ts` | Translation support | Gemini translation |
| `exportService.ts` | Data export | JSON, PDF, CSV |
| `langchainService.ts` | LangChain integration | (Placeholder) |

---

## 🎨 UI/UX Architecture

### **Navigation System**
```typescript
Mode {
  ANALYSIS,      // Debate Analysis (Primary)
  IMAGE,         // Prompt Builder
  VIDEO,         // Veo Video
  SEQUENCE,      // Storyboard
  EDIT,          // Image Editor
  AUDIO,         // TTS
  TRANSCRIPTION  // Transcribe
}
```

### **Sidebar Structure**
- **Analysis Group**: Debate Analysis
- **AI Creation Group**: Prompt Builder, Veo Video, Storyboard, Nano Editor, AI Speech, Transcribe
- **Footer**: Dark/Light mode toggle, Export project

### **Color Scheme**
- **Primary**: Neutral scale (50-950)
- **Accent**: Cyan (#00b8ff), Magenta (#bd00ff) for AI Arbiter
- **Dark Mode**: Default enabled
- **Responsive**: Tailwind CSS with dark mode support

---

## 📊 Data Models

### **Main State Structure**
```typescript
interface PromptState {
  subject: string;
  negative: string;
  aspect: string;
  model: string;
  imageSize: '1K' | '2K' | '4K';
  style: { cam, light[], film };
  scene: { setting, action, composition, mood, color };
  detailLevel: 'compact' | 'detailed' | 'ultra';
  customIngredients: string[];
  video: { move, dur, resolution };
}

interface SequenceSegment {
  id: number;
  seconds: number;
  action: string;
  prompt: string;
  cameraMovement: string;
  visualStyle: string;
}

interface Character {
  id: string;
  name: string;
  text: string;
}
```

### **Analysis-Specific Types**
```typescript
interface ArgumentNode {
  id: string;
  timestamp_in: number;
  timestamp_out: number;
  speaker_id: string;
  claim_text_short: string;
  claim_text_full: string;
  toulmin_component: ToulminComponent;
  logic_status: 'VALID' | 'FALLACY' | 'WEAK_EVIDENCE' | 'CONTRADICTION';
  fallacy_type?: FallacyType;
  score_impact: number;
  confidence: number;
}

interface DebateGraphJSON {
  debate_title: string;
  total_duration: number;
  participants: Participant[];
  argument_nodes: ArgumentNode[];
  temporal_scores: TemporalScore[];
  final_verdict: FinalVerdict;
}
```

---

## 🔄 Technology Stack

### **Frontend**
- **Framework**: React 19 + TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Styling**: TailwindCSS 3.4
- **Icons**: Lucide React

### **AI/ML**
- **Primary AI**: Google Gemini API (Flash, Pro, Veo 2.0)
- **Embeddings**: Gemini Text Embeddings
- **Image Gen**: Gemini 3 Pro Image Preview
- **Video Gen**: Gemini Veo 2.0

### **Backend Services**
- **Database**: Supabase (PostgreSQL + pgvector)
- **Vector Search**: pgvector extension
- **APIs**: SerpAPI (YouTube), Tavily (fact-check), YouTube Data API, Instagram API

### **Deployment**
- **Platform**: Vercel (serverless functions)
- **API Routes**: `/api/analyze.js` (Node.js serverless)
- **Client-Side Fallback**: Direct Gemini API for development

---

## 🎯 Core Features Deep Dive

### **1. AI Arbiter (Debate Analysis)**

#### **Toulmin Model Implementation**
```typescript
toulminInstructions = `
  CLAIM: Identify central thesis
  GROUNDS: Audit factual evidence
  WARRANT: Evaluate logical bridge
  BACKING: Verify authority/theory
  MODAL QUALIFIER: Assess certainty degree
  REBUTTAL: Identify counter-arguments
`
```

#### **Fallacy Detection System**
12-type taxonomy:
- Ad Hominem
- Strawman
- Slippery Slope
- False Dilemma
- Appeal to Authority
- Hasty Generalization
- Post Hoc
- Red Herring
- Circular Reasoning
- Appeal to Emotion
- Bandwagon
- No True Scotsman

#### **WSDC Scoring (Editable Weights)**
```typescript
wsdcWeights: {
  content: 40,   // Factual accuracy, evidence quality
  style: 40,     // Rhetoric, delivery, persuasiveness
  strategy: 20   // Argumentation structure, rebuttals
}
// Total must equal 100%
```

#### **RAG Pipeline**
```
User Input → Input Processor → Chunking → Embeddings → Vector Store
                                                            ↓
                                                      Similarity Search
                                                            ↓
                                              Context Injection → Gemini
```

#### **Social Media Integration**
- **YouTube**: Fetch channel info, subscriber count, video metadata
- **Instagram**: Profile data, follower count (API integration ready)
- **Caching**: Supabase storage to reduce API calls

---

### **2. Prompt Builder (Image Mode)**

#### **Visual Ingredients System**
```typescript
CAMERAS: ['ARRI Alexa', 'RED Monstro', 'Canon C70', ...]
LIGHTING: ['Golden Hour', 'Rembrandt', 'High Key', ...]
FILMS: ['Kodachrome 64', 'Cinestill 800T', ...]
COMPOSITIONS: ['Rule of Thirds', 'Dutch Angle', ...]
```

#### **Prompt Construction**
```typescript
buildFinalPrompt() {
  parts = [
    `${subject} in ${setting}, ${action}`,
    composition,
    mood,
    color,
    camera,
    ...lighting,
    film,
    ...customIngredients
  ];
  return parts.join(', ') + aspect + negative;
}
```

#### **QA Linting**
- Empty subject warning
- Static video detection
- Generic style alerts

---

### **3. Veo Video Studio**

#### **Video Generation**
- **Model**: Gemini Veo 2.0
- **Resolution**: 720p
- **Duration**: 8 seconds per clip
- **Features**: Reference image support, motion presets, style presets

#### **Motion Presets**
```typescript
['Static', 'Slow Push In', 'Dolly Out', 'Pan Left', 'Pan Right', 
 'Tilt Up', 'Tilt Down', 'Orbit', 'Crane Up', 'Handheld Shake']
```

#### **Style Presets**
```typescript
['Cinematic', 'Documentary', 'Vintage Film', 'Cyberpunk', 
 'Anime', 'Time-lapse', 'Slow Motion', 'Drone Aerial']
```

---

### **4. Storyboard/Sequence Planning**

#### **AI-Powered Sequence Generation**
```typescript
generateSequence(narrative, totalSeconds, clipLength, style, motion)
→ SequenceSegment[]
```

#### **Features**
- Drag-and-drop reordering
- Manual segment addition
- Per-clip prompt customization
- Camera movement + visual style per segment

---

## 💾 Storage & Persistence

### **Client-Side Storage**
```typescript
localStorage:
  - 'prompt_studio_v4': PromptState
  - 'ps_chars_v4': Character[]
  - 'theme_preference': 'dark' | 'light'
```

### **Supabase Schema**
```sql
-- Debates table
CREATE TABLE debates (
  id UUID PRIMARY KEY,
  debate_title TEXT,
  video_url TEXT,
  transcript TEXT,
  gamification JSONB,
  scores JSONB,
  argument_nodes JSONB,
  temporal_scores JSONB,
  final_verdict JSONB,
  created_at TIMESTAMP
);

-- Vector embeddings
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY,
  content TEXT,
  embedding vector(768),
  source_url TEXT,
  chunk_index INTEGER
);

-- Creator profiles
CREATE TABLE creator_profiles (
  platform TEXT,
  username TEXT,
  profile_data JSONB,
  cached_at TIMESTAMP,
  PRIMARY KEY (platform, username)
);
```

---

## 🔐 API Keys & Environment

### **Required Keys**
```env
GEMINI_API_KEY=...          # Google AI Studio
SUPABASE_URL=...            # Supabase project
SUPABASE_ANON_KEY=...       # Supabase public key
SERPAPI_KEY=...             # YouTube search
TAVILY_API_KEY=...          # Fact verification
```

### **Optional Keys**
```env
YOUTUBE_API_KEY=...         # YouTube Data API
INSTAGRAM_API_KEY=...       # Instagram Graph API
EXA_API_KEY=...             # Exa search (fact-check)
```

### **Deployment Modes**
```env
VITE_USE_API_ENDPOINT=true/false  # Toggle client/server mode
VITE_API_BASE_URL=...             # Backend URL for production
```

---

## 🚀 Deployment Architecture

### **Production Flow**
```
Client (Browser)
    ↓
Vite Build (Static Assets)
    ↓
Vercel Edge Network
    ↓
/api/analyze.js (Serverless Function)
    ↓
Gemini API + Supabase + External APIs
```

### **Cost Estimate (from docs)**
- **Gemini Flash**: $35/month for 10K analyses
- **Supabase**: Free tier (500MB, 50MB storage)
- **SerpAPI**: $50/month (5K searches)
- **Tavily**: $50/month (1K searches)
- **Total**: ~$135/month at scale

---

## 🎨 Design System

### **Typography**
- **Primary Font**: System font stack
- **Sizes**: xs (10px) → 3xl (30px)
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### **Spacing**
- **Grid**: 4px base unit
- **Gaps**: 2, 3, 4, 6, 8, 12, 16, 24
- **Padding**: Consistent with Tailwind scale

### **Components**
- **Buttons**: Rounded-lg, hover states, disabled states
- **Inputs**: Border, focus ring, dark mode support
- **Cards**: Border, shadow, hover effects
- **Modals**: Backdrop blur, z-index management

---

## 🔍 Unique Selling Points

### **AI Arbiter Differentiators**
1. **Editable WSDC Weights**: Dynamic scoring calibration
2. **Toulmin Model**: Academic-grade argumentation analysis
3. **Mind Palace UI**: Sherlock-style chain-of-thought visualization
4. **RAG Enhancement**: Context-aware analysis with vector search
5. **Social Media Profiles**: Creator credibility context
6. **Live Debate Mode**: Real-time scoring + fact-checking
7. **Transparent AI**: "Crystal Box" - all prompts/weights visible

### **Creative Tools Differentiators**
1. **Visual Ingredients**: Modular prompt construction
2. **Veo 2.0 Integration**: Cutting-edge video generation
3. **Storyboard Planning**: Multi-clip sequence orchestration
4. **QA Linting**: Prompt quality analysis

---

## ⚠️ Current Limitations

### **Technical**
1. **No Multi-User Support**: Single-session localStorage
2. **Limited Video Quality**: Veo 2.0 constraints (8s clips)
3. **Client-Side Processing**: Heavy browser workload in dev mode
4. **API Rate Limits**: SerpAPI, Tavily quotas
5. **No Offline Mode**: Requires internet for AI features

### **Functional**
1. **No Project Sharing**: Export-only, no collaboration
2. **Limited Export Formats**: JSON/PDF/CSV only
3. **No Asset Management**: Generated media not stored long-term
4. **Manual RAG URL Input**: No auto-crawling
5. **Instagram Integration**: Framework only, not fully implemented

---

## 📈 Scalability Opportunities

### **Backend Enhancements**
1. **User Authentication**: Multi-user support with Supabase Auth
2. **Project Database**: Persistent project storage
3. **Asset CDN**: Cloud storage for generated media
4. **Background Jobs**: Queue system for heavy processing
5. **WebSocket Support**: Real-time collaboration

### **AI/ML Improvements**
1. **Fine-Tuned Models**: Domain-specific models for debate analysis
2. **Auto-RAG**: Intelligent source discovery
3. **Multimodal Analysis**: Video + audio + text combined
4. **Sentiment Analysis**: Emotional tone tracking
5. **Bias Detection**: Implicit bias identification

### **UX Enhancements**
1. **Mobile Responsiveness**: Better mobile UI
2. **Keyboard Shortcuts**: Power-user workflows
3. **Template Library**: Pre-built prompts/analysis configs
4. **Undo/Redo**: Global state management
5. **Collaborative Editing**: Real-time multi-user

---

## 🔗 Integration Ecosystem

### **Current Integrations**
- ✅ Google Gemini (text, image, video, embeddings)
- ✅ Supabase (database, storage, auth framework)
- ✅ SerpAPI (YouTube search)
- ✅ Tavily (fact verification)
- ✅ YouTube Data API (creator profiles)
- 🔄 Instagram Graph API (framework ready)
- 🔄 Exa Search API (fact-check alternative)

### **Potential Integrations**
- 📋 Twitter/X API (social profile expansion)
- 📋 Reddit API (community sentiment)
- 📋 Discord Bot (analysis in Discord servers)
- 📋 Slack Integration (team collaboration)
- 📋 Notion API (export to Notion)
- 📋 Google Drive (asset storage)
- 📋 FFmpeg (advanced video processing)

---

## 🎓 Technical Highlights

### **TypeScript Excellence**
- Strong typing across all components
- Enum-based mode management
- Interface-driven data structures
- Type guards for safety

### **React Best Practices**
- Functional components with hooks
- Proper dependency arrays
- Memoization with useCallback
- Conditional rendering patterns

### **AI Prompt Engineering**
- Multi-step reasoning (chain-of-thought)
- Structured JSON output enforcement
- Category-specific context injection
- Fallacy detection via counterargument generation

### **Vector Search Implementation**
```typescript
// Embedding generation
embedding = await generateEmbedding(text)

// Storage with metadata
await supabase
  .from('document_embeddings')
  .insert({ content, embedding, source_url })

// Similarity search
const { data } = await supabase.rpc('match_documents', {
  query_embedding: queryEmbedding,
  match_threshold: 0.7,
  match_count: 5
})
```

---

## 📝 Summary

**PromptCraft Studio Pro** is a **production-ready, AI-powered creative suite** with:

### **Strengths**
- ✅ Sophisticated debate analysis (AI Arbiter)
- ✅ Modular architecture (easy to extend)
- ✅ Strong TypeScript typing
- ✅ RAG-enhanced AI processing
- ✅ Dual deployment modes (client/server)
- ✅ Comprehensive documentation
- ✅ Production deployment ready (Vercel)

### **Focus Areas**
- 🎯 **Primary**: Debate/argumentation analysis
- 🎯 **Secondary**: Creative prompt engineering tools

### **Best For**
- Academic debate analysis
- Fact-checking and fallacy detection
- AI-powered video/image generation
- Prompt engineering workflows
- Educational content creation

### **Unique Value**
- Transparent AI reasoning ("Crystal Box")
- Editable WSDC scoring weights
- Toulmin Model implementation
- RAG-enhanced contextual analysis
- Multi-modal input processing (video, audio, text, URLs)

