# Subscription Plans - Quick Reference

## ✅ Setup Complete!

### Plans Created

| Plan | Price | Analyses/Month | Projects | Video Length | AI Tokens |
|------|-------|----------------|----------|--------------|-----------|
| **Free** | $0 | 10 | 3 | 5 min | 10,000 |
| **Pro** | $29.99 | 1,000 | 50 | 30 min | 500,000 |
| **Enterprise** | $99.99 | Unlimited* | Unlimited* | Unlimited* | Unlimited* |

*Unlimited = -1 in database

### Test Login Credentials

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Tier**: Free (default)

### API Endpoints Available

```
GET  /api/v1/subscriptions/plans/              # List all plans
GET  /api/v1/subscriptions/subscriptions/      # Get user subscription
POST /api/v1/subscriptions/checkout/           # Create checkout (placeholder)
POST /api/v1/subscriptions/cancel/             # Cancel subscription
GET  /api/v1/subscriptions/usage/              # Get usage stats
POST /api/v1/subscriptions/usage/track/        # Track usage
```

### Frontend Features

✅ Subscription page loads plans  
✅ Free tier users see upgrade prompts  
✅ Pro/Enterprise features are gated  
✅ Usage tracking displays progress bars  
✅ Authentication flow works  

### Dev Mode Features

- No real Stripe charges
- Placeholder price IDs: `price_test_pro`, `price_test_enterprise`
- Checkout creates subscription in DB only
- Can test tier restrictions without payments

### Next Steps for Production

1. **Get Stripe Keys**: Sign up at https://stripe.com
2. **Create Products**: In Stripe Dashboard → Products
3. **Update Price IDs**: Replace placeholders with real Stripe price IDs
4. **Setup Webhooks**: For subscription status updates
5. **Test Cards**: Use Stripe test cards before going live

### Management Commands

```bash
# Seed/update plans
python manage.py seed_plans

# Create test user
python manage.py createsuperuser

# Check existing plans
python manage.py shell -c "from apps.subscriptions.models import SubscriptionPlan; [print(p) for p in SubscriptionPlan.objects.all()]"
```

### Database Schema

**SubscriptionPlan**: Defines tier pricing and limits  
**Subscription**: Links user to plan, tracks Stripe data  
**UsageTracking**: Monitors monthly usage per user  

### Current Status

🟢 Backend: Running on http://127.0.0.1:8000  
🟢 Frontend: Running on http://localhost:5173  
🟢 Database: SQLite with seeded plans  
🟡 Stripe: Using test mode placeholders  

All features functional for development!
