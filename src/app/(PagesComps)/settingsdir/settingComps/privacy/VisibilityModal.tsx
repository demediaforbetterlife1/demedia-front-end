"use client";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, getAuthHeaders } from "@/lib/api";

type VisibilityModalProps = {
    closeModal: () => void;
};

export default function VisibilityModal({ closeModal }: VisibilityModalProps) {
    const { user, updateUser } = useAuth();
    const [visibility, setVisibility] = useState(user?.privacy || "public");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (user?.privacy) {
            setVisibility(user.privacy);
        }
    }, [user]);

    const handleSave = async () => {
        if (!user?.id) {
            setError("User not found");
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await apiFetch(`/api/user/${user.id}`, {
                method: "PUT",
                headers: getAuthHeaders(user.id),
                body: JSON.stringify({ privacy: visibility })
            }, user.id);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to update privacy: ${response.status}`);
            }

            const updatedUser = await response.json();
            
            if (setUser && updatedUser) {
                setUser(updatedUser);
            }
            
            setSuccess("Privacy settings updated successfully!");
            
            setTimeout(() => {
                closeModal();
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to update privacy settings");
        } finally {
            setIsSaving(false);
        }
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

                <h2 className="text-2xl font-semibold mb-6">Profile Visibility</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Choose who can see your profile and content.
                </p>

                <div className="space-y-4">
                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                        <span className="text-gray-800 dark:text-gray-200">Public (Everyone)</span>
                        <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={visibility === "public"}
                            onChange={() => setVisibility("public")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                        <span className="text-gray-800 dark:text-gray-200">Followers Only</span>
                        <input
                            type="radio"
                            name="visibility"
                            value="followers"
                            checked={visibility === "followers"}
                            onChange={() => setVisibility("followers")}
                        />
                    </label>

                    <label className="flex justify-between items-center border p-3 rounded-xl cursor-pointer dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
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

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-400 text-sm">{success}</p>
                    </div>
                )}

                <div className="mt-6">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-xl transition-colors"
                    >
                        {isSaving ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>
        </div>
    );
}
