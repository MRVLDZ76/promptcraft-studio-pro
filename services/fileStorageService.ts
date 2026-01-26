// File Storage Service - Supabase Storage Integration
// Handles uploading and managing files in Supabase Storage buckets
// Date: January 26, 2026

import { supabase } from './supabaseClient';

// Storage bucket names
export const STORAGE_BUCKETS = {
  VIDEOS: 'videos',
  AUDIO: 'audio',
  TRANSCRIPTS: 'transcripts',
  DOCUMENTS: 'documents',
  IMAGES: 'images',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// ============================================
// TYPES
// ============================================

export interface UploadResult {
  success: boolean;
  path: string;
  publicUrl: string;
  size: number;
  error?: string;
}

export interface UploadOptions {
  bucket: StorageBucket;
  file: File | Blob;
  filename?: string;
  userId?: string;
  contentType?: string;
  metadata?: Record<string, any>;
}

// ============================================
// BUCKET INITIALIZATION
// ============================================

/**
 * Initialize storage buckets (run once during setup)
 * Creates public buckets for different asset types
 */
export async function initializeStorageBuckets() {
  const buckets = Object.values(STORAGE_BUCKETS);
  
  for (const bucketName of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true, // Files are publicly accessible
          fileSizeLimit: 500 * 1024 * 1024, // 500MB limit
        });
        
        if (error) {
          console.error(`Failed to create bucket ${bucketName}:`, error);
        } else {
          console.log(`✅ Created storage bucket: ${bucketName}`);
        }
      }
    } catch (error) {
      console.error(`Error initializing bucket ${bucketName}:`, error);
    }
  }
}

// ============================================
// FILE UPLOAD
// ============================================

/**
 * Upload a file to Supabase Storage
 * @param options - Upload configuration
 * @returns Upload result with public URL
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, file, filename, userId, contentType, metadata } = options;
  
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const originalName = filename || (file instanceof File ? file.name : 'file');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}_${randomStr}_${sanitizedName}`;
    
    // Build storage path: userId/uniqueFilename
    const storagePath = userId ? `${userId}/${uniqueFilename}` : uniqueFilename;
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType: contentType || (file instanceof File ? file.type : 'application/octet-stream'),
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });
    
    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        path: '',
        publicUrl: '',
        size: 0,
        error: error.message,
      };
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log(`✅ File uploaded: ${data.path}`);
    
    return {
      success: true,
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
      size: file.size,
    };
  } catch (err: any) {
    console.error('Upload failed:', err);
    return {
      success: false,
      path: '',
      publicUrl: '',
      size: 0,
      error: err.message,
    };
  }
}

/**
 * Upload video file
 */
export async function uploadVideo(file: File, userId?: string): Promise<UploadResult> {
  return uploadFile({
    bucket: STORAGE_BUCKETS.VIDEOS,
    file,
    filename: file.name,
    userId,
    contentType: file.type,
  });
}

/**
 * Upload audio file
 */
export async function uploadAudio(file: File, userId?: string): Promise<UploadResult> {
  return uploadFile({
    bucket: STORAGE_BUCKETS.AUDIO,
    file,
    filename: file.name,
    userId,
    contentType: file.type,
  });
}

/**
 * Upload transcript file
 */
export async function uploadTranscript(file: File, userId?: string): Promise<UploadResult> {
  return uploadFile({
    bucket: STORAGE_BUCKETS.TRANSCRIPTS,
    file,
    filename: file.name,
    userId,
    contentType: 'text/plain',
  });
}

/**
 * Upload document file
 */
export async function uploadDocument(file: File, userId?: string): Promise<UploadResult> {
  return uploadFile({
    bucket: STORAGE_BUCKETS.DOCUMENTS,
    file,
    filename: file.name,
    userId,
    contentType: file.type,
  });
}

/**
 * Upload image file
 */
export async function uploadImage(file: File, userId?: string): Promise<UploadResult> {
  return uploadFile({
    bucket: STORAGE_BUCKETS.IMAGES,
    file,
    filename: file.name,
    userId,
    contentType: file.type,
  });
}

// ============================================
// FILE RETRIEVAL
// ============================================

/**
 * Get public URL for a stored file
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Public URL
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Download file from storage
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns File blob
 */
export async function downloadFile(bucket: StorageBucket, path: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      console.error('Download error:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Download failed:', err);
    return null;
  }
}

// ============================================
// FILE MANAGEMENT
// ============================================

/**
 * Delete file from storage
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    console.log(`🗑️ File deleted: ${path}`);
    return true;
  } catch (err) {
    console.error('Delete failed:', err);
    return false;
  }
}

/**
 * Delete multiple files
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths
 */
export async function deleteFiles(bucket: StorageBucket, paths: string[]): Promise<number> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    
    if (error) {
      console.error('Bulk delete error:', error);
      return 0;
    }
    
    const deletedCount = data?.length || 0;
    console.log(`🗑️ Deleted ${deletedCount} files`);
    return deletedCount;
  } catch (err) {
    console.error('Bulk delete failed:', err);
    return 0;
  }
}

/**
 * List files in a user's folder
 * @param bucket - Storage bucket name
 * @param userId - User ID folder
 */
export async function listUserFiles(bucket: StorageBucket, userId: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    
    if (error) {
      console.error('List files error:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('List files failed:', err);
    return [];
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get appropriate bucket for file type
 * @param mimeType - File MIME type
 * @returns Storage bucket name
 */
export function getBucketForMimeType(mimeType: string): StorageBucket {
  if (mimeType.startsWith('video/')) return STORAGE_BUCKETS.VIDEOS;
  if (mimeType.startsWith('audio/')) return STORAGE_BUCKETS.AUDIO;
  if (mimeType.startsWith('image/')) return STORAGE_BUCKETS.IMAGES;
  if (mimeType.includes('text') || mimeType.includes('srt') || mimeType.includes('vtt')) {
    return STORAGE_BUCKETS.TRANSCRIPTS;
  }
  return STORAGE_BUCKETS.DOCUMENTS;
}

/**
 * Calculate storage usage for a user
 * @param userId - User ID
 * @returns Total bytes used
 */
export async function getUserStorageUsage(userId: string): Promise<number> {
  let totalSize = 0;
  
  for (const bucket of Object.values(STORAGE_BUCKETS)) {
    try {
      const files = await listUserFiles(bucket, userId);
      totalSize += files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    } catch (err) {
      console.error(`Error calculating usage for ${bucket}:`, err);
    }
  }
  
  return totalSize;
}

/**
 * Format bytes to human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate content hash for file (for duplicate detection)
 * @param file - File to hash
 * @returns MD5-like hash string
 */
export async function generateFileHash(file: File | Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (err) {
    console.error('Hash generation failed:', err);
    // Fallback to simple hash based on size and name
    const timestamp = Date.now();
    return `fallback_${file.size}_${timestamp}`;
  }
}
