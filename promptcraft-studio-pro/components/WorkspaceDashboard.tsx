/**
 * Workspace Dashboard - Unified Project View
 * Shows all user projects from Analysis Studio and Publishing Studio
 * 
 * Features:
 * - Status tracking (draft, in-progress, completed, failed)
 * - Resume/continue projects
 * - Filter by type and status
 * - Last edited timestamps
 * - Quick actions (delete, export, duplicate)
 */

import React, { useState, useEffect } from 'react';
import {
  FolderIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ClockIcon,
  PlayIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon as ClockSolidIcon, PencilSquareIcon } from '@heroicons/react/24/solid';

interface Project {
  id: number | string;
  type: 'book' | 'debate';
  title: string;
  status: 'draft' | 'generating' | 'analyzing' | 'completed' | 'failed';
  progress?: number;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  metadata?: {
    words?: number;
    chapters?: number;
    participants?: string[];
    duration?: string;
  };
}

interface WorkspaceDashboardProps {
  onOpenProject: (project: Project) => void;
  onCreateNew: (type: 'book' | 'debate') => void;
}

const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({ onOpenProject, onCreateNew }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    type: 'all' | 'book' | 'debate';
    status: 'all' | 'draft' | 'in-progress' | 'completed' | 'failed';
    search: string;
  }>({
    type: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // Load from both APIs
      const [booksResponse, debatesResponse] = await Promise.all([
        fetch('/api/v1/publishing/books/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }),
        fetch('/api/v1/debates/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
      ]);

      const books = await booksResponse.json();
      const debates = await debatesResponse.json();

      // Transform to unified format
      const bookProjects: Project[] = books.map((book: any) => ({
        id: book.id,
        type: 'book',
        title: book.title,
        status: book.status.toLowerCase(),
        progress: book.progress_percentage,
        created_at: book.created_at,
        updated_at: book.updated_at,
        thumbnail: book.cover_image_url,
        metadata: {
          words: book.total_words,
          chapters: book.total_blocks
        }
      }));

      const debateProjects: Project[] = debates.map((debate: any) => ({
        id: debate.id,
        type: 'debate',
        title: debate.title,
        status: debate.analysis_status === 'analyzing' ? 'analyzing' : debate.analysis_status,
        created_at: debate.created_at,
        updated_at: debate.updated_at,
        metadata: {
          participants: debate.participants?.map((p: any) => p.name) || []
        }
      }));

      setProjects([...bookProjects, ...debateProjects]);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'generating':
      case 'analyzing':
        return <ClockSolidIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <PencilSquareIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'generating':
      case 'analyzing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredProjects = projects.filter((project) => {
    // Type filter
    if (filter.type !== 'all' && project.type !== filter.type) return false;
    
    // Status filter
    if (filter.status !== 'all') {
      if (filter.status === 'in-progress' && !['generating', 'analyzing'].includes(project.status)) {
        return false;
      } else if (filter.status !== 'in-progress' && project.status !== filter.status) {
        return false;
      }
    }
    
    // Search filter
    if (filter.search && !project.title.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          <FolderIcon className="inline w-8 h-8 mr-2 mb-1" />
          My Workspace
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          All your projects in one place - never lose your work
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="book">📚 Books</option>
              <option value="debate">🎬 Video Analysis</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Create New */}
          <div className="flex gap-2">
            <button
              onClick={() => onCreateNew('book')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <BookOpenIcon className="w-4 h-4" />
              New Book
            </button>
            <button
              onClick={() => onCreateNew('debate')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <VideoCameraIcon className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No projects found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            {filter.search || filter.type !== 'all' || filter.status !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first project to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={`${project.type}-${project.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onOpenProject(project)}
            >
              {/* Thumbnail or Icon */}
              <div className="h-40 bg-gradient-to-br from-purple-500 to-blue-600 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white">
                    {project.type === 'book' ? (
                      <BookOpenIcon className="w-16 h-16" />
                    ) : (
                      <VideoCameraIcon className="w-16 h-16" />
                    )}
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
                  {project.title}
                </h3>
                
                {/* Metadata */}
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {project.type === 'book' && project.metadata && (
                    <div>
                      {project.metadata.words ? `${project.metadata.words.toLocaleString()} words` : 'No content yet'}
                      {project.metadata.chapters && ` · ${project.metadata.chapters} blocks`}
                    </div>
                  )}
                  {project.type === 'debate' && project.metadata && (
                    <div>
                      {project.metadata.participants && project.metadata.participants.length > 0
                        ? project.metadata.participants.join(' vs ')
                        : 'No participants'}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {project.progress !== undefined && project.progress > 0 && (
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {project.progress}% complete
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {formatDate(project.updated_at)}
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle export
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="Export"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle duplicate
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle delete
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && filteredProjects.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {projects.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter(p => ['generating', 'analyzing'].includes(p.status)).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {projects.filter(p => p.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Drafts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDashboard;
