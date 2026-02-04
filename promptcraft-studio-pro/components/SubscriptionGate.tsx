import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requiredTier: SubscriptionTier;
  feature: string;
  onUpgradeClick?: () => void;
}

const tierLevels: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * Wrapper component that restricts access based on subscription tier
 */
export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ 
  children, 
  requiredTier,
  feature,
  onUpgradeClick 
}) => {
  const { user } = useAuth();
  const { subscription, plans, loading } = useSubscription();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading subscription...</p>
        </div>
      </div>
    );
  }

  // Get current tier from user or subscription
  const currentTier = (user?.subscription_tier || subscription?.plan?.name?.toLowerCase() || 'free') as SubscriptionTier;
  
  // Check if user has required access
  const hasAccess = tierLevels[currentTier] >= tierLevels[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  // Find the required plan
  const requiredPlan = Array.isArray(plans) ? plans.find(p => p.name.toLowerCase() === requiredTier) : null;

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} Feature
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            {feature} is available on the{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
            </span>{' '}
            plan.
          </p>
          
          {requiredPlan && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Starting at ${requiredPlan.price}/month
            </p>
          )}

          <button
            onClick={onUpgradeClick}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
          </button>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
            Your current plan: <span className="font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
