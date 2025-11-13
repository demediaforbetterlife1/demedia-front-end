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
        // Wait for auth to finish loading
        if (isLoading) {
            console.log('Root page: Waiting for auth initialization...');
            return;
        }

        console.log('Root page: Auth state:', { 
            isAuthenticated, 
            isLoading,
            user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null 
        });

        // Only redirect after auth has finished initializing
        if (isAuthenticated && user) {
            if (user.isSetupComplete) {
                console.log('Root page: User authenticated and setup complete, redirecting to home');
                router.replace("/home");
            } else {
                console.log('Root page: User authenticated but setup incomplete, redirecting to SignInSetUp');
                router.replace("/SignInSetUp");
            }
        } else {
            // Only redirect to sign-up if we're sure user is not authenticated
            // Give it a longer delay to ensure cookies are checked and login state is propagated
            const redirectTimer = setTimeout(() => {
                // Double-check auth state before redirecting
                if (!isAuthenticated && !user) {
                    console.log('Root page: Not authenticated after delay, redirecting to sign-up');
                    router.replace("/sign-up");
                } else {
                    console.log('Root page: Auth state changed during delay, user:', user ? user.id : 'null');
                }
            }, 1000); // Increased delay to allow login state to propagate
            
            return () => clearTimeout(redirectTimer);
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
