/**
 * Publishing Studio API Service
 * Handles all API calls to the Publishing Studio backend
 * Uses apiClient for automatic token refresh
 */

import apiClient from '../../services/apiClient';

// ==================== BOOK PROJECTS ====================

export interface BookProjectCreate {
  title: string;
  subtitle?: string;
  author_name: string;
  description?: string;
  project_type: string;
  default_processing_mode: string;
  global_context?: string;
  enable_images?: boolean;
  enable_audio?: boolean;
  image_style?: string;
  voice_model?: string;
  generate_pdf?: boolean;
  generate_epub?: boolean;
  generate_html?: boolean;
  generate_audiobook?: boolean;
  user_prompt: string;
}

/**
 * Get all book projects for current user
 */
export const getBookProjects = async () => {
  const response = await apiClient.get('/publishing/books/');
  return response.data;
};

/**
 * Get single book project by ID
 */
export const getBookProject = async (bookId: number) => {
  const response = await apiClient.get(`/publishing/books/${bookId}/`);
  return response.data;
};

/**
 * Create new book project (triggers generation)
 */
export const createBookProject = async (data: BookProjectCreate) => {
  const response = await apiClient.post('/publishing/books/', data);
  return response.data;
};

/**
 * Update book project
 */
export const updateBookProject = async (bookId: number, data: Partial<BookProjectCreate>) => {
  // Filter out read-only fields that the backend doesn't accept
  const readOnlyFields = [
    'id', 'user', 'random_seed', 'status', 'progress_percentage',
    'pdf_url', 'epub_url', 'html_url', 'audiobook_url',
    'total_words', 'total_blocks', 'estimated_pages', 'estimated_reading_time',
    'chapters', 'blocks', 'created_at', 'updated_at', 'completed_at'
  ];
  
  // Create a clean copy with only writable fields
  const cleanData: any = {};
  Object.keys(data).forEach(key => {
    if (!readOnlyFields.includes(key)) {
      cleanData[key] = (data as any)[key];
    }
  });
  
  const response = await apiClient.patch(`/publishing/books/${bookId}/`, cleanData);
  return response.data;
};

/**
 * Delete book project
 */
export const deleteBookProject = async (bookId: number) => {
  await apiClient.delete(`/publishing/books/${bookId}/`);
  return true;
};

/**
 * Regenerate book content
 */
export const regenerateBook = async (bookId: number) => {
  const response = await apiClient.post(`/publishing/books/${bookId}/regenerate/`);
  return response.data;
};

/**
 * Get detailed generation status
 */
export const getBookStatus = async (bookId: number) => {
  const response = await apiClient.get(`/publishing/books/${bookId}/status/`);
  return response.data;
};

/**
 * Export book in specific format
 */
export const exportBook = async (bookId: number, format: 'pdf' | 'epub' | 'html' | 'audiobook') => {
  const response = await apiClient.get(`/publishing/books/${bookId}/export/?format=${format}`);
  return response.data;
};

// ==================== CHAPTERS ====================

/**
 * Get chapters for a book
 */
export const getChapters = async (bookId: number) => {
  const response = await apiClient.get(`/publishing/chapters/?book=${bookId}`);
  return response.data;
};

/**
 * Get single chapter by ID
 */
export const getChapter = async (chapterId: number) => {
  const response = await apiClient.get(`/publishing/chapters/${chapterId}/`);
  return response.data;
};

/**
 * Update chapter
 */
export const updateChapter = async (chapterId: number, data: any) => {
  const response = await apiClient.patch(`/publishing/chapters/${chapterId}/`, data);
  return response.data;
};

/**
 * Regenerate all blocks in a chapter
 */
export const regenerateChapter = async (chapterId: number) => {
  const response = await apiClient.post(`/publishing/chapters/${chapterId}/regenerate_blocks/`);
  return response.data;
};

// ==================== CONTENT BLOCKS ====================

/**
 * Get blocks for a chapter
 */
export const getBlocks = async (chapterId: number) => {
  const response = await apiClient.get(`/publishing/blocks/?chapter=${chapterId}`);
  return response.data;
};

/**
 * Get single block by ID
 */
export const getBlock = async (blockId: number) => {
  const response = await apiClient.get(`/publishing/blocks/${blockId}/`);
  return response.data;
};

/**
 * Update block content or settings
 */
export const updateBlock = async (blockId: number, data: any) => {
  const response = await apiClient.patch(`/publishing/blocks/${blockId}/`, data);
  return response.data;
};

/**
 * Regenerate single block
 */
export const regenerateBlock = async (blockId: number, data?: any) => {
  const response = await apiClient.post(`/publishing/blocks/${blockId}/regenerate/`, data || {});
  return response.data;
};

/**
 * Estimate cost for processing a block
 */
export const estimateBlockCost = async (blockId: number) => {
  const response = await apiClient.post(`/publishing/blocks/${blockId}/estimate_cost/`);
  return response.data;
};

// ==================== POLLING ====================

/**
 * Poll book status until completion or failure
 * Returns a function to stop polling
 */
export const pollBookStatus = (
  bookId: number,
  onProgress: (status: any) => void,
  intervalMs: number = 3000,
  maxAttempts: number = 600 // 30 minutes max
): (() => void) => {
  let attempts = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let stopped = false;
  
  const poll = async () => {
    if (stopped) return;
    
    try {
      attempts++;
      const status = await getBookStatus(bookId);
      
      if (!stopped) {
        onProgress(status);
      }
      
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        // Stop polling on completion or failure
        return;
      } else if (attempts >= maxAttempts) {
        console.error('Polling timeout');
        return;
      } else if (!stopped) {
        timeoutId = setTimeout(poll, intervalMs);
      }
    } catch (error) {
      console.error('Polling error:', error);
      if (!stopped) {
        // Retry on error
        timeoutId = setTimeout(poll, intervalMs);
      }
    }
  };
  
  poll();
  
  // Return stop function
  return () => {
    stopped = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};
