"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Sparkles } from 'lucide-react';

interface PremiumCommentProps {
    children: React.ReactNode;
    subscriptionTier?: 'monthly' | 'quarterly' | 'semiannual' | null;
    className?: string;
}

export default function PremiumComment({ 
    children, 
    subscriptionTier,
    className = '' 
}: PremiumCommentProps) {
    if (!subscriptionTier) {
        return <>{children}</>;
    }

    const getHighlightConfig = () => {
        switch (subscriptionTier) {
            case 'monthly':
                return {
                    bgGradient: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10',
                    borderColor: 'border-blue-500/30',
                    icon: Star,
                    iconColor: 'text-blue-500'
                };
            case 'quarterly':
                return {
                    bgGradient: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10',
                    borderColor: 'border-purple-500/30',
                    icon: Crown,
                    iconColor: 'text-purple-500'
                };
            case 'semiannual':
                return {
                    bgGradient: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10',
                    borderColor: 'border-yellow-500/30',
                    icon: Sparkles,
                    iconColor: 'text-yellow-500'
                };
            default:
                return null;
        }
    };

    const config = getHighlightConfig();
    if (!config) return <>{children}</>;

    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative ${config.bgGradient} ${config.borderColor} border rounded-xl p-3 ${className}`}
        >
            {/* Premium indicator */}
            <div className="absolute -top-2 -right-2">
                <div className={`w-6 h-6 ${config.bgGradient} ${config.borderColor} border rounded-full flex items-center justify-center`}>
                    <Icon size={12} className={config.iconColor} />
                </div>
            </div>
            
            {/* Comment content */}
            <div className="pr-4">
                {children}
            </div>
        </motion.div>
    );
}
