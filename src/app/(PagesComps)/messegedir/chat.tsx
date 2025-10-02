"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiSend, FiSmile, FiMic, FiPaperclip } from "react-icons/fi";
import { motion } from "framer-motion";
import { connectSocket } from "@/lib/socketClient";

interface Message {
    id: string;
    content: string;
    senderId: string;
    chatId: string;
    type: "text" | "sticker" | "audio" | "image" | "video";
    createdAt: string;
    status?: "sent" | "delivered" | "seen";
}

interface Chat {
    id: string;
    chatName: string;
}

interface ChatRoomProps {
    chat: Chat;
    currentUserId: string;
}

const stickers = ["😀","😂","😍","😎","😢","👍","🎉"];

export default function ChatRoom({ chat, currentUserId }: ChatRoomProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [showStickers, setShowStickers] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socket = connectSocket();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/api/messages/${chat.id}`);
                setMessages(res.data);
                scrollToBottom();
            } catch (err) {
                console.error(err);
            }
        };
        fetchMessages();

        socket.emit("joinChat", chat.id);

        socket.on("newMessage", (message: Message) => {
            if (message.chatId === chat.id) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
        });

        socket.on("typing", (userId: string) => {
            if (!typingUsers.includes(userId) && userId !== currentUserId) {
                setTypingUsers((prev) => [...prev, userId]);
                setTimeout(() => {
                    setTypingUsers((prev) => prev.filter((id) => id !== userId));
                }, 2000);
            }
        });

        return () => {
            socket.off("newMessage");
            socket.off("typing");
        };
    }, [chat.id]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const sendTextMessage = async () => {
        if (!newMessage.trim()) return;
        const messageData: Message = {
            id: crypto.randomUUID(),
            content: newMessage,
            senderId: currentUserId,
            chatId: chat.id,
            type: "text",
            createdAt: new Date().toISOString(),
            status: "sent",
        };
        await axios.post(`/api/messages`, messageData);
        socket.emit("sendMessage", messageData);
        setMessages((prev) => [...prev, messageData]);
        setNewMessage("");
        scrollToBottom();
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        socket.emit("typing", currentUserId);
        if (e.key === "Enter") sendTextMessage();
    };

    const sendSticker = (sticker: string) => {
        const messageData: Message = {
            id: crypto.randomUUID(),
            content: sticker,
            senderId: currentUserId,
            chatId: chat.id,
            type: "sticker",
            createdAt: new Date().toISOString(),
            status: "sent",
        };
        socket.emit("sendMessage", messageData);
        setMessages((prev) => [...prev, messageData]);
        setShowStickers(false);
        scrollToBottom();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        const res = await axios.post(`/api/messages/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const messageData: Message = {
            id: crypto.randomUUID(),
            content: res.data.url,
            senderId: currentUserId,
            chatId: chat.id,
            type: file.type.startsWith("image") ? "image" : "video",
            createdAt: new Date().toISOString(),
            status: "sent",
        };
        socket.emit("sendMessage", messageData);
        setMessages((prev) => [...prev, messageData]);
        scrollToBottom();
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-700">
                <h2 className="text-white text-lg font-semibold">{chat.chatName}</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowStickers(!showStickers)} className="text-cyan-400 hover:text-cyan-300">
                        <FiSmile size={20} />
                    </button>
                    <button className={`hover:text-cyan-300 ${recording ? "text-red-500" : "text-cyan-400"}`}>
                        <FiMic size={20} />
                    </button>
                    <label className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                        <FiPaperclip size={20} />
                        <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Stickers */}
            {showStickers && (
                <div className="bg-gray-800 p-2 flex gap-2 flex-wrap border-b border-gray-700">
                    {stickers.map((s) => (
                        <button key={s} onClick={() => sendSticker(s)} className="text-2xl">{s}</button>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {messages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                        <div className={`p-3 rounded-xl max-w-[70%] ${msg.senderId === currentUserId ? "bg-cyan-500 text-white" : "bg-gray-700 text-white"}`}>
                            {msg.type === "text" && msg.content}
                            {msg.type === "sticker" && <span className="text-3xl">{msg.content}</span>}
                            {msg.type === "audio" && <audio controls className="w-full"><source src={msg.content} type="audio/webm" /></audio>}
                            {msg.type === "image" && <img src={msg.content} className="rounded-md max-w-full" />}
                            {msg.type === "video" && <video src={msg.content} controls className="rounded-md max-w-full" />}
                            <div className="text-xs text-gray-300 text-right mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                {msg.senderId === currentUserId && msg.status && <span className="ml-1">{msg.status === "seen" ? "✓✓" : "✓"}</span>}
                            </div>
                        </div>
                    </motion.div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
                <div className="text-gray-400 text-sm px-4 pb-1">
                    {typingUsers.join(", ")} typing...
                </div>
            )}

            {/* Input */}
            <div className="flex items-center p-4 bg-gray-900/80 border-t border-gray-700 gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 p-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button onClick={sendTextMessage} className="p-3 bg-cyan-400 rounded-full hover:bg-cyan-500 transition">
                    <FiSend size={20} className="text-white" />
                </button>
            </div>
        </div>
    );
}
