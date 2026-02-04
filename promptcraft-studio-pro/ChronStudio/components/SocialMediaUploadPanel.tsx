import React, { useState } from 'react';
import { ProjectData } from '../types';
import { 
  createSocialUpload, 
  SocialMediaUploadConfig,
  getPlatformName,
  getPlatformColor,
  YOUTUBE_CATEGORIES,
  PRIVACY_OPTIONS
} from '../services/socialMediaService';
import { 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  VideoCameraIcon,
  PhotoIcon,
  TagIcon,
  ClockIcon,
  LockClosedIcon,
  ChatBubbleLeftIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface Props {
  project: ProjectData;
  onUploadComplete?: (uploadId: string) => void;
}

const SocialMediaUploadPanel: React.FC<Props> = ({ project, onUploadComplete }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'facebook'>('youtube');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(project.title || '');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'unlisted'>('public');
  const [categoryId, setCategoryId] = useState('24'); // Entertainment
  const [enableComments, setEnableComments] = useState(true);
  const [enableRatings, setEnableRatings] = useState(true);
  const [scheduledTime, setScheduledTime] = useState('');

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺', available: true },
    { id: 'instagram', name: 'Instagram', icon: '📷', available: false },
    { id: 'facebook', name: 'Facebook', icon: '👥', available: false },
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!project.finalVideoUrl) {
      setError('No video URL available. Please generate the video first.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const config: SocialMediaUploadConfig = {
        platform: selectedPlatform,
        title: title.trim(),
        description: description.trim(),
        tags,
        privacy,
        categoryId,
        enableComments,
        enableRatings,
        scheduledPublishTime: scheduledTime || undefined,
      };

      const upload = await createSocialUpload(project.id!, project.finalVideoUrl, config);
      
      setUploadSuccess(true);
      
      if (onUploadComplete) {
        onUploadComplete(upload.id);
      }

      // Update project URLs (this would typically come from the backend)
      if (selectedPlatform === 'youtube' && upload.platformUrl) {
        // Store in project data (future: update backend)
      }

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      console.error('Social media upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const generateDescription = () => {
    let desc = project.content ? project.content.substring(0, 500) : '';
    if (project.category) {
      desc += `\n\nCategory: ${project.category}`;
    }
    if (project.style) {
      desc += `\nStyle: ${project.style}`;
    }
    desc += `\n\nCreated with ChronStudio`;
    setDescription(desc);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Publish to Social Media
          </h2>
          <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">
            Upload your video to social media platforms
          </p>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Select Platform
        </label>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => platform.available && setSelectedPlatform(platform.id as any)}
              disabled={!platform.available}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                selectedPlatform === platform.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : platform.available
                  ? 'border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700'
                  : 'border-neutral-200 dark:border-zinc-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-3xl mb-2">{platform.icon}</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-white">
                {platform.name}
              </div>
              {!platform.available && (
                <span className="absolute top-2 right-2 text-xs text-neutral-500 dark:text-zinc-500">
                  Coming Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Video Info */}
      {project.finalVideoUrl ? (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                Video Ready for Upload
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                {project.durationSeconds ? `Duration: ${Math.floor(project.durationSeconds / 60)}:${String(Math.floor(project.durationSeconds % 60)).padStart(2, '0')}` : 'Video generated'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start space-x-3">
            <ExclamationCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                No Video Available
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Generate your video in the Production step before uploading
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {project.finalVideoUrl && selectedPlatform === 'youtube' && (
        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
              <VideoCameraIcon className="w-4 h-4" />
              <span>Title <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500"
            />
            <p className="text-xs text-neutral-500 dark:text-zinc-500">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
                Description
              </label>
              <button
                onClick={generateDescription}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Auto-generate
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description"
              rows={5}
              maxLength={5000}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500"
            />
            <p className="text-xs text-neutral-500 dark:text-zinc-500">
              {description.length}/5000 characters
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
              <TagIcon className="w-4 h-4" />
              <span>Tags</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag and press Enter"
                className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-3 bg-neutral-200 dark:bg-zinc-700 hover:bg-neutral-300 dark:hover:bg-zinc-600 text-neutral-900 dark:text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary-900 dark:hover:text-primary-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white"
            >
              {YOUTUBE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
              <LockClosedIcon className="w-4 h-4" />
              <span>Privacy</span>
            </label>
            <div className="space-y-2">
              {PRIVACY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPrivacy(option.value as any)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    privacy === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="font-medium text-neutral-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-zinc-400">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3 p-4 rounded-lg bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
              Advanced Options
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftIcon className="w-4 h-4 text-neutral-600 dark:text-zinc-400" />
                <span className="text-sm text-neutral-700 dark:text-zinc-300">Enable Comments</span>
              </div>
              <input
                type="checkbox"
                checked={enableComments}
                onChange={(e) => setEnableComments(e.target.checked)}
                className="w-5 h-5 rounded border-neutral-300 dark:border-zinc-700 text-primary-600 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StarIcon className="w-4 h-4 text-neutral-600 dark:text-zinc-400" />
                <span className="text-sm text-neutral-700 dark:text-zinc-300">Enable Ratings</span>
              </div>
              <input
                type="checkbox"
                checked={enableRatings}
                onChange={(e) => setEnableRatings(e.target.checked)}
                className="w-5 h-5 rounded border-neutral-300 dark:border-zinc-700 text-primary-600 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-neutral-700 dark:text-zinc-300">
                <ClockIcon className="w-4 h-4" />
                <span>Schedule Publish (Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start space-x-3">
                <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-900 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    Upload Started!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Your video is being uploaded to {getPlatformName(selectedPlatform)}. Check the Upload Status dashboard for progress.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            <span>{uploading ? 'Starting Upload...' : `Upload to ${getPlatformName(selectedPlatform)}`}</span>
          </button>
        </div>
      )}

      {/* Coming Soon Message for other platforms */}
      {selectedPlatform !== 'youtube' && (
        <div className="p-8 text-center rounded-lg bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {getPlatformName(selectedPlatform)} Integration Coming Soon
          </h3>
          <p className="text-sm text-neutral-600 dark:text-zinc-400">
            We're working on adding {getPlatformName(selectedPlatform)} support. For now, please use YouTube uploads.
          </p>
        </div>
      )}
    </div>
  );
};

export default SocialMediaUploadPanel;
