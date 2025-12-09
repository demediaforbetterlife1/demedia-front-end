"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    Plus, 
    Mic, 
    Video, 
    MessageCircle, 
    Heart, 
    Star,
    Zap,
    Crown,
    Timer,
    MapPin,
    Gift,
    Search,
    X,
    Check,
    Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

interface Collaborator {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role: 'creator' | 'contributor' | 'viewer';
    contribution?: string;
}

interface SearchUser {
    id: number;
    name: string;
    username: string;
    profilePicture: string | null;
}

interface CollaborativeFeaturesProps {
    deSnapId: string;
    onCollaborationUpdate: (collaborators: Collaborator[]) => void;
}

export default function CollaborativeFeatures({ deSnapId, onCollaborationUpdate }: CollaborativeFeaturesProps) {
    const { user } = useAuth();
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set());

    // Search for users to invite
    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            
            setSearching(true);
            try {
                // In a real app, this would be a dedicated search endpoint
                const response = await apiFetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {}, user?.id);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(Array.isArray(data) ? data.filter((u: SearchUser) => u.id !== user?.id) : []);
                } else {
                    // Fallback: show empty results
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        };
        
        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, user?.id]);

    const toggleFeature = (featureId: string) => {
        setEnabledFeatures(prev => {
            const newSet = new Set(prev);
            if (newSet.has(featureId)) {
                newSet.delete(featureId);
            } else {
                newSet.add(featureId);
            }
            return newSet;
        });
    };

    const uniqueFeatures = [
        {
            id: "live-reactions",
            name: "Live Reactions",
            description: "Real-time reactions that appear on screen",
            icon: Heart,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            unique: true
        },
        {
            id: "voice-notes",
            name: "Voice Notes",
            description: "Add voice commentary over the video",
            icon: Mic,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            unique: true
        },
        {
            id: "collaborative-editing",
            name: "Live Editing",
            description: "Multiple people can edit simultaneously",
            icon: Users,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            unique: true
        },
        {
            id: "reaction-polls",
            name: "Reaction Polls",
            description: "Interactive polls that appear during playback",
            icon: MessageCircle,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            unique: true
        },
        {
            id: "time-capsule",
            name: "Time Capsule",
            description: "Schedule DeSnaps to appear at specific times",
            icon: Timer,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10",
            unique: true
        },
        {
            id: "location-tags",
            name: "Smart Location Tags",
            description: "Auto-detect and tag locations with AR overlays",
            icon: MapPin,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            unique: true
        },
        {
            id: "mystery-reveals",
            name: "Mystery Reveals",
            description: "Hide content that reveals based on interactions",
            icon: Star,
            color: "text-pink-500",
            bgColor: "bg-pink-500/10",
            unique: true
        },
        {
            id: "reward-system",
            name: "Creator Rewards",
            description: "Earn tokens for engagement and creativity",
            icon: Gift,
            color: "text-cyan-500",
            bgColor: "bg-cyan-500/10",
            unique: true
        }
    ];

    const addCollaborator = (searchUser: SearchUser) => {
        // Check if already added
        if (collaborators.some(c => c.id === String(searchUser.id))) {
            return;
        }
        
        const newCollaborator: Collaborator = {
            id: String(searchUser.id),
            name: searchUser.name,
            username: searchUser.username,
            avatar: searchUser.profilePicture || '',
            role: 'contributor'
        };
        
        const updatedCollaborators = [...collaborators, newCollaborator];
        setCollaborators(updatedCollaborators);
        onCollaborationUpdate(updatedCollaborators);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeCollaborator = (id: string) => {
        const updatedCollaborators = collaborators.filter(c => c.id !== id);
        setCollaborators(updatedCollaborators);
        onCollaborationUpdate(updatedCollaborators);
    };
    
    const updateCollaboratorRole = (id: string, role: 'creator' | 'contributor' | 'viewer') => {
        const updatedCollaborators = collaborators.map(c => 
            c.id === id ? { ...c, role } : c
        );
        setCollaborators(updatedCollaborators);
        onCollaborationUpdate(updatedCollaborators);
    };

    return (
        <div className="space-y-6">
            {/* Unique Features Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white">Unique DeSnaps Features</h2>
                    <Crown className="w-6 h-6 text-yellow-400" />
                </div>
                <p className="text-gray-400">Features that don't exist anywhere else</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uniqueFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isActive = activeFeature === feature.id;
                    
                    return (
                        <motion.button
                            key={feature.id}
                            onClick={() => setActiveFeature(isActive ? null : feature.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border transition-all ${
                                isActive
                                    ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
                                    : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                            }`}
                        >
                            {/* Unique Badge */}
                            {feature.unique && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                    <Zap className="w-3 h-3 text-white" />
                                </div>
                            )}
                            
                            <div className="flex flex-col items-center space-y-2 text-center">
                                <Icon className={`w-6 h-6 ${feature.color}`} />
                                <h3 className="font-semibold text-white text-sm">{feature.name}</h3>
                                <p className="text-xs text-gray-400">{feature.description}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Active Feature Details */}
            <AnimatePresence>
                {activeFeature && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-2xl p-6 border border-yellow-500/20"
                    >
                        {activeFeature === "live-reactions" && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Heart className="w-6 h-6 text-red-400" />
                                    Live Reactions
                                </h3>
                                <p className="text-gray-300">
                                    Viewers can react in real-time and their reactions appear as floating emojis on the video.
                                    This creates an immersive, interactive experience unlike any other platform.
                                </p>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
                                        Enable Live Reactions
                                    </button>
                                    <button className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg border border-gray-500/30">
                                        Customize Emojis
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeFeature === "voice-notes" && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Mic className="w-6 h-6 text-blue-400" />
                                    Voice Notes
                                </h3>
                                <p className="text-gray-300">
                                    Add voice commentary that plays over the video. Perfect for tutorials, reactions, or personal messages.
                                    Voice notes can be layered and synchronized with specific moments.
                                </p>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
                                        Record Voice Note
                                    </button>
                                    <button className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg border border-gray-500/30">
                                        Sync with Video
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeFeature === "collaborative-editing" && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="w-6 h-6 text-green-400" />
                                    Live Collaborative Editing
                                </h3>
                                <p className="text-gray-300">
                                    Multiple people can edit the same DeSnap simultaneously. See each other's cursors and changes in real-time.
                                    Perfect for group projects and creative collaborations.
                                </p>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">
                                        Invite Collaborators
                                    </button>
                                    <button className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg border border-gray-500/30">
                                        Set Permissions
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeFeature === "time-capsule" && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Timer className="w-6 h-6 text-yellow-400" />
                                    Time Capsule
                                </h3>
                                <p className="text-gray-300">
                                    Schedule DeSnaps to appear at specific times, dates, or even years in the future.
                                    Create time capsules for special moments and future revelations.
                                </p>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30">
                                        Schedule Release
                                    </button>
                                    <button className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg border border-gray-500/30">
                                        Set Conditions
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collaborators Section */}
            <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Collaborators</h3>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Collaborator
                    </button>
                </div>
                
                {collaborators.length > 0 ? (
                    <div className="space-y-2">
                        {collaborators.map((collaborator) => (
                            <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {collaborator.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{collaborator.name}</p>
                                        <p className="text-gray-400 text-sm capitalize">{collaborator.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeCollaborator(collaborator.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">No collaborators yet</p>
                )}
            </div>
        </div>
    );
}
