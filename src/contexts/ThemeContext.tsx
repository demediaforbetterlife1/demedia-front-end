"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'super-dark' | 'super-light' | 'gold';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isChanging, setIsChanging] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['dark', 'light', 'super-dark', 'super-light', 'gold'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Save theme to localStorage and apply to document
  const setTheme = (newTheme: Theme) => {
    if (isChanging || newTheme === theme) return;
    
    setIsChanging(true);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Use requestAnimationFrame to prevent blocking the UI
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', newTheme);
      setTimeout(() => setIsChanging(false), 100);
    });
  };

  // Apply theme to document on theme change
  useEffect(() => {
    // Use requestAnimationFrame to prevent blocking the UI
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', theme);
    });
  }, [theme]);

  const toggleTheme = () => {
    const themes: Theme[] = ['dark', 'light', 'super-dark', 'super-light', 'gold'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
