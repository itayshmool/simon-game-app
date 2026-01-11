/**
 * Theme Store
 * 
 * Manages light/dark mode with localStorage persistence.
 * Detects system preference on first load.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

/**
 * Get initial theme from localStorage or system preference
 */
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
  // Check localStorage first
  const saved = localStorage.getItem('simon-game-theme');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.state?.theme || 'light';
    } catch {
      // Invalid JSON, ignore
    }
  }
  
  // Fall back to system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

/**
 * Apply theme by toggling 'dark' class on document root
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      
      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        applyTheme(newTheme);
      },
      
      initTheme: () => {
        const { theme } = get();
        applyTheme(theme);
      },
    }),
    {
      name: 'simon-game-theme',
    }
  )
);
