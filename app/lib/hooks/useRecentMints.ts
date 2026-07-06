import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jetty_recent_mints';
const MAX_MINTS = 20;

export function useRecentMints() {
  const [recentMints, setRecentMints] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTimeout(() => setRecentMints(JSON.parse(stored)), 0);
      }
    } catch (e) {
      console.error('Failed to load recent mints', e);
    }
  }, []);

  const addMint = (mint: string) => {
    if (!mint) return;
    setRecentMints(prev => {
      const filtered = prev.filter(m => m !== mint);
      const newMints = [mint, ...filtered].slice(0, MAX_MINTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMints));
      return newMints;
    });
  };

  return { recentMints, addMint };
}
