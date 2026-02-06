# DeMEDIA Deployment Checklist

## Pre-Deployment

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console errors in development
- [ ] All tests passing (if applicable)

### 2. Environment Variables
- [ ] `.env.local` configured correctly
- [ ] `NEXT_PUBLIC_SITE_URL` set to production URL
- [ ] `BACKEND_URL` pointing to production backend
- [ ] All API keys and secrets configured

### 3. Build Verification
```bash
# Run these commands before deploying
npm run build
npm run start
```
- [ ] Build completes without errors
- [ ] Application starts successfully
- [ ] No runtime errors in production mode

### 4. Cache & Logo Verification
- [ ] `head.png` exists in `/public/assets/images/`
- [ ] `version.json` updated with latest build info
- [ ] Cache prevention headers configured
- [ ] Service worker registered correctly

## Deployment Steps

### Step 1: Update Version
```bash
node scripts/update-version.js
```
Expected output:
```
✅ Version file updated
📦 Build ID: build-[timestamp]-[random]
🕐 Build Time: [ISO timestamp]
🎨 Logo: /assets/images/head.png
```

### Step 2: Build Application
```bash
npm run build
```
This will:
- Run prebuild script (updates version)
- Build Next.js application
- Run postbuild script (confirms version)
- Generate unique build ID

### Step 3: Test Production Build Locally
```bash
npm run start
```
- [ ] Open http://localhost:3000
- [ ] Verify logo appears (head.png)
- [ ] Check Network tab for no-cache headers
- [ ] Verify console shows cache buster logs
- [ ] Test key features work correctly

### Step 4: Deploy to Platform

#### For Vercel:
```bash
vercel --prod
```

#### For Other Platforms:
```bash
# Follow platform-specific deployment commands
# Ensure environment variables are set
```

### Step 5: Post-Deployment Verification
- [ ] Visit production URL
- [ ] Check browser tab shows head.png logo
- [ ] Open DevTools → Network tab
- [ ] Verify Response Headers include:
  - `Cache-Control: no-store, no-cache, must-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`
- [ ] Check Console for cache buster logs
- [ ] Verify version update notification works

## Post-Deployment Testing

### 1. Logo Verification
- [ ] Browser favicon shows head.png
- [ ] PWA install uses head.png
- [ ] Open Graph preview shows head.png
- [ ] Push notifications use head.png

### 2. Cache Prevention Testing
```
Test Steps:
1. Visit site in incognito/private window
2. Open DevTools → Network
3. Check all requests have no-cache headers
4. Refresh page (Ctrl+Shift+R)
5. Verify fresh content loads
6. Check console for cache buster logs
```

### 3. Update Detection Testing
```
Test Steps:
1. Make a small change to any file
2. Build and deploy
3. Wait 30 seconds on production site
4. Should see "Update Available!" notification
5. Page should auto-reload with new version
```

### 4. Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if applicable)
- [ ] Mobile browsers

### 5. Performance Check
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] All images load correctly
- [ ] API calls working

## Rollback Plan

If issues occur after deployment:

### Quick Rollback
```bash
# Revert to previous deployment
vercel rollback
```

### Manual Rollback
1. Checkout previous commit
2. Run build and deploy
3. Verify functionality

## Monitoring

### After Deployment, Monitor:
- [ ] Server logs for errors
- [ ] User reports of issues
- [ ] Analytics for traffic patterns
- [ ] Performance metrics

### Check These URLs:
- [ ] Homepage: `/`
- [ ] Sign In: `/sign-in`
- [ ] Sign Up: `/sign-up`
- [ ] Home Feed: `/home`
- [ ] Profile: `/profile`
- [ ] DeSnaps: `/desnaps`
- [ ] Messaging: `/messeging`

## Common Issues & Solutions

### Issue: Logo Not Showing
**Solution:**
1. Verify file exists: `dir public\assets\images\head.png`
2. Check browser console for 404 errors
3. Clear browser cache manually
4. Hard refresh (Ctrl+Shift+R)

### Issue: Cache Still Present
**Solution:**
1. Check middleware is deployed
2. Verify Next.js config headers
3. Check service worker status
4. Clear all site data in browser

### Issue: Version Check Not Working
**Solution:**
1. Verify `version.json` is accessible
2. Check console for fetch errors
3. Ensure version hook is imported
4. Check network tab for version.json requests

### Issue: Build Fails
**Solution:**
1. Check Node.js version (should be 18+)
2. Delete `node_modules` and `.next`
3. Run `npm install`
4. Try build again

## Success Criteria

Deployment is successful when:
- ✅ Application loads without errors
- ✅ Logo displays as head.png everywhere
- ✅ No-cache headers present on all requests
- ✅ Cache buster runs on every page load
- ✅ Version update detection works
- ✅ All features function correctly
- ✅ No console errors
- ✅ Performance is acceptable

## Emergency Contacts

- **Backend Issues**: Check backend logs at backend URL
- **Frontend Issues**: Check Vercel/hosting platform logs
- **Database Issues**: Check database connection status

## Documentation

After successful deployment, update:
- [ ] README.md with new features
- [ ] CHANGELOG.md with version info
- [ ] API documentation if changed
- [ ] User documentation if needed

---

**Last Updated**: February 6, 2026
**Current Version**: 1.0.1
**Deployment Status**: Ready for Production
