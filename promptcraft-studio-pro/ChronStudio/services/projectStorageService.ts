import { ProjectData, Step } from "../types";

const PROJECT_KEY = 'chronos_current_project';

interface SavedState {
  projectData: ProjectData;
  currentStep: Step;
  lastUpdated: number;
}

export const saveProjectState = (projectData: ProjectData, currentStep: Step) => {
  try {
    // Remove large video URLs and images before saving to localStorage
    const cleanedProject = {
      ...projectData,
      storyboard: projectData.storyboard.map(scene => ({
        ...scene,
        videoUrl: undefined // Videos are saved to backend, don't store in localStorage
      })),
      characters: projectData.characters.map(char => ({
        ...char,
        referenceImageUrl: undefined // Images are saved to backend
      }))
    };
    
    const payload: SavedState = {
      projectData: cleanedProject,
      currentStep,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem(PROJECT_KEY, JSON.stringify(payload));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Large assets should be saved to backend only.');
      // Try to save just metadata
      try {
        const minimalProject = {
          ...projectData,
          storyboard: projectData.storyboard.map(s => ({
            id: s.id,
            number: s.number,
            status: s.status,
            videoUrl: undefined
          })),
          characters: projectData.characters.map(c => ({
            id: c.id,
            name: c.name,
            referenceImageUrl: undefined
          }))
        };
        localStorage.setItem(PROJECT_KEY, JSON.stringify({
          projectData: minimalProject,
          currentStep,
          lastUpdated: Date.now()
        }));
      } catch (e2) {
        console.error('Failed to save even minimal project state', e2);
      }
    } else {
      console.error('Failed to save project', e);
    }
  }
};

export const loadProjectState = (): SavedState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    // basic validation
    if (!parsed.projectData || typeof parsed.currentStep === 'undefined') return null;
    
    return parsed as SavedState;
  } catch (e) {
    console.error('Failed to load project', e);
    return null;
  }
};

export const clearProjectState = () => {
  try {
    localStorage.removeItem(PROJECT_KEY);
  } catch (e) {
    console.error('Failed to clear project', e);
  }
};