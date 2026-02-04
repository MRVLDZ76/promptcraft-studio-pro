import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that requires authentication
 * Returns null if not authenticated (app will show LoginPage instead)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return null so the parent App component will show LoginPage
    return fallback || null;
  }

  return <>{children}</>;
};
