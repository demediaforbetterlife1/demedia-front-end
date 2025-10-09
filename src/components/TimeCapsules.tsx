"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Clock, 
    Calendar, 
    Eye, 
    EyeOff, 
    Lock, 
    Unlock, 
    Send, 
    Archive,
    Timer,
    Sparkles,
    X,
    Plus,
    Settings,
    Globe
} from "lucide-react";

interface TimeCapsule {
    id: string;
    title: string;
    content: string;
    type: "text" | "image" | "video" | "audio";
    scheduledDate: Date;
    isRevealed: boolean;
    isPublic: boolean;
    recipients: string[];
    tags: string[];
    createdAt: Date;
}

interface TimeCapsulesProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateCapsule: (capsuleData: any) => void;
    onRevealCapsule: (capsuleId: string) => void;
}

const sampleCapsules: TimeCapsule[] = [
    {
        id: "1",
        title: "Future Me Letter",
        content: "Dear future me, I hope you've achieved all your goals...",
        type: "text",
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        isRevealed: false,
        isPublic: false,
        recipients: ["me"],
        tags: ["personal", "reflection"],
        createdAt: new Date()
    },
    {
        id: "2",
        title: "Anniversary Surprise",
        content: "Happy 5th anniversary! Here's a video of our journey...",
        type: "video",
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        isRevealed: false,
        isPublic: false,
        recipients: ["partner@example.com"],
        tags: ["anniversary", "love"],
        createdAt: new Date()
    },
    {
        id: "3",
        title: "Public Announcement",
        content: "I'm excited to share my new project with the world!",
        type: "text",
        scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
        isRevealed: false,
        isPublic: true,
        recipients: ["everyone"],
        tags: ["announcement", "project"],
        createdAt: new Date()
    }
];

export default function TimeCapsules({ isOpen, onClose, onCreateCapsule, onRevealCapsule }: TimeCapsulesProps) {
    const [activeTab, setActiveTab] = useState<"my-capsules" | "create" | "revealed">("my-capsules");
    const [capsules, setCapsules] = useState<TimeCapsule[]>(sampleCapsules);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newCapsule, setNewCapsule] = useState({
        title: "",
        content: "",
        type: "text" as const,
        scheduledDate: "",
        isPublic: false,
        recipients: [] as string[],
        tags: [] as string[]
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTimeUntil = (scheduledDate: Date) => {
        const now = new Date();
        const diff = scheduledDate.getTime() - now.getTime();
        
        if (diff <= 0) return "Ready to reveal!";
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleCreateCapsule = async () => {
        setIsCreating(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const capsuleData = {
            ...newCapsule,
            id: Date.now().toString(),
            scheduledDate: new Date(newCapsule.scheduledDate),
            isRevealed: false,
            createdAt: new Date()
        };
        
        setCapsules(prev => [capsuleData, ...prev]);
        setShowCreateForm(false);
        setNewCapsule({
            title: "",
            content: "",
            type: "text",
            scheduledDate: "",
            isPublic: false,
            recipients: [],
            tags: []
        });
        setIsCreating(false);
        onCreateCapsule(capsuleData);
    };

    const handleRevealCapsule = (capsule: TimeCapsule) => {
        setCapsules(prev => prev.map(c => 
            c.id === capsule.id ? { ...c, isRevealed: true } : c
        ));
        onRevealCapsule(capsule.id);
    };

    const readyCapsules = capsules.filter(c => 
        new Date(c.scheduledDate) <= currentTime && !c.isRevealed
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <Clock size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Time Capsules</h2>
                                        <p className="text-gray-400 text-sm">Content that appears at specific times</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("my-capsules")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "my-capsules" 
                                            ? "bg-purple-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    My Capsules
                                </button>
                                <button
                                    onClick={() => setActiveTab("create")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "create" 
                                            ? "bg-purple-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Create New
                                </button>
                                <button
                                    onClick={() => setActiveTab("revealed")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "revealed" 
                                            ? "bg-purple-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Revealed
                                </button>
                            </div>

                            {activeTab === "my-capsules" && (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {readyCapsules.length > 0 && (
                                        <div className="mb-4 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles size={16} className="text-green-400" />
                                                <span className="text-green-400 font-medium">Ready to Reveal!</span>
                                            </div>
                                            <p className="text-sm text-gray-300">You have {readyCapsules.length} capsule{readyCapsules.length > 1 ? 's' : ''} ready to be revealed</p>
                                        </div>
                                    )}
                                    
                                    {capsules.map((capsule) => {
                                        const timeUntil = formatTimeUntil(capsule.scheduledDate);
                                        const isReady = new Date(capsule.scheduledDate) <= currentTime;
                                        
                                        return (
                                            <motion.div
                                                key={capsule.id}
                                                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                                                whileHover={{ scale: 1.01 }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-white font-semibold">{capsule.title}</h3>
                                                            {capsule.isPublic ? (
                                                                <Globe size={16} className="text-blue-400" />
                                                            ) : (
                                                                <Lock size={16} className="text-gray-400" />
                                                            )}
                                                            {capsule.isRevealed && (
                                                                <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                                                    Revealed
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{capsule.content}</p>
                                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                {capsule.scheduledDate.toLocaleDateString()}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Timer size={12} />
                                                                {isReady ? "Ready!" : timeUntil}
                                                            </span>
                                                            <span className="capitalize">{capsule.type}</span>
                                                        </div>
                                                        <div className="flex gap-1 mt-2">
                                                            {capsule.tags.map(tag => (
                                                                <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 flex flex-col gap-2">
                                                        {isReady && !capsule.isRevealed && (
                                                            <button
                                                                onClick={() => handleRevealCapsule(capsule)}
                                                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                                                            >
                                                                <Eye size={16} />
                                                                Reveal
                                                            </button>
                                                        )}
                                                        {capsule.isRevealed && (
                                                            <button
                                                                disabled
                                                                className="px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed flex items-center gap-2"
                                                            >
                                                                <EyeOff size={16} />
                                                                Revealed
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === "create" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">Capsule Title</label>
                                        <input
                                            type="text"
                                            value={newCapsule.title}
                                            onChange={(e) => setNewCapsule(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="What's this capsule about?"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-white font-medium mb-2">Content Type</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {["text", "image", "video", "audio"].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setNewCapsule(prev => ({ ...prev, type: type as any }))}
                                                    className={`p-3 rounded-lg border transition-colors ${
                                                        newCapsule.type === type
                                                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                    }`}
                                                >
                                                    <div className="text-sm font-medium capitalize">{type}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-white font-medium mb-2">Content</label>
                                        {newCapsule.type === "text" ? (
                                            <textarea
                                                value={newCapsule.content}
                                                onChange={(e) => setNewCapsule(prev => ({ ...prev, content: e.target.value }))}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
                                                placeholder="Write your message..."
                                            />
                                        ) : (
                                            <div className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center text-gray-400">
                                                {newCapsule.type === "image" && "Upload an image"}
                                                {newCapsule.type === "video" && "Upload a video"}
                                                {newCapsule.type === "audio" && "Upload an audio file"}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-white font-medium mb-2">Reveal Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={newCapsule.scheduledDate}
                                            onChange={(e) => setNewCapsule(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="public"
                                            checked={newCapsule.isPublic}
                                            onChange={(e) => setNewCapsule(prev => ({ ...prev, isPublic: e.target.checked }))}
                                            className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <label htmlFor="public" className="text-white">Make this capsule public</label>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setActiveTab("my-capsules")}
                                            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateCapsule}
                                            disabled={!newCapsule.title || !newCapsule.content || !newCapsule.scheduledDate || isCreating}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} />
                                                    Create Capsule
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "revealed" && (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {capsules.filter(c => c.isRevealed).map((capsule) => (
                                        <motion.div
                                            key={capsule.id}
                                            className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-white font-semibold">{capsule.title}</h3>
                                                <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                                    Revealed
                                                </div>
                                            </div>
                                            <p className="text-gray-300 mb-3">{capsule.content}</p>
                                            <div className="text-xs text-gray-500">
                                                Revealed on {capsule.scheduledDate.toLocaleDateString()}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
