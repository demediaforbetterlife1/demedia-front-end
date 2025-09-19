"use client";
import { X } from "lucide-react";

type BlockedUsersModalProps = {
    closeModal: () => void;
};

const blockedUsers = [
    { id: 1, name: "John Doe", username: "@johndoe" },
    { id: 2, name: "Jane Smith", username: "@janesmith" },
    { id: 3, name: "Michael Lee", username: "@mlee" },
];

export default function BlockedUsersModal({ closeModal }: BlockedUsersModalProps) {
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
                <h2 className="text-2xl font-semibold mb-6">Blocked Users</h2>

                {/* Blocked Users List */}
                <div className="space-y-4">
                    {blockedUsers.length > 0 ? (
                        blockedUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between border border-gray-200 dark:border-neutral-700 rounded-xl p-3"
                            >
                                <div>
                                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                                        {user.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {user.username}
                                    </p>
                                </div>
                                <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm">
                                    Unblock
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400">
                            You haven’t blocked anyone yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
