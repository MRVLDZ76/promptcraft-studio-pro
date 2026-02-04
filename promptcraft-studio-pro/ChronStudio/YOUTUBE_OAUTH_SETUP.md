# YouTube OAuth Setup Guide

## 📋 Overview

This guide walks you through setting up YouTube OAuth 2.0 for ChronStudio social media uploads.

---

## 🔑 Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create New Project:**
   - Click "Select a project" (top left)
   - Click "NEW PROJECT"
   - **Project name:** `ChronStudio YouTube Integration`
   - Click "CREATE"

3. **Wait for project creation** (takes ~30 seconds)

---

## 📺 Step 2: Enable YouTube Data API

1. **Navigate to APIs & Services:**
   - From sidebar: **APIs & Services** → **Library**

2. **Search for YouTube:**
   - Type "YouTube Data API v3" in search bar

3. **Enable API:**
   - Click **YouTube Data API v3**
   - Click **ENABLE** button
   - Wait for activation (~10 seconds)

---

## 🔐 Step 3: Create OAuth 2.0 Credentials

### Configure OAuth Consent Screen

1. **Navigate to OAuth consent:**
   - Sidebar: **APIs & Services** → **OAuth consent screen**

2. **Select User Type:**
   - Choose **External** (for testing)
   - Click **CREATE**

3. **App Information:**
   - **App name:** `ChronStudio`
   - **User support email:** Your email
   - **Developer contact:** Your email
   - Click **SAVE AND CONTINUE**

4. **Scopes:**
   - Click **ADD OR REMOVE SCOPES**
   - Search and select:
     * `https://www.googleapis.com/auth/youtube.upload` (Upload videos)
     * `https://www.googleapis.com/auth/youtube` (Manage account)
     * `https://www.googleapis.com/auth/userinfo.profile` (Basic profile)
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE**

5. **Test Users** (for testing phase):
   - Click **ADD USERS**
   - Enter your Gmail address
   - Click **ADD**
   - Click **SAVE AND CONTINUE**

6. **Summary:**
   - Review and click **BACK TO DASHBOARD**

### Create OAuth Client ID

1. **Navigate to Credentials:**
   - Sidebar: **APIs & Services** → **Credentials**

2. **Create Credentials:**
   - Click **+ CREATE CREDENTIALS**
   - Select **OAuth client ID**

3. **Application Type:**
   - **Application type:** Web application
   - **Name:** `ChronStudio Backend`

4. **Authorized Redirect URIs:**
   - Click **+ ADD URI**
   - Enter: `http://localhost:8000/api/v1/chronstudio/oauth/youtube/callback/`
   - *For production, add: `https://yourdomain.com/api/v1/chronstudio/oauth/youtube/callback/`*

5. **Create:**
   - Click **CREATE**

6. **Download Credentials:**
   - A popup appears with Client ID and Client Secret
   - **Copy both values** (you'll need them next)

---

## ⚙️ Step 4: Configure Backend Environment

1. **Open backend `.env` file:**
   ```
   C:\Users\Elena\promptStudio\backend\.env
   ```

2. **Add your OAuth credentials:**
   ```bash
   # YouTube OAuth (for social media uploads)
   YOUTUBE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
   YOUTUBE_CLIENT_SECRET=your_actual_client_secret_here
   YOUTUBE_REDIRECT_URI=http://localhost:8000/api/v1/chronstudio/oauth/youtube/callback/
   
   # Frontend URL (for OAuth redirects)
   FRONTEND_URL=http://localhost:5173
   ```

3. **Save the file**

---

## 🚀 Step 5: Test OAuth Flow

### Start Backend Server

```bash
cd C:\Users\Elena\promptStudio\backend
.\venv\Scripts\python.exe manage.py runserver
```

### Test OAuth Initiation

1. **Open browser to:** http://localhost:8000/admin
2. **Login with admin credentials**
3. **Open Postman or browser:**
   - GET: `http://localhost:8000/api/v1/chronstudio/oauth/youtube/initiate/`
   - **Headers:** `Authorization: Bearer YOUR_JWT_TOKEN`

4. **Expected Response:**
   ```json
   {
     "authorization_url": "https://accounts.google.com/o/oauth2/auth?...",
     "state": "random_state_string"
   }
   ```

5. **Visit the authorization_url in your browser:**
   - Sign in with your Google account
   - Click **Continue** (you'll see the "unverified app" warning in testing mode)
   - Click **Allow** to grant permissions
   - You'll be redirected back to: `http://localhost:5173/?youtube_auth=success&channel=Your%20Channel%20Name`

6. **Verify Token Storage:**
   - Go to Django Admin: http://localhost:8000/admin
   - Navigate to: **Chronstudio** → **User OAuth Tokens**
   - You should see your YouTube connection with:
     * Platform: YouTube
     * Platform username: Your channel name
     * Access token: (encrypted)

---

## 📤 Step 6: Test Video Upload

### Prerequisites
- Completed OAuth flow (Step 5)
- Project with `final_video_url` populated
- Celery worker running (optional for async upload)

### Create Upload via API

**Endpoint:** `POST /api/v1/chronstudio/social-uploads/`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "project": "project-uuid-here",
  "platform": "youtube",
  "upload_config": {
    "title": "Test Video Upload",
    "description": "Testing ChronStudio YouTube integration",
    "tags": ["chronstudio", "test", "automated"],
    "privacy": "unlisted",
    "category": "22"
  }
}
```

**Expected Response:**
```json
{
  "id": "upload-uuid",
  "project": "project-uuid",
  "platform": "youtube",
  "status": "pending",
  "progress": 0,
  "upload_config": { ... },
  "created_at": "2026-02-02T12:00:00Z"
}
```

### Monitor Upload Progress

**Endpoint:** `GET /api/v1/chronstudio/social-uploads/{upload-id}/`

**Status Progression:**
1. **pending** (0%) - Queued for upload
2. **uploading** (10-85%) - Actively uploading to YouTube
3. **processing** (90%) - YouTube is processing
4. **published** (100%) - Complete! Video URL available

**Final Response:**
```json
{
  "id": "upload-uuid",
  "platform": "youtube",
  "status": "published",
  "progress": 100,
  "platform_id": "YouTube_Video_ID",
  "platform_url": "https://www.youtube.com/watch?v=YouTube_Video_ID",
  "published_at": "2026-02-02T12:05:00Z"
}
```

---

## 🔄 Running Celery Worker

For async uploads, start Celery:

```bash
cd C:\Users\Elena\promptStudio\backend
celery -A config worker --loglevel=info --pool=solo
```

**Note:** On Windows, use `--pool=solo` to avoid multiprocessing issues.

---

## 🛠️ Troubleshooting

### Error: "No OAuth token found"

**Solution:**
1. Check if user completed OAuth flow
2. Verify token exists in Django Admin → User OAuth Tokens
3. Re-authorize if token expired

### Error: "Invalid grant"

**Solution:**
1. Token may be expired
2. Revoke access in Google Account settings
3. Re-run OAuth flow

### Error: "Access forbidden"

**Solution:**
1. Verify YouTube Data API v3 is enabled
2. Check OAuth scopes include `youtube.upload`
3. Ensure user email is added to Test Users (if in testing mode)

### Error: "Video upload failed"

**Solution:**
1. Check video URL is accessible
2. Verify video file is valid MP4
3. Check YouTube quota limits (not exceeded)
4. Review Celery logs for detailed error

---

## 📊 YouTube API Quotas

**Free Tier Daily Quota:** 10,000 units/day

**Upload Cost:** ~1,600 units per upload

**Daily Upload Limit:** ~6 videos/day (free tier)

**To increase:**
1. Apply for quota increase in Google Cloud Console
2. Or upgrade to paid billing account

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git:**
   - `.env` file is in `.gitignore`
   - Use environment variables in production

2. **Use HTTPS in production:**
   - Update `YOUTUBE_REDIRECT_URI` to HTTPS
   - Add production redirect URI in Google Cloud Console

3. **Rotate secrets regularly:**
   - Regenerate Client Secret every 90 days
   - Update `.env` with new secret

4. **Limit token scopes:**
   - Only request necessary scopes
   - Current: upload + manage (minimal)

---

## 🎯 Next Steps

1. ✅ OAuth configured
2. ✅ Test upload completed
3. ⏳ **Move to production:**
   - Get production domain OAuth credentials
   - Update redirect URIs
   - Test end-to-end flow
4. ⏳ **Instagram & Facebook:**
   - Similar OAuth flow
   - Different API endpoints
   - Coming in future updates

---

## 📞 Support Resources

- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **YouTube API Docs:** https://developers.google.com/youtube/v3
- **Django OAuth:** https://django-oauth-toolkit.readthedocs.io/
- **ChronStudio Issues:** https://github.com/your-repo/issues

---

**Status:** ✅ Ready for Testing
**Last Updated:** February 2, 2026
