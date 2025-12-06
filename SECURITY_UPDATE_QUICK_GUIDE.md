# 🔒 Quick Security Update Guide

## ⚠️ URGENT: Next.js Security Vulnerability

Your Next.js version has a security vulnerability (CVE-2025-66478).

## ✅ Fix Already Applied

I've updated your `package.json` to use Next.js 15.5.1+ (patched version).

## 🚀 What You Need to Do (3 Steps)

### Step 1: Install Updates (2 minutes)

```bash
cd demedia
npm install
```

This installs the patched Next.js version.

### Step 2: Test Locally (2 minutes)

```bash
npm run dev
```

Open http://localhost:3000 and verify everything works.

### Step 3: Deploy (1 minute)

```bash
git add package.json
git commit -m "Security: Update Next.js to 15.5.1+"
git push
```

Vercel will automatically deploy the secure version.

## ✅ That's It!

Total time: ~5 minutes

Your app will be secure and the photo fix will continue working perfectly.

---

## 📋 Verification Checklist

After completing the steps above:

- [ ] Ran `npm install` successfully
- [ ] Tested locally with `npm run dev`
- [ ] App loads without errors
- [ ] Photo upload still works
- [ ] Committed and pushed changes
- [ ] Vercel deployed successfully

---

## 🆘 If You Have Issues

### Issue: npm install fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build fails on Vercel

**Solution:** Check the Vercel build logs. The update should not cause build failures.

### Issue: Photos stop working

**Solution:** This update doesn't affect the photo fix. If photos stop working, it's unrelated to this security update.

---

## 📚 More Details

See [NEXTJS_SECURITY_UPDATE.md](./NEXTJS_SECURITY_UPDATE.md) for complete information.

---

**Priority:** 🔴 HIGH  
**Time Required:** ~5 minutes  
**Risk:** ✅ Low (patch release, no breaking changes)
