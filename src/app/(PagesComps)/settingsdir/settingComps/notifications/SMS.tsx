"use client";
import { X } from "lucide-react";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

type SmsNotificationsModalProps = {
    closeModal: () => void;
};

export default function SmsNotificationsModal({
                                                  closeModal,
                                              }: SmsNotificationsModalProps) {
    const { settings, loading, saving, error, updateSMSSettings } = useNotificationSettings();

    const handleToggle = async (key: keyof NonNullable<typeof settings>['sms']) => {
        if (!settings) return;
        const newSettings = { ...settings.sms, [key]: !settings.sms[key] };
        await updateSMSSettings(newSettings);
    };

    const handleSave = async () => {
        if (!settings) return;
        await updateSMSSettings(settings.sms);
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
                <h2 className="text-xl font-semibold mb-4">SMS Notifications</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Choose what kind of SMS alerts you’d like to receive.
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
                            <span className="text-gray-800 dark:text-gray-200">
                                Login Alerts
                            </span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.sms.loginAlerts}
                                onChange={() => handleToggle('loginAlerts')}
                                disabled={saving}
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-gray-800 dark:text-gray-200">
                                Password Changes
                            </span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.sms.passwordChanges}
                                onChange={() => handleToggle('passwordChanges')}
                                disabled={saving}
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-gray-800 dark:text-gray-200">
                                New Device Sign-ins
                            </span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.sms.newDeviceSignins}
                                onChange={() => handleToggle('newDeviceSignins')}
                                disabled={saving}
                            />
                        </label>

                        <label className="flex items-center justify-between">
                            <span className="text-gray-800 dark:text-gray-200">
                                Marketing & Offers
                            </span>
                            <input 
                                type="checkbox" 
                                className="toggle-checkbox" 
                                checked={settings.sms.marketingOffers}
                                onChange={() => handleToggle('marketingOffers')}
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
