# Week 5 Quick Reference Guide

## 📱 Mobile Components

### Device Detection
```tsx
import { useDeviceType } from '@/utils/mobileConfig';

const { isMobile, isTablet, isDesktop } = useDeviceType();
```

### Bottom Sheet (Slide-up Panel)
```tsx
import { BottomSheet } from '@/components/BottomSheet';

<BottomSheet
  isOpen={showSheet}
  onClose={() => setShowSheet(false)}
  title="Properties"
  snapPoints={[10, 40, 80]} // vh units
>
  {/* Your content */}
</BottomSheet>
```

**Gestures:**
- Swipe up/down to snap
- Tap backdrop to close
- Tap chevron to toggle

### Mobile Menu (Slide-in Drawer)
```tsx
import { MobileMenu, MobileMenuButton } from '@/components/MobileMenu';

<MobileMenuButton onClick={() => setOpen(true)} />

<MobileMenu isOpen={open} onClose={() => setOpen(false)}>
  {/* Navigation content */}
</MobileMenu>
```

---

## 🎨 Modern Auth UI

### Using the New Auth Design
```tsx
import { AuthModal } from '@/components/AuthModal';

// Modern split-screen (default)
<AuthModal onClose={handleClose} />

// Legacy form (fallback)
<AuthModal onClose={handleClose} useModernDesign={false} />
```

### Features
- ✅ Split-screen layout (left: auth, right: visual)
- ✅ Google & Apple sign-in buttons
- ✅ Responsive (stacks on mobile)
- ⏳ OAuth backends (Week 6)

---

## 🔧 Authentication Hook

```tsx
import { useAuth } from '@/hooks/useAuth';

const { user, loading, error, login, register, logout } = useAuth();

// Login
await login('email@example.com', 'password123');

// Register
await register('email@example.com', 'password123', 'username', 'Full Name');

// Logout
logout();
```

---

## 📤 Export API

### Start Export
```tsx
const response = await fetch(`/api/v1/publishing/books/${bookId}/export/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'pdf', // or 'epub', 'html'
    include_cover: true,
    include_toc: true,
  }),
});

const { task_id, format } = await response.json();
```

### Check Progress
```tsx
const checkStatus = async (taskId) => {
  const res = await fetch(`/api/v1/publishing/export-status/${taskId}/`);
  const data = await res.json();
  
  if (data.status === 'completed') {
    window.location.href = data.download_url;
  } else if (data.status === 'processing') {
    // Update progress bar
    setProgress(data.progress);
    setTimeout(() => checkStatus(taskId), 2000);
  } else if (data.status === 'error') {
    alert(data.error);
  }
};
```

---

## 🎯 Responsive Breakpoints

```typescript
// utils/mobileConfig.ts
export const BREAKPOINTS = {
  mobile: 375,   // <768px
  tablet: 768,   // 768-1023px
  desktop: 1024, // ≥1024px
};

// Touch target minimum: 44px × 44px
// Drag activation: 10px on mobile, 5px desktop
```

---

## 🚀 Quick Start

### 1. Install Dependencies (if needed)
```bash
cd promptcraft-studio-pro
npm install
```

### 2. Test Auth UI
- Open app in browser
- Click "Sign In" or "Sign Up"
- Should see new split-screen design
- Google/Apple buttons visible (placeholders)

### 3. Test Mobile
- Open Chrome DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Select iPhone 12 or iPad
- Resize to test breakpoints

### 4. Test BottomSheet
- Go to BookEditorWorkspace on mobile
- Tap properties button
- Sheet should slide up from bottom
- Drag handle to resize

---

## ⚠️ Known Issues

1. **Export returns placeholder URLs** (Week 5 Days 4-7)
   - PDF/EPUB/HTML not actually generated yet
   - Backend services in progress

2. **OAuth buttons non-functional** (Week 6)
   - Google/Apple buttons are UI only
   - Backend OAuth implementation pending

3. **Custom templates can't be saved** (Week 5)
   - Frontend ready, backend endpoint TODO
   - Model and API pending

4. **Layout controls don't apply CSS** (Week 5)
   - Margin/column settings don't affect preview yet
   - CSS injection TODO

---

## 📊 Week 5 Status

### ✅ Complete
- Modern auth UI (ModernAuthPage)
- Mobile components (BottomSheet, MobileMenu)
- Device detection hook
- Responsive breakpoints
- Documentation (WEEK5_IMPLEMENTATION.md)

### ⏳ In Progress
- Backend export services (PDF/EPUB/HTML)
- Custom template persistence
- Layout CSS application

### 🔜 Week 6
- Mobile device testing
- OAuth backend
- Comprehensive testing
- Performance optimization

---

## 🆘 Troubleshooting

### BottomSheet not appearing?
- Check `isOpen` prop is true
- Verify `md:hidden` class (should hide on desktop)
- Ensure z-index is sufficient (z-50)

### MobileMenu stuck open?
- Check `onClose` handler is called
- Verify body overflow is reset
- Inspect backdrop click event

### Auth modal doesn't show modern design?
- Check `useModernDesign` prop (default: true)
- Ensure ModernAuthPage.tsx is imported
- Verify no TypeScript errors

### Export fails?
- Check Celery is running: `celery -A config worker -l info`
- Verify Redis is running: `redis-cli ping`
- Check backend logs for errors

---

*Last Updated: January 2026*
