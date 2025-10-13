"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    IoNotificationsOutline,
    IoChatbubbleEllipsesOutline,
    IoLogOutOutline,
    IoPersonOutline,
    IoMenu,
    IoClose,
} from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";
import AddPostModal from "@/app/layoutElementsComps/navdir/AddPostModal";
import SettingsItems from "@/app/(PagesComps)/settingsdir/settingsItems";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useSearch } from "@/hooks/useSearch";
import ImprovedSearchModal from "@/components/ImprovedSearchModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import EnhancedSearchModal from "@/components/EnhancedSearchModal";


export default function Navbar() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isShrunk, setIsShrunk] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { user, logout } = useAuth();
    const router = useRouter();
    const [showAddPost, setShowAddPost] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showEnhancedSearch, setShowEnhancedSearch] = useState(false);
    const { showWelcomeNotification } = useNotifications();


    const [notifications, setNotifications] = useState<string[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
    const { 
        searchQuery, 
        searchResults, 
        showSearchResults, 
        isSearching, 
        error: searchError,
        handleSearchInputChange, 
        handleSearchSubmit,
        hideSearchResults 
    } = useSearch();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch(`/api/notifications`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'user-id': user?.id?.toString() || '',
                        'Content-Type': 'application/json',
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications?.map((notification: any) => notification.message || notification.title || 'New notification') || []);
                } else {
                    console.warn('Notifications endpoint not available:', res.status);
                    // Set some default notifications for demo
                    setNotifications(['Welcome to DeMedia!', 'Start connecting with others!']);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
                // Set some default notifications for demo
                setNotifications(['Welcome to DeMedia!', 'Start connecting with others!']);
            }
        };

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chat`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'user-id': user?.id?.toString() || '',
                        'Content-Type': 'application/json',
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.map((chat: any) => 
                        chat.lastMessage ? 
                        `${chat.chatName}: ${chat.lastMessage}` : 
                        `New conversation in ${chat.chatName}`
                    ));
                } else {
                    console.warn('Chat endpoint not available:', res.status);
                    // Set some default messages for demo
                    setMessages(['Start a conversation!', 'Connect with friends!']);
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
                // Set some default messages for demo
                setMessages(['Start a conversation!', 'Connect with friends!']);
            }
        };

        if (user) {
            fetchNotifications();
            fetchMessages();
        }
    }, [user]);


    const dropdownVariants = {
        hidden: { opacity: 0, y: -8, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -8, scale: 0.98 },
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 40) {
                setIsShrunk(true);
            } else {
                setIsShrunk(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`flex justify-between items-center px-6 sticky top-0 z-50 
          theme-bg-secondary/80 backdrop-blur-xl border-b theme-border theme-shadow transition-all duration-300 
          ${isShrunk ? "py-2 h-14" : "py-3 h-20"} hidden md:flex`}
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-3 cursor-pointer"
                >
                    <Image
                        src="/assets/images/logo1.png"
                        alt="Logo"
                        width={42}
                        height={42}
                        className="rounded-full shadow-lg"
                    />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-extrabold text-2xl">
            DeMedia
          </span>
                </motion.div>

                <div className="relative flex-1 max-w-lg mx-8">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="Search users, posts..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearchSubmit(searchQuery);
                                }
                            }}
                            onBlur={() => setTimeout(() => hideSearchResults(), 200)}
                            className="w-full px-5 py-3 rounded-full theme-bg-tertiary/60 theme-text-primary placeholder-gray-400
                     border theme-border focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500
                     outline-none transition-all duration-200 shadow-lg hover:shadow-xl"
                        />
                    <div className="absolute inset-y-0 right-4 flex items-center gap-2 text-cyan-400">
                        <button
                            onClick={() => setShowEnhancedSearch(true)}
                            className="p-1.5 hover:bg-cyan-500/20 rounded-full transition-colors"
                            title="Enhanced Search"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                        </button>
                        {isSearching && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                        )}
                    </div>
                    
                    <AnimatePresence>
                        {showSearchResults && (searchResults.length > 0 || searchError) && (
                            <motion.div
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-4 max-h-80 overflow-y-auto"
                            >
                                <h4 className="font-bold text-cyan-400 mb-3 text-sm">Search Results</h4>
                                {searchError ? (
                                    <div className="text-red-400 text-sm text-center py-4">
                                        {searchError}
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-gray-400 text-sm text-center py-4">
                                        No results found
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {searchResults.map((result, index) => (
                                            <div
                                                key={`${result.type}-${result.id || index}`}
                                                className="flex items-center space-x-3 p-2 rounded-lg hover:theme-bg-primary cursor-pointer transition"
                                            >
                                                {result.type === 'user' ? (
                                                    <>
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {result.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium theme-text-primary">{result.name}</p>
                                                            <p className="text-xs theme-text-muted">@{result.username}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                                            📝
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium theme-text-primary truncate">{result.title || result.content}</p>
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
                </div>

                <div className="flex items-center space-x-4">
                    <LanguageSwitcher />
                    
                    {/* Home Button */}
                    <button
                        onClick={() => router.push('/home')}
                        className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-blue-400 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]
                       transition"
                        title="Home"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                    </button>

                    {/* Profile Button */}
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]
                       transition"
                        title="Profile"
                    >
                        <IoPersonOutline size={22} />
                    </button>

                    {/* Messages Button */}
                    <button
                        onClick={() => router.push('/messeging')}
                        className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.5)]
                       transition"
                        title="Messages"
                    >
                        <IoChatbubbleEllipsesOutline size={22} />
                    </button>

                    {/* Add Post Button */}
                    <button
                        onClick={() => setShowAddPost(true)}
                        className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-green-400 hover:shadow-[0_0_12px_rgba(34,197,94,0.5)]
                       transition"
                        title="Add Post"
                    >
                        <span className="text-lg font-bold">+</span>
                    </button>

                    {/* DeSnaps Button */}
                    <button
                        onClick={() => router.push('/desnaps')}
                        className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-orange-400 hover:shadow-[0_0_12px_rgba(251,146,60,0.5)]
                       transition"
                        title="DeSnaps"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                        </svg>
                    </button>

                    {/* Pricing Button */}
                    <button
                        onClick={() => router.push('/pricing')}
                        className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-yellow-400 hover:shadow-[0_0_12px_rgba(251,191,36,0.5)]
                       transition"
                        title="Pricing"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowMessages(false);
                                setShowProfileMenu(false);
                            }}
                            className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]
                       transition"
                        >
                            <IoNotificationsOutline size={22} />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                        </button>
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    variants={dropdownVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-3 w-72 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-4"
                                >
                                    <h4 className="font-bold text-cyan-400 mb-3 text-sm">Notifications</h4>
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

                    {/* Settings Button */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.5)]
                       transition"
                        title="Settings"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowProfileMenu(!showProfileMenu);
                                setShowNotifications(false);
                                setShowMessages(false);
                            }}
                            className="w-10 h-10 rounded-full overflow-hidden hover:shadow-[0_0_12px_rgba(139,92,246,0.6)] transition"
                        >
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.name || 'Profile'}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/assets/images/default-avatar.svg";
                                    }}
                                />
                            ) : (
                                <Image
                                    src="/assets/images/default-avatar.svg"
                                    alt="Default avatar"
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </button>
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    variants={dropdownVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-3 w-56 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-4"
                                >
                                    <ul className="space-y-3">
                                        <li
                                            onClick={() => { router.push('/profile'); setShowProfileMenu(false); }}
                                            className="flex items-center space-x-2 theme-text-muted hover:text-cyan-400 cursor-pointer text-sm transition">
                                            <IoPersonOutline size={18} />
                                            <span>Profile</span>
                                        </li>
                                        <li
                                            onClick={() => { setShowSettings(true); setShowProfileMenu(false); }}
                                            className="flex items-center space-x-2 theme-text-muted hover:text-cyan-400 cursor-pointer text-sm transition">
                                            <span>Settings</span>
                                        </li>
                                        <li
                                            onClick={() => {
                                                logout();
                                                setShowProfileMenu(false);
                                            }}
                                            className="flex items-center space-x-2 text-red-500 hover:text-red-400 cursor-pointer text-sm transition"
                                        >
                                            <IoLogOutOutline size={18} />
                                            <span>Logout</span>
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Navigation */}
            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`md:hidden flex justify-between items-center px-4 py-3 sticky top-0 z-50 
          theme-bg-secondary/80 backdrop-blur-xl border-b theme-border theme-shadow transition-all duration-300`}
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-2 cursor-pointer"
                >
                    <Image
                        src="/assets/images/logo1.png"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="rounded-full shadow-lg"
                    />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-extrabold text-lg">
                        DeMedia
                    </span>
                </motion.div>

                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="w-10 h-10 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                       theme-text-muted hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]
                       transition"
                >
                    {mobileOpen ? <IoClose size={20} /> : <IoMenu size={20} />}
                </button>
            </motion.nav>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 10, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                        className="fixed top-16 left-1/2 -translate-x-1/2 w-[95vw] max-w-sm bg-gray-900/98 border border-cyan-500/30 rounded-xl shadow-2xl p-4 sm:p-6 z-40 backdrop-blur-md"
                    >
                            <div className="flex flex-col space-y-4 theme-text-secondary">
                                {/* Logo */}
                                <div className="flex items-center space-x-3 mb-4">
                                    <Image
                                        src="/assets/images/logo1.png"
                                        alt="Logo"
                                        width={32}
                                        height={32}
                                        className="rounded-full shadow-lg"
                                    />
                                    <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                        DeMedia
                                    </span>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users, posts..."
                                        value={searchQuery}
                                        onChange={handleSearchInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearchSubmit(searchQuery);
                                            }
                                        }}
                                        onBlur={() => setTimeout(() => hideSearchResults(), 200)}
                                        className="w-full px-4 py-2 rounded-full theme-bg-tertiary/60 border theme-border text-sm outline-none theme-text-primary"
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center text-cyan-400">
                                        {isSearching ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                                        ) : (
                                            <IoChatbubbleEllipsesOutline size={16} />
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
                                                <h4 className="font-bold text-cyan-400 mb-2 text-xs">Search Results</h4>
                                                {searchError ? (
                                                    <div className="text-red-400 text-xs text-center py-2">
                                                        {searchError}
                                                    </div>
                                                ) : searchResults.length === 0 ? (
                                                    <div className="text-gray-400 text-xs text-center py-2">
                                                        No results found
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

                                {/* Language Switcher */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm theme-text-muted">Language</span>
                                    <LanguageSwitcher />
                                </div>

                                {/* Navigation Items */}
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => {
                                            setMobileOpen(false);
                                            router.push('/home');
                                        }}
                                        className="flex items-center space-x-3 w-full p-2 rounded-lg theme-text-muted hover:text-blue-400 hover:theme-bg-primary transition"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                            <polyline points="9,22 9,12 15,12 15,22"/>
                                        </svg>
                                        <span>Home</span>
                                    </button>

                                    <button 
                                        onClick={() => {
                                            setMobileOpen(false);
                                            router.push('/messeging');
                                        }}
                                        className="flex items-center space-x-3 w-full p-2 rounded-lg theme-text-muted hover:text-purple-400 hover:theme-bg-primary transition"
                                    >
                                        <IoChatbubbleEllipsesOutline size={20} />
                                        <span>Messages</span>
                                    </button>

                                    <button 
                                        onClick={() => {
                                            setMobileOpen(false);
                                            setShowAddPost(true);
                                        }}
                                        className="flex items-center space-x-3 w-full p-2 rounded-lg theme-text-muted hover:text-green-400 hover:theme-bg-primary transition"
                                    >
                                        <span className="text-lg font-bold">+</span>
                                        <span>Add Post</span>
                                    </button>

                                    <button 
                                        onClick={() => {
                                            setShowNotifications(!showNotifications);
                                            setShowMessages(false);
                                            setShowProfileMenu(false);
                                        }}
                                        className="flex items-center space-x-3 w-full p-2 rounded-lg theme-text-muted hover:text-cyan-400 hover:theme-bg-primary transition relative"
                                    >
                                        <IoNotificationsOutline size={20} />
                                        <span>Notifications</span>
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            router.push('/profile');
                                        }}
                                        className="flex items-center space-x-3 w-full p-2 rounded-lg theme-text-muted hover:text-cyan-400 hover:theme-bg-primary transition"
                                    >
                                        <IoPersonOutline size={20} />
                                        <span>Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            setShowSettings(true);
                                        }}
                                        className="flex items-center space-x-3 w-full p-2 rounded-lg theme-text-muted hover:text-cyan-400 hover:theme-bg-primary transition"
                                    >
                                        <span>Settings</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center space-x-3 w-full p-2 rounded-lg text-red-500 hover:text-red-400 hover:theme-bg-primary transition"
                                    >
                                        <IoLogOutOutline size={20} />
                                        <span>Logout</span>
                                    </button>
                                </div>

                                {/* Notifications Dropdown */}
                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            variants={dropdownVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            transition={{ duration: 0.2 }}
                                            className="theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-4"
                                        >
                                            <h4 className="font-bold text-cyan-400 mb-3 text-sm">Notifications</h4>
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

                                {/* User Profile Section */}
                                <div className="border-t theme-border pt-4 mt-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            {user?.profilePicture ? (
                                                <img
                                                    src={user.profilePicture}
                                                    alt={user.name || 'Profile'}
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/assets/images/default-avatar.svg";
                                                    }}
                                                />
                                            ) : (
                                                <Image
                                                    src="/assets/images/default-avatar.svg"
                                                    alt="Default avatar"
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium theme-text-primary">{user?.name || 'User'}</p>
                                            <p className="text-xs theme-text-muted">@{user?.username || 'username'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            {/* Modals */}
            {showAddPost && (
                <AddPostModal isOpen={showAddPost} onClose={() => setShowAddPost(false)} authorId={Number(user?.id) || 0} />
            )}
            {showSettings && (
                <div className="fixed inset-0 z-[60]">
                    <SettingsItems />
                    <button onClick={() => setShowSettings(false)} className="hidden" />
                </div>
            )}

            {/* Improved Search Modal */}
            <ImprovedSearchModal
                isOpen={showEnhancedSearch}
                onClose={() => setShowEnhancedSearch(false)}
            />
        </>
    );
}
