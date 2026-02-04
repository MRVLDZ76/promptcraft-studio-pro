# Appliku Deployment Guide - PromptCraft Studio Pro

## 🌐 Domain Configuration

### Applications
- **Backend (Django)**: `bcknd.ppall.io`
- **Frontend (React/Vite)**: `studio.ppall.io`

### Architecture
```
┌─────────────────────────────────────────────────┐
│                  ppall.io DNS                   │
└─────────────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
  ┌─────────────────┐     ┌─────────────────┐
  │  bcknd.ppall.io │     │ studio.ppall.io │
  │  Django Backend │     │  React Frontend │
  └─────────────────┘     └─────────────────┘
           │                       │
           │                       │
           ▼                       ▼
  ┌─────────────────┐     ┌─────────────────┐
  │   PostgreSQL    │     │   Static Files  │
  │     Redis       │     │   (Vite Build)  │
  │   Celery        │     └─────────────────┘
  │   Celery Beat   │
  │   Flower        │
  └─────────────────┘
```

---

## 📋 Pre-Deployment Checklist

### 1. DNS Configuration
Before deploying, configure these DNS records:

```dns
# A Records (or CNAME to Appliku)
studio.ppall.io    → Appliku Frontend Server IP
bcknd.ppall.io     → Appliku Backend Server IP

# Optional: Main domain redirect
ppall.io           → studio.ppall.io (301 redirect)
www.ppall.io       → studio.ppall.io (301 redirect)
```

### 2. Repository Structure Verification
```
promptStudio/
├── backend/                  # Django application
│   ├── appliku.yml          ✅ Backend config
│   ├── .env.production      ✅ Backend env vars
│   ├── manage.py
│   ├── config/
│   ├── apps/
│   └── requirements.txt
│
└── promptcraft-studio-pro/  # React/Vite application
    ├── appliku.yml          ✅ Frontend config
    ├── .env.production      ✅ Frontend env vars
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
```

### 3. Required Services
- **PostgreSQL 16** database (Appliku managed)
- **Redis 7** (Appliku managed)
- **DigitalOcean Spaces** for media storage (already configured)
- **Supabase** for vector storage (already configured)

---

## 🚀 Deployment Steps

### Step 1: Create Backend Application (bcknd.ppall.io)

1. **Login to Appliku Dashboard**
   - Go to https://appliku.com
   - Login with your credentials

2. **Create New Application**
   - Click "Create Application"
   - Name: `promptstudio-backend`
   - Framework: Django
   - Python Version: 3.11

3. **Connect Repository**
   - Repository: Your GitHub/GitLab repo
   - Branch: `main`
   - Root Directory: `backend/`
   - Config File: `backend/appliku.yml`

4. **Configure Domain**
   - Primary Domain: `bcknd.ppall.io`
   - Enable SSL: ✅ (Let's Encrypt auto-configured)
   - Force HTTPS: ✅

5. **Create Databases**
   - PostgreSQL 16:
     - Name: `promptstudio`
     - Plan: Standard (or higher)
   - Redis 7:
     - Name: `promptstudio-redis`
     - Plan: Standard

6. **Environment Variables**
   - Appliku will auto-load from `appliku.yml`
   - Verify all variables are set correctly
   - Update any `YOUR_*_HERE` placeholders

7. **Deploy**
   - Click "Deploy Now"
   - Watch build logs for errors
   - Wait for services to start (web, worker, beat, flower)

### Step 2: Create Frontend Application (studio.ppall.io)

1. **Create New Application**
   - Click "Create Application"
   - Name: `promptstudio-frontend`
   - Framework: Node.js / Static Site
   - Node Version: 22

2. **Connect Repository**
   - Repository: Same repo as backend
   - Branch: `main`
   - Root Directory: `promptcraft-studio-pro/`
   - Config File: `promptcraft-studio-pro/appliku.yml`

3. **Configure Domain**
   - Primary Domain: `studio.ppall.io`
   - Enable SSL: ✅
   - Force HTTPS: ✅

4. **Environment Variables**
   - Appliku will auto-load from `appliku.yml`
   - Verify `VITE_API_URL=https://bcknd.ppall.io`

5. **Deploy**
   - Click "Deploy Now"
   - Wait for `npm install` and `npm run build`
   - Static files will be served from `dist/`

---

## 🔧 Post-Deployment Configuration

### 1. Run Database Migrations (Backend)

SSH into backend container or use Appliku console:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 2. Test Backend API

```bash
# Health check
curl https://bcknd.ppall.io/health/

# Admin panel
open https://bcknd.ppall.io/admin/

# API endpoint
curl https://bcknd.ppall.io/api/v1/
```

### 3. Test Frontend

```bash
# Main app
open https://studio.ppall.io

# Check API connection
# Open browser console and verify:
# - No CORS errors
# - API calls to bcknd.ppall.io working
```

### 4. Configure OAuth Redirects

Update OAuth provider settings:

**Google OAuth Console**:
```
Authorized redirect URIs:
- https://bcknd.ppall.io/api/auth/google/callback/
- https://studio.ppall.io/auth/callback/google
```

**YouTube OAuth**:
```
Authorized redirect URIs:
- https://bcknd.ppall.io/api/v1/chronstudio/oauth/youtube/callback/
```

**Apple Developer**:
```
Sign in with Apple redirect:
- https://bcknd.ppall.io/api/auth/apple/callback/
```

### 5. Configure Stripe Webhooks

```
Webhook endpoint:
https://bcknd.ppall.io/api/v1/webhooks/stripe/

Events to listen for:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- checkout.session.completed
```

### 6. Update Mailgun Settings

**Domain**: ppall.io
**Authorized Recipients**:
- noreply@ppall.io
- support@ppall.io

**SMTP Credentials**:
```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@ppall.io
Password: [Get from Mailgun dashboard]
```

---

## 🔐 Security Configuration

### 1. CORS Settings (Backend)

Verify in Django settings:
```python
CORS_ALLOWED_ORIGINS = [
    "https://studio.ppall.io",
    "https://ppall.io",
    "https://www.ppall.io",
]

CORS_ALLOW_CREDENTIALS = True
```

### 2. CSRF Settings

```python
CSRF_TRUSTED_ORIGINS = [
    "https://studio.ppall.io",
    "https://bcknd.ppall.io",
    "https://ppall.io",
]

CSRF_COOKIE_DOMAIN = ".ppall.io"
CSRF_COOKIE_SECURE = True
```

### 3. Session Settings

```python
SESSION_COOKIE_DOMAIN = ".ppall.io"
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "Lax"
```

---

## 📊 Monitoring & Logs

### Backend Monitoring

**Flower (Celery Monitor)**:
- URL: `https://bcknd.ppall.io:5555` (if exposed)
- Shows active tasks, workers, queues

**Application Logs**:
```bash
# Via Appliku dashboard
Applications → promptstudio-backend → Logs

# Service-specific logs
- Web server logs
- Worker logs
- Beat logs
- Flower logs
```

### Frontend Monitoring

**Build Logs**:
```bash
# Via Appliku dashboard
Applications → promptstudio-frontend → Logs

# Check for:
- npm install success
- vite build success
- Asset optimization
```

---

## 🔄 Continuous Deployment

### Automatic Deployments

Both applications are configured for auto-deploy on push:

```yaml
# In both appliku.yml files
# Appliku watches the repository branch
# Triggers deployment on push to main branch
```

### Manual Deployment

Via Appliku Dashboard:
```
Applications → [App Name] → Deploy Now
```

Via Appliku CLI:
```bash
appliku deploy promptstudio-backend
appliku deploy promptstudio-frontend
```

---

## 🐛 Troubleshooting

### Issue 1: CORS Errors

**Symptom**: Frontend can't connect to backend API

**Fix**:
1. Check `CORS_ALLOWED_ORIGINS` in backend settings
2. Verify `VITE_API_URL` in frontend env vars
3. Ensure both apps are on HTTPS

### Issue 2: Static Files Not Loading

**Backend**:
```bash
python manage.py collectstatic --noinput
```

**Frontend**:
```bash
npm run build
# Verify dist/ folder exists
```

### Issue 3: Database Connection Errors

**Check**:
1. PostgreSQL database is running
2. `DATABASE_URL` env var is set correctly
3. Database migrations are applied

### Issue 4: Celery Workers Not Running

**Check**:
1. Redis is running
2. `CELERY_BROKER_URL` is set correctly
3. Worker service is scaled > 0

### Issue 5: OAuth Redirect Errors

**Fix**:
1. Update OAuth provider redirect URIs
2. Verify `FRONTEND_URL` env var
3. Check callback URL format matches provider

---

## 📈 Scaling Configuration

### Backend Scaling

```yaml
# In backend/appliku.yml
services:
  web:
    scale: 2  # Increase for more traffic
  worker:
    scale: 2  # Increase for more background tasks
  beat:
    scale: 1  # Keep at 1 (only one scheduler needed)
  flower:
    scale: 1  # Keep at 1
```

### Frontend Scaling

```yaml
# In frontend/appliku.yml
services:
  web:
    scale: 2  # Increase for more traffic
```

### Database Scaling

Via Appliku Dashboard:
- Upgrade PostgreSQL plan (more CPU/RAM)
- Upgrade Redis plan
- Enable connection pooling

---

## 🔑 Environment Variables Quick Reference

### Backend (.env.production)
```bash
DJANGO_ALLOWED_HOSTS=bcknd.ppall.io,studio.ppall.io
FRONTEND_URL=https://studio.ppall.io
CORS_ALLOWED_ORIGINS=https://studio.ppall.io,https://ppall.io
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://bcknd.ppall.io
VITE_API_BASE_URL=https://bcknd.ppall.io/api/v1
VITE_APP_URL=https://studio.ppall.io
```

---

## ✅ Deployment Verification Checklist

### Backend (bcknd.ppall.io)
- [ ] Application deployed successfully
- [ ] SSL certificate active
- [ ] PostgreSQL database connected
- [ ] Redis connected
- [ ] Migrations applied
- [ ] Static files collected
- [ ] Admin panel accessible
- [ ] API endpoints responding
- [ ] Celery workers running
- [ ] Celery beat running
- [ ] OAuth redirects configured
- [ ] Stripe webhooks configured
- [ ] Email sending working

### Frontend (studio.ppall.io)
- [ ] Application deployed successfully
- [ ] SSL certificate active
- [ ] Build completed without errors
- [ ] Static files served correctly
- [ ] API connection working
- [ ] No CORS errors
- [ ] Authentication working
- [ ] All pages loading
- [ ] Assets loading (images, fonts)
- [ ] Console errors resolved

### Integration Tests
- [ ] User can sign up
- [ ] User can log in
- [ ] User can create project
- [ ] Backend API calls succeed
- [ ] Supabase data persistence works
- [ ] Stripe checkout works
- [ ] OAuth login works
- [ ] File uploads work
- [ ] Background tasks execute

---

## 📞 Support Resources

### Appliku Documentation
- https://appliku.com/docs/
- Django deployment guide
- Node.js deployment guide

### Domain Configuration
- https://appliku.com/docs/domains/
- SSL certificate setup
- Custom domains

### Troubleshooting
- https://appliku.com/docs/troubleshooting/
- Common deployment issues
- Log analysis

---

## 🎉 Deployment Complete!

Your PromptCraft Studio Pro is now live:

- **Frontend**: https://studio.ppall.io
- **Backend API**: https://bcknd.ppall.io
- **Admin Panel**: https://bcknd.ppall.io/admin/

Monitor your applications and scale as needed!
