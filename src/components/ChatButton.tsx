"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMessageCircle } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { resolveChatId } from "@/utils/chatUtils";

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
            // Use the create-or-find endpoint which handles both cases
            const response = await apiFetch('/api/chat/create-or-find', {
                method: 'POST',
                body: JSON.stringify({
                    participantId: targetUserId
                })
            }, user?.id);

            if (response.ok) {
                const chatData = await response.json();
                console.log('Chat created/found:', chatData);
                const chatId = resolveChatId(chatData);
                if (chatId) {
                    router.push(`/messeging/chat/${chatId}`);
                } else {
                    console.error('Chat response missing id:', chatData);
                    alert('Chat created but could not open the conversation. Please try again.');
                    router.push('/messeging');
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to create/find chat:', response.status, errorText);
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
