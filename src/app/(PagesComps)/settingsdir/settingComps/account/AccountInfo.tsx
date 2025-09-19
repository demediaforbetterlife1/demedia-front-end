"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCameraOutline } from "react-icons/io5";
import { X } from "lucide-react";

export default function AccountInfo({
                                        closeModal,
                                    }: {
    closeModal: () => void;
}) {
    const [name, setName] = useState("John Doe");
    const [email, setEmail] = useState("john@example.com");
    const [password, setPassword] = useState("");

    const handleSave = () => {
        // هنا تقدر تبعت البيانات للـ backend أو API
        console.log("Saving:", { name, email, password });
        closeModal(); // يقفل الـ modal بعد الحفظ
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal} // ⬅ الضغط على الخلفية يقفل المودال
            >
                <motion.div
                    className="w-[480px] max-w-[90%] h-[700px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden font-sans select-none flex flex-col"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()} // ⬅ يمنع غلق المودال عند الضغط على الداخل
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-800/90 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-200">
                            Account Details
                        </h2>
                        <button
                            onClick={closeModal}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-shadow shadow-md hover:shadow-lg"
                            aria-label="Close modal"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                        {/* Profile Picture */}
                        <div className="flex flex-col items-center space-y-3">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-gray-600">
                                <img
                                    src="/assets/images/profile-placeholder.png"
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 right-0 bg-cyan-500 w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-cyan-400 transition">
                                    <IoCameraOutline size={18} />
                                </div>
                            </div>
                            <span className="text-gray-300 text-sm">
                Change Profile Picture
              </span>
                        </div>

                        {/* Name Field */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-gray-400 text-sm font-medium">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-gray-400 text-sm font-medium">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-gray-400 text-sm font-medium">
                                Change Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
