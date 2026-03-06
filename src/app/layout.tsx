
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import "../styles/themes.css";
import NavbarClient from "@/app/layoutElements/NavBarClient";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { I18nProvider } from "@/contexts/I18nContext";
import NotificationProvider from "@/components/NotificationProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/utils/errorHandler";

// Lazy load non-critical components
const AnimatedStars = dynamic(() => import("@/components/AnimatedStars"), { ssr: false });
const GlowingPlanets = dynamic(() => import("@/components/GlowingPlanets"), { ssr: false });
const GoldParticles = dynamic(() => import("@/components/GoldParticles"), { ssr: false });
const WebGLErrorHandler = dynamic(() => import("@/components/WebGLErrorHandler"), { ssr: false });
const PWAInstallButton = dynamic(() => import("@/components/PWAInstallButton"), { ssr: false });
const PWARegister = dynamic(() => import("@/components/PWARegister"), { ssr: false });
const PWAStatus = dynamic(() => import("@/components/PWAStatus"), { ssr: false });
const VersionChecker = dynamic(() => import("@/components/VersionChecker"), { ssr: false });


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeMEDIA",
  description: "Powerful social media platform with high-quality UI for better experience, try DeMedia today!",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  icons: {
    icon: "/logo1.png",
    shortcut: "/logo1.png",
    apple: "/logo1.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DeMEDIA",
  },
  openGraph: {
    title: "DeMEDIA",
    description: "Join DeMEDIA – a fast, modern social platform.",
    url: "/",
    siteName: "DeMEDIA",
    images: [{ url: "/logo1.png", width: 1200, height: 630, alt: "DeMEDIA" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeMEDIA",
    description: "Join DeMEDIA – a fast, modern social platform.",
    images: ["/logo1.png"],
  },
  alternates: {
    canonical: "/",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00bcd4" />
        <link rel="apple-touch-icon" href="/logo1.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-w-screen antialiased`}
      >
        <ErrorBoundary>
          <PWARegister />
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <NotificationProvider>
                  <AuthGuard>
                    <WebGLErrorHandler />
                    <AnimatedStars />
                    <GlowingPlanets />
                    <GoldParticles />
                    <NavbarClient />
                    <PWAStatus />
                    <VersionChecker />
                    {children}
                    <PWAInstallButton />
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
