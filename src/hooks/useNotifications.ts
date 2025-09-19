"use client";

import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }

    // Initialize notification service
    const init = async () => {
      try {
        await notificationService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    init();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    setPermission(Notification.permission);
    return granted;
  };

  const showNotification = async (data: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }) => {
    await notificationService.showNotification(data);
  };

  const showWelcomeNotification = async (userName: string) => {
    await notificationService.showWelcomeNotification(userName);
  };

  const showNewPostNotification = async (authorName: string) => {
    await notificationService.showNewPostNotification(authorName);
  };

  const showNewMessageNotification = async (senderName: string) => {
    await notificationService.showNewMessageNotification(senderName);
  };

  const showLikeNotification = async (likerName: string) => {
    await notificationService.showLikeNotification(likerName);
  };

  const showCommentNotification = async (commenterName: string) => {
    await notificationService.showCommentNotification(commenterName);
  };

  return {
    isSupported,
    permission,
    isInitialized,
    requestPermission,
    showNotification,
    showWelcomeNotification,
    showNewPostNotification,
    showNewMessageNotification,
    showLikeNotification,
    showCommentNotification,
  };
};
