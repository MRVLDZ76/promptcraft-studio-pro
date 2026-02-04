import React, { useState } from 'react';
import { LearningConfig, fetchLearningWorkflow, LearningResponse, scenesToContent } from '../../services/workflowService';
import { AcademicCapIcon, MagnifyingGlassIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { ProjectData, ContentProcessingMode } from '../../types';
import ContentProcessingModeSelector from '../ContentProcessingModeSelector';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const LearningConfigPanel: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [sections, setSections] = useState(5);
  const [includeImages, setIncludeImages] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [learningData, setLearningData] = useState<LearningResponse | null>(null);

  const subjectAreas = [
    'Science', 'Technology', 'History', 'Geography', 'Mathematics',
    'Literature', 'Philosophy', 'Arts', 'Biology', 'Physics',
    'Chemistry', 'Economics', 'Psychology', 'Astronomy', 'Languages'
  ];

  const handleFetchLearning = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic to research');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: LearningConfig = {
        topic: topic.trim(),
        subject: subject || undefined,
        sections,
        include_images: includeImages,
      };

      const response = await fetchLearningWorkflow(config);
      setLearningData(response);

      // Update project with fetched content
      const content = scenesToContent(response.suggested_scenes);
      const title = `Learning: ${response.content.title}`;
      
      updateProject({
        title,
        content,
        workflow_config: config,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to fetch educational content');
      console.error('Learning fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center space-x-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-500 flex items-center justify-center">
          <AcademicCapIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Educational Content</h2>
          <p className="text-sm text-neutral-600 dark:text-zinc-400">Create explainer videos from Wikipedia topics</p>
        </div>
      </div>

      {/* Content Processing Mode */}
      <ContentProcessingModeSelector
        mode={projectData.processingMode || ContentProcessingMode.ENHANCE}
        onChange={(mode) => updateProject({ processingMode: mode })}
        onReimagineParamsChange={(params) => updateProject({ reimagineParams: params })}
        reimagineParams={projectData.reimagineParams}
      />

      {/* Topic Search */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span>Research Topic</span>
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Quantum Computing, French Revolution, DNA Structure"
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-xs text-neutral-500 dark:text-zinc-500">
          Enter any topic available on Wikipedia
        </p>
      </div>

      {/* Subject Area Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Subject Area (Optional)
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white"
        >
          <option value="">All Subjects</option>
          {subjectAreas.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* Number of Sections */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Content Sections: {sections}
        </label>
        <input
          type="range"
          min="3"
          max="8"
          value={sections}
          onChange={(e) => setSections(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-neutral-500 dark:text-zinc-500">
          More sections = longer, more detailed video
        </p>
      </div>

      {/* Include Images Toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="includeImages"
          checked={includeImages}
          onChange={(e) => setIncludeImages(e.target.checked)}
          className="w-5 h-5 rounded border-neutral-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="includeImages" className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Include images from Wikipedia article
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Fetch Button */}
      <button
        onClick={handleFetchLearning}
        disabled={loading || !topic.trim()}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        <CloudArrowDownIcon className="w-5 h-5" />
        <span>{loading ? 'Researching Topic...' : 'Research & Generate Content'}</span>
      </button>

      {/* Results Display */}
      {learningData && (
        <div className="space-y-4 p-6 rounded-xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {learningData.content.title}
            </h3>
            {learningData.warning && (
              <span className="text-xs text-amber-600 dark:text-amber-500">Using mock data</span>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-2">Summary</h4>
            <p className="text-sm text-neutral-600 dark:text-zinc-400">{learningData.content.summary}</p>
          </div>

          {/* Image Preview */}
          {learningData.content.image_url && (
            <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-zinc-700">
              <img 
                src={learningData.content.image_url} 
                alt={learningData.content.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Content Paragraphs */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
              Content ({learningData.content.paragraphs.length} paragraphs)
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2 p-4 rounded-lg bg-white dark:bg-zinc-800">
              {learningData.content.paragraphs.map((para, idx) => (
                <p key={idx} className="text-sm text-neutral-600 dark:text-zinc-400">
                  {para.substring(0, 200)}...
                </p>
              ))}
            </div>
          </div>

          {/* Scene Preview */}
          <div className="pt-4 border-t border-neutral-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-3">
              Generated {learningData.suggested_scenes.length} Video Scenes
            </h4>
            <div className="space-y-2">
              {learningData.suggested_scenes.map((scene) => (
                <div key={scene.scene_number} className="p-3 rounded bg-white dark:bg-zinc-800 text-sm">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">Scene {scene.scene_number}:</span>
                  <p className="text-neutral-700 dark:text-zinc-300 mt-1">{scene.narrative_text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wikipedia Link */}
          <a
            href={learningData.content.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View original Wikipedia article →
          </a>

          {/* Continue Button */}
          <button
            onClick={onNext}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue with This Content →
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningConfigPanel;
