# Frontend-Backend Integration Testing Guide

## ✅ Setup Complete

### Servers Running
- **Django Backend**: http://localhost:8000
- **React Frontend**: http://localhost:5173
- **API Endpoint**: http://localhost:8000/api/v1

### Dependencies Installed
- ✅ axios (1.7.9) installed in React frontend
- ✅ All backend dependencies installed
- ✅ Environment configured (.env updated with VITE_DJANGO_API_URL)

---

## 🧪 Testing Steps

### Method 1: Test API Directly (Standalone HTML)

1. Open the test page:
   ```
   http://localhost:5173/test-api.html
   ```

2. Run tests in order:
   - **Test Connection**: Verifies backend is accessible
   - **Get Plans**: Fetches subscription plans (should show Free, Pro, Enterprise)
   - **Register User**: Creates a new test account
   - **Login**: Authenticates with the test account
   - **Get User Info**: Retrieves user profile using JWT token

### Method 2: Test in React App

1. Open the main app:
   ```
   http://localhost:5173
   ```

2. Test authentication flow:
   - Click "Login" button in header
   - Try registering a new account:
     - Username: `demo`
     - Email: `demo@example.com`
     - Password: `demopass123`
   - After registration, you should be automatically logged in
   - Verify the user menu appears in header with your username
   - Check that tier badge shows "Free" (default tier)

3. Test logout:
   - Click on user avatar/menu
   - Click "Sign Out"
   - Verify you're returned to login state

---

## 📋 Integration Checklist

### Backend API Endpoints (All Created)
- ✅ POST `/api/v1/auth/register/` - User registration
- ✅ POST `/api/v1/auth/login/` - User authentication
- ✅ POST `/api/v1/auth/logout/` - User logout
- ✅ GET `/api/v1/auth/user/` - Get current user
- ✅ PUT `/api/v1/auth/user/` - Update profile
- ✅ POST `/api/v1/auth/change-password/` - Change password
- ✅ POST `/api/v1/auth/token/refresh/` - Refresh JWT token
- ✅ GET `/api/v1/subscriptions/plans/` - List subscription plans
- ✅ POST `/api/v1/subscriptions/checkout/` - Create Stripe checkout
- ✅ POST `/api/v1/subscriptions/cancel/` - Cancel subscription
- ✅ GET `/api/v1/subscriptions/usage/` - Get usage statistics

### Frontend Services (All Created)
- ✅ `services/apiClient.ts` - Axios instance with JWT interceptors
- ✅ `services/authService.ts` - Authentication methods
- ✅ `services/subscriptionService.ts` - Subscription management
- ✅ `services/analysisService.ts` - Debate analysis
- ✅ `services/chronStudioService.ts` - Video production
- ✅ `services/promptService.ts` - Prompt management
- ✅ `services/transcriptionService.ts` - Transcription handling

### Frontend Components (All Created)
- ✅ `hooks/useAuth.tsx` - Auth context provider
- ✅ `hooks/useSubscription.tsx` - Subscription hook
- ✅ `components/AuthModal.tsx` - Login/register modal
- ✅ `components/UserMenu.tsx` - User dropdown menu
- ✅ `App.tsx` - Integrated with auth UI

---

## 🔍 What to Verify

### 1. Authentication Flow
- [ ] Registration creates user in Django database
- [ ] Login returns JWT access + refresh tokens
- [ ] Tokens stored in localStorage
- [ ] User info loads on app refresh
- [ ] Protected API calls include Bearer token
- [ ] 401 errors trigger token refresh
- [ ] Logout clears tokens and user state

### 2. Token Management
- [ ] Access token auto-attached to requests
- [ ] Refresh token used when access expires
- [ ] Invalid tokens redirect to login
- [ ] Token refresh is automatic and transparent

### 3. UI Integration
- [ ] Login button shows when not authenticated
- [ ] User menu shows when authenticated
- [ ] Tier badge displays correct subscription level
- [ ] Modal opens/closes properly
- [ ] Form validation works
- [ ] Error messages display correctly

### 4. API Communication
- [ ] CORS headers allow frontend requests
- [ ] JSON serialization works both ways
- [ ] Error responses handled gracefully
- [ ] Loading states work correctly

---

## 🐛 Troubleshooting

### Backend Not Responding
1. Check Django is running: http://localhost:8000/admin
2. Verify CORS settings in `config/settings/base.py`
3. Check Django console for errors

### Frontend Can't Connect
1. Verify `.env` has `VITE_DJANGO_API_URL=http://localhost:8000/api/v1`
2. Restart Vite dev server after .env changes
3. Check browser console for CORS errors

### Authentication Not Working
1. Check browser localStorage for tokens
2. Verify JWT secret key is set in Django
3. Check token expiration times
4. Clear localStorage and try fresh login

### 401 Errors
1. Token may be expired - logout and login again
2. Check refresh token is being sent
3. Verify Authorization header format: `Bearer {token}`

---

## 📊 Expected Results

### Successful Registration Response
```json
{
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@example.com",
    "full_name": "",
    "subscription_tier": "free"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Successful Login Response
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "demo",
    "email": "demo@example.com",
    "full_name": "",
    "subscription_tier": "free"
  }
}
```

### Subscription Plans Response
```json
[
  {
    "id": 1,
    "name": "Free",
    "stripe_price_id": null,
    "price": "0.00",
    "billing_period": "monthly",
    "features": {
      "max_transcription_minutes": 30,
      "max_analysis_queries": 10,
      "max_projects": 3
    },
    "is_active": true
  },
  {
    "id": 2,
    "name": "Pro",
    "stripe_price_id": "price_xxx",
    "price": "29.99",
    "billing_period": "monthly",
    "features": {
      "max_transcription_minutes": 500,
      "max_analysis_queries": 1000,
      "max_projects": 50
    },
    "is_active": true
  },
  {
    "id": 3,
    "name": "Enterprise",
    "stripe_price_id": "price_yyy",
    "price": "99.99",
    "billing_period": "monthly",
    "features": {
      "max_transcription_minutes": null,
      "max_analysis_queries": null,
      "max_projects": null
    },
    "is_active": true
  }
]
```

---

## 🎯 Next Steps After Testing

### 1. Migrate Existing Features
Replace Supabase calls with Django API in these components:
- `AnalysisStudio.tsx` - Use `analysisService` instead of Supabase
- `ChronStudio` components - Use `chronStudioService`
- `OutputEngine.tsx` - Use `promptService`
- `ManualTranscriptInput.tsx` - Use `transcriptionService`

### 2. Add Stripe Checkout
1. Add Stripe publishable key to `.env`:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```
2. Test subscription upgrade flow
3. Verify webhook updates subscription tier
4. Check usage limits enforcement

### 3. Add Protected Routes
Wrap components that require authentication:
```typescript
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

### 4. Add Usage Tracking
Implement usage tracking in components:
```typescript
import { trackUsage } from './services/subscriptionService';

// After user performs action
await trackUsage('transcription_minutes', minutesUsed);
await trackUsage('analysis_queries', 1);
```

### 5. Production Deployment
- [ ] Configure production Django settings
- [ ] Set up PostgreSQL database
- [ ] Add production CORS origins
- [ ] Configure Stripe live keys
- [ ] Set production environment variables
- [ ] Build and deploy frontend
- [ ] Set up SSL certificates
- [ ] Configure domain and DNS

---

## 📝 Development Notes

### Token Lifecycle
- Access Token: 5 minutes expiry
- Refresh Token: 7 days expiry
- Auto-refresh happens via axios interceptor
- Stored in localStorage (consider httpOnly cookies for production)

### API Response Format
All endpoints follow consistent format:
- Success: `{ data: {...}, message: "..." }` or just data object
- Error: `{ error: "...", detail: "..." }` with appropriate status code

### Subscription Tiers
- **Free**: Limited features, no payment required
- **Pro**: $29.99/month, expanded limits
- **Enterprise**: $99.99/month, unlimited usage

### Database Models
17 total models across 5 Django apps:
- `accounts` (1): User
- `analyses` (7): Debate, ArgumentNode, CreatorProfile, etc.
- `chronstudio` (3): Project, Character, Scene
- `prompts` (2): PromptProject, SequenceSegment
- `transcriptions` (1): Transcription
- `subscriptions` (4): SubscriptionPlan, Subscription, UsageTracking, PaymentHistory

---

## 🎉 Success Criteria

Integration is successful when:
1. ✅ User can register and login
2. ✅ JWT tokens are managed automatically
3. ✅ User menu displays correct information
4. ✅ Subscription plans load from Django
5. ✅ Protected API calls work with authentication
6. ✅ Token refresh happens transparently
7. ✅ Logout clears session properly
8. ✅ No CORS errors in browser console
9. ✅ No TypeScript compilation errors
10. ✅ Both servers run without errors

---

## 📚 Documentation References

- [Django REST Framework](https://www.django-rest-framework.org/)
- [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Axios](https://axios-http.com/)
- [React Context](https://react.dev/reference/react/useContext)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)

---

**Last Updated**: February 2, 2026
**Status**: ✅ Ready for Testing
