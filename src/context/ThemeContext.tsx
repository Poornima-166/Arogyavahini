import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isHighContrast: boolean;
  highContrast: boolean;
  toggleTheme: () => void;
  toggleHighContrast: () => void;
  setTheme: (theme: Theme) => void;
  setHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'arogyavahini_theme';
const HIGH_CONTRAST_STORAGE_KEY = 'arogyavahini_high_contrast';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const [isHighContrast, setIsHighContrastState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Apply classes and attributes to DOM elements
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isHighContrast) {
      root.classList.add('high-contrast');
      body.classList.add('high-contrast');
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-high-contrast', 'true');
      body.setAttribute('data-high-contrast', 'true');
      root.setAttribute('data-theme', 'high-contrast');
    } else {
      root.classList.remove('high-contrast');
      body.classList.remove('high-contrast');
      root.removeAttribute('data-high-contrast');
      body.removeAttribute('data-high-contrast');
      root.removeAttribute('data-theme');

      if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(isHighContrast));
    } catch {
      // ignore
    }
  }, [theme, isHighContrast]);

  // Global keyboard shortcut: Alt+H (or Ctrl+Alt+H) to rapidly toggle High Contrast Glare Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setIsHighContrastState((prev) => {
          const next = !prev;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(next ? [80, 40, 80] : [50]);
            } catch {
              // ignore
            }
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleHighContrast = () => {
    setIsHighContrastState((prev) => {
      const next = !prev;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(next ? [80, 40, 80] : [50]);
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setHighContrast = (enabled: boolean) => {
    setIsHighContrastState(enabled);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark' || isHighContrast,
        isHighContrast,
        highContrast: isHighContrast,
        toggleTheme,
        toggleHighContrast,
        setTheme,
        setHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
