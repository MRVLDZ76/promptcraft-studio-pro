
import React from 'react';
import { Mode, PromptState, Character, QAIssue, SequenceSegment } from './types';
import { Workbench } from './components/Workbench';
import { OutputEngine } from './components/OutputEngine';
import { ImageEditor } from './components/ImageEditor';
import { VideoStudio } from './components/VideoStudio';
import { AudioStudio } from './components/AudioStudio';
import { TranscriptionStudio } from './components/TranscriptionStudio';
import { AnalysisStudio } from './components/AnalysisStudio';
import { polishPrompt, generateSequence } from './services/geminiService';
import { LayoutGrid, Video, Film, Wand2, Volume2, Moon, Sun, Download, Trash2, X, Move, Palette, Plus, ChevronDown, Mic, Brain, Key } from 'lucide-react';

const DEFAULT_STATE: PromptState = {
  subject: '',
  negative: '',
  aspect: '1:1',
  model: 'generic',
  imageSize: '1K',
  style: { cam: '', light: [], film: '' },
  scene: { setting: '', action: '', composition: '', mood: '', color: '' },
  detailLevel: 'detailed',
  customIngredients: [],
  video: { move: '', dur: '', resolution: '720p' }
};

const App: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>(Mode.IMAGE);
  const [state, setState] = React.useState<PromptState>(DEFAULT_STATE);
  const [characters, setCharacters] = React.useState<Character[]>([]);
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);
  const [sequence, setSequence] = React.useState<SequenceSegment[]>([]);
  const [showCharModal, setShowCharModal] = React.useState(false);
  const [hasApiKey, setHasApiKey] = React.useState<boolean | null>(null);

  // Per guidelines: Check whether an API key has been selected before accessing Veo/Pro models.
  React.useEffect(() => {
    const saved = localStorage.getItem('prompt_studio_v4');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.video) parsed.video = DEFAULT_STATE.video;
      if (!parsed.imageSize) parsed.imageSize = DEFAULT_STATE.imageSize;
      setState(parsed);
    }
    const savedChars = localStorage.getItem('ps_chars_v4');
    if (savedChars) setCharacters(JSON.parse(savedChars));
    
    // Load theme preference from localStorage or system preference
    const savedTheme = localStorage.getItem('theme_preference');
    if (savedTheme === 'dark') {
      setIsDark(true);
    } else if (savedTheme === 'light') {
      setIsDark(false);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }

    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  React.useEffect(() => {
    localStorage.setItem('prompt_studio_v4', JSON.stringify(state));
  }, [state]);

  React.useEffect(() => {
    localStorage.setItem('ps_chars_v4', JSON.stringify(characters));
  }, [characters]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume the key selection was successful after triggering per race condition rules.
      setHasApiKey(true);
    }
  };

  const buildFinalPrompt = React.useCallback(() => {
    const s = state;
    const parts: string[] = [];
    
    const subject = s.subject.trim() || '[Subject]';
    const setting = s.scene.setting.trim();
    const action = s.scene.action.trim();
    
    let base = subject;
    if (setting) base += ` in ${setting}`;
    if (action) base += `, ${action}`;
    parts.push(base);

    if (s.scene.composition) parts.push(s.scene.composition);
    if (s.scene.mood) parts.push(s.scene.mood);
    if (s.scene.color) parts.push(s.scene.color);
    
    if (s.style.cam) parts.push(s.style.cam);
    s.style.light.forEach(l => parts.push(l));
    if (s.style.film) parts.push(s.style.film);
    s.customIngredients.forEach(i => parts.push(i));

    if (mode === Mode.VIDEO) {
      if (s.video.move) parts.push(`Camera movement: ${s.video.move}`);
      if (s.video.dur) parts.push(`Timing: ${s.video.dur}`);
    }

    let final = parts.join(', ');
    
    if (s.aspect) {
      if (s.model === 'midjourney') final += ` --ar ${s.aspect}`;
      else final += `, aspect ratio ${s.aspect}`;
    }

    if (s.negative.trim()) {
      if (s.model === 'midjourney') final += ` --no ${s.negative}`;
      else final += `. Exclude: ${s.negative}`;
    }

    return final;
  }, [state, mode]);

  const currentPrompt = buildFinalPrompt();

  React.useEffect(() => {
    if (historyIndex === -1 || history[historyIndex] !== currentPrompt) {
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(currentPrompt);
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    }
  }, [currentPrompt]);

  const handlePolish = async () => {
    setLoading(true);
    try {
      const polished = await polishPrompt(state, currentPrompt);
      setState(p => ({ ...p, subject: polished }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSequence = async (narrative: string, total: number, clip: number, style: string, motion: string) => {
    setLoading(true);
    try {
      const segs = await generateSequence(narrative, total, clip, style, motion);
      setSequence(segs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSequenceSegment = (index: number, key: keyof SequenceSegment, value: string | number) => {
    const newSeq = [...sequence];
    newSeq[index] = { ...newSeq[index], [key]: value };
    setSequence(newSeq);
  };

  const addManualSegment = () => {
    const newId = sequence.length > 0 ? Math.max(...sequence.map(s => s.id)) + 1 : 1;
    setSequence([...sequence, {
      id: newId,
      seconds: 5,
      action: 'New action scene',
      cameraMovement: 'Static',
      visualStyle: 'Standard cinematic',
      prompt: 'Cinematic shot of...'
    }]);
  };

  const deleteSegment = (index: number) => {
    setSequence(sequence.filter((_, i) => i !== index));
  };

  const lintPrompt = (): QAIssue[] => {
    const issues: QAIssue[] = [];
    if (!state.subject.trim()) {
      issues.push({ severity: 'warn', title: 'Empty Subject', detail: 'Prompt lacks a core subject. This often leads to unstable results.', fixId: 'focus' });
    }
    if (mode === Mode.VIDEO && !state.scene.action && !state.video.move) {
      issues.push({ severity: 'warn', title: 'Static Video', detail: 'No motion keywords detected. Video clips may look like still images.', fixId: 'motion' });
    }
    if (state.customIngredients.length === 0 && !state.style.cam && state.style.light.length === 0) {
      issues.push({ severity: 'info', title: 'Generic Style', detail: 'Adding visual ingredients like camera lenses or lighting can improve consistency.', fixId: 'ingredients' });
    }
    return issues;
  };

  const handleApplyFixes = () => {
    const issues = lintPrompt();
    issues.forEach(it => {
      if (it.fixId === 'motion') setState(p => ({ ...p, video: { ...p.video, move: 'Slow Push In' } }));
    });
  };

  const saveCharacter = () => {
    if (!state.subject.trim()) return;
    const name = prompt('Name this subject:', state.subject.slice(0, 20) + '...');
    if (name) {
      setCharacters(prev => [...prev, { id: Date.now().toString(), name, text: state.subject }]);
    }
  };

  const loadCharacter = (id: string) => {
    const found = characters.find(c => c.id === id);
    if (found) setState(p => ({ ...p, subject: found.text }));
  };

  // If high-quality models are available but no key selected, show blocking selection UI.
  if (hasApiKey === false) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Key className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Paid API Key Required</h2>
          <p className="text-slate-400 text-sm">
            Veo video generation and high-quality image tools require a selected API key from a paid GCP project.
          </p>
          <div className="bg-slate-800 p-4 rounded-xl text-left text-xs text-slate-400 space-y-2">
            <p>1. Ensure your billing is active at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
            <p>2. Select the appropriate project in the key selector.</p>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-5 h-5" /> Select API Key
          </button>
        </div>
      </div>
    );
  }

  const workbenchIgnoredModes = [Mode.EDIT, Mode.AUDIO, Mode.TRANSCRIPTION, Mode.ANALYSIS];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm shrink-0 z-20 dark:bg-slate-900 dark:border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-md">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Prompt<span className="text-indigo-600">Studio</span> Pro
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <button className="text-xs bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <Download className="w-3.5 h-3.5 inline mr-1" /> Project
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">
        {!workbenchIgnoredModes.includes(mode) && (
          <Workbench state={state} setState={setState} characters={characters} onSaveCharacter={saveCharacter} onManageCharacters={() => setShowCharModal(true)} onLoadCharacter={loadCharacter} mode={mode} />
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="bg-white border-b border-slate-200 px-6 pt-2 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <div className="flex space-x-6 min-w-max">
              {[
                { id: Mode.IMAGE, label: 'Prompt', icon: LayoutGrid },
                { id: Mode.VIDEO, label: 'Veo Video', icon: Video },
                { id: Mode.SEQUENCE, label: 'Storyboard', icon: Film },
                { id: Mode.ANALYSIS, label: 'Logic Analysis', icon: Brain },
                { id: Mode.EDIT, label: 'Nano Editor', icon: Wand2 },
                { id: Mode.AUDIO, label: 'AI Speech', icon: Volume2 },
                { id: Mode.TRANSCRIPTION, label: 'Transcribe', icon: Mic },
              ].map(t => (
                <button key={t.id} onClick={() => setMode(t.id)} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${mode === t.id ? 'text-indigo-600 border-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {mode === Mode.EDIT && <ImageEditor />}
            {mode === Mode.AUDIO && <AudioStudio />}
            {mode === Mode.TRANSCRIPTION && <TranscriptionStudio />}
            {mode === Mode.ANALYSIS && <AnalysisStudio />}
            {mode === Mode.VIDEO && <VideoStudio initialPrompt={currentPrompt} initialAspect={state.aspect} />}
            {mode === Mode.SEQUENCE && (
              <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Narrative Arc</label>
                      <textarea id="narrative" className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" placeholder="Describe the overall story flow..." rows={3} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Visual Style Preference</label>
                        <input id="seqStyle" type="text" className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" placeholder="e.g., Cyberpunk, Noir, Soft Glow" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motion Preference</label>
                        <input id="seqMotion" type="text" className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" placeholder="e.g., Slow pans, high energy tracking" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Sec</label>
                        <input id="total" type="number" defaultValue={24} className="w-full text-sm rounded-lg border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Clip Len</label>
                        <input id="clip" type="number" defaultValue={6} className="w-full text-sm rounded-lg border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const narr = (document.getElementById('narrative') as HTMLTextAreaElement).value;
                        const tot = parseInt((document.getElementById('total') as HTMLInputElement).value);
                        const clp = parseInt((document.getElementById('clip') as HTMLInputElement).value);
                        const style = (document.getElementById('seqStyle') as HTMLInputElement).value;
                        const motion = (document.getElementById('seqMotion') as HTMLInputElement).value;
                        handleGenerateSequence(narr, tot, clp, style, motion);
                      }}
                      disabled={loading}
                      className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                    >
                      <Film className="w-4 h-4" /> {loading ? 'Generating Storyboard...' : 'Generate Sequence Plan'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sequence.map((seg, i) => (
                    <div key={seg.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 group hover:border-indigo-300 transition-all dark:bg-slate-900 dark:border-slate-800 relative">
                      <button onClick={() => deleteSegment(i)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 dark:bg-indigo-900/40">
                          {i + 1}
                        </div>
                        <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start pr-8">
                           <input value={seg.action} onChange={(e) => updateSequenceSegment(i, 'action', e.target.value)} className="font-bold text-sm text-slate-800 dark:text-slate-200 bg-transparent border-none p-0 focus:ring-0 w-full" placeholder="Scene Action..." />
                           <div className="flex items-center gap-1">
                             <input type="number" value={seg.seconds} onChange={(e) => updateSequenceSegment(i, 'seconds', parseInt(e.target.value))} className="w-10 text-[10px] font-bold text-slate-400 bg-transparent border-none p-0 focus:ring-0 text-right" />
                             <span className="text-[10px] font-bold text-slate-400">s</span>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <Move className="w-3 h-3" /> Camera Motion
                            </label>
                            <input value={seg.cameraMovement} onChange={(e) => updateSequenceSegment(i, 'cameraMovement', e.target.value)} className="w-full bg-slate-50 text-[11px] p-2 rounded border border-slate-200 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" placeholder="e.g., Static, Pan Right..." />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <Palette className="w-3 h-3" /> Visual Style
                            </label>
                            <input value={seg.visualStyle} onChange={(e) => updateSequenceSegment(i, 'visualStyle', e.target.value)} className="w-full bg-slate-50 text-[11px] p-2 rounded border border-slate-200 focus:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" placeholder="e.g., Gritty, Warm Glow..." />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Clip Generation Prompt</label>
                          <textarea value={seg.prompt} onChange={(e) => updateSequenceSegment(i, 'prompt', e.target.value)} className="w-full bg-slate-50 text-xs font-mono p-3 rounded-lg border border-slate-200 focus:bg-white transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400" rows={3} placeholder="Full generative prompt..." />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {sequence.length > 0 && (
                    <button onClick={addManualSegment} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 dark:border-slate-800 dark:hover:bg-indigo-900/10">
                      <Plus className="w-5 h-5" />
                      <span className="text-sm font-medium">Add Clip to Storyboard</span>
                    </button>
                  )}

                  {sequence.length === 0 && !loading && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl dark:border-slate-800">
                      <Film className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm">Generate a storyboard to plan your multi-clip masterpiece.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {mode === Mode.IMAGE && (
              <OutputEngine prompt={currentPrompt} state={state} onPolish={handlePolish} loading={loading} issues={lintPrompt()} onApplyFixes={handleApplyFixes} onUndo={() => setHistoryIndex(Math.max(0, historyIndex - 1))} onRedo={() => setHistoryIndex(Math.min(history.length - 1, historyIndex + 1))} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} />
            )}
          </div>
        </main>
      </div>

      {showCharModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCharModal(false)} />
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl z-10 overflow-hidden dark:bg-slate-900">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
              <h3 className="font-bold">Subject Library</h3>
              <button onClick={() => setShowCharModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              {characters.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No subjects saved yet.</div>
              ) : (
                characters.map(c => (
                  <div key={c.id} className="p-3 border rounded-lg flex items-center justify-between dark:border-slate-800">
                    <div className="min-w-0 flex-1 mr-4">
                      <div className="font-bold text-sm dark:text-slate-200">{c.name}</div>
                      <div className="text-xs text-slate-400 truncate">{c.text}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { loadCharacter(c.id); setShowCharModal(false); }} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg dark:bg-indigo-900/30">Load</button>
                      <button onClick={() => setCharacters(prev => prev.filter(x => x.id !== c.id))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
