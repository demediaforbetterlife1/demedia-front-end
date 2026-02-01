/**
 * Lazy-loaded Settings Components
 * 
 * This file exports lazy-loaded versions of all settings components
 * to improve initial page load performance.
 * 
 * Validates: Requirements 2.1, 2.2, 4.1-4.6
 */

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from './LoadingSkeleton';

// Loading fallback component for settings
const SettingsLoadingFallback = () => (
  <div className="p-6">
    <LoadingSkeleton height="h-8" width="w-1/3" className="mb-6" />
    <div className="space-y-4">
      <LoadingSkeleton height="h-12" width="w-full" />
      <LoadingSkeleton height="h-12" width="w-full" />
      <LoadingSkeleton height="h-12" width="w-full" />
    </div>
  </div>
);

// ============================================
// 2FA Settings Components
// ============================================

/**
 * Lazy-loaded TwoFactorAuthSettings
 * Validates: Requirements 4.1.1
 */
export const LazyTwoFactorAuthSettings = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/2FA/TwoFactorAuthSettings'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded LoginActivity
 * Validates: Requirements 4.1.2
 */
export const LazyLoginActivity = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/2FA/LoginActivity'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Recovery
 * Validates: Requirements 4.1.3
 */
export const LazyRecovery = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/2FA/Recovery'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded TrustedDevices
 * Validates: Requirements 4.1.4
 */
export const LazyTrustedDevices = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/2FA/TrustedDevices'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Account Settings Components
// ============================================

/**
 * Lazy-loaded AccountInfo
 * Validates: Requirements 4.2.1
 */
export const LazyAccountInfo = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/account/AccountInfo'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Appearance Settings Components
// ============================================

/**
 * Lazy-loaded Appearance/Themes
 * Validates: Requirements 4.3.1
 */
export const LazyAppearanceThemes = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/appearence/themes'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded FontSizeModal
 * Validates: Requirements 4.3.2
 */
export const LazyFontSizeModal = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/appearence/FontSizeModal'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Notification Settings Components
// ============================================

/**
 * Lazy-loaded EmailAlerts
 * Validates: Requirements 4.4.1
 */
export const LazyEmailAlerts = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/notifications/EmailAlerts'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Mentions
 * Validates: Requirements 4.4.2
 */
export const LazyMentions = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/notifications/Mentions'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Push Notifications
 * Validates: Requirements 4.4.3
 */
export const LazyPush = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/notifications/Push'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded SMS Notifications
 * Validates: Requirements 4.4.4
 */
export const LazySMS = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/notifications/SMS'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Privacy Settings Components
// ============================================

/**
 * Lazy-loaded Blocked Users
 * Validates: Requirements 4.5.1
 */
export const LazyBlockedUsers = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/privacy/blockedUsers'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded LocationModal
 * Validates: Requirements 4.5.2
 */
export const LazyLocationModal = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/privacy/LocationModal'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Tagging
 * Validates: Requirements 4.5.3
 */
export const LazyTagging = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/privacy/tagging'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded VisibilityModal
 * Validates: Requirements 4.5.4
 */
export const LazyVisibilityModal = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/privacy/VisibilityModal'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Support Settings Components
// ============================================

/**
 * Lazy-loaded FeedbackModal
 * Validates: Requirements 4.6.1
 */
export const LazyFeedbackModal = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/support/FeedbackModal'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded HelpCenter
 * Validates: Requirements 4.6.2
 */
export const LazyHelpCenter = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/support/HelpCenter'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded TermsModal
 * Validates: Requirements 4.6.3
 */
export const LazyTermsModal = dynamic(
  () => import('@/app/(PagesComps)/settingsdir/settingComps/support/TermsModal'),
  {
    loading: () => <SettingsLoadingFallback />,
    ssr: false,
  }
);

export default {
  // 2FA
  LazyTwoFactorAuthSettings,
  LazyLoginActivity,
  LazyRecovery,
  LazyTrustedDevices,
  // Account
  LazyAccountInfo,
  // Appearance
  LazyAppearanceThemes,
  LazyFontSizeModal,
  // Notifications
  LazyEmailAlerts,
  LazyMentions,
  LazyPush,
  LazySMS,
  // Privacy
  LazyBlockedUsers,
  LazyLocationModal,
  LazyTagging,
  LazyVisibilityModal,
  // Support
  LazyFeedbackModal,
  LazyHelpCenter,
  LazyTermsModal,
};
