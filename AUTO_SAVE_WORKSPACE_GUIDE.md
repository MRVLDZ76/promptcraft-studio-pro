# Auto-Save & Workspace Persistence Guide

## 🛡️ Protection Against Data Loss

Your work is automatically saved every second you type - no more lost progress from crashes, blackouts, or accidental refreshes.

---

## 🚀 Features

### ✅ Auto-Save (Both Studios)
- **Immediate First Save**: Saves draft as soon as you make the first change
- **Debounced Updates**: Auto-saves 1 second after you stop typing
- **Background Saving**: Non-blocking - you keep working while it saves
- **Visual Feedback**: Shows "Saving..." / "Saved X seconds ago" status
- **Error Recovery**: Falls back to local storage if server fails
- **Page Unload Protection**: Uses `navigator.sendBeacon` for reliable save on page close

### ✅ Local Storage Fallback
- **Offline Draft Storage**: Saves to browser if server is down
- **Recovery on Refresh**: Offers to restore unsaved work when you return
- **No Server Required**: Works even without internet
- **Cross-Tab Sync**: Shares drafts across browser tabs

### ✅ Unified Workspace Dashboard
- **All Projects in One View**: Books + Video Analyses
- **Status Tracking**: Draft, In Progress, Completed, Failed
- **Smart Filters**: Filter by type, status, or search
- **Resume Anywhere**: Click any project to continue where you left off
- **Last Edited Timestamps**: "2h ago", "Just now", etc.
- **Progress Indicators**: Visual progress bars for active projects

---

## 📁 Implementation Details

### Backend Models

#### Publishing Studio (Books)
```python
# backend/apps/publishing/models.py
class BookProject(models.Model):
    # Status tracking
    status = models.CharField(
        choices=[
            ('DRAFT', 'Draft'),
            ('GENERATING', 'Generating'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed')
        ],
        default='DRAFT'
    )
    progress_percentage = models.IntegerField(default=0)
    
    # Cover & Publishing fields (NEW)
    cover_image_url = models.URLField(blank=True)
    cover_prompt = models.TextField(blank=True)
    back_cover_text = models.TextField(blank=True)
    author_bio = models.TextField(blank=True)
    dedication = models.TextField(blank=True)
    acknowledgments = models.TextField(blank=True)
    isbn = models.CharField(max_length=20, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    copyright_year = models.IntegerField(null=True, blank=True)
    edition = models.CharField(max_length=50, blank=True, default='1st Edition')
    
    # Auto-generated fields
    user_prompt = models.TextField(blank=True)
    image_style_custom = models.TextField(blank=True)
    reference_images = models.JSONField(default=list)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Auto-updates on save
    completed_at = models.DateTimeField(null=True)
```

#### Analysis Studio (Debates)
```python
# backend/apps/analyses/models.py
class Debate(models.Model):
    # Status tracking
    analysis_status = models.CharField(
        choices=[
            ('draft', 'Draft'),
            ('analyzing', 'Analyzing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='draft'
    )
    
    # Core fields
    title = models.CharField(max_length=500)
    mode = models.CharField(max_length=20)  # 'arena' or 'monologue'
    video_url = models.URLField(blank=True, null=True)
    transcript_text = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Frontend Auto-Save Hooks

#### Publishing Studio Hook
```typescript
// PublishingStudio/hooks/useAutoSave.ts
import { useAutoSave } from '../hooks/useAutoSave';

const { isSaving, lastSaved, saveNow, saveStatus, errorMessage } = useAutoSave(
  bookId,
  formData,
  {
    debounceMs: 1000,
    enableLocalStorage: true,
    localStorageKey: 'publishing_studio_draft'
  }
);
```

**Features:**
- Debounced saves (default: 1 second)
- Local storage fallback
- Concurrent save prevention
- `navigator.sendBeacon` on page unload
- Returns: `{ isSaving, lastSaved, saveNow, saveStatus, errorMessage }`

#### Analysis Studio Hook
```typescript
// components/hooks/useDebateAutoSave.ts
import { useDebateAutoSave } from '../hooks/useDebateAutoSave';

const { isSaving, lastSaved, saveNow, saveStatus } = useDebateAutoSave(
  debateId,
  debateData,
  { debounceMs: 1000 }
);
```

### Frontend Components

#### Workspace Dashboard
```typescript
// components/WorkspaceDashboard.tsx
<WorkspaceDashboard
  onOpenProject={(project) => {
    // Navigate to Publishing Studio or Analysis Studio
    if (project.type === 'book') {
      navigate('/publishing', { state: { bookId: project.id } });
    } else {
      navigate('/analysis', { state: { debateId: project.id } });
    }
  }}
  onCreateNew={(type) => {
    // Open create wizard
  }}
/>
```

**Features:**
- Unified view of all projects (books + debates)
- Status badges (Draft, In Progress, Completed, Failed)
- Filters: Type (All/Books/Videos), Status, Search
- Last edited timestamps ("2h ago", "Just now")
- Progress bars for active projects
- Quick actions: Export, Duplicate, Delete

#### Save Status Indicator
```typescript
// components/SaveStatusIndicator.tsx
<SaveStatusIndicator
  status={saveStatus}
  lastSaved={lastSaved}
  errorMessage={errorMessage}
/>
```

**Visual States:**
- 🔵 **Saving...** (spinning icon, blue)
- ✅ **Saved 2s ago** (green check, fades to idle after 2s)
- ⚠️ **Save failed** (red warning, shows error message)
- ☁️ **Auto-save enabled** (idle state, gray)

---

## 🔧 API Endpoints

### Publishing Studio
```
GET    /api/v1/publishing/books/          # List all user's books
POST   /api/v1/publishing/books/          # Create new book (auto-saves as draft)
GET    /api/v1/publishing/books/{id}/     # Get book details
PATCH  /api/v1/publishing/books/{id}/     # Update book (auto-save endpoint)
DELETE /api/v1/publishing/books/{id}/     # Delete book
```

### Analysis Studio
```
GET    /api/v1/debates/                   # List all user's debates
POST   /api/v1/debates/                   # Create new debate
GET    /api/v1/debates/{id}/              # Get debate details
PATCH  /api/v1/debates/{id}/              # Update debate (auto-save endpoint)
DELETE /api/v1/debates/{id}/              # Delete debate
```

**Auto-Save Behavior:**
- `PATCH` requests are idempotent
- Only changed fields are sent
- `updated_at` timestamp is automatically updated
- Returns full object after save

---

## 🎯 Usage Examples

### 1. Publishing Studio - Create Book Wizard with Auto-Save

```typescript
import { useAutoSave } from './hooks/useAutoSave';
import SaveStatusIndicator from './components/SaveStatusIndicator';

const CreateBookWizard = () => {
  const [bookId, setBookId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    cover_prompt: '',
    // ... other fields
  });

  // Enable auto-save
  const { isSaving, lastSaved, saveStatus, errorMessage } = useAutoSave(
    bookId,
    formData
  );

  // Create draft on first render
  useEffect(() => {
    const createDraft = async () => {
      const response = await fetch('/api/v1/publishing/books/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Untitled Book',
          status: 'DRAFT'
        })
      });
      const data = await response.json();
      setBookId(data.id);
    };
    
    createDraft();
  }, []);

  return (
    <div>
      {/* Save Status in Header */}
      <div className="flex justify-between items-center mb-4">
        <h2>Create New Book</h2>
        <SaveStatusIndicator
          status={saveStatus}
          lastSaved={lastSaved}
          errorMessage={errorMessage}
        />
      </div>

      {/* Form fields - auto-saved on change */}
      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Book Title"
      />
      
      <textarea
        value={formData.cover_prompt}
        onChange={(e) => setFormData({ ...formData, cover_prompt: e.target.value })}
        placeholder="Cover design prompt..."
      />
    </div>
  );
};
```

### 2. Analysis Studio - Debate with Auto-Save

```typescript
import { useDebateAutoSave } from './hooks/useDebateAutoSave';

const LiveDebatePanel = () => {
  const [debateId, setDebateId] = useState<string | null>(null);
  const [debateData, setDebateData] = useState({
    title: '',
    mode: 'arena',
    video_url: '',
    transcript_text: ''
  });

  const { saveStatus, lastSaved } = useDebateAutoSave(debateId, debateData);

  return (
    <div>
      <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
      
      <input
        value={debateData.title}
        onChange={(e) => setDebateData({ ...debateData, title: e.target.value })}
      />
    </div>
  );
};
```

### 3. Workspace Dashboard - Resume Projects

```typescript
import WorkspaceDashboard from './components/WorkspaceDashboard';

const App = () => {
  const navigate = useNavigate();

  return (
    <WorkspaceDashboard
      onOpenProject={(project) => {
        if (project.type === 'book') {
          // Resume book editing
          navigate(`/publishing/books/${project.id}`);
        } else {
          // Resume debate analysis
          navigate(`/analysis/debates/${project.id}`);
        }
      }}
      onCreateNew={(type) => {
        if (type === 'book') {
          navigate('/publishing/create');
        } else {
          navigate('/analysis/create');
        }
      }}
    />
  );
};
```

---

## 🗂️ Local Storage Structure

### Publishing Studio Draft
```json
{
  "bookId": 123,
  "data": {
    "title": "My Book Title",
    "author_name": "John Doe",
    "cover_prompt": "Minimalist cover with...",
    "back_cover_text": "A gripping tale of...",
    // ... all form fields
  },
  "timestamp": "2026-02-03T22:00:00.000Z"
}
```

**Storage Key:** `publishing_studio_draft`

### Analysis Studio Draft
```json
{
  "debateId": "uuid-here",
  "data": {
    "title": "Debate Title",
    "mode": "arena",
    "video_url": "https://youtube.com/watch?v=...",
    "transcript_text": "..."
  },
  "timestamp": "2026-02-03T22:00:00.000Z"
}
```

**Storage Key:** `analysis_studio_draft`

---

## 🧪 Testing Auto-Save

### Test Scenario 1: Normal Flow
1. Create new book/debate
2. Start typing in any field
3. **Verify**: "Saving..." appears immediately
4. **Verify**: Changes to "Saved just now" after 1 second
5. Refresh page
6. **Verify**: Changes are preserved

### Test Scenario 2: Network Failure
1. Disable network in DevTools
2. Make changes
3. **Verify**: "Save failed" appears with error message
4. **Verify**: Data saved to localStorage
5. Re-enable network
6. **Verify**: Next change triggers successful save
7. **Verify**: localStorage draft is cleared

### Test Scenario 3: Page Close
1. Make changes
2. Close tab immediately (don't wait for save)
3. Reopen page
4. **Verify**: Prompt to restore unsaved work
5. Click "Restore"
6. **Verify**: All changes are present

### Test Scenario 4: Concurrent Edits
1. Open same project in two tabs
2. Edit in Tab 1
3. Switch to Tab 2
4. **Verify**: Tab 2 shows latest changes
5. Edit in Tab 2
6. **Verify**: No data conflicts

---

## ⚙️ Configuration

### Customize Debounce Delay
```typescript
const { saveStatus } = useAutoSave(bookId, formData, {
  debounceMs: 2000  // Wait 2 seconds instead of 1
});
```

### Disable Local Storage
```typescript
const { saveStatus } = useAutoSave(bookId, formData, {
  enableLocalStorage: false
});
```

### Custom Storage Key
```typescript
const { saveStatus } = useAutoSave(bookId, formData, {
  localStorageKey: 'my_custom_draft_key'
});
```

---

## 🚨 Error Handling

### Server Errors
- Auto-save falls back to localStorage
- Error message shown to user
- Next successful change syncs to server
- User can manually retry with `saveNow()`

### Network Errors
- Same as server errors
- Periodic retry attempts (every 10 seconds)
- User notification: "Working offline - changes saved locally"

### localStorage Quota Exceeded
- Oldest drafts are automatically cleared
- User warned if quota is full
- Can disable localStorage fallback

---

## 📊 Status Values

### Book Status
- `DRAFT` - Initial state, editable
- `GENERATING` - AI processing content
- `COMPLETED` - All formats ready
- `FAILED` - Generation error

### Debate Status
- `draft` - Initial state, editable
- `analyzing` - AI analyzing video/transcript
- `completed` - Analysis finished
- `failed` - Analysis error

---

## 🎨 UI/UX Guidelines

### Save Indicator Placement
- **Wizard Forms**: Top-right corner of header
- **Editor Pages**: Next to page title
- **Mobile**: Sticky at top

### Status Messages
- **Saving**: Show immediately, no delay
- **Saved**: Show for 2 seconds, then fade to idle
- **Error**: Show until next successful save
- **Idle**: Subtle gray, "Auto-save enabled"

### User Notifications
- **Draft Recovered**: Show banner with "Restore" button on page load
- **Save Error**: Toast notification with retry button
- **Offline Mode**: Persistent banner until connection restored

---

## 🔐 Security Considerations

1. **Authentication**: All auto-save requests include JWT token
2. **Authorization**: Server validates user owns the project
3. **Rate Limiting**: Server limits saves to 10 per minute per user
4. **Data Validation**: Server validates all fields before save
5. **HTTPS Only**: All saves use encrypted connections

---

## 📦 Migration Guide (0001_initial.py to 0002_add_cover_and_publishing_fields.py)

```python
# backend/apps/publishing/migrations/0002_add_cover_and_publishing_fields.py
operations = [
    migrations.AddField(
        model_name='bookproject',
        name='cover_image_url',
        field=models.URLField(blank=True, max_length=500),
    ),
    migrations.AddField(
        model_name='bookproject',
        name='cover_prompt',
        field=models.TextField(blank=True),
    ),
    # ... 11 more fields
]
```

**Run migration:**
```bash
python manage.py migrate publishing
```

---

## ✅ Checklist for Implementation

### Backend
- [x] Add cover/publishing fields to BookProject model
- [x] Create migration file
- [x] Apply migration
- [x] Update serializers to include new fields
- [x] Add rate limiting to PATCH endpoints
- [x] Add validation for ISBN format

### Frontend
- [x] Create useAutoSave hook
- [x] Create useDebateAutoSave hook
- [x] Create SaveStatusIndicator component
- [x] Create WorkspaceDashboard component
- [x] Add workspace route to main app
- [x] Integrate auto-save into CreateBookWizard
- [x] Integrate auto-save into LiveDebatePanel
- [x] Add draft recovery prompt

### Testing
- [ ] Unit tests for auto-save hooks
- [ ] Integration tests for save endpoints
- [ ] E2E test for page close/refresh
- [ ] Load testing for concurrent saves
- [ ] localStorage quota handling

---

## 📚 Additional Resources

- **React Hook Patterns**: https://react.dev/reference/react
- **localStorage API**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **navigator.sendBeacon**: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
- **Django auto_now/auto_now_add**: https://docs.djangoproject.com/en/5.1/ref/models/fields/#django.db.models.DateField.auto_now

---

## 🎯 Summary

**What users get:**
- ✅ Never lose work - auto-saves every second
- ✅ Survive crashes, blackouts, accidental closures
- ✅ Resume projects instantly from unified workspace
- ✅ Real-time status tracking for all projects
- ✅ Works offline with local storage fallback

**What developers get:**
- ✅ Reusable auto-save hooks (useAutoSave, useDebateAutoSave)
- ✅ Drop-in SaveStatusIndicator component
- ✅ Complete WorkspaceDashboard with filters
- ✅ Backend models with status tracking
- ✅ Comprehensive documentation and examples
