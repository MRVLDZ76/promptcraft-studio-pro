# Authentication System Testing Guide

## Quick Start Test

### 1. Start the Applications

#### Backend (Django + Celery):
```bash
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

#### Frontend (Vite Dev Server):
```bash
cd promptcraft-studio-pro
npm run dev
```

### 2. Test Unauthenticated Access

1. Open browser to `http://localhost:5173`
2. **Expected**: You should see the new LoginPage with:
   - Left side: Animated video demos showcasing ChronStudio
   - Right side: Login/Signup form with tabs
   - Purple/indigo gradient theme
   - Professional design

3. Try to view page source or inspect element
4. **Expected**: Main app content should NOT be in the DOM
5. **Security**: Content is not rendered, preventing bypass

### 3. Test Login Flow

#### Valid Login:
1. Click "Sign In" tab (should be selected by default)
2. Enter email: `test@example.com`
3. Enter password: `testpassword`
4. Click "Sign In" button
5. **Expected**: 
   - Loading state shows ("Signing in...")
   - On success, immediately see main app interface
   - UserMenu appears in top-right corner
   - No redirect flash/flicker

#### Invalid Login:
1. Enter email: `wrong@example.com`
2. Enter password: `wrongpassword`
3. Click "Sign In"
4. **Expected**:
   - Error message displays in red box
   - Form remains visible
   - Can try again

### 4. Test Registration Flow

1. Click "Sign Up" tab
2. Fill in form:
   - Username: `testuser`
   - Full Name: `Test User` (optional)
   - Email: `newuser@example.com`
   - Password: `securepass123`
   - Confirm Password: `securepass123`
3. Click "Create Account"
4. **Expected**:
   - Loading state shows ("Creating account...")
   - On success, automatically logged in
   - Main app interface appears
   - UserMenu shows new user info

#### Validation Tests:
- Try password < 8 characters → Error: "Password must be at least 8 characters"
- Try mismatched passwords → Error: "Passwords do not match"
- Try existing email → Error: "Email already exists" (or similar from backend)
- Try empty username → Error: "Username is required"

### 5. Test Protected Routes

With user logged out:
1. Navigate to any mode in main app (should show LoginPage)
2. Navigate to ChronStudio (`http://localhost:5173/chronstudio` or similar)
3. **Expected**: LoginPage displays before ANY content loads

After login:
1. Navigate between different modes (Image, Video, Audio, etc.)
2. **Expected**: All modes accessible without re-authentication
3. Refresh page
4. **Expected**: Still logged in, no redirect to login

### 6. Test Session Persistence

1. Login successfully
2. Close browser tab
3. Open new tab to `http://localhost:5173`
4. **Expected**: Still logged in (token persists in localStorage)
5. Open browser DevTools → Application → Local Storage
6. **Expected**: Should see `access_token`, `refresh_token`, `user` keys

### 7. Test Logout Flow

1. While logged in, click UserMenu (top-right corner)
2. Click "Logout" button
3. **Expected**:
   - Immediately see LoginPage
   - Tokens removed from localStorage
   - Cannot access protected content
4. Try browser back button
5. **Expected**: LoginPage still shows (no cached protected content)

### 8. Test ChronStudio Integration

1. Navigate to ChronStudio app
2. While logged out, verify LoginPage shows
3. Login using same credentials
4. **Expected**: 
   - ChronStudio interface loads
   - UserMenu appears in header (next to dashboard buttons)
   - Project workflow accessible
5. Verify all steps (Templates → Input → Characters → Storyboard → Production)
6. **Expected**: All accessible without authentication prompts

### 9. Test Responsive Design

#### Desktop (> 1024px):
1. Open app on desktop browser
2. **Expected**:
   - Split-screen layout
   - Videos on left (50%)
   - Form on right (50%)
   - Smooth animations

#### Mobile (< 1024px):
1. Open DevTools, switch to mobile view (e.g., iPhone 12)
2. **Expected**:
   - Single column layout
   - Logo and title at top
   - Form below
   - Videos hidden (only shown on desktop)

### 10. Test Dark Mode

1. Login to main app
2. Click theme toggle (Moon/Sun icon in sidebar)
3. Logout (should return to LoginPage)
4. **Expected**: LoginPage respects dark mode setting
5. Switch back to light mode
6. **Expected**: LoginPage updates colors appropriately

## Common Issues & Solutions

### Issue: "Failed to fetch" or network error
**Solution**: 
- Verify backend is running on `http://localhost:8000`
- Check `services/authService.ts` API base URL
- Check browser console for CORS errors

### Issue: Login succeeds but immediately shows LoginPage again
**Solution**:
- Check browser console for errors in `useAuth` hook
- Verify tokens are being saved to localStorage
- Check `authService.isAuthenticated()` logic

### Issue: Can't see UserMenu after login
**Solution**:
- Check that `isAuthenticated` is true in React DevTools
- Verify `UserMenu` component is imported correctly
- Check header rendering logic in App.tsx

### Issue: Video demos not playing
**Solution**:
- Videos are from Pixabay CDN - check internet connection
- Some browsers block autoplay - this is expected
- Videos should still show as static images

### Issue: Styling looks broken
**Solution**:
- Verify Tailwind CSS is configured
- Check that dark mode classes are working
- Inspect elements to see if classes are applied

## Security Verification

### ✅ PASS Criteria:
1. **Cannot bypass login**: Inspecting page source shows no protected content
2. **Content not rendered**: React DevTools shows LoginPage as root, not wrapped content
3. **No overlay tricks**: Page is fully replaced, not just covered
4. **Token validation**: Backend rejects invalid/expired tokens
5. **Session timeout**: Expired sessions redirect to login

### ❌ FAIL Criteria:
1. Can access protected content without login
2. Can remove LoginPage with DevTools
3. Protected content visible in page source while logged out
4. Tokens persist after logout
5. Can navigate to protected routes via URL manipulation

## Performance Tests

### Page Load Speed:
1. Clear cache and hard refresh
2. Measure time to LoginPage render
3. **Target**: < 1 second on broadband

### Login Speed:
1. Enter credentials and submit
2. Measure time from submit to main app render
3. **Target**: < 2 seconds (depends on backend response)

### Video Loading:
1. Observe video carousel on LoginPage
2. Check that videos load progressively
3. **Target**: First video plays within 3 seconds

## Automated Testing (Future)

Consider adding these tests to your test suite:

```typescript
describe('Authentication Flow', () => {
  it('should show LoginPage when not authenticated', () => {
    // Test implementation
  });
  
  it('should redirect to app after successful login', () => {
    // Test implementation
  });
  
  it('should show errors for invalid credentials', () => {
    // Test implementation
  });
  
  it('should validate password requirements', () => {
    // Test implementation
  });
  
  it('should persist session across page refresh', () => {
    // Test implementation
  });
  
  it('should clear session on logout', () => {
    // Test implementation
  });
});
```

## Browser Compatibility

Test on these browsers to ensure compatibility:

- ✅ Chrome 100+ (primary target)
- ✅ Firefox 100+ (secondary)
- ✅ Safari 15+ (Mac/iOS)
- ✅ Edge 100+ (Windows)

## Accessibility Tests

1. **Keyboard Navigation**:
   - Tab through form fields
   - Enter key to submit
   - Escape to clear (if implemented)

2. **Screen Reader**:
   - Test with NVDA/JAWS/VoiceOver
   - Verify form labels are announced
   - Check error messages are readable

3. **Color Contrast**:
   - Use WAVE or axe DevTools
   - Verify contrast ratios meet WCAG AA standards

## Sign-Off Checklist

Before considering testing complete:

- [ ] Login works with valid credentials
- [ ] Registration works with valid data
- [ ] Form validation works correctly
- [ ] Logout clears session properly
- [ ] Protected routes are actually protected
- [ ] Session persists across refresh
- [ ] ChronStudio uses same authentication
- [ ] Responsive design works on mobile
- [ ] Dark mode works on LoginPage
- [ ] No console errors during normal flow
- [ ] UserMenu displays after login
- [ ] Cannot bypass authentication via DevTools
- [ ] Videos display and rotate on LoginPage
- [ ] Password visibility toggle works
- [ ] Tab switching (Sign In/Sign Up) works
- [ ] Error messages display correctly

## Success Criteria

✅ **PASSED** if:
- All checklist items checked
- No blocking bugs found
- Security verification passed
- Performance targets met

❌ **FAILED** if:
- Can bypass authentication
- Login/logout broken
- Protected content accessible without auth
- Critical errors in console

---

**Last Updated**: 2026-02-02
**Status**: Ready for Testing
