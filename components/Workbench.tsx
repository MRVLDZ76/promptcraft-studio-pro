
import React from 'react';
import { PromptState, Character, Mode } from '../types';
import { CAMERAS, LIGHTING, FILMS, COMPOSITIONS } from '../constants';
import { User, MapPin, Ban, Sliders, Plus, X, Trash, Save, Settings, Move, Clock } from 'lucide-react';

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
  { label: '1:1', value: '1:1', width: 'w-4', height: 'h-4' },
  { label: '16:9', value: '16:9', width: 'w-6', height: 'h-3.5' },
  { label: '9:16', value: '9:16', width: 'w-3.5', height: 'h-6' },
  { label: '4:3', value: '4:3', width: 'w-5', height: 'h-4' },
  { label: '3:2', value: '3:2', width: 'w-5.5', height: 'h-4' },
  { label: '3:4', value: '3:4', width: 'w-4', height: 'h-5.5' },
];

const IMAGE_SIZES: ('1K' | '2K' | '4K')[] = ['1K', '2K', '4K'];

const MOVEMENT_PRESETS = [
  { label: 'Static', value: '' },
  { label: 'Push In', value: 'Slow Push In' },
  { label: 'Pull Out', value: 'Slow Pull Out' },
  { label: 'Pan Right', value: 'Slow Pan Right' },
  { label: 'Pan Left', value: 'Slow Pan Left' },
  { label: 'Tracking', value: 'Cinematic Tracking Shot' },
];

const DURATION_PRESETS = [
  { label: 'Default', value: '' },
  { label: 'Loop', value: 'Seamless Loop' },
  { label: 'Slow Mo', value: 'Slow Motion' },
  { label: 'Timelapse', value: 'Timelapse' },
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
    <aside className="w-full lg:w-[450px] xl:w-[500px] flex flex-col border-r border-slate-200 bg-white overflow-y-auto shrink-0 z-10 p-5 space-y-6 dark:bg-slate-900 dark:border-slate-800">
      
      {/* Global Config */}
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setState(p => ({ ...p, aspect: ratio.value }))}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                  state.aspect === ratio.value
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <div className={`${ratio.width} ${ratio.height} border-2 rounded-sm ${state.aspect === ratio.value ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`} />
                <span className="text-[10px] font-bold">{ratio.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Model Target</label>
            <select 
              value={state.model}
              onChange={e => setState(p => ({ ...p, model: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-2 px-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="generic">Universal</option>
              <option value="midjourney">Midjourney</option>
              <option value="veo">Google Veo</option>
              <option value="stable">Stable Diffusion</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Image Quality (Pro)</label>
            <div className="flex gap-1">
              {IMAGE_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setState(p => ({ ...p, imageSize: size }))}
                  className={`flex-1 py-1 text-[10px] font-bold border rounded transition-all ${
                    state.imageSize === size
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Motion & Duration (Conditional) */}
      {mode === Mode.VIDEO && (
        <section className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4 dark:bg-indigo-900/10 dark:border-indigo-900/30">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 dark:text-indigo-400">
              <Move className="w-3 h-3" /> Camera Movement
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOVEMENT_PRESETS.map(move => (
                <button
                  key={move.label}
                  onClick={() => updateVideo('move', move.value)}
                  className={`py-1.5 text-[10px] font-medium border rounded transition-all ${
                    state.video.move === move.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {move.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 dark:text-indigo-400">
              <Clock className="w-3 h-3" /> Duration / Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_PRESETS.map(dur => (
                <button
                  key={dur.label}
                  onClick={() => updateVideo('dur', dur.value)}
                  className={`py-1.5 text-[10px] font-medium border rounded transition-all ${
                    state.video.dur === dur.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subject */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 dark:text-slate-200">
            <User className="w-4 h-4 text-indigo-500" /> Subject
          </h3>
          <div className="flex items-center gap-1">
            <select 
              onChange={e => onLoadCharacter(e.target.value)}
              className="text-[10px] border-none bg-slate-50 hover:bg-slate-100 rounded text-slate-600 py-1 pl-2 pr-6 cursor-pointer dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="">Load Saved...</option>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={onSaveCharacter} className="p-1.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={onManageCharacters} className="p-1.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <textarea 
          value={state.subject}
          onChange={e => setState(p => ({ ...p, subject: e.target.value }))}
          rows={3}
          className="w-full rounded-md border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          placeholder="A cyberpunk samurai standing in neon rain..."
        />
      </section>

      {/* Scene */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Scene & Intent</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Detail Level</label>
            <select 
              value={state.detailLevel}
              onChange={e => setState(p => ({ ...p, detailLevel: e.target.value as any }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-2 px-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="compact">Compact</option>
              <option value="detailed">Detailed</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Composition</label>
            <select 
              value={state.scene.composition}
              onChange={e => updateScene('composition', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-2 px-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              {COMPOSITIONS.map(c => <option key={c.label} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Setting / Location</label>
          <input 
            type="text"
            value={state.scene.setting}
            onChange={e => updateScene('setting', e.target.value)}
            className="w-full rounded-md border-slate-200 bg-slate-50 p-2.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            placeholder="e.g., rain-soaked neon alley"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Action</label>
          <input 
            type="text"
            value={state.scene.action}
            onChange={e => updateScene('action', e.target.value)}
            className="w-full rounded-md border-slate-200 bg-slate-50 p-2.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            placeholder="e.g., draws a katana slow breath visible"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Mood</label>
            <select 
              value={state.scene.mood}
              onChange={e => updateScene('mood', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-2 px-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="">Unspecified</option>
              <option value="calm, contemplative mood">Calm</option>
              <option value="ominous, tense mood">Ominous</option>
              <option value="dreamy, ethereal mood">Dreamy</option>
              <option value="energetic, high-adrenaline mood">Energetic</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Palette</label>
            <select 
              value={state.scene.color}
              onChange={e => updateScene('color', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-2 px-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="">Unspecified</option>
              <option value="teal and orange cinematic grading">Teal & Orange</option>
              <option value="neon cyberpunk palette">Neon</option>
              <option value="high-contrast monochrome">Monochrome</option>
            </select>
          </div>
        </div>
      </section>

      {/* Negative */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Ban className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Negative Prompt</h3>
        </div>
        <textarea 
          value={state.negative}
          onChange={e => setState(p => ({ ...p, negative: e.target.value }))}
          rows={2}
          className="w-full rounded-md border-slate-200 bg-slate-50 text-xs p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          placeholder="watermark, blurry, deformed, bad anatomy..."
        />
      </section>

      {/* Ingredients */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Visual Ingredients</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Camera & Lens</label>
            <div className="grid grid-cols-2 gap-2">
              {CAMERAS.map(c => (
                <button
                  key={c.id}
                  onClick={() => updateStyle('cam', state.style.cam === c.value ? '' : c.value)}
                  className={`px-2 py-2 border rounded text-[10px] font-medium transition-all ${state.style.cam === c.value ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Lighting</label>
            <div className="grid grid-cols-2 gap-2">
              {LIGHTING.map(l => (
                <button
                  key={l.id}
                  onClick={() => {
                    const active = state.style.light.includes(l.value);
                    updateStyle('light', active ? state.style.light.filter(v => v !== l.value) : [...state.style.light, l.value]);
                  }}
                  className={`px-2 py-2 border rounded text-[10px] font-medium transition-all ${state.style.light.includes(l.value) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Film Stock</label>
            <div className="grid grid-cols-2 gap-2">
              {FILMS.map(f => (
                <button
                  key={f.id}
                  onClick={() => updateStyle('film', state.style.film === f.value ? '' : f.value)}
                  className={`px-2 py-2 border rounded text-[10px] font-medium transition-all ${state.style.film === f.value ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Custom Ingredients</label>
          <div className="flex gap-2">
            <input 
              id="customIn"
              type="text" 
              className="flex-1 text-xs rounded-md border border-slate-200 bg-slate-50 p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" 
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
              className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {state.customIngredients.map((txt, idx) => (
              <span key={idx} className="flex items-center gap-1 text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-full dark:bg-indigo-900/20 dark:border-indigo-800">
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
