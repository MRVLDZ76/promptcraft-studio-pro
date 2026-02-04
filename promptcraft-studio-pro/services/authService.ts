// Authentication Service
import apiClient from './apiClient';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/', credentials);
    const { access, refresh, user } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register/', {
      ...data,
      password_confirm: data.password, // Add password confirmation
    });
    const { access, refresh, user } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me/');
    const user = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/auth/me/', data);
    const user = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
}

export const authService = new AuthService();
export default authService;
