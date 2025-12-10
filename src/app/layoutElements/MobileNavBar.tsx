"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
    IoChatbubbleEllipsesOutline, 
    IoNotificationsOutline, 
    IoPersonOutline, 
    IoLogOutOutline 
} from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

interface MobileNavBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isSearching: boolean;
    searchResults: any[];
    searchError: string | null;
    showSearchResults: boolean;
    hideSearchResults: () => void;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    showProfileMenu: boolean;
    setShowProfileMenu: (show: boolean) => void;
    setShowAddPost: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    notifications: string[];
    logout: () => void;
}

const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 }
};

export default function MobileNavBar({
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    searchError,
    showSearchResults,
    hideSearchResults,
    showNotifications,
    setShowNotifications,
    showProfileMenu,
    setShowProfileMenu,
    setShowAddPost,
    setShowSettings,
    notifications,
    logout
}: MobileNavBarProps) {
    const { user } = useAuth();
    const { language, setLanguage, supportedLocales, t } = useI18n();
    const router = useRouter();

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 theme-bg-primary/95 backdrop-blur-md border-b theme-border">
            <div className="flex items-center justify-between px-3 py-2">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <Image
                        src="/assets/images/logo1.png"
                        alt="Logo"
                        width={28}
                        height={28}
                        className="rounded-full shadow-lg"
                    />
                    <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        DeMedia
                    </span>
                </div>

                {/* Search Bar */}
                <div className="flex-1 mx-2 relative">
                    <input
                        type="text"
                        placeholder={t("nav.search")}
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onBlur={() => setTimeout(() => hideSearchResults(), 200)}
                        className="w-full px-3 py-1.5 rounded-full theme-bg-tertiary/60 border theme-border text-xs outline-none theme-text-primary"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center text-cyan-400">
                        {isSearching ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></div>
                        ) : (
                            <IoChatbubbleEllipsesOutline size={14} />
                        )}
                    </div>
                    
                    {/* Search Results */}
                    <AnimatePresence>
                        {showSearchResults && (searchResults.length > 0 || searchError) && (
                            <motion.div
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-3 max-h-60 overflow-y-auto z-50"
                            >
                                <h4 className="font-bold text-cyan-400 mb-2 text-xs">{t("content.searchResults")}</h4>
                                {searchError ? (
                                    <div className="text-red-400 text-xs text-center py-2">
                                        {searchError}
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-gray-400 text-xs text-center py-2">
                                        {t("content.noResults")}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {searchResults.map((result, index) => (
                                            <div
                                                key={`${result.type}-${result.id || index}`}
                                                className="flex items-center space-x-2 p-2 rounded-lg hover:theme-bg-primary cursor-pointer transition"
                                            >
                                                {result.type === 'user' ? (
                                                    <>
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                            {result.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium theme-text-primary">{result.name}</p>
                                                            <p className="text-xs theme-text-muted">@{result.username}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                                            📝
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium theme-text-primary truncate">{result.title || result.content}</p>
                                                            <p className="text-xs theme-text-muted">by {result.author?.name}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-1">
                    <div className="relative">
                        <button
                            onClick={() => {
                                const currentIndex = supportedLocales.findIndex(loc => loc.code === language);
                                const nextIndex = (currentIndex + 1) % supportedLocales.length;
                                setLanguage(supportedLocales[nextIndex].code);
                            }}
                            className="w-7 h-7 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                           theme-text-muted hover:text-cyan-400 hover:shadow-[0_0_8px_rgba(6,182,212,0.5)]
                           transition text-xs font-bold"
                            title="Language"
                        >
                            {language.toUpperCase()}
                        </button>
                    </div>
                    
                    <button
                        onClick={() => router.push('/messeging')}
                        className="w-7 h-7 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-purple-400 hover:shadow-[0_0_8px_rgba(168,85,247,0.5)]
                       transition"
                        title={t("nav.messages")}
                    >
                        <IoChatbubbleEllipsesOutline size={16} />
                    </button>

                    <button
                        onClick={() => setShowAddPost(true)}
                        className="w-7 h-7 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-green-400 hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]
                       transition"
                        title={t("posts.createPost")}
                    >
                        <span className="text-xs font-bold">+</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfileMenu(false);
                            }}
                            className="w-7 h-7 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                           theme-text-muted hover:text-cyan-400 hover:shadow-[0_0_8px_rgba(6,182,212,0.5)]
                           transition relative"
                            title={t("nav.notifications")}
                        >
                            <IoNotificationsOutline size={16} />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-bold">{notifications.length}</span>
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    variants={dropdownVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-full mt-2 w-80 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-4 z-50"
                                >
                                    <h4 className="font-bold text-cyan-400 mb-3 text-sm">{t("nav.notifications")}</h4>
                                    <ul className="space-y-2">
                                        {notifications.map((note, i) => (
                                            <li
                                                key={i}
                                                className="theme-text-muted hover:text-cyan-400 cursor-pointer text-sm transition"
                                            >
                                                {note}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowProfileMenu(!showProfileMenu);
                                setShowNotifications(false);
                            }}
                            className="w-7 h-7 rounded-full overflow-hidden border-2 border-cyan-400/50 hover:border-cyan-400 transition"
                        >
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.name || 'Profile'}
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/assets/images/default-avatar.svg";
                                    }}
                                />
                            ) : (
                                <Image
                                    src="/assets/images/default-avatar.svg"
                                    alt="Default avatar"
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </button>

                        {/* Profile Menu Dropdown */}
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    variants={dropdownVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-full mt-2 w-48 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-2 z-50"
                                >
                                    <div className="px-3 py-2 border-b theme-border">
                                        <p className="text-sm font-medium theme-text-primary">{user?.name || 'User'}</p>
                                        <p className="text-xs theme-text-muted">@{user?.username || 'username'}</p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                router.push('/profile');
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm theme-text-muted hover:text-cyan-400 hover:theme-bg-primary rounded-lg transition"
                                        >
                                            <IoPersonOutline size={16} className="inline mr-2" />
                                            {t("nav.profile")}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                setShowSettings(true);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm theme-text-muted hover:text-cyan-400 hover:theme-bg-primary rounded-lg transition"
                                        >
                                            {t("nav.settings")}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                logout();
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:theme-bg-primary rounded-lg transition"
                                        >
                                            <IoLogOutOutline size={16} className="inline mr-2" />
                                            {t("nav.logout")}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
