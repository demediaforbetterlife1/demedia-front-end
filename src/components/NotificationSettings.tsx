"use client";

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { motion } from 'framer-motion';

interface NotificationSettingsProps {
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const {
    isSupported,
    permission,
    isInitialized,
    requestPermission,
  } = useNotifications();

  const [settings, setSettings] = useState({
    pushNotifications: false,
    emailNotifications: true,
    smsNotifications: false,
    newPostNotifications: true,
    messageNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    mentionNotifications: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        handleSettingChange('pushNotifications', true);
      }
    } catch (error: unknown) {
      console.error('Failed to request permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to backend
      const userId = localStorage.getItem('userId');
      if (userId) {
        await fetch(`/api/user/${userId}/notification-settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });
      }
      
      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="theme-bg-secondary theme-text-primary rounded-2xl p-6 max-w-md w-full theme-shadow border theme-border">
        <h2 className="text-2xl font-bold theme-text-primary mb-4">Notifications</h2>
        <p className="theme-text-muted mb-4">
          Notifications are not supported in this browser.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 theme-bg-primary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="theme-bg-secondary theme-text-primary rounded-2xl p-6 max-w-md w-full theme-shadow border theme-border">
      <h2 className="text-2xl font-bold theme-text-primary mb-6">Notification Settings</h2>

      <div className="space-y-6">
        {/* Push Notifications */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold theme-text-primary">Push Notifications</h3>
          
          {permission === 'denied' ? (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          ) : permission === 'default' ? (
            <div className="space-y-3">
              <p className="theme-text-muted text-sm">
                Enable push notifications to stay updated with new content.
              </p>
              <button
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Requesting...' : 'Enable Notifications'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="theme-text-secondary">Push Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          )}
        </div>

        {/* Other Notification Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold theme-text-primary">Notification Types</h3>
          
          {[
            { key: 'newPostNotifications', label: 'New Posts', description: 'Get notified when someone you follow posts' },
            { key: 'messageNotifications', label: 'Messages', description: 'Get notified when you receive a new message' },
            { key: 'likeNotifications', label: 'Likes', description: 'Get notified when someone likes your post' },
            { key: 'commentNotifications', label: 'Comments', description: 'Get notified when someone comments on your post' },
            { key: 'mentionNotifications', label: 'Mentions', description: 'Get notified when someone mentions you' },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex-1">
                <span className="theme-text-secondary font-medium">{label}</span>
                <p className="theme-text-muted text-xs">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => handleSettingChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 theme-bg-primary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
