// SerpAPI Service for YouTube Search
// Uses Supabase Edge Function proxy to avoid CORS issues

const USE_PROXY = import.meta.env.VITE_USE_API_ENDPOINT === 'true';
const PROXY_URL = import.meta.env.VITE_API_BASE_URL || 'https://uuohwxcuqnaykpjhrcvu.supabase.co/functions/v1';
const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY || '8497ce60ccb34a61b7bb371343928ddf60dfa38ce0133f9810e06c7cf9f74cd8';
const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';

// Helper function to call SerpAPI via proxy or directly
async function callSerpAPI(engine: string, params: Record<string, any>): Promise<any> {
  if (USE_PROXY) {
    // Use Supabase Edge Function proxy to avoid CORS
    const response = await fetch(`${PROXY_URL}/serpapi-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ engine, params })
    });

    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status}`);
    }

    return response.json();
  } else {
    // Direct call (will have CORS issues in browser)
    const searchParams = new URLSearchParams({
      engine,
      api_key: SERPAPI_KEY,
      ...params
    });

    const response = await fetch(`${SERPAPI_ENDPOINT}?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    return response.json();
  }
}

export interface YouTubeVideoResult {
  position_on_page: number;
  title: string;
  link: string;
  video_id: string;
  channel: {
    name: string;
    link: string;
    verified?: boolean;
    thumbnail: string;
  };
  published_date: string;
  views: number;
  length: string;
  description: string;
  thumbnail: {
    static: string;
  };
}

export interface YouTubeChannelResult {
  position_on_page: number;
  title: string;
  link: string;
  verified: boolean;
  handle: string;
  subscribers: number;
  description: string;
  thumbnail: string;
}

export interface TranscriptSnippet {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptLanguage {
  language: string;
  language_code: string;
}

export interface TranscriptData {
  transcript: TranscriptSnippet[];
  full_transcript: string;
  languages: TranscriptLanguage[];
  video_id: string;
  video_title?: string;
}

export interface TranscriptAPIResponse {
  search_metadata: {
    id: string;
    status: string;
    created_at: string;
    processed_at: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    v: string;
  };
  transcript?: TranscriptSnippet[];
  languages?: TranscriptLanguage[];
}

export interface SerpAPIResponse {
  search_metadata: {
    id: string;
    status: string;
    created_at: string;
    processed_at: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    search_query: string;
  };
  search_information?: {
    total_results: number;
    video_results_state: string;
  };
  video_results?: YouTubeVideoResult[];
  channel_results?: YouTubeChannelResult[];
  shorts_results?: Array<{
    position_on_page: number;
    shorts: Array<{
      title: string;
      link: string;
      thumbnail: string;
      views: number;
      video_id: string;
    }>;
  }>;
}

export interface SearchFilters {
  sortBy?: 'relevance' | 'upload_date' | 'view_count' | 'rating';
  duration?: 'short' | 'medium' | 'long' | 'any'; // <4min, 4-20min, >20min
  uploadDate?: 'hour' | 'today' | 'week' | 'month' | 'year' | 'any';
  features?: ('hd' | 'subtitles' | '4k' | 'live' | 'purchased')[];
}

/**
 * Search YouTube for videos and channels
 */
export async function searchYouTube(
  query: string,
  filters?: SearchFilters
): Promise<SerpAPIResponse> {
  try {
    const params: Record<string, string> = {
      search_query: query
    };

    // Add filters if provided
    if (filters?.sortBy && filters.sortBy !== 'relevance') {
      const sortMap = {
        upload_date: 'CAI%253D',
        view_count: 'CAM%253D',
        rating: 'CAE%253D'
      };
      params.sp = sortMap[filters.sortBy] || '';
    }

    if (filters?.duration && filters.duration !== 'any') {
      const durationMap = {
        short: 'EgQQARgB',
        medium: 'EgQQARgD',
        long: 'EgQQARgC'
      };
      params.sp = durationMap[filters.duration] || '';
    }

    if (filters?.uploadDate && filters.uploadDate !== 'any') {
      const dateMap = {
        hour: 'EgQIARAB',
        today: 'EgQIAhAB',
        week: 'EgQIAxAB',
        month: 'EgQIBBAB',
        year: 'EgQIBRAB'
      };
      params.sp = dateMap[filters.uploadDate] || '';
    }

    const data: SerpAPIResponse = await callSerpAPI('youtube', params);
    
    if (data.search_metadata.status !== 'Success') {
      throw new Error('SerpAPI search failed');
    }

    return data;
  } catch (error) {
    console.error('SerpAPI search error:', error);
    throw error;
  }
}

/**
 * Search for a specific channel
 */
export async function searchChannel(channelName: string): Promise<SerpAPIResponse> {
  return searchYouTube(channelName);
}

/**
 * Get videos from a specific channel by handle or name
 */
export async function getChannelVideos(
  channelHandle: string,
  filters?: SearchFilters
): Promise<YouTubeVideoResult[]> {
  try {
    const cleanHandle = channelHandle.replace(/^@/, '').trim();
    
    // Search for videos from this channel
    const query = `${cleanHandle}`;
    const response = await searchYouTube(query, filters);
    
    // Filter results to only include videos from this channel
    const channelVideos = (response.video_results || []).filter((video: YouTubeVideoResult) => {
      const videoChannel = video.channel.name.toLowerCase();
      const searchChannel = cleanHandle.toLowerCase();
      return videoChannel.includes(searchChannel) || searchChannel.includes(videoChannel);
    });
    
    return channelVideos;
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw error;
  }
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Convert YouTube URL to standard watch format
 */
export function normalizeYouTubeUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

/**
 * Get video transcript from YouTube
 * @param videoId - YouTube video ID
 * @param languageCode - Optional language code (e.g., 'en', 'es-ES')
 * @returns Transcript data with snippets and full text
 */
export async function getVideoTranscript(
  videoId: string,
  languageCode?: string
): Promise<TranscriptData> {
  const params: Record<string, string> = {
    v: videoId
  };

  if (languageCode) {
    params.language_code = languageCode;
  }

  const data: TranscriptAPIResponse = await callSerpAPI('youtube_video_transcript', params);

  if (!data.transcript || data.transcript.length === 0) {
    throw new Error('No transcript available for this video');
  }

  // Combine all snippets into full transcript
  const fullTranscript = data.transcript
    .map(snippet => snippet.text)
    .join(' ')
    .trim();

  return {
    transcript: data.transcript,
    full_transcript: fullTranscript,
    languages: data.languages || [],
    video_id: videoId
  };
}

/**
 * Get transcript with automatic retry for different languages
 */
export async function getVideoTranscriptWithFallback(
  videoId: string,
  preferredLanguage: string = 'en'
): Promise<TranscriptData> {
  try {
    // Try preferred language first
    return await getVideoTranscript(videoId, preferredLanguage);
  } catch (error) {
    console.warn(`Failed to get transcript in ${preferredLanguage}, trying default...`);
    try {
      // Fallback to default language
      return await getVideoTranscript(videoId);
    } catch (fallbackError) {
      throw new Error('No transcript available in any language');
    }
  }
}

/**
 * Format transcript for display with timestamps
 */
export function formatTranscriptWithTimestamps(transcript: TranscriptSnippet[]): string {
  return transcript
    .map(snippet => {
      const minutes = Math.floor(snippet.start / 60);
      const seconds = Math.floor(snippet.start % 60);
      const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      return `[${timestamp}] ${snippet.text}`;
    })
    .join('\n');
}

/**
 * Format view count to human-readable string
 */
export function formatViews(views: number): string {
  if (views >= 1000000000) {
    return `${(views / 1000000000).toFixed(1)}B`;
  }
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

/**
 * Format subscriber count
 */
export function formatSubscribers(subs: number): string {
  return formatViews(subs);
}

/**
 * Fetch YouTube channel details via SerpAPI
 * More reliable than YouTube Data API v3 - no API key setup needed
 */
export interface ChannelDetails {
  title: string;
  channelId: string;
  handle?: string;
  description: string;
  subscribers: number;
  subscribersText: string;
  totalViews?: number;
  totalVideos?: number;
  verified: boolean;
  thumbnail: string;
  bannerImage?: string;
  links?: Array<{
    name: string;
    url: string;
  }>;
}

export async function getChannelDetails(handleOrId: string): Promise<ChannelDetails> {
  try {
    // Clean the handle/ID
    const cleanHandle = handleOrId.replace(/^@/, '').trim();
    
    // Search for the channel using proxy
    const searchData = await callSerpAPI('youtube', {
      search_query: cleanHandle
    });
    
    // Find the channel in search results
    const channelResult = searchData.channel_results?.[0];
    
    if (!channelResult) {
      throw new Error(`Channel not found: ${cleanHandle}`);
    }

    // Extract channel data from search results
    return {
      title: channelResult.title || 'Unknown Channel',
      channelId: channelResult.channel_id || '',
      handle: channelResult.handle || cleanHandle,
      description: channelResult.description || '',
      subscribers: channelResult.subscribers || 0,
      subscribersText: channelResult.subscribers_text || '0 subscribers',
      totalViews: channelResult.total_views,
      totalVideos: channelResult.video_count,
      verified: channelResult.verified || false,
      thumbnail: channelResult.thumbnail || '',
      bannerImage: channelResult.banner_image,
      links: channelResult.links || []
    };
  } catch (error) {
    console.error('Error fetching channel details:', error);
    throw error;
  }
}
