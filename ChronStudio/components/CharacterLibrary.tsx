import React, { useState, useEffect } from 'react';
import { ProjectData, Character, ProductionMode } from '../types';
import { generateCharacterReference, buildCharacterPrompt } from '../services/geminiService';
import { getLibrary, saveToLibrary, removeFromLibrary } from '../services/storageService';
import { 
  PhotoIcon, 
  ArrowRightIcon, 
  ClipboardDocumentIcon, 
  BookmarkIcon, 
  TrashIcon, 
  PlusCircleIcon,
  XMarkIcon,
  BookOpenIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const CharacterLibrary: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryChars, setLibraryChars] = useState<Character[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    refreshLibrary();
  }, []);

  const refreshLibrary = () => {
    const libs = getLibrary();
    setLibraryChars(libs);
    setSavedIds(new Set(libs.map(c => c.id)));
  };

  const handleGenerateImage = async (character: Character) => {
    setGeneratingId(character.id);
    try {
      const base64Image = await generateCharacterReference(
        character, 
        projectData.setting.landscape, 
        projectData.style,
        projectData.category
      );
      
      const updatedChars = projectData.characters.map(c => 
        c.id === character.id ? { ...c, referenceImageUrl: base64Image } : c
      );
      
      updateProject({ characters: updatedChars });
    } catch (e) {
      console.error(e);
      alert(`Failed to generate image for ${character.name}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const copyPrompt = (character: Character) => {
    const prompt = buildCharacterPrompt(character, projectData.setting.landscape, projectData.style);
    navigator.clipboard.writeText(prompt);
  };

  const handleToggleSave = (char: Character) => {
    if (savedIds.has(char.id)) {
      removeFromLibrary(char.id);
    } else {
      saveToLibrary(char);
    }
    refreshLibrary();
  };

  const handleUpdateLibraryFromProject = (char: Character) => {
    saveToLibrary(char);
    refreshLibrary();
    alert(`Library updated for ${char.name}`);
  };

  const handleRevertToLibrary = (char: Character) => {
    const libraryVersion = libraryChars.find(c => c.id === char.id);
    if (!libraryVersion) return;

    if (confirm(`Are you sure you want to revert ${char.name} to the library defaults? Project-specific changes will be lost.`)) {
      const updatedChars = projectData.characters.map(c => 
        c.id === char.id ? { ...libraryVersion } : c
      );
      updateProject({ characters: updatedChars });
    }
  };

  const handleImport = (char: Character) => {
    if (projectData.characters.some(c => c.id === char.id)) {
      alert("Character already in project.");
      return;
    }
    updateProject({ characters: [...projectData.characters, { ...char }] });
    setShowLibraryModal(false);
  };

  const handleDeleteFromProject = (id: string) => {
    if (confirm("Remove this character from the current project?")) {
      updateProject({ characters: projectData.characters.filter(c => c.id !== id) });
    }
  };

  const handleDeleteFromLibrary = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this character from the global library?")) {
      removeFromLibrary(id);
      refreshLibrary();
    }
  };

  const handleUpdateCharDetail = (id: string, field: keyof Character, value: string) => {
    const updatedChars = projectData.characters.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    updateProject({ characters: updatedChars });
  };

  const isExternal = projectData.mode === ProductionMode.EXTERNAL;

  const getLibraryMismatch = (char: Character) => {
    const libChar = libraryChars.find(c => c.id === char.id);
    if (!libChar) return null;
    
    return char.visualDescription !== libChar.visualDescription || 
           char.voiceDescription !== libChar.voiceDescription ||
           char.name !== libChar.name ||
           char.role !== libChar.role;
  };

  // Check how many characters have reference images
  const charsWithRefs = projectData.characters.filter(c => c.referenceImageUrl).length;
  const totalChars = projectData.characters.length;
  const allHaveRefs = charsWithRefs === totalChars && totalChars > 0;

  const handleProceed = () => {
    if (totalChars > 0 && charsWithRefs === 0) {
      if (!confirm('⚠️ No character reference images generated!\n\nGenerating casting assets is HIGHLY RECOMMENDED for visual consistency in the storyboard.\n\nProceed anyway?')) {
        return;
      }
    } else if (totalChars > 0 && charsWithRefs < totalChars) {
      if (!confirm(`⚠️ Only ${charsWithRefs}/${totalChars} characters have reference images.\n\nFor best visual consistency, generate images for all characters.\n\nProceed anyway?`)) {
        return;
      }
    }
    onNext();
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex justify-between items-end border-b border-neutral-200 dark:border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1 block">Step 02</span>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Casting & Assets</h2>
          <p className="text-neutral-600 dark:text-zinc-400 mt-2 text-sm">
            {isExternal ? 'Review and copy character prompts for external generation.' : 'Generate consistent character references.'}
          </p>
          {!isExternal && totalChars > 0 && (
            <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium border ${
              allHaveRefs 
                ? 'bg-emerald-900/20 border-emerald-700 text-emerald-400'
                : 'bg-amber-900/20 border-amber-700 text-amber-400'
            }`}>
              {allHaveRefs 
                ? `✓ All ${totalChars} characters have reference images - Ready for Storyboard`
                : `⚠ ${charsWithRefs}/${totalChars} characters have reference images - Generate images for visual consistency`
              }
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowLibraryModal(true)}
            className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-zinc-700"
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Open Library</span>
          </button>
          <button 
            onClick={handleProceed}
            className="flex items-center space-x-2 bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <span>Confirm Cast</span> <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectData.characters.map((char) => {
          const hasMismatch = getLibraryMismatch(char);
          const isEditing = editingId === char.id;

          return (
            <div key={char.id} className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 transition-all shadow-sm flex flex-col relative">
              
              {/* Toolbar Overlays */}
              <div className="absolute top-3 right-3 z-10 flex space-x-2">
                {hasMismatch && (
                  <button 
                    onClick={() => handleRevertToLibrary(char)}
                    className="p-2 bg-amber-600/20 hover:bg-amber-600/40 backdrop-blur-md rounded-full text-amber-500 transition-all border border-amber-500/20"
                    title="Revert to Library Defaults"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                )}
                {hasMismatch && (
                  <button 
                    onClick={() => handleUpdateLibraryFromProject(char)}
                    className="p-2 bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur-md rounded-full text-blue-500 transition-all border border-blue-500/20"
                    title="Update Global Library with Project Changes"
                  >
                    <CloudArrowUpIcon className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => handleToggleSave(char)}
                  className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
                  title={savedIds.has(char.id) ? "Remove from Library" : "Save to Library"}
                >
                  {savedIds.has(char.id) ? (
                    <BookmarkIconSolid className="w-4 h-4 text-primary-500" />
                  ) : (
                    <BookmarkIcon className="w-4 h-4" />
                  )}
                </button>
                <button 
                  onClick={() => handleDeleteFromProject(char.id)}
                  className="p-2 bg-red-900/20 hover:bg-red-900/40 backdrop-blur-md rounded-full text-red-500 transition-all border border-red-500/20"
                  title="Remove from Project"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Image Area / Prompt Area */}
              {isExternal ? (
                 <div className="relative aspect-square bg-zinc-950 p-6 flex flex-col justify-between overflow-hidden group">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Image Generation Prompt</label>
                      <div className="text-xs text-zinc-300 font-mono leading-relaxed h-32 overflow-y-auto pr-2 custom-scrollbar opacity-70 group-hover:opacity-100 transition-opacity">
                        {buildCharacterPrompt(char, projectData.setting.landscape, projectData.style)}
                      </div>
                    </div>
                    <button 
                      onClick={() => copyPrompt(char)}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4"/> <span>Copy Prompt</span>
                    </button>
                 </div>
              ) : (
                <div className="relative aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                  {char.referenceImageUrl ? (
                    <img 
                      src={char.referenceImageUrl} 
                      alt={char.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-700 border border-zinc-800">
                        <PhotoIcon className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wide">Pending Generation</p>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleGenerateImage(char)}
                      disabled={generatingId === char.id}
                      className="bg-white hover:bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg text-xs font-bold shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform"
                    >
                      {generatingId === char.id ? 'Processing...' : char.referenceImageUrl ? 'Regenerate Asset' : 'Generate Asset'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info Area */}
              <div className="p-5 border-t border-zinc-800 flex-1">
                <div className="flex justify-between items-start mb-3">
                  {isEditing ? (
                    <input 
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-lg font-bold text-zinc-100 w-full"
                      value={char.name}
                      onChange={(e) => handleUpdateCharDetail(char.id, 'name', e.target.value)}
                    />
                  ) : (
                    <h3 className="text-lg font-bold text-zinc-100">{char.name}</h3>
                  )}
                  <button 
                    onClick={() => setEditingId(isEditing ? null : char.id)}
                    className={`ml-2 p-1.5 rounded transition-colors ${isEditing ? 'text-primary-500 bg-primary-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Role / Archetype</label>
                    {isEditing ? (
                      <input 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                        value={char.role}
                        onChange={(e) => handleUpdateCharDetail(char.id, 'role', e.target.value)}
                      />
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 border border-zinc-700 uppercase">{char.role}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Visual Description</label>
                    {isEditing ? (
                      <textarea 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 h-20 resize-none"
                        value={char.visualDescription}
                        onChange={(e) => handleUpdateCharDetail(char.id, 'visualDescription', e.target.value)}
                      />
                    ) : (
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                        {char.visualDescription}
                      </p>
                    )}
                  </div>

                  {isEditing && (
                     <div>
                        <label className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Voice Description</label>
                        <input 
                           className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                           value={char.voiceDescription}
                           onChange={(e) => handleUpdateCharDetail(char.id, 'voiceDescription', e.target.value)}
                        />
                     </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">Global Character Library</h3>
              <button onClick={() => setShowLibraryModal(false)} className="text-zinc-500 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraryChars.length === 0 ? (
                <div className="col-span-full text-center py-12 text-zinc-500">
                  <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Your library is empty. Save characters to reuse them later.</p>
                </div>
              ) : (
                libraryChars.map(char => (
                  <div key={char.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
                     <div className="flex items-start gap-3">
                        {char.referenceImageUrl ? (
                          <img src={char.referenceImageUrl} className="w-12 h-12 rounded-lg object-cover bg-zinc-900" alt={char.name}/>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                             <PhotoIcon className="w-5 h-5 text-zinc-700"/>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-zinc-200">{char.name}</h4>
                          <span className="text-[10px] uppercase text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{char.role}</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center mt-auto pt-2 border-t border-zinc-800">
                        <button 
                          onClick={(e) => handleDeleteFromLibrary(e, char.id)}
                          className="text-zinc-600 hover:text-red-500 transition-colors"
                          title="Delete from Library"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleImport(char)}
                          className="flex items-center space-x-1 bg-primary-600/10 hover:bg-primary-600 hover:text-white text-primary-500 px-3 py-1.5 rounded text-xs font-bold transition-all border border-primary-600/20"
                        >
                          <PlusCircleIcon className="w-4 h-4" /> <span>Import</span>
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

export default CharacterLibrary;