"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

export default function LanguageSwitcher() {
    const { language, setLanguage, supportedLocales } = useI18n();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="px-3 py-2 rounded-full theme-bg-tertiary/60 theme-text-muted hover:text-cyan-400 transition text-sm"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {language.toUpperCase()}
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-40 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-2 max-h-64 overflow-y-auto z-50">
                    <ul role="listbox">
                        {supportedLocales.map((loc) => (
                            <li key={loc.code}>
                                <button
                                    onClick={() => { setLanguage(loc.code); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:theme-bg-primary ${language === loc.code ? 'text-cyan-400' : 'theme-text-muted'}`}
                                    role="option"
                                    aria-selected={language === loc.code}
                                >
                                    {loc.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}


