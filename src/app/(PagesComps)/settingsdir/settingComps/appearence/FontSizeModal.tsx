"use client";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

type FontSizeModalProps = {
    closeModal: () => void;
};

export default function FontSizeModal({ closeModal }: FontSizeModalProps) {
    const [fontSize, setFontSize] = useState("medium");

    useEffect(() => {
        // On mount, read from localStorage and set font size
        const saved = localStorage.getItem("demedia-font-size");
        if (saved && (saved === "small" || saved === "medium" || saved === "large")) {
            setFontSize(saved);
            document.documentElement.style.fontSize =
                saved === "small" ? "14px" : saved === "medium" ? "16px" : "18px";
        }
    }, []);

    const applyFontSize = () => {
        document.documentElement.style.fontSize =
            fontSize === "small"
                ? "14px"
                : fontSize === "medium"
                    ? "16px"
                    : "18px";
        localStorage.setItem("demedia-font-size", fontSize);
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]">
            <div className="w-[90%] max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 relative">
                {/* Close */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-semibold mb-6">Font Size</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Adjust the font size across the app.
                </p>

                <div className="space-y-4">
                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Small</span>
                        <input
                            type="radio"
                            name="fontSize"
                            value="small"
                            checked={fontSize === "small"}
                            onChange={() => setFontSize("small")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Medium</span>
                        <input
                            type="radio"
                            name="fontSize"
                            value="medium"
                            checked={fontSize === "medium"}
                            onChange={() => setFontSize("medium")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700">
                        <span className="text-gray-800 dark:text-gray-200">Large</span>
                        <input
                            type="radio"
                            name="fontSize"
                            value="large"
                            checked={fontSize === "large"}
                            onChange={() => setFontSize("large")}
                        />
                    </label>
                </div>

                <div className="mt-6">
                    <button
                        onClick={applyFontSize}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
