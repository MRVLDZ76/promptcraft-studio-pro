import React, { useState, useEffect } from 'react';
import { Asset, ProjectData } from '../types';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  MusicalNoteIcon, 
  DocumentIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface Props {
  projectId?: string; // Optional: filter by specific project
}

const AssetDashboard: React.FC<Props> = ({ projectId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'thumbnail'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAssets();
    if (!projectId) {
      fetchProjects();
    }
  }, [projectId]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = projectId 
        ? `/api/v1/chronstudio/assets/?project=${projectId}`
        : '/api/v1/chronstudio/assets/';
      
      const response = await fetch(`http://127.0.0.1:8000${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssets(data.results || data);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
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

  const filteredAssets = assets
    .filter(asset => {
      if (filterType !== 'all' && asset.assetType !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          asset.description?.toLowerCase().includes(query) ||
          asset.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          getProjectTitle(asset.projectId).toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'size':
          return b.fileSizeMb - a.fileSizeMb;
        case 'name':
          return getProjectTitle(a.projectId).localeCompare(getProjectTitle(b.projectId));
        default:
          return 0;
      }
    });

  const totalSize = filteredAssets.reduce((sum, asset) => sum + asset.fileSizeMb, 0);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="w-6 h-6" />;
      case 'video':
        return <VideoCameraIcon className="w-6 h-6" />;
      case 'audio':
        return <MusicalNoteIcon className="w-6 h-6" />;
      case 'thumbnail':
        return <DocumentIcon className="w-6 h-6" />;
      default:
        return <DocumentIcon className="w-6 h-6" />;
    }
  };

  const getAssetColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'video':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
      case 'audio':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'thumbnail':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400';
    }
  };

  const formatFileSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAssetSelection = (assetId: string) => {
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      newSelection.add(assetId);
    }
    setSelectedAssets(newSelection);
  };

  const handleDownload = async (asset: Asset) => {
    window.open(asset.fileUrl, '_blank');
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/chronstudio/assets/${assetId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setAssets(assets.filter(a => a.id !== assetId));
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('Failed to delete asset');
    }
  };

  const assetTypeStats = {
    all: assets.length,
    image: assets.filter(a => a.assetType === 'image').length,
    video: assets.filter(a => a.assetType === 'video').length,
    audio: assets.filter(a => a.assetType === 'audio').length,
    thumbnail: assets.filter(a => a.assetType === 'thumbnail').length,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Asset Dashboard</h1>
            <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">
              {filteredAssets.length} assets • {formatFileSize(totalSize)} total
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-neutral-100 dark:bg-zinc-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-300'
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-neutral-100 dark:bg-zinc-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-300'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['all', 'image', 'video', 'audio', 'thumbnail'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                filterType === type
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-neutral-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                {assetTypeStats[type as keyof typeof assetTypeStats]}
              </div>
              <div className="text-xs text-neutral-600 dark:text-zinc-400 capitalize mt-1">
                {type === 'all' ? 'Total Assets' : `${type}s`}
              </div>
            </button>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, tags, or project name..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white"
          >
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
            <option value="name">Sort by Project</option>
          </select>
        </div>

        {/* Assets Grid/List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-neutral-600 dark:text-zinc-400 mt-4">Loading assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800">
            <DocumentIcon className="w-16 h-16 mx-auto text-neutral-400 dark:text-zinc-600 mb-4" />
            <p className="text-lg font-medium text-neutral-900 dark:text-white">No assets found</p>
            <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your filters or search query'
                : 'Create your first project to start generating assets'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center relative">
                  {asset.assetType === 'image' || asset.assetType === 'thumbnail' ? (
                    <img
                      src={asset.fileUrl}
                      alt={asset.description || 'Asset'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getAssetColor(asset.assetType)}`}>
                      {getAssetIcon(asset.assetType)}
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${getAssetColor(asset.assetType)}`}>
                    {asset.assetType}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => window.open(asset.fileUrl, '_blank')}
                      className="p-2 bg-white rounded-lg hover:bg-neutral-100 transition-colors"
                      title="View"
                    >
                      <ArrowsPointingOutIcon className="w-5 h-5 text-neutral-900" />
                    </button>
                    <button
                      onClick={() => handleDownload(asset)}
                      className="p-2 bg-white rounded-lg hover:bg-neutral-100 transition-colors"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5 text-neutral-900" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                    {getProjectTitle(asset.projectId)}
                  </h3>
                  {asset.description && (
                    <p className="text-sm text-neutral-600 dark:text-zinc-400 line-clamp-2">
                      {asset.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-500">
                    <span>{formatFileSize(asset.fileSizeMb)}</span>
                    {asset.durationSeconds && (
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatDuration(asset.durationSeconds)}</span>
                      </span>
                    )}
                  </div>

                  {asset.width && asset.height && (
                    <div className="text-xs text-neutral-500 dark:text-zinc-500">
                      {asset.width} × {asset.height}
                    </div>
                  )}

                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-neutral-100 dark:bg-zinc-800 text-xs text-neutral-600 dark:text-zinc-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center text-xs text-neutral-400 dark:text-zinc-600">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-zinc-800/50 border-b border-neutral-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-zinc-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-zinc-400 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-zinc-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-zinc-400 uppercase">Dimensions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-zinc-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 dark:text-zinc-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${getAssetColor(asset.assetType)}`}>
                          {getAssetIcon(asset.assetType)}
                        </div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                          {asset.assetType}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-neutral-900 dark:text-white">
                        {getProjectTitle(asset.projectId)}
                      </div>
                      {asset.description && (
                        <div className="text-xs text-neutral-500 dark:text-zinc-500 truncate max-w-md">
                          {asset.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600 dark:text-zinc-400">
                      {formatFileSize(asset.fileSizeMb)}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600 dark:text-zinc-400">
                      {asset.width && asset.height ? `${asset.width} × ${asset.height}` : 'N/A'}
                      {asset.durationSeconds && (
                        <div className="text-xs text-neutral-500 dark:text-zinc-500">
                          {formatDuration(asset.durationSeconds)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600 dark:text-zinc-400">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.open(asset.fileUrl, '_blank')}
                          className="p-1.5 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          title="View"
                        >
                          <ArrowsPointingOutIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(asset)}
                          className="p-1.5 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDashboard;
