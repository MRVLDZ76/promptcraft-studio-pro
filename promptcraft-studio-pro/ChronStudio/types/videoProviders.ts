/**
 * Video Generation Provider Types
 */
export type VideoProvider = 'veo' | 'sora' | 'sora-pro';

export interface VideoGenerationConfig {
  provider: VideoProvider;
  duration: number; // seconds
  resolution: string; // e.g., "1280x720", "1792x1024"
  quality?: 'standard' | 'high' | 'preview';
  model?: string; // specific model version
}

export interface VideoGenerationResult {
  videoUrl: string;
  videoId?: string; // For providers that support video IDs (Sora)
  provider: VideoProvider;
  duration: number;
  resolution: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface RemixConfig {
  videoId: string;
  newPrompt: string;
  provider: VideoProvider;
}

/**
 * Provider-specific configurations
 */
export const PROVIDER_CONFIG = {
  veo: {
    name: 'Google Veo 3.1',
    model: 'veo-3.1-generate-preview',
    durations: [5, 8, 10, 12, 15],
    resolutions: ['1280x720', '1920x1080'],
    supportsRemix: false,
    supportsReferenceImage: true,
    maxPromptLength: 500
  },
  sora: {
    name: 'OpenAI Sora 2',
    model: 'sora-2',
    durations: [4, 8, 12],
    resolutions: ['720x1280', '1280x720', '1024x1792', '1792x1024'],
    supportsRemix: true,
    supportsReferenceImage: true,
    maxPromptLength: 1000
  },
  'sora-pro': {
    name: 'OpenAI Sora 2 Pro',
    model: 'sora-2-pro',
    durations: [4, 8, 12],
    resolutions: ['720x1280', '1280x720', '1024x1792', '1792x1024'],
    supportsRemix: true,
    supportsReferenceImage: true,
    maxPromptLength: 1000
  }
} as const;

/**
 * Get available durations for a provider
 */
export const getProviderDurations = (provider: VideoProvider): number[] => {
  return [...PROVIDER_CONFIG[provider].durations];
};

/**
 * Get available resolutions for a provider
 */
export const getProviderResolutions = (provider: VideoProvider): string[] => {
  return [...PROVIDER_CONFIG[provider].resolutions];
};

/**
 * Check if provider supports remix
 */
export const supportsRemix = (provider: VideoProvider): boolean => {
  return PROVIDER_CONFIG[provider].supportsRemix;
};

/**
 * Get default config for provider
 */
export const getDefaultConfig = (provider: VideoProvider): VideoGenerationConfig => {
  const config = PROVIDER_CONFIG[provider];
  return {
    provider,
    duration: config.durations[1] || config.durations[0], // Default to middle option
    resolution: config.resolutions[1] || config.resolutions[0],
    quality: 'standard',
    model: config.model
  };
};
