import React from 'react';
import { Loader2, Play, Calendar, Eye, X, FileText, Download } from 'lucide-react';
import { getChannelVideos, getVideoTranscript, YouTubeVideoResult, TranscriptData } from '../services/serpApiService';

interface ChannelVideoSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  channelHandle: string;
  channelName: string;
  onSelectVideo: (video: YouTubeVideoResult, transcript: TranscriptData) => void;
}

export const ChannelVideoSelector: React.FC<ChannelVideoSelectorProps> = ({
  isOpen,
  onClose,
  channelHandle,
  channelName,
  onSelectVideo
}) => {
  const [videos, setVideos] = React.useState<YouTubeVideoResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loadingTranscript, setLoadingTranscript] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<'relevance' | 'upload_date' | 'view_count'>('relevance');
  const [nextPageToken, setNextPageToken] = React.useState<string | undefined>();
  const [totalResults, setTotalResults] = React.useState<number | undefined>();
  const [hasMore, setHasMore] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && channelHandle) {
      loadVideos();
    }
  }, [isOpen, channelHandle, sortBy]);

  const loadVideos = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setVideos([]);
      setNextPageToken(undefined);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const result = await getChannelVideos(channelHandle, undefined, { 
        sortBy,
        pageToken: reset ? undefined : nextPageToken 
      });
      
      if (reset) {
        setVideos(result.videos);
      } else {
        setVideos(prev => [...prev, ...result.videos]);
      }
      
      setNextPageToken(result.nextPageToken);
      setTotalResults(result.totalResults);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreVideos = () => {
    if (hasMore && !loadingMore) {
      loadVideos(false);
    }
  };

  const handleSelectVideo = async (video: YouTubeVideoResult) => {
    setLoadingTranscript(video.video_id);
    setError(null);
    try {
      // Fetch transcript for the selected video
      const transcript = await getVideoTranscript(video.video_id);
      onSelectVideo(video, transcript);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcript');
    } finally {
      setLoadingTranscript(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-500/20">
        {/* Header */}
        <div className="bg-neutral-700 dark:bg-neutral-600 p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide">Select Video</h2>
            <p className="text-sm text-white/80 mt-1">
              Channel: {channelName}
              {totalResults && ` • ${totalResults.toLocaleString()} videos`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Sort Controls */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-500/10 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase">Sort By:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('relevance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  sortBy === 'relevance'
                    ? 'bg-neutral-700 text-white shadow-lg'
                    : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                }`}
              >
                Relevance
              </button>
              <button
                onClick={() => setSortBy('upload_date')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  sortBy === 'upload_date'
                    ? 'bg-neutral-700 text-white shadow-lg'
                    : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                }`}
              >
                <Calendar className="w-3 h-3 inline mr-1" />
                Latest
              </button>
              <button
                onClick={() => setSortBy('view_count')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  sortBy === 'view_count'
                    ? 'bg-neutral-700 text-white shadow-lg'
                    : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                }`}
              >
                <Eye className="w-3 h-3 inline mr-1" />
                Most Viewed
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-neutral-500 animate-spin mx-auto mb-4" />
                <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Loading videos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={loadVideos}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase transition-colors"
              >
                Retry
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">No videos found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video, index) => (
                <div
                  key={video.video_id || `video-${index}`}
                  className="bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-500/10 overflow-hidden hover:border-neutral-500/50 transition-all group"
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative w-48 h-28 shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={video.thumbnail?.static || 'https://via.placeholder.com/480x270?text=No+Thumbnail'}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {loadingTranscript === video.video_id ? (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : (
                          <Play className="w-8 h-8 text-white" />
                        )}
                      </div>
                      {video.length && (
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-bold text-white">
                          {video.length}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2 line-clamp-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        {video.channel.verified && (
                          <span className="text-neutral-600 dark:text-neutral-400 font-black">✓ VERIFIED</span>
                        )}
                        {video.extensions?.includes('CC') && (
                          <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs font-bold">CC</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views?.toLocaleString() || '0'} views
                        </span>
                        {video.published_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {video.published_date}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
                        {video.description}
                      </p>

                      <button
                        onClick={() => handleSelectVideo(video)}
                        disabled={loadingTranscript === video.video_id}
                        className="px-4 py-2 bg-neutral-700 dark:bg-neutral-600 hover:bg-neutral-800 dark:hover:bg-neutral-500 disabled:bg-neutral-400 text-white rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 shadow-lg disabled:cursor-not-allowed"
                      >
                        {loadingTranscript === video.video_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading Transcript...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Select & Get Transcript
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreVideos}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-neutral-700 dark:bg-neutral-600 hover:bg-neutral-800 dark:hover:bg-neutral-500 disabled:bg-neutral-400 text-white rounded-lg text-sm font-bold uppercase transition-all flex items-center gap-2 shadow-lg disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      <>
                        Load More Videos
                        {nextPageToken && ` (${videos.length} of ${totalResults?.toLocaleString()})`}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
