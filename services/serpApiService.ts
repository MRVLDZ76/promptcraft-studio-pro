// SerpAPI Service for YouTube Search
// Uses Supabase Edge Function proxy to avoid CORS issues

const USE_PROXY = import.meta.env.VITE_USE_API_ENDPOINT === 'true';
const PROXY_URL = import.meta.env.VITE_API_BASE_URL || 'https://uuohwxcuqnaykpjhrcvu.supabase.co/functions/v1';
const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY || '8497ce60ccb34a61b7bb371343928ddf60dfa38ce0133f9810e06c7cf9f74cd8';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';

// Helper function to call SerpAPI via proxy or directly
async function callSerpAPI(engine: string, params: Record<string, any>): Promise<any> {
  if (USE_PROXY) {
    // Use Supabase Edge Function proxy to avoid CORS
    const response = await fetch(`${PROXY_URL}/serpapi-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ engine, params })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy request failed: ${response.status} - ${errorText}`);
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
  description?: string;
  extensions?: string[]; // CC, New, etc.
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
  search_information?: {
    results_state?: string;
  };
  transcript?: TranscriptSnippet[];
  languages?: TranscriptLanguage[];
  error?: string;
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
  pageToken?: string; // For pagination
}

export interface ChannelVideosResult {
  videos: YouTubeVideoResult[];
  totalResults?: number;
  nextPageToken?: string;
  hasMore: boolean;
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
  channelId?: string,
  filters?: SearchFilters
): Promise<ChannelVideosResult> {
  try {
    const cleanHandle = channelHandle.replace(/^@/, '').trim();
    
    // Search for videos by exact channel handle in quotes
    const query = `"${cleanHandle}" site:youtube.com`;
    const params: any = {
      search_query: query,
    };
    
    // Add pagination token if provided
    if (filters?.pageToken) {
      params.sp = filters.pageToken;
    } else {
      // Add sorting if specified (only for first page)
      if (filters?.sortBy === 'upload_date') {
        params.sp = 'CAISAhAB'; // Sort by upload date
      } else if (filters?.sortBy === 'view_count') {
        params.sp = 'CAMSAhAB'; // Sort by view count
      }
    }
    
    const response = await callSerpAPI('youtube', params);
    
    // Collect videos from both video_results and shorts_results
    const videos: YouTubeVideoResult[] = [];
    
    // Add regular videos with thumbnail fallback and video_id extraction
    if (response.video_results) {
      response.video_results.forEach((video: any) => {
        videos.push({
          ...video,
          video_id: video.video_id || extractYouTubeVideoId(video.link) || '',
          thumbnail: video.thumbnail || { static: 'https://via.placeholder.com/480x270?text=No+Thumbnail' }
        });
      });
    }
    
    // Add shorts (convert to video format)
    if (response.shorts_results) {
      response.shorts_results.forEach((shortsGroup: any) => {
        if (shortsGroup.shorts && Array.isArray(shortsGroup.shorts)) {
          shortsGroup.shorts.forEach((short: any) => {
            videos.push({
              position_on_page: shortsGroup.position_on_page,
              title: short.title,
              link: short.link,
              channel: {
                name: cleanHandle,
                link: `https://www.youtube.com/@${cleanHandle}`,
                thumbnail: ''
              },
              published_date: 'Unknown',
              views: short.views || 0,
              length: '0:60',
              description: '',
              thumbnail: { static: short.thumbnail || 'https://via.placeholder.com/480x270?text=No+Thumbnail' },
              video_id: short.video_id || extractYouTubeVideoId(short.link) || ''
            });
          });
        }
      });
    }
    
    // Filter to only include videos from the channel (case-insensitive match)
    const filteredVideos = videos.filter(video => {
      const channelName = video.channel?.name?.toLowerCase() || '';
      const handleLower = cleanHandle.toLowerCase();
      return channelName.includes(handleLower) || 
             channelName.replace(/\s/g, '').includes(handleLower.replace(/\s/g, ''));
    });
    
    return {
      videos: filteredVideos,
      totalResults: response.search_information?.total_results,
      nextPageToken: response.pagination?.next_page_token,
      hasMore: !!response.pagination?.next_page_token
    };
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
    v: videoId  // SerpAPI uses 'v' parameter, not 'video_id'
  };

  // Only add language_code if explicitly specified
  // Otherwise, SerpAPI will use the video's default language
  if (languageCode) {
    params.language_code = languageCode;
  }

  console.log('Fetching transcript for video:', videoId, languageCode ? `(language: ${languageCode})` : '(default language)');
  const data: TranscriptAPIResponse = await callSerpAPI('youtube_video_transcript', params);

  // Check for SerpAPI error response
  if (data.error) {
    throw new Error(data.error);
  }

  // Check if transcript data is available
  if (!data.transcript || data.transcript.length === 0) {
    const errorMsg = data.search_information?.results_state === 'Fully empty'
      ? 'This video does not have captions/transcripts available. Please select a video with captions enabled.'
      : 'No transcript available for this video';
    throw new Error(errorMsg);
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
 * Tries in this order: default language -> preferred language -> Spanish -> English
 */
export async function getVideoTranscriptWithFallback(
  videoId: string,
  preferredLanguage?: string
): Promise<TranscriptData> {
  // Try 1: Default language (whatever the video provides)
  try {
    console.log('Trying to get transcript in default language...');
    return await getVideoTranscript(videoId);
  } catch (error) {
    console.warn('Default language failed:', error);
  }

  // Try 2: Preferred language if specified
  if (preferredLanguage) {
    try {
      console.log(`Trying preferred language: ${preferredLanguage}`);
      return await getVideoTranscript(videoId, preferredLanguage);
    } catch (error) {
      console.warn(`Preferred language ${preferredLanguage} failed:`, error);
    }
  }

  // Try 3: Common languages
  const commonLanguages = ['es', 'en', 'es-ES', 'en-US'];
  for (const lang of commonLanguages) {
    try {
      console.log(`Trying language: ${lang}`);
      return await getVideoTranscript(videoId, lang);
    } catch (error) {
      console.warn(`Language ${lang} failed:`, error);
    }
  }

  // All attempts failed
  throw new Error('This video does not have captions/transcripts available. Please select a different video with captions enabled.');
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
    
    console.log('Fetching channel details for:', cleanHandle);
    
    // Use youtube search engine to find the channel
    // Search for the channel name/handle - SerpAPI will return channel_results
    const searchQuery = cleanHandle.startsWith('UC') 
      ? cleanHandle 
      : `${cleanHandle} youtube channel`;
    
    const searchData = await callSerpAPI('youtube', {
      search_query: searchQuery
    });
    
    // Extract channel data from channel_results (first result is usually the correct one)
    const channelResult = searchData.channel_results?.[0];
    
    if (!channelResult) {
      throw new Error(`Channel not found: ${cleanHandle}`);
    }
    
    // SerpAPI channel_results structure
    const metadata = channelResult;
    const stats = channelResult;
    
    // Parse subscriber count from SerpAPI format
    // channel_results has: subscribers (number) and potentially subscriber_count (string)
    let subscriberCount = channelResult.subscribers || 0;
    let subscriberText = channelResult.subscribers 
      ? formatSubscribers(channelResult.subscribers) 
      : '0 subscribers';
    
    // Parse video count - may not be available in channel_results
    let videoCount = 0;

    return {
      title: channelResult.title || 'Unknown Channel',
      channelId: channelResult.channel_id || '',
      handle: channelResult.handle || `@${cleanHandle}`,
      description: channelResult.description || '',
      subscribers: subscriberCount,
      subscribersText: subscriberText,
      totalViews: undefined, // Not available in channel_results
      totalVideos: videoCount,
      verified: channelResult.verified || false,
      thumbnail: channelResult.thumbnail || '',
      bannerImage: undefined,
      links: channelResult.links || []
    };
  } catch (error) {
    console.error('Error fetching channel details:', error);
    throw error;
  }
}
