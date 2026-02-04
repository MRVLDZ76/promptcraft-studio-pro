# Authentication & Subscription System - Usage Guide

## Overview

Complete authentication and subscription management system integrated with Django backend.

## Components Created

### 1. **ProtectedRoute** - Authentication Guard
Wraps components that require user login.

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

// Wrap any component that needs authentication
<ProtectedRoute 
  onUnauthorized={() => setShowAuthModal(true)}
>
  <YourProtectedComponent />
</ProtectedRoute>
```

### 2. **SubscriptionGate** - Tier-Based Access Control
Restricts features based on subscription level.

```tsx
import { SubscriptionGate } from './components/SubscriptionGate';

// Restrict feature to Pro+ users
<SubscriptionGate
  requiredTier="pro"
  feature="Advanced AI Analysis"
  onUpgradeClick={() => navigate('/subscription')}
>
  <AdvancedFeatureComponent />
</SubscriptionGate>

// Enterprise-only feature
<SubscriptionGate
  requiredTier="enterprise"
  feature="Custom API Integration"
>
  <EnterpriseFeature />
</SubscriptionGate>
```

### 3. **SubscriptionPage** - Full Subscription Management
Complete page for managing subscription, viewing usage, and upgrading.

```tsx
import { SubscriptionPage } from './components/SubscriptionPage';

// Add to your routing
<SubscriptionPage />
```

### 4. **useUsageTracking** - Track Feature Usage
Hook for tracking and validating usage limits.

```tsx
import { useUsageTracking } from './hooks/useUsageTracking';
import { useSubscription } from './hooks/useSubscription';

function TranscriptionComponent() {
  const { track, checkLimit } = useUsageTracking();
  const { usage } = useSubscription();

  const handleTranscribe = async (audioMinutes: number) => {
    // Check if under limit
    const canUse = checkLimit(
      'transcription_minutes',
      usage?.transcription_minutes || 0,
      usage?.limits?.max_transcription_minutes
    );

    if (!canUse) {
      alert('Transcription limit reached. Please upgrade.');
      return;
    }

    try {
      // Perform transcription...
      
      // Track usage
      await track('transcription_minutes', audioMinutes);
    } catch (error) {
      console.error('Tracking failed:', error);
    }
  };
}
```

### 5. **UsageLimitWarning** - Visual Usage Alerts
Shows warnings when approaching limits.

```tsx
import { UsageLimitWarning } from './components/UsageLimitWarning';
import { useSubscription } from './hooks/useSubscription';

function Dashboard() {
  const { usage } = useSubscription();

  return (
    <div>
      {/* Shows warning at 70%+ usage */}
      <UsageLimitWarning
        feature="transcription minutes"
        used={usage?.transcription_minutes || 0}
        limit={usage?.limits?.max_transcription_minutes || 30}
        onUpgradeClick={() => navigate('/subscription')}
      />
      
      <YourContent />
    </div>
  );
}
```

## Complete Integration Example

Here's how to integrate everything into App.tsx:

```tsx
import React, { useState } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SubscriptionGate } from './components/SubscriptionGate';
import { SubscriptionPage } from './components/SubscriptionPage';
import { UsageLimitWarning } from './components/UsageLimitWarning';
import { useAuth } from './hooks/useAuth';
import { useSubscription } from './hooks/useSubscription';
import { useUsageTracking } from './hooks/useUsageTracking';

type Page = 'home' | 'transcription' | 'analysis' | 'subscription';

function App() {
  const { isAuthenticated } = useAuth();
  const { usage } = useSubscription();
  const { track } = useUsageTracking();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Navigation
  const navigate = (page: Page) => setCurrentPage(page);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex gap-4">
            <button onClick={() => navigate('home')}>Home</button>
            <button onClick={() => navigate('transcription')}>Transcription</button>
            <button onClick={() => navigate('analysis')}>Analysis</button>
            <button onClick={() => navigate('subscription')}>Subscription</button>
          </div>
          
          {!isAuthenticated ? (
            <button onClick={() => setShowAuthModal(true)}>Login</button>
          ) : (
            <UserMenu />
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Usage Warnings */}
        {usage && (
          <>
            <UsageLimitWarning
              feature="transcription minutes"
              used={usage.transcription_minutes || 0}
              limit={usage.limits?.max_transcription_minutes || 30}
              onUpgradeClick={() => navigate('subscription')}
            />
            <UsageLimitWarning
              feature="analysis queries"
              used={usage.analysis_queries || 0}
              limit={usage.limits?.max_analysis_queries || 10}
              onUpgradeClick={() => navigate('subscription')}
            />
          </>
        )}

        {/* Pages with Protection */}
        {currentPage === 'home' && (
          <div>
            <h1>Welcome to PromptCraft Studio Pro</h1>
          </div>
        )}

        {currentPage === 'transcription' && (
          <ProtectedRoute onUnauthorized={() => setShowAuthModal(true)}>
            <SubscriptionGate
              requiredTier="free"
              feature="Audio Transcription"
              onUpgradeClick={() => navigate('subscription')}
            >
              <TranscriptionStudio onTrack={track} />
            </SubscriptionGate>
          </ProtectedRoute>
        )}

        {currentPage === 'analysis' && (
          <ProtectedRoute onUnauthorized={() => setShowAuthModal(true)}>
            <SubscriptionGate
              requiredTier="pro"
              feature="Advanced Analysis"
              onUpgradeClick={() => navigate('subscription')}
            >
              <AnalysisStudio onTrack={track} />
            </SubscriptionGate>
          </ProtectedRoute>
        )}

        {currentPage === 'subscription' && (
          <ProtectedRoute onUnauthorized={() => setShowAuthModal(true)}>
            <SubscriptionPage />
          </ProtectedRoute>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
```

## Feature-Specific Usage Tracking

### Example: Transcription Feature
```tsx
import { useUsageTracking } from './hooks/useUsageTracking';
import { useSubscription } from './hooks/useSubscription';

function TranscriptionStudio({ onTrack }: { onTrack?: any }) {
  const { track, checkLimit } = useUsageTracking();
  const { usage } = useSubscription();

  const handleTranscribe = async (audioFile: File) => {
    const durationMinutes = await getAudioDuration(audioFile);
    
    // Check limit before processing
    if (!checkLimit(
      'transcription_minutes',
      usage?.transcription_minutes || 0,
      usage?.limits?.max_transcription_minutes
    )) {
      alert('Monthly transcription limit reached. Upgrade for more capacity.');
      return;
    }

    // Process transcription...
    const result = await transcribeAudio(audioFile);

    // Track usage after success
    await track('transcription_minutes', durationMinutes);
    
    return result;
  };
}
```

### Example: Analysis Feature
```tsx
function AnalysisStudio({ onTrack }: { onTrack?: any }) {
  const { track, checkLimit } = useUsageTracking();
  const { usage } = useSubscription();

  const handleAnalyze = async (text: string) => {
    // Check limit
    if (!checkLimit(
      'analysis_queries',
      usage?.analysis_queries || 0,
      usage?.limits?.max_analysis_queries
    )) {
      alert('Monthly analysis limit reached. Upgrade to Pro for more queries.');
      return;
    }

    // Perform analysis...
    const result = await analyzeText(text);

    // Track usage
    await track('analysis_queries', 1);
    
    return result;
  };
}
```

## Subscription Tiers

### Free Tier
- ✅ Basic features
- ✅ 30 transcription minutes/month
- ✅ 10 analysis queries/month
- ✅ 3 projects

### Pro Tier ($29.99/month)
- ✅ All Free features
- ✅ 500 transcription minutes/month
- ✅ 1,000 analysis queries/month
- ✅ 50 projects
- ✅ Advanced AI features

### Enterprise Tier ($99.99/month)
- ✅ All Pro features
- ✅ **Unlimited** transcription minutes
- ✅ **Unlimited** analysis queries
- ✅ **Unlimited** projects
- ✅ Priority support
- ✅ Custom integrations

## Backend API Endpoints Used

- `POST /api/v1/auth/register/` - Register new user
- `POST /api/v1/auth/login/` - Login
- `GET /api/v1/auth/user/` - Get current user
- `GET /api/v1/subscriptions/plans/` - List plans
- `POST /api/v1/subscriptions/checkout/` - Create checkout
- `POST /api/v1/subscriptions/cancel/` - Cancel subscription
- `GET /api/v1/subscriptions/usage/` - Get usage stats
- `POST /api/v1/subscriptions/usage/track/` - Track usage

## Testing Checklist

- [ ] User can register and login
- [ ] Protected routes redirect unauthenticated users
- [ ] Subscription gate blocks lower-tier users
- [ ] Usage tracking increments correctly
- [ ] Usage warnings show at 70%+ usage
- [ ] Subscription page displays plans correctly
- [ ] Stripe checkout redirects work
- [ ] Usage limits are enforced
- [ ] Tier badges display correctly
- [ ] Upgrade flow works end-to-end
