"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'super-dark' | 'super-light' | 'gold' | 'iron';

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
    
    // Apply comprehensive theme styling
    applyThemeStyles(newTheme);
    
    // Use requestAnimationFrame to prevent blocking the UI
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', newTheme);
      setTimeout(() => setIsChanging(false), 100);
    });
  };

  // Apply comprehensive theme styles
  const applyThemeStyles = (theme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light', 'super-dark', 'super-light', 'gold');
    
    // Add new theme class
    root.classList.add(theme);
    
    // Apply theme-specific CSS variables
    switch (theme) {
      case 'dark':
        root.style.setProperty('--bg-primary', '#0f0f0f');
        root.style.setProperty('--bg-secondary', '#1a1a1a');
        root.style.setProperty('--bg-tertiary', '#2a2a2a');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#b3b3b3');
        root.style.setProperty('--text-tertiary', '#808080');
        root.style.setProperty('--border-color', '#333333');
        root.style.setProperty('--accent-color', '#3b82f6');
        root.style.setProperty('--hover-bg', '#2a2a2a');
        break;
        
      case 'super-dark':
        root.style.setProperty('--bg-primary', '#000000');
        root.style.setProperty('--bg-secondary', '#0a0a0a');
        root.style.setProperty('--bg-tertiary', '#1a1a1a');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#a0a0a0');
        root.style.setProperty('--text-tertiary', '#666666');
        root.style.setProperty('--border-color', '#1a1a1a');
        root.style.setProperty('--accent-color', '#8b5cf6');
        root.style.setProperty('--hover-bg', '#1a1a1a');
        break;
        
      case 'light':
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f8f9fa');
        root.style.setProperty('--bg-tertiary', '#e9ecef');
        root.style.setProperty('--text-primary', '#000000');
        root.style.setProperty('--text-secondary', '#495057');
        root.style.setProperty('--text-tertiary', '#6c757d');
        root.style.setProperty('--border-color', '#dee2e6');
        root.style.setProperty('--accent-color', '#007bff');
        root.style.setProperty('--hover-bg', '#f8f9fa');
        break;
        
      case 'super-light':
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#fafafa');
        root.style.setProperty('--bg-tertiary', '#f5f5f5');
        root.style.setProperty('--text-primary', '#000000');
        root.style.setProperty('--text-secondary', '#333333');
        root.style.setProperty('--text-tertiary', '#666666');
        root.style.setProperty('--border-color', '#e0e0e0');
        root.style.setProperty('--accent-color', '#0066cc');
        root.style.setProperty('--hover-bg', '#fafafa');
        break;
        
      case 'gold':
        root.style.setProperty('--bg-primary', '#1a1a1a');
        root.style.setProperty('--bg-secondary', '#2d2d2d');
        root.style.setProperty('--bg-tertiary', '#3a3a3a');
        root.style.setProperty('--text-primary', '#ffd700');
        root.style.setProperty('--text-secondary', '#ffed4e');
        root.style.setProperty('--text-tertiary', '#b8860b');
        root.style.setProperty('--border-color', '#4a4a4a');
        root.style.setProperty('--accent-color', '#ffd700');
        root.style.setProperty('--hover-bg', '#2d2d2d');
        break;
    }
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
