/**
 * Auto-Save Hook - Publishing Studio
 * Automatically saves draft state to prevent data loss
 * 
 * Features:
 * - Debounced saves (1 second delay)
 * - Save on first change
 * - Visual indicators (Saving.../Saved)
 * - Local storage fallback
 * - Prevents concurrent saves
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { updateBookProject } from '../services/publishingService';

interface AutoSaveOptions {
  debounceMs?: number;
  enableLocalStorage?: boolean;
  localStorageKey?: string;
}

interface AutoSaveResult {
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage: string | null;
}

export const useAutoSave = <T extends Record<string, any>>(
  bookId: number | null,
  data: T,
  options: AutoSaveOptions = {}
): AutoSaveResult => {
  const {
    debounceMs = 1000,
    enableLocalStorage = true,
    localStorageKey = 'publishing_studio_draft'
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const dataRef = useRef<T>(data);
  const isFirstChangeRef = useRef(true);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Local storage save
  const saveToLocalStorage = useCallback(() => {
    if (!enableLocalStorage || !bookId) return;
    
    try {
      const storageData = {
        bookId,
        data: dataRef.current,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(localStorageKey, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  }, [bookId, enableLocalStorage, localStorageKey]);

  // Server save
  const saveToServer = useCallback(async () => {
    if (!bookId || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveStatus('saving');
      setErrorMessage(null);

      await updateBookProject(bookId, dataRef.current);

      setLastSaved(new Date());
      setSaveStatus('saved');
      
      // Clear local storage after successful save
      if (enableLocalStorage) {
        localStorage.removeItem(localStorageKey);
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error: any) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Save failed');
      
      // Save to local storage as fallback
      saveToLocalStorage();
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [bookId, enableLocalStorage, localStorageKey, saveToLocalStorage]);

  // Manual save trigger
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await saveToServer();
  }, [saveToServer]);

  // Auto-save effect
  useEffect(() => {
    // Don't auto-save if no bookId (new project not created yet)
    if (!bookId) {
      // But save to local storage for recovery
      saveToLocalStorage();
      return;
    }

    // Save immediately on first change
    if (isFirstChangeRef.current) {
      isFirstChangeRef.current = false;
      saveToServer();
      return;
    }

    // Debounced save for subsequent changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToServer();
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, bookId, debounceMs, saveToServer, saveToLocalStorage]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (bookId && dataRef.current) {
        // Use navigator.sendBeacon for reliable save on unload
        const blob = new Blob([JSON.stringify(dataRef.current)], {
          type: 'application/json'
        });
        navigator.sendBeacon(`/api/v1/publishing/books/${bookId}/`, blob);
      }
      
      // Also save to local storage
      saveToLocalStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [bookId, saveToLocalStorage]);

  return {
    isSaving,
    lastSaved,
    saveNow,
    saveStatus,
    errorMessage
  };
};

/**
 * Load draft from local storage
 */
export const loadDraftFromLocalStorage = (
  localStorageKey: string = 'publishing_studio_draft'
): { bookId: number; data: any; timestamp: string } | null => {
  try {
    const stored = localStorage.getItem(localStorageKey);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error('Failed to load draft from local storage:', error);
    return null;
  }
};

/**
 * Clear draft from local storage
 */
export const clearDraft = (
  localStorageKey: string = 'publishing_studio_draft'
): void => {
  localStorage.removeItem(localStorageKey);
};
