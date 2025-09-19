"use client";

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

class NotificationSettingsService {
  private API_BASE: string;

  constructor() {
    this.API_BASE = "";
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      return await this.makeRequest<NotificationSettings>('/api/notifications/settings');
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      // Return default settings if API fails
      return {
        push: {
          newLogins: true,
          unrecognizedDevice: false,
          securityUpdates: true,
          newsOffers: false,
        },
        email: {
          newLoginAlerts: true,
          unrecognizedDeviceAlerts: true,
          securityUpdates: false,
          newsPromotions: false,
        },
        sms: {
          loginAlerts: true,
          passwordChanges: false,
          newDeviceSignins: true,
          marketingOffers: false,
        },
        mentions: {
          notifyAllMentions: true,
          notifyOnlyFriends: false,
          muteBlockedUsers: true,
          sendEmailForMentions: false,
        },
      };
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return this.makeRequest<NotificationSettings>('/api/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updatePushSettings(settings: Partial<NotificationSettings['push']>): Promise<void> {
    await this.makeRequest('/api/notifications/settings/push', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateEmailSettings(settings: Partial<NotificationSettings['email']>): Promise<void> {
    await this.makeRequest('/api/notifications/settings/email', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateSMSSettings(settings: Partial<NotificationSettings['sms']>): Promise<void> {
    await this.makeRequest('/api/notifications/settings/sms', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateMentionSettings(settings: Partial<NotificationSettings['mentions']>): Promise<void> {
    await this.makeRequest('/api/notifications/settings/mentions', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

// Create singleton instance
export const notificationSettingsService = new NotificationSettingsService();

// Export for use in components
export default notificationSettingsService;
