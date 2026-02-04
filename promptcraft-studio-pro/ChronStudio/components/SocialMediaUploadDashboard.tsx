import React, { useState, useEffect } from 'react';
import { ProjectData } from '../types';
import {
  fetchSocialUploads,
  cancelSocialUpload,
  retrySocialUpload,
  deleteSocialUpload,
  SocialMediaUploadStatus,
  getPlatformName,
  getPlatformColor,
  getStatusColor,
  getStatusIcon,
} from '../services/socialMediaService';
import {
  ArrowPathIcon,
  XMarkIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

interface Props {
  projectId?: string; // Optional: filter by specific project
  autoRefresh?: boolean; // Auto-refresh every 5 seconds
}

const SocialMediaUploadDashboard: React.FC<Props> = ({ projectId, autoRefresh = true }) => {
  const [uploads, setUploads] = useState<SocialMediaUploadStatus[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'uploading' | 'processing' | 'published' | 'failed'>('all');
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'youtube' | 'instagram' | 'facebook'>('all');

  useEffect(() => {
    fetchUploads();
    if (!projectId) {
      fetchProjects();
    }

    // Auto-refresh
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchUploads(true); // Silent refresh
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [projectId, autoRefresh]);

  const fetchUploads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchSocialUploads(projectId);
      setUploads(data);
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/chronstudio/projects/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.results || data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Unknown Project';
  };

  const handleCancel = async (uploadId: string) => {
    if (!confirm('Are you sure you want to cancel this upload?')) return;
    
    try {
      await cancelSocialUpload(uploadId);
      await fetchUploads();
    } catch (error) {
      console.error('Failed to cancel upload:', error);
      alert('Failed to cancel upload');
    }
  };

  const handleRetry = async (uploadId: string) => {
    try {
      await retrySocialUpload(uploadId);
      await fetchUploads();
    } catch (error) {
      console.error('Failed to retry upload:', error);
      alert('Failed to retry upload');
    }
  };

  const handleDelete = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this upload record?')) return;
    
    try {
      await deleteSocialUpload(uploadId);
      setUploads(uploads.filter(u => u.id !== uploadId));
    } catch (error) {
      console.error('Failed to delete upload:', error);
      alert('Failed to delete upload');
    }
  };

  const filteredUploads = uploads.filter(upload => {
    if (filterStatus !== 'all' && upload.status !== filterStatus) return false;
    if (filterPlatform !== 'all' && upload.platform !== filterPlatform) return false;
    return true;
  });

  const stats = {
    total: uploads.length,
    pending: uploads.filter(u => u.status === 'pending').length,
    uploading: uploads.filter(u => u.status === 'uploading').length,
    processing: uploads.filter(u => u.status === 'processing').length,
    published: uploads.filter(u => u.status === 'published').length,
    failed: uploads.filter(u => u.status === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Social Media Uploads
            </h1>
            <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">
              {filteredUploads.length} uploads
              {autoRefresh && <span className="ml-2 text-green-600 dark:text-green-400">● Live</span>}
            </p>
          </div>

          <button
            onClick={() => fetchUploads()}
            className="p-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5 text-neutral-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {(['all', 'pending', 'uploading', 'processing', 'published', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`p-4 rounded-lg border-2 transition-all ${
                filterStatus === status
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-neutral-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats[status as keyof typeof stats]}
              </div>
              <div className="text-xs text-neutral-600 dark:text-zinc-400 capitalize mt-1 flex items-center justify-center space-x-1">
                <span>{getStatusIcon(status)}</span>
                <span>{status === 'all' ? 'Total' : status}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-600 dark:text-zinc-400">Platform:</span>
          {(['all', 'youtube', 'instagram', 'facebook'] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setFilterPlatform(platform)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterPlatform === platform
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-300 dark:hover:bg-zinc-700'
              }`}
            >
              {platform === 'all' ? 'All' : getPlatformName(platform)}
            </button>
          ))}
        </div>

        {/* Uploads List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-neutral-600 dark:text-zinc-400 mt-4">Loading uploads...</p>
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800">
            <CloudArrowUpIcon className="w-16 h-16 mx-auto text-neutral-400 dark:text-zinc-600 mb-4" />
            <p className="text-lg font-medium text-neutral-900 dark:text-white">No uploads found</p>
            <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">
              {filterStatus !== 'all' || filterPlatform !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload your first video to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Upload Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor(upload.platform)}`}>
                        {getPlatformName(upload.platform)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                        {getStatusIcon(upload.status)} {upload.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {upload.uploadConfig?.title || getProjectTitle(upload.projectId)}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">
                        Project: {getProjectTitle(upload.projectId)}
                      </p>
                    </div>

                    {upload.uploadConfig?.description && (
                      <p className="text-sm text-neutral-600 dark:text-zinc-400 line-clamp-2">
                        {upload.uploadConfig.description}
                      </p>
                    )}

                    {/* Progress Bar (for uploading/processing) */}
                    {(upload.status === 'uploading' || upload.status === 'processing') && upload.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-zinc-400">
                          <span>{upload.status === 'uploading' ? 'Uploading' : 'Processing'}</span>
                          <span>{upload.progress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {upload.status === 'failed' && upload.errorMessage && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-start space-x-2">
                          <ExclamationCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-900 dark:text-red-300">{upload.errorMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Published URL */}
                    {upload.status === 'published' && upload.platformUrl && (
                      <a
                        href={upload.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        <span>View on {getPlatformName(upload.platform)}</span>
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center space-x-4 text-xs text-neutral-500 dark:text-zinc-500">
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>Started: {new Date(upload.createdAt).toLocaleString()}</span>
                      </span>
                      {upload.publishedAt && (
                        <span className="flex items-center space-x-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          <span>Published: {new Date(upload.publishedAt).toLocaleString()}</span>
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {upload.uploadConfig?.tags && upload.uploadConfig.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {upload.uploadConfig.tags.slice(0, 5).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-neutral-100 dark:bg-zinc-800 text-xs text-neutral-600 dark:text-zinc-400 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {upload.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(upload.id)}
                        className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        title="Retry Upload"
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                      </button>
                    )}

                    {(upload.status === 'pending' || upload.status === 'uploading') && (
                      <button
                        onClick={() => handleCancel(upload.id)}
                        className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors"
                        title="Cancel Upload"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}

                    {(upload.status === 'published' || upload.status === 'failed') && (
                      <button
                        onClick={() => handleDelete(upload.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete Record"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaUploadDashboard;
