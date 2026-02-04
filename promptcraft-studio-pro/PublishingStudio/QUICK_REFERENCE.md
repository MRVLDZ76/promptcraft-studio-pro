# 📚 Publishing Studio - Quick Reference

## 🚀 Quick Start

### Start Development Server
```bash
cd promptcraft-studio-pro
npm run dev
# Navigate to http://localhost:5173/publishing
```

### Environment Setup
```bash
# .env file
VITE_DJANGO_API_URL=http://localhost:8000
```

---

## 🎯 Component Usage

### **1. Creating a New Book**
```typescript
import CreateBookWizard from './components/CreateBookWizard';

<CreateBookWizard
  onClose={() => setShowWizard(false)}
  onBookCreated={(bookId) => {
    setSelectedBookId(bookId);
    setShowWizard(false);
  }}
/>
```

### **2. Displaying Book List**
```typescript
import BookList from './components/BookList';

<BookList
  books={books}
  onBookSelect={(id) => setSelectedBookId(id)}
  onRefresh={() => loadBooks()}
/>
```

### **3. Editing a Book**
```typescript
import BookEditor from './components/BookEditor';

<BookEditor
  bookId={selectedBookId}
  onBack={() => setSelectedBookId(null)}
/>
```

### **4. Real-Time Progress**
```typescript
import GenerationDashboard from './components/GenerationDashboard';

<GenerationDashboard bookId={bookId} />
// Auto-polls status every 3 seconds
// Stops when completed or failed
```

### **5. Block Editor**
```typescript
import BlockEditor from './components/BlockEditor';

<BlockEditor
  bookId={bookId}
  block={selectedBlock}
  onBlockUpdated={() => refreshBlocks()}
/>
```

---

## 📡 API Service Functions

### **Books**
```typescript
import {
  getBookProjects,
  getBookProject,
  createBookProject,
  updateBookProject,
  deleteBookProject,
  regenerateBook,
  getBookStatus,
  exportBook,
} from './services/publishingService';

// List all books
const books = await getBookProjects();

// Get single book
const book = await getBookProject(bookId);

// Create new book
const newBook = await createBookProject({
  title: 'My Novel',
  author_name: 'John Doe',
  project_type: ProjectType.NOVEL,
  default_processing_mode: ProcessingMode.CREATIVE,
  user_prompt: 'Create a 10-chapter fantasy epic...',
  // ... more fields
});

// Update book
await updateBookProject(bookId, {
  title: 'Updated Title',
});

// Regenerate entire book
await regenerateBook(bookId);

// Get detailed status
const status = await getBookStatus(bookId);

// Export book
const blob = await exportBook(bookId, 'pdf');
// Use blob for download
```

### **Chapters**
```typescript
import {
  getChapters,
  getChapter,
  updateChapter,
  regenerateChapter,
} from './services/publishingService';

// Get all chapters
const chapters = await getChapters(bookId);

// Get single chapter
const chapter = await getChapter(bookId, chapterId);

// Update chapter
await updateChapter(bookId, chapterId, {
  title: 'New Chapter Title',
});

// Regenerate all blocks in chapter
await regenerateChapter(bookId, chapterId);
```

### **Blocks**
```typescript
import {
  getBlocks,
  getBlock,
  updateBlock,
  regenerateBlock,
  estimateBlockCost,
} from './services/publishingService';

// Get all blocks in chapter
const blocks = await getBlocks(bookId, chapterId);

// Get single block
const block = await getBlock(bookId, chapterId, blockId);

// Update block
await updateBlock(bookId, chapterId, blockId, {
  input_text: 'New content...',
  processing_mode: ProcessingMode.ENHANCE,
});

// Regenerate block with new mode
await regenerateBlock(bookId, chapterId, blockId, {
  processing_mode: ProcessingMode.REIMAGINE,
});

// Estimate cost
const { estimated_credits } = await estimateBlockCost(
  bookId,
  chapterId,
  blockId,
  ProcessingMode.CREATIVE
);
```

### **Long Polling**
```typescript
import { pollBookStatus } from './services/publishingService';

// Start polling
const stopPolling = pollBookStatus(bookId, (statusUpdate) => {
  console.log('Progress:', statusUpdate.completion_percentage);
  setStatus(statusUpdate);
  
  if (statusUpdate.status === 'completed') {
    console.log('Book generation complete!');
  }
});

// Stop polling manually
stopPolling();
```

---

## 🎨 TypeScript Types

### **Enums**
```typescript
import {
  ProjectType,
  ProcessingMode,
  BlockStatus,
  BookStatus,
} from './types';

// Project Types
ProjectType.NOVEL
ProjectType.TEXTBOOK
ProjectType.BIOGRAPHY
ProjectType.SELF_HELP
ProjectType.TECHNICAL_MANUAL
ProjectType.POETRY
ProjectType.CHILDRENS_BOOK

// Processing Modes
ProcessingMode.PRESERVE  // 0 credits
ProcessingMode.POLISH    // 1 credit
ProcessingMode.ENHANCE   // 2 credits
ProcessingMode.CREATIVE  // 3 credits
ProcessingMode.REIMAGINE // 5 credits

// Block Status
BlockStatus.PENDING
BlockStatus.PROCESSING
BlockStatus.COMPLETED
BlockStatus.FAILED

// Book Status
BookStatus.DRAFT
BookStatus.GENERATING
BookStatus.COMPLETED
BookStatus.FAILED
```

### **Interfaces**
```typescript
import type {
  BookProject,
  Chapter,
  ContentBlock,
  BookProjectCreate,
  BookStatusDetail,
  ReimagineParameters,
} from './types';

// Full book object
const book: BookProject = {
  id: 1,
  user: 1,
  title: 'My Book',
  subtitle: 'A Journey',
  author_name: 'Author',
  description: 'Description...',
  project_type: ProjectType.NOVEL,
  status: BookStatus.COMPLETED,
  default_processing_mode: ProcessingMode.CREATIVE,
  global_context: 'Character: John...',
  // ... 20+ more fields
};

// Chapter object
const chapter: Chapter = {
  id: 1,
  book: 1,
  title: 'Chapter One',
  order_index: 0,
  processing_mode: ProcessingMode.CREATIVE, // Optional override
  // ...
};

// Block object
const block: ContentBlock = {
  id: 1,
  chapter: 1,
  book: 1,
  order_index: 0,
  input_text: 'Original text...',
  processed_text: 'AI-transformed text...',
  processing_mode: ProcessingMode.CREATIVE,
  status: BlockStatus.COMPLETED,
  image_url: 'https://...',
  audio_url: 'https://...',
  audio_duration: 120,
  // ...
};
```

### **Constants**
```typescript
import {
  PROJECT_TYPE_LABELS,
  PROCESSING_MODE_LABELS,
  PROCESSING_MODE_DESCRIPTIONS,
  PROCESSING_MODE_COSTS,
  VOICE_OPTIONS,
  DEFAULT_IMAGE_STYLES,
} from './types';

// Labels
PROJECT_TYPE_LABELS[ProjectType.NOVEL] // "Novel"
PROCESSING_MODE_LABELS[ProcessingMode.CREATIVE] // "Creative"

// Descriptions
PROCESSING_MODE_DESCRIPTIONS[ProcessingMode.ENHANCE]
// "Improve style, vocabulary, and flow while maintaining..."

// Costs
PROCESSING_MODE_COSTS[ProcessingMode.REIMAGINE] // 5

// Voice options
VOICE_OPTIONS // [{ value: 'alloy', label: 'Alloy (Neutral)' }, ...]

// Image styles
DEFAULT_IMAGE_STYLES // ['photorealistic', 'digital art', ...]
```

---

## 🔄 Common Workflows

### **Workflow 1: Create Book and Monitor Progress**
```typescript
// 1. Create book
const book = await createBookProject({
  title: 'My Novel',
  author_name: 'Jane Doe',
  project_type: ProjectType.NOVEL,
  default_processing_mode: ProcessingMode.CREATIVE,
  global_context: 'Protagonist: Sarah (female, 30s, detective)',
  enable_images: true,
  enable_audio: true,
  user_prompt: 'Create a 10-chapter mystery novel...',
});

// 2. Start polling
const stopPolling = pollBookStatus(book.id, (status) => {
  console.log(`Progress: ${status.completion_percentage}%`);
  console.log(`Step: ${status.current_step}`);
  console.log(`Blocks: ${status.completed_blocks}/${status.total_blocks}`);
});

// 3. Wait for completion (polling auto-stops)
```

### **Workflow 2: Edit Block and Regenerate**
```typescript
// 1. Load block
const block = await getBlock(bookId, chapterId, blockId);

// 2. Update input text
await updateBlock(bookId, chapterId, blockId, {
  input_text: 'Revised content...',
});

// 3. Change mode and regenerate
await regenerateBlock(bookId, chapterId, blockId, {
  processing_mode: ProcessingMode.REIMAGINE,
});

// 4. Poll for completion
const status = await getBookStatus(bookId);
// Check status.blocks to see block progress
```

### **Workflow 3: Export All Formats**
```typescript
// Wait for book to complete
const book = await getBookProject(bookId);
if (book.status !== BookStatus.COMPLETED) {
  throw new Error('Book not ready for export');
}

// Export each format
const formats = ['pdf', 'epub', 'html', 'audiobook'];
for (const format of formats) {
  if (book[`${format}_url`]) {
    const blob = await exportBook(bookId, format);
    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title}.${format}`;
    a.click();
  }
}
```

---

## 🎯 Processing Mode Guidelines

| Mode | Use Case | Temperature | Cost |
|------|----------|-------------|------|
| **PRESERVE** | Keep exact original text | - | 0 |
| **POLISH** | Fix grammar/typos only | 0.2 | 1 |
| **ENHANCE** | Improve style & clarity | 0.5 | 2 |
| **CREATIVE** | Add flair & personality | 0.7 | 3 |
| **REIMAGINE** | Complete transformation | 0.9 | 5 |

**Examples:**

**POLISH:**
- Input: "He walk to store buy milk"
- Output: "He walked to the store to buy milk"

**ENHANCE:**
- Input: "The man was sad"
- Output: "The weathered man's expression betrayed a profound melancholy"

**CREATIVE:**
- Input: "It was raining"
- Output: "Silver needles of rain danced across the pavement like a thousand tiny ballerinas"

**REIMAGINE:**
- Input: "The meeting was boring"
- Output: "Time itself seemed to congeal in that airless conference room, each minute stretching into an eternity of PowerPoint slides and corporate jargon"

---

## 🔧 Configuration

### **Required Environment Variables**
```env
VITE_DJANGO_API_URL=http://localhost:8000
```

### **Optional Settings**
```typescript
// In publishingService.ts

// Change polling interval (default: 3000ms)
const POLL_INTERVAL = 5000; // 5 seconds

// Change API timeout
const API_TIMEOUT = 30000; // 30 seconds
```

---

## 🐛 Common Issues

### **Issue 1: API 401 Unauthorized**
**Cause:** Missing or expired JWT token

**Solution:**
```typescript
// Ensure user is logged in
const token = localStorage.getItem('access_token');
if (!token) {
  // Redirect to login
  window.location.href = '/login';
}
```

### **Issue 2: Polling Never Stops**
**Cause:** Book stuck in GENERATING status

**Solution:**
```typescript
// Manually stop polling
const stopPolling = pollBookStatus(bookId, callback);
// Later...
stopPolling();

// Or set timeout
setTimeout(() => {
  stopPolling();
  alert('Generation timeout - please check backend logs');
}, 600000); // 10 minutes
```

### **Issue 3: Export Returns Empty Blob**
**Cause:** File not yet generated or URL expired

**Solution:**
```typescript
// Check if URL exists before exporting
const book = await getBookProject(bookId);
if (!book.pdf_url) {
  alert('PDF not yet generated. Please wait for book to complete.');
  return;
}

// Re-fetch book if URL expired (>24 hours old)
if (isUrlExpired(book.pdf_url)) {
  await regenerateBook(bookId);
}
```

---

## 📊 Performance Tips

### **1. Debounce Input Changes**
```typescript
import { debounce } from 'lodash';

const debouncedSave = debounce(async (text) => {
  await updateBlock(bookId, chapterId, blockId, {
    input_text: text,
  });
}, 1000);

<textarea onChange={(e) => debouncedSave(e.target.value)} />
```

### **2. Batch API Calls**
```typescript
// Load all data in parallel
const [book, chapters, blocks] = await Promise.all([
  getBookProject(bookId),
  getChapters(bookId),
  getBlocks(bookId, chapterId),
]);
```

### **3. Lazy Load Blocks**
```typescript
// Only load blocks for selected chapter
useEffect(() => {
  if (selectedChapterId) {
    loadBlocks(selectedChapterId);
  }
}, [selectedChapterId]);
```

---

## 🎨 Customization

### **Add New Processing Mode**
```typescript
// 1. Add to backend (models.py)
class ProcessingMode(models.TextChoices):
    CUSTOM = 'custom', 'Custom Mode'

// 2. Add to frontend (types.ts)
export enum ProcessingMode {
  CUSTOM = 'custom',
}

export const PROCESSING_MODE_COSTS = {
  [ProcessingMode.CUSTOM]: 4,
};

// 3. Update BlockEditor mode selector
```

### **Add New Project Type**
```typescript
// 1. Add to backend
class ProjectType(models.TextChoices):
    RECIPE_BOOK = 'recipe_book', 'Recipe Book'

// 2. Add to frontend
export enum ProjectType {
  RECIPE_BOOK = 'recipe_book',
}

export const PROJECT_TYPE_LABELS = {
  [ProjectType.RECIPE_BOOK]: 'Recipe Book',
};
```

---

## 📚 Resources

### **Documentation**
- [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md) - Full implementation details
- [Backend API Docs](../backend/apps/publishing/README.md) - API reference
- [Phase 1 Summary](../PHASE_1_COMPLETE.md) - Backend architecture

### **Backend Code**
- Models: `backend/apps/publishing/models.py`
- Tasks: `backend/apps/publishing/tasks.py`
- Views: `backend/apps/publishing/views.py`

### **Frontend Code**
- Types: `PublishingStudio/types.ts`
- API Service: `PublishingStudio/services/publishingService.ts`
- Components: `PublishingStudio/components/`

---

*Happy Publishing! 📚✨*
