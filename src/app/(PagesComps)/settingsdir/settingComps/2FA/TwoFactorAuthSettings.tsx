"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function TwoFactorSettings({
                                              closeModal,
                                          }: {
    closeModal: () => void;
}) {
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [authAppEnabled, setAuthAppEnabled] = useState(false);
    const [password2, setPassword2] = useState("");

    const handleSave = () => {
        console.log("Saving 2FA settings:", {
            smsEnabled,
            authAppEnabled,
            password2,
        });
        closeModal();
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/60 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
            >
                <motion.div
                    className="w-[480px] max-w-[90%] h-[600px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden font-sans select-none flex flex-col"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-800/90 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-200">
                            Two-Factor Authentication
                        </h2>
                        <button
                            onClick={closeModal}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                            aria-label="Close modal"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                        {/* Explanation */}
                        <p className="text-sm text-gray-400">
                            Add an extra layer of security to your account. Choose one or more
                            2FA methods below.
                        </p>

                        {/* SMS 2FA */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-200 font-medium">SMS Verification</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={smsEnabled}
                                    onChange={() => setSmsEnabled(!smsEnabled)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-cyan-500 transition"></div>
                                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-5 transition"></span>
                            </label>
                        </div>

                        {/* Authenticator App */}
                        <div className="flex items-center justify-between">
              <span className="text-gray-200 font-medium">
                Authenticator App
              </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={authAppEnabled}
                                    onChange={() => setAuthAppEnabled(!authAppEnabled)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-cyan-500 transition"></div>
                                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-5 transition"></span>
                            </label>
                        </div>

                        {/* Custom 2FA - Password 2 */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-gray-200 font-medium">Password 2</label>
                            <input
                                type="password"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                placeholder="Enter secondary password"
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                            />
                            <p className="text-xs text-gray-500">
                                This is an extra password required during login for more
                                protection.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition"
                            >
                                Save 2FA Settings
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
