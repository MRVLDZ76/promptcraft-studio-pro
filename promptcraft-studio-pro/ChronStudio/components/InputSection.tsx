import React, { useState, useEffect, useMemo } from 'react';
import { ProjectData, Character, ProjectCategory, ContentProcessingMode } from '../types';
import { analyzeSourceText, researchHistoricalContent, previewNarrativeStructure } from '../services/geminiService';
import { getTranslations, getBooks, getChapter, BibleBook, Translation } from '../services/bibleApiService';
import { ArrowRightIcon, SparklesIcon, CloudArrowDownIcon, BookOpenIcon, GlobeAmericasIcon, MagnifyingGlassIcon, DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon, VideoCameraIcon, SwatchIcon, SpeakerWaveIcon, SunIcon, XMarkIcon } from '@heroicons/react/24/outline';
import NewsConfigPanel from './workflows/NewsConfigPanel';
import SportsConfigPanel from './workflows/SportsConfigPanel';
import LearningConfigPanel from './workflows/LearningConfigPanel';
import MusicConfigPanel from './workflows/MusicConfigPanel';
import VideoAdConfigPanel from './workflows/VideoAdConfigPanel';
import ContentProcessingModeSelector from './ContentProcessingModeSelector';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const InputSection: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);
  
  // Bible API State
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedTranslationId, setSelectedTranslationId] = useState<string>('BSB'); // Default to BSB as per docs
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [fetchingScripture, setFetchingScripture] = useState(false);

  // Historical Research State
  const [historicalTopic, setHistoricalTopic] = useState('');
  const [researchingHistory, setResearchingHistory] = useState(false);
  // Style tooltips with descriptions and examples
  const styleDescriptions: Record<string, { description: string; example: string }> = {
    // Tone
    'Epic & Dramatic': { description: 'Grand, sweeping narratives with high emotional stakes', example: 'Battle scenes, heroic moments, climactic confrontations' },
    'Intimate & Personal': { description: 'Close character focus with emotional depth', example: 'Quiet conversations, internal struggles, personal revelations' },
    'Mysterious & Tense': { description: 'Suspenseful atmosphere with unknown elements', example: 'Detective work, supernatural events, thriller sequences' },
    'Hopeful & Uplifting': { description: 'Optimistic tone with positive emotional arc', example: 'Triumphs, reunions, inspiring speeches, new beginnings' },
    'Dark & Gritty': { description: 'Raw, realistic portrayal of harsh realities', example: 'Crime dramas, war stories, survival scenarios' },
    'Whimsical & Playful': { description: 'Light-hearted with fantastical or humorous elements', example: 'Fairy tales, comedies, magical adventures' },
    'Documentary & Factual': { description: 'Objective, informative presentation', example: 'Historical events, nature footage, educational content' },
    'Nostalgic & Reflective': { description: 'Looking back with sentimental longing', example: 'Memories, coming-of-age, period pieces, flashbacks' },
    
    // Camera Style
    'Cinematic Wide Shots': { description: 'Expansive establishing shots showing full environment', example: 'Landscapes, cityscapes, large gatherings, epic vistas' },
    'Intimate Close-ups': { description: 'Tight framing on faces to capture emotion', example: 'Emotional reactions, dialogue scenes, character details' },
    'Handheld Documentary': { description: 'Shaky, mobile camera creating realism', example: 'Action sequences, following characters, street scenes' },
    'Smooth Dolly Movement': { description: 'Fluid camera motion on tracks for elegance', example: 'Reveals, character walks, graceful transitions' },
    'Aerial/Drone Views': { description: 'Bird\'s eye perspective from above', example: 'City overviews, chase scenes, environmental scale' },
    'Static Tableaux': { description: 'Fixed camera with composed, painterly framing', example: 'Formal scenes, symmetrical shots, theatrical moments' },
    'Tracking Shots': { description: 'Camera follows subject movement dynamically', example: 'Walking conversations, action follows, character journeys' },
    'POV Perspective': { description: 'First-person view from character\'s eyes', example: 'Immersive experiences, subjective moments, discoveries' },
    
    // Color Palette
    'Warm Golden Tones': { description: 'Rich yellows, oranges, and amber hues', example: 'Sunsets, candlelit scenes, nostalgic flashbacks, comfort' },
    'Cool Blue Hues': { description: 'Blues, teals, and cyan color grading', example: 'Night scenes, technology, isolation, clinical settings' },
    'Desaturated/Muted': { description: 'Low saturation for subdued, somber mood', example: 'Drama, historical pieces, bleakness, realism' },
    'High Contrast B&W': { description: 'Black and white with dramatic shadows', example: 'Film noir, art house, timeless classics, stark drama' },
    'Vibrant Saturated': { description: 'Bold, intensely colorful palette', example: 'Fantasy, musicals, pop art, vibrant cultures' },
    'Sepia Vintage': { description: 'Brown-tinted aged photograph aesthetic', example: 'Historical flashbacks, old memories, period pieces' },
    'Neon & Electric': { description: 'Bright artificial colors with glowing elements', example: 'Cyberpunk, nightlife, sci-fi, urban energy' },
    'Earth Tones': { description: 'Natural browns, greens, and organic colors', example: 'Nature, rustic settings, grounded realism, organic life' },
    
    // Lighting
    'Golden Hour': { description: 'Warm, soft light during sunrise/sunset', example: 'Romantic scenes, peaceful moments, natural beauty' },
    'Dramatic Chiaroscuro': { description: 'Strong contrast between light and dark', example: 'Film noir, Rembrandt-style, mystery, intensity' },
    'Soft Diffused': { description: 'Gentle, even lighting with minimal shadows', example: 'Beauty shots, dreamscapes, ethereal scenes, comfort' },
    'Harsh Direct': { description: 'Hard light creating strong shadows', example: 'Desert scenes, interrogations, stark reality, intensity' },
    'Candlelit/Firelight': { description: 'Flickering warm glow from flames', example: 'Historical periods, intimate dinners, primitive settings' },
    'Neon Glow': { description: 'Artificial colored light from signs/LEDs', example: 'Urban nights, clubs, cyberpunk, modern cityscapes' },
    'Natural Daylight': { description: 'Balanced outdoor sunlight, realistic', example: 'Documentary style, everyday life, authenticity' },
    'Moonlit Night': { description: 'Cool blue nocturnal illumination', example: 'Night adventures, romance, mystery, supernatural' },
  };
  // Structure Preview (computed from content)
  const structurePreview = useMemo(() => {
    if (!projectData.content || projectData.content.length < 100) return null;
    return previewNarrativeStructure(projectData.content);
  }, [projectData.content]);

  // Initialize Bible Data
  useEffect(() => {
    if (projectData.category === ProjectCategory.BIBLICAL) {
      const initBibleData = async () => {
        // 1. Fetch available translations
        const availTranslations = await getTranslations();
        setTranslations(availTranslations);

        // 2. Determine best default translation (English)
        let defaultId = 'BSB';
        const eng = availTranslations.find(t => t.language === 'eng' && (t.id === 'BSB' || t.id === 'WEB' || t.id === 'KJV'));
        if (eng) defaultId = eng.id;
        
        setSelectedTranslationId(defaultId);
        
        // 3. Fetch books for that translation
        const books = await getBooks(defaultId);
        setBibleBooks(books);
        if (books.length > 0) {
          setSelectedBookId(books[0].id);
        }
      };
      
      initBibleData();
    }
  }, [projectData.category]);

  // Refetch books if user changes translation manually
  const handleTranslationChange = async (newId: string) => {
    setSelectedTranslationId(newId);
    setBibleBooks([]); 
    const books = await getBooks(newId);
    setBibleBooks(books);
    if (books.length > 0) {
      setSelectedBookId(books[0].id);
      setSelectedChapter(1);
    }
  };

  const getLabels = () => {
    switch (projectData.category) {
      case ProjectCategory.BIBLICAL:
        return {
          titleLabel: 'Book Name',
          segmentLabel: 'Chapter',
          titlePlaceholder: 'e.g. 1 Samuel',
          segmentPlaceholder: 'e.g. 17'
        };
      case ProjectCategory.HISTORICAL:
        return {
          titleLabel: 'Event Title / Era',
          segmentLabel: 'Date / Segment',
          titlePlaceholder: 'e.g. Battle of Waterloo',
          segmentPlaceholder: 'e.g. June 1815'
        };
      case ProjectCategory.CUSTOM:
      default:
        return {
          titleLabel: 'Project Title',
          segmentLabel: 'Episode / Scene',
          titlePlaceholder: 'e.g. The Neon City',
          segmentPlaceholder: 'e.g. Opening Sequence'
        };
    }
  };

  const labels = getLabels();

  const handleImportScripture = async () => {
    if (!selectedBookId) return;
    setFetchingScripture(true);
    try {
      const content = await getChapter(selectedTranslationId, selectedBookId, selectedChapter);
      const book = bibleBooks.find(b => b.id === selectedBookId);
      
      updateProject({
        title: book?.name || '',
        segment: `Chapter ${selectedChapter}`,
        content: content
      });
    } catch (e) {
      console.error(e);
      alert("Failed to fetch scripture content. Please try again or input manually.");
    } finally {
      setFetchingScripture(false);
    }
  };

  const handleResearchHistory = async () => {
    if (!historicalTopic) return;
    setResearchingHistory(true);
    try {
        const content = await researchHistoricalContent(historicalTopic);
        updateProject({
            title: historicalTopic,
            segment: 'Historical Overview',
            content: content
        });
    } catch (e) {
        console.error(e);
        alert("Failed to research topic. Please check your connection and try again.");
    } finally {
        setResearchingHistory(false);
    }
  };

  const handleAnalyze = async () => {
    if (!projectData.title || !projectData.content) return;
    setLoading(true);
    try {
      const result = await analyzeSourceText(
        projectData.category,
        projectData.title,
        projectData.segment,
        projectData.content,
        projectData.contextNote,
        projectData.processingMode || ContentProcessingMode.CREATIVE,
        projectData.reimagineParams
      );
      
      const newCharacters: Character[] = result.characters.map((c: any) => ({
        ...c,
        id: crypto.randomUUID(),
        referenceImageUrl: ''
      }));

      updateProject({
        summary: result.summary,
        setting: result.setting,
        characters: newCharacters
      });
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedBookObj = () => bibleBooks.find(b => b.id === selectedBookId);

  // Render workflow-specific panels for new categories
  if (projectData.category === ProjectCategory.NEWS) {
    return <NewsConfigPanel projectData={projectData} updateProject={updateProject} onNext={onNext} />;
  }

  if (projectData.category === ProjectCategory.SPORTS) {
    return <SportsConfigPanel projectData={projectData} updateProject={updateProject} onNext={onNext} />;
  }

  if (projectData.category === ProjectCategory.LEARNING) {
    return <LearningConfigPanel projectData={projectData} updateProject={updateProject} onNext={onNext} />;
  }

  if (projectData.category === ProjectCategory.MUSIC) {
    return <MusicConfigPanel projectData={projectData} updateProject={updateProject} onNext={onNext} />;
  }

  if (projectData.category === ProjectCategory.VIDEO_ADS) {
    return <VideoAdConfigPanel projectData={projectData} updateProject={updateProject} onNext={onNext} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end border-b border-neutral-200 dark:border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1 block">Step 01</span>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Source Intelligence</h2>
          <p className="text-neutral-600 dark:text-zinc-400 mt-2 text-sm">Input your source text. Our engine will deconstruct it into narrative components.</p>
        </div>
        <div className="px-3 py-1 bg-neutral-100 dark:bg-zinc-900 rounded border border-neutral-200 dark:border-zinc-800 text-xs text-neutral-600 dark:text-zinc-500 font-mono">
           {projectData.category} MODE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bible API Import Section */}
          {projectData.category === ProjectCategory.BIBLICAL && (
            <div className="bg-neutral-100 dark:bg-zinc-900/40 border border-neutral-200 dark:border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-500">
                    <BookOpenIcon className="w-5 h-5" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Import Scripture</h3>
                 </div>
                 {/* Translation Selector */}
                 <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-neutral-500 dark:text-zinc-500 font-bold whitespace-nowrap">VERSION:</span>
                    <select 
                      className="bg-white dark:bg-zinc-950 border border-neutral-300 dark:border-zinc-800 rounded px-2 py-1 text-[10px] text-neutral-700 dark:text-zinc-300 focus:border-amber-500 outline-none uppercase max-w-[140px] truncate"
                      value={selectedTranslationId}
                      onChange={(e) => handleTranslationChange(e.target.value)}
                    >
                       {translations.length === 0 && <option value="BSB">BSB (Default)</option>}
                       {translations.map(t => (
                         <option key={t.id} value={t.id} className="normal-case">{t.id} - {t.name}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-500 dark:text-zinc-500 font-bold">Book</label>
                  <select 
                    className="w-full bg-white dark:bg-zinc-900 border border-neutral-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-neutral-900 dark:text-zinc-200 focus:border-amber-500 outline-none"
                    value={selectedBookId}
                    onChange={(e) => {
                      setSelectedBookId(e.target.value);
                      setSelectedChapter(1);
                    }}
                  >
                    {bibleBooks.length === 0 && <option>Loading books...</option>}
                    {bibleBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-500 dark:text-zinc-500 font-bold">Chapter</label>
                  <select
                    className="w-full bg-white dark:bg-zinc-900 border border-neutral-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-neutral-900 dark:text-zinc-200 focus:border-amber-500 outline-none"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                  >
                     {getSelectedBookObj() && Array.from({ length: getSelectedBookObj()!.numberOfChapters }, (_, i) => i + 1).map(num => (
                       <option key={num} value={num}>{num}</option>
                     ))}
                  </select>
                </div>
                <button
                  onClick={handleImportScripture}
                  disabled={fetchingScripture}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {fetchingScripture ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CloudArrowDownIcon className="w-4 h-4" />
                  )}
                  <span>Import Text</span>
                </button>
              </div>
            </div>
          )}

           {/* Historical Research Import Section */}
           {projectData.category === ProjectCategory.HISTORICAL && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center space-x-2 mb-4 text-blue-500">
                <GlobeAmericasIcon className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wide">Historical Research Assistant</h3>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-1 flex-1 w-full">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold">Event Topic / Subject</label>
                  <div className="relative">
                      <input 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-200 focus:border-blue-500 outline-none placeholder:text-zinc-600"
                        value={historicalTopic}
                        onChange={(e) => setHistoricalTopic(e.target.value)}
                        placeholder="e.g. The Fall of Constantinople"
                        onKeyDown={(e) => e.key === 'Enter' && handleResearchHistory()}
                      />
                      <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5"/>
                  </div>
                </div>
                <button
                  onClick={handleResearchHistory}
                  disabled={researchingHistory || !historicalTopic}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 min-w-[140px]"
                >
                  {researchingHistory ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}
                  <span>Fetch Context</span>
                </button>
              </div>
            </div>
          )}

          {/* Manual Input Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                {labels.titleLabel}
              </label>
              <input 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all placeholder:text-zinc-700"
                value={projectData.title}
                onChange={(e) => updateProject({ title: e.target.value })}
                placeholder={labels.titlePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                {labels.segmentLabel}
              </label>
              <input 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all placeholder:text-zinc-700"
                value={projectData.segment}
                onChange={(e) => updateProject({ segment: e.target.value })}
                placeholder={labels.segmentPlaceholder}
              />
            </div>
          </div>

          {/* Content Processing Mode Selector */}
          <ContentProcessingModeSelector
            mode={projectData.processingMode || ContentProcessingMode.CREATIVE}
            onChange={(mode) => updateProject({ processingMode: mode })}
            onReimagineParamsChange={(params) => updateProject({ reimagineParams: params })}
            reimagineParams={projectData.reimagineParams}
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Source Content / Script</label>
            <textarea 
              className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-zinc-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none leading-relaxed transition-all placeholder:text-zinc-700 resize-none font-mono text-sm"
              value={projectData.content}
              onChange={(e) => updateProject({ content: e.target.value })}
              placeholder="Paste text or detailed outline here..."
            />
          </div>

          {/* Structure Preview Panel */}
          {structurePreview && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="w-4 h-4 text-primary-400" />
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wide">Narrative Structure Detected</h4>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  ~{structurePreview.estimatedScenes} scenes estimated
                </span>
              </div>
              
              {/* Structure Overview */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-zinc-950/50 rounded p-2 text-center">
                  <span className="text-lg font-bold text-zinc-200">{structurePreview.partsCount}</span>
                  <p className="text-[10px] text-zinc-500 uppercase">Parts</p>
                </div>
                <div className="bg-zinc-950/50 rounded p-2 text-center">
                  <span className="text-lg font-bold text-zinc-200">{structurePreview.blocksCount}</span>
                  <p className="text-[10px] text-zinc-500 uppercase">Blocks</p>
                </div>
                <div className="bg-zinc-950/50 rounded p-2 text-center">
                  <span className="text-lg font-bold text-emerald-400">{structurePreview.hasProductionNotes ? '✓' : '—'}</span>
                  <p className="text-[10px] text-zinc-500 uppercase">Prod Notes</p>
                </div>
              </div>
              
              {/* Hierarchy Preview */}
              {structurePreview.structure.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-2 mb-3">
                  {structurePreview.structure.slice(0, 4).map((part, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-primary-400 font-semibold">{part.part}</span>
                      <div className="ml-3 text-zinc-500 truncate">
                        {part.blocks.slice(0, 3).join(' → ')}
                        {part.blocks.length > 3 && <span className="text-zinc-600"> +{part.blocks.length - 3} more</span>}
                      </div>
                    </div>
                  ))}
                  {structurePreview.structure.length > 4 && (
                    <p className="text-[10px] text-zinc-600">...and {structurePreview.structure.length - 4} more parts</p>
                  )}
                </div>
              )}
              
              {/* Warnings */}
              {structurePreview.warnings.length > 0 && (
                <div className="border-t border-zinc-800 pt-2 space-y-1">
                  {structurePreview.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start space-x-2 text-[10px] text-amber-400/80">
                      <ExclamationTriangleIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Good structure indicator */}
              {structurePreview.warnings.length === 0 && structurePreview.blocksCount >= 3 && (
                <div className="flex items-center space-x-2 text-[10px] text-emerald-400 border-t border-zinc-800 pt-2">
                  <CheckCircleIcon className="w-3 h-3" />
                  <span>Well-structured narrative detected. Ready for scene generation.</span>
                </div>
              )}
            </div>
          )}

           <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Additional Context / Style Notes</label>
              <span className="text-[10px] text-zinc-600">CLICK TO ADD</span>
            </div>
            
            {/* STYLE PRESET TAGS */}
            <div className="space-y-4">
              {/* Tone Styles */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <SpeakerWaveIcon className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Tone</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Epic & Dramatic', 'Intimate & Personal', 'Mysterious & Tense', 'Hopeful & Uplifting', 'Dark & Gritty', 'Whimsical & Playful', 'Documentary & Factual', 'Nostalgic & Reflective'].map((tone) => (
                    <div key={tone} className="relative group">
                      <button
                        onClick={() => {
                          const newNote = projectData.contextNote.includes(tone) 
                            ? projectData.contextNote.replace(tone + ', ', '').replace(tone, '')
                            : (projectData.contextNote ? projectData.contextNote + ', ' : '') + tone;
                          updateProject({ contextNote: newNote.replace(/^,\s*/, '').replace(/,\s*$/, '') });
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                          projectData.contextNote.includes(tone)
                            ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {tone}
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-950 border border-purple-500/50 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                        <div className="text-xs font-semibold text-purple-300 mb-1">{tone}</div>
                        <div className="text-[10px] text-zinc-400 mb-2">{styleDescriptions[tone]?.description}</div>
                        <div className="text-[9px] text-zinc-500 italic">
                          <span className="text-purple-400 font-semibold">Example:</span> {styleDescriptions[tone]?.example}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-zinc-950 border-r border-b border-purple-500/50 rotate-45"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Camera Styles */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <VideoCameraIcon className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Camera Style</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Cinematic Wide Shots', 'Intimate Close-ups', 'Handheld Documentary', 'Smooth Dolly Movement', 'Aerial/Drone Views', 'Static Tableaux', 'Tracking Shots', 'POV Perspective'].map((camera) => (
                    <div key={camera} className="relative group">
                      <button
                        onClick={() => {
                          const newNote = projectData.contextNote.includes(camera)
                            ? projectData.contextNote.replace(camera + ', ', '').replace(camera, '')
                            : (projectData.contextNote ? projectData.contextNote + ', ' : '') + camera;
                          updateProject({ contextNote: newNote.replace(/^,\s*/, '').replace(/,\s*$/, '') });
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                          projectData.contextNote.includes(camera)
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {camera}
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-950 border border-blue-500/50 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                        <div className="text-xs font-semibold text-blue-300 mb-1">{camera}</div>
                        <div className="text-[10px] text-zinc-400 mb-2">{styleDescriptions[camera]?.description}</div>
                        <div className="text-[9px] text-zinc-500 italic">
                          <span className="text-blue-400 font-semibold">Example:</span> {styleDescriptions[camera]?.example}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-zinc-950 border-r border-b border-blue-500/50 rotate-45"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <SwatchIcon className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Color Palette</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Warm Golden Tones', 'Cool Blue Hues', 'Desaturated/Muted', 'High Contrast B&W', 'Vibrant Saturated', 'Sepia Vintage', 'Neon & Electric', 'Earth Tones'].map((color) => (
                    <div key={color} className="relative group">
                      <button
                        onClick={() => {
                          const newNote = projectData.contextNote.includes(color)
                            ? projectData.contextNote.replace(color + ', ', '').replace(color, '')
                            : (projectData.contextNote ? projectData.contextNote + ', ' : '') + color;
                          updateProject({ contextNote: newNote.replace(/^,\s*/, '').replace(/,\s*$/, '') });
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                          projectData.contextNote.includes(color)
                            ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {color}
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-950 border border-amber-500/50 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                        <div className="text-xs font-semibold text-amber-300 mb-1">{color}</div>
                        <div className="text-[10px] text-zinc-400 mb-2">{styleDescriptions[color]?.description}</div>
                        <div className="text-[9px] text-zinc-500 italic">
                          <span className="text-amber-400 font-semibold">Example:</span> {styleDescriptions[color]?.example}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-zinc-950 border-r border-b border-amber-500/50 rotate-45"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lighting */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <SunIcon className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Lighting</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Golden Hour', 'Dramatic Chiaroscuro', 'Soft Diffused', 'Harsh Direct', 'Candlelit/Firelight', 'Neon Glow', 'Natural Daylight', 'Moonlit Night'].map((light) => (
                    <div key={light} className="relative group">
                      <button
                        onClick={() => {
                          const newNote = projectData.contextNote.includes(light)
                            ? projectData.contextNote.replace(light + ', ', '').replace(light, '')
                            : (projectData.contextNote ? projectData.contextNote + ', ' : '') + light;
                          updateProject({ contextNote: newNote.replace(/^,\s*/, '').replace(/,\s*$/, '') });
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                          projectData.contextNote.includes(light)
                            ? 'bg-yellow-600/30 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                      {light}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-950 border border-yellow-500/50 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <div className="text-xs font-semibold text-yellow-300 mb-1">{light}</div>
                      <div className="text-[10px] text-zinc-400 mb-2">{styleDescriptions[light]?.description}</div>
                      <div className="text-[9px] text-zinc-500 italic">
                        <span className="text-yellow-400 font-semibold">Example:</span> {styleDescriptions[light]?.example}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-zinc-950 border-r border-b border-yellow-500/50 rotate-45"></div>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Tags Display + Custom Note */}
            {projectData.contextNote && (
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Selected Style Notes</span>
                  <button
                    onClick={() => updateProject({ contextNote: '' })}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    title="Clear all"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{projectData.contextNote}</p>
              </div>
            )}

            {/* Optional Custom Note */}
            <textarea 
              className="w-full h-16 bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none leading-relaxed transition-all placeholder:text-zinc-700 resize-none text-sm"
              value={projectData.contextNote}
              onChange={(e) => updateProject({ contextNote: e.target.value })}
              placeholder="Add custom notes or refine selections above..."
            />
          </div>

          {/* Negative Prompts Section */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-red-400 uppercase tracking-wide">Negative Prompts (Avoid)</label>
              <span className="text-[10px] text-zinc-600">CLICK TO ADD</span>
            </div>
            
            {/* Common Negative Prompt Tags */}
            <div className="flex flex-wrap gap-2">
              {['text', 'watermarks', 'logos', 'titles', 'subtitles', 'captions', 'words', 'letters', 'UI elements', 'low quality', 'blurry', 'distorted faces', 'extra limbs', 'bad anatomy', 'deformed', 'ugly', 'duplicate', 'cropped', 'out of frame', 'signature', 'username'].map((neg) => (
                <button
                  key={neg}
                  onClick={() => {
                    const currentNegatives = projectData.negativePrompt || '';
                    const newNeg = currentNegatives.includes(neg)
                      ? currentNegatives.replace(neg + ', ', '').replace(', ' + neg, '').replace(neg, '')
                      : (currentNegatives ? currentNegatives + ', ' : '') + neg;
                    updateProject({ negativePrompt: newNeg.replace(/^,\s*/, '').replace(/,\s*$/, '').replace(/,\s*,/g, ', ') });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                    (projectData.negativePrompt || '').includes(neg)
                      ? 'bg-red-900/30 border-red-700 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {neg}
                </button>
              ))}
            </div>

            {/* Current Negative Prompt Display */}
            {projectData.negativePrompt && (
              <div className="bg-red-950/20 rounded-lg p-3 border border-red-900/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-red-400 uppercase font-bold">Things to Avoid</span>
                  <button
                    onClick={() => updateProject({ negativePrompt: '' })}
                    className="text-red-600 hover:text-red-400 transition-colors"
                    title="Clear all"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-red-300/80 leading-relaxed">{projectData.negativePrompt}</p>
              </div>
            )}

            {/* Custom Negative Prompt Input */}
            <textarea 
              className="w-full h-12 bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none leading-relaxed transition-all placeholder:text-zinc-700 resize-none text-sm"
              value={projectData.negativePrompt || ''}
              onChange={(e) => updateProject({ negativePrompt: e.target.value })}
              placeholder="Add custom things to avoid in generation..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleAnalyze}
              disabled={loading || !projectData.content}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-all shadow-lg shadow-primary-900/20 text-sm"
            >
              {loading ? (
                 <span className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Processing Data...</span>
              ) : (
                 <><SparklesIcon className="w-4 h-4" /> <span>Analyze Source</span></>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-zinc-100 uppercase tracking-wider mb-6 border-b border-neutral-200 dark:border-zinc-800 pb-2">Intelligence Report</h3>
            
            {projectData.summary ? (
              <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                <div>
                  <h4 className="text-[10px] uppercase text-zinc-500 font-bold mb-2">Logline</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/50 p-3 rounded border border-zinc-800/50">{projectData.summary}</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase text-zinc-500 font-bold">Setting Data</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between p-2 bg-zinc-950/30 rounded border border-zinc-800/50">
                      <span className="text-zinc-500">Era / Year</span>
                      <span className="text-zinc-200 font-mono">{projectData.setting.year}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-zinc-950/30 rounded border border-zinc-800/50">
                      <span className="text-zinc-500">Region</span>
                      <span className="text-zinc-200">{projectData.setting.region}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase text-zinc-500 font-bold mb-3">Identified Assets</h4>
                  <div className="flex flex-wrap gap-2">
                    {projectData.characters.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-md text-zinc-300 border border-zinc-700 transition-colors cursor-default">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-center p-4">
                <SparklesIcon className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-xs">Awaiting Source Data</p>
              </div>
            )}
            
            {projectData.summary && (
               <button 
                onClick={onNext}
                className="w-full flex items-center justify-center space-x-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2.5 rounded-lg mt-6 font-medium transition-colors"
              >
                <span>Confirm & Proceed</span> <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputSection;