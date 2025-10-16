"use client";

import { Theme } from "@/contexts/ThemeContext";

export interface EnhancedThemeClasses {
  // Background colors
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgAccent: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  
  // Border colors
  border: string;
  borderSecondary: string;
  borderAccent: string;
  
  // Interactive states
  hover: string;
  hoverSecondary: string;
  active: string;
  
  // Cards and surfaces
  card: string;
  cardSecondary: string;
  cardAccent: string;
  
  // Buttons
  button: string;
  buttonSecondary: string;
  buttonAccent: string;
  buttonDanger: string;
  
  // Inputs
  input: string;
  inputFocus: string;
  
  // Shadows
  shadow: string;
  shadowSecondary: string;
  shadowAccent: string;
  
  // Modals
  modal: string;
  modalOverlay: string;
  modalContent: string;
  
  // Posts specific
  postCard: string;
  postCardHover: string;
  postTransparent: string;
  
  // Gradients
  gradient: string;
  gradientSecondary: string;
  gradientAccent: string;
  
  // Profile specific
  accentBg: string;
  coverGradient: string;
}

export const getEnhancedThemeClasses = (theme: Theme): EnhancedThemeClasses => {
  switch (theme) {
    case 'light':
      return {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        bgSecondary: 'bg-white',
        bgTertiary: 'bg-gray-50',
        bgAccent: 'bg-blue-50',
        
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
        textAccent: 'text-blue-600',
        
        border: 'border-gray-200',
        borderSecondary: 'border-gray-300',
        borderAccent: 'border-blue-300',
        
        hover: 'hover:bg-gray-50',
        hoverSecondary: 'hover:bg-gray-100',
        active: 'active:bg-gray-100',
        
        card: 'bg-white/90 backdrop-blur-sm',
        cardSecondary: 'bg-gray-50/80 backdrop-blur-sm',
        cardAccent: 'bg-blue-50/80 backdrop-blur-sm',
        
        button: 'bg-blue-500 hover:bg-blue-600 text-white',
        buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
        buttonAccent: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonDanger: 'bg-red-500 hover:bg-red-600 text-white',
        
        input: 'bg-white/80 border-gray-300 backdrop-blur-sm',
        inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
        
        shadow: 'shadow-lg',
        shadowSecondary: 'shadow-md',
        shadowAccent: 'shadow-blue-500/20',
        
        modal: 'bg-white/95 backdrop-blur-md',
        modalOverlay: 'bg-black/20 backdrop-blur-sm',
        modalContent: 'bg-white/90 backdrop-blur-sm',
        
        postCard: 'bg-white/90 backdrop-blur-sm',
        postCardHover: 'hover:bg-white/95',
        postTransparent: 'bg-white/80 backdrop-blur-sm',
        
        gradient: 'bg-gradient-to-br from-blue-500 to-purple-600',
        gradientSecondary: 'bg-gradient-to-br from-gray-100 to-gray-200',
        gradientAccent: 'bg-gradient-to-br from-blue-400 to-blue-600',
        
        accentBg: 'bg-gradient-to-r from-blue-50 to-purple-50',
        coverGradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20'
      };
      
    case 'super-light':
      return {
        bg: 'bg-gradient-to-br from-white to-gray-50',
        bgSecondary: 'bg-white',
        bgTertiary: 'bg-gray-50',
        bgAccent: 'bg-blue-50',
        
        text: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
        textAccent: 'text-blue-700',
        
        border: 'border-gray-200',
        borderSecondary: 'border-gray-300',
        borderAccent: 'border-blue-400',
        
        hover: 'hover:bg-gray-50',
        hoverSecondary: 'hover:bg-gray-100',
        active: 'active:bg-gray-100',
        
        card: 'bg-white/95 backdrop-blur-sm',
        cardSecondary: 'bg-gray-50/90 backdrop-blur-sm',
        cardAccent: 'bg-blue-50/90 backdrop-blur-sm',
        
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
        buttonAccent: 'bg-blue-700 hover:bg-blue-800 text-white',
        buttonDanger: 'bg-red-600 hover:bg-red-700 text-white',
        
        input: 'bg-white/90 border-gray-200 backdrop-blur-sm',
        inputFocus: 'focus:border-blue-600 focus:ring-blue-600/20',
        
        shadow: 'shadow-xl',
        shadowSecondary: 'shadow-lg',
        shadowAccent: 'shadow-blue-600/20',
        
        modal: 'bg-white/98 backdrop-blur-md',
        modalOverlay: 'bg-black/10 backdrop-blur-sm',
        modalContent: 'bg-white/95 backdrop-blur-sm',
        
        postCard: 'bg-white/95 backdrop-blur-sm',
        postCardHover: 'hover:bg-white/98',
        postTransparent: 'bg-white/85 backdrop-blur-sm',
        
        gradient: 'bg-gradient-to-br from-blue-600 to-purple-700',
        gradientSecondary: 'bg-gradient-to-br from-gray-50 to-gray-100',
        gradientAccent: 'bg-gradient-to-br from-blue-500 to-blue-700',
        
        accentBg: 'bg-gradient-to-r from-blue-50 to-purple-50',
        coverGradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20'
      };
      
    case 'dark':
      return {
        bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
        bgSecondary: 'bg-gray-800',
        bgTertiary: 'bg-gray-700',
        bgAccent: 'bg-blue-900/30',
        
        text: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
        textAccent: 'text-blue-400',
        
        border: 'border-gray-700',
        borderSecondary: 'border-gray-600',
        borderAccent: 'border-blue-500',
        
        hover: 'hover:bg-gray-700/50',
        hoverSecondary: 'hover:bg-gray-600/50',
        active: 'active:bg-gray-600/50',
        
        card: 'bg-gray-800/90 backdrop-blur-sm',
        cardSecondary: 'bg-gray-700/80 backdrop-blur-sm',
        cardAccent: 'bg-blue-900/40 backdrop-blur-sm',
        
        button: 'bg-blue-500 hover:bg-blue-600 text-white',
        buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200',
        buttonAccent: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonDanger: 'bg-red-500 hover:bg-red-600 text-white',
        
        input: 'bg-gray-700/80 border-gray-600 backdrop-blur-sm',
        inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
        
        shadow: 'shadow-2xl',
        shadowSecondary: 'shadow-xl',
        shadowAccent: 'shadow-blue-500/20',
        
        modal: 'bg-gray-800/95 backdrop-blur-md',
        modalOverlay: 'bg-black/60 backdrop-blur-sm',
        modalContent: 'bg-gray-800/90 backdrop-blur-sm',
        
        postCard: 'bg-gray-800/90 backdrop-blur-sm',
        postCardHover: 'hover:bg-gray-800/95',
        postTransparent: 'bg-gray-800/80 backdrop-blur-sm',
        
        gradient: 'bg-gradient-to-br from-blue-500 to-purple-600',
        gradientSecondary: 'bg-gradient-to-br from-gray-700 to-gray-800',
        gradientAccent: 'bg-gradient-to-br from-blue-400 to-blue-600',
        
        accentBg: 'bg-gradient-to-r from-blue-900/40 to-purple-900/40',
        coverGradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20'
      };
      
    case 'super-dark':
      return {
        bg: 'bg-gradient-to-br from-black to-gray-900',
        bgSecondary: 'bg-gray-900',
        bgTertiary: 'bg-gray-800',
        bgAccent: 'bg-blue-900/20',
        
        text: 'text-gray-100',
        textSecondary: 'text-gray-400',
        textMuted: 'text-gray-500',
        textAccent: 'text-blue-400',
        
        border: 'border-gray-800/50',
        borderSecondary: 'border-gray-700/50',
        borderAccent: 'border-blue-500/50',
        
        hover: 'hover:bg-gray-800/30',
        hoverSecondary: 'hover:bg-gray-700/30',
        active: 'active:bg-gray-700/30',
        
        card: 'bg-black/60 backdrop-blur-sm',
        cardSecondary: 'bg-gray-900/60 backdrop-blur-sm',
        cardAccent: 'bg-blue-900/30 backdrop-blur-sm',
        
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300',
        buttonAccent: 'bg-blue-700 hover:bg-blue-800 text-white',
        buttonDanger: 'bg-red-600 hover:bg-red-700 text-white',
        
        input: 'bg-black/40 border-gray-700/50 backdrop-blur-sm',
        inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
        
        shadow: 'shadow-2xl shadow-black/50',
        shadowSecondary: 'shadow-xl shadow-black/30',
        shadowAccent: 'shadow-blue-500/20',
        
        modal: 'bg-black/80 backdrop-blur-md',
        modalOverlay: 'bg-black/80 backdrop-blur-sm',
        modalContent: 'bg-black/70 backdrop-blur-sm',
        
        postCard: 'bg-black/40 backdrop-blur-sm border border-gray-800/30',
        postCardHover: 'hover:bg-black/50',
        postTransparent: 'bg-black/20 backdrop-blur-sm border border-gray-800/20',
        
        gradient: 'bg-gradient-to-br from-blue-600 to-purple-700',
        gradientSecondary: 'bg-gradient-to-br from-gray-800 to-gray-900',
        gradientAccent: 'bg-gradient-to-br from-blue-500 to-blue-700',
        
        accentBg: 'bg-gradient-to-r from-blue-900/30 to-purple-900/30',
        coverGradient: 'from-blue-500/15 via-purple-500/15 to-pink-500/15'
      };
      
    case 'gold':
      return {
        bg: 'bg-gradient-to-br from-yellow-900 via-yellow-800 to-amber-900',
        bgSecondary: 'bg-yellow-900/40',
        bgTertiary: 'bg-yellow-800/30',
        bgAccent: 'bg-amber-900/40',
        
        text: 'text-yellow-100',
        textSecondary: 'text-yellow-200',
        textMuted: 'text-yellow-300',
        textAccent: 'text-yellow-400',
        
        border: 'border-yellow-700/50',
        borderSecondary: 'border-yellow-600/50',
        borderAccent: 'border-yellow-500/50',
        
        hover: 'hover:bg-yellow-800/20',
        hoverSecondary: 'hover:bg-yellow-700/20',
        active: 'active:bg-yellow-700/20',
        
        card: 'bg-gray-600/30 backdrop-blur-sm',
        cardSecondary: 'bg-gray-700/25 backdrop-blur-sm',
        cardAccent: 'bg-yellow-800/40 backdrop-blur-sm',
        
        button: 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100',
        buttonSecondary: 'bg-yellow-700/30 hover:bg-yellow-600/30 text-yellow-200',
        buttonAccent: 'bg-yellow-700 hover:bg-yellow-800 text-yellow-100',
        buttonDanger: 'bg-red-600 hover:bg-red-700 text-white',
        
        input: 'bg-yellow-800/30 border-yellow-600/30 backdrop-blur-sm',
        inputFocus: 'focus:border-yellow-500 focus:ring-yellow-500/20',
        
        shadow: 'shadow-2xl shadow-yellow-500/20',
        shadowSecondary: 'shadow-xl shadow-yellow-500/10',
        shadowAccent: 'shadow-yellow-500/30',
        
        modal: 'bg-yellow-900/80 backdrop-blur-md',
        modalOverlay: 'bg-black/60 backdrop-blur-sm',
        modalContent: 'bg-yellow-900/70 backdrop-blur-sm',
        
        postCard: 'bg-gray-600/30 backdrop-blur-sm',
        postCardHover: 'hover:bg-gray-600/40',
        postTransparent: 'bg-gray-500/25 backdrop-blur-sm',
        
        gradient: 'bg-gradient-to-br from-yellow-600 to-amber-700',
        gradientSecondary: 'bg-gradient-to-br from-yellow-800 to-yellow-900',
        gradientAccent: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
        
        accentBg: 'bg-gradient-to-r from-yellow-800/40 to-amber-800/40',
        coverGradient: 'from-yellow-500/20 via-amber-500/20 to-orange-500/20'
      };
      
    default:
      return {
        bg: 'bg-gray-900',
        bgSecondary: 'bg-gray-800',
        bgTertiary: 'bg-gray-700',
        bgAccent: 'bg-blue-900/30',
        
        text: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
        textAccent: 'text-blue-400',
        
        border: 'border-gray-700',
        borderSecondary: 'border-gray-600',
        borderAccent: 'border-blue-500',
        
        hover: 'hover:bg-gray-700',
        hoverSecondary: 'hover:bg-gray-600',
        active: 'active:bg-gray-600',
        
        card: 'bg-gray-800',
        cardSecondary: 'bg-gray-700',
        cardAccent: 'bg-blue-900/40',
        
        button: 'bg-blue-500 hover:bg-blue-600 text-white',
        buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200',
        buttonAccent: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonDanger: 'bg-red-500 hover:bg-red-600 text-white',
        
        input: 'bg-gray-700 border-gray-600',
        inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
        
        shadow: 'shadow-2xl',
        shadowSecondary: 'shadow-xl',
        shadowAccent: 'shadow-blue-500/20',
        
        modal: 'bg-gray-800/95 backdrop-blur-md',
        modalOverlay: 'bg-black/60 backdrop-blur-sm',
        modalContent: 'bg-gray-800/90 backdrop-blur-sm',
        
        postCard: 'bg-gray-800/90 backdrop-blur-sm',
        postCardHover: 'hover:bg-gray-800/95',
        postTransparent: 'bg-gray-800/80 backdrop-blur-sm',
        
        gradient: 'bg-gradient-to-br from-blue-500 to-purple-600',
        gradientSecondary: 'bg-gradient-to-br from-gray-700 to-gray-800',
        gradientAccent: 'bg-gradient-to-br from-blue-400 to-blue-600',
        
        accentBg: 'bg-gradient-to-r from-blue-900/40 to-purple-900/40',
        coverGradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20'
      };
  }
};

export const getModalThemeClasses = (theme: Theme) => {
  const baseClasses = getEnhancedThemeClasses(theme);
  
  return {
    ...baseClasses,
    modal: `${baseClasses.modal} border ${baseClasses.border}`,
    modalOverlay: `${baseClasses.modalOverlay}`,
    modalContent: `${baseClasses.modalContent} border ${baseClasses.border}`,
    modalHeader: `${baseClasses.text} border-b ${baseClasses.border}`,
    modalFooter: `${baseClasses.bgSecondary} border-t ${baseClasses.border}`,
    modalClose: `${baseClasses.textMuted} hover:${baseClasses.text} transition-colors`,
    modalButton: `${baseClasses.button} transition-all duration-200`,
    modalButtonSecondary: `${baseClasses.buttonSecondary} transition-all duration-200`
  };
};

export const getPostThemeClasses = (theme: Theme) => {
  const baseClasses = getEnhancedThemeClasses(theme);
  
  return {
    ...baseClasses,
    // Modern, consistent post styling
    postCard: theme === 'super-dark' 
      ? 'bg-super-dark/40 backdrop-blur-md border border-gray-800/40 shadow-2xl shadow-black/50' 
      : theme === 'gold' 
        ? 'bg-gradient-to-br from-yellow-900/20 via-amber-900/10 to-yellow-800/20 backdrop-blur-md border border-yellow-700/40 shadow-2xl shadow-yellow-500/20' 
        : theme === 'dark'
          ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/60 shadow-xl'
          : theme === 'light'
            ? 'bg-white/98 backdrop-blur-sm border border-gray-200/60 shadow-lg'
            : 'bg-white/98 backdrop-blur-sm border border-gray-200/60 shadow-lg',
    
    postCardHover: theme === 'super-dark' 
      ? 'hover:bg-black/30 hover:border-gray-700/50' 
      : theme === 'gold' 
        ? 'hover:bg-gray-600/30 hover:border-yellow-600/50' 
        : theme === 'dark'
          ? 'hover:bg-gray-800/95 hover:border-gray-600/70'
          : 'hover:bg-white/98 hover:border-gray-300/70',
    
    postHeader: theme === 'super-dark'
      ? 'bg-black/10 border-b border-gray-800/30'
      : theme === 'gold'
        ? 'bg-yellow-900/20 border-b border-yellow-700/30'
        : theme === 'dark'
          ? 'bg-gray-800/50 border-b border-gray-700/50'
          : 'bg-gray-50/50 border-b border-gray-200/50',
    
    postContent: `${baseClasses.text} leading-relaxed`,
    postMeta: `${baseClasses.textSecondary} text-sm`,
    postActions: theme === 'super-dark'
      ? 'bg-black/10 border-t border-gray-800/30'
      : theme === 'gold'
        ? 'bg-yellow-900/20 border-t border-yellow-700/30'
        : theme === 'dark'
          ? 'bg-gray-800/50 border-t border-gray-700/50'
          : 'bg-gray-50/50 border-t border-gray-200/50',
    
    postButton: theme === 'super-dark'
      ? 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200'
      : theme === 'gold'
        ? 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100 px-4 py-2 rounded-lg transition-all duration-200'
        : theme === 'dark'
          ? 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200'
          : 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200',
    
    postButtonSecondary: theme === 'super-dark'
      ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg transition-all duration-200'
      : theme === 'gold'
        ? 'bg-yellow-800/30 hover:bg-yellow-700/30 text-yellow-200 px-4 py-2 rounded-lg transition-all duration-200'
        : theme === 'dark'
          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200 px-4 py-2 rounded-lg transition-all duration-200'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-all duration-200',
    
    postInput: `${baseClasses.input} ${baseClasses.inputFocus} transition-all duration-200`,
    postProfile: theme === 'super-dark'
      ? 'w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg'
      : theme === 'gold'
        ? 'w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-yellow-100 font-semibold shadow-lg'
        : 'w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg'
  };
};
