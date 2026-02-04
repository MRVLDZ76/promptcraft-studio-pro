import React, { useState, useEffect } from 'react';
import { ProjectData, Step, ProjectCategory, StoryStyle, ProductionMode } from './types';
import TemplateSelection from './components/TemplateSelection';
import InputSection from './components/InputSection';
import CharacterLibrary from './components/CharacterLibrary';
import StoryboardSection from './components/StoryboardSection';
import VideoProduction from './components/VideoProduction';
import { saveProjectState, loadProjectState } from './services/projectStorageService';

const DEFAULT_PROJECT: ProjectData = {
  category: ProjectCategory.BIBLICAL,
  mode: ProductionMode.INTEGRATED,
  title: '',
  segment: '',
  content: '',
  contextNote: '',
  negativePrompt: 'text, watermarks, logos, titles, subtitles, captions, words, letters, UI elements, low quality, blurry, distorted faces',
  summary: '',
  setting: {
    year: '',
    region: '',
    landscape: ''
  },
  style: StoryStyle.CINEMATIC_DRAMA,
  characters: [],
  storyboard: []
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.TEMPLATE);
  const [projectData, setProjectData] = useState<ProjectData>(DEFAULT_PROJECT);

  // Load project on mount
  useEffect(() => {
    const saved = loadProjectState();
    if (saved && saved.currentStep !== undefined) {
      setProjectData(saved.projectData);
      setCurrentStep(saved.currentStep);
    }
  }, []);

  // Save project on every state change
  useEffect(() => {
    saveProjectState(projectData, currentStep);
  }, [projectData, currentStep]);

  const updateProject = (data: Partial<ProjectData>) => {
    setProjectData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < Step.PRODUCTION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > Step.TEMPLATE) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetProject = () => {
    setProjectData(DEFAULT_PROJECT);
    setCurrentStep(Step.TEMPLATE);
    localStorage.removeItem('chronos_project_state');
  };

  const stepLabels = ['Templates', 'Source Input', 'Casting', 'Storyboard', 'Production'];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-900 dark:text-zinc-100">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 px-8 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-lg bg-white/95 dark:bg-zinc-900/95">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">CS</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Chronos Studio</h1>
            <p className="text-xs text-neutral-500 dark:text-zinc-500">Integrated Narrative Production</p>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center space-x-2">
          {stepLabels.map((label, idx) => (
            <div 
              key={idx} 
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                idx === currentStep 
                  ? 'bg-primary-600 text-white' 
                  : idx < currentStep 
                    ? 'bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400' 
                    : 'bg-neutral-100 dark:bg-zinc-900 text-neutral-400 dark:text-zinc-600'
              }`}
            >
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </span>
              <span className="hidden md:block">{label}</span>
            </div>
          ))}
        </div>

        {currentStep !== Step.TEMPLATE && (
          <button 
            onClick={resetProject}
            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg text-xs font-bold border border-red-900/40 transition-colors"
          >
            Reset Project
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className={`container mx-auto px-8 py-12 max-w-7xl ${currentStep > Step.TEMPLATE && currentStep < Step.PRODUCTION ? 'pb-32' : ''}`}>
        {currentStep === Step.TEMPLATE && (
          <TemplateSelection updateProject={updateProject} onNext={nextStep} />
        )}
        {currentStep === Step.INPUT && (
          <InputSection projectData={projectData} updateProject={updateProject} onNext={nextStep} />
        )}
        {currentStep === Step.CHARACTERS && (
          <CharacterLibrary projectData={projectData} updateProject={updateProject} onNext={nextStep} />
        )}
        {currentStep === Step.STORYBOARD && (
          <StoryboardSection projectData={projectData} updateProject={updateProject} onNext={nextStep} />
        )}
        {currentStep === Step.PRODUCTION && (
          <VideoProduction projectData={projectData} updateProject={updateProject} onReset={resetProject} onGoBack={prevStep} />
        )}
      </main>

      {/* Footer Navigation */}
      {currentStep > Step.TEMPLATE && currentStep < Step.PRODUCTION && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-zinc-800 px-8 py-4">
          <div className="container mx-auto max-w-7xl flex justify-between items-center">
            <button 
              onClick={prevStep}
              className="flex items-center space-x-2 px-6 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-900 dark:text-zinc-200 rounded-lg font-medium transition-colors"
            >
              <span>← Back</span>
            </button>
            
            <div className="text-sm text-neutral-500 dark:text-zinc-500">
              <span className="font-mono">
                Step {currentStep + 1} of {stepLabels.length}
              </span>
              {projectData.title && (
                <span className="ml-4 text-neutral-400 dark:text-zinc-400">
                  Project: <span className="text-neutral-900 dark:text-white font-medium">{projectData.title}</span>
                </span>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
