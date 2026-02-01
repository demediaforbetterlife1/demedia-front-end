# Lazy Loading Implementation Guide

## Overview

This guide explains how lazy loading is implemented in the DeMedia application to improve performance and reduce initial bundle size.

## Architecture

### Three Tiers of Components

**Tier 1: Critical Components (NOT lazy-loaded)**
- AuthGuard
- NavbarClient
- ThemeProvider
- AuthProvider
- ErrorBoundary
- NotificationProvider

These components are loaded synchronously because they are essential for the application to function properly.

**Tier 2: Heavy Components (Lazy-loaded)**
- Modal components (CreateContentModal, CommentModal, EditPostModal, etc.)
- Settings components (all in settingComps folder)
- Feature components (GamificationSystem, LiveSpaces, TimeCapsules, etc.)
- Complex UI (EnhancedSearchModal, AdvancedVisibilityControls, etc.)

**Tier 3: Page Components (Auto code-split by Next.js)**
- All route pages are automatically code-split by Next.js

## Implementation Patterns

### 1. Using Lazy Modal Components

Modal components are exported as lazy-loaded versions in `lazyModals.ts`:

```tsx
import { LazyCreateContentModal } from '@/components/lazyModals';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Create Content
      </button>
      
      {isModalOpen && (
        <LazyCreateContentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
```

### 2. Using Lazy Settings Components

Settings components are exported as lazy-loaded versions in `lazySettings.ts`:

```tsx
import { LazyTwoFactorAuthSettings } from '@/components/lazySettings';

export default function SecuritySettings() {
  return (
    <div>
      <h1>Security Settings</h1>
      <LazyTwoFactorAuthSettings />
    </div>
  );
}
```

### 3. Using Lazy Feature Components

Feature components are exported as lazy-loaded versions in `lazyFeatures.ts`:

```tsx
import { LazyGamificationSystem } from '@/components/lazyFeatures';

export default function ProfilePage() {
  return (
    <div>
      <h1>Profile</h1>
      <LazyGamificationSystem />
    </div>
  );
}
```

### 4. Using LazyComponentWrapper for Custom Components

For components not in the predefined lazy lists, use `LazyComponentWrapper`:

```tsx
import { LazyComponentWrapper } from '@/components/LazyComponentWrapper';
import React from 'react';

const MyCustomComponent = React.lazy(() => import('./MyCustomComponent'));

export default function Page() {
  return (
    <LazyComponentWrapper
      component={MyCustomComponent}
      componentProps={{ prop1: 'value1' }}
      skeletonHeight="h-96"
      onLoad={() => console.log('Component loaded')}
      onError={(error) => console.error('Failed to load:', error)}
    />
  );
}
```

### 5. Using createLazyComponent Utility

For frequently used lazy components, use the `createLazyComponent` helper:

```tsx
import { createLazyComponent } from '@/components/LazyComponentWrapper';

const LazyMyComponent = createLazyComponent(
  () => import('./MyComponent'),
  {
    skeletonHeight: 'h-64',
    enableRetry: true,
    maxRetries: 3,
  }
);

export default function Page() {
  return <LazyMyComponent prop1="value1" />;
}
```

## Components

### LoadingSkeleton

A reusable loading skeleton component that displays while content is loading.

**Props:**
- `height`: Height of the skeleton (default: 'h-12')
- `width`: Width of the skeleton (default: 'w-full')
- `variant`: 'default' | 'text' | 'circular' | 'rectangular' (default: 'default')
- `lines`: Number of lines for text variant (default: 1)
- `className`: Custom CSS classes
- `ariaLabel`: Accessibility label

**Example:**
```tsx
<LoadingSkeleton
  height="h-32"
  width="w-full"
  variant="rectangular"
  ariaLabel="Loading post content"
/>
```

### SkeletonGroup

A component for displaying multiple skeleton loaders in a grid layout.

**Props:**
- `count`: Number of skeleton items
- `itemHeight`: Height of each item
- `itemWidth`: Width of each item
- `gridCols`: Grid columns (default: 'grid-cols-1')
- `gap`: Gap between items (default: 'gap-4')
- `variant`: Skeleton variant
- `className`: Custom CSS classes

**Example:**
```tsx
<SkeletonGroup
  count={6}
  itemHeight="h-48"
  itemWidth="w-full"
  gridCols="grid-cols-2"
  gap="gap-4"
  variant="rectangular"
/>
```

### LazyComponentWrapper

A utility component that wraps lazy-loaded components with Suspense, error boundary, and retry mechanism.

**Props:**
- `component`: The lazy component to render
- `componentProps`: Props to pass to the component
- `loadingFallback`: Custom loading UI
- `skeletonHeight`: Height of default loading skeleton
- `skeletonWidth`: Width of default loading skeleton
- `errorFallback`: Custom error UI
- `onLoad`: Callback when component loads
- `onError`: Callback when component fails
- `enableRetry`: Enable retry on error (default: true)
- `maxRetries`: Maximum retry attempts (default: 3)
- `retryDelay`: Delay between retries in ms (default: 1000)
- `className`: Custom CSS classes

**Example:**
```tsx
<LazyComponentWrapper
  component={LazyMyComponent}
  componentProps={{ isOpen: true }}
  skeletonHeight="h-96"
  enableRetry={true}
  maxRetries={5}
  onLoad={() => console.log('Loaded')}
  onError={(error) => console.error(error)}
/>
```

### ErrorBoundary

Enhanced error boundary with support for lazy component errors and retry mechanism.

**Props:**
- `children`: Child components
- `fallback`: Error UI (can be a function)
- `onError`: Callback when error occurs

**Example:**
```tsx
<ErrorBoundary
  fallback={(error, retry) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
  onError={(error) => console.error(error)}
>
  <MyComponent />
</ErrorBoundary>
```

## Image & Media Lazy Loading

### Image Lazy Loading

Use Next.js Image component with lazy loading:

```tsx
import Image from 'next/image';

export default function PostImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E"
    />
  );
}
```

### Video Lazy Loading

Use intersection observer for video playback:

```tsx
import { useEffect, useRef } from 'react';

export default function LazyVideo({ src, poster }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play();
        } else if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      loading="lazy"
      controls
    />
  );
}
```

## Performance Best Practices

### 1. Only Lazy-Load Heavy Components

Don't lazy-load:
- Small utility components
- Components used on every page
- Components needed for initial render

### 2. Provide Good Loading States

Always provide a loading skeleton that matches the component's dimensions to avoid layout shift.

### 3. Handle Errors Gracefully

Always wrap lazy components with error boundaries and provide retry mechanisms.

### 4. Monitor Performance

Use Web Vitals to monitor:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### 5. Test Lazy Loading

Test on slow networks (3G) to ensure loading states are visible and UX is good.

## Troubleshooting

### Component Not Loading

1. Check that the import path is correct
2. Verify the component exports a default export
3. Check browser console for errors
4. Ensure the component is wrapped in Suspense or LazyComponentWrapper

### Loading State Never Disappears

1. Check that the component is rendering correctly
2. Verify the Suspense boundary is properly configured
3. Check for errors in the component that might prevent rendering

### Retry Not Working

1. Verify `enableRetry` is set to true
2. Check that `maxRetries` is greater than 0
3. Verify the error boundary is catching the error

## Migration Guide

To convert an existing component to lazy loading:

1. **Create a lazy version:**
   ```tsx
   export const LazyMyComponent = dynamic(
     () => import('./MyComponent'),
     {
       loading: () => <LoadingSkeleton height="h-96" />,
       ssr: false,
     }
   );
   ```

2. **Update imports:**
   ```tsx
   // Before
   import MyComponent from './MyComponent';
   
   // After
   import { LazyMyComponent } from '@/components/lazyComponents';
   ```

3. **Update usage:**
   ```tsx
   // Before
   <MyComponent {...props} />
   
   // After
   <LazyMyComponent {...props} />
   ```

4. **Test:**
   - Test on slow network
   - Verify loading state appears
   - Verify component renders correctly
   - Test error scenarios

## Performance Metrics

### Before Lazy Loading
- Initial bundle size: ~500KB
- Initial page load: ~4.5s
- Time to Interactive: ~6s

### After Lazy Loading (Target)
- Initial bundle size: ~400KB (20% reduction)
- Initial page load: <3s
- Time to Interactive: <5s

## References

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Web Vitals](https://web.dev/vitals/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
