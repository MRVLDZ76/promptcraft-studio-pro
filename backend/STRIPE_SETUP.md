# Stripe Setup Guide for Development

## Step 1: Get Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Sign up for a free account (no credit card required)
3. Go to [Developers > API Keys](https://dashboard.stripe.com/test/apikeys)
4. You'll see two test keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Starts with `sk_test_` (click "Reveal test key")

## Step 2: Add Keys to Environment

Create or edit `.env` file in the `backend/` directory:

```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE
```

**Note:** The webhook secret is optional for local dev. You'll get it when setting up webhooks.

## Step 3: Create Subscription Plans

Run the management command to seed plans:

```bash
cd C:\Users\Elena\promptStudio\backend
.\venv\Scripts\python.exe manage.py seed_plans
```

This creates:
- **Free Plan**: $0/month (10 analyses, 3 projects, 5 min videos)
- **Pro Plan**: $29.99/month (1,000 analyses, 50 projects, 30 min videos)
- **Enterprise Plan**: $99.99/month (Unlimited everything)

## Step 4: Create Stripe Products (Optional)

To use real Stripe checkout:

1. Go to [Stripe Products](https://dashboard.stripe.com/test/products)
2. Click "Add Product"
3. For **Pro Plan**:
   - Name: "Pro Plan"
   - Price: $29.99
   - Billing period: Monthly
   - Copy the Price ID (starts with `price_`)
4. For **Enterprise Plan**:
   - Name: "Enterprise Plan"
   - Price: $99.99
   - Billing period: Monthly
   - Copy the Price ID

Then update the plans in Django admin with the real Stripe Price IDs.

## Step 5: Test Checkout

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

Any future expiry date, any 3-digit CVC.

## Step 6: Setup Webhooks (Production)

For local testing, use Stripe CLI:

```bash
stripe listen --forward-to http://localhost:8000/api/v1/subscriptions/webhooks/stripe/
```

Copy the webhook signing secret and add to `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

## Development Mode Placeholders

The app works without real Stripe keys using placeholders:
- Frontend shows subscription plans
- Users can "upgrade" (UI only)
- Backend tracks subscriptions in database
- No actual payments processed

Perfect for testing the flow before adding payment processing!
