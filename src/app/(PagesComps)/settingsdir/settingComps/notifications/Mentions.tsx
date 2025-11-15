"use client";
import { X } from "lucide-react";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

type MentionsNotificationsModalProps = {
    closeModal: () => void;
};

export default function MentionsNotificationsModal({
                                                       closeModal,
                                                   }: MentionsNotificationsModalProps) {
    const { settings, loading, saving, error, updateMentionSettings } = useNotificationSettings();

    const handleToggle = async (key: keyof NonNullable<typeof settings>['mentions']) => {
        if (!settings) return;
        const newSettings = { ...settings.mentions, [key]: !settings.mentions[key] };
        await updateMentionSettings(newSettings);
    };

    const handleSave = async () => {
        if (!settings) return;
        await updateMentionSettings(settings.mentions);
        closeModal();
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-[90%] max-w-md p-6 relative">
                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Title */}
                <h2 className="text-xl font-semibold mb-4">Mentions Notifications</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Choose how you’d like to be notified when someone mentions you.
                </p>

                {/* Options */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-400 text-sm text-center py-4">
                        {error}
                    </div>
                ) : settings ? (
                    <div className="space-y-4">
                        <label className="flex items-center justify-between">
                            <span className="text-gray-800 dark:text-gray-200">Notify for All Mentions</span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.mentions.notifyAllMentions}
                                onChange={() => handleToggle('notifyAllMentions')}
                                disabled={saving}
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-gray-800 dark:text-gray-200">Notify Only from Friends</span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.mentions.notifyOnlyFriends}
                                onChange={() => handleToggle('notifyOnlyFriends')}
                                disabled={saving}
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-gray-800 dark:text-gray-200">Mute Mentions from Blocked Users</span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.mentions.muteBlockedUsers}
                                onChange={() => handleToggle('muteBlockedUsers')}
                                disabled={saving}
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-gray-800 dark:text-gray-200">Send Email for Mentions</span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.mentions.sendEmailForMentions}
                                onChange={() => handleToggle('sendEmailForMentions')}
                                disabled={saving}
                            />
                        </label>
                    </div>
                ) : null}

                {/* Save Button */}
                <div className="mt-6">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading || !settings}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-xl transition"
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}
