# Authentication Bug Fixes - February 2, 2026

## Issues Identified

1. **Refresh Token URL Mismatch**: Frontend calling wrong endpoint
2. **Stale Auth State**: App not properly clearing invalid tokens
3. **No Redirect After Login**: Login modal closing but UI not updating

## Root Causes

### 1. Incorrect Refresh Token Endpoint
**Problem**: 
- Frontend: `/auth/token/refresh/`
- Backend: `/api/v1/auth/refresh/`

**Location**: `services/apiClient.ts` line 42

### 2. Failed Token Refresh Not Clearing State
**Problem**: When token refresh failed, the app kept the user logged in with invalid tokens, causing infinite retry loops.

**Location**: `hooks/useAuth.tsx` - useEffect initialization

### 3. Auth State Not Propagating
**Problem**: After successful login, the AuthModal closed but protected routes still showed as unauthorized.

## Fixes Applied

### Fix 1: Correct Refresh Token URL
**File**: `services/apiClient.ts`

```typescript
// BEFORE
const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
  refresh: refreshToken,
});

// AFTER
const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
  refresh: refreshToken,
});
```

### Fix 2: Clear Stale Auth on Refresh Failure
**File**: `hooks/useAuth.tsx`

```typescript
// BEFORE
try {
  const freshUser = await authService.getCurrentUser();
  setUser(freshUser);
} catch (error) {
  // If refresh fails, keep stored user
  console.error('Failed to refresh user:', error);
}

// AFTER
try {
  const freshUser = await authService.getCurrentUser();
  setUser(freshUser);
} catch (error) {
  // If refresh fails, clear auth and logout
  console.error('Failed to refresh user:', error);
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  setUser(null);
}
```

Also added cleanup in the catch block:
```typescript
catch (error) {
  console.error('Auth initialization error:', error);
  // Clear any stale auth data
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  setUser(null);
}
```

### Fix 3: Simplified Login Flow
**File**: `components/AuthModal.tsx`

Removed aggressive `window.location.reload()` that was causing page refreshes. The AuthContext will now properly propagate state changes through React's context API, causing protected routes to re-render automatically.

## Testing Steps

1. **Test Successful Login**:
   - Open app (logged out)
   - Click login button
   - Enter credentials: `admin@example.com` / `admin123`
   - Verify modal closes
   - Verify user menu appears
   - Verify protected routes are accessible

2. **Test Token Refresh**:
   - Login successfully
   - Wait 5+ minutes (access token expires)
   - Make an API call (navigate to subscription page)
   - Verify token refreshes automatically
   - Verify no errors in console

3. **Test Invalid Refresh Token**:
   - Login successfully
   - Manually clear refresh token: `localStorage.removeItem('refresh_token')`
   - Make an API call
   - Verify user is logged out
   - Verify no infinite retry loops

4. **Test Expired Refresh Token**:
   - Login successfully
   - Wait 7+ days (refresh token expires)
   - Refresh page
   - Verify user is logged out cleanly
   - Verify login modal appears

## Backend Endpoints Verified

- `POST /api/v1/auth/login/` ✓
- `POST /api/v1/auth/register/` ✓
- `POST /api/v1/auth/refresh/` ✓
- `POST /api/v1/auth/logout/` ✓
- `GET /api/v1/auth/me/` ✓

## Files Modified

1. `services/apiClient.ts` - Fixed refresh token URL
2. `hooks/useAuth.tsx` - Added proper token cleanup on failures
3. `components/AuthModal.tsx` - Removed aggressive page reload

## Expected Behavior

### Before Fixes
- ❌ Infinite token refresh retries
- ❌ User stuck on login screen even when authenticated
- ❌ Console errors about refresh token
- ❌ Protected routes not updating after login

### After Fixes
- ✅ Token refresh works silently in background
- ✅ Failed refresh properly logs user out
- ✅ Login redirects work correctly
- ✅ Protected routes update immediately after login
- ✅ No console errors
- ✅ Clean authentication state management

## Additional Notes

### Token Lifetimes
- Access Token: 5 minutes
- Refresh Token: 7 days

### Auth Flow
1. User logs in → receives access + refresh tokens
2. Access token included in all API requests
3. When access token expires (401 error):
   - Interceptor catches error
   - Calls refresh endpoint with refresh token
   - Gets new access token
   - Retries original request
4. If refresh fails:
   - Clear all tokens
   - Set user to null
   - Protected routes show login prompt

### LocalStorage Keys
- `access_token`: JWT access token (5 min)
- `refresh_token`: JWT refresh token (7 days)
- `user`: JSON stringified user object

## Future Improvements

1. **Add Token Refresh Before Expiry**: Proactively refresh tokens 1 minute before expiry instead of waiting for 401
2. **Add Retry Limits**: Limit refresh attempts to prevent potential infinite loops
3. **Add Loading States**: Show loading indicator during token refresh
4. **Add Session Timeout Warning**: Warn user before refresh token expires
5. **Add Remember Me**: Option to extend refresh token lifetime
