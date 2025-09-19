"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import gsap from "gsap";
import AccountInfo from "@/app/(PagesComps)/settingsdir/settingComps/account/AccountInfo";
import TwoFactorSettings from "@/app/(PagesComps)/settingsdir/settingComps/2FA/TwoFactorAuthSettings";
import LoginActivity from "@/app/(PagesComps)/settingsdir/settingComps/2FA/LoginActivity";
import TrustedDevicesModal from "@/app/(PagesComps)/settingsdir/settingComps/2FA/TrustedDevices";
import Recovery from "@/app/(PagesComps)/settingsdir/settingComps/2FA/Recovery";
import MentionsNotificationsModal from "@/app/(PagesComps)/settingsdir/settingComps/notifications/Mentions";
import SmsNotificationsModal from "@/app/(PagesComps)/settingsdir/settingComps/notifications/SMS";
import EmailAlertsModal from "@/app/(PagesComps)/settingsdir/settingComps/notifications/EmailAlerts";
import PushNotificationsModal from "@/app/(PagesComps)/settingsdir/settingComps/notifications/Push";
import BlockedUsersModal from "@/app/(PagesComps)/settingsdir/settingComps/privacy/blockedUsers";
import TaggingModal from "@/app/(PagesComps)/settingsdir/settingComps/privacy/tagging";
import VisibilityModal from "@/app/(PagesComps)/settingsdir/settingComps/privacy/VisibilityModal";
import LocationModal from "@/app/(PagesComps)/settingsdir/settingComps/privacy/LocationModal";
import FeedbackModal from "@/app/(PagesComps)/settingsdir/settingComps/support/FeedbackModal";
import TermsModal from "@/app/(PagesComps)/settingsdir/settingComps/support/TermsModal";
import ThemeModal from "@/app/(PagesComps)/settingsdir/settingComps/appearence/themes";
import FontSizeModal from "@/app/(PagesComps)/settingsdir/settingComps/support/HelpCenter";
import HelpCenterModal from "@/app/(PagesComps)/settingsdir/settingComps/support/HelpCenter";
import { useI18n } from "@/contexts/I18nContext";


type Item = {
    name: string;
    modal?:
        | "account"
        | "2fa"
        | "loginactivity"
        | "trusteddevices"
        | "recovery"
        | "push"
        | "emailalerts"
        | "sms"
        | "mentions"
        | "blockedusers"
        | "tagging"
        | "visibility"
        | "location"
        | "theme"
        | "fontsize"
        | "helpcenter"
        | "feedback"
        | "terms";
};

type Section = {
    title: string;
    items: Item[];
};

export default function SettingsItems() {
    const [isOpen, setIsOpen] = useState(true);
    const [activeModal, setActiveModal] = useState<Item["modal"] | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const { t, supportedLocales, language, setLanguage } = useI18n();

    const sections: Section[] = [
        {
            title: t('settings.account', 'Account'),
            items: [{ name: "Account Info", modal: "account" }],
        },
        {
            title: t('settings.security', 'Security'),
            items: [
                { name: "2FA", modal: "2fa" },
                { name: "Login Activity", modal: "loginactivity" },
                { name: "Trusted Devices", modal: "trusteddevices" },
                { name: "Recovery", modal: "recovery" },
            ],
        },
        {
            title: t('settings.notifications', 'Notifications'),
            items: [
                { name: "Push", modal: "push" },
                { name: "Email Alerts", modal: "emailalerts" },
                { name: "SMS", modal: "sms" },
                { name: "Mentions", modal: "mentions" },
            ],
        },
        {
            title: t('settings.privacy', 'Privacy'),
            items: [
                { name: "Visibility", modal: "visibility" },
                { name: "Blocked Users", modal: "blockedusers" },
                { name: "Tagging", modal: "tagging" },
                { name: "Location", modal: "location" },
            ],
        },
        {
            title: t('settings.appearance', 'Appearance'),
            items: [
                { name: "Theme", modal: "theme" },
                { name: "Font Size", modal: "fontsize" },
            ],
        },
        {
            title: t('settings.support', 'Support'),
            items: [
                { name: "Help Center", modal: "helpcenter" },
                { name: "Feedback", modal: "feedback" },
                { name: "Terms", modal: "terms" },
                { name: "Log Out" },
            ],
        },
    ];

    useEffect(() => {
        if (isOpen && contentRef.current) {
            gsap.fromTo(
                contentRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.2)" }
            );
        }
    }, [isOpen]);

    const closeAll = () => {
        setActiveModal(null);
        setIsOpen(false);
    };

    const closeActiveModal = () => {
        setActiveModal(null);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Settings Panel */}
            <div className="fixed inset-0 flex items-center justify-center z-50 translate-y-10">
                <motion.div
                    ref={contentRef}
                    className="w-[280px] h-[500px] theme-bg-secondary border theme-border rounded-2xl theme-shadow overflow-hidden font-sans select-none relative"
                    style={{
                        boxShadow: `
              0 10px 30px -10px var(--shadow-color),
              0 0 0 1px var(--border-color),
              0 0 30px -15px var(--accent-primary)
            `,
                    }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 theme-bg-tertiary/90 backdrop-blur border-b theme-border">
                        <span className="text-sm font-medium theme-text-primary">{t('settings.title', 'Settings')}</span>
                        <button
                            onClick={closeAll}
                            className="p-1.5 rounded-full theme-text-muted hover:theme-text-primary hover:theme-bg-primary transition-colors"
                            aria-label="Close settings"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="w-full h-[calc(100%-56px)] theme-bg-secondary overflow-y-auto p-3 space-y-4 no-scrollbar">
                        {sections.map((section) => (
                            <div key={section.title}>
                                <h3 className="text-xs font-semibold theme-text-muted uppercase tracking-tight mb-2">
                                    {section.title}
                                </h3>
                                <ul className="space-y-1">
                                    {section.items.map((item) => (
                                        <motion.li
                                            key={item.name}
                                            className="flex items-center justify-between px-3 py-2 theme-text-secondary text-sm hover:theme-bg-primary rounded-lg cursor-pointer transition-colors"
                                            whileHover={{ x: 4 }}
                                            transition={{ duration: 0.1 }}
                                            onClick={() => {
                                                if (item.modal) setActiveModal(item.modal);
                                            }}
                                        >
                                            {item.name}
                                            <ChevronRight className="w-3 h-3 theme-text-muted" />
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        {/* Language Selector */}
                        <div className="mt-2">
                            <h3 className="text-xs font-semibold theme-text-muted uppercase tracking-tight mb-2">{t('settings.language', 'Language')}</h3>
                            <div className="px-3 py-2 theme-bg-tertiary/60 rounded-lg border theme-border flex items-center justify-between">
                                <span className="text-sm theme-text-secondary">{supportedLocales.find(l => l.code === language)?.name || language}</span>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="text-sm theme-bg-primary border theme-border rounded px-2 py-1"
                                >
                                    {supportedLocales.map((l) => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* === Modals === */}

            {/* Account & Security */}
            {activeModal === "account" && <AccountInfo closeModal={closeActiveModal} />}
            {activeModal === "2fa" && <TwoFactorSettings closeModal={closeActiveModal} />}
            {activeModal === "loginactivity" && <LoginActivity closeModal={closeActiveModal} />}
            {activeModal === "trusteddevices" && <TrustedDevicesModal closeModal={closeActiveModal} />}
            {activeModal === "recovery" && <Recovery closeModal={closeActiveModal} />}

            {/* Notifications */}
            {activeModal === "push" && <PushNotificationsModal closeModal={closeActiveModal} />}
            {activeModal === "emailalerts" && <EmailAlertsModal closeModal={closeActiveModal} />}
            {activeModal === "sms" && <SmsNotificationsModal closeModal={closeActiveModal} />}
            {activeModal === "mentions" && <MentionsNotificationsModal closeModal={closeActiveModal} />}

            {/* Privacy */}
            {activeModal === "blockedusers" && <BlockedUsersModal closeModal={closeActiveModal} />}
            {activeModal === "tagging" && <TaggingModal closeModal={closeActiveModal} />}
            {activeModal === "visibility" && <VisibilityModal closeModal={closeActiveModal} />}
            {activeModal === "location" && <LocationModal closeModal={closeActiveModal} />}

            {/* Appearance */}
            {activeModal === "theme" && <ThemeModal closeModal={closeActiveModal} />}
            {activeModal === "fontsize" && <FontSizeModal closeModal={closeActiveModal} />}

            {/* Support */}
            {activeModal === "helpcenter" && <HelpCenterModal closeModal={closeActiveModal} />}
            {activeModal === "feedback" && <FeedbackModal open={true} onOpenChange={closeActiveModal} />}
            {activeModal === "terms" && <TermsModal closeModal={closeActiveModal} />}
        </>
    );
}
