
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
    icon: "/logo1.png",
    shortcut: "/logo1.png",
    apple: "/logo1.png",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
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
