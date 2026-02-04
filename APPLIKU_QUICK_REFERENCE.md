# Appliku Deployment - Quick Reference

## 🌐 Domains

| Application | Domain | Purpose |
|-------------|--------|---------|
| Frontend | `studio.ppall.io` | React/Vite SPA |
| Backend | `bcknd.ppall.io` | Django REST API |

---

## 📦 Repository Structure

```
promptStudio/
├── backend/
│   ├── appliku.yml           # Backend deployment config
│   └── .env.production       # Backend env vars
│
└── promptcraft-studio-pro/
    ├── appliku.yml           # Frontend deployment config
    └── .env.production       # Frontend env vars
```

---

## 🚀 Quick Deploy Commands

### Via Appliku Dashboard
1. Go to https://appliku.com
2. Click "Create Application"
3. Connect repository
4. Select `backend/` or `promptcraft-studio-pro/` as root
5. Click "Deploy Now"

### Via Git Push (Auto-deploy enabled)
```bash
git push origin main
# Automatically triggers deployment
```

---

## 🔑 Critical Environment Variables

### Backend
```bash
DJANGO_ALLOWED_HOSTS=bcknd.ppall.io,studio.ppall.io
FRONTEND_URL=https://studio.ppall.io
CORS_ALLOWED_ORIGINS=https://studio.ppall.io,https://ppall.io
DATABASE_URL=[auto-configured by Appliku]
REDIS_URL=[auto-configured by Appliku]
```

### Frontend
```bash
VITE_API_URL=https://bcknd.ppall.io
VITE_API_BASE_URL=https://bcknd.ppall.io/api/v1
VITE_APP_URL=https://studio.ppall.io
```

---

## ⚡ Post-Deployment Steps

### 1. Run Migrations (Backend)
```bash
# Via Appliku console or SSH
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 2. Update OAuth Redirects
```
Google: https://bcknd.ppall.io/api/auth/google/callback/
YouTube: https://bcknd.ppall.io/api/v1/chronstudio/oauth/youtube/callback/
Apple: https://bcknd.ppall.io/api/auth/apple/callback/
```

### 3. Configure Stripe Webhook
```
URL: https://bcknd.ppall.io/api/v1/webhooks/stripe/
Events: customer.subscription.*, invoice.*, checkout.session.*
```

---

## ✅ Quick Health Checks

### Backend
```bash
curl https://bcknd.ppall.io/health/
curl https://bcknd.ppall.io/api/v1/
open https://bcknd.ppall.io/admin/
```

### Frontend
```bash
open https://studio.ppall.io
# Check browser console for errors
# Verify API calls to bcknd.ppall.io
```

---

## 🔧 Services Configuration

### Backend Services (Django)
- **Web**: Gunicorn/uWSGI (port 8000)
- **Worker**: Celery workers (4 concurrency)
- **Beat**: Celery beat scheduler
- **Flower**: Celery monitor (port 5555)

### Frontend Services (Node)
- **Web**: Static file server (port 8080)
- **Build**: Vite build → dist/

---

## 📊 Monitoring URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | https://studio.ppall.io | Main application |
| Backend API | https://bcknd.ppall.io/api/v1/ | REST API |
| Admin | https://bcknd.ppall.io/admin/ | Django admin |
| Flower | https://bcknd.ppall.io:5555 | Celery monitor |
| Logs | Appliku Dashboard | Application logs |

---

## 🐛 Common Issues & Fixes

### CORS Errors
```bash
# Fix: Update backend CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS=https://studio.ppall.io,https://ppall.io
```

### Static Files 404
```bash
# Backend
python manage.py collectstatic --noinput

# Frontend
npm run build
```

### OAuth Redirect Errors
```bash
# Fix: Update OAuth provider settings
# Add https://bcknd.ppall.io/api/auth/[provider]/callback/
```

### Database Connection
```bash
# Fix: Verify DATABASE_URL is set
# Check PostgreSQL service is running in Appliku
```

---

## 📈 Scaling Quick Tips

### Increase Backend Workers
```yaml
# backend/appliku.yml
services:
  web:
    scale: 2  # Handle more traffic
  worker:
    scale: 2  # Process more background tasks
```

### Increase Frontend Capacity
```yaml
# frontend/appliku.yml
services:
  web:
    scale: 2  # Serve more users
```

---

## 🔐 Security Checklist

- [x] HTTPS enabled (Let's Encrypt)
- [x] CORS configured (.ppall.io only)
- [x] CSRF protection enabled
- [x] Secure cookies (SECURE=True)
- [x] SECRET_KEY set and random
- [x] DEBUG=False in production
- [x] API keys in environment variables

---

## 📞 Quick Links

- **Appliku Dashboard**: https://appliku.com/dashboard/
- **DNS Configuration**: Your DNS provider (e.g., Cloudflare)
- **SSL Certificates**: Auto-managed by Appliku (Let's Encrypt)
- **Logs**: Appliku Dashboard → Applications → Logs

---

## ⚙️ Naming Conventions

### Applications in Appliku
- `promptstudio-backend` (Django)
- `promptstudio-frontend` (React/Vite)

### Databases
- `promptstudio` (PostgreSQL 16)
- `promptstudio-redis` (Redis 7)

### Domains
- `bcknd.ppall.io` (Backend API)
- `studio.ppall.io` (Frontend SPA)
- `ppall.io` (Optional: redirect to studio)

---

**Ready to deploy? Follow APPLIKU_DEPLOYMENT_GUIDE.md for detailed steps!**
