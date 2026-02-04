// Social Media Upload Service
// Integrates with backend SocialMediaUploadViewSet

const API_BASE_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// Type definitions
export interface SocialMediaUploadConfig {
  platform: 'youtube' | 'instagram' | 'facebook';
  title?: string;
  description?: string;
  tags?: string[];
  privacy?: 'public' | 'private' | 'unlisted';
  scheduledPublishTime?: string;
  thumbnail?: File | string;
  categoryId?: string;
  playlist?: string;
  location?: string;
  enableComments?: boolean;
  enableRatings?: boolean;
}

export interface SocialMediaUploadStatus {
  id: string;
  projectId: string;
  platform: 'youtube' | 'instagram' | 'facebook';
  status: 'pending' | 'uploading' | 'processing' | 'published' | 'failed';
  uploadConfig: any;
  platformId?: string;
  platformUrl?: string;
  errorMessage?: string;
  progress?: number;
  createdAt: string;
  publishedAt?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// API call helper
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in.');
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}/chronstudio/social-uploads/${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Fetch all social media uploads
export const fetchSocialUploads = async (projectId?: string): Promise<SocialMediaUploadStatus[]> => {
  const endpoint = projectId ? `?project=${projectId}` : '';
  const data = await apiCall(endpoint);
  return data.results || data;
};

// Fetch single upload by ID
export const fetchSocialUpload = async (uploadId: string): Promise<SocialMediaUploadStatus> => {
  return apiCall(`${uploadId}/`);
};

// Create new social media upload
export const createSocialUpload = async (
  projectId: string,
  videoUrl: string,
  config: SocialMediaUploadConfig
): Promise<SocialMediaUploadStatus> => {
  return apiCall('', 'POST', {
    project: projectId,
    platform: config.platform,
    upload_config: {
      video_url: videoUrl,
      title: config.title,
      description: config.description,
      tags: config.tags || [],
      privacy: config.privacy || 'public',
      scheduled_publish_time: config.scheduledPublishTime,
      thumbnail: config.thumbnail,
      category_id: config.categoryId,
      playlist: config.playlist,
      location: config.location,
      enable_comments: config.enableComments !== false,
      enable_ratings: config.enableRatings !== false,
    },
  });
};

// Cancel upload
export const cancelSocialUpload = async (uploadId: string): Promise<void> => {
  await apiCall(`${uploadId}/cancel/`, 'POST');
};

// Retry failed upload
export const retrySocialUpload = async (uploadId: string): Promise<SocialMediaUploadStatus> => {
  return apiCall(`${uploadId}/retry/`, 'POST');
};

// Delete upload record
export const deleteSocialUpload = async (uploadId: string): Promise<void> => {
  await apiCall(`${uploadId}/`, 'DELETE');
};

// Platform-specific helpers
export const getPlatformName = (platform: string): string => {
  const names: Record<string, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    facebook: 'Facebook',
  };
  return names[platform] || platform;
};

export const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    youtube: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    instagram: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    facebook: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };
  return colors[platform] || 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400',
    uploading: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    processing: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    published: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    failed: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };
  return colors[status] || 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400';
};

export const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    pending: '⏳',
    uploading: '⬆️',
    processing: '⚙️',
    published: '✅',
    failed: '❌',
  };
  return icons[status] || '•';
};

// YouTube categories (for reference)
export const YOUTUBE_CATEGORIES = [
  { id: '1', name: 'Film & Animation' },
  { id: '2', name: 'Autos & Vehicles' },
  { id: '10', name: 'Music' },
  { id: '15', name: 'Pets & Animals' },
  { id: '17', name: 'Sports' },
  { id: '19', name: 'Travel & Events' },
  { id: '20', name: 'Gaming' },
  { id: '22', name: 'People & Blogs' },
  { id: '23', name: 'Comedy' },
  { id: '24', name: 'Entertainment' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
  { id: '27', name: 'Education' },
  { id: '28', name: 'Science & Technology' },
];

// Privacy options
export const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view' },
  { value: 'unlisted', label: 'Unlisted', description: 'Anyone with link' },
  { value: 'private', label: 'Private', description: 'Only you' },
];
