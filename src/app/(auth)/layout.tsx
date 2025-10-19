import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "DeMEDIA SIGN IN - SIGN UP",
    description: "",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-w-screen antialiased`}>
            {children}
        </div>
    );
}
