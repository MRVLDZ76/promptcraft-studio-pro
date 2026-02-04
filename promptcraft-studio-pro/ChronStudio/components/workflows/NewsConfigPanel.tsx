import React, { useState } from 'react';
import { NewsConfig, fetchNewsWorkflow, NewsResponse, scenesToContent } from '../../services/workflowService';
import { NewspaperIcon, MagnifyingGlassIcon, GlobeAmericasIcon, CalendarIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { ProjectData, ContentProcessingMode } from '../../types';
import ContentProcessingModeSelector from '../ContentProcessingModeSelector';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const NewsConfigPanel: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [keywords, setKeywords] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [maxResults, setMaxResults] = useState(5);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);

  const availableCountries = [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'ca', name: 'Canada' },
    { code: 'au', name: 'Australia' },
    { code: 'in', name: 'India' },
  ];

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
  ];

  const handleFetchNews = async () => {
    if (!keywords.trim()) {
      setError('Please enter search keywords');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: NewsConfig = {
        keywords: keywords.trim(),
        countries: selectedCountries.length > 0 ? selectedCountries : undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
        max_results: maxResults,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      const response = await fetchNewsWorkflow(config);
      setNewsData(response);

      // Update project with fetched content
      const content = scenesToContent(response.suggested_scenes);
      const title = `News: ${keywords}`;
      
      updateProject({
        title,
        content,
        workflow_config: config,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to fetch news');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center space-x-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center">
          <NewspaperIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">News Digest</h2>
          <p className="text-sm text-neutral-600 dark:text-zinc-400">Fetch trending news and generate video content</p>
        </div>
      </div>

      {/* Content Processing Mode */}
      <ContentProcessingModeSelector
        mode={projectData.processingMode || ContentProcessingMode.CREATIVE}
        onChange={(mode) => updateProject({ processingMode: mode })}
        onReimagineParamsChange={(params) => updateProject({ reimagineParams: params })}
        reimagineParams={projectData.reimagineParams}
      />

      {/* Keywords Search */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span>Search Keywords</span>
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., artificial intelligence, climate change, space exploration"
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Countries Filter */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
          <GlobeAmericasIcon className="w-4 h-4" />
          <span>Countries (Optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {availableCountries.map((country) => (
            <button
              key={country.code}
              onClick={() => toggleCountry(country.code)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCountries.includes(country.code)
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-500'
                  : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent hover:border-neutral-300 dark:hover:border-zinc-700'
              }`}
            >
              {country.name}
            </button>
          ))}
        </div>
      </div>

      {/* Languages Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Languages</label>
        <div className="flex flex-wrap gap-2">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedLanguages.includes(lang.code)
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-500'
                  : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent hover:border-neutral-300 dark:hover:border-zinc-700'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
            <CalendarIcon className="w-4 h-4" />
            <span>From Date (Optional)</span>
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
            <CalendarIcon className="w-4 h-4" />
            <span>To Date (Optional)</span>
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {/* Max Results */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Number of Articles: {maxResults}
        </label>
        <input
          type="range"
          min="3"
          max="10"
          value={maxResults}
          onChange={(e) => setMaxResults(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Fetch Button */}
      <button
        onClick={handleFetchNews}
        disabled={loading || !keywords.trim()}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        <CloudArrowDownIcon className="w-5 h-5" />
        <span>{loading ? 'Fetching News...' : 'Fetch News Articles'}</span>
      </button>

      {/* Results Display */}
      {newsData && (
        <div className="space-y-4 p-6 rounded-xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Found {newsData.count} Articles
            </h3>
            {newsData.warning && (
              <span className="text-xs text-amber-600 dark:text-amber-500">Using mock data</span>
            )}
          </div>

          {/* Article List */}
          <div className="space-y-3">
            {newsData.articles.map((article, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700">
                <h4 className="font-medium text-neutral-900 dark:text-white mb-1">{article.title}</h4>
                <p className="text-sm text-neutral-600 dark:text-zinc-400 mb-2">{article.description}</p>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-500">
                  <span>{article.source}</span>
                  <span>{new Date(article.published_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Scene Preview */}
          <div className="pt-4 border-t border-neutral-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-3">
              Generated {newsData.suggested_scenes.length} Video Scenes
            </h4>
            <div className="space-y-2">
              {newsData.suggested_scenes.map((scene) => (
                <div key={scene.scene_number} className="p-3 rounded bg-white dark:bg-zinc-800 text-sm">
                  <span className="font-medium text-red-600 dark:text-red-400">Scene {scene.scene_number}:</span>
                  <p className="text-neutral-700 dark:text-zinc-300 mt-1">{scene.narrative_text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onNext}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue with These Articles →
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsConfigPanel;
