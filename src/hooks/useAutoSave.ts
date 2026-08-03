import { useState, useEffect, useCallback } from 'react';

export function useAutoSave<T>(testCode: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage once on mount
  useEffect(() => {
    try {
      const tokenId = sessionStorage.getItem('valid_token_id') || sessionStorage.getItem('current_token_id');
      if (tokenId) {
        const storageKey = `autosave_${tokenId}_${testCode}`;
        const item = localStorage.getItem(storageKey);
        if (item) {
          setValue(JSON.parse(item));
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage for ${testCode}:`, error);
    }
    setIsInitialized(true);
  }, [testCode]);

  // Save to localStorage whenever value changes
  useEffect(() => {
    if (isInitialized) {
      try {
        const tokenId = sessionStorage.getItem('valid_token_id') || sessionStorage.getItem('current_token_id');
        if (tokenId) {
          const storageKey = `autosave_${tokenId}_${testCode}`;
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`Error saving to localStorage for ${testCode}:`, error);
      }
    }
  }, [value, isInitialized, testCode]);

  const clearAutoSave = useCallback(() => {
    try {
      const tokenId = sessionStorage.getItem('valid_token_id') || sessionStorage.getItem('current_token_id');
      if (tokenId) {
        const storageKey = `autosave_${tokenId}_${testCode}`;
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn(`Error clearing localStorage for ${testCode}:`, error);
    }
  }, [testCode]);

  return [value, setValue, clearAutoSave];
}
