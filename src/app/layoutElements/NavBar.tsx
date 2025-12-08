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
    IoHomeOutline,
    IoAddCircleOutline,
    IoSettingsOutline,
    IoVideocamOutline,
    IoStarOutline,
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
                    setNotifications(['Welcome to DeMedia!', 'Start connecting with others!']);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
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
                    setMessages(['Start a conversation!', 'Connect with friends!']);
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
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

    // Navigation items for desktop
    const navItems = [
        { id: 'home', label: 'Home', icon: IoHomeOutline, path: '/home', color: 'hover:text-blue-400', hoverShadow: 'hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]' },
        { id: 'desnaps', label: 'DeSnaps', icon: IoVideocamOutline, path: '/desnaps', color: 'hover:text-orange-400', hoverShadow: 'hover:shadow-[0_0_12px_rgba(251,146,60,0.5)]' },
        { id: 'messages', label: 'Messages', icon: IoChatbubbleEllipsesOutline, path: '/messeging', color: 'hover:text-purple-400', hoverShadow: 'hover:shadow-[0_0_12px_rgba(168,85,247,0.5)]' },
        { id: 'pricing', label: 'Premium', icon: IoStarOutline, path: '/pricing', color: 'hover:text-yellow-400', hoverShadow: 'hover:shadow-[0_0_12px_rgba(251,191,36,0.5)]' },
    ];

    return (
        <>
            {/* Desktop Navigation */}
            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`hidden md:flex justify-between items-center px-4 lg:px-8 sticky top-0 z-50 
                    theme-bg-secondary/80 backdrop-blur-xl border-b theme-border theme-shadow transition-all duration-300 
                    ${isShrunk ? "py-2 h-14" : "py-3 h-16"}`}
            >
                {/* Left Section - Logo */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push('/home')}
                    className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
                >
                    <Image
                        src="/assets/images/logo1.png"
                        alt="Logo"
                        width={36}
                        height={36}
                        className="rounded-full shadow-lg"
                    />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-extrabold text-xl lg:text-2xl hidden lg:block">
                        DeMedia
                    </span>
                </motion.div>

                {/* Center Section - Search & Navigation */}
                <div className="flex items-center flex-1 justify-center max-w-3xl mx-4 lg:mx-8 gap-2 lg:gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearchSubmit(searchQuery);
                                    }
                                }}
                                onBlur={() => setTimeout(() => hideSearchResults(), 200)}
                                className="w-full px-4 py-2 rounded-full theme-bg-tertiary/60 theme-text-primary placeholder-gray-400
                                    border theme-border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500
                                    outline-none transition-all duration-200 text-sm"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center gap-1 text-cyan-400">
                                <button
                                    onClick={() => setShowEnhancedSearch(true)}
                                    className="p-1 hover:bg-cyan-500/20 rounded-full transition-colors"
                                    title="Enhanced Search"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/>
                                        <path d="m21 21-4.35-4.35"/>
                                    </svg>
                                </button>
                                {isSearching && (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></div>
                                )}
                            </div>
                        </div>
                        
                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showSearchResults && (searchResults.length > 0 || searchError) && (
                                <motion.div
                                    variants={dropdownVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 right-0 mt-2 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-3 max-h-72 overflow-y-auto z-50"
                                >
                                    <h4 className="font-bold text-cyan-400 mb-2 text-xs">Search Results</h4>
                                    {searchError ? (
                                        <div className="text-red-400 text-xs text-center py-3">{searchError}</div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="text-gray-400 text-xs text-center py-3">No results found</div>
                                    ) : (
                                        <div className="space-y-1">
                                            {searchResults.map((result, index) => (
                                                <div
                                                    key={`${result.type}-${result.id || index}`}
                                                    className="flex items-center space-x-2 p-2 rounded-lg hover:theme-bg-primary cursor-pointer transition"
                                                >
                                                    {result.type === 'user' ? (
                                                        <>
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                                {result.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium theme-text-primary">{result.name}</p>
                                                                <p className="text-xs theme-text-muted">@{result.username}</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-xs">📝</div>
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

                    {/* Navigation Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => router.push(item.path)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full theme-bg-tertiary/40 
                                        theme-text-muted ${item.color} ${item.hoverShadow} transition-all duration-200 text-sm font-medium`}
                                    title={item.label}
                                >
                                    <Icon size={18} />
                                    <span className="hidden xl:inline">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Section - Actions & Profile */}
                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                    <LanguageSwitcher />
                    
                    {/* Create Post Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddPost(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 
                            text-white font-medium text-sm shadow-lg hover:shadow-green-500/30 transition-all duration-200"
                        title="Create Post"
                    >
                        <IoAddCircleOutline size={18} />
                        <span className="hidden xl:inline">Create</span>
                    </motion.button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowMessages(false);
                                setShowProfileMenu(false);
                            }}
                            className="w-9 h-9 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                                theme-text-muted hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition"
                            title="Notifications"
                        >
                            <IoNotificationsOutline size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    variants={dropdownVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-72 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-4 z-50"
                                >
                                    <h4 className="font-bold text-cyan-400 mb-3 text-sm">Notifications</h4>
                                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                                        {notifications.map((note, i) => (
                                            <li key={i} className="theme-text-muted hover:text-cyan-400 cursor-pointer text-sm transition p-2 rounded-lg hover:theme-bg-primary">
                                                {note}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-9 h-9 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                            theme-text-muted hover:text-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.5)] transition"
                        title="Settings"
                    >
                        <IoSettingsOutline size={20} />
                    </button>

                    {/* Profile Menu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowProfileMenu(!showProfileMenu);
                                setShowNotifications(false);
                                setShowMessages(false);
                            }}
                            className="flex items-center gap-2 p-1 pr-2 rounded-full theme-bg-tertiary/40 hover:theme-bg-tertiary/60 
                                hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] transition-all duration-200"
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-cyan-500/30">
                                {user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt={user.name || 'Profile'}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "/assets/images/default-avatar.svg";
                                        }}
                                    />
                                ) : (
                                    <Image
                                        src="/assets/images/default-avatar.svg"
                                        alt="Default avatar"
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <span className="hidden xl:block text-sm font-medium theme-text-primary max-w-20 truncate">
                                {user?.name || 'User'}
                            </span>
                        </button>
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    variants={dropdownVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-56 theme-bg-secondary/95 border border-cyan-500/30 rounded-xl theme-shadow p-3 z-50"
                                >
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 p-2 mb-2 border-b theme-border pb-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            {user?.profilePicture ? (
                                                <img src={user.profilePicture} alt={user.name || 'Profile'} className="w-full h-full object-cover" />
                                            ) : (
                                                <Image src="/assets/images/default-avatar.svg" alt="Default avatar" width={40} height={40} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium theme-text-primary truncate">{user?.name || 'User'}</p>
                                            <p className="text-xs theme-text-muted truncate">@{user?.username || 'username'}</p>
                                        </div>
                                    </div>
                                    
                                    <ul className="space-y-1">
                                        <li
                                            onClick={() => { router.push('/profile'); setShowProfileMenu(false); }}
                                            className="flex items-center space-x-2 p-2 rounded-lg theme-text-muted hover:text-cyan-400 hover:theme-bg-primary cursor-pointer text-sm transition"
                                        >
                                            <IoPersonOutline size={18} />
                                            <span>View Profile</span>
                                        </li>
                                        <li
                                            onClick={() => { setShowSettings(true); setShowProfileMenu(false); }}
                                            className="flex items-center space-x-2 p-2 rounded-lg theme-text-muted hover:text-cyan-400 hover:theme-bg-primary cursor-pointer text-sm transition"
                                        >
                                            <IoSettingsOutline size={18} />
                                            <span>Settings</span>
                                        </li>
                                        <li
                                            onClick={() => { logout(); setShowProfileMenu(false); }}
                                            className="flex items-center space-x-2 p-2 rounded-lg text-red-500 hover:text-red-400 hover:theme-bg-primary cursor-pointer text-sm transition"
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


            {/* Mobile Navigation Header */}
            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="md:hidden flex justify-between items-center px-4 py-3 sticky top-0 z-50 
                    theme-bg-secondary/80 backdrop-blur-xl border-b theme-border theme-shadow"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => router.push('/home')}
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEnhancedSearch(true)}
                        className="w-9 h-9 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                            theme-text-muted hover:text-cyan-400 transition"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </button>
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="w-9 h-9 rounded-full theme-bg-tertiary/60 flex items-center justify-center
                            theme-text-muted hover:text-cyan-400 transition"
                    >
                        {mobileOpen ? <IoClose size={20} /> : <IoMenu size={20} />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-16 left-2 right-2 bg-gray-900/98 border border-cyan-500/30 rounded-xl shadow-2xl p-4 z-40 backdrop-blur-md md:hidden"
                    >
                        <div className="flex flex-col space-y-3 theme-text-secondary">
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
                                    className="w-full px-4 py-2.5 rounded-full theme-bg-tertiary/60 border theme-border text-sm outline-none theme-text-primary"
                                />
                                {isSearching && (
                                    <div className="absolute inset-y-0 right-3 flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                                    </div>
                                )}
                            </div>

                            {/* Language Switcher */}
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm theme-text-muted">Language</span>
                                <LanguageSwitcher />
                            </div>

                            {/* Navigation Items */}
                            <div className="space-y-1 pt-2 border-t theme-border">
                                <button 
                                    onClick={() => { setMobileOpen(false); router.push('/home'); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-blue-400 hover:theme-bg-primary transition"
                                >
                                    <IoHomeOutline size={20} />
                                    <span>Home</span>
                                </button>

                                <button 
                                    onClick={() => { setMobileOpen(false); router.push('/desnaps'); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-orange-400 hover:theme-bg-primary transition"
                                >
                                    <IoVideocamOutline size={20} />
                                    <span>DeSnaps</span>
                                </button>

                                <button 
                                    onClick={() => { setMobileOpen(false); router.push('/messeging'); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-purple-400 hover:theme-bg-primary transition"
                                >
                                    <IoChatbubbleEllipsesOutline size={20} />
                                    <span>Messages</span>
                                </button>

                                <button 
                                    onClick={() => { setMobileOpen(false); setShowAddPost(true); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-green-400 hover:theme-bg-primary transition"
                                >
                                    <IoAddCircleOutline size={20} />
                                    <span>Create Post</span>
                                </button>

                                <button 
                                    onClick={() => { setMobileOpen(false); router.push('/pricing'); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-yellow-400 hover:theme-bg-primary transition"
                                >
                                    <IoStarOutline size={20} />
                                    <span>Premium</span>
                                </button>

                                <button 
                                    onClick={() => {
                                        setShowNotifications(!showNotifications);
                                        setShowMessages(false);
                                    }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-cyan-400 hover:theme-bg-primary transition relative"
                                >
                                    <IoNotificationsOutline size={20} />
                                    <span>Notifications</span>
                                    <span className="absolute top-2 left-6 w-2 h-2 bg-red-500 rounded-full" />
                                </button>

                                <button
                                    onClick={() => { setMobileOpen(false); router.push('/profile'); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-cyan-400 hover:theme-bg-primary transition"
                                >
                                    <IoPersonOutline size={20} />
                                    <span>Profile</span>
                                </button>

                                <button
                                    onClick={() => { setMobileOpen(false); setShowSettings(true); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg theme-text-muted hover:text-purple-400 hover:theme-bg-primary transition"
                                >
                                    <IoSettingsOutline size={20} />
                                    <span>Settings</span>
                                </button>

                                <button
                                    onClick={() => { setMobileOpen(false); logout(); }}
                                    className="flex items-center space-x-3 w-full p-2.5 rounded-lg text-red-500 hover:text-red-400 hover:theme-bg-primary transition"
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
                                        className="theme-bg-tertiary/80 border border-cyan-500/30 rounded-xl p-3"
                                    >
                                        <h4 className="font-bold text-cyan-400 mb-2 text-sm">Notifications</h4>
                                        <ul className="space-y-1 max-h-40 overflow-y-auto">
                                            {notifications.map((note, i) => (
                                                <li key={i} className="theme-text-muted hover:text-cyan-400 cursor-pointer text-sm transition p-2 rounded-lg hover:theme-bg-primary">
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* User Profile Section */}
                            <div className="border-t theme-border pt-3">
                                <div className="flex items-center space-x-3 p-2">
                                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-cyan-500/30">
                                        {user?.profilePicture ? (
                                            <img
                                                src={user.profilePicture}
                                                alt={user.name || 'Profile'}
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

            {/* Enhanced Search Modal */}
            <ImprovedSearchModal
                isOpen={showEnhancedSearch}
                onClose={() => setShowEnhancedSearch(false)}
            />
        </>
    );
}
