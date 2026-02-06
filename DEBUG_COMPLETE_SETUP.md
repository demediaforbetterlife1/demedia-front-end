# Debug Complete Setup Issue

## Error Message
"Completion failed, please try again" when clicking Save in SignInSetUp page

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
- `Saving date of birth: YYYY-MM-DD`
- `Complete-setup response status: XXX`
- `Complete-setup response data: {...}`
- Any error messages

### 2. Check Network Tab
In DevTools Network tab, find the request to `/api/auth/complete-setup`:
- **Request Headers**: Check if `Cookie` header is present with token
- **Request Payload**: Should show `{"dob":"YYYY-MM-DD"}`
- **Response Status**: Should be 200, if not check response body
- **Response Body**: Check for error messages

### 3. Check Backend Logs
If you have access to backend logs (Fly.io dashboard):
- Look for `[complete-setup]` log entries
- Check if request is reaching backend
- Look for authentication errors
- Check if DOB is being saved

### 4. Common Issues

#### Issue: 401 Unauthorized
**Cause**: Token not being sent or invalid
**Solution**: 
- Check if token exists in cookies: `document.cookie`
- Check if token exists in localStorage: `localStorage.getItem('token')`
- Try logging out and logging in again

#### Issue: 500 Internal Server Error
**Cause**: Backend error processing request
**Solution**:
- Check backend logs for detailed error
- Verify database connection
- Check if user exists in database

#### Issue: Network Error
**Cause**: Cannot reach backend
**Solution**:
- Check if backend is running: `https://demedia-backend.fly.dev/health`
- Check internet connection
- Check if Fly.io service is up

### 5. Manual Test

Open browser console and run:

```javascript
// Check if token exists
console.log('Cookie token:', document.cookie.includes('token'));
console.log('LocalStorage token:', !!localStorage.getItem('token'));

// Test the endpoint manually
fetch('/api/auth/complete-setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ dob: '1990-01-01' })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### 6. Check Token in Backend

The backend expects the token in one of these places:
1. Cookie: `token=xxx`
2. Authorization header: `Bearer xxx`

The complete-setup route forwards both, so it should work.

### 7. Verify Backend Endpoint

The backend endpoint at `backend/src/routes/auth.js` line ~550:
- Requires authentication (uses `authenticateToken` middleware)
- Expects `{ dob: "YYYY-MM-DD" }` in body
- Returns `{ message: "...", user: {...} }`

### 8. Quick Fix Options

If the issue persists, try these workarounds:

#### Option A: Use AuthContext method
Instead of direct fetch, use the AuthContext method which handles auth properly:

```typescript
const { updateUserProfile } = useAuth();
const result = await updateUserProfile({ dob: dobIso });
```

#### Option B: Add explicit token
Get token from storage and add to headers:

```typescript
const token = getCookie("token") || localStorage.getItem("token");
const res = await fetch("/api/auth/complete-setup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify({ dob: dobIso }),
});
```

### 9. Expected Flow

1. User fills DOB in SignInSetUp
2. Clicks "Save & Continue"
3. Frontend sends POST to `/api/auth/complete-setup` with `{ dob: "YYYY-MM-DD" }`
4. Frontend proxy forwards to backend with cookies/auth
5. Backend authenticates user via token
6. Backend saves DOB to database
7. Backend returns `{ message: "...", user: {...} }`
8. Frontend updates user state
9. Frontend redirects to `/interests`

### 10. Check These Files

If issue persists, check these files for errors:
- `demedia/src/app/api/auth/complete-setup/route.ts` - Frontend proxy
- `backend/src/routes/auth.js` - Backend endpoint (line ~550)
- `demedia/src/app/(auth)/SignInSetUp/page.tsx` - Frontend page
- `demedia/src/contexts/AuthContext.tsx` - Auth context

## Next Steps

1. Open browser DevTools
2. Try to save DOB
3. Check console logs
4. Check network tab
5. Share the error details for further debugging
