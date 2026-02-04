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
  
  if (existingIndex > -1) {
    lib[existingIndex] = char;
  } else {
    lib.push(char);
  }
  
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
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