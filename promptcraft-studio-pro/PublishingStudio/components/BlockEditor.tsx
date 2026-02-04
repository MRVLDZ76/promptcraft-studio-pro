/**
 * Block Editor
 * Individual content block editor with processing mode selector
 */

import React, { useState } from 'react';
import {
  ArrowPathIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { ContentBlock } from '../types';
import {
  ProcessingMode,
  BlockStatus,
} from '../types';
import {
  PROCESSING_MODE_LABELS,
  PROCESSING_MODE_DESCRIPTIONS,
  PROCESSING_MODE_COSTS,
} from '../types';
import { updateBlock, regenerateBlock, estimateBlockCost } from '../services/publishingService';

interface BlockEditorProps {
  bookId: number;
  block: ContentBlock;
  onBlockUpdated: () => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ bookId, block, onBlockUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState(block.input_text);
  const [selectedMode, setSelectedMode] = useState<ProcessingMode>(
    block.processing_mode || ProcessingMode.PRESERVE
  );
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateBlock(block.id, {
        input_text: inputText,
        processing_mode: selectedMode,
      });
      setEditing(false);
      onBlockUpdated();
    } catch (err: any) {
      console.error('Error saving block:', err);
      alert(err.message || 'Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate this block? This will overwrite the current processed text.')) {
      return;
    }

    try {
      setRegenerating(true);
      await regenerateBlock(block.id, {
        processing_mode: selectedMode,
      });
      onBlockUpdated();
    } catch (err: any) {
      console.error('Error regenerating block:', err);
      alert(err.message || 'Failed to regenerate block');
    } finally {
      setRegenerating(false);
    }
  };

  const handleModeChange = async (mode: ProcessingMode) => {
    setSelectedMode(mode);

    // Estimate cost for new mode
    try {
      const cost = await estimateBlockCost(block.id);
      setEstimatedCost(cost.estimated_credits);
    } catch (err) {
      console.error('Error estimating cost:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case BlockStatus.COMPLETED:
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case BlockStatus.FAILED:
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case BlockStatus.PROCESSING:
        return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case BlockStatus.COMPLETED:
        return 'text-green-600';
      case BlockStatus.FAILED:
        return 'text-red-600';
      case BlockStatus.PROCESSING:
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Block Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(block.status)}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Block #{block.order_index + 1}
                </h2>
                <p className={`text-sm ${getStatusColor(block.status)}`}>
                  {block.status.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {block.has_image && (
                <PhotoIcon className="w-5 h-5 text-purple-600" title="Has image" />
              )}
              {block.has_audio && (
                <SpeakerWaveIcon className="w-5 h-5 text-blue-600" title="Has audio" />
              )}
            </div>
          </div>

          {/* Processing Mode Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Processing Mode
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(PROCESSING_MODE_LABELS).map(([mode, label]) => {
                const cost = PROCESSING_MODE_COSTS[mode as ProcessingMode];
                const isSelected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode as ProcessingMode)}
                    disabled={block.status === BlockStatus.PROCESSING}
                    className={`p-3 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-xs font-semibold mb-1">{label}</div>
                    <div className={`text-xs ${isSelected ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {cost} credits
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {PROCESSING_MODE_DESCRIPTIONS[selectedMode]}
            </p>
            {estimatedCost !== null && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Estimated cost: {estimatedCost} credits
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  disabled={block.status === BlockStatus.PROCESSING}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit Input
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={block.status === BlockStatus.PROCESSING || regenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {regenerating ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-1" />
                      Regenerate
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setInputText(block.input_text);
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Input Text */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Input Text
          </h3>
          {editing ? (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {block.input_text}
              </p>
            </div>
          )}
        </div>

        {/* Processed Text */}
        {block.processed_text && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Processed Text ({PROCESSING_MODE_LABELS[block.processing_mode || ProcessingMode.PRESERVE]})
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {block.processed_text}
              </p>
            </div>

            {/* Word Count Comparison */}
            <div className="mt-4 flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
              <div>
                Input: {block.input_text.split(/\s+/).length} words
              </div>
              <div>
                Output: {block.processed_text.split(/\s+/).length} words
              </div>
              <div>
                Change: {
                  ((block.processed_text.split(/\s+/).length - block.input_text.split(/\s+/).length) / block.input_text.split(/\s+/).length * 100).toFixed(1)
                }%
              </div>
            </div>
          </div>
        )}

        {/* Generated Image */}
        {block.image_url && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Generated Image
            </h3>
            <img
              src={block.image_url}
              alt="Generated illustration"
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* Generated Audio */}
        {block.audio_url && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Generated Audio
            </h3>
            <audio controls className="w-full">
              <source src={block.audio_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            {block.audio_duration && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Duration: {Math.floor(block.audio_duration / 60)}:{String(block.audio_duration % 60).padStart(2, '0')}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {block.status === BlockStatus.FAILED && block.error_message && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
              Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {block.error_message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockEditor;
