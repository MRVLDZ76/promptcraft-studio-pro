import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import OpenAI from "openai";
import { 
  VideoProvider, 
  VideoGenerationConfig, 
  VideoGenerationResult,
  RemixConfig 
} from "../types/videoProviders";

/**
 * Multi-Provider Video Generation Service
 * Supports: Google Veo 3.1, OpenAI Sora 2, OpenAI Sora 2 Pro
 */

// Initialize clients with proper null checks
const getGoogleAI = () => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey });
};

const getOpenAI = () => {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured. Please add it to your .env file.');
  }
  return new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
};

/**
 * Generate video using Google Veo 3.1 (internal implementation)
 */
const generateVeoVideoInternal = async (
  prompt: string,
  config: VideoGenerationConfig,
  referenceImageBase64?: string
): Promise<VideoGenerationResult> => {
  const ai = getGoogleAI();
  
  const cleanBase64 = referenceImageBase64 
    ? referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '') 
    : undefined;

  const veoConfig: any = {
    numberOfVideos: 1,
    resolution: config.resolution === '1920x1080' ? '1080p' : '720p',
    aspectRatio: config.resolution === '1920x1080' ? '16:9' : '16:9',
  };

  if (cleanBase64) {
    veoConfig.referenceImages = [{
      image: {
        imageBytes: cleanBase64,
        mimeType: 'image/png'
      },
      referenceType: VideoGenerationReferenceType.ASSET
    }];
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt: prompt,
    config: veoConfig
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  // Check for safety filters
  const response = operation.response as any;
  if (response?.generateVideoResponse?.raiMediaFilteredCount > 0) {
    const reasons = response.generateVideoResponse.raiMediaFilteredReasons || [];
    const errorMsg = reasons.length > 0 ? reasons[0] : 'Content filtered by safety policies';
    throw new Error(`VEO_SAFETY_FILTER: ${errorMsg}`);
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("Video generation failed: No video URI returned");
  }

  return {
    videoUrl: `${videoUri}&key=${process.env.API_KEY}`,
    provider: 'veo',
    duration: config.duration,
    resolution: config.resolution,
    status: 'completed'
  };
};

/**
 * Generate video using OpenAI Sora
 */
const generateSoraVideo = async (
  prompt: string,
  config: VideoGenerationConfig,
  referenceImageFile?: File
): Promise<VideoGenerationResult> => {
  const openai = getOpenAI();

  const requestBody: any = {
    prompt: prompt,
    model: config.model || 'sora-2',
    seconds: String(config.duration),
    size: config.resolution
  };

  // Add reference image if provided
  if (referenceImageFile) {
    requestBody.input_reference = referenceImageFile;
  }

  // Create video job
  // @ts-ignore - Sora videos API is in beta
  const video = await openai.videos.create(requestBody);

  // Poll for completion
  let videoJob = video;
  while (videoJob.status === 'queued' || videoJob.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    // @ts-ignore - Sora videos API is in beta
    videoJob = await openai.videos.retrieve(video.id);
    
    if (videoJob.status === 'failed') {
      throw new Error(`Sora generation failed: ${videoJob.error?.message || 'Unknown error'}`);
    }
  }

  // Download video content
  // @ts-ignore - Sora videos API is in beta
  const contentResponse = await openai.videos.downloadContent(video.id);
  const videoBlob = await contentResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);

  return {
    videoUrl: videoUrl,
    videoId: video.id,
    provider: config.provider,
    duration: config.duration,
    resolution: config.resolution,
    status: 'completed'
  };
};

/**
 * Remix/Extend video using OpenAI Sora
 */
export const remixVideo = async (remixConfig: RemixConfig): Promise<VideoGenerationResult> => {
  if (!remixConfig.videoId) {
    throw new Error('Video ID required for remix');
  }

  const openai = getOpenAI();

  // Create remix job
  // @ts-ignore - Sora videos API is in beta
  const video = await openai.videos.remix(remixConfig.videoId, {
    prompt: remixConfig.newPrompt
  });

  // Poll for completion
  let videoJob = video;
  while (videoJob.status === 'queued' || videoJob.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    // @ts-ignore - Sora videos API is in beta
    videoJob = await openai.videos.retrieve(video.id);
    
    if (videoJob.status === 'failed') {
      throw new Error(`Sora remix failed: ${videoJob.error?.message || 'Unknown error'}`);
    }
  }

  // Download remixed video
  // @ts-ignore - Sora videos API is in beta
  const contentResponse = await openai.videos.downloadContent(video.id);
  const videoBlob = await contentResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);

  return {
    videoUrl: videoUrl,
    videoId: video.id,
    provider: remixConfig.provider,
    duration: 0, // Unknown until metadata loads
    resolution: '',
    status: 'completed'
  };
};

/**
 * Main video generation function - routes to appropriate provider
 */
export const generateVideo = async (
  prompt: string,
  config: VideoGenerationConfig,
  referenceImage?: string | File
): Promise<VideoGenerationResult> => {
  try {
    switch (config.provider) {
      case 'veo':
        const refImageBase64 = typeof referenceImage === 'string' ? referenceImage : undefined;
        return await generateVeoVideoInternal(prompt, config, refImageBase64);
      
      case 'sora':
      case 'sora-pro':
        const refImageFile = referenceImage instanceof File ? referenceImage : undefined;
        return await generateSoraVideo(prompt, config, refImageFile);
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  } catch (error: any) {
    console.error(`Video generation error (${config.provider}):`, error);
    throw error;
  }
};

/**
 * List available video providers with their capabilities
 */
export const getAvailableProviders = (): VideoProvider[] => {
  const providers: VideoProvider[] = [];
  
  // Check Google API key (Gemini) - not VITE_ prefixed in .env
  const googleKey = import.meta.env.GEMINI_API_KEY;
  if (googleKey && googleKey !== 'your_gemini_api_key_here') {
    providers.push('veo');
  }
  
  // Check OpenAI API key - not VITE_ prefixed in .env
  const openaiKey = import.meta.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'sk-your-openai-key-here' && !openaiKey.includes('your-openai-key')) {
    providers.push('sora', 'sora-pro');
  }
  
  return providers;
};

/**
 * Delete Sora video from OpenAI storage
 */
export const deleteSoraVideo = async (videoId: string): Promise<boolean> => {
  try {
    const openai = getOpenAI();
    // @ts-ignore - Sora videos API is in beta
    await openai.videos.delete(videoId);
    return true;
  } catch (error) {
    console.error('Failed to delete Sora video:', error);
    return false;
  }
};

// Legacy export for backward compatibility
export const generateVeoVideo = async (
  prompt: string,
  referenceImageBase64?: string
): Promise<string> => {
  const result = await generateVideo(prompt, {
    provider: 'veo',
    duration: 8,
    resolution: '1280x720',
    quality: 'standard'
  }, referenceImageBase64);
  
  return result.videoUrl;
};
