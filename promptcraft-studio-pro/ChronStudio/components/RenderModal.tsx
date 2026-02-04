import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  FilmIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/solid';

interface RenderModalProps {
  projectId: string;
  sceneIds: string[];
  onClose: () => void;
  onComplete?: (videoUrl: string) => void;
}

interface RenderJob {
  id: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  output_video_url?: string;
  error_message?: string;
}

const RenderModal: React.FC<RenderModalProps> = ({ 
  projectId, 
  sceneIds, 
  onClose,
  onComplete 
}) => {
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [includeTransitions, setIncludeTransitions] = useState(true);
  const [includeTitleCards, setIncludeTitleCards] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRender = async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/chronstudio/projects/${projectId}/render/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            scene_ids: sceneIds,
            include_transitions: includeTransitions,
            include_title_cards: includeTitleCards,
            title_card_style: 'minimal'
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start render');
      }
      
      const job = await response.json();
      setRenderJob(job);
    } catch (err: any) {
      setError(err.message);
      setIsStarting(false);
    }
  };

  const pollRenderStatus = async () => {
    if (!renderJob) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/video-production/render-jobs/${renderJob.id}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const updatedJob = await response.json();
        setRenderJob(updatedJob);
        
        // Check if complete
        if (updatedJob.status === 'completed' && updatedJob.output_video_url) {
          onComplete?.(updatedJob.output_video_url);
        }
      }
    } catch (err) {
      console.error('Failed to poll render status:', err);
    }
  };

  // Poll every 2 seconds when rendering
  useEffect(() => {
    if (!renderJob) return;
    
    const isActive = !['completed', 'failed', 'cancelled'].includes(renderJob.status);
    if (!isActive) return;
    
    const interval = setInterval(pollRenderStatus, 2000);
    return () => clearInterval(interval);
  }, [renderJob]);

  const getStatusColor = () => {
    if (!renderJob) return 'zinc';
    switch (renderJob.status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'cancelled': return 'zinc';
      default: return 'primary';
    }
  };

  const isTerminal = renderJob && ['completed', 'failed', 'cancelled'].includes(renderJob.status);
  const statusColor = getStatusColor();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-${statusColor}-900/50 bg-${statusColor}-950/30`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg border bg-${statusColor}-600/10 border-${statusColor}-600/20`}>
              <FilmIcon className={`w-6 h-6 text-${statusColor}-500`} />
            </div>
            <h3 className="text-xl font-bold text-white">
              {renderJob ? 'Rendering Video' : 'Render Options'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white transition-colors"
            disabled={renderJob && !isTerminal}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {!renderJob ? (
            /* Configuration UI */
            <>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <FilmIcon className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {sceneIds.length} scenes selected
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      All completed scenes will be concatenated into a single video file
                    </p>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={includeTransitions}
                      onChange={(e) => setIncludeTransitions(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                        Crossfade Transitions
                      </span>
                      <p className="text-xs text-zinc-500">
                        Add 0.5s crossfade between scenes for smooth flow
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={includeTitleCards}
                      onChange={(e) => setIncludeTitleCards(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                        Title Cards
                      </span>
                      <p className="text-xs text-zinc-500">
                        Generate title cards for each scene (Coming in Phase 3)
                      </p>
                    </div>
                  </label>
                </div>

                {error && (
                  <div className="flex items-start space-x-3 p-4 bg-red-950/30 rounded-lg border border-red-900/50">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Error</p>
                      <p className="text-xs text-red-300 mt-1">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Progress UI */
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">
                    {renderJob.current_step || 'Processing...'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {renderJob.progress_percentage}%
                  </span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-${statusColor}-600 to-${statusColor}-500 transition-all duration-500 ease-out`}
                    style={{ width: `${renderJob.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Status Messages */}
              {renderJob.status === 'completed' && renderJob.output_video_url && (
                <div className="flex items-start space-x-3 p-4 bg-green-950/30 rounded-lg border border-green-900/50">
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-400">
                      Render Complete!
                    </p>
                    <p className="text-xs text-green-300 mt-1">
                      Your video has been rendered and is ready to download
                    </p>
                  </div>
                </div>
              )}

              {renderJob.status === 'failed' && (
                <div className="flex items-start space-x-3 p-4 bg-red-950/30 rounded-lg border border-red-900/50">
                  <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      Render Failed
                    </p>
                    <p className="text-xs text-red-300 mt-1">
                      {renderJob.error_message || 'An unknown error occurred'}
                    </p>
                  </div>
                </div>
              )}

              {/* Processing Animation */}
              {!isTerminal && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950/30 flex justify-end space-x-3">
          {!renderJob ? (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={startRender}
                disabled={isStarting}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary-900/20 disabled:opacity-50 transition-all text-sm"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>Start Render</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {renderJob.status === 'completed' && renderJob.output_video_url && (
                <a
                  href={renderJob.output_video_url}
                  download
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-green-900/20 transition-all text-sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Download Video</span>
                </a>
              )}
              {isTerminal && (
                <button 
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenderModal;
