# Like System Fix

## Problem
The like system had multiple issues:
1. Random like counts (1575, 23, etc.) appearing when liking posts
2. Likes not being saved properly
3. Like count getting corrupted

## Root Causes

### 1. Random Fallback Values
The like API route (`src/app/api/posts/[id]/like/route.ts`) had a fallback that returned random numbers:
```typescript
likes: Math.floor(Math.random() * 100) + 1,  // ❌ WRONG!
```

This was triggered when the backend was unavailable, causing random like counts.

### 2. No Error Handling
The frontend didn't properly handle API errors, so when the backend failed, it would still update the UI with whatever data came back (including the random numbers).

### 3. Race Conditions
Multiple rapid clicks could trigger multiple simultaneous API requests, causing the like count to increment multiple times.

### 4. Backend URL Issue
The API was still using the old fly.dev URL which is down (503 errors), so it was always falling back to the random number generator.

## Solutions Implemented

### 1. Fixed API Route
- ✅ Removed random number fallback
- ✅ Updated to use Railway backend URL via centralized config
- ✅ Return proper error responses (503) when backend is unavailable
- ✅ No more fake/random data

### 2. Improved Frontend Error Handling
- ✅ Store previous state before optimistic update
- ✅ Revert to previous state if API call fails
- ✅ Validate response data before applying it
- ✅ Only update if response contains valid numbers

### 3. Prevent Race Conditions
- ✅ Added `likingPosts` Set to track posts being liked
- ✅ Prevent multiple simultaneous requests for the same post
- ✅ Clean up tracking state in finally block

### 4. Better State Management
```typescript
// Before: No validation
likes: data.likes ?? p.likes

// After: Validate it's a number
likes: typeof data.likes === 'number' ? data.likes : p.likes
```

## Files Modified

1. `src/app/api/posts/[id]/like/route.ts`
   - Removed random fallback
   - Updated to use BACKEND_URL from config
   - Return 503 errors instead of fake data

2. `src/app/(PagesComps)/homedir/posts.tsx`
   - Added likingPosts state to prevent race conditions
   - Improved error handling with state reversion
   - Added data validation before applying updates

## Testing

After these fixes:
1. ✅ Likes should increment by exactly 1
2. ✅ Likes should decrement by exactly 1 when unliking
3. ✅ Multiple rapid clicks should be ignored
4. ✅ If backend fails, UI reverts to previous state
5. ✅ No more random numbers

## Important Note

The backend MUST be accessible for likes to work. If you're still seeing issues:

1. Check that Railway backend is running
2. Run the database URL migration (see BACKEND_URL_MIGRATION.md)
3. Check browser console for 503 errors
4. Verify BACKEND_URL environment variable is set correctly

## Next Steps

1. Run database migration to fix URLs
2. Test like functionality
3. Monitor for any remaining issues
