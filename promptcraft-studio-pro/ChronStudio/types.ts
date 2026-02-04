export enum ProjectCategory {
  BIBLICAL = 'BIBLICAL',
  HISTORICAL = 'HISTORICAL',
  CUSTOM = 'CUSTOM',
  NEWS = 'NEWS',
  SPORTS = 'SPORTS',
  LEARNING = 'LEARNING',
  MUSIC = 'MUSIC',
  VIDEO_ADS = 'VIDEO_ADS'
}

export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  PENDING_RENDER = 'pending_render',
  RENDERING = 'rendering',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  FAILED = 'failed'
}

export enum StoryStyle {
  DOCUMENTARY = 'DOCUMENTARY',
  CINEMATIC_DRAMA = 'CINEMATIC_DRAMA',
  ANIMATED_STYLIZED = 'ANIMATED_STYLIZED',
  RETRO_FUTURISM = 'RETRO_FUTURISM',
  GRITTY_REALISM = 'GRITTY_REALISM',
  FAIRYTALE = 'FAIRYTALE',
  LOW_POLY_3D = 'LOW_POLY_3D',
  VINTAGE_KODACHROME = 'VINTAGE_KODACHROME',
  SURREAL_DREAMSCAPE = 'SURREAL_DREAMSCAPE',
  PENCIL_SKETCH = 'PENCIL_SKETCH',
  NEO_NOIR = 'NEO_NOIR'
}

export enum ProductionMode {
  INTEGRATED = 'INTEGRATED', // Generates assets inside the app
  EXTERNAL = 'EXTERNAL'      // Generates prompts for external use
}

export enum ContentProcessingMode {
  PRESERVE = 'PRESERVE',     // Keep content exactly as provided (literal)
  POLISH = 'POLISH',         // Fix typos, grammar, structure only
  ENHANCE = 'ENHANCE',       // Expand with context while preserving main ideas
  CREATIVE = 'CREATIVE',     // AI interprets and adds narrative elements (default)
  REIMAGINE = 'REIMAGINE'    // Complete AI transformation with user parameters
}

export interface Character {
  id: string;
  name: string;
  role: string;
  visualDescription: string;
  voiceDescription: string;
  referenceImageUrl?: string; 
}

export interface Scene {
  id: string;
  number: number;
  durationSeconds: number;
  narrativeText: string;
  visualPrompt: string; 
  status: 'pending' | 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  videoId?: string; // For providers that support video IDs (Sora)
  provider?: string; // Which AI provider generated this video
  characterIds: string[]; 
  copied?: boolean;
}

export interface ProjectData {
  id?: string; // UUID from backend (optional for new projects)
  category: ProjectCategory;
  mode: ProductionMode; 
  title: string; 
  segment: string;
  content: string;
  contextNote: string; 
  negativePrompt: string; // Things to avoid in generation (text, watermarks, etc.)
  
  // Content Processing Mode
  processingMode?: ContentProcessingMode;
  reimagineParams?: {
    tone?: string;
    perspective?: string;
    emphasis?: string;
    targetLength?: 'short' | 'medium' | 'long';
    addElements?: string[];
  };
  
  // Status tracking
  status?: ProjectStatus;
  completionPercentage?: number; // 0-100
  
  summary: string;
  setting: {
    year: string;
    region: string;
    landscape: string;
  };
  style: StoryStyle;
  characters: Character[];
  storyboard: Scene[];
  
  // Workflow-specific config (for News, Sports, Learning, Music, Video Ads)
  workflowConfig?: any;
  
  // Asset tracking
  thumbnailUrl?: string;
  finalVideoUrl?: string;
  durationSeconds?: number;
  
  // Social media
  youtubeUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  
  // Organization
  folder?: string;
  tags?: string[];
  isFavorite?: boolean;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export enum Step {
  TEMPLATE = 0,
  INPUT = 1,
  CHARACTERS = 2,
  STORYBOARD = 3,
  PRODUCTION = 4
}

// Asset Management Types
export interface Asset {
  id: string;
  projectId: string;
  userId: string;
  assetType: 'image' | 'video' | 'audio' | 'thumbnail';
  fileUrl: string;
  fileSizeMb: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  description?: string;
  tags?: string[];
  createdAt: string;
}

// Social Media Upload Types
export interface SocialMediaUpload {
  id: string;
  projectId: string;
  userId: string;
  platform: 'youtube' | 'instagram' | 'facebook';
  status: 'pending' | 'uploading' | 'processing' | 'published' | 'failed';
  uploadConfig: any; // Platform-specific config
  platformId?: string;
  platformUrl?: string;
  errorMessage?: string;
  createdAt: string;
  publishedAt?: string;
}

// Workflow Config Types
export interface NewsConfig {
  sources?: string[];
  countries?: string[];
  languages?: string[];
  categories?: string[];
  keywords?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: 'relevance' | 'popularity' | 'publishedAt';
}

export interface SportsConfig {
  sport?: 'football' | 'basketball' | 'baseball' | 'soccer' | 'tennis';
  league?: string;
  teams?: string[];
  players?: string[];
  eventType?: 'game' | 'highlight' | 'recap' | 'analysis';
  date?: string;
  includeStats?: boolean;
}

export interface LearningConfig {
  subject?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetAudience?: 'kids' | 'teens' | 'adults';
  includeQuiz?: boolean;
  references?: string[];
  visualStyle?: 'animated' | 'live-action' | 'mixed';
}

export interface MusicConfig {
  trackId?: string;
  artistName?: string;
  songTitle?: string;
  videoType?: 'lyric' | 'visualizer' | 'narrative' | 'performance';
  syncToBeats?: boolean;
  colorPalette?: string[];
  includeArtistFootage?: boolean;
}

export interface VideoAdConfig {
  productName?: string;
  brandName?: string;
  tagline?: string;
  keyFeatures?: string[];
  targetAudience?: string;
  adDuration?: 15 | 30 | 60;
  callToAction?: string;
  tone?: 'professional' | 'casual' | 'humorous' | 'inspirational';
  includeProductShots?: boolean;
  includePricing?: boolean;
  productImageUrl?: string;      // Main product image
  backgroundImageUrl?: string;   // Background/style reference image
}