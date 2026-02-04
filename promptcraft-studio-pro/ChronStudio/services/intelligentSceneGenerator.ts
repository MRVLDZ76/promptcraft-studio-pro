/**
 * Intelligent Scene Generation Service
 * Handles scenes exceeding provider duration limits by:
 * 1. Splitting into optimal segments
 * 2. Daisy-chaining generation using last frames
 * 3. Seamlessly merging segments
 */

import { VideoProvider, PROVIDER_CONFIG } from '../types/videoProviders';
import { generateVideo, remixVideo } from './multiProviderVideoService';
import { Scene } from '../types';

interface SegmentPlan {
  totalDuration: number;
  segments: Array<{
    index: number;
    duration: number;
    startTime: number;
    endTime: number;
    requiresReference: boolean;
  }>;
  method: 'single' | 'split' | 'remix';
}

interface GenerationResult {
  videoUrl: string;
  videoId?: string;
  segments: Array<{
    index: number;
    videoUrl: string;
    videoId?: string;
  }>;
}

/**
 * Analyze scene and create optimal segment plan
 */
export const analyzeSceneDuration = (
  requestedDuration: number,
  provider: VideoProvider,
  nextScene?: Scene
): SegmentPlan => {
  const providerConfig = PROVIDER_CONFIG[provider];
  const maxDuration = Math.max(...providerConfig.durations);
  
  // If within limits, no splitting needed
  if (requestedDuration <= maxDuration) {
    return {
      totalDuration: requestedDuration,
      segments: [{
        index: 0,
        duration: requestedDuration,
        startTime: 0,
        endTime: requestedDuration,
        requiresReference: false
      }],
      method: 'single'
    };
  }
  
  // Check if Sora remix can handle it (better quality than splitting)
  if (provider === 'sora' || provider === 'sora-pro') {
    if (requestedDuration <= maxDuration * 1.5) {
      // Generate at max duration, then remix to extend
      return {
        totalDuration: requestedDuration,
        segments: [
          {
            index: 0,
            duration: maxDuration,
            startTime: 0,
            endTime: maxDuration,
            requiresReference: false
          },
          {
            index: 1,
            duration: requestedDuration - maxDuration,
            startTime: maxDuration,
            endTime: requestedDuration,
            requiresReference: true
          }
        ],
        method: 'remix'
      };
    }
  }
  
  // Split into segments (daisy chain method)
  const segments = [];
  let remaining = requestedDuration;
  let currentTime = 0;
  let segmentIndex = 0;
  
  while (remaining > 0) {
    const segmentDuration = Math.min(maxDuration, remaining);
    segments.push({
      index: segmentIndex,
      duration: segmentDuration,
      startTime: currentTime,
      endTime: currentTime + segmentDuration,
      requiresReference: segmentIndex > 0
    });
    
    remaining -= segmentDuration;
    currentTime += segmentDuration;
    segmentIndex++;
  }
  
  return {
    totalDuration: requestedDuration,
    segments,
    method: 'split'
  };
};

/**
 * Extract last frame from video as base64
 * Uses canvas to capture final frame
 */
const extractLastFrame = async (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    
    video.addEventListener('loadedmetadata', () => {
      // Seek to 0.1s before end to avoid black frames
      video.currentTime = Math.max(0, video.duration - 0.1);
    });
    
    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.95);
      
      // Cleanup
      video.remove();
      canvas.remove();
      
      resolve(base64);
    });
    
    video.addEventListener('error', (e) => {
      reject(new Error(`Video load error: ${e}`));
    });
  });
};

/**
 * Generate complex scene with automatic segmentation
 */
export const generateComplexScene = async (
  scene: Scene,
  provider: VideoProvider,
  config: any,
  referenceImage?: string,
  onProgress?: (progress: string) => void
): Promise<GenerationResult> => {
  const plan = analyzeSceneDuration(scene.durationSeconds, provider);
  
  onProgress?.(`Planning: ${plan.segments.length} segment(s) using ${plan.method} method`);
  
  if (plan.method === 'single') {
    // Simple case: generate normally
    onProgress?.('Generating single video...');
    const result = await generateVideo(scene.visualPrompt, config, referenceImage);
    
    return {
      videoUrl: result.videoUrl,
      videoId: result.videoId,
      segments: [{
        index: 0,
        videoUrl: result.videoUrl,
        videoId: result.videoId
      }]
    };
  }
  
  if (plan.method === 'remix' && (provider === 'sora' || provider === 'sora-pro')) {
    // Two-step process: generate base, then remix to extend
    onProgress?.('Step 1/2: Generating base video...');
    
    const baseConfig = { ...config, duration: plan.segments[0].duration };
    const baseResult = await generateVideo(scene.visualPrompt, baseConfig, referenceImage);
    
    onProgress?.('Step 2/2: Extending video using remix...');
    
    const extendPrompt = `Continue seamlessly: ${scene.visualPrompt}`;
    const remixResult = await remixVideo({
      videoId: baseResult.videoId!,
      newPrompt: extendPrompt,
      provider
    });
    
    return {
      videoUrl: remixResult.videoUrl,
      videoId: remixResult.videoId,
      segments: [
        { index: 0, videoUrl: baseResult.videoUrl, videoId: baseResult.videoId },
        { index: 1, videoUrl: remixResult.videoUrl, videoId: remixResult.videoId }
      ]
    };
  }
  
  // Daisy chain method: generate segments with frame references
  const segments: GenerationResult['segments'] = [];
  let lastVideoUrl: string | undefined;
  
  for (let i = 0; i < plan.segments.length; i++) {
    const segment = plan.segments[i];
    onProgress?.(`Generating segment ${i + 1}/${plan.segments.length} (${segment.duration}s)...`);
    
    let currentPrompt = scene.visualPrompt;
    let currentReference = referenceImage;
    
    // Use last frame from previous segment as reference
    if (segment.requiresReference && lastVideoUrl) {
      onProgress?.(`Extracting reference frame from segment ${i}...`);
      try {
        currentReference = await extractLastFrame(lastVideoUrl);
        currentPrompt = `Continue the exact action seamlessly: ${scene.visualPrompt}`;
      } catch (error) {
        console.warn('Failed to extract last frame, continuing without reference:', error);
      }
    }
    
    const segmentConfig = { ...config, duration: segment.duration };
    const result = await generateVideo(currentPrompt, segmentConfig, currentReference);
    
    segments.push({
      index: i,
      videoUrl: result.videoUrl,
      videoId: result.videoId
    });
    
    lastVideoUrl = result.videoUrl;
    
    // Small delay between segments to avoid rate limiting
    if (i < plan.segments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Merge segments client-side (or return all for backend merging)
  onProgress?.('Segments generated. Merging...');
  
  // For now, return the last segment as the "final" one
  // In production, you'd merge these using FFmpeg on backend
  return {
    videoUrl: segments[segments.length - 1].videoUrl,
    videoId: segments[segments.length - 1].videoId,
    segments
  };
};

/**
 * Determine if next scene is a continuation
 * Uses heuristics: same characters, narrative connection, time continuity
 */
export const isContinuationScene = (
  currentScene: Scene,
  nextScene: Scene,
  allScenes: Scene[]
): boolean => {
  // Check if scenes are sequential
  const isSequential = nextScene.number === currentScene.number + 1;
  if (!isSequential) return false;
  
  // Check character overlap
  const sharedCharacters = currentScene.characterIds.filter(id =>
    nextScene.characterIds.includes(id)
  );
  const hasCharacterContinuity = sharedCharacters.length > 0;
  
  // Check narrative keywords suggesting continuation
  const continuityKeywords = [
    'continue', 'then', 'meanwhile', 'next', 'after',
    'suddenly', 'immediately', 'as', 'while'
  ];
  
  const nextNarrative = nextScene.narrativeText.toLowerCase();
  const hasContinuityKeywords = continuityKeywords.some(keyword =>
    nextNarrative.includes(keyword)
  );
  
  // Check if durations suggest continuation (both short scenes might be parts of one action)
  const totalDuration = currentScene.durationSeconds + nextScene.durationSeconds;
  const isSplitAction = totalDuration <= 20 && hasCharacterContinuity;
  
  return hasCharacterContinuity && (hasContinuityKeywords || isSplitAction);
};

/**
 * Optimize scene boundaries for better flow
 * Suggests merging short continuation scenes
 */
export const optimizeSceneBoundaries = (scenes: Scene[]): Array<{
  sceneIds: string[];
  suggestedDuration: number;
  reasoning: string;
}> => {
  const optimizations = [];
  
  for (let i = 0; i < scenes.length - 1; i++) {
    const current = scenes[i];
    const next = scenes[i + 1];
    
    if (isContinuationScene(current, next, scenes)) {
      const combinedDuration = current.durationSeconds + next.durationSeconds;
      
      if (combinedDuration <= 15) {
        optimizations.push({
          sceneIds: [current.id, next.id],
          suggestedDuration: combinedDuration,
          reasoning: `Scenes ${current.number} and ${next.number} appear to be a continuous action. Merging into single ${combinedDuration}s scene will improve flow.`
        });
      }
    }
  }
  
  return optimizations;
};
