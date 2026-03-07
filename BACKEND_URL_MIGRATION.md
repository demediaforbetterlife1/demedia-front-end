# Backend URL Migration Guide

## Problem
The application was using hardcoded `https://demedia-backend.fly.dev` URLs throughout the codebase, but the backend has moved to Railway at `https://demedia-backend-production.up.railway.app`.

## Solution Implemented

### 1. Centralized Configuration
Created `/src/config/backend.ts` with:
- Single source of truth for BACKEND_URL
- Helper function to replace old URLs
- Uses environment variables with Railway URL as fallback

### 2. Updated Critical Files
The following files have been updated to use the centralized config:
- ✅ `src/utils/mediaUtils.ts` - Media URL handling
- ✅ `src/app/api/posts/[id]/route.ts` - Post operations
- ✅ `src/app/api/users/[id]/profile/route.ts` - User profile
- ✅ `src/app/api/user/[id]/profile/route.ts` - User profile (alternate)

### 3. Remaining Files to Update
Many API route files still have hardcoded fly.dev URLs. Search for `demedia-backend.fly.dev` and replace with:

```typescript
import { BACKEND_URL } from "@/config/backend";
// Then use ${BACKEND_URL} in fetch calls
```

Files that need updating:
- `src/app/api/posts/[id]/like/route.ts`
- `src/app/api/posts/[id]/bookmark/route.ts`
- `src/app/api/posts/[id]/comments/route.ts`
- `src/app/api/comments/[id]/route.ts`
- `src/app/api/messages/[chatId]/route.ts`
- `src/app/api/stories/[id]/route.ts`
- `src/app/api/user/[id]/route.ts`
- `src/app/api/user/[id]/follow/route.ts`
- `src/app/api/user/[id]/unfollow/route.ts`
- And many more...

## Critical: Database Migration Required

The frontend now correctly uses Railway URLs, but your **database still contains old fly.dev URLs**. You MUST run the database migration:

### Option 1: Via Neon Console (Recommended)
1. Go to your Neon dashboard
2. Open the SQL Editor
3. Run the SQL from `backend/quick-url-fix.sql`:

```sql
-- Update all fly.dev URLs to railway.app URLs
UPDATE "User" 
SET "profilePicture" = REPLACE("profilePicture", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "profilePicture" LIKE '%demedia-backend.fly.dev%';

UPDATE "User" 
SET "coverPhoto" = REPLACE("coverPhoto", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "coverPhoto" LIKE '%demedia-backend.fly.dev%';

UPDATE "Post" 
SET "imageUrl" = REPLACE("imageUrl", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "imageUrl" LIKE '%demedia-backend.fly.dev%';

UPDATE "Post" 
SET "videoUrl" = REPLACE("videoUrl", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "videoUrl" LIKE '%demedia-backend.fly.dev%';

UPDATE "DeSnap" 
SET "content" = REPLACE("content", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "content" LIKE '%demedia-backend.fly.dev%';

UPDATE "DeSnap" 
SET "thumbnail" = REPLACE("thumbnail", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "thumbnail" LIKE '%demedia-backend.fly.dev%';

UPDATE "Story" 
SET "imageUrl" = REPLACE("imageUrl", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "imageUrl" LIKE '%demedia-backend.fly.dev%';

UPDATE "Story" 
SET "videoUrl" = REPLACE("videoUrl", 'https://demedia-backend.fly.dev', 'https://demedia-backend-production.up.railway.app')
WHERE "videoUrl" LIKE '%demedia-backend.fly.dev%';
```

### Option 2: Via Migration Script
If you fix the `channel_binding` issue in your DATABASE_URL:
```bash
cd backend
node migrate-urls-fixed.js
```

## Environment Variables

Make sure these are set in your deployment:

### Vercel (Frontend)
```
NEXT_PUBLIC_BACKEND_URL=https://demedia-backend-production.up.railway.app
BACKEND_URL=https://demedia-backend-production.up.railway.app
```

### Railway (Backend)
```
DATABASE_URL=your-neon-connection-string
```

## Testing

After migration:
1. Clear browser cache
2. Test image uploads
3. Test profile pictures
4. Test post images
5. Test desnaps videos
6. Check console for any remaining fly.dev references

## Status

- ✅ Centralized configuration created
- ✅ Critical API routes updated
- ✅ Media utilities updated
- ⚠️ Many API routes still need updating
- ❌ Database migration NOT YET RUN (CRITICAL!)

## Next Steps

1. **CRITICAL**: Run database migration via Neon console
2. Update remaining API route files
3. Test all media functionality
4. Monitor for any 503 errors
