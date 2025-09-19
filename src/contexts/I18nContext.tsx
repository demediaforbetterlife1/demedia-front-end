"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Translations = Record<string, string>;

type Locale = string;

interface I18nContextType {
  language: Locale;
  setLanguage: (lng: Locale) => void;
  t: (key: string, fallback?: string) => string;
  supportedLocales: { code: string; name: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

// 100+ ISO codes mapped to human names. Many will alias to English until translations are provided.
const SUPPORTED: { code: string; name: string }[] = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "tr", name: "Turkish" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "fa", name: "Persian" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "ne", name: "Nepali" },
  { code: "si", name: "Sinhala" },
  { code: "my", name: "Burmese" },
  { code: "km", name: "Khmer" },
  { code: "lo", name: "Lao" },
  { code: "am", name: "Amharic" },
  { code: "sw", name: "Swahili" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "zu", name: "Zulu" },
  { code: "xh", name: "Xhosa" },
  { code: "af", name: "Afrikaans" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "pl", name: "Polish" },
  { code: "cs", name: "Czech" },
  { code: "sk", name: "Slovak" },
  { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" },
  { code: "bg", name: "Bulgarian" },
  { code: "uk", name: "Ukrainian" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "sr", name: "Serbian" },
  { code: "hr", name: "Croatian" },
  { code: "sl", name: "Slovenian" },
  { code: "bs", name: "Bosnian" },
  { code: "mk", name: "Macedonian" },
  { code: "et", name: "Estonian" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "is", name: "Icelandic" },
  { code: "ga", name: "Irish" },
  { code: "mt", name: "Maltese" },
  { code: "cy", name: "Welsh" },
  { code: "sq", name: "Albanian" },
  { code: "az", name: "Azerbaijani" },
  { code: "kk", name: "Kazakh" },
  { code: "ky", name: "Kyrgyz" },
  { code: "uz", name: "Uzbek" },
  { code: "tk", name: "Turkmen" },
  { code: "mn", name: "Mongolian" },
  { code: "ps", name: "Pashto" },
  { code: "ku", name: "Kurdish" },
  { code: "bo", name: "Tibetan" },
  { code: "dv", name: "Divehi" },
  { code: "hy", name: "Armenian" },
  { code: "ka", name: "Georgian" },
  { code: "be", name: "Belarusian" },
  { code: "tt", name: "Tatar" },
  { code: "ba", name: "Bashkir" },
  { code: "kkj", name: "Kako" },
  { code: "qu", name: "Quechua" },
  { code: "ay", name: "Aymara" },
  { code: "gn", name: "Guarani" },
  { code: "ht", name: "Haitian Creole" },
  { code: "lb", name: "Luxembourgish" },
  { code: "rm", name: "Romansh" },
  { code: "eo", name: "Esperanto" },
  { code: "la", name: "Latin" },
  { code: "tl", name: "Tagalog" },
  { code: "fil", name: "Filipino" },
  { code: "sr-Latn", name: "Serbian (Latin)" },
  { code: "kk-Cyrl", name: "Kazakh (Cyrillic)" },
  { code: "kk-Latn", name: "Kazakh (Latin)" },
  { code: "bs-Latn", name: "Bosnian (Latin)" },
  { code: "bs-Cyrl", name: "Bosnian (Cyrillic)" },
];

const BASE_TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    "auth.welcomeBack": "Welcome Back",
    "auth.login": "Login",
    "auth.signUp": "Sign Up",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.noAccount": "Don’t have an account?",
    "auth.haveAccount": "Already have an account?",
    "auth.signingIn": "Signing In...",
    "auth.creatingAccount": "Creating Account...",
    "setup.completeProfile": "Complete Your Profile",
    "setup.preferredLanguage": "Preferred Language",
    "setup.phoneNumber": "Phone Number",
    "setup.saveContinue": "Save & Continue",
    "setup.saving": "Saving...",
    "common.save": "Save",
    "common.continue": "Continue",
    "common.loading": "Loading",
    "navbar.notifications": "Notifications",
    "navbar.messages": "Messages",
    "navbar.profile": "Profile",
    "navbar.logout": "Logout",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.account": "Account",
    "settings.security": "Security",
    "settings.notifications": "Notifications",
    "settings.privacy": "Privacy",
    "settings.appearance": "Appearance",
    "settings.support": "Support",
    "index.checkingAuth": "Checking authentication...",
    "posts.loading": "Loading posts...",
    "posts.none": "No posts yet.",
    "posts.error": "Error",
    "posts.unknown": "Unknown",
    "posts.image": "Image",
  },
  ar: {},
  es: {},
  fr: {},
  de: {},
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Locale>("en");
  const [translations, setTranslations] = useState<Record<Locale, Translations>>(BASE_TRANSLATIONS);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("language") : null;
    if (stored && SUPPORTED.find(l => l.code === stored)) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lng: Locale) => {
    setLanguageState(lng);
    if (typeof window !== "undefined") localStorage.setItem("language", lng);
  };

  const t = (key: string, fallback?: string): string => {
    const lang = translations[language] || {};
    if (lang[key]) return lang[key];
    const en = translations["en"] || {};
    return en[key] || fallback || key;
  };

  const value = useMemo<I18nContextType>(() => ({
    language,
    setLanguage,
    t,
    supportedLocales: SUPPORTED,
  }), [language, translations]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
};


