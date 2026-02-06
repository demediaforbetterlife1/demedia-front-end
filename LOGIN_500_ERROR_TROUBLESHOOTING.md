# Login 500 Error - Troubleshooting Guide

## Error Summary
```
POST https://de-media.vercel.app/api/auth/login 500 (Internal Server Error)
[Auth] login failed: Login failed. Please try again. Status: 500
```

## Root Cause
The login API endpoint is returning a 500 Internal Server Error from the backend server. This is **NOT** related to the caching changes we made.

## Issues Identified

### 1. Backend Server Error (Primary Issue)
The backend at `https://demedia-backend.fly.dev` is returning a 500 error when processing login requests.

**Possible Causes:**
- Database connection issues
- Backend server is down or restarting
- Environment variables not set correctly
- JWT secret missing or incorrect
- Database query failing
- Backend code error

### 2. WebGL Context Lost (Secondary Issue)
```
THREE.WebGLRenderer: Context Lost
```
This indicates the 3D animations (AnimatedStars, GlowingPlanets, GoldParticles) are consuming too much GPU memory.

## Solutions

### Solution 1: Check Backend Server Status

1. **Verify Backend is Running**
   ```bash
   curl https://demedia-backend.fly.dev/api/health
   ```

2. **Check Backend Logs**
   - Go to Fly.io dashboard
   - Check logs for the demedia-backend app
   - Look for error messages around the time of login attempt

3. **Common Backend Issues:**
   - Database connection string incorrect
   - JWT_SECRET not set in environment variables
   - Database tables not created
   - CORS issues

### Solution 2: Fix Backend Environment Variables

Check that these are set in your backend:
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=3000
```

### Solution 3: Reduce WebGL Load

The WebGL context loss suggests too many 3D effects. You have 3 WebGL components running:
- AnimatedStars
- GlowingPlanets  
- GoldParticles

**Option A: Disable Some Effects**

Edit `demedia/src/app/layout.tsx`:
```tsx
<AuthGuard>
  <WebGLErrorHandler />
  {/* <AnimatedStars /> */}  {/* Disable this */}
  {/* <GlowingPlanets /> */}  {/* Disable this */}
  <GoldParticles />  {/* Keep only one */}
  <NavbarClient />
  {children}
</AuthGuard>
```

**Option B: Make Effects Conditional**
Only show effects on desktop, not mobile:
```tsx
{typeof window !== 'undefined' && window.innerWidth > 768 && (
  <>
    <AnimatedStars />
    <GlowingPlanets />
    <GoldParticles />
  </>
)}
```

### Solution 4: Check API Proxy Configuration

Verify the API is being proxied correctly in `next.config.mjs`:
```javascript
async rewrites() {
  const target = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";
  return [
    {
      source: "/api/:path*",
      destination: `${target}/api/:path*`,
    },
  ];
}
```

### Solution 5: Test Backend Directly

Try logging in directly to the backend:
```bash
curl -X POST https://demedia-backend.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'
```

If this fails, the issue is definitely in the backend.

## Quick Fixes

### Fix 1: Restart Backend Server
```bash
fly restart -a demedia-backend
```

### Fix 2: Check Backend Database Connection
```bash
fly ssh console -a demedia-backend
# Then inside the container:
node -e "console.log(process.env.DATABASE_URL)"
```

### Fix 3: Disable WebGL Effects Temporarily

Edit `demedia/src/app/layout.tsx`:
```tsx
{/* Temporarily disable WebGL effects */}
{/* <WebGLErrorHandler /> */}
{/* <AnimatedStars /> */}
{/* <GlowingPlanets /> */}
{/* <GoldParticles /> */}
```

## Debugging Steps

1. **Check Browser Console**
   - Look for more detailed error messages
   - Check Network tab for the exact request/response

2. **Check Backend Logs**
   ```bash
   fly logs -a demedia-backend
   ```

3. **Test Backend Health**
   ```bash
   curl https://demedia-backend.fly.dev/api/health
   ```

4. **Check Database Connection**
   - Verify database is accessible
   - Check connection string is correct
   - Ensure database tables exist

## Expected Backend Response

A successful login should return:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

A 500 error means the backend code crashed or encountered an error.

## Common Backend Errors

### Error 1: Database Connection Failed
```
Error: connect ECONNREFUSED
```
**Fix**: Check DATABASE_URL environment variable

### Error 2: JWT Secret Missing
```
Error: secretOrPrivateKey must have a value
```
**Fix**: Set JWT_SECRET environment variable

### Error 3: User Not Found
```
Error: User not found
```
**Fix**: This should return 401, not 500. Backend code needs fixing.

### Error 4: Password Comparison Failed
```
Error: bcrypt compare failed
```
**Fix**: Check bcrypt is installed and password hashing is correct

## Next Steps

1. **Check backend logs** - This will show the exact error
2. **Verify environment variables** - Ensure all required vars are set
3. **Test backend directly** - Use curl to test the endpoint
4. **Disable WebGL effects** - Reduce GPU load
5. **Check database** - Ensure it's accessible and has data

## Related Files

- Backend: `backend/src/routes/auth.js` (or similar)
- Frontend API: Proxied through Next.js rewrites
- Auth Context: `demedia/src/contexts/AuthContext.tsx`
- Layout: `demedia/src/app/layout.tsx`

## Status

- **Frontend**: ✅ Working correctly (making the request)
- **Backend**: ❌ Returning 500 error (needs investigation)
- **WebGL**: ⚠️ Context lost (too many effects)

---

**Priority**: HIGH - Users cannot log in
**Impact**: Critical - Blocks all authenticated features
**Next Action**: Check backend logs and fix the 500 error
