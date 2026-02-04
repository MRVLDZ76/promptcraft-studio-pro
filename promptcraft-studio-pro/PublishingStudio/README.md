# 📚 Publishing Studio

> AI-Powered Multi-Modal Book Creation Platform

**Transform ideas into professional multi-format publications with AI assistance.**

---

## 🌟 Overview

Publishing Studio is a complete book creation platform that leverages AI to:
- Generate structured content from prompts
- Transform text with 5 processing modes (Preserve → Reimagine)
- Create consistent illustrations with character persistence
- Generate TTS audio narration
- Export to PDF, EPUB, HTML, and audiobook formats

---

## ✨ Key Features

### **1. Block-Based Content Architecture**
Edit content at a granular level with independent processing per block:
- Input text (original content)
- Processed text (AI-transformed)
- Generated image (optional)
- Audio narration (optional)

### **2. Five Processing Modes**
Choose the right level of AI transformation:

| Mode | Temperature | Cost | Use Case |
|------|-------------|------|----------|
| **PRESERVE** | - | 0 | Keep original text exactly |
| **POLISH** | 0.2 | 1 | Fix grammar/typos only |
| **ENHANCE** | 0.5 | 2 | Improve style & clarity |
| **CREATIVE** | 0.7 | 3 | Add personality & flair |
| **REIMAGINE** | 0.9 | 5 | Complete transformation |

### **3. Global Context Injection**
Maintain narrative consistency across all chapters:
```
Global Context Example:
- Protagonist: Captain Sarah Chen (female, 35, cybernetic eye)
- Setting: Mars colony "New Shanghai" in 2157
- Tone: Dark, suspenseful, cyberpunk
```
This context is automatically injected into every AI transformation.

### **4. Character Visual Consistency**
Images use a consistent random seed to ensure:
- Same characters look identical across chapters
- Setting details remain consistent
- Art style stays uniform

### **5. Real-Time Progress Tracking**
Monitor book generation with:
- Overall completion percentage
- Block-level status grid
- Failed block identification
- Time estimation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ with Django backend running
- Redis server for Celery tasks

### Installation

```bash
# Install dependencies
cd promptcraft-studio-pro
npm install

# Set environment variables
echo "VITE_DJANGO_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

### Start Backend Services
```bash
# Terminal 1: Django
cd backend
python manage.py runserver

# Terminal 2: Celery
celery -A config worker -l info

# Terminal 3: Redis
redis-server
```

---

## 📖 Usage

### Creating a Book

**Step 1: Basic Information**
```typescript
{
  title: "The Mars Chronicles",
  author_name: "Jane Doe",
  project_type: ProjectType.NOVEL,
  description: "A sci-fi thriller set on Mars"
}
```

**Step 2: AI Configuration**
```typescript
{
  default_processing_mode: ProcessingMode.CREATIVE,
  global_context: `
    Protagonist: Captain Sarah Chen (35, cybernetic eye)
    Setting: Mars colony "New Shanghai" 2157
    Tone: Dark suspenseful cyberpunk
  `,
  enable_images: true,
  image_style: 'digital art',
  enable_audio: true,
  voice_model: 'alloy'
}
```

**Step 3: Output Formats**
```typescript
{
  generate_pdf: true,
  generate_epub: true,
  generate_html: true,
  generate_audiobook: false // Costs 50 credits
}
```

**Step 4: Generation Prompt**
```
Create a 10-chapter sci-fi thriller about a detective investigating 
murders in a Mars colony. Each chapter should be 2,000-3,000 words. 
Include detailed character development, plot twists, and atmospheric 
descriptions of the Martian environment.
```

### Monitoring Progress

The GenerationDashboard shows:
- Overall: 45% complete
- Current Step: "Processing blocks (23/50)"
- Failed Blocks: 2 (with error messages)
- ETA: 12 minutes remaining

### Editing Blocks

1. Select chapter from sidebar
2. Choose block from list
3. Options:
   - Edit input text
   - Change processing mode
   - Regenerate with new settings
   - View generated assets

---

## 🎨 Component Architecture

```
PublishingStudio/
├── App.tsx                    # Main router
├── types.ts                   # TypeScript definitions
├── services/
│   └── publishingService.ts   # API integration
└── components/
    ├── BookList.tsx           # Grid of books
    ├── CreateBookWizard.tsx   # 4-step creation form
    ├── BookEditor.tsx         # Chapter + block navigation
    ├── BlockEditor.tsx        # Single block editor
    └── GenerationDashboard.tsx # Progress tracking
```

---

## 🔌 API Integration

### Service Functions

```typescript
import {
  getBookProjects,
  createBookProject,
  getBookStatus,
  exportBook,
  updateBlock,
  regenerateBlock,
  pollBookStatus,
} from './services/publishingService';

// Create book
const book = await createBookProject(data);

// Monitor progress
pollBookStatus(book.id, (status) => {
  console.log(`${status.completion_percentage}% complete`);
});

// Edit block
await updateBlock(blockId, {
  input_text: 'New content...',
  processing_mode: ProcessingMode.ENHANCE,
});

// Export
const blob = await exportBook(bookId, 'pdf');
```

### Endpoints Used
```
POST   /api/v1/publishing/projects/
GET    /api/v1/publishing/projects/{id}/
GET    /api/v1/publishing/projects/{id}/status/
GET    /api/v1/publishing/projects/{id}/export/?format=pdf

GET    /api/v1/publishing/blocks/?chapter={id}
PATCH  /api/v1/publishing/blocks/{id}/
POST   /api/v1/publishing/blocks/{id}/regenerate/
```

---

## 💰 Credit System

### Processing Modes
- PRESERVE: **0 credits** (no AI call)
- POLISH: **1 credit** per block
- ENHANCE: **2 credits** per block
- CREATIVE: **3 credits** per block
- REIMAGINE: **5 credits** per block

### Assets
- Image generation: **10 credits** per image
- Audio narration: **5 credits** per block

### Exports
- PDF: **5 credits**
- EPUB: **5 credits**
- HTML: **FREE**
- Full audiobook: **50 credits**

### Example Book Cost
10 chapters × 5 blocks × CREATIVE mode (3 credits):
- Base text: 150 credits
- Images: 500 credits (50 blocks × 10)
- Audio: 250 credits (50 blocks × 5)
- PDF + EPUB: 10 credits
- **Total: ~910 credits**

---

## 🎯 Best Practices

### Writing Effective Prompts
✅ **Good:**
```
Create a 12-chapter Python programming course. Start with basics 
(variables, loops) and progress to advanced topics (decorators, async).
Each chapter should have 3-5 code examples and practice exercises.
Target audience: beginners with no programming experience.
```

❌ **Bad:**
```
Make a Python book.
```

### Using Global Context
✅ **Good:**
```
Characters:
- Alex (protagonist, 28, software engineer, anxiety issues)
- Maya (mentor, 45, calm, wise)

Setting: Tech startup in San Francisco, 2024

Tone: Realistic, occasionally humorous, introspective
```

❌ **Bad:**
```
Some characters in a city.
```

### Choosing Processing Modes
- **PRESERVE**: Legal documents, code snippets, quotes
- **POLISH**: Academic writing, technical manuals
- **ENHANCE**: Business books, blog posts
- **CREATIVE**: Novels, marketing copy, storytelling
- **REIMAGINE**: Poetry, experimental fiction, complete rewrites

---

## 🐛 Troubleshooting

### Issue: Book Stuck at 0%
**Solution:** Check Celery worker is running and connected to Redis.

### Issue: Images Look Different Each Chapter
**Solution:** Ensure `global_context` includes character descriptions.

### Issue: Export Returns 404
**Solution:** Wait for status to be COMPLETED before exporting.

### Issue: Long Polling Never Stops
**Solution:** Check browser console for errors. Stop manually if needed:
```typescript
const stopPolling = pollBookStatus(bookId, callback);
// Later...
stopPolling();
```

---

## 📊 Performance Tips

### 1. Batch API Calls
```typescript
const [book, chapters, blocks] = await Promise.all([
  getBookProject(bookId),
  getChapters(bookId),
  getBlocks(chapterId),
]);
```

### 2. Lazy Load Blocks
Only fetch blocks for the selected chapter, not all at once.

### 3. Debounce Input Changes
Wait 1 second after typing before saving.

### 4. Use PRESERVE Mode for Unchanged Content
Saves credits and processing time.

---

## 📚 Documentation

- **[PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md)** - Full technical details
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - API usage guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Project overview

---

## 🤝 Contributing

### Adding New Features

**1. New Processing Mode**
```typescript
// types.ts
export enum ProcessingMode {
  EXPERIMENTAL = 'experimental',
}

export const PROCESSING_MODE_COSTS = {
  [ProcessingMode.EXPERIMENTAL]: 7,
};
```

**2. New Project Type**
```typescript
export enum ProjectType {
  COOKBOOK = 'cookbook',
}

export const PROJECT_TYPE_LABELS = {
  [ProjectType.COOKBOOK]: 'Cookbook',
};
```

**3. New Component**
```typescript
// components/MyNewComponent.tsx
import React from 'react';
import type { BookProject } from '../types';

interface MyNewComponentProps {
  book: BookProject;
}

const MyNewComponent: React.FC<MyNewComponentProps> = ({ book }) => {
  return <div>{book.title}</div>;
};

export default MyNewComponent;
```

---

## 🔐 Security

- JWT authentication on all API requests
- User-scoped queries (backend filters by user)
- Error messages don't expose internal details
- File downloads use blob URLs (auto-expire)

---

## 🎓 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Heroicons** - Icon library
- **TailwindCSS** - Styling (if configured)
- **Vite** - Build tool
- **Django REST** - Backend API
- **Celery** - Task queue
- **Redis** - Message broker

---

## 📈 Roadmap

### Planned Features
- [ ] Drag-and-drop chapter reordering
- [ ] Bulk block regeneration
- [ ] Template library (story structures)
- [ ] Real-time collaboration (WebSockets)
- [ ] Version history/snapshots
- [ ] AI writing assistant (inline suggestions)
- [ ] Grammar/spell check integration
- [ ] Chapter outline editor
- [ ] Character database
- [ ] Plot arc visualization

---

## 📄 License

Copyright © 2026 PromptStudio. All rights reserved.

---

## 🙏 Acknowledgments

Built with:
- **Google Gemini** - Text transformation
- **OpenAI DALL-E 3** - Image generation
- **OpenAI TTS** - Audio narration
- **Django** - Backend framework
- **React** - Frontend framework

---

## 📞 Support

For issues or questions:
1. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. Review [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md)
3. Check browser console for errors
4. Verify backend services are running

---

**Happy Publishing! 📚✨**

*Transform your ideas into professional publications with AI.*
