"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Plus, Video, X } from 'lucide-react';
import CreateDeSnapModal from './CreateDeSnapModal';

interface FloatingDeSnapButtonProps {
    className?: string;
}

export default function FloatingDeSnapButton({ className = "" }: FloatingDeSnapButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);
    const pathname = usePathname();

    // Hide button on auth and setup pages
    useEffect(() => {
        const hiddenPages = [
            '/login', '/signup', '/sign-up', '/auth/login', '/auth/signup',
            '/signinsetup', '/interests', '/finishsetup', '/setup'
        ];
        const isHiddenPage = hiddenPages.some(page => pathname?.includes(page));
        setShouldShow(!isHiddenPage);
    }, [pathname]);

    const handleDeSnapCreated = (deSnap: any) => {
        console.log('DeSnap created:', deSnap);
        // You can add any additional logic here, like showing a success message
        setIsModalOpen(false);
    };

    // Don't render if on auth pages
    if (!shouldShow) {
        return null;
    }

    return (
        <>
            {/* Floating DeSnap Button */}
            <div className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-50 ${className}`}>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white p-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-yellow-300/20"
                    title="Create DeSnap"
                >
                    <Video className="w-6 h-6 drop-shadow-lg" />
                    
                    {/* Enhanced Tooltip */}
                    <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-900/95 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-gray-700 shadow-xl">
                        <div className="font-medium">Create DeSnap</div>
                        <div className="text-xs text-gray-300">Share your moment</div>
                        {/* Tooltip arrow */}
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900/95 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                    
                    {/* Enhanced Pulse animation */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 animate-ping opacity-30"></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 blur-sm group-hover:blur-md transition-all duration-300"></div>
                </button>
            </div>

            {/* DeSnap Creation Modal */}
            <CreateDeSnapModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDeSnapCreated={handleDeSnapCreated}
            />
        </>
    );
}
