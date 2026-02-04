import { useState, useCallback } from 'react';
import { subscriptionService } from '../services/subscriptionService';

type UsageType = 'transcription_minutes' | 'analysis_queries' | 'projects';

interface UseUsageTrackingReturn {
  tracking: boolean;
  error: string | null;
  track: (type: UsageType, amount: number) => Promise<void>;
  checkLimit: (type: UsageType, used: number, limit: number | null) => boolean;
}

/**
 * Hook for tracking feature usage and checking limits
 */
export const useUsageTracking = (): UseUsageTrackingReturn => {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = useCallback(async (type: UsageType, amount: number) => {
    try {
      setTracking(true);
      setError(null);
      await subscriptionService.trackUsage(type, amount);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to track usage';
      setError(message);
      throw new Error(message);
    } finally {
      setTracking(false);
    }
  }, []);

  const checkLimit = useCallback((type: UsageType, used: number, limit: number | null): boolean => {
    // Unlimited if limit is null
    if (limit === null) return true;
    
    // Check if under limit
    return used < limit;
  }, []);

  return {
    tracking,
    error,
    track,
    checkLimit,
  };
};
