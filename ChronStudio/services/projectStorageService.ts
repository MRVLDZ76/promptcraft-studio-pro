import { ProjectData, Step } from "../types";

const PROJECT_KEY = 'chronos_current_project';

interface SavedState {
  projectData: ProjectData;
  currentStep: Step;
  lastUpdated: number;
}

export const saveProjectState = (projectData: ProjectData, currentStep: Step) => {
  try {
    const payload: SavedState = {
      projectData,
      currentStep,
      lastUpdated: Date.now()
    };
    localStorage.setItem(PROJECT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save project', e);
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