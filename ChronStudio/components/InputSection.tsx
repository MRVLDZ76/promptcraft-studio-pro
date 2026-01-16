import React, { useState, useEffect } from 'react';
import { ProjectData, Character, ProjectCategory } from '../types';
import { analyzeSourceText, researchHistoricalContent } from '../services/geminiService';
import { getTranslations, getBooks, getChapter, BibleBook, Translation } from '../services/bibleApiService';
import { ArrowRightIcon, SparklesIcon, CloudArrowDownIcon, BookOpenIcon, GlobeAmericasIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Props {
  projectData: ProjectData;
  updateProject: (data: Partial<ProjectData>) => void;
  onNext: () => void;
}

const InputSection: React.FC<Props> = ({ projectData, updateProject, onNext }) => {
  const [loading, setLoading] = useState(false);
  
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
        projectData.contextNote
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Source Content / Script</label>
            <textarea 
              className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-zinc-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none leading-relaxed transition-all placeholder:text-zinc-700 resize-none font-mono text-sm"
              value={projectData.content}
              onChange={(e) => updateProject({ content: e.target.value })}
              placeholder="Paste text or detailed outline here..."
            />
          </div>

           <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Additional Context / Style Notes</label>
              <span className="text-[10px] text-zinc-600">RECOMMENDED</span>
            </div>
            <textarea 
              className="w-full h-24 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-zinc-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none leading-relaxed transition-all placeholder:text-zinc-700 resize-none text-sm"
              value={projectData.contextNote}
              onChange={(e) => updateProject({ contextNote: e.target.value })}
              placeholder="Describe tone, camera style, color palette, or specific details for better AI guidance..."
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