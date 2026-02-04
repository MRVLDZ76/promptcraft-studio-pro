// Subscription Service
import apiClient from './apiClient';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  price: string;
  currency: string;
  billing_period: string;
  stripe_price_id: string;
  is_active: boolean;
  features: {
    max_transcription_minutes: number | null;
    max_analysis_queries: number | null;
    max_projects: number | null;
    ai_tokens_per_month: number | null;
  };
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user: number;
  plan: string;
  plan_details: SubscriptionPlan;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  transcription_minutes: number;
  analysis_queries: number;
  ai_tokens_used: number;
  limits: {
    max_transcription_minutes: number | null;
    max_analysis_queries: number | null;
    ai_tokens_per_month: number | null;
  };
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  receipt_url?: string;
}

class SubscriptionService {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[] | {results: SubscriptionPlan[]}>('/subscriptions/plans/');
    const data = response.data as any;
    return data.results || data;
  }

  async getMySubscription(): Promise<Subscription> {
    const response = await apiClient.get<Subscription[] | {results: Subscription[]}>('/subscriptions/subscriptions/');
    const data = response.data as any;
    const results = data.results || data;
    return Array.isArray(results) ? results[0] : results;
  }

  async createCheckoutSession(planId: string): Promise<{ 
    session_id?: string; 
    session_url?: string;
    dev_mode?: boolean;
    message?: string;
    subscription?: Subscription;
  }> {
    const response = await apiClient.post('/subscriptions/subscriptions/create_checkout_session/', {
      plan_id: planId,
    });
    return response.data;
  }

  async cancelSubscription(): Promise<void> {
    await apiClient.post('/subscriptions/subscriptions/cancel_subscription/');
  }

  async reactivateSubscription(): Promise<void> {
    await apiClient.post('/subscriptions/subscriptions/reactivate_subscription/');
  }

  async getUsage(): Promise<UsageTracking> {
    const response = await apiClient.get<UsageTracking[] | {results: UsageTracking[]}>('/subscriptions/usage/');
    const data = response.data as any;
    const results = data.results || data;
    return Array.isArray(results) ? results[0] : results;
  }

  async getPaymentHistory(): Promise<PaymentHistory[]> {
    const response = await apiClient.get<PaymentHistory[] | {results: PaymentHistory[]}>('/subscriptions/payments/');
    const data = response.data as any;
    return data.results || data;
  }

  async trackUsage(type: string, amount: number): Promise<void> {
    await apiClient.post('/subscriptions/usage/track/', {
      usage_type: type,
      amount: amount,
    });
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;

// Export trackUsage as a standalone function
export const trackUsage = (type: string, amount: number) => 
  subscriptionService.trackUsage(type, amount);
