# Backend 500 Error - Complete Fix Guide

## The Problem

Your backend at `https://demedia-backend.fly.dev` is returning a **500 Internal Server Error** when you try to log in. This is **NOT a frontend issue** - the frontend is working correctly and forwarding the request properly.

## What I've Done

1. ✅ Added detailed logging to the API proxy
2. ✅ Enhanced error messages
3. ✅ Verified frontend is working correctly

## What You Need to Do

### Step 1: Check Backend Logs (MOST IMPORTANT)

```bash
# View real-time backend logs
fly logs -a demedia-backend --tail

# Then try to log in and watch the logs
```

The logs will show you the **exact error** that's causing the 500 response.

### Step 2: Common Backend Issues & Fixes

#### Issue 1: Database Connection Failed
**Error in logs**: `Error: connect ECONNREFUSED` or `ENOTFOUND`

**Fix**:
```bash
# Check DATABASE_URL is set
fly secrets list -a demedia-backend

# If not set or wrong, update it
fly secrets set DATABASE_URL="your_database_url" -a demedia-backend
```

#### Issue 2: JWT Secret Missing
**Error in logs**: `Error: secretOrPrivateKey must have a value`

**Fix**:
```bash
# Set JWT_SECRET
fly secrets set JWT_SECRET="your-super-secret-key-here" -a demedia-backend
```

#### Issue 3: Backend Code Error
**Error in logs**: `TypeError`, `ReferenceError`, `SyntaxError`

**Fix**: You need to fix the backend code and redeploy

#### Issue 4: Database Tables Don't Exist
**Error in logs**: `relation "users" does not exist`

**Fix**:
```bash
# Run database migrations
fly ssh console -a demedia-backend
npm run migrate
# or
npx prisma migrate deploy
```

### Step 3: Test Backend Directly

```bash
# Test if backend is reachable
curl https://demedia-backend.fly.dev/api/health

# Test login endpoint directly
curl -X POST https://demedia-backend.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -v
```

If this returns 500, the problem is definitely in the backend code.

### Step 4: Check Backend Environment

```bash
# SSH into backend
fly ssh console -a demedia-backend

# Check environment variables
env | grep -E "DATABASE_URL|JWT_SECRET|NODE_ENV"

# Check if backend is running
ps aux | grep node

# Check backend logs
tail -f /var/log/*.log
```

### Step 5: Restart Backend

Sometimes a simple restart fixes temporary issues:

```bash
fly restart -a demedia-backend
```

### Step 6: Redeploy Backend

If code was updated but not deployed:

```bash
cd backend
fly deploy
```

## Expected Backend Response

A working login should return:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "username": "username"
  }
}
```

## Frontend Changes I Made

I've enhanced the proxy to provide better error messages. Now when the backend returns an error, you'll see:

```json
{
  "error": "Backend error",
  "status": 500,
  "details": "actual error from backend",
  "message": "Backend returned 500. Check backend logs for details."
}
```

## Debugging Checklist

- [ ] Check backend logs (`fly logs -a demedia-backend --tail`)
- [ ] Verify DATABASE_URL is set correctly
- [ ] Verify JWT_SECRET is set
- [ ] Test backend directly with curl
- [ ] Check database is accessible
- [ ] Verify database tables exist
- [ ] Check backend is running (`fly status -a demedia-backend`)
- [ ] Try restarting backend
- [ ] Check for recent code changes that might have broken it

## Common Fixes

### Fix 1: Reset All Secrets
```bash
fly secrets set \
  DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  JWT_SECRET="your-secret-key" \
  NODE_ENV="production" \
  -a demedia-backend
```

### Fix 2: Rebuild and Redeploy
```bash
cd backend
fly deploy --no-cache
```

### Fix 3: Check Database Connection
```bash
fly ssh console -a demedia-backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected!')).catch(e => console.error(e));"
```

## What's NOT the Problem

- ❌ Frontend code (it's working correctly)
- ❌ API proxy (it's forwarding requests properly)
- ❌ Caching (we've disabled it for API routes)
- ❌ CORS (headers are being forwarded)

## What IS the Problem

- ✅ Backend server code has an error
- ✅ Backend environment variables are missing/wrong
- ✅ Backend database connection is failing
- ✅ Backend is down or crashed

## Next Steps

1. **Run**: `fly logs -a demedia-backend --tail`
2. **Try to log in** and watch the logs
3. **Find the error** in the logs
4. **Fix the specific error** based on what you see
5. **Restart or redeploy** the backend

The logs will tell you exactly what's wrong. Without access to the backend logs, I cannot fix this issue from the frontend.

---

**Priority**: CRITICAL - Users cannot log in
**Location**: Backend server (not frontend)
**Action Required**: Check backend logs and fix the error shown there
