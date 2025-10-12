"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, 
    Video, 
    Plus, 
    MessageCircle,
    FileText,
    Zap,
    X,
    User
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import CreateContentModal from './CreateContentModal';

export default function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme } = useTheme();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Hide on auth and setup pages
    const hiddenPages = [
        '/login', '/signup', '/sign-up', '/auth/login', '/auth/signup',
        '/signinsetup', '/interests', '/finishsetup', '/setup'
    ];
    const isHiddenPage = hiddenPages.some(page => pathname?.includes(page));
    
    if (isHiddenPage) return null;

    const navItems = [
        {
            id: 'posts',
            label: 'Posts',
            icon: FileText,
            path: '/home',
            color: 'text-blue-500',
            activeColor: 'text-blue-400'
        },
        {
            id: 'desnaps',
            label: 'DeSnaps',
            icon: Video,
            path: '/desnaps',
            color: 'text-yellow-500',
            activeColor: 'text-yellow-400'
        },
        {
            id: 'create',
            label: 'Create',
            icon: Plus,
            path: null, // Modal trigger
            color: 'text-green-500',
            activeColor: 'text-green-400',
            isSpecial: true
        },
        {
            id: 'messages',
            label: 'Messages',
            icon: MessageCircle,
            path: '/messeging',
            color: 'text-purple-500',
            activeColor: 'text-purple-400'
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: User,
            path: '/profile',
            color: 'text-indigo-500',
            activeColor: 'text-indigo-400'
        }
    ];

    const handleNavClick = (item: typeof navItems[0]) => {
        if (item.id === 'create') {
            setShowCreateModal(true);
        } else if (item.path) {
            router.push(item.path);
        }
    };

    const isActive = (path: string | null) => {
        if (!path) return false;
        if (path === '/home') return pathname === '/home' || pathname === '/';
        if (path === '/profile') return pathname === '/profile' || pathname?.startsWith('/profile?');
        return pathname?.startsWith(path);
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white/95',
                    border: 'border-gray-200',
                    text: 'text-gray-700',
                    textSecondary: 'text-gray-500',
                    activeText: 'text-gray-900',
                    backdrop: 'backdrop-blur-xl',
                    hover: 'hover:bg-gray-100/50',
                    active: 'bg-gray-200/50'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-50/95',
                    border: 'border-gray-100',
                    text: 'text-gray-600',
                    textSecondary: 'text-gray-400',
                    activeText: 'text-gray-800',
                    backdrop: 'backdrop-blur-xl',
                    hover: 'hover:bg-gray-100/50',
                    active: 'bg-gray-200/50'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900/95',
                    border: 'border-gray-700/50',
                    text: 'text-gray-300',
                    textSecondary: 'text-gray-400',
                    activeText: 'text-white',
                    backdrop: 'backdrop-blur-xl',
                    hover: 'hover:bg-gray-800/30',
                    active: 'bg-gray-800/50'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black/95',
                    border: 'border-gray-800/50',
                    text: 'text-gray-400',
                    textSecondary: 'text-gray-500',
                    activeText: 'text-gray-100',
                    backdrop: 'backdrop-blur-xl',
                    hover: 'hover:bg-gray-900/30',
                    active: 'bg-gray-900/50'
                };
            default:
                return {
                    bg: 'bg-gray-900/95',
                    border: 'border-gray-700/50',
                    text: 'text-gray-300',
                    textSecondary: 'text-gray-400',
                    activeText: 'text-white',
                    backdrop: 'backdrop-blur-xl',
                    hover: 'hover:bg-gray-800/30',
                    active: 'bg-gray-800/50'
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            >
                <div className={`${themeClasses.bg} ${themeClasses.backdrop} border-t ${themeClasses.border} px-4 py-3 shadow-lg`}>
                    <div className="flex items-center justify-around max-w-md mx-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item)}
                                    className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 ${
                                        active 
                                            ? `${themeClasses.active} shadow-lg` 
                                            : `${themeClasses.hover} hover:shadow-md`
                                    }`}
                                >
                                    {item.isSpecial ? (
                                        // Special create button
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl">
                                                <Icon size={26} className="text-white" />
                                            </div>
                                            {/* Pulse effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl animate-ping opacity-20"></div>
                                            {/* Glow effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-sm opacity-50"></div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                                active 
                                                    ? `${item.color.replace('text-', 'bg-').replace('-500', '-100')} shadow-lg` 
                                                    : `${themeClasses.hover}`
                                            }`}>
                                                <Icon 
                                                    size={22} 
                                                    className={`transition-colors ${
                                                        active 
                                                            ? item.color 
                                                            : themeClasses.text
                                                    }`} 
                                                />
                                            </div>
                                            {active && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-current rounded-full"
                                                    style={{ color: 'inherit' }}
                                                />
                                            )}
                                        </div>
                                    )}
                                    
                                    <span className={`text-xs mt-1 font-medium transition-colors ${
                                        active 
                                            ? item.color 
                                            : themeClasses.textSecondary
                                    }`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Desktop Navigation - Hidden on mobile */}
            <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="hidden md:block fixed top-0 left-0 right-0 z-50"
            >
                <div className={`${themeClasses.bg} ${themeClasses.backdrop} border-b ${themeClasses.border} px-6 py-4`}>
                    <div className="flex items-center justify-between max-w-6xl mx-auto">
                        {/* Logo */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center space-x-3 cursor-pointer"
                            onClick={() => router.push('/home')}
                        >
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-extrabold text-xl">
                                DeMedia
                            </span>
                        </motion.div>

                        {/* Desktop Navigation Items */}
                        <div className="flex items-center space-x-8">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item)}
                                        className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                            active 
                                                ? themeClasses.active 
                                                : themeClasses.hover
                                        }`}
                                    >
                                        {item.isSpecial ? (
                                            // Special create button for desktop
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                    <Icon size={20} className="text-white" />
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-ping opacity-30"></div>
                                            </div>
                                        ) : (
                                            <>
                                                <Icon 
                                                    size={20} 
                                                    className={`transition-colors ${
                                                        active 
                                                            ? item.color 
                                                            : themeClasses.text
                                                    }`} 
                                                />
                                                <span className={`text-sm font-medium transition-colors ${
                                                    active 
                                                        ? item.color 
                                                        : themeClasses.text
                                                }`}>
                                                    {item.label}
                                                </span>
                                                {active && (
                                                    <motion.div
                                                        layoutId="desktopActiveIndicator"
                                                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"
                                                        style={{ color: 'inherit' }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Create Content Modal */}
            <CreateContentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </>
    );
}
