/**
 * Publishing Studio - TypeScript Type Definitions
 * Multi-modal content creation platform for books, audiobooks, and courses
 */

// ==================== ENUMS ====================

export enum ProjectType {
  NOVEL = 'NOVEL',
  COURSE = 'COURSE',
  GUIDE = 'GUIDE',
  MEMOIR = 'MEMOIR',
  CHILDREN = 'CHILDREN',
  TECHNICAL = 'TECHNICAL',
  CUSTOM = 'CUSTOM',
}

export enum ProcessingMode {
  PRESERVE = 'PRESERVE',
  POLISH = 'POLISH',
  ENHANCE = 'ENHANCE',
  CREATIVE = 'CREATIVE',
  REIMAGINE = 'REIMAGINE',
}

export enum BlockStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum BookStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ==================== INTERFACES ====================

export interface ReimagineParameters {
  tone?: string;
  perspective?: string;
  targetAudience?: string;
  emphasis?: string;
  addElements?: string;
  targetLength?: 'short' | 'medium' | 'long';
}

export interface ContentBlock {
  id: number;
  chapter: number;
  sequence_order: number;
  
  // Content
  input_text: string;
  processed_text: string;
  
  // Processing
  processing_mode: ProcessingMode;
  mode_parameters: ReimagineParameters;
  
  // Generated Assets
  image_url: string;
  image_prompt: string;
  audio_url: string;
  audio_duration: number;
  
  // Status
  status: BlockStatus;
  error_message: string;
  
  // Metadata
  word_count: number;
  character_count: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export interface ContentBlockListItem {
  id: number;
  sequence_order: number;
  processing_mode: ProcessingMode;
  status: BlockStatus;
  word_count: number;
  has_image: boolean;
  has_audio: boolean;
}

export interface Chapter {
  id: number;
  book: number;
  chapter_number: number;
  
  // Content
  title: string;
  subtitle: string;
  summary: string;
  
  // Processing
  processing_mode: string;
  
  // Generated Assets
  audio_url: string;
  
  // Metadata
  word_count: number;
  estimated_pages: number;
  blocks: ContentBlock[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ChapterListItem {
  id: number;
  chapter_number: number;
  title: string;
  subtitle: string;
  word_count: number;
  estimated_pages: number;
  block_count: number;
  completion_percentage: number;
}

export interface BookProject {
  id: number;
  user: number;
  
  // Basic Info
  title: string;
  subtitle: string;
  author_name: string;
  description: string;
  
  // Project Configuration
  project_type: ProjectType;
  default_processing_mode: ProcessingMode;
  
  // Critical Features
  global_context: string;
  random_seed: number;
  
  // Generation Settings
  enable_images: boolean;
  enable_audio: boolean;
  image_style: string;
  voice_model: string;
  
  // Cover & Publishing Metadata
  cover_image_url: string;
  cover_prompt: string;
  back_cover_text: string;
  author_bio: string;
  dedication: string;
  acknowledgments: string;
  isbn: string;
  publisher: string;
  copyright_year: number;
  edition: string;
  
  // Output Formats
  generate_pdf: boolean;
  generate_epub: boolean;
  generate_html: boolean;
  generate_audiobook: boolean;
  
  // Status
  status: BookStatus;
  progress_percentage: number;
  
  // Generated Assets
  pdf_url: string;
  epub_url: string;
  html_url: string;
  audiobook_url: string;
  
  // Metadata
  total_words: number;
  total_blocks: number;
  estimated_pages: number;
  estimated_reading_time: number;
  
  // Relations
  chapters: ChapterListItem[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BookProjectListItem {
  id: number;
  title: string;
  subtitle: string;
  author_name: string;
  project_type: ProjectType;
  status: BookStatus;
  progress_percentage: number;
  total_words: number;
  estimated_pages: number;
  chapter_count: number;
  created_at: string;
  updated_at: string;
}

export interface BookProjectCreate {
  title: string;
  subtitle?: string;
  author_name: string;
  description?: string;
  project_type: ProjectType;
  default_processing_mode: ProcessingMode;
  global_context?: string;
  enable_images?: boolean;
  enable_audio?: boolean;
  image_style?: string;
  voice_model?: string;  
  // Cover & Publishing
  cover_prompt?: string;
  back_cover_text?: string;
  author_bio?: string;
  dedication?: string;
  acknowledgments?: string;
  isbn?: string;
  publisher?: string;
  copyright_year?: number;
  edition?: string;
    generate_pdf?: boolean;
  generate_epub?: boolean;
  generate_html?: boolean;
  generate_audiobook?: boolean;
  user_prompt: string;
}

export interface BookStatusDetail {
  status: BookStatus;
  progress_percentage: number;
  total_blocks: number;
  completed_blocks: number;
  failed_blocks: number;
  total_words: number;
  estimated_pages: number;
  formats_ready: {
    pdf: boolean;
    epub: boolean;
    html: boolean;
    audiobook: boolean;
  };
}

export interface CostEstimate {
  text_processing: number;
  image_generation: number;
  audio_generation: number;
  total: number;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== FORM TYPES ====================

export interface BookFormData {
  step: number;
  basicInfo: {
    title: string;
    subtitle: string;
    author_name: string;
    description: string;
    project_type: ProjectType;
  };
  configuration: {
    default_processing_mode: ProcessingMode;
    global_context: string;
    enable_images: boolean;
    enable_audio: boolean;
    image_style: string;
    voice_model: string;
  };
  outputFormats: {
    generate_pdf: boolean;
    generate_epub: boolean;
    generate_html: boolean;
    generate_audiobook: boolean;
  };
  prompt: {
    user_prompt: string;
  };
}

// ==================== UI STATE TYPES ====================

export interface EditorState {
  selectedBlock: number | null;
  selectedChapter: number | null;
  editMode: boolean;
  previewMode: 'html' | 'pdf' | 'split';
  searchQuery: string;
  filterMode: ProcessingMode | 'all';
}

export interface GenerationProgress {
  bookId: number;
  status: BookStatus;
  percentage: number;
  currentStep: string;
  totalBlocks: number;
  completedBlocks: number;
  failedBlocks: number;
  estimatedTimeRemaining: number;
}

// ==================== CONSTANTS ====================

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.NOVEL]: 'Novel/Fiction',
  [ProjectType.COURSE]: 'Educational Course',
  [ProjectType.GUIDE]: 'How-To Guide',
  [ProjectType.MEMOIR]: 'Memoir/Biography',
  [ProjectType.CHILDREN]: "Children's Book",
  [ProjectType.TECHNICAL]: 'Technical Manual',
  [ProjectType.CUSTOM]: 'Custom Project',
};

export const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
  [ProjectType.NOVEL]: 'Creative fiction, stories, and narrative works',
  [ProjectType.COURSE]: 'Structured learning materials with lessons and exercises',
  [ProjectType.GUIDE]: 'Step-by-step instructions and practical tutorials',
  [ProjectType.MEMOIR]: 'Personal stories, autobiographies, and life experiences',
  [ProjectType.CHILDREN]: 'Picture books, early readers, and young adult fiction',
  [ProjectType.TECHNICAL]: 'Documentation, specifications, and technical reference',
  [ProjectType.CUSTOM]: 'Flexible format for unique project requirements',
};

export const PROCESSING_MODE_LABELS: Record<ProcessingMode, string> = {
  [ProcessingMode.PRESERVE]: 'Preserve - No AI modification',
  [ProcessingMode.POLISH]: 'Polish - Grammar and flow only',
  [ProcessingMode.ENHANCE]: 'Enhance - Add contextual details',
  [ProcessingMode.CREATIVE]: 'Creative - Full creative interpretation',
  [ProcessingMode.REIMAGINE]: 'Reimagine - Complete style transfer',
};

export const PROCESSING_MODE_DESCRIPTIONS: Record<ProcessingMode, string> = {
  [ProcessingMode.PRESERVE]: 'Text remains unchanged. Instant, 0 credits.',
  [ProcessingMode.POLISH]: 'Fix grammar, spelling, and improve sentence flow. Keep exact meaning.',
  [ProcessingMode.ENHANCE]: 'Add sensory details and context while preserving core narrative.',
  [ProcessingMode.CREATIVE]: 'Dramatize with metaphors, emotion, and vivid descriptions.',
  [ProcessingMode.REIMAGINE]: 'Complete transformation with custom tone, perspective, and style.',
};

export const PROCESSING_MODE_COSTS: Record<ProcessingMode, number> = {
  [ProcessingMode.PRESERVE]: 0,
  [ProcessingMode.POLISH]: 1,
  [ProcessingMode.ENHANCE]: 2,
  [ProcessingMode.CREATIVE]: 3,
  [ProcessingMode.REIMAGINE]: 5,
};

export const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'fable', label: 'Fable (British Male)' },
  { value: 'onyx', label: 'Onyx (Deep Male)' },
  { value: 'nova', label: 'Nova (Female)' },
  { value: 'shimmer', label: 'Shimmer (Warm Female)' },
];

// Image style presets with short labels and descriptions for tooltips
export const IMAGE_STYLE_OPTIONS = [
  { value: 'minimalist', label: 'Minimalist', tooltip: 'Clean lines, muted colors, simple compositions', prompt: 'Minimalist illustrations, clean lines, muted colors' },
  { value: 'watercolor', label: 'Watercolor', tooltip: 'Soft edges, pastel palette, artistic brushwork', prompt: 'Watercolor paintings, soft edges, pastel palette' },
  { value: 'comic', label: 'Comic Book', tooltip: 'Bold outlines, vibrant colors, dynamic poses', prompt: 'Bold comic book style, strong outlines, vibrant colors' },
  { value: 'photorealistic', label: 'Photorealistic', tooltip: 'Detailed, natural lighting, lifelike quality', prompt: 'Photorealistic, detailed, natural lighting' },
  { value: 'vintage', label: 'Vintage', tooltip: 'Pen and ink, sepia tones, classic book feel', prompt: 'Vintage book illustrations, pen and ink, sepia tones' },
  { value: 'digital', label: 'Digital Art', tooltip: 'Geometric shapes, gradients, modern aesthetic', prompt: 'Modern digital art, geometric shapes, gradient backgrounds' },
  { value: 'custom', label: 'Custom', tooltip: 'Describe your own visual style below', prompt: '' },
];

export const DEFAULT_IMAGE_STYLES = [
  'Minimalist illustrations, clean lines, muted colors',
  'Watercolor paintings, soft edges, pastel palette',
  'Bold comic book style, strong outlines, vibrant colors',
  'Photorealistic, detailed, natural lighting',
  'Vintage book illustrations, pen and ink, sepia tones',
  'Modern digital art, geometric shapes, gradient backgrounds',
];
