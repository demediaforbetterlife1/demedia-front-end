"use client";
import { X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type ThemeModalProps = {
    closeModal: () => void;
};

export default function ThemeModal({ closeModal }: ThemeModalProps) {
    const { theme, setTheme } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState(theme);

    const applyTheme = () => {
        setTheme(selectedTheme);
        closeModal();
    };

    const themes = [
        {
            id: 'dark' as const,
            name: 'Dark',
            description: 'Classic dark theme with deep blues',
            preview: 'bg-gradient-to-br from-slate-800 to-slate-900',
            icon: '🌙'
        },
        {
            id: 'light' as const,
            name: 'Light',
            description: 'Clean and bright interface',
            preview: 'bg-gradient-to-br from-gray-100 to-gray-200',
            icon: '☀️'
        },
        {
            id: 'super-dark' as const,
            name: 'Super Dark',
            description: 'Ultra dark with animated stars',
            preview: 'bg-black relative overflow-hidden',
            icon: '🌌'
        },
        {
            id: 'super-light' as const,
            name: 'Super Light',
            description: 'Ultra light and minimal',
            preview: 'bg-gradient-to-br from-gray-50 to-gray-100',
            icon: '☁️'
        },
        {
            id: 'gold' as const,
            name: 'Gold',
            description: 'Luxurious gold theme with shimmer effects',
            preview: 'bg-gradient-to-br from-yellow-900 to-yellow-800 relative overflow-hidden',
            icon: '✨'
        },
        {
            id: 'iron' as const,
            name: 'Iron',
            description: 'Shining iron theme with metallic effects',
            preview: 'bg-gradient-to-br from-gray-800 to-gray-700 relative overflow-hidden',
            icon: '⚡'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="theme-bg-secondary theme-text-primary rounded-2xl p-6 max-w-md w-full theme-shadow border theme-border">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold theme-text-primary">Choose Theme</h2>
                <button
                    onClick={closeModal}
                        className="text-2xl hover:opacity-70 transition-opacity theme-text-muted hover:theme-text-primary"
                >
                        ×
                </button>
                </div>

                <div className="space-y-4 mb-6">
                    {themes.map((themeOption) => (
                        <div
                            key={themeOption.id}
                            className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                selectedTheme === themeOption.id
                                    ? 'theme-bg-tertiary ring-2 ring-cyan-400'
                                    : 'theme-bg-primary hover:theme-bg-tertiary'
                            }`}
                            onClick={() => setSelectedTheme(themeOption.id)}
                        >
                            <div className="flex items-center space-x-4">
                                <div className="text-2xl">{themeOption.icon}</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold theme-text-primary">
                                        {themeOption.name}
                                    </h3>
                                    <p className="text-sm theme-text-muted">
                                        {themeOption.description}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-lg ${themeOption.preview} border-2 border-gray-300`}>
                                    {themeOption.id === 'super-dark' && (
                                        <div className="w-full h-full relative">
                                            <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-60"></div>
                                            <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white rounded-full opacity-40"></div>
                                            <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full opacity-50"></div>
                                        </div>
                                    )}
                                    {themeOption.id === 'gold' && (
                                        <div className="w-full h-full relative">
                                            <div className="absolute top-1 left-1 w-1 h-1 bg-yellow-300 rounded-full opacity-80 animate-pulse"></div>
                                            <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-60 animate-pulse"></div>
                                            <div className="absolute bottom-2 left-2 w-1 h-1 bg-yellow-200 rounded-full opacity-70 animate-pulse"></div>
                                            <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-yellow-500 rounded-full opacity-90 animate-ping"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {selectedTheme === themeOption.id && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={closeModal}
                        className="flex-1 py-2 px-4 theme-bg-primary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={applyTheme}
                        className="flex-1 py-2 px-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                        Apply Theme
                    </button>
                </div>
            </div>
        </div>
    );
}
