"use client";

import React, { Suspense, ComponentType, ReactNode, useState, useCallback } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';
import ErrorBoundary from './ErrorBoundary';

interface LazyComponentWrapperProps {
  /**
   * The lazy-loaded component to render
   */
  component: React.LazyExoticComponent<ComponentType<any>>;

  /**
   * Props to pass to the lazy component
   */
  componentProps?: Record<string, any>;

  /**
   * Loading skeleton to display while component is loading
   */
  loadingFallback?: ReactNode;

  /**
   * Custom loading skeleton height
   */
  skeletonHeight?: string;

  /**
   * Custom loading skeleton width
   */
  skeletonWidth?: string;

  /**
   * Error fallback component
   */
  errorFallback?: (error: Error, retry: () => void) => ReactNode;

  /**
   * Callback when component loads successfully
   */
  onLoad?: () => void;

  /**
   * Callback when component fails to load
   */
  onError?: (error: Error) => void;

  /**
   * Enable retry mechanism for failed loads
   * @default true
   */
  enableRetry?: boolean;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Custom className
   */
  className?: string;
}

/**
 * LazyComponentWrapper Component
 * 
 * A utility component that wraps lazy-loaded components with:
 * - Suspense boundary for loading states
 * - Error boundary for error handling
 * - Retry mechanism for failed loads
 * - Loading skeleton display
 * 
 * Validates: Requirements 2.1, 2.2, 2.3
 * 
 * @example
 * ```tsx
 * const LazyModal = lazy(() => import('./CreateContentModal'));
 * 
 * <LazyComponentWrapper
 *   component={LazyModal}
 *   componentProps={{ isOpen: true }}
 *   skeletonHeight="h-96"
 * />
 * ```
 */
export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  component: Component,
  componentProps = {},
  loadingFallback,
  skeletonHeight = 'h-12',
  skeletonWidth = 'w-full',
  errorFallback,
  onLoad,
  onError,
  enableRetry = true,
  maxRetries = 3,
  retryDelay = 1000,
  className = '',
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [key, setKey] = useState(0);

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setKey(prev => prev + 1);
      }, retryDelay);
    }
  }, [retryCount, maxRetries, retryDelay]);

  const handleError = useCallback((error: Error) => {
    console.error('[LazyComponentWrapper] Component failed to load:', error);
    onError?.(error);

    if (enableRetry && retryCount < maxRetries) {
      handleRetry();
    }
  }, [enableRetry, retryCount, maxRetries, onError, handleRetry]);

  const handleLoad = useCallback(() => {
    console.log('[LazyComponentWrapper] Component loaded successfully');
    setRetryCount(0);
    onLoad?.();
  }, [onLoad]);

  const defaultLoadingFallback = (
    <div className={`${className}`}>
      <LoadingSkeleton
        height={skeletonHeight}
        width={skeletonWidth}
        variant="rectangular"
        ariaLabel="Loading component"
      />
    </div>
  );

  const defaultErrorFallback = (error: Error, retry: () => void) => (
    <div className={`p-4 bg-red-900/20 border border-red-500 rounded ${className}`}>
      <p className="text-red-400 font-semibold mb-2">Failed to load component</p>
      <p className="text-red-300 text-sm mb-4">{error.message}</p>
      {enableRetry && retryCount < maxRetries && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Retry ({retryCount + 1}/{maxRetries})
        </button>
      )}
      {retryCount >= maxRetries && (
        <p className="text-red-300 text-sm">Max retries reached. Please refresh the page.</p>
      )}
    </div>
  );

  return (
    <ErrorBoundary
      fallback={(error) =>
        errorFallback?.(error, handleRetry) || defaultErrorFallback(error, handleRetry)
      }
      onError={handleError}
    >
      <Suspense fallback={loadingFallback || defaultLoadingFallback}>
        <Component key={key} {...componentProps} onLoad={handleLoad} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * createLazyComponent Utility Function
 * 
 * Helper function to create a lazy-loaded component with default wrapper configuration.
 * 
 * @example
 * ```tsx
 * const LazyCreateContentModal = createLazyComponent(
 *   () => import('./CreateContentModal'),
 *   { skeletonHeight: 'h-96' }
 * );
 * 
 * // Usage
 * <LazyCreateContentModal isOpen={true} />
 * ```
 */
interface CreateLazyComponentOptions {
  skeletonHeight?: string;
  skeletonWidth?: string;
  enableRetry?: boolean;
  maxRetries?: number;
}

export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: CreateLazyComponentOptions = {}
) {
  const LazyComponent = React.lazy(importFn);

  return (props: P) => (
    <LazyComponentWrapper
      component={LazyComponent}
      componentProps={props}
      skeletonHeight={options.skeletonHeight}
      skeletonWidth={options.skeletonWidth}
      enableRetry={options.enableRetry}
      maxRetries={options.maxRetries}
    />
  );
}

export default LazyComponentWrapper;
