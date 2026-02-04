# Week 3 Complete - Stripe Subscriptions 🎉

## Summary

Successfully implemented complete Stripe subscription system with 3-tier pricing, webhook handlers, and usage tracking.

## Features Implemented

### 1. Subscription Models (4 models)
- **SubscriptionPlan**: Tier definitions with feature limits
- **Subscription**: User subscription tracking with Stripe integration
- **UsageTracking**: Monthly usage monitoring
- **PaymentHistory**: Transaction records

### 2. Subscription Tiers

| Feature | Free | Pro ($29.99/mo) | Enterprise ($99.99/mo) |
|---------|------|-----------------|------------------------|
| Analyses/month | 5 | 100 | Unlimited |
| ChronStudio Projects | 1 | 10 | Unlimited |
| AI Tokens/month | 10K | 500K | Unlimited |
| Max Video Length | 10 min | 60 min | 180 min |

### 3. API Endpoints

#### Subscription Plans
- `GET /api/v1/subscriptions/plans/` - List available plans

#### User Subscriptions
- `GET /api/v1/subscriptions/subscriptions/` - Get user subscription
- `POST /api/v1/subscriptions/subscriptions/create_checkout_session/` - Create Stripe checkout
- `POST /api/v1/subscriptions/subscriptions/cancel_subscription/` - Cancel subscription
- `POST /api/v1/subscriptions/subscriptions/reactivate_subscription/` - Reactivate

#### Usage Tracking
- `GET /api/v1/subscriptions/usage/` - View current usage

#### Payment History
- `GET /api/v1/subscriptions/payments/` - View payment history

### 4. Stripe Webhooks
- `POST /api/webhooks/stripe/` - Handle Stripe events

**Supported Events:**
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment

### 5. Permissions & Utilities

**Custom Permissions:**
- `HasActiveSubscription` - Requires active paid subscription
- `HasFeatureAccess` - Tier-based feature access

**Usage Utils:**
- `check_usage_limit(user, resource_type)` - Check if limit exceeded
- `increment_usage(user, resource_type, amount)` - Track usage

## Setup Instructions

### 1. Environment Variables

Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

### 2. Create Stripe Products

In Stripe Dashboard:
1. Create products for Pro and Enterprise tiers
2. Copy Price IDs
3. Update plans:
```bash
python manage.py shell
>>> from apps.subscriptions.models import SubscriptionPlan
>>> pro = SubscriptionPlan.objects.get(tier='pro')
>>> pro.stripe_price_id = 'price_actual_stripe_id'
>>> pro.save()
```

### 3. Configure Webhook

In Stripe Dashboard → Webhooks:
- URL: `https://yourdomain.com/api/webhooks/stripe/`
- Events: checkout.session.completed, customer.subscription.*, invoice.*
- Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Usage Examples

### Create Checkout Session
```javascript
const response = await fetch('/api/v1/subscriptions/subscriptions/create_checkout_session/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan_id: 'uuid-of-pro-plan'
  })
});

const { session_url } = await response.json();
window.location.href = session_url;  // Redirect to Stripe Checkout
```

### Check Usage Limits
```python
from apps.subscriptions.utils import check_usage_limit

allowed, message = check_usage_limit(request.user, 'analyses')
if not allowed:
    return Response({'error': message}, status=403)
```

### Protect Endpoints
```python
from apps.subscriptions.permissions import HasFeatureAccess

class AdvancedAnalysisViewSet(viewsets.ModelViewSet):
    permission_classes = [HasFeatureAccess]
    required_tier = 'pro'  # Requires Pro or Enterprise
```

## Database Schema

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE,
    tier VARCHAR(20) UNIQUE,
    stripe_price_id VARCHAR(100),
    price DECIMAL(10,2),
    analyses_per_month INT,
    chronstudio_projects INT,
    ai_tokens_per_month INT,
    max_video_length INT
);

-- User Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id),
    plan_id UUID REFERENCES subscription_plans(id),
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    status VARCHAR(20),
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN
);
```

## Testing

### Create Free Subscription for User
```bash
python manage.py shell
```
```python
from apps.accounts.models import User
from apps.subscriptions.models import Subscription, SubscriptionPlan

user = User.objects.get(email='test@example.com')
free_plan = SubscriptionPlan.objects.get(tier='free')

Subscription.objects.create(
    user=user,
    plan=free_plan,
    status='active'
)
```

### Test Webhook Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:8000/api/webhooks/stripe/

# Trigger test event
stripe trigger checkout.session.completed
```

## Admin Panel

Access at `/admin/`:
- View all subscription plans
- Manage user subscriptions
- Monitor usage tracking
- View payment history

## Next Steps

1. **Frontend Integration**
   - Add subscription selection UI
   - Integrate Stripe Checkout
   - Display usage meters
   - Handle webhook callbacks

2. **Testing**
   - Test full payment flow
   - Test webhook handlers
   - Test usage limits
   - Test cancellation flow

3. **Production**
   - Switch to live Stripe keys
   - Set up production webhook endpoint
   - Configure email notifications
   - Add grace period handling

## Architecture

```
User Registration
    ↓
Auto-assign Free Plan
    ↓
User Upgrades (Stripe Checkout)
    ↓
Webhook: checkout.session.completed
    ↓
Create/Update Subscription
    ↓
Monthly Usage Tracking
    ↓
Webhook: invoice.payment_succeeded (monthly)
    ↓
Reset Usage Counter
```

## Files Created/Modified

**New Files:**
- `apps/subscriptions/models.py` - 4 models
- `apps/subscriptions/serializers.py` - Serializers
- `apps/subscriptions/views.py` - ViewSets with Stripe integration
- `apps/subscriptions/webhooks.py` - Webhook handlers
- `apps/subscriptions/permissions.py` - Custom permissions
- `apps/subscriptions/utils.py` - Usage tracking utilities
- `apps/subscriptions/management/commands/create_plans.py` - Setup command

**Modified Files:**
- `config/settings/base.py` - Added Stripe config
- `config/settings/development.py` - Added FRONTEND_URL
- `config/urls.py` - Added subscription endpoints
- `apps/subscriptions/urls.py` - API routes
- `apps/subscriptions/webhook_urls.py` - Webhook routes

## Success Metrics

✅ 4 subscription models created  
✅ 3 pricing tiers configured  
✅ Stripe SDK installed  
✅ 10+ API endpoints  
✅ 5 webhook handlers  
✅ Usage tracking system  
✅ Custom permissions  
✅ Admin interface  
✅ Management commands  

**Week 3 Status: COMPLETE** 🚀
