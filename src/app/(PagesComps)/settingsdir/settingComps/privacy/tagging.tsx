"use client";
import { X } from "lucide-react";
import { useState } from "react";

type TaggingModalProps = {
    closeModal: () => void;
};

export default function TaggingModal({ closeModal }: TaggingModalProps) {
    const [taggingOption, setTaggingOption] = useState("everyone");

    return (
        <div className="fixed inset-0 bg-white dark:bg-neutral-900 flex items-center justify-center z-50">
            <div className="w-[90%] max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 relative">
                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-semibold mb-6">Tagging Settings</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Control who can tag you in posts, comments, or photos.
                </p>

                {/* Options */}
                <div className="space-y-4">
                    <label className="flex items-center justify-between border border-gray-200 dark:border-neutral-700 rounded-xl p-3 cursor-pointer">
                        <span className="text-gray-800 dark:text-gray-200">Everyone</span>
                        <input
                            type="radio"
                            name="tagging"
                            value="everyone"
                            checked={taggingOption === "everyone"}
                            onChange={() => setTaggingOption("everyone")}
                        />
                    </label>

                    <label className="flex items-center justify-between border border-gray-200 dark:border-neutral-700 rounded-xl p-3 cursor-pointer">
                        <span className="text-gray-800 dark:text-gray-200">Friends Only</span>
                        <input
                            type="radio"
                            name="tagging"
                            value="friends"
                            checked={taggingOption === "friends"}
                            onChange={() => setTaggingOption("friends")}
                        />
                    </label>

                    <label className="flex items-center justify-between border border-gray-200 dark:border-neutral-700 rounded-xl p-3 cursor-pointer">
                        <span className="text-gray-800 dark:text-gray-200">No One</span>
                        <input
                            type="radio"
                            name="tagging"
                            value="noone"
                            checked={taggingOption === "noone"}
                            onChange={() => setTaggingOption("noone")}
                        />
                    </label>
                </div>

                {/* Save Button */}
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
