-- Supabase Storage Buckets Setup
-- Creates storage buckets for file uploads
-- Date: January 26, 2026
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Buckets are usually created via Supabase Dashboard or API
-- This script documents the required buckets

-- Create Videos Bucket (if not exists)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'videos',
--   'videos',
--   true,
--   524288000, -- 500MB
--   ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Create Audio Bucket
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'audio',
--   'audio',
--   true,
--   104857600, -- 100MB
--   ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Create Transcripts Bucket
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'transcripts',
--   'transcripts',
--   true,
--   10485760, -- 10MB
--   ARRAY['text/plain', 'text/srt', 'text/vtt', 'application/octet-stream']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Create Documents Bucket
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'documents',
--   'documents',
--   true,
--   52428800, -- 50MB
--   ARRAY['application/pdf', 'text/plain', 'application/json', 'text/csv']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Create Images Bucket
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'images',
--   'images',
--   true,
--   10485760, -- 10MB
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES (RLS)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Allow public read access to all buckets
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('videos', 'audio', 'transcripts', 'documents', 'images'));

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('videos', 'audio', 'transcripts', 'documents', 'images'));

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('videos', 'audio', 'transcripts', 'documents', 'images'))
  WITH CHECK (bucket_id IN ('videos', 'audio', 'transcripts', 'documents', 'images'));

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('videos', 'audio', 'transcripts', 'documents', 'images'));

-- ============================================
-- NOTES
-- ============================================

-- Buckets should be created via:
-- 1. Supabase Dashboard > Storage > Create Bucket
-- 2. Or via JavaScript with fileStorageService.initializeStorageBuckets()

-- The buckets needed are:
-- - videos: For uploaded video files (MP4, WebM, MOV, MKV)
-- - audio: For audio files (MP3, WAV, OGG, WebM, M4A)
-- - transcripts: For subtitle/transcript files (TXT, SRT, VTT)
-- - documents: For document files (PDF, TXT, JSON, CSV)
-- - images: For image files (JPEG, PNG, GIF, WebP, SVG)

-- Configuration:
-- - All buckets are PUBLIC (files accessible via public URL)
-- - File size limits vary by bucket type
-- - Automatic cleanup can be configured via retention policies
