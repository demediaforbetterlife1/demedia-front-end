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
    case "light":
      return {
        bg: "bg-gradient-to-br from-gray-50 to-gray-100",
        bgSecondary: "bg-white",
        bgTertiary: "bg-gray-50",
        bgAccent: "bg-blue-50",

        text: "text-gray-900",
        textSecondary: "text-gray-600",
        textMuted: "text-gray-500",
        textAccent: "text-blue-600",

        border: "border-gray-200",
        borderSecondary: "border-gray-300",
        borderAccent: "border-blue-300",

        hover: "hover:bg-gray-50",
        hoverSecondary: "hover:bg-gray-100",
        active: "active:bg-gray-100",

        card: "bg-white/90 backdrop-blur-sm",
        cardSecondary: "bg-gray-50/80 backdrop-blur-sm",
        cardAccent: "bg-blue-50/80 backdrop-blur-sm",

        button: "bg-blue-500 hover:bg-blue-600 text-white",
        buttonSecondary: "bg-gray-200 hover:bg-gray-300 text-gray-700",
        buttonAccent: "bg-blue-600 hover:bg-blue-700 text-white",
        buttonDanger: "bg-red-500 hover:bg-red-600 text-white",

        input: "bg-white/80 border-gray-300 backdrop-blur-sm",
        inputFocus: "focus:border-blue-500 focus:ring-blue-500/20",

        shadow: "shadow-lg",
        shadowSecondary: "shadow-md",
        shadowAccent: "shadow-blue-500/20",

        modal: "bg-white/95 backdrop-blur-md",
        modalOverlay: "bg-black/20 backdrop-blur-sm",
        modalContent: "bg-white/90 backdrop-blur-sm",

        postCard: "bg-white/90 backdrop-blur-sm",
        postCardHover: "hover:bg-white/95",
        postTransparent: "bg-white/80 backdrop-blur-sm",

        gradient: "bg-gradient-to-br from-blue-500 to-purple-600",
        gradientSecondary: "bg-gradient-to-br from-gray-100 to-gray-200",
        gradientAccent: "bg-gradient-to-br from-blue-400 to-blue-600",

        accentBg: "bg-gradient-to-r from-blue-50 to-purple-50",
        coverGradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
      };

    case "super-light":
      return {
        bg: "bg-gradient-to-br from-white via-slate-50/50 to-sky-50/30",
        bgSecondary: "bg-white/95 backdrop-blur-xl",
        bgTertiary: "bg-gradient-to-br from-white to-blue-50/40",
        bgAccent:
          "bg-gradient-to-br from-blue-50/70 to-indigo-50/70 backdrop-blur-sm",

        text: "text-slate-800",
        textSecondary: "text-slate-600",
        textMuted: "text-slate-500",
        textAccent: "text-blue-700",

        border: "border-slate-200/60",
        borderSecondary: "border-blue-200/60",
        borderAccent: "border-indigo-300/60",

        hover:
          "hover:bg-white/80 hover:backdrop-blur-lg transition-all duration-300",
        hoverSecondary:
          "hover:bg-blue-50/50 hover:backdrop-blur-md transition-all duration-300",
        active:
          "active:bg-blue-50/60 active:scale-95 transition-all duration-150",

        card: "bg-white/90 backdrop-blur-xl shadow-lg shadow-blue-100/50 border border-white/50",
        cardSecondary:
          "bg-gradient-to-br from-white/95 to-blue-50/30 backdrop-blur-xl",
        cardAccent:
          "bg-gradient-to-br from-blue-50/90 to-indigo-50/40 backdrop-blur-lg",

        button:
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25",
        buttonSecondary:
          "bg-white/80 hover:bg-white/90 text-slate-700 border border-slate-200/60 backdrop-blur-sm",
        buttonAccent:
          "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white",
        buttonDanger:
          "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white",

        input: "bg-white/80 border-slate-200/60 backdrop-blur-sm shadow-inner",
        inputFocus:
          "focus:border-blue-400 focus:ring-blue-400/20 focus:bg-white/90",

        shadow: "shadow-xl shadow-slate-200/60",
        shadowSecondary: "shadow-lg shadow-blue-100/40",
        shadowAccent: "shadow-lg shadow-indigo-200/50",

        modal: "bg-white/95 backdrop-blur-2xl border border-white/60",
        modalOverlay: "bg-slate-100/20 backdrop-blur-sm",
        modalContent: "bg-white/90 backdrop-blur-xl",

        postCard:
          "bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-100/80 border border-white/60",
        postCardHover:
          "hover:bg-white/95 hover:shadow-xl hover:shadow-blue-100/30 hover:-translate-y-1 transition-all duration-300",
        postTransparent: "bg-white/80 backdrop-blur-lg border border-white/40",

        gradient:
          "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
        gradientSecondary:
          "bg-gradient-to-br from-white via-slate-50 to-blue-50",
        gradientAccent:
          "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600",

        accentBg:
          "bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 backdrop-blur-sm",
        coverGradient: "from-blue-500/15 via-indigo-500/10 to-purple-500/15",
      };

    case "dark":
      return {
        bg: "bg-gradient-to-br from-gray-900 to-gray-800",
        bgSecondary: "bg-gray-800",
        bgTertiary: "bg-gray-700",
        bgAccent: "bg-blue-900/30",

        text: "text-white",
        textSecondary: "text-gray-300",
        textMuted: "text-gray-400",
        textAccent: "text-blue-400",

        border: "border-gray-700",
        borderSecondary: "border-gray-600",
        borderAccent: "border-blue-500",

        hover: "hover:bg-gray-700/50",
        hoverSecondary: "hover:bg-gray-600/50",
        active: "active:bg-gray-600/50",

        card: "bg-gray-800/90 backdrop-blur-sm",
        cardSecondary: "bg-gray-700/80 backdrop-blur-sm",
        cardAccent: "bg-blue-900/40 backdrop-blur-sm",

        button: "bg-blue-500 hover:bg-blue-600 text-white",
        buttonSecondary: "bg-gray-600 hover:bg-gray-500 text-gray-200",
        buttonAccent: "bg-blue-600 hover:bg-blue-700 text-white",
        buttonDanger: "bg-red-500 hover:bg-red-600 text-white",

        input: "bg-gray-700/80 border-gray-600 backdrop-blur-sm",
        inputFocus: "focus:border-blue-500 focus:ring-blue-500/20",

        shadow: "shadow-2xl",
        shadowSecondary: "shadow-xl",
        shadowAccent: "shadow-blue-500/20",

        modal: "bg-gray-800/95 backdrop-blur-md",
        modalOverlay: "bg-black/60 backdrop-blur-sm",
        modalContent: "bg-gray-800/90 backdrop-blur-sm",

        postCard: "bg-gray-800/90 backdrop-blur-sm",
        postCardHover: "hover:bg-gray-800/95",
        postTransparent: "bg-gray-800/80 backdrop-blur-sm",

        gradient: "bg-gradient-to-br from-blue-500 to-purple-600",
        gradientSecondary: "bg-gradient-to-br from-gray-700 to-gray-800",
        gradientAccent: "bg-gradient-to-br from-blue-400 to-blue-600",

        accentBg: "bg-gradient-to-r from-blue-900/40 to-purple-900/40",
        coverGradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
      };

    case "super-dark":
      return {
        bg: "bg-gradient-to-br from-black via-slate-950 to-indigo-950/30",
        bgSecondary: "bg-slate-950/90 backdrop-blur-xl",
        bgTertiary:
          "bg-gradient-to-br from-slate-900/80 to-indigo-950/60 backdrop-blur-lg",
        bgAccent:
          "bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-md",

        text: "text-slate-100",
        textSecondary: "text-slate-300",
        textMuted: "text-slate-400",
        textAccent: "text-indigo-400",

        border: "border-slate-800/60",
        borderSecondary: "border-indigo-800/40",
        borderAccent: "border-purple-500/60",

        hover:
          "hover:bg-slate-900/60 hover:backdrop-blur-xl transition-all duration-300",
        hoverSecondary:
          "hover:bg-indigo-950/40 hover:backdrop-blur-lg transition-all duration-300",
        active:
          "active:bg-purple-950/40 active:scale-95 transition-all duration-150",

        card: "bg-slate-950/60 backdrop-blur-2xl border border-slate-800/40 shadow-2xl shadow-black/60",
        cardSecondary:
          "bg-gradient-to-br from-slate-950/80 to-indigo-950/40 backdrop-blur-xl",
        cardAccent:
          "bg-gradient-to-br from-indigo-950/60 to-purple-950/40 backdrop-blur-lg",

        button:
          "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25",
        buttonSecondary:
          "bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/50 backdrop-blur-sm",
        buttonAccent:
          "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white",
        buttonDanger:
          "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white",

        input:
          "bg-slate-950/40 border-slate-700/60 backdrop-blur-sm text-slate-200",
        inputFocus:
          "focus:border-indigo-500 focus:ring-indigo-500/30 focus:bg-slate-950/60",

        shadow: "shadow-2xl shadow-black/80",
        shadowSecondary: "shadow-xl shadow-indigo-900/40",
        shadowAccent: "shadow-lg shadow-purple-500/30",

        modal: "bg-slate-950/90 backdrop-blur-3xl border border-slate-800/60",
        modalOverlay: "bg-black/60 backdrop-blur-md",
        modalContent: "bg-slate-950/80 backdrop-blur-2xl",

        postCard:
          "bg-slate-950/50 backdrop-blur-2xl border border-slate-800/30 shadow-xl shadow-black/40",
        postCardHover:
          "hover:bg-slate-950/70 hover:border-indigo-800/40 hover:shadow-2xl hover:shadow-indigo-900/30 hover:-translate-y-1 transition-all duration-300",
        postTransparent:
          "bg-slate-950/30 backdrop-blur-xl border border-slate-800/20",

        gradient:
          "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700",
        gradientSecondary:
          "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950",
        gradientAccent:
          "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600",

        accentBg:
          "bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-pink-950/50 backdrop-blur-sm",
        coverGradient: "from-indigo-500/20 via-purple-500/15 to-pink-500/20",
      };

    case "gold":
      return {
        bg: "bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950",
        bgSecondary: "bg-amber-950/80 backdrop-blur-xl",
        bgTertiary:
          "bg-gradient-to-br from-yellow-950/70 to-orange-950/60 backdrop-blur-lg",
        bgAccent:
          "bg-gradient-to-br from-amber-900/60 to-yellow-800/50 backdrop-blur-md",

        text: "text-amber-50",
        textSecondary: "text-amber-100",
        textMuted: "text-amber-200",
        textAccent: "text-yellow-300",

        border: "border-amber-800/60",
        borderSecondary: "border-yellow-700/50",
        borderAccent: "border-orange-600/60",

        hover:
          "hover:bg-amber-900/40 hover:backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20",
        hoverSecondary:
          "hover:bg-yellow-900/30 hover:backdrop-blur-lg transition-all duration-300",
        active:
          "active:bg-orange-900/40 active:scale-95 transition-all duration-150",

        card: "bg-amber-950/60 backdrop-blur-2xl border border-amber-800/40 shadow-2xl shadow-amber-900/40",
        cardSecondary:
          "bg-gradient-to-br from-amber-950/70 to-yellow-950/50 backdrop-blur-xl",
        cardAccent:
          "bg-gradient-to-br from-yellow-900/60 to-amber-800/50 backdrop-blur-lg",

        button:
          "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-amber-950 shadow-lg shadow-amber-500/30 font-semibold",
        buttonSecondary:
          "bg-amber-900/50 hover:bg-amber-800/60 text-amber-100 border border-amber-700/60 backdrop-blur-sm",
        buttonAccent:
          "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-amber-950",
        buttonDanger:
          "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white",

        input:
          "bg-amber-950/40 border-amber-700/60 backdrop-blur-sm text-amber-100 placeholder:text-amber-300",
        inputFocus:
          "focus:border-yellow-500 focus:ring-yellow-500/30 focus:bg-amber-950/60",

        shadow: "shadow-2xl shadow-amber-900/60",
        shadowSecondary: "shadow-xl shadow-yellow-800/40",
        shadowAccent: "shadow-lg shadow-orange-600/40",

        modal: "bg-amber-950/90 backdrop-blur-3xl border border-amber-800/60",
        modalOverlay: "bg-black/50 backdrop-blur-md",
        modalContent: "bg-amber-950/80 backdrop-blur-2xl",

        postCard:
          "bg-amber-950/50 backdrop-blur-2xl border border-amber-800/30 shadow-xl shadow-amber-900/30",
        postCardHover:
          "hover:bg-amber-950/70 hover:border-yellow-700/40 hover:shadow-2xl hover:shadow-amber-600/30 hover:-translate-y-1 transition-all duration-300",
        postTransparent:
          "bg-amber-950/30 backdrop-blur-xl border border-amber-800/20",

        gradient:
          "bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600",
        gradientSecondary:
          "bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950",
        gradientAccent:
          "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500",

        accentBg:
          "bg-gradient-to-r from-amber-900/50 via-yellow-800/40 to-orange-900/50 backdrop-blur-sm",
        coverGradient: "from-amber-500/25 via-yellow-500/20 to-orange-500/25",
      };

    case "iron":
      return {
        bg: "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900",
        bgSecondary: "bg-gray-700/40",
        bgTertiary: "bg-gray-600/30",
        bgAccent: "bg-gray-800/40",

        text: "text-gray-300",
        textSecondary: "text-gray-400",
        textMuted: "text-gray-500",
        textAccent: "text-gray-200",

        border: "border-gray-600/50",
        borderSecondary: "border-gray-500/50",
        borderAccent: "border-gray-400/50",

        hover: "hover:bg-gray-700/20",
        hoverSecondary: "hover:bg-gray-600/20",
        active: "active:bg-gray-600/20",

        card: "bg-gray-600/30 backdrop-blur-sm",
        cardSecondary: "bg-gray-700/25 backdrop-blur-sm",
        cardAccent: "bg-gray-800/40 backdrop-blur-sm",

        button: "bg-gray-600 hover:bg-gray-700 text-gray-100",
        buttonSecondary: "bg-gray-700/30 hover:bg-gray-600/30 text-gray-200",
        buttonAccent: "bg-gray-700 hover:bg-gray-800 text-gray-100",
        buttonDanger: "bg-red-600 hover:bg-red-700 text-white",

        input: "bg-gray-800/30 border-gray-600/30 backdrop-blur-sm",
        inputFocus: "focus:border-gray-500 focus:ring-gray-500/20",

        shadow: "shadow-2xl shadow-gray-500/20",
        shadowSecondary: "shadow-xl shadow-gray-500/10",
        shadowAccent: "shadow-gray-500/30",

        modal: "bg-gray-900/80 backdrop-blur-md",
        modalOverlay: "bg-black/60 backdrop-blur-sm",
        modalContent: "bg-gray-900/70 backdrop-blur-sm",

        postCard: "bg-gray-600/30 backdrop-blur-sm",
        postCardHover: "hover:bg-gray-600/40",
        postTransparent: "bg-gray-500/25 backdrop-blur-sm",

        gradient: "bg-gradient-to-br from-gray-600 to-gray-800",
        gradientSecondary: "bg-gradient-to-br from-gray-700 to-gray-900",
        gradientAccent: "bg-gradient-to-br from-gray-500 to-gray-700",

        accentBg: "bg-gradient-to-r from-gray-800/40 to-gray-700/40",
        coverGradient: "from-gray-500/20 via-gray-600/20 to-gray-700/20",
      };

    default:
      return {
        bg: "bg-gray-900",
        bgSecondary: "bg-gray-800",
        bgTertiary: "bg-gray-700",
        bgAccent: "bg-blue-900/30",

        text: "text-white",
        textSecondary: "text-gray-300",
        textMuted: "text-gray-400",
        textAccent: "text-blue-400",

        border: "border-gray-700",
        borderSecondary: "border-gray-600",
        borderAccent: "border-blue-500",

        hover: "hover:bg-gray-700",
        hoverSecondary: "hover:bg-gray-600",
        active: "active:bg-gray-600",

        card: "bg-gray-800",
        cardSecondary: "bg-gray-700",
        cardAccent: "bg-blue-900/40",

        button: "bg-blue-500 hover:bg-blue-600 text-white",
        buttonSecondary: "bg-gray-600 hover:bg-gray-500 text-gray-200",
        buttonAccent: "bg-blue-600 hover:bg-blue-700 text-white",
        buttonDanger: "bg-red-500 hover:bg-red-600 text-white",

        input: "bg-gray-700 border-gray-600",
        inputFocus: "focus:border-blue-500 focus:ring-blue-500/20",

        shadow: "shadow-2xl",
        shadowSecondary: "shadow-xl",
        shadowAccent: "shadow-blue-500/20",

        modal: "bg-gray-800/95 backdrop-blur-md",
        modalOverlay: "bg-black/60 backdrop-blur-sm",
        modalContent: "bg-gray-800/90 backdrop-blur-sm",

        postCard: "bg-gray-800/90 backdrop-blur-sm",
        postCardHover: "hover:bg-gray-800/95",
        postTransparent: "bg-gray-800/80 backdrop-blur-sm",

        gradient: "bg-gradient-to-br from-blue-500 to-purple-600",
        gradientSecondary: "bg-gradient-to-br from-gray-700 to-gray-800",
        gradientAccent: "bg-gradient-to-br from-blue-400 to-blue-600",

        accentBg: "bg-gradient-to-r from-blue-900/40 to-purple-900/40",
        coverGradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
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
    modalButtonSecondary: `${baseClasses.buttonSecondary} transition-all duration-200`,
  };
};

export const getPostThemeClasses = (theme: Theme) => {
  const baseClasses = getEnhancedThemeClasses(theme);

  return {
    ...baseClasses,
    // Modern, consistent post styling
    postCard:
      theme === "super-dark"
        ? "bg-black/40 backdrop-blur-md border border-gray-800/40 shadow-2xl shadow-black/50 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-800/20 before:via-gray-700/10 before:to-gray-800/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700 before:animate-pulse"
        : theme === "gold"
          ? "bg-gray-600/30 backdrop-blur-md border border-gray-500/40 shadow-2xl shadow-gray-500/20 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-500/20 before:via-gray-400/10 before:to-gray-500/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700 before:animate-pulse"
          : theme === "dark"
            ? "bg-gray-800/95 backdrop-blur-sm border border-gray-700/60 shadow-xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-600/10 before:via-gray-500/5 before:to-gray-600/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
            : theme === "light"
              ? "bg-white/98 backdrop-blur-sm border border-gray-200/60 shadow-lg relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:via-gray-100/20 before:to-white/30 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
              : theme === "super-light"
                ? "bg-white/99 backdrop-blur-sm border border-gray-100/80 shadow-xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/40 before:via-gray-50/30 before:to-white/40 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:animate-pulse"
                : "bg-white/98 backdrop-blur-sm border border-gray-200/60 shadow-lg relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:via-gray-100/20 before:to-white/30 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",

    postCardHover:
      theme === "super-dark"
        ? "hover:bg-black/30 hover:border-gray-700/50"
        : theme === "gold"
          ? "hover:bg-gray-600/40 hover:border-gray-400/50"
          : theme === "dark"
            ? "hover:bg-gray-800/95 hover:border-gray-600/70"
            : "hover:bg-white/98 hover:border-gray-300/70",

    postHeader:
      theme === "super-dark"
        ? "bg-black/10 border-b border-gray-800/30"
        : theme === "gold"
          ? "bg-gray-600/20 border-b border-gray-500/30"
          : theme === "dark"
            ? "bg-gray-800/50 border-b border-gray-700/50"
            : "bg-gray-50/50 border-b border-gray-200/50",

    postContent: `${baseClasses.text} leading-relaxed`,
    postMeta: `${baseClasses.textSecondary} text-sm`,
    postActions:
      theme === "super-dark"
        ? "bg-black/10 border-t border-gray-800/30"
        : theme === "gold"
          ? "bg-gray-600/20 border-t border-gray-500/30"
          : theme === "dark"
            ? "bg-gray-800/50 border-t border-gray-700/50"
            : "bg-gray-50/50 border-t border-gray-200/50",

    postButton:
      theme === "super-dark"
        ? "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        : theme === "gold"
          ? "bg-yellow-600 hover:bg-yellow-700 text-yellow-100 px-4 py-2 rounded-lg transition-all duration-200"
          : theme === "dark"
            ? "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
            : "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200",

    postButtonSecondary:
      theme === "super-dark"
        ? "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg transition-all duration-200"
        : theme === "gold"
          ? "bg-yellow-800/30 hover:bg-yellow-700/30 text-yellow-200 px-4 py-2 rounded-lg transition-all duration-200"
          : theme === "dark"
            ? "bg-gray-600 hover:bg-gray-500 text-gray-200 px-4 py-2 rounded-lg transition-all duration-200"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-all duration-200",

    postInput: `${baseClasses.input} ${baseClasses.inputFocus} transition-all duration-200`,
    postProfile:
      theme === "super-dark"
        ? "w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg"
        : theme === "gold"
          ? "w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-yellow-100 font-semibold shadow-lg"
          : "w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg",
  };
};
