/**
 * Social Media Service
 * Fetches creator data from YouTube and Instagram APIs
 */

import { getChannelDetails, ChannelDetails } from './serpApiService';

export interface CreatorProfile {
  platform: 'youtube' | 'instagram';
  username: string;
  displayName: string;
  thumbnail: string;
  followers: string;
  verified: boolean;
  description?: string;
  totalVideos?: number;
  totalViews?: string;
  joinedDate?: string;
  engagement?: string;
}

export interface InstagramProfileData {
  username: string;
  full_name: string;
  profile_picture_url: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  biography?: string;
  is_verified: boolean;
}

/**
 * Fetch YouTube channel data using SerpAPI (no YouTube API key needed)
 * @param channelId - YouTube channel ID or handle (e.g., @username)
 */
export async function fetchYouTubeProfile(
  channelId: string
): Promise<CreatorProfile | null> {
  try {
    // Clean the channel ID (remove @ if present)
    const cleanId = channelId.replace('@', '').trim();
    
    // Use SerpAPI to fetch channel details
    const channelData = await getChannelDetails(cleanId);

    // Format subscriber count
    const formattedSubs = channelData.subscribersText || formatNumber(channelData.subscribers);

    // Format view count
    const formattedViews = channelData.totalViews ? formatNumber(channelData.totalViews) : undefined;

    return {
      platform: 'youtube',
      username: channelData.handle || `@${cleanId}`,
      displayName: channelData.title,
      thumbnail: channelData.thumbnail,
      followers: formattedSubs,
      verified: channelData.verified,
      description: channelData.description,
      totalVideos: channelData.totalVideos,
      totalViews: formattedViews,
    };
  } catch (error) {
    console.error('Error fetching YouTube profile via SerpAPI:', error);
    return null;
  }
}

/**
 * Fetch Instagram profile data
 * Note: Instagram Basic Display API or Instagram Graph API required
 * This is a mock implementation as Instagram API requires OAuth
 * @param username - Instagram username
 * @param accessToken - Instagram API access token
 */
export async function fetchInstagramProfile(
  username: string,
  accessToken?: string
): Promise<CreatorProfile | null> {
  try {
    // Clean the username (remove @ if present)
    const cleanUsername = username.replace('@', '');

    // For production, you'd use Instagram Graph API:
    // const endpoint = `https://graph.instagram.com/v12.0/${userId}?fields=username,name,profile_picture_url,followers_count,media_count,biography&access_token=${accessToken}`;
    
    // Since Instagram API requires OAuth and app setup, we'll provide a mock structure
    // In production, you'd need to:
    // 1. Set up Instagram Basic Display API or Instagram Graph API
    // 2. Implement OAuth flow
    // 3. Get user access token
    // 4. Make authenticated requests

    console.warn('Instagram API requires OAuth authentication. Using fallback data structure.');
    
    // Return a structure that shows what data would be available
    return {
      platform: 'instagram',
      username: `@${cleanUsername}`,
      displayName: cleanUsername,
      thumbnail: `https://ui-avatars.com/api/?name=${cleanUsername}&size=200&background=random`,
      followers: 'Auth Required',
      verified: false,
      description: 'Instagram API requires OAuth authentication to fetch live data.',
      totalVideos: 0,
      engagement: 'N/A',
    };

    // Production implementation would look like:
    /*
    if (!accessToken) {
      throw new Error('Instagram access token required');
    }

    const response = await fetch(
      `https://graph.instagram.com/me?fields=username,name,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
    );
    
    const data: InstagramProfileData = await response.json();
    
    return {
      platform: 'instagram',
      username: `@${data.username}`,
      displayName: data.full_name || data.username,
      thumbnail: data.profile_picture_url,
      followers: formatNumber(data.follower_count),
      verified: data.is_verified,
      description: data.biography,
      totalVideos: data.media_count,
      engagement: calculateEngagement(data.media_count * 1000, data.follower_count),
    };
    */
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    return null;
  }
}

/**
 * Format large numbers with K, M, B suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Calculate engagement rate as a percentage
 */
function calculateEngagement(views: number, followers: number): string {
  if (followers === 0) return '0%';
  const rate = (views / followers) * 100;
  return `${rate.toFixed(1)}%`;
}

/**
 * Detect platform from URL or username
 */
export function detectPlatform(input: string): 'youtube' | 'instagram' | null {
  const cleaned = input.toLowerCase();
  
  if (cleaned.includes('youtube.com') || cleaned.includes('youtu.be')) {
    return 'youtube';
  }
  if (cleaned.includes('instagram.com')) {
    return 'instagram';
  }
  
  // Default to YouTube if starts with @ and no clear indicator
  return null;
}

/**
 * Extract username/channel ID from URL
 */
export function extractUsername(input: string): string {
  // YouTube channel URL patterns
  if (input.includes('youtube.com/channel/')) {
    return input.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
  }
  if (input.includes('youtube.com/@')) {
    return input.split('youtube.com/@')[1].split('/')[0].split('?')[0];
  }
  if (input.includes('youtube.com/c/')) {
    return input.split('youtube.com/c/')[1].split('/')[0].split('?')[0];
  }
  
  // Instagram URL patterns
  if (input.includes('instagram.com/')) {
    return input.split('instagram.com/')[1].split('/')[0].split('?')[0];
  }
  
  // Already a username
  return input.replace('@', '');
}
