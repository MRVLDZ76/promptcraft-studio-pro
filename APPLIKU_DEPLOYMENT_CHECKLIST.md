# Appliku Deployment Checklist - PromptCraft Studio Pro

**Date**: February 4, 2026  
**Domains**: `studio.ppall.io` (Frontend) | `bcknd.ppall.io` (Backend)

---

## ✅ Pre-Deployment Checklist

### DNS Configuration
- [ ] Configure DNS A record for `studio.ppall.io`
- [ ] Configure DNS A record for `bcknd.ppall.io`
- [ ] Optional: Configure redirect from `ppall.io` → `studio.ppall.io`
- [ ] Optional: Configure redirect from `www.ppall.io` → `studio.ppall.io`
- [ ] Verify DNS propagation (use https://dnschecker.org/)

### Repository Preparation
- [ ] Push latest code to `main` branch
- [ ] Verify `backend/appliku.yml` exists and is configured
- [ ] Verify `promptcraft-studio-pro/appliku.yml` exists and is configured
- [ ] Verify `.env.production` files are correct (not committed to git)
- [ ] Verify `requirements.txt` is up to date (backend)
- [ ] Verify `package.json` is up to date (frontend)

### External Services Setup
- [ ] DigitalOcean Spaces bucket `businessesppall` accessible
- [ ] Supabase project `uuohwxcuqnaykpjhrcvu` is active
- [ ] OpenAI API key is valid and has credits
- [ ] Gemini API key is valid
- [ ] Stripe account is configured (if using subscriptions)
- [ ] OAuth providers configured (Google, YouTube, Apple)

---

## 🚀 Backend Deployment (bcknd.ppall.io)

### Step 1: Create Application in Appliku
- [ ] Login to https://appliku.com
- [ ] Click "Create Application"
- [ ] Name: `promptstudio-backend`
- [ ] Framework: Django
- [ ] Python Version: 3.11
- [ ] Region: Select closest to users

### Step 2: Connect Repository
- [ ] Repository URL: `https://github.com/[your-username]/promptStudio`
- [ ] Branch: `main`
- [ ] Deploy key generated and added to GitHub
- [ ] Root directory: `backend/`
- [ ] Appliku config file: `backend/appliku.yml`

### Step 3: Configure Domain
- [ ] Primary domain: `bcknd.ppall.io`
- [ ] Enable SSL: Yes (Let's Encrypt)
- [ ] Force HTTPS: Yes
- [ ] DNS configured and pointing to Appliku IP

### Step 4: Create Databases
- [ ] PostgreSQL 16 database created
  - Name: `promptstudio`
  - Plan: Standard or higher
  - Region: Same as application
- [ ] Redis 7 database created
  - Name: `promptstudio-redis`
  - Plan: Standard or higher
  - Region: Same as application

### Step 5: Environment Variables
- [ ] All variables from `appliku.yml` loaded
- [ ] `DATABASE_URL` auto-configured
- [ ] `REDIS_URL` auto-configured
- [ ] Verify domain variables:
  - `DJANGO_ALLOWED_HOSTS=bcknd.ppall.io,studio.ppall.io`
  - `FRONTEND_URL=https://studio.ppall.io`
  - `CORS_ALLOWED_ORIGINS=https://studio.ppall.io,https://ppall.io`
- [ ] Update OAuth redirect URIs to use `bcknd.ppall.io`
- [ ] Update any `YOUR_*_HERE` placeholders

### Step 6: Deploy
- [ ] Click "Deploy Now"
- [ ] Monitor build logs for errors
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Verify services started:
  - [ ] Web (Gunicorn)
  - [ ] Worker (Celery)
  - [ ] Beat (Celery scheduler)
  - [ ] Flower (Celery monitor)

### Step 7: Post-Deploy Tasks
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic --noinput`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Test admin panel: https://bcknd.ppall.io/admin/
- [ ] Test API health: https://bcknd.ppall.io/health/
- [ ] Test API endpoint: https://bcknd.ppall.io/api/v1/

---

## 🎨 Frontend Deployment (studio.ppall.io)

### Step 1: Create Application in Appliku
- [ ] Click "Create Application"
- [ ] Name: `promptstudio-frontend`
- [ ] Framework: Node.js / Static Site
- [ ] Node Version: 22
- [ ] Region: Same as backend (for low latency)

### Step 2: Connect Repository
- [ ] Repository URL: Same as backend
- [ ] Branch: `main`
- [ ] Root directory: `promptcraft-studio-pro/`
- [ ] Appliku config file: `promptcraft-studio-pro/appliku.yml`

### Step 3: Configure Domain
- [ ] Primary domain: `studio.ppall.io`
- [ ] Enable SSL: Yes (Let's Encrypt)
- [ ] Force HTTPS: Yes
- [ ] DNS configured and pointing to Appliku IP

### Step 4: Environment Variables
- [ ] All variables from `appliku.yml` loaded
- [ ] Verify API connection:
  - `VITE_API_URL=https://bcknd.ppall.io`
  - `VITE_API_BASE_URL=https://bcknd.ppall.io/api/v1`
  - `VITE_BACKEND_URL=https://bcknd.ppall.io`
- [ ] Verify app URL:
  - `VITE_APP_URL=https://studio.ppall.io`

### Step 5: Deploy
- [ ] Click "Deploy Now"
- [ ] Monitor build logs for errors
- [ ] Wait for `npm install` to complete
- [ ] Wait for `npm run build` to complete
- [ ] Verify build output in `dist/` folder
- [ ] Verify static file server started

### Step 6: Post-Deploy Tests
- [ ] Visit https://studio.ppall.io
- [ ] Check browser console for errors
- [ ] Verify no CORS errors
- [ ] Test API connection (should call bcknd.ppall.io)
- [ ] Test authentication flow
- [ ] Test creating a project
- [ ] Verify static assets loading (images, fonts)

---

## 🔐 OAuth Configuration

### Google OAuth Console
- [ ] Go to https://console.developers.google.com
- [ ] Select your project
- [ ] Credentials → OAuth 2.0 Client IDs
- [ ] Add authorized redirect URI:
  - `https://bcknd.ppall.io/api/auth/google/callback/`
- [ ] Update `GOOGLE_OAUTH_CLIENT_ID` in backend env vars
- [ ] Update `GOOGLE_OAUTH_CLIENT_SECRET` in backend env vars

### YouTube OAuth
- [ ] Same Google Console project
- [ ] Enable YouTube Data API v3
- [ ] Add authorized redirect URI:
  - `https://bcknd.ppall.io/api/v1/chronstudio/oauth/youtube/callback/`
- [ ] Verify `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`

### Apple Sign In
- [ ] Go to https://developer.apple.com
- [ ] Certificates, Identifiers & Profiles
- [ ] Create Sign in with Apple service
- [ ] Configure domains and redirect URIs:
  - Domain: `bcknd.ppall.io`
  - Redirect URI: `https://bcknd.ppall.io/api/auth/apple/callback/`
- [ ] Download private key
- [ ] Update Apple credentials in backend env vars

---

## 💳 Stripe Configuration

### Webhook Setup
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Click "Add endpoint"
- [ ] Endpoint URL: `https://bcknd.ppall.io/api/v1/webhooks/stripe/`
- [ ] Select events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`
- [ ] Copy webhook signing secret
- [ ] Update `STRIPE_WEBHOOK_SECRET` in backend env vars

### API Keys
- [ ] Verify `STRIPE_PUBLISHABLE_KEY` in frontend env vars
- [ ] Verify `STRIPE_SECRET_KEY` in backend env vars
- [ ] Test checkout flow

---

## 📧 Email Configuration (Mailgun)

### Domain Setup
- [ ] Go to https://mailgun.com
- [ ] Add domain: `ppall.io`
- [ ] Add DNS records (MX, TXT for SPF, DKIM)
- [ ] Verify domain ownership
- [ ] Get API key
- [ ] Update `MAILGUN_API_KEY` in backend env vars

### Test Sending
- [ ] Send test email from Django admin
- [ ] Verify email received
- [ ] Check spam folder
- [ ] Verify SPF/DKIM passing

---

## 🧪 Integration Testing

### Authentication Tests
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Sign in with Google OAuth
- [ ] Sign out
- [ ] Password reset

### API Tests
- [ ] Create new project (PromptCraft Studio)
- [ ] Create new book (Publishing Studio)
- [ ] Create new video (ChronStudio)
- [ ] Upload image/media
- [ ] Generate content with AI
- [ ] Save data to Supabase

### Payment Tests (if applicable)
- [ ] Subscribe to Pro plan
- [ ] Complete Stripe checkout
- [ ] Verify subscription status
- [ ] Cancel subscription
- [ ] Purchase credits

### Background Tasks
- [ ] Verify Celery workers running
- [ ] Check Flower dashboard: https://bcknd.ppall.io:5555
- [ ] Test async task execution
- [ ] Verify email sending queue

---

## 📊 Monitoring Setup

### Application Monitoring
- [ ] Access Appliku dashboard logs
- [ ] Set up log retention period
- [ ] Configure error notifications
- [ ] Set up uptime monitoring

### Performance Monitoring
- [ ] Monitor response times
- [ ] Monitor database query performance
- [ ] Monitor Celery task queue
- [ ] Check Redis memory usage

### Cost Monitoring
- [ ] Review Appliku billing
- [ ] Monitor DigitalOcean Spaces usage
- [ ] Monitor Supabase usage
- [ ] Monitor OpenAI API usage
- [ ] Monitor Stripe fees

---

## 🔄 Continuous Deployment

### Auto-Deploy Configuration
- [ ] Enable auto-deploy on push to `main`
- [ ] Test: Push small change and verify auto-deploy
- [ ] Configure deploy notifications (Slack/Email)

### Manual Deploy Process
- [ ] Document manual deploy steps
- [ ] Test manual deploy via Appliku dashboard
- [ ] Test rollback procedure

---

## 🐛 Troubleshooting Checklist

### If Backend Fails to Deploy
- [ ] Check build logs in Appliku
- [ ] Verify Python version (3.11)
- [ ] Check requirements.txt for conflicts
- [ ] Verify DATABASE_URL is set
- [ ] Check migration files are valid
- [ ] Verify static files collected

### If Frontend Fails to Deploy
- [ ] Check build logs in Appliku
- [ ] Verify Node version (22)
- [ ] Check package.json for errors
- [ ] Run `npm install` locally to test
- [ ] Run `npm run build` locally to test
- [ ] Check for environment variable issues

### If CORS Errors Occur
- [ ] Verify `CORS_ALLOWED_ORIGINS` includes frontend domain
- [ ] Check both HTTP and HTTPS versions
- [ ] Verify `ALLOWED_HOSTS` includes both domains
- [ ] Check CSRF settings

### If OAuth Fails
- [ ] Verify redirect URIs match exactly
- [ ] Check client ID and secret are correct
- [ ] Verify OAuth provider credentials
- [ ] Check callback URL format

---

## ✅ Final Verification

### Backend Health
- [ ] https://bcknd.ppall.io/ returns 200
- [ ] https://bcknd.ppall.io/admin/ loads
- [ ] https://bcknd.ppall.io/api/v1/ returns API root
- [ ] https://bcknd.ppall.io/health/ returns healthy status
- [ ] SSL certificate valid (green lock)

### Frontend Health
- [ ] https://studio.ppall.io/ loads main app
- [ ] No console errors
- [ ] No CORS errors
- [ ] API calls successful
- [ ] Authentication works
- [ ] Images and assets load
- [ ] SSL certificate valid (green lock)

### Services Health
- [ ] PostgreSQL database connected
- [ ] Redis connected
- [ ] Celery workers running
- [ ] Celery beat running
- [ ] Flower accessible
- [ ] DigitalOcean Spaces accessible
- [ ] Supabase connected

---

## 🎉 Deployment Complete!

**Frontend**: https://studio.ppall.io  
**Backend**: https://bcknd.ppall.io  
**Admin**: https://bcknd.ppall.io/admin/  

### Next Steps
1. Monitor logs for 24 hours
2. Test all critical user flows
3. Set up backup procedures
4. Document operational procedures
5. Train team on monitoring and deployment

---

## 📞 Support Contacts

- **Appliku Support**: support@appliku.com
- **Documentation**: https://appliku.com/docs/
- **Status Page**: https://status.appliku.com/

---

**Deployment Completed By**: _____________  
**Date**: _____________  
**Sign-off**: _____________
