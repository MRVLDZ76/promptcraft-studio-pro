import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    plans, 
    subscription, 
    usage, 
    loading, 
    error, 
    checkout, 
    cancel,
    refresh 
  } = useSubscription();

  const [cancelling, setCancelling] = useState(false);

  const handleUpgrade = async (planId: string) => {
    try {
      await checkout(planId);
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      setCancelling(true);
      await cancel();
      await refresh();
      alert('Subscription cancelled successfully');
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise': return 'purple';
      case 'pro': return 'blue';
      default: return 'gray';
    }
  };

  const currentTier = user?.subscription_tier || 'free';

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription & Billing
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription and view usage statistics
        </p>
      </div>

      {/* Current Subscription Card */}
      {subscription && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Current Plan
              </h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${getTierColor(currentTier)}-100 text-${getTierColor(currentTier)}-800 dark:bg-${getTierColor(currentTier)}-900/30 dark:text-${getTierColor(currentTier)}-300`}>
                  {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                </span>
                {subscription.status && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {subscription.status}
                  </span>
                )}
              </div>
            </div>
            {subscription.cancel_at_period_end === false && currentTier !== 'free' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>

          {subscription.current_period_end && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subscription.cancel_at_period_end 
                ? `Access until: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : `Renews on: ${new Date(subscription.current_period_end).toLocaleDateString()}`
              }
            </p>
          )}
        </div>
      )}

      {/* Usage Statistics */}
      {usage && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage This Month
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageCard
              title="Transcription Minutes"
              used={usage.transcription_minutes || 0}
              limit={usage.limits?.max_transcription_minutes}
              icon="🎙️"
            />
            <UsageCard
              title="Analysis Queries"
              used={usage.analysis_queries || 0}
              limit={usage.limits?.max_analysis_queries}
              icon="🔍"
            />
            <UsageCard
              title="Projects"
              used={usage.projects_count || 0}
              limit={usage.limits?.max_projects}
              icon="📁"
            />
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Available Plans
        </h2>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.isArray(plans) && plans.length > 0 ? plans.map((plan) => {
            const isCurrentPlan = plan.name.toLowerCase() === currentTier.toLowerCase();
            const features = plan.features || {};
            
            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 ${
                  isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isCurrentPlan && (
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
                    Current Plan
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{plan.billing_period}
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {features.max_transcription_minutes === null 
                      ? 'Unlimited transcription minutes'
                      : `${features.max_transcription_minutes} transcription minutes`
                    }
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {features.max_analysis_queries === null
                      ? 'Unlimited analysis queries'
                      : `${features.max_analysis_queries} analysis queries`
                    }
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {features.max_projects === null
                      ? 'Unlimited projects'
                      : `${features.max_projects} projects`
                    }
                  </li>
                </ul>

                {!isCurrentPlan && plan.name.toLowerCase() !== 'free' && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Upgrade to {plan.name}
                  </button>
                )}

                {isCurrentPlan && (
                  <div className="w-full px-4 py-3 bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 font-semibold rounded-lg text-center">
                    Current Plan
                  </div>
                )}
              </div>
            );
          }) : !loading && (
            <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
              No subscription plans available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Usage card component
interface UsageCardProps {
  title: string;
  used: number;
  limit: number | null | undefined;
  icon: string;
}

const UsageCard: React.FC<UsageCardProps> = ({ title, used, limit, icon }) => {
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
  const isUnlimited = limit === null || limit === undefined;
  
  return (
    <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {used.toLocaleString()}
        {!isUnlimited && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {' '}/ {limit?.toLocaleString()}
          </span>
        )}
      </div>
      {!isUnlimited && (
        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2 mb-1">
          <div
            className={`h-2 rounded-full transition-all ${
              percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <p className="text-xs text-gray-500 dark:text-gray-400">Unlimited</p>
      )}
    </div>
  );
};
