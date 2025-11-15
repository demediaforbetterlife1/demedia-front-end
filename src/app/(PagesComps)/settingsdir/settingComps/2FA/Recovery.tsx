"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy } from "lucide-react";

export default function Recovery({ closeModal }: { closeModal: () => void }) {
    const [recoveryEmail, setRecoveryEmail] = useState("john.recovery@example.com");
    const [recoveryPhone, setRecoveryPhone] = useState("+201234567890");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    // Generate 10 random backup codes
    const generateCodes = () => {
        const codes = Array.from({ length: 10 }, () =>
            Math.random().toString(36).substring(2, 10).toUpperCase()
        );
        setBackupCodes(codes);
    };

    const copyCodes = () => {
        navigator.clipboard.writeText(backupCodes.join("\n"));
        alert("Backup codes copied to clipboard!");
    };

    const handleSave = () => {
        console.log("Saving recovery settings:", {
            recoveryEmail,
            recoveryPhone,
            backupCodes,
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
                    className="w-[560px] max-w-[95%] h-[640px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden font-sans select-none flex flex-col"
                    initial={{ scale: 0.85, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-800/90 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-200">
                            Account Recovery
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
                        <p className="text-sm text-gray-400">
                            Set up recovery options to regain access to your account in case
                            you lose your login credentials or device.
                        </p>

                        {/* Recovery Email */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-gray-200 font-medium">Recovery Email</label>
                            <input
                                type="email"
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                            />
                        </div>

                        {/* Recovery Phone */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-gray-200 font-medium">Recovery Phone</label>
                            <input
                                type="tel"
                                value={recoveryPhone}
                                onChange={(e) => setRecoveryPhone(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                            />
                        </div>

                        {/* Backup Codes */}
                        <div className="flex flex-col space-y-3">
                            <label className="text-gray-200 font-medium">Backup Codes</label>
                            {backupCodes.length === 0 ? (
                                <button
                                    onClick={generateCodes}
                                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow hover:shadow-lg transition"
                                >
                                    Generate Backup Codes
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm font-mono text-gray-300">
                                        {backupCodes.map((code, idx) => (
                                            <div
                                                key={idx}
                                                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-center"
                                            >
                                                {code}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between">
                                        <button
                                            onClick={generateCodes}
                                            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition"
                                        >
                                            Regenerate
                                        </button>
                                        <button
                                            onClick={copyCodes}
                                            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold flex items-center gap-2 transition"
                                        >
                                            <Copy size={16} /> Copy Codes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700 bg-gray-800/80 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition"
                        >
                            Save Recovery Settings
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
