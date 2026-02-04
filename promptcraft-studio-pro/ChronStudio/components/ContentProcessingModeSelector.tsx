import React from 'react';
import { ContentProcessingMode } from '../types';
import { 
  LockClosedIcon, 
  PencilIcon, 
  SparklesIcon, 
  BeakerIcon, 
  RocketLaunchIcon 
} from '@heroicons/react/24/outline';

interface Props {
  mode: ContentProcessingMode;
  onChange: (mode: ContentProcessingMode) => void;
  onReimagineParamsChange?: (params: any) => void;
  reimagineParams?: any;
}

const ContentProcessingModeSelector: React.FC<Props> = ({ 
  mode, 
  onChange, 
  onReimagineParamsChange,
  reimagineParams 
}) => {
  const modes = [
    {
      value: ContentProcessingMode.PRESERVE,
      icon: LockClosedIcon,
      label: 'Preserve',
      description: 'Use content exactly as provided',
      color: 'blue',
      details: 'No AI modification. Perfect for pre-written scripts or precise content.'
    },
    {
      value: ContentProcessingMode.POLISH,
      icon: PencilIcon,
      label: 'Polish',
      description: 'Fix typos and improve structure',
      color: 'green',
      details: 'Grammar, spelling, and flow corrections only. Main content unchanged.'
    },
    {
      value: ContentProcessingMode.ENHANCE,
      icon: SparklesIcon,
      label: 'Enhance',
      description: 'Expand with context and details',
      color: 'purple',
      details: 'Adds visual descriptions and contextual details. Core narrative preserved.'
    },
    {
      value: ContentProcessingMode.CREATIVE,
      icon: BeakerIcon,
      label: 'Creative',
      description: 'AI interprets with creative freedom',
      color: 'orange',
      details: 'Balanced creative interpretation. Adds cinematic elements and drama.'
    },
    {
      value: ContentProcessingMode.REIMAGINE,
      icon: RocketLaunchIcon,
      label: 'Reimagine',
      description: 'Complete AI transformation',
      color: 'red',
      details: 'Source as inspiration. Full creative control with custom parameters.'
    }
  ];

  const selectedMode = modes.find(m => m.value === mode);

  return (
    <div className="space-y-4">
      {/* Mode Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
          Content Processing Mode
        </label>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          AI Control
        </div>
      </div>

      {/* Mode Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isSelected = mode === m.value;
          
          return (
            <button
              key={m.value}
              onClick={() => onChange(m.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900/20 shadow-lg scale-105`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-6 h-6 shrink-0 ${
                  isSelected ? `text-${m.color}-600` : 'text-gray-400'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold mb-1 ${
                    isSelected ? `text-${m.color}-700 dark:text-${m.color}-300` : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {m.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {m.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Mode Info */}
      {selectedMode && (
        <div className={`p-4 rounded-lg border-l-4 border-${selectedMode.color}-500 bg-${selectedMode.color}-50 dark:bg-${selectedMode.color}-900/10`}>
          <div className="flex items-start gap-3">
            <selectedMode.icon className={`w-5 h-5 text-${selectedMode.color}-600 mt-0.5`} />
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {selectedMode.label} Mode Active
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMode.details}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reimagine Parameters */}
      {mode === ContentProcessingMode.REIMAGINE && (
        <div className="p-4 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 space-y-4">
          <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <RocketLaunchIcon className="w-4 h-4" />
            Reimagine Parameters
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tone
              </label>
              <input
                type="text"
                value={reimagineParams?.tone || ''}
                onChange={(e) => onReimagineParamsChange?.({ ...reimagineParams, tone: e.target.value })}
                placeholder="e.g. Suspenseful, Comedic, Epic"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Perspective
              </label>
              <input
                type="text"
                value={reimagineParams?.perspective || ''}
                onChange={(e) => onReimagineParamsChange?.({ ...reimagineParams, perspective: e.target.value })}
                placeholder="e.g. First-person, Omniscient"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emphasis
              </label>
              <input
                type="text"
                value={reimagineParams?.emphasis || ''}
                onChange={(e) => onReimagineParamsChange?.({ ...reimagineParams, emphasis: e.target.value })}
                placeholder="e.g. Focus on action, emotions"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Length
              </label>
              <select
                value={reimagineParams?.targetLength || 'medium'}
                onChange={(e) => onReimagineParamsChange?.({ ...reimagineParams, targetLength: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
              >
                <option value="short">Short (15-30 sec)</option>
                <option value="medium">Medium (1-2 min)</option>
                <option value="long">Long (3-5 min)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add Elements (comma-separated)
            </label>
            <input
              type="text"
              value={reimagineParams?.addElements?.join(', ') || ''}
              onChange={(e) => onReimagineParamsChange?.({ 
                ...reimagineParams, 
                addElements: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="e.g. mystery, romance, time travel"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentProcessingModeSelector;
