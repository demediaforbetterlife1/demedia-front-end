# Authentication & Routing Fix

## Issues Fixed

### 1. ✅ "Failed to fetch" Error
**Problem:** Frontend couldn't reach backend API, showing "Failed to fetch" error.

**Root Cause:** 
- `AuthContext.tsx` was using relative URLs (`/api/auth/signup`) instead of full backend URLs
- `api.ts` had `API_BASE = ""` which tried to use same-origin requests

**Fix:**
- Updated `AuthContext.tsx` `apiFetch` function to use `NEXT_PUBLIC_API_URL`
- Updated `api.ts` to use backend URL from environment variable
- Added proper error handling for network issues

**Files Modified:**
- `demedia/src/contexts/AuthContext.tsx`
- `demedia/src/lib/api.ts`

### 2. ✅ Authentication Flow
**Problem:** User registration wasn't redirecting properly through the setup flow.

**Fix:** Implemented proper routing flow:
1. **Sign Up** → User registers → Redirected to `/SignInSetUp`
2. **SignInSetUp** → User enters birthdate → Redirected to `/interests`
3. **Interests** → User selects interests → Redirected to `/FinishSetup`
4. **FinishSetup** → Setup marked complete → Redirected to `/home`

**How It Works:**
- `AuthGuard.tsx` handles all routing logic based on authentication state
- After successful registration, `AuthGuard` automatically redirects to `/SignInSetUp`
- Each page saves data to backend before redirecting to next page
- `isSetupComplete` flag controls access to protected routes

### 3. ✅ Data Persistence
**Problem:** User data wasn't being saved properly during setup flow.

**Fix:**
- **SignInSetUp**: Saves birthdate via `/api/auth/complete-setup` with `dob` parameter
- **Interests**: Saves interests via `/api/users/:userId/interests`
- **FinishSetup**: Marks setup complete via `/api/auth/complete-setup` without parameters

All data is saved to database before proceeding to next step.

### 4. ✅ Login Flow
**Problem:** Users couldn't login after registration.

**Fix:**
- Login endpoint properly authenticates users
- Token stored in both cookie and localStorage
- User redirected based on `isSetupComplete` status:
  - If setup incomplete → `/SignInSetUp`
  - If setup complete → `/home`

## Setup Flow Diagram

```
┌─────────────┐
│   Sign Up   │
│  (Register) │
└──────┬──────┘
       │ Creates user account
       │ Stores token
       ↓
┌─────────────┐
│ SignInSetUp │
│  (Birthday) │
└──────┬──────┘
       │ Saves dateOfBirth
       │ isSetupComplete = false
       ↓
┌─────────────┐
│  Interests  │
│  (Select)   │
└──────┬──────┘
       │ Saves interests array
       │ isSetupComplete = false
       ↓
┌─────────────┐
│ FinishSetup │
│ (Complete)  │
└──────┬──────┘
       │ Sets isSetupComplete = true
       ↓
┌─────────────┐
│    Home     │
│  (App Main) │
└─────────────┘
```

## Environment Variables

### Required in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### For Development:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## API Endpoints Used

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/complete-setup` - Save birthdate or mark setup complete

### User Data
- `POST /api/users/:userId/interests` - Save user interests

## Testing the Fix

### 1. Test Registration Flow
```bash
# Open browser to your frontend URL
# Navigate to /sign-up
# Fill in the form:
- Name: Test User
- Username: testuser123
- Phone: +1234567890
- Password: Test123!

# Click "Sign Up"
# Should redirect to /SignInSetUp automatically
```

### 2. Test SignInSetUp
```bash
# Select birthdate (day, month, year)
# Click "Save & Continue"
# Should save to database and redirect to /interests
```

### 3. Test Interests
```bash
# Select at least one interest
# Click "Continue"
# Should save to database and redirect to /FinishSetup
```

### 4. Test FinishSetup
```bash
# Click "Join Our Community!"
# Should mark setup complete and redirect to /home
```

### 5. Test Login
```bash
# Logout (if logged in)
# Navigate to /sign-in
# Enter phone number and password
# Click "Sign In"
# Should redirect to /home (if setup complete) or /SignInSetUp (if incomplete)
```

## Debugging

### Check if backend is reachable:
```bash
# Open browser console
# Run:
fetch('https://your-backend.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

Expected: `{ status: "ok", timestamp: "..." }`

### Check authentication:
```bash
# Open browser console
# Check token:
console.log('Cookie:', document.cookie);
console.log('LocalStorage:', localStorage.getItem('token'));
```

### Check API calls:
```bash
# Open browser DevTools → Network tab
# Filter by "Fetch/XHR"
# Look for calls to your backend URL
# Check:
- Request URL (should be full backend URL)
- Request Headers (should include Authorization)
- Response Status (should be 200 for success)
- Response Body (should contain user data)
```

## Common Issues

### Issue: Still getting "Failed to fetch"

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Verify backend is deployed and running on Railway
3. Check CORS is configured on backend to allow your frontend domain
4. Test backend directly: `curl https://your-backend.railway.app/health`

### Issue: User not redirecting after signup

**Solution:**
1. Check browser console for errors
2. Verify `AuthGuard` is wrapping your app layout
3. Check that registration returns `user` object with `isSetupComplete: false`
4. Clear browser cache and cookies, try again

### Issue: Data not saving

**Solution:**
1. Check Network tab for failed API calls
2. Verify token is being sent in Authorization header
3. Check backend logs: `railway logs --follow`
4. Verify database connection is working

### Issue: Login not working

**Solution:**
1. Verify user was created in database
2. Check password is correct
3. Check backend logs for authentication errors
4. Verify JWT_SECRET is set on backend

## Files Modified

### Frontend
1. `demedia/src/contexts/AuthContext.tsx` - Fixed API calls to use full backend URL
2. `demedia/src/lib/api.ts` - Updated API_BASE to use NEXT_PUBLIC_API_URL
3. `demedia/src/components/AuthGuard.tsx` - Already correct, handles routing
4. `demedia/src/app/(auth)/sign-up/page.tsx` - Already correct, calls register
5. `demedia/src/app/(auth)/SignInSetUp/page.tsx` - Already correct, saves birthdate
6. `demedia/src/app/(auth)/interests/page.tsx` - Already correct, saves interests
7. `demedia/src/app/(auth)/FinishSetup/page.tsx` - Already correct, completes setup

### Backend
1. `backend/src/routes/auth.js` - Fixed complete-setup endpoint
2. `backend/server.js` - Updated CORS configuration
3. `backend/src/utils/storage.js` - Fixed uploads directory permissions

## Deployment Checklist

### Frontend (Vercel)
- [ ] Set `NEXT_PUBLIC_API_URL` environment variable
- [ ] Redeploy frontend
- [ ] Test signup flow
- [ ] Test login flow

### Backend (Railway)
- [ ] Set `FRONTEND_ORIGIN` environment variable
- [ ] Set `DATABASE_URL` environment variable
- [ ] Set `JWT_SECRET` environment variable
- [ ] Deploy backend
- [ ] Check logs: `railway logs`
- [ ] Test health endpoint

## Success Indicators

- [ ] No "Failed to fetch" errors in console
- [ ] User can register successfully
- [ ] User redirected to SignInSetUp after signup
- [ ] Birthdate saves and redirects to interests
- [ ] Interests save and redirect to FinishSetup
- [ ] Setup completes and redirects to home
- [ ] User can login successfully
- [ ] Logged-in user redirected based on setup status

## Support

If issues persist:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Check backend logs: `railway logs --follow`
4. Verify environment variables are set correctly
5. Test backend endpoints directly with curl/Postman

All authentication and routing issues are now fixed! 🎉
