import React, { useState } from 'react';
import { ProjectData, StoryStyle, Scene } from '../types';
import { generateStoryboard, SceneProgressCallback, regenerateSingleScene } from '../services/geminiService';
import { 
  ArrowRightIcon, 
  FilmIcon, 
  BoltIcon, 
  Bars3Icon, 
  SwatchIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ProgressState {
  phase: string;
  message: string;
  chunkIndex?: number;
  totalChunks?: number;
  scenesGenerated?: number;
}

interface EditingScene {
  id: string;
  narrativeText: string;
  visualPrompt: string;
  durationSeconds: number;
}

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const StoryboardSection: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  
  // Scene editing states
  const [editingScene, setEditingScene] = useState<EditingScene | null>(null);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);
  
  // Content validation
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Validate content before generation
  const validateContent = (): boolean => {
    const warnings: string[] = [];
    const content = projectData.content;
    
    if (!content || content.trim().length < 100) {
      warnings.push('Content is too short. Add more narrative detail for better scene generation.');
    }
    
    if (content.length > 50000) {
      warnings.push('Content is very long. Consider splitting into multiple projects for best results.');
    }
    
    // Check for structure markers
    const hasBlocks = /block\s*\d+/i.test(content);
    const hasParts = /part\s*\d+/i.test(content);
    const hasChapters = /chapter\s*\d+/i.test(content);
    
    if (!hasBlocks && !hasParts && !hasChapters) {
      warnings.push('No clear structure detected (Parts/Blocks/Chapters). Consider organizing your narrative for better scene mapping.');
    }
    
    if (projectData.characters.length === 0) {
      warnings.push('No characters defined. Scenes may lack character references.');
    }
    
    if (!projectData.setting.landscape) {
      warnings.push('No setting defined. Visual prompts may be less specific.');
    }
    
    setValidationWarnings(warnings);
    return warnings.filter(w => w.includes('too short')).length === 0; // Only block on critical issues
  };

  const handleGenerateStoryboard = async () => {
    // Run validation first
    if (!validateContent()) {
      setError('Please fix the validation issues before generating.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress({ phase: 'starting', message: 'Initializing sequence generation...' });
    
    try {
      const onProgress: SceneProgressCallback = (update) => {
        setProgress({
          phase: update.phase,
          message: update.message,
          chunkIndex: update.chunkIndex,
          totalChunks: update.totalChunks,
          scenesGenerated: update.scenesGenerated
        });
      };

      // Clear existing storyboard before generating
      updateProject({ storyboard: [] });
      
      const scenes = await generateStoryboard(
        projectData.content,
        projectData.contextNote,
        projectData.characters,
        projectData.style,
        projectData.setting,
        projectData.category,
        onProgress
      );
      
      if (scenes.length === 0) {
        setError('No scenes were generated. Please check your content and try again.');
        return;
      }
      updateProject({ storyboard: scenes });
      setValidationWarnings([]); // Clear warnings on success
    } catch (e: any) {
      console.error('Storyboard generation error:', e);
      const errorMsg = e.message || 'Failed to generate sequences. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SCENE EDITING FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════
  
  const handleStartEdit = (scene: Scene) => {
    setEditingScene({
      id: scene.id,
      narrativeText: scene.narrativeText,
      visualPrompt: scene.visualPrompt,
      durationSeconds: scene.durationSeconds
    });
  };

  const handleSaveEdit = () => {
    if (!editingScene) return;
    
    const updatedStoryboard = projectData.storyboard.map(scene =>
      scene.id === editingScene.id
        ? {
            ...scene,
            narrativeText: editingScene.narrativeText,
            visualPrompt: editingScene.visualPrompt,
            durationSeconds: editingScene.durationSeconds
          }
        : scene
    );
    
    updateProject({ storyboard: updatedStoryboard });
    setEditingScene(null);
  };

  const handleCancelEdit = () => {
    setEditingScene(null);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!confirm('Delete this scene? This cannot be undone.')) return;
    
    const updatedStoryboard = projectData.storyboard
      .filter(scene => scene.id !== sceneId)
      .map((scene, index) => ({ ...scene, number: index + 1 })); // Renumber
    
    updateProject({ storyboard: updatedStoryboard });
  };

  const handleDuplicateScene = (sceneId: string) => {
    const sceneIndex = projectData.storyboard.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    
    const originalScene = projectData.storyboard[sceneIndex];
    const duplicatedScene: Scene = {
      ...originalScene,
      id: crypto.randomUUID(),
      status: 'pending',
      videoUrl: undefined
    };
    
    const updatedStoryboard = [
      ...projectData.storyboard.slice(0, sceneIndex + 1),
      duplicatedScene,
      ...projectData.storyboard.slice(sceneIndex + 1)
    ].map((scene, index) => ({ ...scene, number: index + 1 }));
    
    updateProject({ storyboard: updatedStoryboard });
  };

  const handleAddScene = (afterIndex: number) => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      number: afterIndex + 2,
      durationSeconds: 10,
      narrativeText: 'New scene narrative...',
      visualPrompt: `${projectData.style}. [Describe the visual here]`,
      status: 'pending',
      characterIds: []
    };
    
    const updatedStoryboard = [
      ...projectData.storyboard.slice(0, afterIndex + 1),
      newScene,
      ...projectData.storyboard.slice(afterIndex + 1)
    ].map((scene, index) => ({ ...scene, number: index + 1 }));
    
    updateProject({ storyboard: updatedStoryboard });
    
    // Immediately start editing the new scene
    setEditingScene({
      id: newScene.id,
      narrativeText: newScene.narrativeText,
      visualPrompt: newScene.visualPrompt,
      durationSeconds: newScene.durationSeconds
    });
  };

  const handleRegenerateScene = async (scene: Scene) => {
    setRegeneratingSceneId(scene.id);
    
    try {
      const regeneratedData = await regenerateSingleScene(
        scene,
        projectData.content,
        projectData.characters,
        projectData.style,
        projectData.setting,
        projectData.contextNote
      );
      
      const updatedStoryboard = projectData.storyboard.map(s =>
        s.id === scene.id
          ? { ...s, ...regeneratedData, status: 'pending' as const, videoUrl: undefined }
          : s
      );
      
      updateProject({ storyboard: updatedStoryboard });
    } catch (e: any) {
      console.error('Scene regeneration failed:', e);
      alert(`Failed to regenerate scene: ${e.message}`);
    } finally {
      setRegeneratingSceneId(null);
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

      {/* Progress Indicator */}
      {loading && progress && (
        <div className="bg-gradient-to-r from-primary-900/30 to-zinc-900/50 border border-primary-700/50 rounded-xl p-5 animate-pulse-slow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full"/>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-300">
                  {progress.phase === 'analyzing' && '🔍 Phase 1A: Parsing Narrative Structure'}
                  {progress.phase === 'outlining' && '📋 Phase 1B: Creating Story Outline'}
                  {progress.phase === 'chunking' && '📦 Preparing Segments'}
                  {progress.phase === 'generating' && '🎬 Phase 2: Generating Scenes'}
                  {progress.phase === 'complete' && '✅ Complete'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{progress.message}</p>
              </div>
            </div>
            {progress.totalChunks && progress.chunkIndex && (
              <div className="text-right">
                <span className="text-lg font-bold text-primary-400">
                  {progress.chunkIndex}/{progress.totalChunks}
                </span>
                <p className="text-xs text-zinc-500">scenes</p>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {progress.totalChunks && progress.chunkIndex && (
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-600 to-primary-400 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(progress.chunkIndex / progress.totalChunks) * 100}%` }}
              />
            </div>
          )}
          
          {/* Phase indicator for outlining */}
          {progress.phase === 'outlining' && (
            <div className="mt-3 flex items-center space-x-2 text-xs text-amber-400">
              <span>📖</span>
              <span>Mapping your Parts & Blocks to maintain story sequence...</span>
            </div>
          )}
          
          {progress.scenesGenerated !== undefined && progress.scenesGenerated > 0 && (
            <p className="text-xs text-emerald-400 mt-2">
              ✓ {progress.scenesGenerated} scene{progress.scenesGenerated > 1 ? 's' : ''} generated in sequence
            </p>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600/30 flex items-center justify-center mt-0.5">
            <span className="text-red-300 text-sm font-bold">!</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-300">Generation Issue</h3>
            <p className="text-xs text-red-200 mt-1">{error}</p>
            <p className="text-xs text-red-300/70 mt-2">💡 Try: reducing narrative length, simplifying context notes, or using shorter scene descriptions.</p>
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && !loading && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">Pre-Generation Checks</h3>
          </div>
          <ul className="space-y-1">
            {validationWarnings.map((warning, i) => (
              <li key={i} className="text-xs text-amber-200/80 flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
          {/* Scene count summary */}
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-zinc-500">
              {projectData.storyboard.length} scenes • 
              Total duration: {projectData.storyboard.reduce((sum, s) => sum + s.durationSeconds, 0)}s
            </p>
            <button
              onClick={() => handleAddScene(projectData.storyboard.length - 1)}
              className="flex items-center space-x-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Scene</span>
            </button>
          </div>

           {projectData.storyboard.map((scene, index) => (
             <div key={scene.id}>
               {/* Scene Card */}
               <div 
                  draggable={editingScene?.id !== scene.id}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`bg-zinc-900 p-6 rounded-lg border transition-all duration-200 ${
                    draggedIndex === index ? 'opacity-40 border-dashed border-zinc-600' : 
                    editingScene?.id === scene.id ? 'border-primary-500 ring-1 ring-primary-500' :
                    regeneratingSceneId === scene.id ? 'border-amber-500/50 animate-pulse' :
                    'border-zinc-800 hover:border-zinc-700'
                  }`}
               >
                  <div className="flex gap-6">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center -ml-2 cursor-move text-zinc-700 hover:text-zinc-500 transition-colors px-2">
                       <Bars3Icon className="w-6 h-6" />
                    </div>

                    {/* Scene Number */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-start pt-1 w-12">
                      <span className="text-xl font-bold text-zinc-700">#{scene.number}</span>
                      {editingScene?.id === scene.id ? (
                        <input
                          type="number"
                          min={5}
                          max={20}
                          value={editingScene.durationSeconds}
                          onChange={(e) => setEditingScene({...editingScene, durationSeconds: parseInt(e.target.value) || 10})}
                          className="w-12 text-center text-[10px] bg-zinc-800 border border-zinc-700 rounded mt-1 py-0.5 text-zinc-300"
                        />
                      ) : (
                        <span className="text-[10px] text-zinc-600 mt-1 font-mono">{scene.durationSeconds}s</span>
                      )}
                    </div>
                    
                    {/* Scene Content */}
                    <div className="flex-1 space-y-4 cursor-default">
                      {editingScene?.id === scene.id ? (
                        <>
                          {/* Editing Mode */}
                          <div>
                            <label className="text-[10px] uppercase text-primary-400 font-bold mb-1 block">Narrative (Voiceover)</label>
                            <textarea
                              value={editingScene.narrativeText}
                              onChange={(e) => setEditingScene({...editingScene, narrativeText: e.target.value})}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-200 text-sm leading-relaxed resize-none focus:border-primary-500 outline-none"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-primary-400 font-bold mb-1 block">Visual Prompt (for Veo)</label>
                            <textarea
                              value={editingScene.visualPrompt}
                              onChange={(e) => setEditingScene({...editingScene, visualPrompt: e.target.value})}
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 text-xs font-mono leading-relaxed resize-none focus:border-primary-500 outline-none"
                              rows={3}
                            />
                          </div>
                          <div className="flex items-center space-x-2 pt-2">
                            <button
                              onClick={handleSaveEdit}
                              className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded text-xs font-medium"
                            >
                              <CheckIcon className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center space-x-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1.5 rounded text-xs font-medium"
                            >
                              <XMarkIcon className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* View Mode */}
                          <div>
                            <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Narrative</label>
                            <p className="text-zinc-200 text-base leading-relaxed">"{scene.narrativeText}"</p>
                          </div>
                          <div className="bg-zinc-950/50 p-4 rounded border border-zinc-800/50">
                            <label className="text-[10px] uppercase text-primary-500 font-bold mb-2 block">Veo Prompt</label>
                            <p className="text-xs text-zinc-400 font-mono leading-relaxed">{scene.visualPrompt}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex gap-2">
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
                            
                            {/* Scene Actions */}
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleStartEdit(scene)}
                                className="p-1.5 text-zinc-500 hover:text-primary-400 hover:bg-zinc-800 rounded transition-colors"
                                title="Edit scene"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRegenerateScene(scene)}
                                disabled={regeneratingSceneId === scene.id}
                                className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                                title="Regenerate scene"
                              >
                                <ArrowPathIcon className={`w-4 h-4 ${regeneratingSceneId === scene.id ? 'animate-spin' : ''}`} />
                              </button>
                              <button
                                onClick={() => handleDuplicateScene(scene.id)}
                                className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors"
                                title="Duplicate scene"
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteScene(scene.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                                title="Delete scene"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
               </div>

               {/* Add Scene Button between scenes */}
               {index < projectData.storyboard.length - 1 && (
                 <div className="flex justify-center py-1">
                   <button
                     onClick={() => handleAddScene(index)}
                     className="flex items-center space-x-1 text-[10px] text-zinc-600 hover:text-primary-400 transition-colors opacity-0 hover:opacity-100 focus:opacity-100"
                   >
                     <PlusIcon className="w-3 h-3" />
                     <span>Insert scene</span>
                   </button>
                 </div>
               )}
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