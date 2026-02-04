import React, { useState } from 'react';
import { SportsConfig, fetchSportsWorkflow, SportsResponse, scenesToContent } from '../../services/workflowService';
import { TrophyIcon, CalendarIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { ProjectData, ContentProcessingMode } from '../../types';
import ContentProcessingModeSelector from '../ContentProcessingModeSelector';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const SportsConfigPanel: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [selectedSport, setSelectedSport] = useState<'soccer' | 'basketball' | 'football' | 'baseball' | 'tennis'>('soccer');
  const [league, setLeague] = useState('');
  const [eventType, setEventType] = useState<'fixtures' | 'standings' | 'recent'>('recent');
  const [date, setDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sportsData, setSportsData] = useState<SportsResponse | null>(null);

  const sports = [
    { id: 'soccer', name: 'Soccer ⚽', leagues: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga'] },
    { id: 'basketball', name: 'Basketball 🏀', leagues: ['NBA', 'EuroLeague'] },
    { id: 'football', name: 'American Football 🏈', leagues: ['NFL'] },
    { id: 'baseball', name: 'Baseball ⚾', leagues: ['MLB'] },
    { id: 'tennis', name: 'Tennis 🎾', leagues: ['ATP', 'WTA'] },
  ];

  const currentSport = sports.find(s => s.id === selectedSport);

  const handleFetchSports = async () => {
    setLoading(true);
    setError(null);

    try {
      const config: SportsConfig = {
        sport: selectedSport,
        league: league || undefined,
        event_type: eventType,
        date: date || undefined,
      };

      const response = await fetchSportsWorkflow(config);
      setSportsData(response);

      // Update project with fetched content
      const content = scenesToContent(response.suggested_scenes);
      const title = `Sports: ${currentSport?.name} ${league ? `- ${league}` : ''}`;
      
      updateProject({
        title,
        content,
        workflow_config: config,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to fetch sports data');
      console.error('Sports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center space-x-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 flex items-center justify-center">
          <TrophyIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Sports Highlights</h2>
          <p className="text-sm text-neutral-600 dark:text-zinc-400">Generate highlight reels from live sports data</p>
        </div>
      </div>

      {/* Content Processing Mode */}
      <ContentProcessingModeSelector
        mode={projectData.processingMode || ContentProcessingMode.CREATIVE}
        onChange={(mode) => updateProject({ processingMode: mode })}
        onReimagineParamsChange={(params) => updateProject({ reimagineParams: params })}
        reimagineParams={projectData.reimagineParams}
      />

      {/* Sport Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Select Sport</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => {
                setSelectedSport(sport.id as any);
                setLeague('');
              }}
              className={`p-4 rounded-lg text-sm font-medium transition-all ${
                selectedSport === sport.id
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-500'
                  : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent hover:border-neutral-300 dark:hover:border-zinc-700'
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      {/* League Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          League/Competition (Optional)
        </label>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white"
        >
          <option value="">All Leagues</option>
          {currentSport?.leagues.map((lg) => (
            <option key={lg} value={lg}>{lg}</option>
          ))}
        </select>
      </div>

      {/* Event Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Event Type</label>
        <div className="flex space-x-3">
          <button
            onClick={() => setEventType('recent')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              eventType === 'recent'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-500'
                : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent'
            }`}
          >
            Recent Games
          </button>
          <button
            onClick={() => setEventType('fixtures')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              eventType === 'fixtures'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-500'
                : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent'
            }`}
          >
            Upcoming Fixtures
          </button>
          <button
            onClick={() => setEventType('standings')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              eventType === 'standings'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-500'
                : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent'
            }`}
          >
            Standings
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
          <CalendarIcon className="w-4 h-4" />
          <span>Specific Date (Optional)</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white"
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
        onClick={handleFetchSports}
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        <CloudArrowDownIcon className="w-5 h-5" />
        <span>{loading ? 'Fetching Sports Data...' : 'Fetch Sports Data'}</span>
      </button>

      {/* Results Display */}
      {sportsData && (
        <div className="space-y-4 p-6 rounded-xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Found {sportsData.count} Events
            </h3>
            {sportsData.warning && (
              <span className="text-xs text-amber-600 dark:text-amber-500">Using mock data</span>
            )}
          </div>

          {/* Event List */}
          <div className="space-y-3">
            {sportsData.events.map((event, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-neutral-900 dark:text-white">{event.team1}</span>
                    <span className="text-sm text-neutral-500 dark:text-zinc-500">vs</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{event.team2}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{event.score}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-500">
                  <span>{event.league}</span>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Scene Preview */}
          <div className="pt-4 border-t border-neutral-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-3">
              Generated {sportsData.suggested_scenes.length} Video Scenes
            </h4>
            <div className="space-y-2">
              {sportsData.suggested_scenes.map((scene) => (
                <div key={scene.scene_number} className="p-3 rounded bg-white dark:bg-zinc-800 text-sm">
                  <span className="font-medium text-green-600 dark:text-green-400">Scene {scene.scene_number}:</span>
                  <p className="text-neutral-700 dark:text-zinc-300 mt-1">{scene.narrative_text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onNext}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue with This Data →
          </button>
        </div>
      )}
    </div>
  );
};

export default SportsConfigPanel;
