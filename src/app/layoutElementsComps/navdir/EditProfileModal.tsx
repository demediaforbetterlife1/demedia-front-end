"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, User, Mail, Calendar, MapPin, Link, Phone, Globe, Lock, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdated?: (updatedProfile: any) => void;
}

interface ProfileData {
    name: string;
    username: string;
    bio: string;
    email: string;
    phone?: string;
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

export default function EditProfileModal({ isOpen, onClose, onProfileUpdated }: EditProfileModalProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const [profileData, setProfileData] = useState<ProfileData>({
        name: user?.name || "",
        username: user?.username || "",
        bio: user?.bio || "",
        email: user?.email || "",
        phone: user?.phone || "",
        dateOfBirth: user?.dateOfBirth || "",
        location: "",
        website: "",
        preferredLang: user?.preferredLang || "en"
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("basic");
    const [privacy, setPrivacy] = useState("public");
    
    const profilePictureRef = useRef<HTMLInputElement>(null);
    const coverPhotoRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (field: keyof ProfileData, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (file: File, type: 'profile' | 'cover') => {
        try {
            // In a real app, you'd upload to a storage service
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (type === 'profile') {
                    setProfileData(prev => ({ ...prev, profilePicture: result }));
                } else {
                    setProfileData(prev => ({ ...prev, coverPhoto: result }));
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Error uploading file:', err);
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

        try {
            const response = await fetch(`/api/user/${user?.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`,
                    "user-id": user?.id?.toString() || "",
                },
                body: JSON.stringify({
                    ...profileData,
                    privacy
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const updatedProfile = await response.json();
            
            if (onProfileUpdated) {
                onProfileUpdated(updatedProfile);
            }

            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
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
                    className="theme-bg-secondary theme-text-primary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden theme-shadow border theme-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b theme-border">
                        <h2 className="text-2xl font-bold theme-text-primary">Edit Profile</h2>
                        <button
                            onClick={onClose}
                            className="text-2xl hover:opacity-70 transition-opacity theme-text-muted hover:theme-text-primary"
                        >
                            ×
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b theme-border">
                        {[
                            { id: "basic", name: "Basic Info", icon: User },
                            { id: "contact", name: "Contact", icon: Mail },
                            { id: "privacy", name: "Privacy", icon: Lock }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition ${
                                        activeTab === tab.id
                                            ? "theme-text-primary border-b-2 border-cyan-400"
                                            : "theme-text-muted hover:theme-text-primary"
                                    }`}
                                >
                                    <Icon size={16} />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info Tab */}
                            {activeTab === "basic" && (
                                <div className="space-y-6">
                                    {/* Profile Pictures */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-600">
                                                    {profileData.profilePicture ? (
                                                        <img 
                                                            src={profileData.profilePicture} 
                                                            alt="Profile" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                                            {profileData.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => profilePictureRef.current?.click()}
                                                    className="absolute -bottom-1 -right-1 p-1.5 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition"
                                                >
                                                    <Camera size={12} />
                                                </button>
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
                                            <div>
                                                <h3 className="font-semibold theme-text-primary">Profile Picture</h3>
                                                <p className="text-sm theme-text-muted">Click to change your profile picture</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium theme-text-primary">
                                                Cover Photo
                                            </label>
                                            <div className="relative">
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-600">
                                                    {profileData.coverPhoto ? (
                                                        <img 
                                                            src={profileData.coverPhoto} 
                                                            alt="Cover" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white">
                                                            <Camera size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => coverPhotoRef.current?.click()}
                                                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
                                                >
                                                    <Camera size={16} />
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
                                    </div>

                                    {/* Basic Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium theme-text-primary mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium theme-text-primary mb-2">
                                                Username *
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.username}
                                                onChange={(e) => handleInputChange('username', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                                placeholder="Enter your username"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium theme-text-primary mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary resize-none"
                                            rows={3}
                                            placeholder="Tell us about yourself..."
                                            maxLength={500}
                                        />
                                        <div className="text-right text-xs theme-text-muted mt-1">
                                            {profileData.bio.length}/500
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Tab */}
                            {activeTab === "contact" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium theme-text-primary mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium theme-text-primary mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium theme-text-primary mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={profileData.dateOfBirth}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium theme-text-primary mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                            placeholder="Where are you from?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium theme-text-primary mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={profileData.website}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Privacy Tab */}
                            {activeTab === "privacy" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium theme-text-primary mb-3">
                                            Profile Visibility
                                        </label>
                                        <div className="space-y-2">
                                            {privacyOptions.map((option) => {
                                                const Icon = option.icon;
                                                return (
                                                    <label
                                                        key={option.id}
                                                        className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition ${
                                                            privacy === option.id
                                                                ? 'theme-bg-tertiary ring-2 ring-cyan-400'
                                                                : 'theme-bg-primary hover:theme-bg-tertiary'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="privacy"
                                                            value={option.id}
                                                            checked={privacy === option.id}
                                                            onChange={(e) => setPrivacy(e.target.value)}
                                                            className="sr-only"
                                                        />
                                                        <Icon size={20} className={option.color} />
                                                        <div className="flex-1">
                                                            <p className="font-medium theme-text-primary">
                                                                {option.name}
                                                            </p>
                                                            <p className="text-sm theme-text-muted">
                                                                {option.description}
                                                            </p>
                                                        </div>
                                                        {privacy === option.id && (
                                                            <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                                                                <span className="text-white text-xs">✓</span>
                                                            </div>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="text-red-400 text-sm text-center py-2">
                                    {error}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4 border-t theme-border">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2 px-4 theme-bg-primary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !profileData.name.trim() || !profileData.username.trim()}
                                    className="flex-1 py-2 px-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
