
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
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  icons: {
    icon: "/assets/images/head.png",
    shortcut: "/assets/images/head.png",
    apple: "/assets/images/head.png",
  },
  openGraph: {
    title: "DeMEDIA",
    description: "Join DeMEDIA – a fast, modern social platform.",
    url: "/",
    siteName: "DeMEDIA",
    images: [{ url: "/assets/images/head.png", width: 1200, height: 630, alt: "DeMEDIA" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeMEDIA",
    description: "Join DeMEDIA – a fast, modern social platform.",
    images: ["/assets/images/head.png"],
  },
  alternates: {
    canonical: "/",
  },
  other: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-w-screen antialiased`}
      >
        <ErrorBoundary>
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
