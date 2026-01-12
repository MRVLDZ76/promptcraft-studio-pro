import React from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Video, 
  Clock, 
  Eye, 
  CheckCircle2,
  Loader2,
  TrendingUp,
  Calendar,
  PlayCircle,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { 
  searchYouTube, 
  YouTubeVideoResult, 
  YouTubeChannelResult,
  SearchFilters,
  formatViews,
  formatSubscribers
} from '../services/serpApiService';

interface VideoSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: YouTubeVideoResult) => void;
  participantLabel?: string;
}

export const VideoSearchModal: React.FC<VideoSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectVideo,
  participantLabel = 'Participant'
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [videos, setVideos] = React.useState<YouTubeVideoResult[]>([]);
  const [channels, setChannels] = React.useState<YouTubeChannelResult[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState<SearchFilters>({
    sortBy: 'relevance',
    duration: 'any',
    uploadDate: 'any'
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const results = await searchYouTube(searchQuery, filters);
      setVideos(results.video_results || []);
      setChannels(results.channel_results || []);

      if (!results.video_results?.length && !results.channel_results?.length) {
        setError('No results found. Try different keywords.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-indigo-500/20 w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-indigo-500/10 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-500/10 dark:to-cyan-500/10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                Search Debater Videos
              </h2>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Find and select video for {participantLabel}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-indigo-500/10 bg-slate-50 dark:bg-black/20">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by name, topic, or channel (e.g., 'climate debate', 'ben shapiro')"
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                showFilters
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-indigo-500/20 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-indigo-500/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg outline-none text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="upload_date">Upload Date</option>
                    <option value="view_count">View Count</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Duration
                  </label>
                  <select
                    value={filters.duration}
                    onChange={(e) => setFilters({ ...filters, duration: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg outline-none text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="any">Any Duration</option>
                    <option value="short">&lt; 4 minutes</option>
                    <option value="medium">4-20 minutes</option>
                    <option value="long">&gt; 20 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Upload Date
                  </label>
                  <select
                    value={filters.uploadDate}
                    onChange={(e) => setFilters({ ...filters, uploadDate: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-indigo-500/20 rounded-lg outline-none text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="any">Any Time</option>
                    <option value="hour">Last Hour</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800 dark:text-red-300">{error}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Try adjusting your search or filters.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Searching YouTube...
              </p>
            </div>
          )}

          {!loading && !error && videos.length === 0 && channels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Video className="w-16 h-16 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Search for debaters and videos
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600">
                Enter a name, topic, or channel to get started
              </p>
            </div>
          )}

          {/* Channels */}
          {channels.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" />
                Channels ({channels.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {channels.map((channel, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-indigo-500/20 p-4 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSearchQuery(channel.handle)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={channel.thumbnail}
                        alt={channel.title}
                        className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                            {channel.title}
                          </h4>
                          {channel.verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          {channel.handle}
                        </p>
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400">
                          {formatSubscribers(channel.subscribers)} subscribers
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <PlayCircle className="w-3.5 h-3.5" />
                Videos ({videos.length})
              </h3>
              <div className="space-y-3">
                {videos.map((video, index) => (
                  <div
                    key={index}
                    onClick={() => onSelectVideo(video)}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-indigo-500/20 overflow-hidden hover:shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="relative shrink-0">
                        <img
                          src={video.thumbnail.static}
                          alt={video.title}
                          className="w-56 h-32 object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {video.length}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all flex items-center justify-center">
                          <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                          {video.title}
                        </h4>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={video.channel.thumbnail}
                            alt={video.channel.name}
                            className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700"
                          />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {video.channel.name}
                          </span>
                          {video.channel.verified && (
                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                          {video.description}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatViews(video.views)} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {video.published_date}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-indigo-500/10 bg-slate-50 dark:bg-black/20 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Powered by SerpAPI • Click any video to select
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
