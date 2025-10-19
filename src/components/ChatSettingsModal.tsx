"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Shield, 
  Users, 
  MessageCircle,
  Archive,
  Trash2,
  UserX,
  Eye,
  EyeOff
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId?: string;
  chatName?: string;
  onSettingsChange?: (settings: ChatSettings) => void;
}

interface ChatSettings {
  notifications: boolean;
  soundEnabled: boolean;
  privacy: 'public' | 'private' | 'friends';
  allowScreenshots: boolean;
  showOnlineStatus: boolean;
  autoDelete: boolean;
  autoDeleteDays: number;
  archiveAfterDays: number;
}

export default function ChatSettingsModal({ 
  isOpen, 
  onClose, 
  chatId, 
  chatName,
  onSettingsChange 
}: ChatSettingsModalProps) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<ChatSettings>({
    notifications: true,
    soundEnabled: true,
    privacy: 'private',
    allowScreenshots: true,
    showOnlineStatus: true,
    autoDelete: false,
    autoDeleteDays: 30,
    archiveAfterDays: 90
  });

  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'advanced'>('general');

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-50',
          shadow: 'shadow-lg',
          card: 'bg-gray-50',
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
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
          buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800'
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
          buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white'
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
          buttonSecondary: 'bg-gray-800 hover:bg-gray-700 text-gray-100'
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
          buttonSecondary: 'bg-yellow-700/50 hover:bg-yellow-600/50 text-yellow-100'
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
          buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleSettingChange = (key: keyof ChatSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSettingsChange?.(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${themeClasses.bg} ${themeClasses.text} rounded-2xl p-6 max-w-md w-full ${themeClasses.shadow} border ${themeClasses.border}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Chat Settings</h2>
              {chatName && (
                <p className="text-sm opacity-70">{chatName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-800/50 rounded-lg p-1">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'privacy', label: 'Privacy', icon: Shield },
              { id: 'advanced', label: 'Advanced', icon: Archive }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  activeTab === id 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} />
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-sm opacity-70">Get notified of new messages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('notifications', !settings.notifications)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Volume2 size={20} />
                    <div>
                      <p className="font-medium">Sound</p>
                      <p className="text-sm opacity-70">Play sound for new messages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye size={20} />
                    <div>
                      <p className="font-medium">Show Online Status</p>
                      <p className="text-sm opacity-70">Let others see when you're online</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.showOnlineStatus ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Privacy Level</label>
                  <select
                    value={settings.privacy}
                    onChange={(e) => handleSettingChange('privacy', e.target.value)}
                    className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.card} ${themeClasses.text}`}
                  >
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageCircle size={20} />
                    <div>
                      <p className="font-medium">Allow Screenshots</p>
                      <p className="text-sm opacity-70">Let others take screenshots</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('allowScreenshots', !settings.allowScreenshots)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.allowScreenshots ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.allowScreenshots ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Trash2 size={20} />
                    <div>
                      <p className="font-medium">Auto Delete Messages</p>
                      <p className="text-sm opacity-70">Automatically delete old messages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange('autoDelete', !settings.autoDelete)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.autoDelete ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.autoDelete ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {settings.autoDelete && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Delete After (Days)</label>
                    <input
                      type="number"
                      value={settings.autoDeleteDays}
                      onChange={(e) => handleSettingChange('autoDeleteDays', parseInt(e.target.value))}
                      className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.card} ${themeClasses.text}`}
                      min="1"
                      max="365"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Archive After (Days)</label>
                  <input
                    type="number"
                    value={settings.archiveAfterDays}
                    onChange={(e) => handleSettingChange('archiveAfterDays', parseInt(e.target.value))}
                    className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.card} ${themeClasses.text}`}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${themeClasses.buttonSecondary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${themeClasses.button}`}
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
