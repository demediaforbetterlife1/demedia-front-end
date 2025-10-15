"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSend, FiSmile, FiMic, FiPaperclip, FiArrowLeft, FiMoreVertical, FiUserX, FiTrash2, FiEdit } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { connectSocket } from "@/lib/socketClient";

interface Message {
    id: string;
    content: string;
    senderId: string;
    chatId: string;
    type: "text" | "sticker" | "audio" | "image" | "video";
    createdAt: string;
    status?: "sent" | "delivered" | "seen";
    sender?: {
        id: string;
        name: string;
        username: string;
        profilePicture?: string;
    };
}

interface Chat {
    id: string;
    chatName: string;
    participants: Array<{
        id: string;
        name: string;
        username: string;
        profilePicture?: string;
    }>;
}

const stickers = ["😀", "😂", "😍", "😎", "😢", "👍", "🎉", "❤️", "🔥", "💯"];

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const chatId = params.chatId as string;
    
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [showStickers, setShowStickers] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socket = connectSocket();

    useEffect(() => {
        if (!chatId || !user?.id) return;

        const fetchChatData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch chat details
                const chatRes = await apiFetch(`/api/chat/${chatId}`);
                if (chatRes.ok) {
                    const chatData = await chatRes.json();
                    setChat(chatData);
                }

                // Fetch messages
                const messagesRes = await apiFetch(`/api/messages/${chatId}`);
                if (messagesRes.ok) {
                    const messagesData = await messagesRes.json();
                    setMessages(messagesData);
                    scrollToBottom();
                }
            } catch (err) {
                console.error("Error fetching chat data:", err);
                setError("Failed to load chat");
            } finally {
                setIsLoading(false);
            }
        };

        fetchChatData();

        // Socket events
        socket.emit("joinChat", chatId);

        const onNewMessage = (message: Message) => {
            if (message.chatId === chatId) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
        };

        const onTyping = (data: { userId: string; isTyping: boolean }) => {
            if (data.userId !== user?.id) {
                if (data.isTyping) {
                    setTypingUsers((prev) => [...prev.filter(id => id !== data.userId), data.userId]);
                } else {
                    setTypingUsers((prev) => prev.filter(id => id !== data.userId));
                }
            }
        };

        const onMessageReaction = (data: { messageId: string; reaction: string; userId: string }) => {
            setMessageReactions((prev) => ({
                ...prev,
                [data.messageId]: [...(prev[data.messageId] || []), data.reaction]
            }));
        };

        const onMessageSeen = (data: { messageId: string; userId: string }) => {
            // Handle message seen status
            console.log(`Message ${data.messageId} seen by ${data.userId}`);
        };

        socket.on("newMessage", onNewMessage);
        socket.on("typing", onTyping);
        socket.on("messageReaction", onMessageReaction);
        socket.on("messageSeen", onMessageSeen);

        return () => {
            socket.off("newMessage", onNewMessage);
            socket.off("typing", onTyping);
            socket.off("messageReaction", onMessageReaction);
            socket.off("messageSeen", onMessageSeen);
        };
    }, [chatId, user?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendTextMessage = async () => {
        if (!newMessage.trim() || !user?.id) return;
        
        setIsSending(true);
        setError(null);
        
        try {
            const messageData = {
                chatId: parseInt(chatId, 10),
                senderId: parseInt(user.id, 10),
                content: newMessage,
                type: "text",
            };
            
            const res = await apiFetch("/api/messages", {
                method: "POST",
                body: JSON.stringify(messageData),
            });

            if (res.ok) {
                const savedMessage = await res.json();
                socket.emit("sendMessage", savedMessage);
                setMessages((prev) => [...prev, savedMessage]);
                setNewMessage("");
                scrollToBottom();
            } else {
                throw new Error("Failed to send message");
            }
        } catch (err: any) {
            console.error('Message send error:', err);
            setError(err.message || "Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (user?.id && !isTyping) {
            setIsTyping(true);
            socket.emit("typing", { chatId, userId: user.id, isTyping: true });
        }
        
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        
        const timeout = setTimeout(() => {
            if (user?.id) {
                socket.emit("stopTyping", { chatId, userId: user.id });
                setIsTyping(false);
            }
        }, 1000);
        
        setTypingTimeout(timeout);
        
        if (e.key === "Enter") sendTextMessage();
    };

    const sendSticker = (sticker: string) => {
        if (!user?.id) return;
        
        const messageData = {
            chatId: parseInt(chatId, 10),
            senderId: parseInt(user.id, 10),
            content: sticker,
            type: "sticker",
        };
        
        socket.emit("sendMessage", messageData);
        setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            content: sticker,
            senderId: user.id,
            chatId,
            type: "sticker",
            createdAt: new Date().toISOString(),
            status: "sent",
        }]);
        setShowStickers(false);
        scrollToBottom();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: "audio/wav" });
                // Handle audio upload here
                console.log("Audio recorded:", audioBlob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && recording) {
            mediaRecorder.stop();
            setRecording(false);
        }
    };

    const addReaction = (messageId: string, reaction: string) => {
        if (!user?.id) return;
        
        socket.emit("messageReaction", {
            chatId,
            messageId,
            reaction,
            userId: user.id
        });
    };

    const markMessageAsSeen = (messageId: string) => {
        if (!user?.id) return;
        
        socket.emit("messageSeen", {
            chatId,
            messageId,
            userId: user.id
        });
    };

    const blockUser = async (userId: string) => {
        if (!confirm('Are you sure you want to block this user? This will prevent them from messaging you.')) return;

        try {
            const response = await apiFetch(`/api/users/${userId}/block`, {
                method: 'POST',
            });

            if (response.ok) {
                alert('User blocked successfully');
                router.push('/messaging');
            } else {
                alert('Failed to block user');
            }
        } catch (err) {
            console.error('Error blocking user:', err);
            alert('Failed to block user');
        }
    };

    const deleteChat = async () => {
        if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) return;

        try {
            const response = await apiFetch(`/api/chat/${chatId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Chat deleted successfully');
                router.push('/messaging');
            } else {
                alert('Failed to delete chat');
            }
        } catch (err) {
            console.error('Error deleting chat:', err);
            alert('Failed to delete chat');
        }
    };

    const editMessage = async (messageId: string) => {
        if (!editContent.trim()) return;

        try {
            const response = await apiFetch(`/api/messages/${messageId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    content: editContent.trim()
                })
            });

            if (response.ok) {
                const updatedMessage = await response.json();
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                        ? { ...msg, content: updatedMessage.content }
                        : msg
                ));
                setEditingMessage(null);
                setEditContent("");
            }
        } catch (err) {
            console.error('Error editing message:', err);
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const response = await apiFetch(`/api/messages/${messageId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
            }
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    };

    const canEditOrDeleteMessage = (message: Message) => {
        return user && user.id === message.senderId;
    };

    // Close chat menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showChatMenu) {
                setShowChatMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showChatMenu]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p>Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-700 rounded-full transition"
                >
                    <FiArrowLeft size={20} />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {chat?.chatName?.[0] ?? "U"}
                </div>
                
                <div className="flex-1">
                    <h2 className="font-semibold">{chat?.chatName ?? "Chat"}</h2>
                    <p className="text-sm text-gray-400">
                        {chat?.participants?.length ?? 0} participants
                    </p>
                </div>

                {/* Chat Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowChatMenu(!showChatMenu)}
                        className="p-2 hover:bg-gray-700 rounded-full transition"
                    >
                        <FiMoreVertical size={20} />
                    </button>
                    
                    {showChatMenu && (
                        <div className="absolute right-0 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                            <button
                                onClick={() => {
                                    const otherParticipant = chat?.participants?.find(p => p.id !== user?.id);
                                    if (otherParticipant) {
                                        blockUser(otherParticipant.id);
                                    }
                                    setShowChatMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-red-400"
                            >
                                <FiUserX size={16} />
                                Block User
                            </button>
                            <button
                                onClick={() => {
                                    deleteChat();
                                    setShowChatMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-red-400"
                            >
                                <FiTrash2 size={16} />
                                Delete Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                            message.senderId === user?.id
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-700 text-white"
                        }`}>
                            {editingMessage === message.id ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                                        placeholder="Edit message..."
                                    />
                                    <button
                                        onClick={() => editMessage(message.id)}
                                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingMessage(null);
                                            setEditContent("");
                                        }}
                                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {message.type === "sticker" ? (
                                        <div className="text-2xl">{message.content}</div>
                                    ) : (
                                        <p className="text-sm">{message.content}</p>
                                    )}
                                    <p className="text-xs opacity-70 mt-1">
                                        {new Date(message.createdAt).toLocaleTimeString()}
                                    </p>
                                    
                                    {/* Message Actions */}
                                    {canEditOrDeleteMessage(message) && (
                                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingMessage(message.id);
                                                        setEditContent(message.content);
                                                    }}
                                                    className="p-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                                                    title="Edit message"
                                                >
                                                    <FiEdit size={12} />
                                                </button>
                                                <button
                                                    onClick={() => deleteMessage(message.id)}
                                                    className="p-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                                                    title="Delete message"
                                                >
                                                    <FiTrash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                ))}
                
                {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 px-4 py-2 rounded-lg">
                            <p className="text-sm text-gray-400">
                                {typingUsers.join(", ")} is typing...
                            </p>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mx-4 mb-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
            )}

            {/* Stickers */}
            {showStickers && (
                <div className="bg-gray-800 border-t border-gray-700 p-4">
                    <div className="grid grid-cols-5 gap-2">
                        {stickers.map((sticker) => (
                            <button
                                key={sticker}
                                onClick={() => sendSticker(sticker)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition text-2xl"
                            >
                                {sticker}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowStickers(!showStickers)}
                        className="p-2 hover:bg-gray-700 rounded-full transition"
                    >
                        <FiSmile size={20} />
                    </button>
                    
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    
                    <button
                        onClick={recording ? stopRecording : startRecording}
                        className={`p-2 rounded-full transition ${
                            recording ? "bg-red-500 hover:bg-red-600" : "hover:bg-gray-700"
                        }`}
                    >
                        <FiMic size={20} />
                    </button>
                    
                    <button
                        onClick={sendTextMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="p-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition"
                    >
                        <FiSend size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
