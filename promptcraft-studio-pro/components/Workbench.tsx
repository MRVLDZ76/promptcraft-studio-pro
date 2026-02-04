
import React from 'react';
import { PromptState, Character, Mode } from '../types';
import { CAMERAS, LIGHTING, FILMS, COMPOSITIONS, MOODS, PALETTES } from '../constants';
import { User, MapPin, Ban, Sliders, Plus, X, Trash, Save, Settings, Move, Clock, AlertCircle, Sparkles } from 'lucide-react';

const VISUAL_STYLES = [
  { label: 'Cinematic', value: 'cinematic film aesthetic, hollywood production quality, dramatic lighting', tooltip: 'Hollywood-style dramatic cinematography with professional color grading' },
  { label: 'Anime', value: 'anime art style, vibrant colors, cel shaded', tooltip: 'Japanese animation style with vibrant colors and bold lines' },
  { label: 'Noir', value: 'film noir aesthetic, high contrast black and white, dramatic shadows', tooltip: 'Classic black and white with dramatic shadows and mystery' },
  { label: 'Cartoon', value: 'cartoon illustration style, bold outlines, exaggerated features', tooltip: 'Playful cartoon style with bold colors and simplified forms' },
  { label: 'Realistic', value: 'photorealistic, high detail, natural lighting', tooltip: 'True-to-life photography with realistic details' },
  { label: 'Fantasy', value: 'fantasy art style, magical atmosphere, ethereal glow', tooltip: 'Magical and otherworldly with ethereal lighting' },
  { label: 'Cyberpunk', value: 'cyberpunk aesthetic, neon lights, futuristic urban', tooltip: 'Futuristic dystopian with neon lights and tech elements' },
  { label: 'Vintage', value: 'vintage photography, retro color grading, film grain', tooltip: 'Classic retro look with film grain and aged colors' },
  { label: 'Comic Book', value: 'comic book art style, bold ink lines, halftone dots', tooltip: 'Dynamic comic book style with bold inks and dramatic angles' },
  { label: 'Oil Painting', value: 'oil painting style, visible brushstrokes, artistic', tooltip: 'Classical oil painting with visible brushwork and texture' },
];

interface Props {
  state: PromptState;
  setState: React.Dispatch<React.SetStateAction<PromptState>>;
  characters: Character[];
  onSaveCharacter: () => void;
  onManageCharacters: () => void;
  onLoadCharacter: (id: string) => void;
  mode: Mode;
}

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', width: 'w-4', height: 'h-4', tooltip: 'Square format - Instagram posts, profile pictures' },
  { label: '16:9', value: '16:9', width: 'w-6', height: 'h-3.5', tooltip: 'Widescreen - YouTube videos, desktop wallpapers, cinema' },
  { label: '9:16', value: '9:16', width: 'w-3.5', height: 'h-6', tooltip: 'Vertical - Instagram Stories, TikTok, mobile content' },
  { label: '4:3', value: '4:3', width: 'w-5', height: 'h-4', tooltip: 'Classic TV - Traditional photography, presentations' },
  { label: '3:2', value: '3:2', width: 'w-5.5', height: 'h-4', tooltip: 'DSLR standard - Professional photography, prints' },
  { label: '3:4', value: '3:4', width: 'w-4', height: 'h-5.5', tooltip: 'Portrait - Magazine covers, product displays' },
];

const IMAGE_SIZES = [
  { value: '1K' as const, tooltip: 'Fast generation - 1024px, good for previews and drafts' },
  { value: '2K' as const, tooltip: 'Balanced quality - 2048px, ideal for social media' },
  { value: '4K' as const, tooltip: 'High resolution - 4096px, professional prints and displays' },
];

const MOVEMENT_PRESETS = [
  { label: 'Static', value: '', tooltip: 'No camera movement - Stable, focused composition' },
  { label: 'Push In', value: 'Slow Push In', tooltip: 'Move toward subject - Builds tension and intimacy' },
  { label: 'Pull Out', value: 'Slow Pull Out', tooltip: 'Move away from subject - Reveals context and environment' },
  { label: 'Pan Right', value: 'Slow Pan Right', tooltip: 'Horizontal sweep right - Follow action or reveal space' },
  { label: 'Pan Left', value: 'Slow Pan Left', tooltip: 'Horizontal sweep left - Smooth lateral movement' },
  { label: 'Tracking', value: 'Cinematic Tracking Shot', tooltip: 'Follow subject smoothly - Dynamic, professional look' },
];

const DURATION_PRESETS = [
  { label: 'Default', value: '', tooltip: 'Standard timing - Normal speed video generation' },
  { label: 'Loop', value: 'Seamless Loop', tooltip: 'Repeating animation - Perfect for GIFs and backgrounds' },
  { label: 'Slow Mo', value: 'Slow Motion', tooltip: 'Dramatic slowdown - Emphasize details and impact' },
  { label: 'Timelapse', value: 'Timelapse', tooltip: 'Accelerated time - Condense long processes' },
];

const NEGATIVE_SUGGESTIONS = [
  'text', 'watermarks', 'logos', 'titles', 'subtitles', 'captions',
  'words', 'letters', 'UI elements', 'low quality', 'blurry',
  'distorted faces', 'extra limbs', 'bad anatomy', 'deformed',
  'ugly', 'duplicate', 'cropped', 'out of frame', 'signature',
  'username', 'grain', 'compression artifacts', 'pixelated'
];

export const Workbench: React.FC<Props> = ({ 
  state, setState, characters, onSaveCharacter, onManageCharacters, onLoadCharacter, mode
}) => {
  const updateStyle = (key: keyof PromptState['style'], value: any) => {
    setState(prev => ({ ...prev, style: { ...prev.style, [key]: value } }));
  };

  const updateScene = (key: keyof PromptState['scene'], value: any) => {
    setState(prev => ({ ...prev, scene: { ...prev.scene, [key]: value } }));
  };

  const updateVideo = (key: keyof PromptState['video'], value: any) => {
    setState(prev => ({ ...prev, video: { ...prev.video, [key]: value } }));
  };

  const addCustomIngredient = (val: string) => {
    if (!val.trim()) return;
    setState(prev => ({
      ...prev,
      customIngredients: [...new Set([...prev.customIngredients, val.trim()])]
    }));
  };

  const removeCustomIngredient = (idx: number) => {
    setState(prev => ({
      ...prev,
      customIngredients: prev.customIngredients.filter((_, i) => i !== idx)
    }));
  };

  return (
    <aside className="w-full lg:w-[450px] xl:w-[500px] flex flex-col border-r border-neutral-200 bg-white overflow-y-auto shrink-0 z-10 p-5 space-y-6 dark:bg-neutral-900 dark:border-neutral-800 text-neutral-900 dark:text-white">
      
      {/* Global Config */}
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setState(p => ({ ...p, aspect: ratio.value }))}
                title={ratio.tooltip}
                className={`group relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                  state.aspect === ratio.value
                    ? 'bg-neutral-50 border-neutral-500 text-neutral-700 dark:bg-neutral-800/40 dark:border-neutral-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'
                }`}
              >
                <div className={`${ratio.width} ${ratio.height} border-2 rounded-sm ${state.aspect === ratio.value ? 'border-neutral-500' : 'border-neutral-300 dark:border-neutral-600'}`} />
                <span className="text-[10px] font-bold">{ratio.label}</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {ratio.tooltip}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Model Target</label>
            <select 
              value={state.model}
              onChange={e => setState(p => ({ ...p, model: e.target.value }))}
              className="w-full text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md py-2 px-2 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="generic" title="Works with any AI model - Flexible and compatible">Universal</option>
              <option value="midjourney" title="Optimized for Midjourney syntax - Uses --ar and --no flags">Midjourney</option>
              <option value="veo" title="Optimized for Google Veo - Video generation focused">Google Veo</option>
              <option value="stable" title="Optimized for Stable Diffusion - Open-source image generation">Stable Diffusion</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Image Quality (Pro)</label>
            <div className="flex gap-1">
              {IMAGE_SIZES.map(size => (
                <button
                  key={size.value}
                  onClick={() => setState(p => ({ ...p, imageSize: size.value }))}
                  title={size.tooltip}
                  className={`group relative flex-1 py-1 text-[10px] font-bold border rounded transition-all ${
                    state.imageSize === size.value
                      ? 'bg-neutral-600 text-white border-neutral-600'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700'
                  }`}
                >
                  {size.value}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {size.tooltip}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Style */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> Visual Style
          </label>
          <div className="grid grid-cols-5 gap-2">
            {VISUAL_STYLES.map((style) => (
              <button
                key={style.label}
                onClick={() => setState(p => ({ ...p, visualStyle: state.visualStyle === style.value ? '' : style.value }))}
                title={style.tooltip}
                className={`group relative px-2 py-2.5 text-[10px] font-bold rounded-lg border transition-all ${
                  state.visualStyle === style.value
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-purple-400 hover:bg-purple-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                {style.label}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {style.tooltip}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Motion & Duration (Conditional) */}
      {mode === Mode.VIDEO && (
        <section className="p-4 bg-neutral-100/50 dark:bg-neutral-800/30 rounded-xl border border-neutral-200 dark:border-neutral-700/50 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-2 dark:text-neutral-400">
              <Move className="w-3 h-3" /> Camera Movement
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOVEMENT_PRESETS.map(move => (
                <button
                  key={move.label}
                  onClick={() => updateVideo('move', move.value)}
                  title={move.tooltip}
                  className={`group relative py-1.5 text-[10px] font-medium border rounded transition-all ${
                    state.video.move === move.value
                      ? 'bg-neutral-600 text-white border-neutral-600'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {move.label}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {move.tooltip}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-2 dark:text-neutral-400">
              <Clock className="w-3 h-3" /> Duration / Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_PRESETS.map(dur => (
                <button
                  key={dur.label}
                  onClick={() => updateVideo('dur', dur.value)}
                  title={dur.tooltip}
                  className={`group relative py-1.5 text-[10px] font-medium border rounded transition-all ${
                    state.video.dur === dur.value
                      ? 'bg-neutral-600 text-white border-neutral-600'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {dur.label}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {dur.tooltip}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subject */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500" /> Subject
          </h3>
          <div className="flex items-center gap-1">
            <select 
              onChange={e => onLoadCharacter(e.target.value)}
              className="text-[10px] border-none bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-600 py-1 pl-2 pr-6 cursor-pointer dark:bg-neutral-800 dark:text-neutral-300"
            >
              <option value="">Load Saved...</option>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={onSaveCharacter} className="p-1.5 bg-neutral-100 rounded text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={onManageCharacters} className="p-1.5 bg-neutral-100 rounded text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <textarea 
          value={state.subject}
          onChange={e => setState(p => ({ ...p, subject: e.target.value }))}
          rows={3}
          className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 text-sm text-neutral-900 dark:text-neutral-200 p-3 outline-none"
          placeholder="A cyberpunk samurai standing in neon rain..."
        />
      </section>

      {/* Scene */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Scene & Intent</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5">Detail Level</label>
            <select 
              value={state.detailLevel}
              onChange={e => setState(p => ({ ...p, detailLevel: e.target.value as any }))}
              className="w-full text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md py-2 px-2 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="compact" title="Short and concise - Quick generations with essential elements">Compact</option>
              <option value="detailed" title="Balanced description - Good detail without being verbose">Detailed</option>
              <option value="ultra" title="Maximum detail - Comprehensive prompts with all elements">Ultra</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5">Composition</label>
            <div className="relative">
              <select 
                value={state.scene.composition}
                onChange={e => updateScene('composition', e.target.value)}
                title={COMPOSITIONS.find(c => c.value === state.scene.composition)?.desc || 'Choose a composition'}
                className="w-full text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md py-2 px-2 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {COMPOSITIONS.map(c => <option key={c.label} value={c.value} title={c.desc}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5">Setting / Location</label>
          <input 
            type="text"
            value={state.scene.setting}
            onChange={e => updateScene('setting', e.target.value)}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2.5 text-sm text-neutral-900 dark:text-neutral-200 focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="e.g., rain-soaked neon alley"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5">Action</label>
          <input 
            type="text"
            value={state.scene.action}
            onChange={e => updateScene('action', e.target.value)}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2.5 text-sm text-neutral-900 dark:text-neutral-200 focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="e.g., draws a katana slow breath visible"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5">Mood</label>
            <div className="relative">
              <select 
                value={state.scene.mood}
                onChange={e => updateScene('mood', e.target.value)}
                title={MOODS.find(m => m.value === state.scene.mood)?.desc || 'Choose a mood'}
                className="w-full text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md py-2 px-2 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {MOODS.map(m => <option key={m.label} value={m.value} title={m.desc}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5">Palette</label>
            <div className="relative">
              <select 
                value={state.scene.color}
                onChange={e => updateScene('color', e.target.value)}
                title={PALETTES.find(p => p.value === state.scene.color)?.desc || 'Choose a color palette'}
                className="w-full text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md py-2 px-2 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {PALETTES.map(p => <option key={p.label} value={p.value} title={p.desc}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Negative */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Negative Prompts (Avoid)</h3>
        </div>
        
        {/* Clickable Suggestion Chips */}
        <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 min-h-[60px]">
          {NEGATIVE_SUGGESTIONS.map(item => {
            const isSelected = state.negative.split(',').map(s => s.trim()).includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  const current = state.negative.split(',').map(s => s.trim()).filter(Boolean);
                  if (isSelected) {
                    setState(p => ({ ...p, negative: current.filter(s => s !== item).join(', ') }));
                  } else {
                    setState(p => ({ ...p, negative: [...current, item].join(', ') }));
                  }
                }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600 hover:border-red-400 hover:text-red-600'
                }`}
              >
                {isSelected && '× '}
                {item}
              </button>
            );
          })}
        </div>
        
        {/* Custom Negative Prompt Input */}
        <div>
          <label className="block text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
            Custom Negative Prompt (optional)
          </label>
          <textarea 
            value={state.negative}
            onChange={e => setState(p => ({ ...p, negative: e.target.value }))}
            rows={2}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-200 p-2.5 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none"
            placeholder="Add custom terms separated by commas..."
          />
        </div>
        
        {state.negative && (
          <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium">
            Excluding: {state.negative}
          </p>
        )}
      </section>

      {/* Ingredients */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
          <Sliders className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Visual Ingredients</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Camera & Lens</label>
            <div className="grid grid-cols-2 gap-2">
              {CAMERAS.map(c => (
                <button
                  key={c.id}
                  onClick={() => updateStyle('cam', state.style.cam === c.value ? '' : c.value)}
                  title={c.desc}
                  className={`group relative px-2 py-2 border rounded text-[10px] font-medium transition-all ${state.style.cam === c.value ? 'bg-neutral-50 border-neutral-500 text-neutral-700 dark:bg-neutral-800/40' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'}`}
                >
                  {c.label}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {c.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Lighting</label>
            <div className="grid grid-cols-2 gap-2">
              {LIGHTING.map(l => (
                <button
                  key={l.id}
                  onClick={() => {
                    const active = state.style.light.includes(l.value);
                    updateStyle('light', active ? state.style.light.filter(v => v !== l.value) : [...state.style.light, l.value]);
                  }}
                  title={l.desc}
                  className={`group relative px-2 py-2 border rounded text-[10px] font-medium transition-all ${state.style.light.includes(l.value) ? 'bg-neutral-50 border-neutral-500 text-neutral-700 dark:bg-neutral-800/40' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'}`}
                >
                  {l.label}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {l.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Film Stock</label>
            <div className="grid grid-cols-2 gap-2">
              {FILMS.map(f => (
                <button
                  key={f.id}
                  onClick={() => updateStyle('film', state.style.film === f.value ? '' : f.value)}
                  title={f.desc}
                  className={`group relative px-2 py-2 border rounded text-[10px] font-medium transition-all ${state.style.film === f.value ? 'bg-neutral-50 border-neutral-500 text-neutral-700 dark:bg-neutral-800/40' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'}`}
                >
                  {f.label}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Custom Ingredients</label>
          <div className="flex gap-2">
            <input 
              id="customIn"
              type="text" 
              className="flex-1 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
              placeholder="e.g., anamorphic flare" 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  addCustomIngredient((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <button 
              onClick={() => {
                const el = document.getElementById('customIn') as HTMLInputElement;
                addCustomIngredient(el.value);
                el.value = '';
              }}
              className="p-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {state.customIngredients.map((txt, idx) => (
              <span key={idx} className="flex items-center gap-1 text-[10px] bg-neutral-50 border border-neutral-100 text-neutral-700 px-2 py-1 rounded-full dark:bg-neutral-800/20 dark:border-neutral-700">
                {txt}
                <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => removeCustomIngredient(idx)} />
              </span>
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
};
