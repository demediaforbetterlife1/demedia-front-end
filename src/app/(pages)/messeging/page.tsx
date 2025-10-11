"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageCircle, 
    Send, 
    Search, 
    MoreVertical,
    Phone,
    Video,
    Smile,
    Paperclip,
    Mic,
    MicOff,
    PhoneCall,
    PhoneOff,
    Users,
    Settings,
    Archive,
    Trash2,
    Star,
    Reply,
    Forward,
    Copy,
    Edit,
    Check,
    CheckCheck,
    Clock,
    AlertCircle
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

interface Message {
    id: number;
    content: string;
    senderId: number;
    receiverId: number;
    createdAt: string;
    isRead: boolean;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    replyTo?: number;
    forwardedFrom?: number;
}

interface Conversation {
    id: number;
    participant: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
        isOnline: boolean;
        lastSeen?: string;
    };
    lastMessage: Message;
    unreadCount: number;
    isPinned: boolean;
    isArchived: boolean;
    isMuted: boolean;
    createdAt: string;
}

export default function MessagingPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [isInCall, setIsInCall] = useState(false);

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    card: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-100',
                    input: 'bg-white border-gray-300'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-100',
                    card: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-50',
                    input: 'bg-white border-gray-200'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    input: 'bg-gray-700 border-gray-600'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    card: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    input: 'bg-gray-800 border-gray-700'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    input: 'bg-gray-700 border-gray-600'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching conversations...');
            
            // Try multiple endpoints with fallback
            let response;
            let data;
            
            try {
                // First try the main conversations endpoint
                response = await apiFetch('/api/conversations');
                console.log('Conversations API response:', response.status, response.ok);
                
                if (response.ok) {
                    data = await response.json();
                    console.log('Conversations data received:', data);
                    setConversations(Array.isArray(data) ? data : []);
                    return;
                }
            } catch (apiError) {
                console.warn('Main API failed, trying fallback:', apiError);
            }
            
            // Fallback: Try chat endpoint
            try {
                response = await apiFetch('/api/chat');
                if (response.ok) {
                    data = await response.json();
                    console.log('Chat data received:', data);
                    setConversations(Array.isArray(data) ? data : []);
                    return;
                }
            } catch (chatError) {
                console.warn('Chat API failed, trying direct fetch:', chatError);
            }
            
        // Final fallback: Direct fetch to backend with multiple endpoints
        try {
            const directResponse = await fetch('https://demedia-backend.fly.dev/api/conversations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            if (directResponse.ok) {
                data = await directResponse.json();
                console.log('Direct conversations data received:', data);
                setConversations(Array.isArray(data) ? data : []);
                return;
            }
        } catch (directError) {
            console.warn('Direct fetch failed, trying alternative endpoints:', directError);
            
            // Try alternative endpoints
            try {
                const altResponse = await fetch('https://demedia-backend.fly.dev/api/chat', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (altResponse.ok) {
                    data = await altResponse.json();
                    console.log('Alternative conversations data received:', data);
                    setConversations(Array.isArray(data) ? data : []);
                    return;
                }
            } catch (altError) {
                console.warn('Alternative endpoint failed:', altError);
            }
        }
            
            // If all methods fail, show error but don't crash
            const errorText = response ? await response.text() : 'All fetch methods failed';
            console.error('All conversation fetch methods failed:', errorText);
            setError(`Unable to fetch conversations. Please check your connection and try again.`);
            setConversations([]);
            
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError(`Network error: ${err instanceof Error ? err.message : 'Unable to fetch conversations'}`);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: number) => {
        try {
            console.log('Fetching messages for conversation:', conversationId);
            
            // Try multiple endpoints with fallback
            let response;
            let data;
            
            try {
                // First try the main messages endpoint
                response = await apiFetch(`/api/conversations/${conversationId}/messages`);
                console.log('Messages API response:', response.status, response.ok);
                
                if (response.ok) {
                    data = await response.json();
                    console.log('Messages data received:', data);
                    setMessages(Array.isArray(data) ? data : []);
                    return;
                }
            } catch (apiError) {
                console.warn('Main API failed, trying fallback:', apiError);
            }
            
            // Fallback: Try direct fetch to backend
            try {
                const directResponse = await fetch(`https://demedia-backend.fly.dev/api/conversations/${conversationId}/messages`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                if (directResponse.ok) {
                    data = await directResponse.json();
                    console.log('Direct messages data received:', data);
                    setMessages(Array.isArray(data) ? data : []);
                    return;
                }
            } catch (directError) {
                console.warn('Direct fetch failed:', directError);
            }
            
            // If all methods fail, show error but don't crash
            const errorText = response ? await response.text() : 'All fetch methods failed';
            console.error('All message fetch methods failed:', errorText);
            setMessages([]);
            
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setMessages([]);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const response = await apiFetch(`/api/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newMessage.trim(),
                    type: 'text'
                })
            });

            if (response.ok) {
                const newMsg = await response.json();
                setMessages(prev => [...prev, newMsg]);
                setNewMessage('');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        searchQuery === '' ||
        conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className={themeClasses.textSecondary}>Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0`}>
            {/* Header */}
            <div className={`sticky top-0 z-40 ${themeClasses.card} ${themeClasses.border} border-b px-4 py-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-bold ${themeClasses.text}`}>Messages</h1>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>Chat with friends</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}>
                            <Settings className="w-5 h-5" />
                        </button>
                        <button className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}>
                            <Archive className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-140px)]">
                {/* Conversations List */}
                <div className={`w-full md:w-1/3 ${themeClasses.card} ${themeClasses.border} border-r`}>
                    {error ? (
                        <div className="p-4 text-center">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className={themeClasses.textSecondary}>{error}</p>
                            <button
                                onClick={fetchConversations}
                                className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-4 text-center">
                            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>No conversations</h3>
                            <p className={themeClasses.textSecondary}>
                                {searchQuery ? 'No conversations match your search' : 'Start a conversation with someone!'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto">
                            {filteredConversations.map((conversation) => (
                                <motion.div
                                    key={conversation.id}
                                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`p-4 border-b ${themeClasses.border} cursor-pointer ${
                                        selectedConversation?.id === conversation.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold">
                                                    {conversation.participant.name.charAt(0)}
                                                </span>
                                            </div>
                                            {conversation.participant.isOnline && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-semibold ${themeClasses.text} truncate`}>
                                                    {conversation.participant.name}
                                                </h3>
                                                <span className={`text-xs ${themeClasses.textSecondary}`}>
                                                    {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm ${themeClasses.textSecondary} truncate`}>
                                                    {conversation.lastMessage.content}
                                                </p>
                                                {conversation.unreadCount > 0 && (
                                                    <div className="bg-purple-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                        {conversation.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Area */}
                {selectedConversation ? (
                    <div className="hidden md:flex flex-1 flex-col">
                        {/* Chat Header */}
                        <div className={`${themeClasses.card} ${themeClasses.border} border-b px-4 py-3`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            {selectedConversation.participant.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${themeClasses.text}`}>
                                            {selectedConversation.participant.name}
                                        </h3>
                                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                                            {selectedConversation.participant.isOnline ? 'Online' : 'Last seen recently'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setShowCallModal(true)}
                                        className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
                                    >
                                        <Phone className="w-5 h-5" />
                                    </button>
                                    <button className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}>
                                        <Video className="w-5 h-5" />
                                    </button>
                                    <button className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}>
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.senderId === Number(user?.id) ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        message.senderId === Number(user?.id)
                                            ? 'bg-purple-500 text-white'
                                            : `${themeClasses.card} ${themeClasses.text}`
                                    }`}>
                                        <p className="text-sm">{message.content}</p>
                                        <div className="flex items-center justify-end mt-1 space-x-1">
                                            <span className="text-xs opacity-70">
                                                {new Date(message.createdAt).toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                            {message.senderId === Number(user?.id) && (
                                                <CheckCheck className="w-3 h-3 opacity-70" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className={`${themeClasses.card} ${themeClasses.border} border-t px-4 py-3`}>
                            <div className="flex items-center space-x-2">
                                <button className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}>
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        className={`w-full px-4 py-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                    />
        </div>
                                
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                                
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Select a conversation</h3>
                            <p className={themeClasses.textSecondary}>Choose a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}