// HistoryPanel.tsx - Browse, search, and reuse saved analyses
// Date: January 26, 2026

import React, { useState, useEffect, useCallback } from 'react';
import {
  getUserAnalysisHistory,
  searchAnalysisHistory,
  getFavoriteAnalyses,
  updateAnalysisHistory,
  toggleAnalysisFavorite,
  getUserAssets,
  searchAssets,
  getUserTranscriptions,
  getAnalysisStatistics,
} from '../services/historyService';

interface HistoryItem {
  id: string;
  analysis_name: string;
  participant_a_name: string;
  participant_b_name?: string;
  score_participant_a: number;
  score_participant_b?: number;
  winner?: string;
  created_at: string;
  tags: string[];
  is_favorite: boolean;
  processing_time_ms?: number;
  claims_count: number;
  fallacies_count_a: number;
  fallacies_count_b?: number;
}

interface HistoryPanelProps {
  userId: string;
  onSelectAnalysis?: (analysis: any) => void;
  onReuse?: (transcriptId: string) => void;
  compact?: boolean;
}

export function HistoryPanel({
  userId,
  onSelectAnalysis,
  onReuse,
  compact = false,
}: HistoryPanelProps) {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  const [activeTab, setActiveTab] = useState<'analyses' | 'assets' | 'transcripts' | 'dashboard'>('dashboard');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HistoryItem[]>([]);
  const [filterTag, setFilterTag] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'uses'>('date');

  // ═══════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    loadHistoryData();
  }, [userId, activeTab]);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analyses') {
        const { analyses } = await getUserAnalysisHistory({
          userId,
          limit: 50,
        });
        setHistoryItems(sortHistoryItems(analyses || [], sortBy));
      } else if (activeTab === 'assets') {
        const data = await getUserAssets({
          userId,
          limit: 50,
        });
        setAssets(data || []);
      } else if (activeTab === 'transcripts') {
        const data = await getUserTranscriptions(userId);
        setTranscripts(data || []);
      } else if (activeTab === 'dashboard') {
        const data = await getAnalysisStatistics(userId);
        setDashboard(data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortHistoryItems = (items: HistoryItem[], sortType: string): HistoryItem[] => {
    const sorted = [...items];
    switch (sortType) {
      case 'score':
        return sorted.sort((a, b) => (b.score_participant_a || 0) - (a.score_participant_a || 0));
      case 'uses':
        // Would need to add hit_count field for this
        return sorted;
      case 'date':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchAnalysisHistory({
        userId,
        searchQuery: query,
      });
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) performSearch(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // ═══════════════════════════════════════════════════════════
  // FILTER & SORT
  // ═══════════════════════════════════════════════════════════
  const filteredItems = useCallback(() => {
    let items = searchQuery && searchResults.length > 0 ? searchResults : historyItems;

    // Filter by tag
    if (filterTag) {
      items = items.filter(item => item.tags?.includes(filterTag));
    }

    // Filter favorites
    if (showFavoritesOnly) {
      items = items.filter(item => item.is_favorite);
    }

    return sortHistoryItems(items, sortBy);
  }, [historyItems, searchResults, filterTag, showFavoritesOnly, sortBy, searchQuery]);

  // ═══════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════
  const handleToggleFavorite = async (id: string, currentState: boolean) => {
    try {
      await toggleAnalysisFavorite(id, !currentState);
      // Refresh data
      loadHistoryData();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleReuse = (item: HistoryItem) => {
    if (onReuse && item.id) {
      onReuse(item.id);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════

  if (compact && activeTab === 'dashboard') {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-3">📊 Quick Stats</h3>
        {dashboard && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-700/50 p-2 rounded">
              <div className="text-slate-400">Total Analyses</div>
              <div className="text-lg font-bold text-cyan-400">{dashboard.total_analyses}</div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded">
              <div className="text-slate-400">This Week</div>
              <div className="text-lg font-bold text-purple-400">{dashboard.analyses_this_week}</div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded">
              <div className="text-slate-400">Avg Score</div>
              <div className="text-lg font-bold text-green-400">{(dashboard.avg_score || 0).toFixed(1)}</div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded">
              <div className="text-slate-400">Cache Hits</div>
              <div className="text-lg font-bold text-yellow-400">{dashboard.cache_hits_this_month || 0}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-lg font-bold text-white">📚 History & Library</h2>
        <div className="flex gap-1">
          {(['dashboard', 'analyses', 'assets', 'transcripts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-500/30 text-cyan-300'
                  : 'bg-slate-700/30 text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'analyses' && '🔬 Analyses'}
              {tab === 'assets' && '📁 Assets'}
              {tab === 'transcripts' && '📝 Transcripts'}
              {tab === 'dashboard' && '📊 Dashboard'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      {activeTab === 'analyses' && (
        <div className="p-3 border-b border-slate-700 bg-slate-800/30">
          <input
            type="text"
            placeholder="Search analyses, participants..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-2 py-1 rounded text-xs ${
                showFavoritesOnly ? 'bg-yellow-500/30 text-yellow-300' : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              ⭐ Favorites
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2 py-1 rounded text-xs bg-slate-700/50 text-slate-300 border border-slate-600"
            >
              <option value="date">📅 Newest</option>
              <option value="score">🏆 Highest Score</option>
              <option value="uses">♻️ Most Reused</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="text-center py-8 text-slate-500">
            <div className="inline-block animate-spin">⏳</div> Loading...
          </div>
        )}

        {/* Analyses Tab */}
        {activeTab === 'analyses' && !loading && (
          <div className="space-y-2">
            {filteredItems().length === 0 ? (
              <p className="text-slate-400 text-sm p-4">No analyses found</p>
            ) : (
              filteredItems().map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-700/40 border border-slate-600/50 rounded hover:bg-slate-700/60 cursor-pointer transition-colors"
                  onClick={() => onSelectAnalysis?.(item)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">{item.analysis_name}</h4>
                      <p className="text-xs text-slate-400">
                        {item.participant_a_name} {item.participant_b_name ? `vs ${item.participant_b_name}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleToggleFavorite(item.id, item.is_favorite);
                      }}
                      className="text-lg"
                    >
                      {item.is_favorite ? '⭐' : '☆'}
                    </button>
                  </div>

                  <div className="flex gap-2 mb-2 flex-wrap text-xs">
                    {item.winner && (
                      <span className="bg-green-500/30 text-green-300 px-2 py-0.5 rounded">
                        🏆 {item.winner}
                      </span>
                    )}
                    <span className="bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                      Score: {item.score_participant_a?.toFixed(1)}
                    </span>
                    <span className="bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                      Claims: {item.claims_count}
                    </span>
                    <span className="bg-red-500/30 text-red-300 px-2 py-0.5 rounded">
                      Fallacies: {item.fallacies_count_a}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleReuse(item);
                      }}
                      className="px-2 py-1 bg-cyan-500/30 text-cyan-300 rounded hover:bg-cyan-500/50"
                    >
                      ♻️ Reuse
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && !loading && (
          <div className="space-y-2">
            {assets.length === 0 ? (
              <p className="text-slate-400 text-sm p-4">No assets uploaded yet</p>
            ) : (
              assets.map(asset => (
                <div key={asset.id} className="p-3 bg-slate-700/40 border border-slate-600/50 rounded">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">{asset.original_filename}</h4>
                      <p className="text-xs text-slate-400">{asset.asset_type} · {asset.file_size} bytes</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {asset.analysis_count} analyses · Added {new Date(asset.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Transcripts Tab */}
        {activeTab === 'transcripts' && !loading && (
          <div className="space-y-2">
            {transcripts.length === 0 ? (
              <p className="text-slate-400 text-sm p-4">No transcripts yet</p>
            ) : (
              transcripts.map(transcript => (
                <div key={transcript.id} className="p-3 bg-slate-700/40 border border-slate-600/50 rounded">
                  <p className="text-xs text-slate-300 line-clamp-2">{transcript.transcription_text}</p>
                  <div className="text-xs text-slate-500 mt-1">
                    {transcript.word_count} words · {transcript.source_api} · {new Date(transcript.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && !loading && dashboard && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Total Analyses" value={dashboard.total_analyses} color="cyan" />
              <StatCard label="This Week" value={dashboard.analyses_this_week} color="purple" />
              <StatCard label="Avg Score" value={(dashboard.avg_score || 0).toFixed(1)} color="green" />
              <StatCard label="Cache Hits" value={dashboard.cache_hits_this_month || 0} color="yellow" />
            </div>
            <div className="p-3 bg-slate-700/40 border border-slate-600/50 rounded">
              <h4 className="text-sm font-semibold text-white mb-2">🔥 Trending Tags</h4>
              <div className="flex gap-1 flex-wrap">
                {(dashboard.trending_tags || []).map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded text-xs cursor-pointer hover:bg-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'cyan' | 'purple' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    cyan: 'bg-cyan-500/30 text-cyan-400',
    purple: 'bg-purple-500/30 text-purple-400',
    green: 'bg-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/30 text-red-400',
  };

  return (
    <div className={`p-3 rounded border border-slate-600/50 ${colorClasses[color]}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
