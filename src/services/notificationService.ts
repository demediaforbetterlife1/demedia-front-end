"use client";

type NotificationAction = { action: string; title: string; icon?: string };

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error: unknown) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification(data: NotificationData): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted or not supported');
      return;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        tag: data.tag,
        data: data.data,
        requireInteraction: true,
        silent: false,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle custom actions based on data
        if (data.data?.action) {
          this.handleNotificationAction(data.data.action, data.data);
        }
      };

    } catch (error: unknown) {
      console.error('Error showing notification:', error);
    }
  }

  private handleNotificationAction(action: string, data: any): void {
    switch (action) {
      case 'navigate':
        if (data.url) {
          window.location.href = data.url;
        }
        break;
      case 'open_modal':
        // Trigger custom events for modal opening
        window.dispatchEvent(new CustomEvent('openModal', { detail: data }));
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  async scheduleNotification(data: NotificationData, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(data);
    }, delay);
  }

  // Service Worker registration for push notifications
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error: unknown) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('Skipping push subscription: missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
        return null;
      }

      // Convert base64 URL-safe VAPID public key string to Uint8Array as required by PushManager
      const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const rawData = typeof window !== 'undefined'
          ? window.atob(base64)
          : Buffer.from(base64, 'base64').toString('binary');
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: applicationServerKey.buffer, // ✅ هنا التعديل
});

      console.log('Push subscription:', subscription);
      return subscription;
    } catch (error: unknown) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const API_BASE = "";
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        console.error('No user ID found');
        return false;
      }

      const response = await fetch(`${API_BASE}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      });

      return response.ok;
    } catch (error: unknown) {
      console.error('Error sending subscription to server:', error);
      return false;
    }
  }

  // Initialize notifications
  async initialize(): Promise<void> {
    if (!this.isSupported) return;

    // Request permission
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    // Register service worker
    await this.registerServiceWorker();

    // Subscribe to push notifications
    const subscription = await this.subscribeToPush();
    if (subscription) {
      await this.sendSubscriptionToServer(subscription);
    }
  }

  // Show different types of notifications
  async showWelcomeNotification(userName: string): Promise<void> {
    await this.showNotification({
      title: 'Welcome to DeMedia! 🚀',
      body: `Hi ${userName}, welcome to our amazing community!`,
      tag: 'welcome',
      data: { action: 'navigate', url: '/home' },
    });
  }

  async showNewPostNotification(authorName: string): Promise<void> {
    await this.showNotification({
      title: 'New Post! 📝',
      body: `${authorName} just shared something new`,
      tag: 'new_post',
      data: { action: 'navigate', url: '/home' },
    });
  }

  async showNewMessageNotification(senderName: string): Promise<void> {
    await this.showNotification({
      title: 'New Message 💬',
      body: `You have a new message from ${senderName}`,
      tag: 'new_message',
      data: { action: 'navigate', url: '/messeging' },
    });
  }

  async showLikeNotification(likerName: string): Promise<void> {
    await this.showNotification({
      title: 'Someone liked your post! ❤️',
      body: `${likerName} liked your post`,
      tag: 'like',
      data: { action: 'navigate', url: '/home' },
    });
  }

  async showCommentNotification(commenterName: string): Promise<void> {
    await this.showNotification({
      title: 'New Comment! 💭',
      body: `${commenterName} commented on your post`,
      tag: 'comment',
      data: { action: 'navigate', url: '/home' },
    });
  }
}

// Lazy singleton facade to avoid touching `window` during SSR
let __notificationInstance: NotificationService | null = null;
function getInstance(): NotificationService {
  if (typeof window === 'undefined') {
    // Return a no-op instance to avoid SSR crashes
    return new NotificationService();
  }
  if (!__notificationInstance) {
    __notificationInstance = new NotificationService();
  }
  return __notificationInstance;
}

export const notificationService = {
  initialize: () => getInstance().initialize(),
  requestPermission: () => getInstance().requestPermission(),
  showNotification: (data: any) => getInstance().showNotification(data),
  showWelcomeNotification: (userName: string) => getInstance().showWelcomeNotification(userName),
  showNewPostNotification: (authorName: string) => getInstance().showNewPostNotification(authorName),
  showNewMessageNotification: (senderName: string) => getInstance().showNewMessageNotification(senderName),
  showLikeNotification: (likerName: string) => getInstance().showLikeNotification(likerName),
  showCommentNotification: (commenterName: string) => getInstance().showCommentNotification(commenterName),
};

export default notificationService;
