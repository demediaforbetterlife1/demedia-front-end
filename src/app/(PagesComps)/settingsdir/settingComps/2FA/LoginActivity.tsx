"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type LoginEntry = {
    id: number;
    location: string;
    device: string;
    ip: string;
    date: string;
    status: "Success" | "Failed";
};

export default function LoginActivity({
                                          closeModal,
                                      }: {
    closeModal: () => void;
}) {
    const [activity] = useState<LoginEntry[]>([
        {
            id: 1,
            location: "Cairo, Egypt",
            device: "Windows 10 - Chrome",
            ip: "192.168.1.24",
            date: "Sep 6, 2025 • 14:32",
            status: "Success",
        },
        {
            id: 2,
            location: "Giza, Egypt",
            device: "iPhone 14 - Safari",
            ip: "192.168.1.77",
            date: "Sep 5, 2025 • 21:12",
            status: "Success",
        },
        {
            id: 3,
            location: "Alexandria, Egypt",
            device: "MacBook Pro - Safari",
            ip: "192.168.1.88",
            date: "Sep 5, 2025 • 18:44",
            status: "Failed",
        },
    ]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
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
                            Login Activity
                        </h2>
                        <button
                            onClick={closeModal}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                            aria-label="Close modal"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Activity List */}
                    <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-3">
                        {activity.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-cyan-400/50 transition"
                            >
                                <div className="space-y-1">
                                    <p className="text-gray-200 font-medium">{entry.device}</p>
                                    <p className="text-sm text-gray-400">
                                        {entry.location} • IP: {entry.ip}
                                    </p>
                                    <p className="text-xs text-gray-500">{entry.date}</p>
                                </div>
                                <span
                                    className={`mt-2 md:mt-0 px-3 py-1 rounded-lg text-xs font-semibold ${
                                        entry.status === "Success"
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400"
                                    }`}
                                >
                  {entry.status}
                </span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700 bg-gray-800/80 flex justify-end">
                        <button
                            onClick={closeModal}
                            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
