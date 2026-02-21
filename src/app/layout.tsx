
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/themes.css";
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
import PWAInstallButton from "@/components/PWAInstallButton";
import PWAInitializer from "@/components/PWAInitializer";
import "@/utils/errorHandler";


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
    title: "DeMedia",
    startupImage: [
      {
        url: "/assets/images/logo.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/assets/images/logo.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/assets/images/logo.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  applicationName: "DeMedia",
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
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DeMedia" />
        <link rel="apple-touch-icon" href="/assets/images/logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-w-screen antialiased`}
      >
        <ErrorBoundary>
          <PWAInitializer />
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
