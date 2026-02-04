import React from 'react';

interface UsageLimitWarningProps {
  feature: string;
  used: number;
  limit: number;
  onUpgradeClick?: () => void;
}

/**
 * Warning banner shown when approaching usage limits
 */
export const UsageLimitWarning: React.FC<UsageLimitWarningProps> = ({
  feature,
  used,
  limit,
  onUpgradeClick,
}) => {
  const percentage = (used / limit) * 100;
  
  // Don't show if under 70%
  if (percentage < 70) return null;

  const isNearLimit = percentage >= 70 && percentage < 90;
  const isAtLimit = percentage >= 90;

  return (
    <div className={`rounded-lg p-4 mb-4 ${
      isAtLimit 
        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isAtLimit ? (
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${
            isAtLimit
              ? 'text-red-800 dark:text-red-300'
              : 'text-yellow-800 dark:text-yellow-300'
          }`}>
            {isAtLimit ? 'Usage Limit Reached' : 'Approaching Usage Limit'}
          </h3>
          
          <p className={`text-sm mb-2 ${
            isAtLimit
              ? 'text-red-700 dark:text-red-400'
              : 'text-yellow-700 dark:text-yellow-400'
          }`}>
            You've used <strong>{used.toLocaleString()}</strong> of <strong>{limit.toLocaleString()}</strong> {feature} this month
            {isAtLimit && ' and have reached your limit'}.
          </p>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className={`text-sm font-medium underline ${
                isAtLimit
                  ? 'text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200'
                  : 'text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200'
              }`}
            >
              Upgrade for more capacity →
            </button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2 mt-3">
        <div
          className={`h-2 rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
