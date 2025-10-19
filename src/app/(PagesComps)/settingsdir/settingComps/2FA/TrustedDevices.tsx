"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Monitor, Smartphone, Trash2 } from "lucide-react";

type Device = {
    id: string;
    name: string;
    type: "desktop" | "mobile";
    lastUsed: string;
    location: string;
};

export default function TrustedDevicesModal({
                                                closeModal,
                                            }: {
    closeModal: () => void;
}) {
    const [devices, setDevices] = useState<Device[]>([
        {
            id: "1",
            name: "Chrome - Windows 10",
            type: "desktop",
            lastUsed: "2025-09-05 21:15",
            location: "Cairo, Egypt",
        },
        {
            id: "2",
            name: "Safari - iPhone 14",
            type: "mobile",
            lastUsed: "2025-09-04 14:50",
            location: "Giza, Egypt",
        },
    ]);

    const removeDevice = (id: string) => {
        setDevices(devices.filter((d) => d.id !== id));
    };

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
                    className="w-[520px] max-w-[95%] max-h-[90vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-800/90 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-200">
                            Trusted Devices
                        </h2>
                        <button
                            onClick={closeModal}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {devices.length > 0 ? (
                            devices.map((device) => (
                                <div
                                    key={device.id}
                                    className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-cyan-500 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        {device.type === "desktop" ? (
                                            <Monitor className="text-cyan-400" size={22} />
                                        ) : (
                                            <Smartphone className="text-cyan-400" size={22} />
                                        )}
                                        <div>
                                            <p className="text-gray-200 font-medium">{device.name}</p>
                                            <p className="text-xs text-gray-400">
                                                Last used: {device.lastUsed}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Location: {device.location}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeDevice(device.id)}
                                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 text-center">
                                No trusted devices found.
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700">
                        <button
                            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition"
                            onClick={closeModal}
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
