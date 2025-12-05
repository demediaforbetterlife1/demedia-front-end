# 🔍 Debug: Photos Not Showing

## Step 1: Check Browser Console

Open your browser console (F12) and look for these messages:

### When Creating a Post:
Look for:
```
📸 Storing image locally: [filename]
✅ Stored photo [photo-id]
```

### When Viewing Posts:
Look for:
```
📸 Loading local photo: [photo-id]
✅ Local photo loaded: [photo-id]
```

## Step 2: Check What's Happening

### Scenario A: Old Posts (Before Frontend Storage)
**Problem**: Old posts have backend URLs like `https://backend.com/uploads/photo.jpg`
**Solution**: These won't work if backend is down. You need to create NEW posts with photos.

### Scenario B: New Posts Not Storing
**Problem**: Photos not being stored in browser
**Check**: 
1. Open DevTools → Application → IndexedDB
2. Look for `demedia-photos` database
3. Is it there? Are photos being stored?

### Scenario C: Photos Stored But Not Displaying
**Problem**: Photos in storage but not showing
**Check**: Console for errors when loading photos

## Step 3: Quick Test

### Test 1: Create a New Post
1. Click "Create Post"
2. Add a photo
3. Check console - do you see "📸 Storing image locally"?
4. Create the post
5. Do you see "✅ Stored photo"?

### Test 2: Check Storage
1. Open DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB
4. Look for `demedia-photos`
5. Click on `photos` store
6. Do you see your photo?

### Test 3: Check Post Data
1. Open DevTools → Network tab
2. Find the request to `/api/posts`
3. Look at the response
4. Check `imageUrls` - does it have `local-photo://` prefix?

## Common Issues

### Issue 1: Using Old Posts
**Symptom**: Post has `https://backend.com/uploads/...` URL
**Fix**: Create a NEW post with a photo

### Issue 2: Storage Not Initialized
**Symptom**: No `demedia-photos` in IndexedDB
**Fix**: Refresh page, check console for initialization errors

### Issue 3: Import Error
**Symptom**: Console shows "Cannot find module '@/services/storage'"
**Fix**: Need to rebuild the app

### Issue 4: Photo ID Not Matching
**Symptom**: Console shows "Photo not found"
**Fix**: Check if photo ID in post matches ID in storage

## Next Steps

Please check your console and tell me:
1. What messages do you see when creating a post?
2. What messages do you see when viewing posts?
3. Do you see any red errors?
4. Is `demedia-photos` database in IndexedDB?
5. Are you trying to view OLD posts or NEW posts?
