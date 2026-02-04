import React, { useState } from 'react';
import { MusicConfig, fetchMusicWorkflow, MusicResponse, scenesToContent } from '../../services/workflowService';
import { MusicalNoteIcon, MagnifyingGlassIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { ProjectData, ContentProcessingMode } from '../../types';
import ContentProcessingModeSelector from '../ContentProcessingModeSelector';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const MusicConfigPanel: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [searchMode, setSearchMode] = useState<'id' | 'search'>('search');
  const [trackId, setTrackId] = useState('');
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [videoType, setVideoType] = useState<'lyric' | 'visualizer' | 'performance'>('lyric');
  const [duration, setDuration] = useState(30);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [musicData, setMusicData] = useState<MusicResponse | null>(null);

  const videoTypes = [
    { id: 'lyric', name: 'Lyric Video', desc: 'Animated text with lyrics on screen' },
    { id: 'visualizer', name: 'Audio Visualizer', desc: 'Abstract visuals synchronized to music' },
    { id: 'performance', name: 'Performance Concept', desc: 'Stylized concert/stage visuals' },
  ];

  const handleFetchMusic = async () => {
    if (searchMode === 'id' && !trackId.trim()) {
      setError('Please enter a Spotify track ID');
      return;
    }
    if (searchMode === 'search' && (!artist.trim() || !title.trim())) {
      setError('Please enter both artist name and song title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: MusicConfig = {
        track_id: searchMode === 'id' ? trackId.trim() : undefined,
        artist: searchMode === 'search' ? artist.trim() : undefined,
        title: searchMode === 'search' ? title.trim() : undefined,
        video_type: videoType,
        duration,
      };

      const response = await fetchMusicWorkflow(config);
      setMusicData(response);

      // Update project with fetched content
      const content = scenesToContent(response.suggested_scenes);
      const projectTitle = `Music Video: ${response.track.artist} - ${response.track.name}`;
      
      updateProject({
        title: projectTitle,
        content,
        workflow_config: config,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to fetch music data');
      console.error('Music fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center space-x-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-500 flex items-center justify-center">
          <MusicalNoteIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Music Video Generator</h2>
          <p className="text-sm text-neutral-600 dark:text-zinc-400">Create lyric videos, visualizers, or performance concepts</p>
        </div>
      </div>

      {/* Content Processing Mode */}
      <ContentProcessingModeSelector
        mode={projectData.processingMode || ContentProcessingMode.CREATIVE}
        onChange={(mode) => updateProject({ processingMode: mode })}
        onReimagineParamsChange={(params) => updateProject({ reimagineParams: params })}
        reimagineParams={projectData.reimagineParams}
      />

      {/* Search Mode Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Search Method</label>
        <div className="flex space-x-3">
          <button
            onClick={() => setSearchMode('search')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              searchMode === 'search'
                ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-2 border-pink-500'
                : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent'
            }`}
          >
            Search by Artist & Title
          </button>
          <button
            onClick={() => setSearchMode('id')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              searchMode === 'id'
                ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-2 border-pink-500'
                : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-2 border-transparent'
            }`}
          >
            Spotify Track ID
          </button>
        </div>
      </div>

      {/* Search by Artist & Title */}
      {searchMode === 'search' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-zinc-300">
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>Artist Name</span>
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g., Taylor Swift"
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Song Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Anti-Hero"
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Search by Track ID */}
      {searchMode === 'id' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
            Spotify Track ID
          </label>
          <input
            type="text"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="e.g., 0V3wPSX9ygBnCm8psDIegu"
            className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-500 dark:text-zinc-500">
            Find the track ID in the Spotify URL: spotify.com/track/<strong>ID</strong>
          </p>
        </div>
      )}

      {/* Video Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">Video Type</label>
        <div className="space-y-2">
          {videoTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setVideoType(type.id as any)}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                videoType === type.id
                  ? 'bg-pink-100 dark:bg-pink-900/20 border-2 border-pink-500'
                  : 'bg-neutral-100 dark:bg-zinc-800 border-2 border-transparent hover:border-neutral-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${
                    videoType === type.id 
                      ? 'text-pink-700 dark:text-pink-400' 
                      : 'text-neutral-900 dark:text-white'
                  }`}>
                    {type.name}
                  </h4>
                  <p className={`text-sm ${
                    videoType === type.id
                      ? 'text-pink-600 dark:text-pink-500'
                      : 'text-neutral-600 dark:text-zinc-400'
                  }`}>
                    {type.desc}
                  </p>
                </div>
                {videoType === type.id && (
                  <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white">
                    ✓
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
          Video Duration: {duration} seconds
        </label>
        <input
          type="range"
          min="15"
          max="60"
          step="5"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-neutral-500 dark:text-zinc-500">
          Choose between 15-60 seconds for your video clip
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Fetch Button */}
      <button
        onClick={handleFetchMusic}
        disabled={loading || (searchMode === 'id' && !trackId.trim()) || (searchMode === 'search' && (!artist.trim() || !title.trim()))}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-pink-600 hover:bg-pink-700 disabled:bg-neutral-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        <CloudArrowDownIcon className="w-5 h-5" />
        <span>{loading ? 'Fetching Track Data...' : 'Fetch Track & Generate'}</span>
      </button>

      {/* Results Display */}
      {musicData && (
        <div className="space-y-4 p-6 rounded-xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {musicData.track.artist} - {musicData.track.name}
            </h3>
            {musicData.warning && (
              <span className="text-xs text-amber-600 dark:text-amber-500">Using mock data</span>
            )}
          </div>

          {/* Track Info */}
          <div className="flex items-start space-x-4 p-4 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700">
            {musicData.track.album_art_url && (
              <img 
                src={musicData.track.album_art_url} 
                alt={musicData.track.album}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white">{musicData.track.name}</h4>
                <p className="text-sm text-neutral-600 dark:text-zinc-400">{musicData.track.artist}</p>
              </div>
              <p className="text-sm text-neutral-500 dark:text-zinc-500">Album: {musicData.track.album}</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">
                Duration: {Math.floor(musicData.track.duration_ms / 60000)}:{String(Math.floor((musicData.track.duration_ms % 60000) / 1000)).padStart(2, '0')}
              </p>
              {musicData.track.lyrics_url && (
                <a 
                  href={musicData.track.lyrics_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                >
                  View lyrics →
                </a>
              )}
            </div>
          </div>

          {/* Scene Preview */}
          <div className="pt-4 border-t border-neutral-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-3">
              Generated {musicData.suggested_scenes.length} Video Scenes ({videoType})
            </h4>
            <div className="space-y-2">
              {musicData.suggested_scenes.map((scene) => (
                <div key={scene.scene_number} className="p-3 rounded bg-white dark:bg-zinc-800 text-sm">
                  <span className="font-medium text-pink-600 dark:text-pink-400">Scene {scene.scene_number}:</span>
                  <p className="text-neutral-700 dark:text-zinc-300 mt-1">{scene.narrative_text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onNext}
            className="w-full px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue with This Track →
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicConfigPanel;
