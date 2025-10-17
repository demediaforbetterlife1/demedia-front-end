"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  User, MapPin, Link, Save, Layout, Sparkles, Settings, Wand2 
} from 'lucide-react';

interface ProfileCustomizationProps {
  user: any;
  onUpdate: (updates: any) => void;
}

export default function ProfileCustomization({ user, onUpdate }: ProfileCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  const [customization, setCustomization] = useState({
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    profileLayout: user?.profileLayout || 'default',
    showAnalytics: user?.showAnalytics ?? true,
    showFollowers: user?.showFollowers ?? true,
    showFollowing: user?.showFollowing ?? true,
    customTheme: user?.customTheme || 'auto'
  });

  // ✨ Theme-based styles
  const getThemeClasses = () => {
    switch (theme) {
      case 'super-light':
        return {
          bg: 'bg-gray-50 shimmer-light',
          text: 'text-gray-800',
          border: 'border-gray-200',
          accent: 'text-blue-500',
          input: 'bg-white border-gray-200 focus:border-blue-500',
        };
      case 'super-dark':
        return {
          bg: 'bg-gray-900 shimmer-dark',
          text: 'text-gray-100',
          border: 'border-gray-800',
          accent: 'text-blue-400',
          input: 'bg-gray-800 border-gray-700 focus:border-blue-400',
        };
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800 shimmer-gold',
          text: 'text-yellow-100',
          border: 'border-yellow-600/50',
          accent: 'text-blue-300',
          input: 'bg-yellow-800/50 border-yellow-600/50 focus:border-yellow-400',
        };
      default:
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          border: 'border-gray-200',
          accent: 'text-blue-500',
          input: 'bg-gray-50 border-gray-200 focus:border-blue-500',
        };
    }
  };

  const themeClasses = getThemeClasses();

  // ✅ الفنكشن دي بتحفظ فعلاً في قاعدة البيانات
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/user/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(customization),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updated = await response.json();
      onUpdate(updated);
      setIsOpen(false);
      console.log("✅ Profile updated successfully");
    } catch (err) {
      console.error("❌ Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* 🔮 Customize Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`p-3 rounded-full ${themeClasses.accent} bg-opacity-20 hover:bg-opacity-30 transition-all`}
      >
        <Wand2 size={20} />
      </motion.button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${themeClasses.bg} ${themeClasses.border} border rounded-xl shadow-2xl`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${themeClasses.border}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${themeClasses.text} flex items-center gap-2`}>
                  <Sparkles className="text-purple-500" size={24} /> Customize Profile
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Bio */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Bio
                </label>
                <textarea
                  value={customization.bio}
                  onChange={(e) => setCustomization({ ...customization, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className={`w-full p-3 rounded-lg ${themeClasses.input} ${themeClasses.text} focus:outline-none`}
                  rows={3}
                />
              </div>

              {/* Location */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <MapPin className="inline mr-1" size={16} /> Location
                </label>
                <input
                  type="text"
                  value={customization.location}
                  onChange={(e) => setCustomization({ ...customization, location: e.target.value })}
                  placeholder="Where are you from?"
                  className={`w-full p-3 rounded-lg ${themeClasses.input} ${themeClasses.text} focus:outline-none`}
                />
              </div>

              {/* Website */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <Link className="inline mr-1" size={16} /> Website
                </label>
                <input
                  type="url"
                  value={customization.website}
                  onChange={(e) => setCustomization({ ...customization, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className={`w-full p-3 rounded-lg ${themeClasses.input} ${themeClasses.text} focus:outline-none`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${themeClasses.border} flex justify-end gap-3`}>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
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

/* ✨ Add this to your globals.css for shimmer effect */

 /*
.shimmer-light {
  background: linear-gradient(120deg, #f9fafb, #ffffff, #f9fafb);
  background-size: 200% 200%;
  animation: shimmer 4s infinite;
}

.shimmer-dark {
  background: linear-gradient(120deg, #0f0f0f, #1a1a1a, #0f0f0f);
  background-size: 200% 200%;
  animation: shimmer 4s infinite;
}

.shimmer-gold {
  background: linear-gradient(120deg, #b8860b, #ffd700, #b8860b);
  background-size: 200% 200%;
  animation: shimmer 4s infinite;
}

@keyframes shimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
*/
