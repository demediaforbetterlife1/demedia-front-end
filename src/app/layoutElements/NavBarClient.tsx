"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/app/layoutElements/NavBar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function NavbarClient() {
    const pathname = usePathname();
    if (pathname.startsWith("/sign-in") || 
        pathname.startsWith("/sign-up") || 
        pathname.startsWith("/SignInSetUp") ||
        pathname.startsWith("/FinishSetup") ||
        pathname.startsWith("/interests")) return null;
    
    return (
        <>
            <Navbar />
            <MobileBottomNav />
        </>
    );
}
