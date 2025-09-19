"use client";

import { useState, useEffect, useCallback } from 'react';
import { notificationSettingsService } from '@/services/notificationSettingsService';

interface NotificationSettings {
  push: {
    newLogins: boolean;
    unrecognizedDevice: boolean;
    securityUpdates: boolean;
    newsOffers: boolean;
  };
  email: {
    newLoginAlerts: boolean;
    unrecognizedDeviceAlerts: boolean;
    securityUpdates: boolean;
    newsPromotions: boolean;
  };
  sms: {
    loginAlerts: boolean;
    passwordChanges: boolean;
    newDeviceSignins: boolean;
    marketingOffers: boolean;
  };
  mentions: {
    notifyAllMentions: boolean;
    notifyOnlyFriends: boolean;
    muteBlockedUsers: boolean;
    sendEmailForMentions: boolean;
  };
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationSettingsService.getNotificationSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      setSaving(true);
      setError(null);
      await notificationSettingsService.updateNotificationSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Failed to save settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const updatePushSettings = useCallback(async (pushSettings: Partial<NotificationSettings['push']>) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      push: { ...settings.push, ...pushSettings }
    };
    setSettings(newSettings);
    
    try {
      setSaving(true);
      setError(null);
      await notificationSettingsService.updatePushSettings(pushSettings);
    } catch (err) {
      console.error('Failed to update push settings:', err);
      setError('Failed to save push settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const updateEmailSettings = useCallback(async (emailSettings: Partial<NotificationSettings['email']>) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      email: { ...settings.email, ...emailSettings }
    };
    setSettings(newSettings);
    
    try {
      setSaving(true);
      setError(null);
      await notificationSettingsService.updateEmailSettings(emailSettings);
    } catch (err) {
      console.error('Failed to update email settings:', err);
      setError('Failed to save email settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const updateSMSSettings = useCallback(async (smsSettings: Partial<NotificationSettings['sms']>) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      sms: { ...settings.sms, ...smsSettings }
    };
    setSettings(newSettings);
    
    try {
      setSaving(true);
      setError(null);
      await notificationSettingsService.updateSMSSettings(smsSettings);
    } catch (err) {
      console.error('Failed to update SMS settings:', err);
      setError('Failed to save SMS settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const updateMentionSettings = useCallback(async (mentionSettings: Partial<NotificationSettings['mentions']>) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      mentions: { ...settings.mentions, ...mentionSettings }
    };
    setSettings(newSettings);
    
    try {
      setSaving(true);
      setError(null);
      await notificationSettingsService.updateMentionSettings(mentionSettings);
    } catch (err) {
      console.error('Failed to update mention settings:', err);
      setError('Failed to save mention settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    fetchSettings,
    updateSettings,
    updatePushSettings,
    updateEmailSettings,
    updateSMSSettings,
    updateMentionSettings,
  };
};
