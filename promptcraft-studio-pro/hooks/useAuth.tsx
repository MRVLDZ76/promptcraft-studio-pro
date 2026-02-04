// Authentication Context and Hook
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            // Optionally refresh user data from server
            try {
              const freshUser = await authService.getCurrentUser();
              setUser(freshUser);
            } catch (error) {
              // If refresh fails but we have stored user, use that (offline mode)
              console.warn('Failed to refresh user, using cached data:', error);
              if (!storedUser) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                setUser(null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear any stale auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        // Always set loading to false, even on error
        console.log('Auth initialization complete');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const response = await authService.register({
        email,
        username,
        password,
        full_name: fullName,
      });
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
