import React, { useState } from 'react';
import { ProjectData, StoryStyle } from '../types';
import { generateStoryboard } from '../services/geminiService';
import { 
  ArrowRightIcon, 
  FilmIcon, 
  BoltIcon, 
  Bars3Icon, 
  SwatchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const StoryboardSection: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);

  const handleGenerateStoryboard = async () => {
    setLoading(true);
    try {
      const scenes = await generateStoryboard(
        projectData.content,
        projectData.contextNote,
        projectData.characters,
        projectData.style,
        projectData.setting,
        projectData.category
      );
      updateProject({ storyboard: scenes });
    } catch (e) {
      console.error(e);
      alert("Failed to generate storyboard. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newStoryboard = [...projectData.storyboard];
    const [movedScene] = newStoryboard.splice(draggedIndex, 1);
    newStoryboard.splice(targetIndex, 0, movedScene);

    const renumberedStoryboard = newStoryboard.map((scene, index) => ({
      ...scene,
      number: index + 1
    }));

    updateProject({ storyboard: renumberedStoryboard });
    setDraggedIndex(null);
  };

  const handleProceed = () => {
    const scenes = projectData.storyboard;
    if (scenes.length === 0) {
      alert("Please generate a storyboard before proceeding.");
      return;
    }

    const seen = new Set<number>();
    const duplicates = new Set<number>();
    
    scenes.forEach(scene => {
      if (seen.has(scene.number)) duplicates.add(scene.number);
      seen.add(scene.number);
    });

    if (duplicates.size > 0) {
      const shouldFix = confirm(`Duplicate scene numbers detected. Auto-renumber?`);
      if (shouldFix) {
        const renumberedStoryboard = scenes.map((scene, index) => ({
          ...scene,
          number: index + 1
        }));
        updateProject({ storyboard: renumberedStoryboard });
        onNext();
      }
    } else {
      onNext();
    }
  };

  const styleLabels: Record<StoryStyle, { label: string, desc: string, color: string }> = {
    [StoryStyle.CINEMATIC_DRAMA]: { label: 'Cinematic Drama', desc: 'Arri Alexa, 8k Photorealism', color: 'text-indigo-400' },
    [StoryStyle.DOCUMENTARY]: { label: 'Documentary', desc: 'Handheld, 16mm Film Grain', color: 'text-zinc-400' },
    [StoryStyle.ANIMATED_STYLIZED]: { label: 'Animated Stylized', desc: 'Pixar Quality, Soft Lighting', color: 'text-purple-400' },
    [StoryStyle.RETRO_FUTURISM]: { label: 'Retro Futurism', desc: 'Synthwave, Neon Glow', color: 'text-pink-400' },
    [StoryStyle.GRITTY_REALISM]: { label: 'Gritty Realism', desc: 'Raw, Handheld, Desaturated', color: 'text-orange-400' },
    [StoryStyle.FAIRYTALE]: { label: 'Fairytale', desc: 'Ethereal, Soft Focus', color: 'text-blue-300' },
    [StoryStyle.LOW_POLY_3D]: { label: 'Low Poly 3D', desc: 'Minimalist, PS1 Aesthetic', color: 'text-emerald-400' },
    [StoryStyle.VINTAGE_KODACHROME]: { label: 'Vintage Kodachrome', desc: '1960s Saturated Film', color: 'text-red-400' },
    [StoryStyle.SURREAL_DREAMSCAPE]: { label: 'Surreal Dreamscape', desc: 'Magic Realism, High Art', color: 'text-violet-400' },
    [StoryStyle.PENCIL_SKETCH]: { label: 'Pencil Sketch', desc: 'Charcoal, Artistic Strokes', color: 'text-zinc-500' },
    [StoryStyle.NEO_NOIR]: { label: 'Neo Noir', desc: 'High Contrast, Dark & Moody', color: 'text-sky-500' },
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-end border-b border-neutral-200 dark:border-zinc-800 pb-6">
        <div>
           <span className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1 block">Step 03</span>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Sequence Board</h2>
          <p className="text-neutral-600 dark:text-zinc-400 mt-2 text-sm">Split narrative into generative chunks. Review visual prompts before production.</p>
        </div>
        
        <div className="flex items-center space-x-3">
           <button 
             onClick={() => setShowStylePanel(!showStylePanel)}
             className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
               showStylePanel ? 'bg-primary-600/10 border-primary-500 text-primary-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
             }`}
           >
             <SwatchIcon className="w-4 h-4" />
             <span>Aesthetic: {styleLabels[projectData.style]?.label}</span>
           </button>

           <button 
            onClick={handleGenerateStoryboard}
            disabled={loading}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-50 text-sm shadow-lg shadow-primary-900/20"
          >
            {loading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/> : <BoltIcon className="w-4 h-4"/>}
            <span>Generate Sequences</span>
          </button>
        </div>
      </div>

      {/* Style Selection Grid */}
      {showStylePanel && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 animate-slide-down">
          {Object.entries(styleLabels).map(([style, info]) => (
            <button
              key={style}
              onClick={() => {
                updateProject({ style: style as StoryStyle });
                setShowStylePanel(false);
              }}
              className={`flex flex-col text-left p-4 rounded-lg border transition-all ${
                projectData.style === style 
                  ? 'bg-zinc-800 border-primary-500 ring-1 ring-primary-500 shadow-xl' 
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                 <span className={`text-xs font-bold uppercase tracking-tight ${info.color}`}>{info.label}</span>
                 {projectData.style === style && <CheckCircleIcon className="w-4 h-4 text-primary-500" />}
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">{info.desc}</p>
            </button>
          ))}
        </div>
      )}

      {projectData.storyboard.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
          <FilmIcon className="w-12 h-12 text-zinc-800 mb-4" />
          <p className="text-zinc-500 text-sm">Select an aesthetic and generate to populate the board.</p>
        </div>
      ) : (
        <div className="space-y-4">
           {projectData.storyboard.map((scene, index) => (
             <div 
                key={scene.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex gap-6 transition-all duration-200 ${
                  draggedIndex === index ? 'opacity-40 border-dashed border-zinc-600' : 'hover:border-zinc-700'
                }`}
             >
                <div className="flex-shrink-0 flex flex-col items-center justify-center -ml-2 cursor-move text-zinc-700 hover:text-zinc-500 transition-colors px-2">
                   <Bars3Icon className="w-6 h-6" />
                </div>

                <div className="flex-shrink-0 flex flex-col items-center justify-start pt-1 w-12">
                  <span className="text-xl font-bold text-zinc-700">#{scene.number}</span>
                  <span className="text-[10px] text-zinc-600 mt-1 font-mono">{scene.durationSeconds}s</span>
                </div>
                
                <div className="flex-1 space-y-4 cursor-default">
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Narrative</label>
                    <p className="text-zinc-200 text-base leading-relaxed">"{scene.narrativeText}"</p>
                  </div>
                  <div className="bg-zinc-950/50 p-4 rounded border border-zinc-800/50">
                    <label className="text-[10px] uppercase text-primary-500 font-bold mb-2 block">Veo Prompt</label>
                    <p className="text-xs text-zinc-400 font-mono leading-relaxed">{scene.visualPrompt}</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                     {scene.characterIds.map(charId => {
                       const char = projectData.characters.find(c => c.id === charId);
                       return char ? (
                         <div key={charId} className="flex items-center space-x-2 bg-zinc-800 px-2 py-1 rounded-full border border-zinc-700">
                           {char.referenceImageUrl && <img src={char.referenceImageUrl} alt="" className="w-4 h-4 rounded-full object-cover"/>}
                           <span className="text-[10px] text-zinc-300 font-medium">{char.name}</span>
                         </div>
                       ) : null;
                     })}
                  </div>
                </div>
             </div>
           ))}

           <div className="flex justify-end pt-8">
              <button 
                onClick={handleProceed}
                className="flex items-center space-x-2 bg-zinc-100 hover:bg-white text-zinc-900 px-8 py-2.5 rounded-lg font-bold shadow-lg text-sm transition-transform active:scale-95"
              >
                <span>Enter Production</span> <ArrowRightIcon className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardSection;