"use client";
import { X } from "lucide-react";
import { useState } from "react";

type VisibilityModalProps = {
    closeModal: () => void;
};

export default function VisibilityModal({ closeModal }: VisibilityModalProps) {
    const [visibility, setVisibility] = useState("everyone");

    return (
        <div className="fixed inset-0 bg-white dark:bg-neutral-900 flex items-center justify-center z-50">
            <div className="w-[90%] max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 relative">
                {/* Close */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-semibold mb-6">Profile Visibility</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Choose who can see your profile and content.
                </p>

                <div className="space-y-4">
                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Everyone</span>
                        <input
                            type="radio"
                            name="visibility"
                            value="everyone"
                            checked={visibility === "everyone"}
                            onChange={() => setVisibility("everyone")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Friends Only</span>
                        <input
                            type="radio"
                            name="visibility"
                            value="friends"
                            checked={visibility === "friends"}
                            onChange={() => setVisibility("friends")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Private</span>
                        <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={visibility === "private"}
                            onChange={() => setVisibility("private")}
                        />
                    </label>
                </div>

                <div className="mt-6">
                    <button
                        onClick={closeModal}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}
