'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    fallbackClassName?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
};

const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 48,
};

export default function Avatar({
    src,
    alt = 'User avatar',
    name,
    size = 'md',
    className = '',
    fallbackClassName = '',
}: AvatarProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Get initials from name
    const getInitials = (name?: string): string => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const initials = getInitials(name);
    const sizeClass = sizeClasses[size];
    const iconSize = iconSizes[size];

    // Determine if we should show the image
    const shouldShowImage = src && !imageError;

    // Generate a consistent color based on name
    const getColorFromName = (name?: string): string => {
        if (!name) return 'bg-gradient-to-br from-gray-500 to-gray-600';

        const colors = [
            'bg-gradient-to-br from-blue-500 to-blue-600',
            'bg-gradient-to-br from-purple-500 to-purple-600',
            'bg-gradient-to-br from-pink-500 to-pink-600',
            'bg-gradient-to-br from-red-500 to-red-600',
            'bg-gradient-to-br from-orange-500 to-orange-600',
            'bg-gradient-to-br from-yellow-500 to-yellow-600',
            'bg-gradient-to-br from-green-500 to-green-600',
            'bg-gradient-to-br from-teal-500 to-teal-600',
            'bg-gradient-to-br from-cyan-500 to-cyan-600',
            'bg-gradient-to-br from-indigo-500 to-indigo-600',
        ];

        const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
        return colors[charCode % colors.length];
    };

    const bgColor = getColorFromName(name);

    return (
        <div
            className={`relative rounded-full overflow-hidden flex items-center justify-center ${sizeClass} ${className}`}
        >
            {shouldShowImage ? (
                <>
                    {!imageLoaded && (
                        <div className={`absolute inset-0 ${bgColor} flex items-center justify-center`}>
                            {initials ? (
                                <span className="font-semibold text-white">{initials}</span>
                            ) : (
                                <User size={iconSize} className="text-white" />
                            )}
                        </div>
                    )}
                    <img
                        src={src}
                        alt={alt}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        onError={() => {
                            console.warn(`Failed to load avatar image: ${src}`);
                            setImageError(true);
                        }}
                        onLoad={() => setImageLoaded(true)}
                        loading="lazy"
                    />
                </>
            ) : (
                <div className={`w-full h-full ${bgColor} flex items-center justify-center ${fallbackClassName}`}>
                    {initials ? (
                        <span className="font-semibold text-white">{initials}</span>
                    ) : (
                        <User size={iconSize} className="text-white" />
                    )}
                </div>
            )}
        </div>
    );
}
