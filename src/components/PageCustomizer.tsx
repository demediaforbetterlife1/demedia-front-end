"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface PageCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomizationSettings {
  layout: 'grid' | 'list' | 'masonry';
  density: 'compact' | 'normal' | 'spacious';
  showAvatars: boolean;
  showTimestamps: boolean;
  showEngagement: boolean;
  autoPlayVideos: boolean;
  showTrending: boolean;
  showSuggestions: boolean;
  sidebarPosition: 'left' | 'right';
  headerStyle: 'minimal' | 'detailed' | 'compact';
}

export const PageCustomizer: React.FC<PageCustomizerProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<CustomizationSettings>({
    layout: 'grid',
    density: 'normal',
    showAvatars: true,
    showTimestamps: true,
    showEngagement: true,
    autoPlayVideos: false,
    showTrending: true,
    showSuggestions: true,
    sidebarPosition: 'right',
    headerStyle: 'detailed',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('pageCustomization');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: keyof CustomizationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('pageCustomization', JSON.stringify(newSettings));
    
    // Apply settings to the page
    applySettings(newSettings);
  };

  const applySettings = (newSettings: CustomizationSettings) => {
    // Apply layout settings
    document.documentElement.setAttribute('data-layout', newSettings.layout);
    document.documentElement.setAttribute('data-density', newSettings.density);
    document.documentElement.setAttribute('data-sidebar', newSettings.sidebarPosition);
    document.documentElement.setAttribute('data-header', newSettings.headerStyle);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to backend
      const userId = localStorage.getItem('userId');
      if (userId) {
        await fetch(`/api/user/${userId}/customization`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = () => {
    const defaultSettings: CustomizationSettings = {
      layout: 'grid',
      density: 'normal',
      showAvatars: true,
      showTimestamps: true,
      showEngagement: true,
      autoPlayVideos: false,
      showTrending: true,
      showSuggestions: true,
      sidebarPosition: 'right',
      headerStyle: 'detailed',
    };
    setSettings(defaultSettings);
    localStorage.setItem('pageCustomization', JSON.stringify(defaultSettings));
    applySettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
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
        className="theme-bg-secondary theme-text-primary rounded-2xl p-6 max-w-2xl w-full theme-shadow border theme-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold theme-text-primary">Customize Your Experience</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-opacity theme-text-muted hover:theme-text-primary"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Layout Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold theme-text-primary">Layout & Display</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">Layout Style</label>
                <select
                  value={settings.layout}
                  onChange={(e) => handleSettingChange('layout', e.target.value)}
                  className="w-full p-2 rounded-lg theme-bg-primary theme-text-primary border theme-border focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                  <option value="masonry">Masonry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">Density</label>
                <select
                  value={settings.density}
                  onChange={(e) => handleSettingChange('density', e.target.value)}
                  className="w-full p-2 rounded-lg theme-bg-primary theme-text-primary border theme-border focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">Sidebar Position</label>
                <select
                  value={settings.sidebarPosition}
                  onChange={(e) => handleSettingChange('sidebarPosition', e.target.value)}
                  className="w-full p-2 rounded-lg theme-bg-primary theme-text-primary border theme-border focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">Header Style</label>
                <select
                  value={settings.headerStyle}
                  onChange={(e) => handleSettingChange('headerStyle', e.target.value)}
                  className="w-full p-2 rounded-lg theme-bg-primary theme-text-primary border theme-border focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                >
                  <option value="minimal">Minimal</option>
                  <option value="detailed">Detailed</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold theme-text-primary">Content Display</h3>
            
            <div className="space-y-3">
              {[
                { key: 'showAvatars', label: 'Show User Avatars', description: 'Display profile pictures in posts and comments' },
                { key: 'showTimestamps', label: 'Show Timestamps', description: 'Display when posts and comments were made' },
                { key: 'showEngagement', label: 'Show Engagement Stats', description: 'Display likes, comments, and shares count' },
                { key: 'autoPlayVideos', label: 'Auto-play Videos', description: 'Automatically play videos when they come into view' },
                { key: 'showTrending', label: 'Show Trending Section', description: 'Display trending topics and hashtags' },
                { key: 'showSuggestions', label: 'Show Suggestions', description: 'Display friend and content suggestions' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="theme-text-secondary font-medium">{label}</span>
                    <p className="theme-text-muted text-xs">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key as keyof CustomizationSettings] as boolean}
                      onChange={(e) => handleSettingChange(key as keyof CustomizationSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={resetToDefault}
            className="flex-1 py-2 px-4 theme-bg-primary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
          >
            Reset to Default
          </button>
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
      </motion.div>
    </motion.div>
  );
};
