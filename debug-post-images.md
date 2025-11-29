# Debug Guide: Post Images Not Appearing

## What I Fixed

### 1. Added Image URL Debugging
- Added console logs in `posts.tsx` to show what image data is coming from the backend
- Added console logs in `postUtils.ts` to show how images are being normalized
- The `MediaImage` component already has good debugging built-in

### 2. Ensured Image Arrays Are Preserved
- Updated the post normalization to include both `imageUrls` and `images` arrays
- Made sure the backend response is properly mapped to the frontend

## How to Debug

### Step 1: Open Browser Console
1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Refresh the page

### Step 2: Look for These Logs
When posts load, you should see:
```
📸 Post image data: { id: X, imageUrl: "...", imageUrls: [...], images: [...], hasImages: true/false }
```

### Step 3: Check What the Backend Returns
Look for logs like:
```
normalizePost - images found: { postId: X, imageUrls: [...], imagesFromPost: [...] }
normalizePost - normalizing image: "/uploads/..." -> "https://demedia-backend.fly.dev/uploads/..."
```

### Step 4: Check MediaImage Component
Look for logs like:
```
MediaImage (Post image): Normalized URL: { original: "...", normalized: "..." }
MediaImage (Post image): Successfully loaded: "..."
```

## Common Issues and Solutions

### Issue 1: Images are `null` or empty array
**Problem**: Backend isn't returning image URLs
**Solution**: Check the backend `/api/posts` endpoint to ensure it's including `imageUrls` or `imageUrl` fields

### Issue 2: Images are relative paths like `/uploads/...`
**Problem**: Frontend needs to convert them to absolute URLs
**Solution**: The `ensureAbsoluteMediaUrl` function should handle this automatically by prepending `https://demedia-backend.fly.dev`

### Issue 3: Images fail to load (404 error)
**Problem**: The image URL is incorrect or the file doesn't exist on the backend
**Solution**: 
- Check the Network tab in browser dev tools
- Look for failed image requests
- Verify the image was actually uploaded to the backend

### Issue 4: Images show placeholder instead
**Problem**: The URL is being treated as invalid
**Solution**: Check the console for warnings from `MediaImage` component

## Quick Fix: Force Absolute URLs

If images are stored as relative paths in the database, you can force them to be absolute by updating `ensureAbsoluteMediaUrl` in `mediaUtils.ts`:

```typescript
export function ensureAbsoluteMediaUrl(url?: string | null): string | null {
  if (!isValidUrl(url)) {
    return null;
  }

  const cleanUrl = url!.trim();

  // Already absolute
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  // Data URLs
  if (cleanUrl.startsWith("data:")) {
    return cleanUrl;
  }

  // Local uploads (served by Next.js)
  if (cleanUrl.startsWith("/local-uploads")) {
    return cleanUrl;
  }

  // Everything else gets the backend URL prepended
  const normalized = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  return `${BACKEND_URL}${normalized}`;
}
```

## What to Share for Help

If images still don't appear, share:
1. Console logs showing the post data
2. Network tab showing image request URLs and their status codes
3. The actual image URL from the database (check backend logs)
