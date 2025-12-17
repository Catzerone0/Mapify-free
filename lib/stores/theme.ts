import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  subscribeWithSelector((set, get) => ({
    theme: 'system',
    resolvedTheme: 'light',

    setTheme: (theme) => {
      set({ theme });
      // Update document class for Tailwind dark mode
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? 'dark' 
            : 'light';
          root.classList.add(systemTheme);
          set({ resolvedTheme: systemTheme });
        } else {
          root.classList.add(theme);
          set({ resolvedTheme: theme });
        }
      }
    },

    toggleTheme: () => {
      const currentTheme = get().theme;
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      get().setTheme(newTheme);
    },
  }))
);