"use client";

import React from 'react';

interface LoadingSkeletonProps {
  /**
   * Height of the skeleton in pixels or CSS units
   * @default "h-12"
   */
  height?: string;

  /**
   * Width of the skeleton in pixels or CSS units
   * @default "w-full"
   */
  width?: string;

  /**
   * Variant of the skeleton
   * @default "default"
   */
  variant?: 'default' | 'text' | 'circular' | 'rectangular';

  /**
   * Number of lines to display (for text variant)
   * @default 1
   */
  lines?: number;

  /**
   * Custom className to override defaults
   */
  className?: string;

  /**
   * Accessibility label
   */
  ariaLabel?: string;
}

/**
 * LoadingSkeleton Component
 * 
 * A reusable loading skeleton component that displays a placeholder
 * while content is being loaded. Supports multiple variants and
 * customizable dimensions.
 * 
 * Validates: Requirements 2.1, 2.3
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  height = 'h-12',
  width = 'w-full',
  variant = 'default',
  lines = 1,
  className = '',
  ariaLabel = 'Loading content',
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded';
  
  const variantClasses = {
    default: `${height} ${width}`,
    text: `${height} ${width}`,
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const skeletonClass = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (variant === 'text' && lines > 1) {
    return (
      <div
        className="space-y-2"
        role="status"
        aria-busy="true"
        aria-label={ariaLabel}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4 ${width} ${
              index === lines - 1 ? 'w-5/6' : ''
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={skeletonClass}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    />
  );
};

/**
 * SkeletonGroup Component
 * 
 * A component for displaying multiple skeleton loaders in a grid layout.
 * Useful for loading lists or grids of items.
 */
interface SkeletonGroupProps {
  /**
   * Number of skeleton items to display
   */
  count: number;

  /**
   * Height of each skeleton item
   */
  itemHeight?: string;

  /**
   * Width of each skeleton item
   */
  itemWidth?: string;

  /**
   * Grid columns (Tailwind class)
   * @default "grid-cols-1"
   */
  gridCols?: string;

  /**
   * Gap between items (Tailwind class)
   * @default "gap-4"
   */
  gap?: string;

  /**
   * Variant of skeleton items
   */
  variant?: 'default' | 'text' | 'circular' | 'rectangular';

  /**
   * Custom className
   */
  className?: string;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count,
  itemHeight = 'h-12',
  itemWidth = 'w-full',
  gridCols = 'grid-cols-1',
  gap = 'gap-4',
  variant = 'default',
  className = '',
}) => {
  return (
    <div
      className={`grid ${gridCols} ${gap} ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading multiple items"
    >
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          height={itemHeight}
          width={itemWidth}
          variant={variant}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
