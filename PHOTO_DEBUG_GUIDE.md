# 🔧 Photo Not Showing - Complete Debug Guide

## 🎯 Quick Diagnosis

### Are you trying to view OLD posts or NEW posts?

**OLD POSTS** (created before today):
- ❌ Will NOT work - they have backend URLs
- ✅ Solution: Create a NEW post with a photo

**NEW POSTS** (created after implementing frontend storage):
- ✅ Should work - they have `local-photo://` URLs
- ❌ If not working, follow steps below

## 📋 Step-by-Step Debugging

### Step 1: Open Test Page

1. Open `demedia/TEST_PHOTO_STORAGE.html` in your browser
2. Click "Check IndexedDB" button
3. **Expected**: ✅ IndexedDB is supported
4. **If you see ❌**: Your browser doesn't support IndexedDB

### Step 2: Test Photo Upload

1. In test page, click "Choose File" and select a photo
2. Click "Upload & Store Photo"
3. **Expected**: 
   ```
   ✅ Photo stored successfully with ID: [uuid]
   🔗 Local URL: local-photo://[uuid]
   ```
4. **If you see ❌**: Check console for errors

### Step 3: List Stored Photos

1. Click "List All Photos" button
2. **Expected**: Shows list of photos with IDs
3. **If empty**: No photos are being stored

### Step 4: Display Photos

1. Click "Display All Photos" button
2. **Expected**: Photos appear on page
3. **If no photos**: Storage is working but retrieval is failing

### Step 5: Test in Your App

1. Go to your DeMedia app
2. Open browser console (F12)
3. Click "Create Post"
4. Add a photo
5. **Watch console for these messages**:

**Expected messages when uploading:**
```
📦 AddPostModal: Starting to store 1 images locally
✅ AddPostModal: Storage service initialized
📸 AddPostModal: Storing image locally: photo.jpg Size: 123456
✅ AddPostModal: Image stored locally with ID: abc-123-def
✅ AddPostModal: Local photo URL: local-photo://abc-123-def
✅ AddPostModal: All images stored. URLs: ["local-photo://abc-123-def"]
```

**Expected messages when viewing:**
```
🔍 LocalPhotoImage: Resolving src: local-photo://abc-123-def
📸 LocalPhotoImage: Loading local photo: abc-123-def
✅ LocalPhotoImage: Storage initialized
✅ LocalPhotoImage: Local photo loaded: abc-123-def blob:http://...
```

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module '@/services/storage'"

**Problem**: App not rebuilt after adding new files

**Solution**:
```bash
cd demedia
npm run dev
```
Then refresh browser

### Issue 2: No console messages at all

**Problem**: Code not being executed

**Solution**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Restart dev server

### Issue 3: "Storage service not initialized"

**Problem**: Storage initialization failing

**Solution**:
1. Check if IndexedDB is supported (use test page)
2. Check browser console for errors
3. Try in Incognito mode

### Issue 4: Photos stored but not displaying

**Problem**: Photo ID mismatch or retrieval error

**Solution**:
1. Open DevTools → Application → IndexedDB → demedia-photos
2. Check if photo ID in `metadata` store matches ID in post
3. Check if photo data exists in `photos` store

### Issue 5: Old posts showing placeholder

**Problem**: Old posts have backend URLs, not local URLs

**Solution**:
- This is EXPECTED behavior
- Old posts won't work with frontend storage
- Create NEW posts to test

## 🔍 Manual Inspection

### Check IndexedDB Directly

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB**
4. Click **demedia-photos**
5. Check both stores:
   - **photos**: Should have blob data
   - **metadata**: Should have photo info

### Check Post Data

1. Open DevTools → Network tab
2. Create a new post with photo
3. Find the POST request to `/api/posts`
4. Look at **Request Payload**
5. Check `imageUrls` array:
   ```json
   {
     "imageUrls": ["local-photo://abc-123-def"]
   }
   ```

### Check Photo Retrieval

1. View a post with photo
2. Open DevTools → Console
3. Look for LocalPhotoImage messages
4. Should see blob URL being created

## 📊 What Should Happen

### Creating Post with Photo:

1. User selects photo
2. Photo stored in IndexedDB
3. Returns ID like `abc-123-def`
4. Post created with `local-photo://abc-123-def`
5. Post saved to backend with this URL

### Viewing Post with Photo:

1. Post loads with `local-photo://abc-123-def`
2. LocalPhotoImage component detects prefix
3. Extracts ID: `abc-123-def`
4. Retrieves photo from IndexedDB
5. Creates blob URL: `blob:http://localhost:3000/abc-123`
6. Displays image

## 🚨 Red Flags

### ❌ Bad Signs:
- No console messages at all
- "Cannot find module" errors
- IndexedDB not supported
- Empty `demedia-photos` database
- Post has backend URL instead of `local-photo://`

### ✅ Good Signs:
- Console shows storage messages
- `demedia-photos` database exists
- Photos visible in IndexedDB
- Post has `local-photo://` URL
- Blob URLs being created

## 💡 Quick Fixes

### Fix 1: Restart Everything
```bash
# Stop dev server (Ctrl+C)
cd demedia
npm run dev
# Hard refresh browser (Ctrl+Shift+R)
```

### Fix 2: Clear Everything
```bash
# In browser console:
indexedDB.deleteDatabase('demedia-photos');
localStorage.clear();
# Then refresh page
```

### Fix 3: Test in Incognito
- Opens fresh session
- No cache or old data
- Clean slate for testing

## 📞 What to Report

If still not working, please provide:

1. **Console messages** when creating post
2. **Console messages** when viewing post
3. **Screenshot** of IndexedDB (Application tab)
4. **Network tab** screenshot of POST request
5. **Are you testing with NEW or OLD posts?**
6. **Browser and version** (Chrome 120, Firefox 121, etc.)

## 🎯 Expected Behavior

**When working correctly:**
1. Create post with photo → Instant upload (no backend delay)
2. Photo appears in post immediately
3. Refresh page → Photo still there
4. Check IndexedDB → Photo data visible
5. Console → All ✅ messages, no ❌ errors

If you're not seeing this, follow the steps above to diagnose the issue!
