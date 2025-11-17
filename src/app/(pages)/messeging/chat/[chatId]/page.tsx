"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSend, 
  FiSmile, 
  FiMic, 
  FiPaperclip, 
  FiArrowLeft, 
  FiMoreVertical, 
  FiUserX,
  FiTrash2,
  FiEdit,
  FiSettings,
  FiArchive,
  FiVolume2,
  FiVolumeX,
  FiEye,
  FiEyeOff,
  FiHeart,
  FiCornerUpLeft,
  FiDownload,
  FiShare
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { apiFetch } from "@/lib/api";
import ChatSettingsModal from "@/components/ChatSettingsModal";

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

const stickers = ["😀", "😂", "😍", "😎", "😢", "👍", "🎉", "❤️", "🔥", "💯", "😊", "🤔", "😮", "😴", "🤗"];

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();
  const chatId = params.chatId as string;
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-900',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-100',
          shadow: 'shadow-lg',
          card: 'bg-white',
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
          input: 'bg-white border-gray-300 text-gray-900',
          messageOwn: 'bg-blue-500 text-white',
          messageOther: 'bg-white text-gray-900 border border-gray-200'
        };
      case 'super-light':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-800',
          border: 'border-gray-100',
          hover: 'hover:bg-gray-100',
          shadow: 'shadow-md',
          card: 'bg-white',
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
          input: 'bg-white border-gray-200 text-gray-800',
          messageOwn: 'bg-blue-500 text-white',
          messageOther: 'bg-white text-gray-800 border border-gray-100'
        };
      case 'dark':
        return {
          bg: 'bg-gray-900',
          text: 'text-white',
          border: 'border-gray-700',
          hover: 'hover:bg-gray-800',
          shadow: 'shadow-2xl',
          card: 'bg-gray-800',
          button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
          buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white',
          input: 'bg-gray-800 border-gray-600 text-white',
          messageOwn: 'bg-cyan-500 text-white',
          messageOther: 'bg-gray-800 text-white border border-gray-700'
        };
      case 'super-dark':
        return {
          bg: 'bg-black',
          text: 'text-gray-100',
          border: 'border-gray-800',
          hover: 'hover:bg-gray-900',
          shadow: 'shadow-2xl',
          card: 'bg-gray-900',
          button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
          buttonSecondary: 'bg-gray-800 hover:bg-gray-700 text-gray-100',
          input: 'bg-gray-900 border-gray-700 text-gray-100',
          messageOwn: 'bg-cyan-500 text-white',
          messageOther: 'bg-gray-900 text-gray-100 border border-gray-800'
        };
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800',
          text: 'text-yellow-100',
          border: 'border-yellow-600/50',
          hover: 'hover:bg-yellow-800/80',
          shadow: 'shadow-2xl gold-glow',
          card: 'bg-yellow-800/50',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100',
          buttonSecondary: 'bg-yellow-700/50 hover:bg-yellow-600/50 text-yellow-100',
          input: 'bg-yellow-800/50 border-yellow-600/50 text-yellow-100',
          messageOwn: 'bg-yellow-600 text-yellow-100',
          messageOther: 'bg-yellow-800/50 text-yellow-100 border border-yellow-600/50'
        };
      default:
        return {
          bg: 'bg-gray-900',
          text: 'text-white',
          border: 'border-gray-700',
          hover: 'hover:bg-gray-800',
          shadow: 'shadow-2xl',
          card: 'bg-gray-800',
          button: 'bg-cyan-500 hover:bg-cyan-600 text-white',
          buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white',
          input: 'bg-gray-800 border-gray-600 text-white',
          messageOwn: 'bg-cyan-500 text-white',
          messageOther: 'bg-gray-800 text-white border border-gray-700'
        };
    }
  };

  const themeClasses = getThemeClasses();

  useEffect(() => {
    if (!chatId || !user?.id) return;

    const fetchChatData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch chat details
        const chatRes = await apiFetch(`/api/chat/${chatId}`, {}, user?.id);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setChat(chatData);
        }

        // Fetch messages
        const messagesRes = await apiFetch(`/api/messages/${chatId}`, {}, user?.id);
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
  }, [chatId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showChatMenu && !(event.target as Element).closest('.chat-menu')) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChatMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const response = await apiFetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          content: messageContent,
          type: 'text'
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        
        // Play sound if enabled
        if (soundEnabled) {
          playMessageSound();
        }
      } else {
        console.error('Failed to send message');
        setError('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setIsTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleStickerClick = (sticker: string) => {
    setNewMessage(sticker);
    setShowStickers(false);
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await apiFetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim()
        })
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ));
        setEditingMessage(null);
        setEditContent("");
      }
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
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

  const handleBlockUser = async () => {
    if (!chat?.participants) return;
    
    const otherParticipant = chat.participants.find(p => p.id !== user?.id);
    if (!otherParticipant) return;

    if (confirm(`Are you sure you want to block ${otherParticipant.name}?`)) {
      try {
        const response = await apiFetch(`/api/user/${otherParticipant.id}/block`, {
          method: 'POST',
        });

        if (response.ok) {
          router.push('/messeging');
        }
      } catch (err) {
        console.error('Error blocking user:', err);
      }
    }
  };

  const handleDeleteChat = async () => {
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        const response = await apiFetch(`/api/chat/${chatId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/messeging');
        }
      } catch (err) {
        console.error('Error deleting chat:', err);
      }
    }
  };

  const playMessageSound = () => {
    try {
      const audio = new Audio('/sounds/message.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch (err) {
      // Ignore audio errors
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const canEditOrDeleteMessage = (message: Message) => {
    return user && user.id === message.senderId;
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className={`text-cyan-400 text-lg ${themeClasses.text}`}>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg}`}>
        <div className="text-center">
          <p className={`text-red-400 text-lg ${themeClasses.text}`}>Chat not found</p>
          <button
            onClick={() => router.push('/messeging')}
            className={`mt-4 px-4 py-2 rounded-lg ${themeClasses.button}`}
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  const otherParticipant = chat.participants.find(p => p.id !== user?.id);

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${themeClasses.card} ${themeClasses.border} border-b px-4 py-4 ${themeClasses.shadow}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/messeging')}
              className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
            >
              <FiArrowLeft size={20} />
            </button>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {otherParticipant?.name?.charAt(0) || 'U'}
            </div>
            
            <div>
              <h1 className={`text-lg font-semibold ${themeClasses.text}`}>
                {otherParticipant?.name || 'Unknown User'}
              </h1>
              <p className={`text-sm ${themeClasses.text} opacity-70`}>
                {showOnlineStatus ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
              title="Settings"
            >
              <FiSettings size={20} />
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <FiVolume2 size={20} /> : <FiVolumeX size={20} />}
            </button>
            
            <div className="relative chat-menu">
              <button
                onClick={() => setShowChatMenu(!showChatMenu)}
                className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
              >
                <FiMoreVertical size={20} />
              </button>
              
              {showChatMenu && (
                <div className={`absolute right-0 top-12 ${themeClasses.card} border ${themeClasses.border} rounded-lg shadow-lg z-50 min-w-48`}>
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-red-400"
                  >
                    <FiUserX size={16} />
                    Block User
                  </button>
                  <button
                    onClick={handleDeleteChat}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-red-400"
                  >
                    <FiTrash2 size={16} />
                    Delete Chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSend size={24} className="text-gray-400" />
            </div>
            <p className={`${themeClasses.text} opacity-70`}>No messages yet</p>
            <p className={`text-sm ${themeClasses.text} opacity-50`}>Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.senderId === user?.id 
                  ? themeClasses.messageOwn 
                  : themeClasses.messageOther
              }`}>
                {editingMessage === message.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={`flex-1 px-3 py-1 rounded-lg ${themeClasses.input} text-sm`}
                      placeholder="Edit message..."
                      autoFocus
                    />
                    <button
                      onClick={() => handleEditMessage(message.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setEditContent("");
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.senderId === user?.id && (
                        <div className="flex items-center space-x-1">
                          {canEditOrDeleteMessage(message) && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingMessage(message.id);
                                  setEditContent(message.content);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiEdit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Stickers */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`p-4 border-t ${themeClasses.border} ${themeClasses.card}`}
          >
            <div className="flex flex-wrap gap-2">
              {stickers.map((sticker) => (
                <button
                  key={sticker}
                  onClick={() => handleStickerClick(sticker)}
                  className="text-2xl hover:scale-110 transition-transform p-2"
                >
                  {sticker}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className={`p-4 border-t ${themeClasses.border} ${themeClasses.card}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStickers(!showStickers)}
            className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
          >
            <FiSmile size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className={`w-full px-4 py-3 rounded-full ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              disabled={isSending}
            />
            {isTyping && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-full ${themeClasses.button} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>

      {/* Chat Settings Modal */}
      <ChatSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        chatId={chatId}
        chatName={otherParticipant?.name}
        onSettingsChange={(settings) => {
          setShowOnlineStatus(settings.showOnlineStatus);
          setSoundEnabled(settings.soundEnabled);
        }}
      />
    </div>
  );
}
