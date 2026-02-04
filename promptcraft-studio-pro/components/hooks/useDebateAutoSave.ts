/**
 * Auto-Save Hook - Analysis Studio (Debates)
 * Automatically saves debate draft state to prevent data loss
 */

import { useEffect, useRef, useState, useCallback } from 'react';

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

export const useDebateAutoSave = <T extends Record<string, any>>(
  debateId: string | null,
  data: T,
  options: AutoSaveOptions = {}
): AutoSaveResult => {
  const {
    debounceMs = 1000,
    enableLocalStorage = true,
    localStorageKey = 'analysis_studio_draft'
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const dataRef = useRef<T>(data);
  const isFirstChangeRef = useRef(true);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const saveToLocalStorage = useCallback(() => {
    if (!enableLocalStorage || !debateId) return;
    
    try {
      const storageData = {
        debateId,
        data: dataRef.current,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(localStorageKey, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  }, [debateId, enableLocalStorage, localStorageKey]);

  const saveToServer = useCallback(async () => {
    if (!debateId || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveStatus('saving');
      setErrorMessage(null);

      const response = await fetch(`/api/v1/debates/${debateId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(dataRef.current)
      });

      if (!response.ok) {
        throw new Error('Failed to save debate');
      }

      setLastSaved(new Date());
      setSaveStatus('saved');
      
      if (enableLocalStorage) {
        localStorage.removeItem(localStorageKey);
      }

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error: any) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Save failed');
      saveToLocalStorage();
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [debateId, enableLocalStorage, localStorageKey, saveToLocalStorage]);

  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await saveToServer();
  }, [saveToServer]);

  useEffect(() => {
    if (!debateId) {
      saveToLocalStorage();
      return;
    }

    if (isFirstChangeRef.current) {
      isFirstChangeRef.current = false;
      saveToServer();
      return;
    }

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
  }, [data, debateId, debounceMs, saveToServer, saveToLocalStorage]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debateId && dataRef.current) {
        const blob = new Blob([JSON.stringify(dataRef.current)], {
          type: 'application/json'
        });
        navigator.sendBeacon(`/api/v1/debates/${debateId}/`, blob);
      }
      saveToLocalStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [debateId, saveToLocalStorage]);

  return {
    isSaving,
    lastSaved,
    saveNow,
    saveStatus,
    errorMessage
  };
};

export const loadDraftFromLocalStorage = (
  localStorageKey: string = 'analysis_studio_draft'
): { debateId: string; data: any; timestamp: string } | null => {
  try {
    const stored = localStorage.getItem(localStorageKey);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load draft from local storage:', error);
    return null;
  }
};

export const clearDraft = (
  localStorageKey: string = 'analysis_studio_draft'
): void => {
  localStorage.removeItem(localStorageKey);
};
