"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMessageCircle } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

interface ChatButtonProps {
    targetUserId: string;
    targetUserName: string;
    className?: string;
}

export default function ChatButton({ targetUserId, targetUserName, className = "" }: ChatButtonProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const startChat = async () => {
        if (!user || user.id === targetUserId) return;
        
        setIsLoading(true);
        
        try {
            // Check if chat already exists
            const existingChatResponse = await apiFetch(`/api/chat/find/${targetUserId}`);
            
            if (existingChatResponse.ok) {
                const existingChat = await existingChatResponse.json();
                router.push(`/messaging/chat/${existingChat.id}`);
                return;
            }

            // Create new chat
            const response = await apiFetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    participants: [user.id, targetUserId],
                    chatName: `Chat with ${targetUserName}`
                })
            });

            if (response.ok) {
                const newChat = await response.json();
                router.push(`/messaging/chat/${newChat.id}`);
            } else {
                alert('Failed to start chat. Please try again.');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            alert('Failed to start chat. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user || user.id === targetUserId) {
        return null;
    }

    return (
        <button
            onClick={startChat}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            <FiMessageCircle size={16} />
            {isLoading ? 'Starting chat...' : 'Message'}
        </button>
    );
}
