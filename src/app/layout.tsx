
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/themes.css";
import "../styles/pwa.css";
import "../styles/stories-enhanced.css";
import NavbarClient from "@/app/layoutElements/NavBarClient";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { AnimatedStars } from "@/components/AnimatedStars";
import { I18nProvider } from "@/contexts/I18nContext";
import NotificationProvider from "@/components/NotificationProvider";
import GlowingPlanets from "@/components/GlowingPlanets";
import GoldParticles from "@/components/GoldParticles";
import ErrorBoundary from "@/components/ErrorBoundary";
import WebGLErrorHandler from "@/components/WebGLErrorHandler";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAUpdateNotification from "@/components/PWAUpdateNotification";
import "@/utils/errorHandler";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate cache-busting version for icons (static per build)
const iconVersion = process.env.NEXT_PUBLIC_BUILD_ID || '1.0.1';

export const metadata: Metadata = {
  title: "DeMEDIA",
  description: "Powerful social media platform with high-quality UI for better experience, try DeMedia today!",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover",
  icons: {
    icon: `/assets/images/head.png?v=${iconVersion}`,
    shortcut: `/assets/images/head.png?v=${iconVersion}`,
    apple: `/assets/images/head.png?v=${iconVersion}`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DeMEDIA",
    startupImage: `/assets/images/head.png?v=${iconVersion}`,
  },
  openGraph: {
    title: "DeMEDIA",
    description: "Join DeMEDIA – a fast, modern social platform.",
    url: "/",
    siteName: "DeMEDIA",
    images: [{ url: `/assets/images/head.png?v=${iconVersion}`, width: 1200, height: 630, alt: "DeMEDIA" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeMEDIA",
    description: "Join DeMEDIA – a fast, modern social platform.",
    images: [`/assets/images/head.png?v=${iconVersion}`],
  },
  alternates: {
    canonical: "/",
  },
  other: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'mobile-web-app-capable': 'yes',
    'application-name': 'DeMEDIA',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DeMEDIA" />
        <meta name="application-name" content="DeMEDIA" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        
        {/* Icons and Manifest */}
        <link rel="icon" type="image/png" href="/assets/images/head.png" />
        <link rel="apple-touch-icon" href="/assets/images/head.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/assets/images/head.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/head.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/assets/images/head.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Splash Screens */}
        <link rel="apple-touch-startup-image" href="/assets/images/head.png" />
        
        {/* Smart Cache Management - NO AUTO-RELOAD */}
        <script src="/smart-cache.js" defer></script>
        
        {/* Cache buster DISABLED - causing false positives */}
        {/* <script src="/cache-buster.js" defer></script> */}
        
        {/* PWA Registration */}
        <script src="/pwa-register.js" defer></script>
        
        {/* Smart Cache Prevention - NO AUTO-RELOAD */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Smart cache prevention - only for API requests
            (function() {
              console.log('🚀 Initializing smart cache prevention (NO AUTO-RELOAD)...');
              
              // Override fetch for API requests only
              const originalFetch = window.fetch;
              window.fetch = function(input, init) {
                let url = typeof input === 'string' ? input : input.url;
                
                // Don't cache-bust Next.js static assets (they have unique hashes)
                if (url.includes('/_next/static/')) {
                  return originalFetch.call(this, input, init);
                }
                
                // Only add cache busting to API and data requests
                if (url.includes('/api/') || url.includes('/_next/data/') || url.includes('/uploads/')) {
                  const timestamp = Date.now();
                  const random = Math.random().toString(36).substring(7);
                  const separator = url.includes('?') ? '&' : '?';
                  const cacheBustedUrl = url + separator + 't=' + timestamp + '&cb=' + random;
                  
                  const smartInit = {
                    ...init,
                    cache: 'no-store',
                    headers: {
                      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                      'Pragma': 'no-cache',
                      ...(init?.headers || {})
                    }
                  };
                  
                  return originalFetch.call(this, cacheBustedUrl, smartInit);
                }
                
                // For other requests, just add no-cache headers
                const smartInit = {
                  ...init,
                  headers: {
                    'Cache-Control': 'no-cache',
                    ...(init?.headers || {})
                  }
                };
                
                return originalFetch.call(this, input, smartInit);
              };
              
              console.log('✅ Smart cache prevention active (NO AUTO-RELOAD)');
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-w-screen antialiased`}
      >
        <div className="offline-indicator">
          You're offline - Some features may not work
        </div>
        <ErrorBoundary>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <NotificationProvider>
                  <AuthGuard>
                    <WebGLErrorHandler />
                    {/* Reduced WebGL effects to prevent context loss */}
                    <AnimatedStars />
                    {/* <GlowingPlanets /> */}
                    {/* <GoldParticles /> */}
                    <NavbarClient />
                    {children}
                    <PWAInstallPrompt />
                    <PWAUpdateNotification />
                  </AuthGuard>
                </NotificationProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
