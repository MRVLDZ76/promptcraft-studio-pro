// Subscription Hook
import { useState, useEffect } from 'react';
import {
  subscriptionService,
  SubscriptionPlan,
  Subscription,
  UsageTracking,
} from '../services/subscriptionService';

export const useSubscription = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      const data = await subscriptionService.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const loadSubscription = async () => {
    try {
      const data = await subscriptionService.getMySubscription();
      setSubscription(data);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await subscriptionService.getUsage();
      setUsage(data);
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  };

  const checkout = async (planId: string) => {
    try {
      setLoading(true);
      const response = await subscriptionService.createCheckoutSession(planId);
      
      // Check if dev mode response
      if ('dev_mode' in response && response.dev_mode) {
        // Dev mode: subscription created directly, just refresh
        await loadSubscription();
        await loadUsage();
        alert(response.message || 'Subscription upgraded successfully!');
      } else {
        // Production mode: redirect to Stripe checkout
        window.location.href = response.session_url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    try {
      setLoading(true);
      await subscriptionService.cancelSubscription();
      await loadSubscription();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reactivate = async () => {
    try {
      setLoading(true);
      await subscriptionService.reactivateSubscription();
      await loadSubscription();
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Only load if we have auth token
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([loadPlans(), loadSubscription(), loadUsage()]);
      } catch (err: any) {
        console.error('Subscription init error:', err);
        setError(err.message || 'Failed to initialize subscription');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return {
    plans,
    subscription,
    usage,
    loading,
    error,
    checkout,
    cancel,
    reactivate,
    refresh: async () => {
      await Promise.all([loadSubscription(), loadUsage()]);
    },
  };
};
