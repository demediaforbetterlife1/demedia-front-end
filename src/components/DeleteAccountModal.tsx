"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, Eye, EyeOff } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (password: string, confirmation: string) => Promise<void>;
  deletionInfo?: {
    username: string;
    email?: string;
    phoneNumber?: string;
    dataToDelete: {
      posts: number;
      comments: number;
      likes: number;
      stories: number;
      deSnaps: number;
      messages: number;
      followers: number;
      following: number;
    };
  };
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onDelete,
  deletionInfo,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (!isDeleting) {
      setStep(1);
      setPassword("");
      setConfirmation("");
      setError("");
      onClose();
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!password) {
        setError("Please enter your password");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleDelete = async () => {
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    if (confirmation !== "DELETE MY ACCOUNT") {
      setError("Please type 'DELETE MY ACCOUNT' exactly to confirm");
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(password, confirmation);
      // Success - modal will be closed by parent component
    } catch (err: any) {
      setError(err.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-red-500/20"
        >
          {/* Close button */}
          {!isDeleting && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Delete Account</h2>
                <p className="text-sm text-gray-400">Step {step} of 3</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: "33%" }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step 1: Warning */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 font-semibold mb-2">
                      ⚠️ This action is permanent and cannot be undone!
                    </p>
                    <p className="text-gray-300 text-sm">
                      All your data will be permanently deleted from our servers.
                    </p>
                  </div>

                  {deletionInfo && (
                    <div className="space-y-2">
                      <p className="text-white font-semibold">
                        Account: @{deletionInfo.username}
                      </p>
                      {deletionInfo.email && (
                        <p className="text-gray-400 text-sm">{deletionInfo.email}</p>
                      )}
                      {deletionInfo.phoneNumber && (
                        <p className="text-gray-400 text-sm">{deletionInfo.phoneNumber}</p>
                      )}

                      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-white font-semibold mb-3">What will be deleted:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-400">
                            📝 Posts: <span className="text-white">{deletionInfo.dataToDelete.posts}</span>
                          </div>
                          <div className="text-gray-400">
                            💬 Comments: <span className="text-white">{deletionInfo.dataToDelete.comments}</span>
                          </div>
                          <div className="text-gray-400">
                            ❤️ Likes: <span className="text-white">{deletionInfo.dataToDelete.likes}</span>
                          </div>
                          <div className="text-gray-400">
                            📖 Stories: <span className="text-white">{deletionInfo.dataToDelete.stories}</span>
                          </div>
                          <div className="text-gray-400">
                            🎬 DeSnaps: <span className="text-white">{deletionInfo.dataToDelete.deSnaps}</span>
                          </div>
                          <div className="text-gray-400">
                            💌 Messages: <span className="text-white">{deletionInfo.dataToDelete.messages}</span>
                          </div>
                          <div className="text-gray-400">
                            👥 Followers: <span className="text-white">{deletionInfo.dataToDelete.followers}</span>
                          </div>
                          <div className="text-gray-400">
                            👤 Following: <span className="text-white">{deletionInfo.dataToDelete.following}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="space-y-4 mb-6">
                  <p className="text-gray-300">
                    Please enter your password to continue:
                  </p>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                      disabled={isDeleting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Final Confirmation */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 font-semibold mb-2">
                      ⚠️ Final Warning
                    </p>
                    <p className="text-gray-300 text-sm">
                      This is your last chance to cancel. Once you confirm, your account and all data will be permanently deleted.
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Type <span className="text-red-400 font-mono">DELETE MY ACCOUNT</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 font-mono"
                      disabled={isDeleting}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || confirmation !== "DELETE MY ACCOUNT"}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={20} />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
