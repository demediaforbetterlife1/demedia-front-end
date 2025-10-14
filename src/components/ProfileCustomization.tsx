"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Palette, 
  User, 
  MapPin, 
  Link, 
  Save, 
  Eye,
  Layout,
  Sparkles,
  Settings,
  Wand2
} from 'lucide-react';

interface ProfileCustomizationProps {
  user: any;
  onUpdate: (updates: any) => void;
}

export default function ProfileCustomization({ user, onUpdate }: ProfileCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customization, setCustomization] = useState({
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    profileLayout: 'default',
    showAnalytics: true,
    showFollowers: true,
    showFollowing: true,
    customTheme: 'auto'
  });
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-50',
          accent: 'text-blue-500',
          accentBg: 'bg-blue-50',
          input: 'bg-gray-50 border-gray-200 focus:border-blue-500'
        };
      case 'super-light':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-800',
          textSecondary: 'text-gray-500',
          border: 'border-gray-100',
          hover: 'hover:bg-gray-100',
          accent: 'text-blue-500',
          accentBg: 'bg-blue-50',
          input: 'bg-white border-gray-100 focus:border-blue-500'
        };
      case 'dark':
        return {
          bg: 'bg-gray-800',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          border: 'border-gray-700',
          hover: 'hover:bg-gray-700',
          accent: 'text-blue-400',
          accentBg: 'bg-blue-900/20',
          input: 'bg-gray-700 border-gray-600 focus:border-blue-400'
        };
      case 'super-dark':
        return {
          bg: 'bg-gray-900',
          text: 'text-gray-100',
          textSecondary: 'text-gray-400',
          border: 'border-gray-800',
          hover: 'hover:bg-gray-800',
          accent: 'text-blue-400',
          accentBg: 'bg-blue-900/30',
          input: 'bg-gray-800 border-gray-700 focus:border-blue-400'
        };
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800',
          text: 'text-yellow-100',
          textSecondary: 'text-yellow-200',
          border: 'border-yellow-600/50',
          hover: 'hover:bg-yellow-800/80 gold-shimmer',
          accent: 'text-blue-300',
          accentBg: 'bg-blue-900/40',
          input: 'bg-yellow-800/50 border-yellow-600/50 focus:border-yellow-400'
        };
      default:
        return {
          bg: 'bg-gray-800',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          border: 'border-gray-700',
          hover: 'hover:bg-gray-700',
          accent: 'text-blue-400',
          accentBg: 'bg-blue-900/20',
          input: 'bg-gray-700 border-gray-600 focus:border-blue-400'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const layoutOptions = [
    { id: 'default', name: 'Default', description: 'Standard profile layout' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
    { id: 'detailed', name: 'Detailed', description: 'Show all information' },
    { id: 'creative', name: 'Creative', description: 'Artistic and unique' }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpdate(customization);
      setIsOpen(false);
      
      // Show success message
      console.log('Profile customization saved successfully');
    } catch (error) {
      console.error('Error saving customization:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Customization Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`p-3 rounded-full ${themeClasses.accentBg} ${themeClasses.accent} ${themeClasses.hover} transition-all duration-300`}
        title="Customize Profile"
      >
        <Wand2 size={20} />
      </motion.button>

      {/* Customization Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${themeClasses.bg} rounded-xl ${themeClasses.border} border shadow-2xl`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${themeClasses.border}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${themeClasses.text} flex items-center gap-2`}>
                  <Sparkles className="text-purple-500" size={24} />
                  Profile Customization
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-2 rounded-full ${themeClasses.hover} ${themeClasses.textSecondary}`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}>
                  <User size={20} className="text-blue-500" />
                  Basic Information
                </h3>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Bio
                  </label>
                  <textarea
                    value={customization.bio}
                    onChange={(e) => setCustomization(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className={`w-full p-3 rounded-lg ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none`}
                    rows={3}
                    maxLength={160}
                  />
                  <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                    {customization.bio.length}/160 characters
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    <MapPin size={16} className="inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={customization.location}
                    onChange={(e) => setCustomization(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where are you from?"
                    className={`w-full p-3 rounded-lg ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    <Link size={16} className="inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={customization.website}
                    onChange={(e) => setCustomization(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    className={`w-full p-3 rounded-lg ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
              </div>

              {/* Layout Options */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}>
                  <Layout size={20} className="text-green-500" />
                  Profile Layout
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {layoutOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        customization.profileLayout === option.id
                          ? `${themeClasses.accentBg} border-blue-500`
                          : `${themeClasses.border} ${themeClasses.hover}`
                      }`}
                      onClick={() => setCustomization(prev => ({ ...prev, profileLayout: option.id }))}
                    >
                      <div className={`font-medium ${themeClasses.text}`}>
                        {option.name}
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        {option.description}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center gap-2`}>
                  <Settings size={20} className="text-orange-500" />
                  Display Options
                </h3>
                
                <div className="space-y-3">
                  {[
                    { key: 'showAnalytics', label: 'Show Analytics Dashboard', description: 'Display engagement metrics' },
                    { key: 'showFollowers', label: 'Show Followers Count', description: 'Display follower statistics' },
                    { key: 'showFollowing', label: 'Show Following Count', description: 'Display following statistics' }
                  ].map((option) => (
                    <div key={option.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <div className={`font-medium ${themeClasses.text}`}>
                          {option.label}
                        </div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>
                          {option.description}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customization[option.key as keyof typeof customization] as boolean}
                          onChange={(e) => setCustomization(prev => ({ 
                            ...prev, 
                            [option.key]: e.target.checked 
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${themeClasses.border} flex justify-end gap-3`}>
              <button
                onClick={() => setIsOpen(false)}
                className={`px-4 py-2 rounded-lg ${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
