/**
 * AIImageGeneratorModal - Generate images with AI
 * Integrates with existing image generation API
 */

import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface AIImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (imageUrl: string, prompt: string) => void;
  bookId: number;
}

const AIImageGeneratorModal: React.FC<AIImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
  bookId,
}) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter an image description');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/publishing/generate-image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          style,
          aspect_ratio: aspectRatio,
          book_id: bookId,
        })
      });

      if (response.ok) {
        const data = await response.json();
        onGenerated(data.image_url, prompt);
        onClose();
        setPrompt('');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      alert('Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Generate Image with AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create... (e.g., 'A mysterious forest at twilight with glowing mushrooms')"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="realistic">Realistic</option>
                <option value="artistic">Artistic</option>
                <option value="anime">Anime</option>
                <option value="oil-painting">Oil Painting</option>
                <option value="watercolor">Watercolor</option>
                <option value="sketch">Sketch</option>
                <option value="3d-render">3D Render</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="9:16">9:16 (Portrait)</option>
              </select>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              💡 <strong>Tip:</strong> Be specific with details like lighting, colors, mood, and composition for best results.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generation typically takes 5-10 seconds
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImageGeneratorModal;
