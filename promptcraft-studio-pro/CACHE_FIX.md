# Quick Fix - Browser Cache Issue

## Problem
The logs show the frontend is STILL calling `/api/v1/auth/token/refresh/` even though we fixed it to `/auth/refresh/`.

This is because:
1. The browser has cached the old compiled JavaScript
2. The Vite dev server might not have hot-reloaded the change

## Solution

### Option 1: Hard Refresh Browser (Fastest)
1. Open the app in browser
2. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
3. Or press **Ctrl + F5**
4. This forces browser to reload without cache

### Option 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Restart Vite Dev Server
```powershell
# In the esbuild terminal, stop the server (Ctrl+C)
# Then restart it
cd C:\Users\Elena\promptStudio\promptcraft-studio-pro
npm run dev
```

### Option 4: Clear localStorage + Refresh
Open browser console (F12) and run:
```javascript
localStorage.clear();
location.reload();
```

## Verify Fix Worked
After hard refresh, the Django logs should show:
```
POST /api/v1/auth/refresh/ HTTP/1.1" 200
```

Instead of:
```
POST /api/v1/auth/token/refresh/ HTTP/1.1" 404
```

## Additional Issues from Logs

### Login Returning 401
The logs show login attempts are getting 401 Unauthorized responses:
```
WARNING 2026-02-02 20:34:55,316 log Unauthorized: /api/v1/auth/login/
```

This is **very unusual** - login should not require authentication.

**Possible causes:**
1. CORS preflight failing
2. Request body not being sent properly
3. Django REST Framework settings issue

**To debug:**
1. Check browser Network tab for the actual request payload
2. Verify Content-Type header is `application/json`
3. Check if the request body has `email` and `password` fields

### Test Login Manually
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

Should return:
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {...}
}
```

## Summary
1. **Do a hard refresh** (Ctrl + Shift + R) to clear browser cache
2. **Test login** again
3. Check Django logs for `/auth/refresh/` instead of `/auth/token/refresh/`
