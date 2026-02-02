"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'super-dark' | 'super-light' | 'gold' | 'iron';

interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderColor: string;
  accentColor: string;
  hoverBg: string;
  goldPrimary?: string;
  goldSecondary?: string;
  goldHighlight?: string;
}

interface ThemeContextType {
  theme: Theme;
  themeColors: ThemeColors;
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

// Theme color configurations
const themeConfigs: Record<Theme, ThemeColors> = {
  'dark': {
    bgPrimary: '#0f0f0f',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2a2a2a',
    textPrimary: '#ffffff',
    textSecondary: '#b3b3b3',
    textTertiary: '#808080',
    borderColor: '#333333',
    accentColor: '#3b82f6',
    hoverBg: '#2a2a2a',
  },
  'super-dark': {
    bgPrimary: '#000000',
    bgSecondary: '#0a0a0a',
    bgTertiary: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    textTertiary: '#666666',
    borderColor: '#1a1a1a',
    accentColor: '#8b5cf6',
    hoverBg: '#1a1a1a',
  },
  'light': {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8f9fa',
    bgTertiary: '#e9ecef',
    textPrimary: '#000000',
    textSecondary: '#495057',
    textTertiary: '#6c757d',
    borderColor: '#dee2e6',
    accentColor: '#007bff',
    hoverBg: '#f8f9fa',
  },
  'super-light': {
    bgPrimary: '#ffffff',
    bgSecondary: '#fafafa',
    bgTertiary: '#f5f5f5',
    textPrimary: '#000000',
    textSecondary: '#333333',
    textTertiary: '#666666',
    borderColor: '#e0e0e0',
    accentColor: '#0066cc',
    hoverBg: '#fafafa',
  },
  'gold': {
    bgPrimary: '#0f0f0f',
    bgSecondary: '#161616',
    bgTertiary: '#1e1e1e',
    textPrimary: '#f5f5f5',
    textSecondary: '#d4d4d4',
    textTertiary: '#8a8a8a',
    borderColor: 'rgba(201, 162, 39, 0.15)',
    accentColor: '#c9a227',
    hoverBg: '#1e1e1e',
    goldPrimary: '#c9a227',
    goldSecondary: '#d4af37',
    goldHighlight: '#e6c547',
  },
  'iron': {
    bgPrimary: '#0f0f0f',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2a2a2a',
    textPrimary: '#ffffff',
    textSecondary: '#b3b3b3',
    textTertiary: '#808080',
    borderColor: '#333333',
    accentColor: '#6b7280',
    hoverBg: '#2a2a2a',
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [themeColors, setThemeColors] = useState<ThemeColors>(themeConfigs.dark);
  const [isChanging, setIsChanging] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && Object.keys(themeConfigs).includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
          setThemeColors(themeConfigs[savedTheme as Theme]);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Save theme to localStorage and update colors
  const setTheme = (newTheme: Theme) => {
    if (isChanging || newTheme === theme) return;
    
    setIsChanging(true);
    setThemeState(newTheme);
    setThemeColors(themeConfigs[newTheme]);
    
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
    
    // Small delay to prevent rapid changes
    setTimeout(() => setIsChanging(false), 100);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['dark', 'light', 'super-dark', 'super-light', 'gold', 'iron'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeColors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};