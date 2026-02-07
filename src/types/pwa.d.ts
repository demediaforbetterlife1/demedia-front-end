// PWA Type Definitions

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Window interface for PWA-related functions
declare global {
  interface Window {
    // PWA Install Prompt
    deferredPrompt?: BeforeInstallPromptEvent | null;
    
    // PWA Update Notifications
    showUpdateNotification?: () => void;
    
    // PWA Utility Functions
    installPWA?: () => Promise<void>;
    
    // PWA Configuration
    PWA_CONFIG?: {
      name: string;
      shortName: string;
      description: string;
      themeColor: string;
      backgroundColor: string;
    };
    
    // PWA Utils
    PWA_UTILS?: {
      isInstalled: () => boolean;
      isSupported: () => boolean;
      getInstallPrompt: () => BeforeInstallPromptEvent | null;
      install: () => Promise<boolean>;
      registerServiceWorker: () => Promise<ServiceWorkerRegistration | null>;
      checkForUpdates: () => Promise<void>;
      clearCache: () => Promise<void>;
      getNetworkStatus: () => {
        online: boolean;
        connection?: any;
      };
      requestNotificationPermission: () => Promise<boolean>;
      showNotification: (title: string, options?: NotificationOptions) => void;
    };
  }

  // Service Worker Navigator Extension
  interface Navigator {
    standalone?: boolean;
  }
}

export {};