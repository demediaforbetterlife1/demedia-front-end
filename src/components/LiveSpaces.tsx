"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    Plus, 
    Video, 
    Mic, 
    MicOff, 
    VideoOff, 
    MessageCircle, 
    Share2, 
    Settings,
    X,
    Crown,
    UserPlus,
    Lock,
    Globe
} from "lucide-react";

interface LiveSpace {
    id: string;
    name: string;
    description: string;
    participants: number;
    maxParticipants: number;
    isPrivate: boolean;
    isLive: boolean;
    creator: string;
    tags: string[];
}

interface LiveSpacesProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSpace: (spaceData: any) => void;
    onJoinSpace: (spaceId: string) => void;
}

const sampleSpaces: LiveSpace[] = [
    {
        id: "1",
        name: "Creative Writing Workshop",
        description: "Collaborative story writing session",
        participants: 8,
        maxParticipants: 12,
        isPrivate: false,
        isLive: true,
        creator: "Sarah Johnson",
        tags: ["writing", "creative", "collaboration"]
    },
    {
        id: "2", 
        name: "Music Production Lab",
        description: "Real-time music creation and mixing",
        participants: 5,
        maxParticipants: 8,
        isPrivate: false,
        isLive: true,
        creator: "Mike Chen",
        tags: ["music", "production", "audio"]
    },
    {
        id: "3",
        name: "Design Thinking Session",
        description: "Brainstorming and prototyping ideas",
        participants: 12,
        maxParticipants: 15,
        isPrivate: true,
        isLive: true,
        creator: "Alex Rivera",
        tags: ["design", "innovation", "brainstorming"]
    }
];

export default function LiveSpaces({ isOpen, onClose, onCreateSpace, onJoinSpace }: LiveSpacesProps) {
    const [activeTab, setActiveTab] = useState<"browse" | "create">("browse");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [spaces, setSpaces] = useState<LiveSpace[]>(sampleSpaces);
    const [isCreating, setIsCreating] = useState(false);
    const [newSpace, setNewSpace] = useState({
        name: "",
        description: "",
        maxParticipants: 10,
        isPrivate: false,
        tags: [] as string[]
    });

    const [currentSpace, setCurrentSpace] = useState<LiveSpace | null>(null);
    const [isInSpace, setIsInSpace] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const handleCreateSpace = async () => {
        setIsCreating(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const spaceData = {
            ...newSpace,
            id: Date.now().toString(),
            participants: 1,
            isLive: true,
            creator: "You"
        };
        
        setSpaces(prev => [spaceData, ...prev]);
        setShowCreateForm(false);
        setNewSpace({
            name: "",
            description: "",
            maxParticipants: 10,
            isPrivate: false,
            tags: []
        });
        setIsCreating(false);
        onCreateSpace(spaceData);
    };

    const handleJoinSpace = (space: LiveSpace) => {
        setCurrentSpace(space);
        setIsInSpace(true);
        onJoinSpace(space.id);
    };

    const handleLeaveSpace = () => {
        setCurrentSpace(null);
        setIsInSpace(false);
        setIsMuted(false);
        setIsVideoOff(false);
    };

    if (isInSpace && currentSpace) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                {/* Header */}
                <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div>
                            <h2 className="text-white font-semibold">{currentSpace.name}</h2>
                            <p className="text-gray-400 text-sm">{currentSpace.participants} participants</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLeaveSpace}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex">
                    {/* Video Grid */}
                    <div className="flex-1 p-4">
                        <div className="grid grid-cols-2 gap-4 h-full">
                            {/* Your Video */}
                            <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-white font-bold">You</span>
                                </div>
                                <div className="text-white text-sm">Your Camera</div>
                                {isVideoOff && <div className="text-gray-400 text-xs mt-1">Camera Off</div>}
                            </div>

                            {/* Other Participants */}
                            {Array.from({ length: Math.min(currentSpace.participants - 1, 3) }).map((_, i) => (
                                <div key={i} className="bg-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-white font-bold">P{i + 1}</span>
                                    </div>
                                    <div className="text-white text-sm">Participant {i + 1}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 bg-gray-900 border-l border-gray-700 p-4">
                        <h3 className="text-white font-semibold mb-4">Collaboration Tools</h3>
                        
                        {/* Controls */}
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                                    isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                {isMuted ? 'Unmute' : 'Mute'}
                            </button>
                            
                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                                    isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                {isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
                            </button>
                        </div>

                        {/* Chat */}
                        <div className="mb-4">
                            <h4 className="text-white font-medium mb-2">Live Chat</h4>
                            <div className="bg-gray-800 rounded-lg p-3 h-32 overflow-y-auto mb-2">
                                <div className="text-sm text-gray-300 space-y-1">
                                    <div><span className="text-indigo-400">Sarah:</span> Great idea!</div>
                                    <div><span className="text-green-400">Mike:</span> Let's try this approach</div>
                                    <div><span className="text-yellow-400">Alex:</span> I agree with Sarah</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                                    <MessageCircle size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Shared Resources */}
                        <div>
                            <h4 className="text-white font-medium mb-2">Shared Resources</h4>
                            <div className="space-y-2">
                                <div className="bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                                    <Share2 size={16} className="text-blue-400" />
                                    <span className="text-sm text-gray-300">Document.docx</span>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                                    <Video size={16} className="text-green-400" />
                                    <span className="text-sm text-gray-300">Presentation.mp4</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                        <Users size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Live Collaboration Spaces</h2>
                                        <p className="text-gray-400 text-sm">Real-time collaborative content creation</p>
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
                                    onClick={() => setActiveTab("browse")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "browse" 
                                            ? "bg-indigo-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Browse Spaces
                                </button>
                                <button
                                    onClick={() => setActiveTab("create")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "create" 
                                            ? "bg-indigo-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Create Space
                                </button>
                            </div>

                            {activeTab === "browse" && (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {spaces.map((space) => (
                                        <motion.div
                                            key={space.id}
                                            className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-white font-semibold">{space.name}</h3>
                                                        {space.isPrivate && <Lock size={16} className="text-gray-400" />}
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                            <span className="text-xs text-green-400">Live</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-3">{space.description}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{space.participants}/{space.maxParticipants} participants</span>
                                                        <span>by {space.creator}</span>
                                                    </div>
                                                    <div className="flex gap-1 mt-2">
                                                        {space.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleJoinSpace(space)}
                                                    disabled={space.participants >= space.maxParticipants}
                                                    className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Join
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "create" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">Space Name</label>
                                        <input
                                            type="text"
                                            value={newSpace.name}
                                            onChange={(e) => setNewSpace(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter space name..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">Description</label>
                                        <textarea
                                            value={newSpace.description}
                                            onChange={(e) => setNewSpace(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                            placeholder="What will this space be used for?"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-white font-medium mb-2">Max Participants</label>
                                            <input
                                                type="number"
                                                value={newSpace.maxParticipants}
                                                onChange={(e) => setNewSpace(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                min="2"
                                                max="20"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-6">
                                            <input
                                                type="checkbox"
                                                id="private"
                                                checked={newSpace.isPrivate}
                                                onChange={(e) => setNewSpace(prev => ({ ...prev, isPrivate: e.target.checked }))}
                                                className="w-4 h-4 text-indigo-500 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor="private" className="text-white">Private Space</label>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setActiveTab("browse")}
                                            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateSpace}
                                            disabled={!newSpace.name || !newSpace.description || isCreating}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={16} />
                                                    Create Space
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
