/**
 * ImageLibraryModal - Browse and insert uploaded images
 * Shows all user's uploaded media assets with search and filtering
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface MediaAsset {
  id: number;
  title: string;
  alt_text: string;
  file_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  file_size: number;
  source: 'upload' | 'generated' | 'unsplash';
  created_at: string;
}

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (asset: MediaAsset) => void;
  bookId?: number;
}

const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  bookId,
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, bookId]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = bookId
        ? `/api/v1/publishing/media/?book_id=${bookId}`
        : '/api/v1/publishing/media/';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssets(data.results || data);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(search.toLowerCase()) ||
      asset.alt_text.toLowerCase().includes(search.toLowerCase());
    const matchesSource = selectedSource === 'all' || asset.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Image Library
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search images..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Sources</option>
              <option value="upload">Uploaded</option>
              <option value="generated">AI Generated</option>
              <option value="unsplash">Unsplash</option>
            </select>
          </div>
        </div>

        {/* Image Grid */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {search || selectedSource !== 'all' ? 'No images found' : 'No images uploaded yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    onSelectImage(asset);
                    onClose();
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                >
                  <img
                    src={asset.thumbnail_url || asset.file_url}
                    alt={asset.alt_text || asset.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-white text-xs font-medium text-center truncate">
                      {asset.title}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                    {asset.source}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'image' : 'images'} • 
            Click an image to insert it into your book
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageLibraryModal;
