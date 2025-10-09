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
        if (isLoading) return;

        console.log('Root page: Auth state:', { isAuthenticated, user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null });

        if (isAuthenticated && user) {
            if (user.isSetupComplete) {
                console.log('Root page: Redirecting to home');
                router.replace("/home");
            } else {
                console.log('Root page: Redirecting to SignInSetUp');
                router.replace("/SignInSetUp");
            }
        } else {
            console.log('Root page: Redirecting to sign-up');
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
