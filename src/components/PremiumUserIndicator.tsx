"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Sparkles } from 'lucide-react';

interface PremiumUserIndicatorProps {
    subscriptionTier?: 'monthly' | 'quarterly' | 'semiannual' | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function PremiumUserIndicator({ 
    subscriptionTier, 
    size = 'md',
    className = '' 
}: PremiumUserIndicatorProps) {
    if (!subscriptionTier) return null;

    const getIndicatorConfig = () => {
        switch (subscriptionTier) {
            case 'monthly':
                return {
                    icon: Star,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/20',
                    borderColor: 'border-blue-500/30',
                    title: 'Premium'
                };
            case 'quarterly':
                return {
                    icon: Crown,
                    color: 'text-purple-500',
                    bgColor: 'bg-purple-500/20',
                    borderColor: 'border-purple-500/30',
                    title: 'Pro'
                };
            case 'semiannual':
                return {
                    icon: Sparkles,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/20',
                    borderColor: 'border-yellow-500/30',
                    title: 'Elite'
                };
            default:
                return null;
        }
    };

    const config = getIndicatorConfig();
    if (!config) return null;

    const Icon = config.icon;
    
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const iconSizes = {
        sm: 12,
        md: 16,
        lg: 20
    };

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className={`${sizeClasses[size]} ${config.bgColor} ${config.borderColor} border rounded-full flex items-center justify-center ${className}`}
            title={config.title}
        >
            <Icon 
                size={iconSizes[size]} 
                className={config.color}
            />
        </motion.div>
    );
}