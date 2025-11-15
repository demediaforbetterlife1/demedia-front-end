"use client";
import { X } from "lucide-react";
import { useState } from "react";

type FontSizeModalProps = {
    closeModal: () => void;
};

export default function HelpCenterModal({ closeModal }: FontSizeModalProps) {

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

                <div className="space-y-4">
                    <h1 className="m-auto text-lg font-medium text-white/30">This feature will be available soon</h1>
                </div>
            </div>
        </div>
    );
}
