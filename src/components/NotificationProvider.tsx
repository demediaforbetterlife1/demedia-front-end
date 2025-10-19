"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useNotificationManager } from "@/hooks/useNotificationManager";
import NotificationContainer from "./NotificationContainer";

interface NotificationContextType {
    showSuccess: (title: string, message: string, duration?: number) => string;
    showError: (title: string, message: string, duration?: number) => string;
    showWarning: (title: string, message: string, duration?: number) => string;
    showInfo: (title: string, message: string, duration?: number) => string;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

interface NotificationProviderProps {
    children: ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
    const {
        notifications,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        clearAll
    } = useNotificationManager();

    return (
        <NotificationContext.Provider value={{
            showSuccess,
            showError,
            showWarning,
            showInfo,
            clearAll
        }}>
            {children}
            <NotificationContainer 
                notifications={notifications} 
                onRemove={removeNotification} 
            />
        </NotificationContext.Provider>
    );
}
