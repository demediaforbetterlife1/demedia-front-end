"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, User as UserIcon, Mail, Calendar, MapPin, Link, Phone, Globe, Lock, Users, UserCheck, Save } from "lucide-react";
import { useAuth, type User } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { getModalThemeClasses } from "@/utils/enhancedThemeUtils";
import { apiFetch, getAuthHeaders } from "@/lib/api";
import { contentModerationService } from "@/services/contentModeration";

interface AccountInfoProps {
  closeModal: () => void;
}

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  email?: string;
  dateOfBirth?: string;
  location?: string;
  website?: string;
  preferredLang?: string;
  profilePicture?: string;
  coverPhoto?: string;
}

const privacyOptions = [
  { id: "public", name: "Public", description: "Anyone can see your profile", icon: Globe, color: "text-green-500" },
  { id: "followers", name: "Followers", description: "Only your followers can see", icon: Users, color: "text-blue-500" },
  { id: "private", name: "Private", description: "Only you can see", icon: Lock, color: "text-purple-500" }
];

const AccountInfo: React.FC<AccountInfoProps> = ({ closeModal }) => {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();
  const themeClasses = getModalThemeClasses(theme);
  // Type assertion to ensure TypeScript recognizes all User fields
  const typedUser = user as User | null;
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: typedUser?.name || "",
    username: typedUser?.username || "",
    bio: typedUser?.bio || "",
    email: typedUser?.email || "",
    dateOfBirth: typedUser?.dateOfBirth || typedUser?.dob || "",
    location: typedUser?.location || "",
    website: typedUser?.website || "",
    preferredLang: typedUser?.preferredLang || typedUser?.language || "en",
    profilePicture: (typedUser?.profilePicture ?? "") || "",
    coverPhoto: (typedUser?.coverPhoto ?? "") || ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [privacy, setPrivacy] = useState(typedUser?.privacy || "public");
  
  const profilePictureRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typedUser) {
      setProfileData({
        name: typedUser.name || "",
        username: typedUser.username || "",
        bio: typedUser.bio || "",
        email: typedUser.email || "",
        dateOfBirth: typedUser.dateOfBirth || typedUser.dob || "",
        location: typedUser.location || "",
        website: typedUser.website || "",
        preferredLang: typedUser.preferredLang || typedUser.language || "en",
        profilePicture: (typedUser.profilePicture ?? "") || "",
        coverPhoto: (typedUser.coverPhoto ?? "") || ""
      });
      setPrivacy(typedUser.privacy || "public");
    }
  }, [typedUser]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleFileUpload = async (file: File, type: 'profile' | 'cover') => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      const moderationResult = await contentModerationService.moderateImage(file);
      
      if (!moderationResult.isApproved) {
        setError(`Image not approved: ${moderationResult.reason}`);
        return;
      }

      const formData = new FormData();
      formData.append(type === 'profile' ? 'profilePicture' : 'coverPhoto', file);

      const response = await apiFetch(`/api/upload/${type === 'profile' ? 'profile' : 'cover'}`, {
        method: 'POST',
        body: formData
      }, user?.id);

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      const imageUrl = data.url || data[type === 'profile' ? 'profilePicture' : 'coverPhoto'];
      
      if (type === 'profile') {
        setProfileData(prev => ({ ...prev, profilePicture: imageUrl }));
      } else {
        setProfileData(prev => ({ ...prev, coverPhoto: imageUrl }));
      }
      
      setSuccess(`${type === 'profile' ? 'Profile picture' : 'Cover photo'} uploaded successfully`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.name.trim() || !profileData.username.trim()) {
      setError("Name and username are required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        name: profileData.name,
        username: profileData.username,
        bio: profileData.bio,
        email: profileData.email,
        location: profileData.location,
        website: profileData.website,
        profilePicture: profileData.profilePicture,
        coverPhoto: profileData.coverPhoto,
        preferredLang: profileData.preferredLang,
        privacy: privacy,
      };

      if (profileData.dateOfBirth) {
        payload.dateOfBirth = profileData.dateOfBirth;
      }

      const response = await apiFetch(`/api/user/${user?.id}`, {
        method: "PUT",
        headers: getAuthHeaders(user?.id),
        body: JSON.stringify(payload)
      }, user?.id);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update profile: ${response.status}`);
      }

      const updatedProfile = await response.json();
      
      if (updateUser && updatedProfile) {
        updateUser(updatedProfile);
      }
      
      setSuccess("Profile updated successfully!");
      
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        onClick={closeModal}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`${themeClasses.modal} rounded-3xl p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden border ${themeClasses.border} ${themeClasses.shadow}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${themeClasses.text}`}>Account Information</h2>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Manage your account details</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className={`w-8 h-8 rounded-full ${themeClasses.hover} flex items-center justify-center transition-colors`}
            >
              <X className={`w-4 h-4 ${themeClasses.textSecondary}`} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={profileData.profilePicture || (typedUser?.profilePicture ?? "") || "/default-avatar.png"}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => profilePictureRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    ref={profilePictureRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'profile');
                    }}
                  />
                </div>
              </div>

              {/* Cover Photo */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Cover Photo
                </label>
                <div className="relative">
                  <img
                    src={profileData.coverPhoto || (typedUser?.coverPhoto ?? "") || "/default-cover.jpg"}
                    alt="Cover"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => coverPhotoRef.current?.click()}
                    className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={coverPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'cover');
                    }}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <UserIcon className="w-4 h-4 inline mr-2" />
                  Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-2 ${themeClasses.input} rounded-lg ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <UserIcon className="w-4 h-4 inline mr-2" />
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full px-4 py-2 ${themeClasses.input} rounded-lg ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 ${themeClasses.input} rounded-lg ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email || ""}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-2 ${themeClasses.input} rounded-lg ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Location */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.location || ""}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-4 py-2 ${themeClasses.input} rounded-lg ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="City, Country"
                />
              </div>

              {/* Website */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <Link className="w-4 h-4 inline mr-2" />
                  Website
                </label>
                <input
                  type="url"
                  value={profileData.website || ""}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full px-4 py-2 ${themeClasses.input} rounded-lg ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="https://example.com"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profileData.dateOfBirth || ""}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-4 py-2 ${themeClasses.input} rounded-lg ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Privacy Settings */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Privacy Settings
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {privacyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPrivacy(option.id)}
                        className={`flex flex-col items-center space-y-2 p-4 rounded-xl border transition-all ${
                          privacy === option.id
                            ? "border-blue-500 bg-blue-500/10"
                            : `${themeClasses.border} ${themeClasses.hover}`
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${privacy === option.id ? option.color : themeClasses.textSecondary}`} />
                        <div className="text-center">
                          <p className={`font-medium text-sm ${themeClasses.text}`}>{option.name}</p>
                          <p className={`text-xs ${themeClasses.textSecondary}`}>{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-6 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AccountInfo;