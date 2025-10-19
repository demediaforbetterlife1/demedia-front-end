import { Theme } from '@/contexts/ThemeContext';

export const getThemeClasses = (theme: Theme) => {
  const baseClasses = {
    // Background classes
    bgPrimary: 'bg-gray-900 dark:bg-gray-900',
    bgSecondary: 'bg-gray-800 dark:bg-gray-800',
    bgTertiary: 'bg-gray-700 dark:bg-gray-700',
    
    // Text classes
    textPrimary: 'text-white dark:text-white',
    textSecondary: 'text-gray-300 dark:text-gray-300',
    textTertiary: 'text-gray-400 dark:text-gray-400',
    
    // Border classes
    border: 'border-gray-600 dark:border-gray-600',
    borderLight: 'border-gray-500 dark:border-gray-500',
    
    // Hover classes
    hover: 'hover:bg-gray-700 dark:hover:bg-gray-700',
    hoverLight: 'hover:bg-gray-600 dark:hover:bg-gray-600',
    
    // Accent classes
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500',
  };

  switch (theme) {
    case 'dark':
      return {
        ...baseClasses,
        bgPrimary: 'bg-gray-900',
        bgSecondary: 'bg-gray-800',
        bgTertiary: 'bg-gray-700',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-300',
        textTertiary: 'text-gray-400',
        border: 'border-gray-600',
        hover: 'hover:bg-gray-700',
        accent: 'text-blue-400',
        accentBg: 'bg-blue-500',
      };
      
    case 'super-dark':
      return {
        ...baseClasses,
        bgPrimary: 'bg-black',
        bgSecondary: 'bg-gray-900',
        bgTertiary: 'bg-gray-800',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-200',
        textTertiary: 'text-gray-300',
        border: 'border-gray-700',
        hover: 'hover:bg-gray-800',
        accent: 'text-purple-400',
        accentBg: 'bg-purple-500',
      };
      
    case 'light':
      return {
        ...baseClasses,
        bgPrimary: 'bg-white',
        bgSecondary: 'bg-gray-50',
        bgTertiary: 'bg-gray-100',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600',
        textTertiary: 'text-gray-500',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-50',
        accent: 'text-blue-600',
        accentBg: 'bg-blue-500',
      };
      
    case 'super-light':
      return {
        ...baseClasses,
        bgPrimary: 'bg-white',
        bgSecondary: 'bg-gray-50',
        bgTertiary: 'bg-gray-100',
        textPrimary: 'text-black',
        textSecondary: 'text-gray-700',
        textTertiary: 'text-gray-600',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-50',
        accent: 'text-blue-700',
        accentBg: 'bg-blue-600',
      };
      
    case 'gold':
      return {
        ...baseClasses,
        bgPrimary: 'bg-gray-900',
        bgSecondary: 'bg-gray-800',
        bgTertiary: 'bg-gray-700',
        textPrimary: 'text-yellow-400',
        textSecondary: 'text-yellow-300',
        textTertiary: 'text-yellow-500',
        border: 'border-yellow-600',
        hover: 'hover:bg-gray-800',
        accent: 'text-yellow-400',
        accentBg: 'bg-yellow-500',
      };
      
    default:
      return baseClasses;
  }
};

export const getModalClasses = (theme: Theme) => {
  const baseClasses = {
    overlay: 'fixed inset-0 z-50 flex items-center justify-center',
    content: 'relative max-w-md w-full mx-4 rounded-lg shadow-xl',
    header: 'px-6 py-4 border-b',
    body: 'px-6 py-4',
    footer: 'px-6 py-4 border-t',
  };

  const themeClasses = getThemeClasses(theme);

  return {
    overlay: `${baseClasses.overlay} ${themeClasses.bgPrimary} bg-opacity-50`,
    content: `${baseClasses.content} ${themeClasses.bgSecondary} ${themeClasses.border}`,
    header: `${baseClasses.header} ${themeClasses.border}`,
    body: baseClasses.body,
    footer: `${baseClasses.footer} ${themeClasses.border}`,
  };
};

export const getButtonClasses = (theme: Theme, variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
  const themeClasses = getThemeClasses(theme);
  
  const variants = {
    primary: `${themeClasses.accentBg} text-white hover:opacity-90`,
    secondary: `${themeClasses.bgTertiary} ${themeClasses.textPrimary} hover:${themeClasses.hover}`,
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${variants[variant]}`;
};

export const getInputClasses = (theme: Theme) => {
  const themeClasses = getThemeClasses(theme);
  
  return `w-full px-3 py-2 rounded-lg ${themeClasses.bgTertiary} ${themeClasses.textPrimary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-blue-500`;
};

export const getCardClasses = (theme: Theme) => {
  const themeClasses = getThemeClasses(theme);
  
  return `rounded-lg ${themeClasses.bgSecondary} ${themeClasses.border} shadow-lg`;
};