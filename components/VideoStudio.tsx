
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

export const VideoStudio: React.FC<{ initialPrompt?: string, initialAspect?: string }> = ({ initialPrompt = '', initialAspect = '16:9' }) => {
  const [image, setImage] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState(initialPrompt);
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
    setStatus('Initializing Veo 3.1 engine...');
    
    // Construct final enhanced prompt
    const enhancedPrompt = [
      prompt.trim(),
      visualStyle,
      movement,
      durationStyle
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm dark:bg-slate-900 dark:border-white/5 dark:backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-transparent to-violet-500 opacity-20" />
        
        <h2 className="text-xl font-black mb-6 flex items-center gap-3 dark:text-slate-100 uppercase tracking-tighter">
          <div className="p-2 bg-indigo-600/10 rounded-lg">
            <Video className="w-6 h-6 text-indigo-500" />
          </div>
          Veo Video Generation Core
        </h2>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left Column: Visual Inputs */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                <Upload className="w-3 h-3" /> Reference Source
              </label>
              <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden dark:bg-black/50 dark:border-white/10 group transition-all hover:border-indigo-500/30">
                {image ? (
                  <img src={image} className="w-full h-full object-cover" alt="Source" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 dark:bg-white/5 dark:shadow-none group-hover:scale-110 transition-transform">
                       <Play className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inject Starting Frame</span>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Format</label>
                <div className="flex gap-2">
                  {['16:9', '9:16'].map(r => (
                    <button
                      key={r}
                      onClick={() => setAspect(r)}
                      className={`flex-1 py-3 text-[10px] font-black border rounded-xl transition-all ${aspect === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-white/5 dark:text-slate-400'}`}
                    >
                      {r === '16:9' ? '16:9' : '9:16'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Resolution</label>
                <div className="flex gap-2">
                  <span className="flex-1 py-3 text-center text-[10px] font-black border border-slate-100 bg-slate-50 text-slate-400 rounded-xl dark:bg-white/5 dark:border-white/5">
                    1080P PRO
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-500/10">
               <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed uppercase tracking-tighter">
                 Veo 3.1 utilizes advanced temporal consistency. Using a reference image improves starting fidelity but restricts initial motion freedom.
               </p>
            </div>
          </div>

          {/* Right Column: Generation Controls */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Palette className="w-3 h-3" /> Visual Style
                </label>
                <select 
                  value={visualStyle} 
                  onChange={e => setVisualStyle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200"
                >
                  {STYLE_PRESETS.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Move className="w-3 h-3" /> Camera Motion
                  </label>
                  <select 
                    value={movement} 
                    onChange={e => setMovement(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200"
                  >
                    {MOVEMENT_PRESETS.map(m => <option key={m.label} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Clock className="w-3 h-3" /> Scene Behavior
                  </label>
                  <select 
                    value={durationStyle} 
                    onChange={e => setDurationStyle(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200"
                  >
                    {DURATION_PRESETS.map(d => <option key={d.label} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Sparkles className="w-3 h-3" /> Core Action Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="w-full h-32 rounded-2xl border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 shadow-inner resize-none"
                  placeholder="Describe the action, subject, and environment details..."
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {loading ? 'Executing Temporal Map...' : 'Compute Video Stream'}
              </button>
              
              {loading && (
                <div className="space-y-2">
                   <p className="text-center text-[10px] text-indigo-500 animate-pulse font-black uppercase tracking-widest">{status}</p>
                   <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" />
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {videoUrl && (
          <div className="mt-12 space-y-4 pt-10 border-t border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Monitor className="w-3 h-3" /> Result Stream
               </h3>
               <a href={videoUrl} download="veo_generation.mp4" className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all dark:bg-white/5 dark:text-slate-300">
                <Download className="w-4 h-4" /> Download Binary
              </a>
            </div>
            <div className="rounded-3xl overflow-hidden bg-black border border-slate-200 shadow-2xl dark:border-white/5 aspect-video">
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
