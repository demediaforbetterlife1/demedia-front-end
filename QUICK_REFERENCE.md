# Quick Reference Guide - Cache & Logo System

## 🚀 Quick Commands

### Build & Deploy
```bash
# Build for production (auto-updates version)
npm run build

# Test locally
npm run start

# Update version manually
node scripts/update-version.js
```

### Verify Implementation
```bash
# Check logo exists
dir demedia\public\assets\images\head.png

# Check version file
type demedia\public\version.json

# Check cache prevention in config
type demedia\next.config.mjs | findstr "Cache-Control"
```

## 📋 Quick Checklist

### Before Deployment
- [ ] Run `npm run build` successfully
- [ ] Verify `version.json` updated
- [ ] Test locally with `npm run start`
- [ ] Check logo appears in browser tab

### After Deployment
- [ ] Visit production URL
- [ ] Check logo in browser tab (head.png)
- [ ] Open DevTools → Network → Verify no-cache headers
- [ ] Check Console → Should see cache buster logs
- [ ] Wait 30 seconds → Version check should run

## 🔍 Quick Troubleshooting

### Logo Not Showing?
```bash
# 1. Verify file exists
dir demedia\public\assets\images\head.png

# 2. Hard refresh browser
Ctrl + Shift + R

# 3. Clear browser data
DevTools → Application → Clear storage
```

### Cache Still Present?
```bash
# 1. Check headers in Network tab
Should see: Cache-Control: no-store, no-cache

# 2. Verify middleware running
Check console for X-Timestamp header

# 3. Clear all site data
DevTools → Application → Clear storage → Clear site data
```

### Version Not Updating?
```bash
# 1. Run version script
node scripts/update-version.js

# 2. Check version.json
type demedia\public\version.json

# 3. Rebuild
npm run build
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Logo metadata & cache headers |
| `next.config.mjs` | Cache prevention config |
| `src/middleware.ts` | Runtime cache headers |
| `public/sw.js` | Service worker (no-cache) |
| `public/cache-buster.js` | Client-side cache clearing |
| `public/version.json` | Version tracking |
| `public/manifest.json` | PWA logo config |
| `scripts/update-version.js` | Auto version updater |

## 🎨 Logo Locations

Logo file: `demedia/public/assets/images/head.png`

Used in:
- Browser favicon
- Apple touch icon
- PWA manifest
- Open Graph images
- Twitter cards
- Push notifications

## 🚫 Cache Prevention Layers

1. **Next.js Config** - HTTP headers for all routes
2. **Middleware** - Runtime headers on every request
3. **Meta Tags** - HTML cache control tags
4. **Service Worker** - No-cache fetch mode
5. **Cache Buster** - Client-side cache clearing
6. **Version System** - Auto-update detection

## 📊 Expected Console Logs

On page load, you should see:
```
🧹 Cache Buster: Starting aggressive cache clearing...
🗑️ Deleted cache: [cache names]
✅ Cache Buster: Complete! All caches cleared.
📦 Current version: build-[timestamp]-[random]
```

On version update:
```
🔄 New version detected!
Current: build-[old-id]
New: build-[new-id]
🔄 Reloading to apply updates...
```

## 🔧 Configuration

### Adjust Version Check Interval
Edit `src/components/VersionUpdateNotification.tsx`:
```typescript
useVersionCheck(30000) // Check every 30 seconds
```

### Disable Auto-Reload on Update
Edit `src/hooks/useVersionCheck.ts`:
```typescript
// Comment out the auto-reload section
// setTimeout(() => {
//   window.location.reload();
// }, 2000);
```

### Change Logo
1. Replace `demedia/public/assets/images/head.png`
2. Run `npm run build`
3. Deploy

## ✅ Success Indicators

System is working when:
- ✅ Logo shows as head.png in browser tab
- ✅ Network requests have no-cache headers
- ✅ Console shows cache buster logs
- ✅ Version.json updates on each build
- ✅ Update notification appears on new deployment

## 📞 Quick Help

### Issue: Build Fails
```bash
# Clean and rebuild
rmdir /s /q .next
rmdir /s /q node_modules
npm install
npm run build
```

### Issue: Service Worker Not Working
```bash
# Check registration
DevTools → Application → Service Workers
# Should see: Status: activated and running
```

### Issue: Headers Not Applied
```bash
# Verify middleware
Check Network tab → Any request → Response Headers
Should include: Cache-Control, Pragma, Expires
```

## 🎯 One-Line Summary

**Cache Prevention**: Multi-layer system ensures users always get fresh content without manual cache clearing.

**Logo Update**: head.png used everywhere with version parameters to prevent caching.

---

**Quick Access**: Keep this file handy for fast reference during development and deployment.
