"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { Settings, User, Bell, Lock, Trash2, Shield, Globe } from "lucide-react";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, deleteAccount, getDeletionInfo } = useAuth();
  const router = useRouter();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionInfo, setDeletionInfo] = useState<any>(null);
  const [loadingDeletionInfo, setLoadingDeletionInfo] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleOpenDeleteModal = async () => {
    setLoadingDeletionInfo(true);
    try {
      const info = await getDeletionInfo();
      setDeletionInfo(info);
      setShowDeleteModal(true);
    } catch (err) {
      console.error("Failed to get deletion info:", err);
      alert("Failed to load account information. Please try again.");
    } finally {
      setLoadingDeletionInfo(false);
    }
  };

  const handleDeleteAccount = async (password: string, confirmation: string) => {
    const result = await deleteAccount(password, confirmation);
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    // Success - modal will close and user will be redirected by AuthContext
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-cyan-400" size={32} />
            Settings
          </h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Account Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <User size={24} className="text-cyan-400" />
                Account
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Username</label>
                <p className="text-white font-medium">@{user.username}</p>
              </div>
              {user.email && (
                <div>
                  <label className="text-gray-400 text-sm">Email</label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              )}
              {user.phoneNumber && (
                <div>
                  <label className="text-gray-400 text-sm">Phone Number</label>
                  <p className="text-white font-medium">{user.phoneNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Shield size={24} className="text-cyan-400" />
                Privacy & Security
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Lock size={20} className="text-gray-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Change Password</p>
                    <p className="text-gray-400 text-sm">Update your password</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-gray-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Privacy Settings</p>
                    <p className="text-gray-400 text-sm">Control who can see your content</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Bell size={24} className="text-cyan-400" />
                Notifications
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Receive notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/20 overflow-hidden">
            <div className="p-6 border-b border-red-500/20">
              <h2 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                <Trash2 size={24} />
                Danger Zone
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Delete Account</p>
                  <p className="text-gray-400 text-sm">
                    Permanently delete your account and all your data. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleOpenDeleteModal}
                  disabled={loadingDeletionInfo}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loadingDeletionInfo ? "Loading..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteAccount}
        deletionInfo={deletionInfo}
      />
    </div>
  );
}
