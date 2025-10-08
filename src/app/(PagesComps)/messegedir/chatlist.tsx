"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { connectSocket } from "@/lib/socketClient";

interface Chat {
    id: string;
    chatName: string;
    lastMessage?: string;
    time?: string;
    unread?: boolean;
}

export default function ChatsBox() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        let mounted = true;

        const fetchChats = async () => {
            try {
                console.log("Fetching chats for user:", user?.id);
                const res = await apiFetch("/api/chat");
                if (!mounted) return;
                
                if (res.ok) {
                    const data = await res.json();
                    console.log("Chats fetched:", data);
                    setChats(data || []);
                } else {
                    console.error("Failed to fetch chats:", res.status);
                }
            } catch (err) {
                console.error("Failed to fetch chats:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (user?.id) {
            fetchChats();
        }

        const socket = connectSocket();

        const onNewMessage = (message: any) => {
            console.log("New message received:", message);
            setChats((prevChats) =>
                prevChats.map((chat) =>
                    String(chat.id) === String(message.chatId)
                        ? {
                            ...chat,
                            lastMessage: message.content,
                            time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
                            unread: true,
                        }
                        : chat
                )
            );
        };

        socket.on("newMessage", onNewMessage);

        return () => {
            mounted = false;
            socket.off("newMessage", onNewMessage);
        };
    }, [user?.id]);

    if (loading) return <p className="text-white text-center mt-10">Loading chats...</p>;

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen w-full flex justify-center items-center px-2">
            <section className="bg-gray-800/70 backdrop-blur-md rounded-none lg:rounded-2xl shadow-xl border border-gray-700 w-full lg:max-w-2xl flex flex-col divide-y divide-gray-700 overflow-y-auto">
                <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-700 flex items-center justify-between">
                    <h1 className="text-white text-lg font-semibold">Chats</h1>
                    <button className="text-cyan-400 text-sm hover:underline">New Chat</button>
                </div>

                <div className="flex-1 flex flex-col">
                    {chats.length === 0 ? (
                        <p className="text-gray-400 text-center p-6">No chats found.</p>
                    ) : (
                        chats.map((chat) => (
                            <motion.button
                                key={chat.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-4 p-4 hover:bg-gray-700/40 transition text-left"
                                onClick={() => {
                                    setSelectedChat(chat.id);
                                    router.push(`/messeging/chat/${chat.id}`);
                                }}
                            >
                                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md border border-white/20">
                                    {chat.chatName?.[0] ?? "U"}
                                </div>

                                <div className="flex flex-col flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-white font-medium text-base">{chat.chatName}</p>
                                        <span className="text-xs text-gray-400">{chat.time || ""}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-white text-sm truncate max-w-[70%]">{chat.lastMessage || ""}</p>
                                        {chat.unread && <span className="min-w-[10px] min-h-[10px] rounded-full bg-cyan-400 shadow-md"></span>}
                                    </div>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
