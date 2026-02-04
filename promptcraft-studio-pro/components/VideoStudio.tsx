
import React from 'react';
import { generateVideoVeo } from '../services/geminiService';
// Added Monitor to the imports to fix "Cannot find name 'Monitor'" error.
import { Video, Upload, Play, Download, AlertCircle, Loader2, Move, Clock, Palette, Sparkles, Monitor } from 'lucide-react';

const MOVEMENT_PRESETS = [
  { label: 'Static', value: 'Static shot with subtle ambient movement' },
  { label: 'Push In', value: 'Slow cinematic push in (dolly in)' },
  { label: 'Pull Out', value: 'Slow cinematic pull out (dolly out)' },
  { label: 'Pan Right', value: 'Slow horizontal pan to the right' },
  { label: 'Pan Left', value: 'Slow horizontal pan to the left' },
  { label: 'Tracking', value: 'Dynamic tracking shot following the subject' },
  { label: 'Crane Down', value: 'Cinematic crane shot moving downwards' },
  { label: 'Tilt Up', value: 'Dramatic vertical tilt up' },
];

const DURATION_PRESETS = [
  { label: 'Standard', value: '' },
  { label: 'Loop', value: 'designed for a seamless loop' },
  { label: 'Slow Mo', value: 'captured in slow motion (high frame rate aesthetic)' },
  { label: 'Timelapse', value: 'high-speed timelapse effect' },
];

const STYLE_PRESETS = [
  { label: 'Cinematic', value: 'High-end cinematic film style, professional color grading, 8k resolution' },
  { label: 'Cyberpunk', value: 'Cyberpunk aesthetic, neon lighting, rainy streets, high contrast cyan and magenta' },
  { label: 'Anime', value: 'Modern high-quality anime style, vibrant colors, clean linework, Ghibli-inspired' },
  { label: 'Noir', value: 'Classic Film Noir, black and white, dramatic shadows, moody atmospheric lighting' },
  { label: '3D Render', value: 'Octane render style, Unreal Engine 5, hyper-realistic 3D textures' },
  { label: 'Dreamy', value: 'Ethereal dreamy aesthetic, soft focus, glowing highlights, pastel color palette' },
];

const NEGATIVE_SUGGESTIONS = [
  'text', 'watermarks', 'logos', 'titles', 'subtitles', 'captions',
  'words', 'letters', 'UI elements', 'low quality', 'blurry',
  'distorted faces', 'extra limbs', 'bad anatomy', 'deformed',
  'ugly', 'duplicate', 'cropped', 'out of frame', 'signature',
  'username', 'grain', 'compression artifacts', 'pixelated'
];

export const VideoStudio: React.FC<{ initialPrompt?: string, initialAspect?: string }> = ({ initialPrompt = '', initialAspect = '16:9' }) => {
  const [provider, setProvider] = React.useState<'veo' | 'sora'>('veo');
  const [image, setImage] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = React.useState<string[]>([
    'text', 'watermarks', 'logos', 'titles', 'subtitles', 'captions', 
    'words', 'letters', 'UI elements', 'low quality', 'blurry', 
    'distorted faces', 'extra limbs', 'bad anatomy', 'deformed', 
    'ugly', 'duplicate', 'cropped', 'out of frame', 'signature', 'username'
  ]);
  const [aspect, setAspect] = React.useState(initialAspect);
  const [movement, setMovement] = React.useState('');
  const [durationStyle, setDurationStyle] = React.useState('');
  const [visualStyle, setVisualStyle] = React.useState('High-end cinematic film style, professional color grading, 8k resolution');
  
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialAspect) setAspect(initialAspect);
  }, [initialPrompt, initialAspect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setStatus(`Initializing ${provider === 'veo' ? 'Veo 3.1' : 'Sora'} engine...`);
    
    // Construct final enhanced prompt with negative prompts
    const enhancedPrompt = [
      prompt.trim(),
      visualStyle,
      movement,
      durationStyle,
      negativePrompt.length > 0 ? `Exclude: ${negativePrompt.join(', ')}` : ''
    ].filter(Boolean).join('. ');

    try {
      const url = await generateVideoVeo(enhancedPrompt, image || undefined, aspect);
      setVideoUrl(url);
    } catch (err: any) {
      setError(err.message || 'Video generation failed.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const toggleNegativePrompt = (item: string) => {
    setNegativePrompt(prev =>
      prev.includes(item)
        ? prev.filter(p => p !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600 opacity-30" />
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black flex items-center gap-3 text-neutral-900 dark:text-white uppercase tracking-tighter">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <Video className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
            </div>
            AI Video Generator
          </h2>
          
          {/* Provider Switcher */}
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1.5 border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setProvider('veo')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                provider === 'veo'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Veo 3.1
            </button>
            <button
              onClick={() => setProvider('sora')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                provider === 'sora'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                Sora
                <span className="text-[8px] px-1.5 py-0.5 bg-purple-500 text-white rounded-full">SOON</span>
              </span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left Column: Visual Inputs */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">
                <Upload className="w-3 h-3" /> Reference Source
              </label>
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center relative overflow-hidden group transition-all hover:border-purple-400 dark:hover:border-purple-600">
                {image ? (
                  <img src={image} className="w-full h-full object-cover" alt="Source" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white dark:bg-neutral-700 rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                       <Play className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Inject Starting Frame</span>
                  </>
                )}
                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                {image && (
                  <button onClick={() => setImage(null)} className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors">
                    <AlertCircle className="w-3.5 h-3.5 rotate-45" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2 block">Format</label>
                <div className="flex gap-2">
                  {['16:9', '9:16'].map(r => (
                    <button
                      key={r}
                      onClick={() => setAspect(r)}
                      className={`flex-1 py-3 text-[10px] font-black border rounded-xl transition-all ${
                        aspect === r 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg' 
                          : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-purple-400'
                      }`}
                    >
                      {r === '16:9' ? '16:9' : '9:16'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2 block">Resolution</label>
                <div className="flex gap-2">
                  <span className="flex-1 py-3 text-center text-[10px] font-black border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-xl">
                    1080P PRO
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
               <p className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">
                 {provider === 'veo' 
                   ? 'Veo 3.1 utilizes advanced temporal consistency. Using a reference image improves starting fidelity but restricts initial motion freedom.'
                   : 'Sora will be available soon. Advanced video generation with extended duration support and cinematic quality.'}
               </p>
            </div>
          </div>

          {/* Right Column: Generation Controls */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2">
                  <Sparkles className="w-3 h-3" /> Core Action Prompt
                </label>
                <textarea
                  value={prompt}
                  style={{ height: '23rem' }}
                  onChange={e => setPrompt(e.target.value)}
                  className="w-full h-56 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  placeholder="Describe the action, subject, and environment details..."
                />
              </div>
 

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="py-5 w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {loading ? 'Executing Temporal Map...' : 'Compute Video Stream'}
              </button>
              
              {loading && (
                <div className="space-y-2">
                   <p className="text-center text-[10px] text-neutral-500 animate-pulse font-black uppercase tracking-widest">{status}</p>
                   <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-600 animate-[loading_2s_ease-in-out_infinite]" />
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {videoUrl && (
          <div className="mt-12 space-y-4 pt-10 border-t border-neutral-100 dark:border-white/5 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex justify-between items-center">
               <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <Monitor className="w-3 h-3" /> Result Stream
               </h3>
               <a href={videoUrl} download="veo_generation.mp4" className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-700 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-700 hover:text-white transition-all dark:bg-white/5 dark:text-neutral-300">
                <Download className="w-4 h-4" /> Download Binary
              </a>
            </div>
            <div className="rounded-3xl overflow-hidden bg-black border border-neutral-200 shadow-2xl dark:border-white/5 aspect-video">
              <video src={videoUrl} controls className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-5 bg-red-900 border border-red-800 rounded-2xl flex items-center gap-4 text-red-100 text-[10px] font-black uppercase tracking-widest animate-in shake">
            <AlertCircle className="w-6 h-6 shrink-0 text-red-400" />
            <div>
               <p className="text-red-400 mb-0.5">Engine Fault Detected</p>
               {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
