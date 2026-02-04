import { Character } from "../types";

const LIBRARY_KEY = 'chronos_character_library';

export const getLibrary = (): Character[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load library", e);
    return [];
  }
};

export const saveToLibrary = (char: Character): Character[] => {
  const lib = getLibrary();
  const existingIndex = lib.findIndex(c => c.id === char.id);
  
  // Don't save reference images to localStorage (too large)
  // Images should be saved to backend via assetService
  const charToSave = {
    ...char,
    referenceImageUrl: undefined // Remove large base64 images
  };
  
  if (existingIndex > -1) {
    lib[existingIndex] = charToSave;
  } else {
    lib.push(charToSave);
  }
  
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Clearing old data...');
      // Clear library and try again with just the new character
      localStorage.removeItem(LIBRARY_KEY);
      localStorage.setItem(LIBRARY_KEY, JSON.stringify([charToSave]));
      return [charToSave];
    }
    throw e;
  }
  
  return lib;
};

export const removeFromLibrary = (id: string): Character[] => {
  const lib = getLibrary().filter(c => c.id !== id);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  return lib;
};

export const isSavedInLibrary = (id: string): boolean => {
  const lib = getLibrary();
  return lib.some(c => c.id === id);
};