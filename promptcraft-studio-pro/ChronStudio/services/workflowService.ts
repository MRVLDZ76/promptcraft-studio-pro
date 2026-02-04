// Workflow integration with backend APIs

const API_BASE_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

// Type definitions for workflow configurations
export interface NewsConfig {
  keywords: string;
  countries?: string[];
  languages?: string[];
  max_results?: number;
  date_from?: string;
  date_to?: string;
  sources?: string[];
}

export interface SportsConfig {
  sport: 'soccer' | 'basketball' | 'football' | 'baseball' | 'tennis';
  league?: string;
  teams?: string[];
  event_type?: 'fixtures' | 'standings' | 'recent';
  date?: string;
}

export interface LearningConfig {
  topic: string;
  subject?: string;
  sections?: number;
  include_images?: boolean;
}

export interface MusicConfig {
  track_id?: string;
  artist?: string;
  title?: string;
  video_type?: 'lyric' | 'visualizer' | 'performance';
  duration?: number;
}

export interface VideoAdConfig {
  product_name: string;
  brand?: string;
  tagline?: string;
  features?: string[];
  duration?: number;
  cta?: string;
  productImageUrl?: string;      // Main product image
  backgroundImageUrl?: string;   // Background/style reference image
}

// Response types
export interface WorkflowScene {
  scene_number: number;
  narrative_text: string;
  visual_prompt: string;
  duration?: number;
}

export interface NewsResponse {
  articles: Array<{
    title: string;
    description: string;
    url: string;
    source: string;
    published_at: string;
  }>;
  suggested_scenes: WorkflowScene[];
  source: string;
  count: number;
  warning?: string;
}

export interface SportsResponse {
  events: Array<{
    team1: string;
    team2: string;
    score: string;
    league: string;
    date: string;
  }>;
  suggested_scenes: WorkflowScene[];
  source: string;
  count: number;
  warning?: string;
}

export interface LearningResponse {
  content: {
    title: string;
    summary: string;
    paragraphs: string[];
    image_url?: string;
    source_url: string;
  };
  suggested_scenes: WorkflowScene[];
  source: string;
  warning?: string;
}

export interface MusicResponse {
  track: {
    name: string;
    artist: string;
    album: string;
    album_art_url?: string;
    duration_ms: number;
    preview_url?: string;
    lyrics_url?: string;
  };
  suggested_scenes: WorkflowScene[];
  source: string;
  warning?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Helper function for API calls
const apiCall = async (endpoint: string, config: any) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in.');
  }

  const response = await fetch(`${API_BASE_URL}/chronstudio/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  return response.json();
};

// Workflow API Functions
export const fetchNewsWorkflow = async (config: NewsConfig): Promise<NewsResponse> => {
  return apiCall('workflows/news/fetch/', config);
};

export const fetchSportsWorkflow = async (config: SportsConfig): Promise<SportsResponse> => {
  return apiCall('workflows/sports/fetch/', config);
};

export const fetchLearningWorkflow = async (config: LearningConfig): Promise<LearningResponse> => {
  return apiCall('workflows/learning/fetch/', config);
};

export const fetchMusicWorkflow = async (config: MusicConfig): Promise<MusicResponse> => {
  return apiCall('workflows/music/fetch/', config);
};

// Helper function to convert workflow scenes to project content
export const scenesToContent = (scenes: WorkflowScene[]): string => {
  return scenes
    .map((scene, idx) => {
      return `Scene ${idx + 1}:\n${scene.narrative_text}\n\nVisual: ${scene.visual_prompt}`;
    })
    .join('\n\n---\n\n');
};

// Helper function to extract scenes for storyboard
export const scenesToStoryboard = (scenes: WorkflowScene[]) => {
  return scenes.map((scene, idx) => ({
    sceneNumber: idx + 1,
    narrativeText: scene.narrative_text,
    visualPrompt: scene.visual_prompt,
    duration: scene.duration || 5,
  }));
};
