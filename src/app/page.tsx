"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

export default function Index() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuth();
    const { t } = useI18n();

    useEffect(() => {
        // Let AuthGuard handle all authentication-based redirects
        // This component should only handle the initial redirect from root
        if (isLoading) {
            console.log('Root page: Waiting for auth initialization...');
            return;
        }

        console.log('Root page: Auth initialized, redirecting from root...', { 
            isAuthenticated, 
            user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null 
        });

        // Simple redirect logic - let AuthGuard handle the complex authentication checks
        if (isAuthenticated && user) {
            const redirectPath = user.isSetupComplete ? "/home" : "/SignInSetUp";
            console.log('Root page: Authenticated user, redirecting to:', redirectPath);
            router.replace(redirectPath);
        } else {
            console.log('Root page: Unauthenticated user, redirecting to sign-up');
            router.replace("/sign-up");
        }
    }, [isAuthenticated, isLoading, user, router]);

    return (
        <div className="flex items-center justify-center h-screen theme-bg-primary">
            <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="theme-text-primary">{t('index.checkingAuth','Checking authentication...')}</p>
            </div>
        </div>
    );
}
