"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

export default function LanguageSwitcher() {
    const { language, setLanguage, supportedLocales, isRTL } = useI18n();
    const [open, setOpen] = useState(false);

    // Find current locale to display native name
    const currentLocale = supportedLocales.find(l => l.code === language);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="px-3 py-2 rounded-full theme-bg-tertiary/60 theme-text-muted hover:text-cyan-400 transition text-sm flex items-center gap-1"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="text-base">{currentLocale?.nativeName?.charAt(0) || language.toUpperCase()}</span>
                <span className="hidden sm:inline">{language.toUpperCase()}</span>
            </button>
            {open && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-2 max-h-64 overflow-y-auto z-50`}>
                    <ul role="listbox">
                        {supportedLocales.map((loc) => (
                            <li key={loc.code}>
                                <button
                                    onClick={() => { setLanguage(loc.code); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:theme-bg-primary flex items-center justify-between ${language === loc.code ? 'text-cyan-400 bg-cyan-500/10' : 'theme-text-muted'}`}
                                    role="option"
                                    aria-selected={language === loc.code}
                                    dir={loc.rtl ? 'rtl' : 'ltr'}
                                >
                                    <span>{loc.nativeName}</span>
                                    <span className="text-xs opacity-60">{loc.code.toUpperCase()}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}


