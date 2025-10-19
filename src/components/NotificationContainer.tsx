"use client";
import React from "react";
import NotificationToast from "./NotificationToast";

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
}

interface NotificationContainerProps {
    notifications: Notification[];
    onRemove: (id: string) => void;
}

export default function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    {...notification}
                    onClose={onRemove}
                />
            ))}
        </div>
    );
}
