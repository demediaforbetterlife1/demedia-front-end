# Image Loading Fix

## Overview
Fixed image loading issues for posts, profile photos, and all media content to ensure immediate loading without delays.

## Changes Made

### 1. Backend URL Configuration
**File**: `demedia/src/utils/mediaUtils.ts`

Updated the backend URL to use the correct Railway deployment:
```typescript
export const BACKEND_URL = "https://demedia-backend-production.up.railway.app";
```

### 2. MediaImage Component Optimization
**File**: `demedia/src/components/MediaImage.tsx`

Improvements:
- Simplified state management for faster rendering
- Added proper `useEffect` to handle src changes immediately
- Improved error handling with automatic fallback
- Added `crossOrigin="anonymous"` for CORS support
- Smoother opacity transitions (300ms)
- Better loading state management
- Removed debug overlays that could block rendering

Key features:
```typescript
// Immediate src update on prop change
useEffect(() => {
  const newSrc = imageError ? getFallbackImage() : getValidImageUrl(src);
  if (newSrc !== currentSrc) {
    setCurrentSrc(newSrc);
    setIsLoading(true);
    setImageError(false);
  }
}, [src, imageError, getFallbackImage, getValidImageUrl, currentSrc]);

// Smooth loading transition
<img
  src={currentSrc}
  className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
  onError={handleImageError}
  onLoad={handleImageLoad}
  loading={priority ? "eager" : "lazy"}
  crossOrigin="anonymous"
/>
```

### 3. URL Normalization
**File**: `demedia/src/utils/mediaUtils.ts`

The `ensureAbsoluteMediaUrl` function handles:
- Absolute URLs (http/https) - returned as-is
- Data URLs (base64) - returned as-is
- Local assets (/images/, /assets/) - returned as-is
- Backend uploads (/uploads/) - prepended with backend URL
- Relative paths - converted to absolute backend URLs

```typescript
export function ensureAbsoluteMediaUrl(url?: string | null): string | null {
  if (!isValidUrl(url)) return null;
  
  const cleanUrl = url!.trim();
  
  // Already absolute
  if (!needsPrefix(cleanUrl)) return cleanUrl;
  
  // Local uploads
  if (cleanUrl.startsWith("/local-uploads") || cleanUrl.startsWith("local-uploads")) {
    return cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  }
  
  // Convert to absolute
  const normalized = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  return `${BACKEND_URL}${normalized}`;
}
```

## Image Loading Flow

### For Posts with Images

1. **Post Creation**:
   - User uploads image
   - Backend stores image and returns URL
   - Frontend receives URL (e.g., `/uploads/posts/image.jpg`)

2. **Post Display**:
   - MediaImage component receives URL
   - URL is normalized to absolute: `https://demedia-backend-production.up.railway.app/uploads/posts/image.jpg`
   - Image loads with loading state (skeleton)
   - On load: opacity transitions from 0 to 100%
   - On error: fallback image is shown

3. **Loading States**:
   ```tsx
   {isLoading && (
     <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
   )}
   <img
     className={`${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
   />
   ```

### For Profile Pictures

1. **Profile Picture Upload**:
   - User uploads photo via profile settings
   - Backend stores and returns URL
   - Frontend updates user context with new URL

2. **Profile Picture Display**:
   - MediaImage component with `alt` containing "profile" or "avatar"
   - Automatic fallback to `/images/default-avatar.svg`
   - Immediate loading with skeleton
   - Smooth transition on load

3. **Cache Busting**:
   ```typescript
   export function appendCacheBuster(url: string): string {
     const separator = url.includes("?") ? "&" : "?";
     return `${url}${separator}t=${Date.now()}`;
   }
   ```

## Components Using MediaImage

All these components now benefit from optimized image loading:

1. **Posts** (`demedia/src/app/(PagesComps)/homedir/posts.tsx`)
   - Post images
   - User avatars
   - Gallery images

2. **Profile** (`demedia/src/app/(pages)/profile/page.tsx`)
   - Profile picture
   - Cover photo
   - Post images in profile

3. **Stories** (`demedia/src/components/StoryCard.tsx`)
   - Story images
   - Story videos
   - User avatars

4. **DeSnaps** (`demedia/src/components/DeSnapsViewer.tsx`)
   - DeSnap media
   - User avatars

5. **Comments** (`demedia/src/components/CommentModal.tsx`)
   - User avatars

## Fallback Images

Located in `public/images/`:
- `default-avatar.svg` - For profile pictures
- `default-post.svg` - For post images
- `default-cover.svg` - For cover photos
- `default-placeholder.svg` - Generic fallback

## Performance Optimizations

### 1. Lazy Loading
```typescript
loading={priority ? "eager" : "lazy"}
```
- Priority images (first post, profile picture): eager loading
- Other images: lazy loading (loads when in viewport)

### 2. CORS Support
```typescript
crossOrigin="anonymous"
```
- Allows images from backend to load without CORS issues
- Enables canvas manipulation if needed

### 3. Smooth Transitions
```css
transition-opacity duration-300
```
- 300ms fade-in when image loads
- Better UX than instant appearance

### 4. Loading Skeletons
```tsx
<div className="bg-gray-200 dark:bg-gray-700 animate-pulse" />
```
- Shows while image is loading
- Prevents layout shift
- Provides visual feedback

## Backend Requirements

### Image Upload Endpoint
```
POST /api/upload/profile
POST /api/upload/cover
POST /api/posts (with FormData)
```

Response format:
```json
{
  "url": "/uploads/posts/image-123.jpg",
  "photoUrl": "/uploads/profile/avatar-456.jpg"
}
```

### Image Serving
- Images should be served from `/uploads/` path
- CORS headers should allow frontend domain
- Support for common image formats (jpg, png, gif, webp)

### CORS Configuration
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
  credentials: true
}));
```

## Testing Checklist

### Posts
- [ ] Upload post with single image - verify immediate loading
- [ ] Upload post with multiple images - verify all load
- [ ] Upload post with video - verify video plays
- [ ] View post on slow connection - verify skeleton shows
- [ ] View post with broken image URL - verify fallback shows

### Profile
- [ ] Upload profile picture - verify immediate update
- [ ] Upload cover photo - verify immediate update
- [ ] View profile with no picture - verify default avatar shows
- [ ] View profile on slow connection - verify skeleton shows
- [ ] Refresh page - verify images load from cache

### Stories
- [ ] Create story with image - verify immediate display
- [ ] Create story with video - verify video plays
- [ ] View story on slow connection - verify loading state
- [ ] View expired story - verify proper handling

### DeSnaps
- [ ] Create desnap with image - verify immediate display
- [ ] Create desnap with video - verify video plays
- [ ] View desnap on slow connection - verify loading state

## Troubleshooting

### Images Not Loading

1. **Check Backend URL**:
   ```typescript
   console.log(BACKEND_URL); // Should be correct Railway URL
   ```

2. **Check Image URL Format**:
   ```typescript
   console.log(ensureAbsoluteMediaUrl("/uploads/posts/image.jpg"));
   // Should output: https://demedia-backend-production.up.railway.app/uploads/posts/image.jpg
   ```

3. **Check CORS**:
   - Open browser console
   - Look for CORS errors
   - Verify backend CORS configuration

4. **Check Network Tab**:
   - Open DevTools Network tab
   - Filter by "Img"
   - Check if images are being requested
   - Check response status codes

### Slow Loading

1. **Enable Priority Loading**:
   ```tsx
   <MediaImage src={url} alt="..." priority={true} />
   ```

2. **Optimize Image Size**:
   - Backend should resize images
   - Recommended max: 1920px width
   - Use WebP format for better compression

3. **Use CDN**:
   - Consider using a CDN for image delivery
   - Reduces latency
   - Better caching

## Future Improvements

1. **Progressive Image Loading**:
   - Load low-quality placeholder first
   - Then load full-quality image

2. **Image Optimization**:
   - Automatic format conversion (WebP)
   - Responsive images (srcset)
   - Lazy loading with intersection observer

3. **Caching Strategy**:
   - Service worker caching
   - IndexedDB for offline support
   - Cache invalidation on update

4. **Performance Monitoring**:
   - Track image load times
   - Monitor failed loads
   - Analytics for optimization
