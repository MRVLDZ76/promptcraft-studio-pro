import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { User, LogOut, Crown, Settings } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const [showMenu, setShowMenu] = React.useState(false);

  if (!isAuthenticated || !user) return null;

  const getTierBadge = () => {
    const tier = user.subscription_tier;
    if (tier === 'enterprise') return { color: 'bg-purple-600', label: 'Enterprise' };
    if (tier === 'pro') return { color: 'bg-blue-600', label: 'Pro' };
    return { color: 'bg-gray-600', label: 'Free' };
  };

  const tierBadge = getTierBadge();

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.username}
          </div>
          <div className={`text-xs ${tierBadge.color} text-white px-2 py-0.5 rounded inline-block`}>
            {tierBadge.label}
          </div>
        </div>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.full_name || user.username}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>

            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Profile</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Crown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Subscription</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
              </button>
            </div>

            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={async () => {
                  await logout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
