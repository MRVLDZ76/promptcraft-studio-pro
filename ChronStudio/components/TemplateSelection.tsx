import React from 'react';
import { ProjectData, ProjectCategory, ProductionMode } from '../types';
import { BookOpenIcon, GlobeAmericasIcon, SparklesIcon, Cog6ToothIcon, CommandLineIcon } from '@heroicons/react/24/outline';

interface Props {
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const TemplateSelection: React.FC<Props> = ({ updateProject, onNext }) => {
  const [selectedMode, setSelectedMode] = React.useState<ProductionMode>(ProductionMode.INTEGRATED);

  const handleSelect = (category: ProjectCategory) => {
    updateProject({ category, mode: selectedMode });
    onNext();
  };

  return (
    <div className="animate-fade-in space-y-12 mt-8">
      
      {/* Configuration Header */}
      <div className="flex flex-col items-center justify-center space-y-6">
         <div className="text-center space-y-2 max-w-2xl">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Select Workflow</h2>
          <p className="text-neutral-600 dark:text-zinc-400">Choose your narrative framework and production strategy.</p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-neutral-100 dark:bg-zinc-900 p-1 rounded-lg flex space-x-1 border border-neutral-200 dark:border-zinc-800 shadow-lg">
          <button
            onClick={() => setSelectedMode(ProductionMode.INTEGRATED)}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${
              selectedMode === ProductionMode.INTEGRATED 
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm' 
                : 'text-neutral-500 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-300'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Integrated Studio</span>
          </button>
          <button
            onClick={() => setSelectedMode(ProductionMode.EXTERNAL)}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${
              selectedMode === ProductionMode.EXTERNAL
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-neutral-500 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-300'
            }`}
          >
            <CommandLineIcon className="w-4 h-4" />
            <span>External / Prompt Only</span>
          </button>
        </div>
        
        {selectedMode === ProductionMode.EXTERNAL && (
          <div className="text-xs text-blue-500 bg-blue-500/10 px-4 py-2 rounded border border-blue-500/20 max-w-md text-center">
            <strong>External Mode Active:</strong> We will generate optimized prompts for Whisk (Images) and Google Studio Flow (Video) instead of rendering assets directly.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <button 
          onClick={() => handleSelect(ProjectCategory.BIBLICAL)}
          className="group relative flex flex-col items-start p-8 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-neutral-50 dark:hover:bg-zinc-900 hover:border-neutral-300 dark:hover:border-zinc-700 transition-all text-left hover:shadow-xl hover:shadow-primary-500/5"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BookOpenIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100 mb-2">Biblical Narrative</h3>
          <p className="text-sm text-neutral-600 dark:text-zinc-500 leading-relaxed min-h-[40px]">
            Optimized for scripture analysis, theological context, and ancient near-eastern settings.
          </p>
          <span className="mt-6 text-xs font-medium text-amber-500 group-hover:underline">Select Template &rarr;</span>
        </button>

        <button 
          onClick={() => handleSelect(ProjectCategory.HISTORICAL)}
          className="group relative flex flex-col items-start p-8 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-neutral-50 dark:hover:bg-zinc-900 hover:border-neutral-300 dark:hover:border-zinc-700 transition-all text-left hover:shadow-xl hover:shadow-primary-500/5"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <GlobeAmericasIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100 mb-2">Historical Event</h3>
          <p className="text-sm text-neutral-600 dark:text-zinc-500 leading-relaxed min-h-[40px]">
            Designed for historical documentation, figure recreation, and period-accurate events.
          </p>
          <span className="mt-6 text-xs font-medium text-blue-500 group-hover:underline">Select Template &rarr;</span>
        </button>

        <button 
          onClick={() => handleSelect(ProjectCategory.CUSTOM)}
          className="group relative flex flex-col items-start p-8 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-neutral-50 dark:hover:bg-zinc-900 hover:border-neutral-300 dark:hover:border-zinc-700 transition-all text-left hover:shadow-xl hover:shadow-primary-500/5"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100 mb-2">Custom Creative</h3>
          <p className="text-sm text-neutral-600 dark:text-zinc-500 leading-relaxed min-h-[40px]">
            Open canvas for fiction, sci-fi, marketing, or stylized narratives. Fully adaptable.
          </p>
          <span className="mt-6 text-xs font-medium text-purple-500 group-hover:underline">Select Template &rarr;</span>
        </button>
      </div>
    </div>
  );
};

export default TemplateSelection;