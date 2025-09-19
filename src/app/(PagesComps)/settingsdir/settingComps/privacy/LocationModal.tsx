"use client";
import { X } from "lucide-react";
import { useState } from "react";

type LocationModalProps = {
    closeModal: () => void;
};

export default function LocationModal({ closeModal }: LocationModalProps) {
    const [locationAccess, setLocationAccess] = useState("enabled");

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

                <h2 className="text-2xl font-semibold mb-6">Location Settings</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Control whether your location is shared for posts and app features.
                </p>

                <div className="space-y-4">
                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Enabled</span>
                        <input
                            type="radio"
                            name="location"
                            value="enabled"
                            checked={locationAccess === "enabled"}
                            onChange={() => setLocationAccess("enabled")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Only While Using App</span>
                        <input
                            type="radio"
                            name="location"
                            value="appOnly"
                            checked={locationAccess === "appOnly"}
                            onChange={() => setLocationAccess("appOnly")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Disabled</span>
                        <input
                            type="radio"
                            name="location"
                            value="disabled"
                            checked={locationAccess === "disabled"}
                            onChange={() => setLocationAccess("disabled")}
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
