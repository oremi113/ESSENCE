# Authentication Bug Report for Replit Support

## Summary
Express.js application with Passport authentication works via curl/server-side requests but fails in browser with 401/500 errors. Session cookies are not being properly set/sent in browser requests despite correct configuration.

## Environment
- **Replit Deployment**: Production
- **Stack**: Express.js + React (Vite) + PostgreSQL (Neon)
- **Session Store**: connect-pg-simple (PostgreSQL-backed sessions)
- **Authentication**: Passport.js with Local Strategy
- **Database**: Neon PostgreSQL (confirmed working)

## Issue Details

### What Works
✅ Backend authentication endpoint works perfectly via curl:
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Returns: 200 OK with user data
# Logs show: User created successfully, session established
```

✅ Database operations complete successfully
✅ Session store configured correctly
✅ Password hashing works
✅ Server logs show successful authentication flow

### What Doesn't Work
❌ Browser requests fail with:
- 401 Unauthorized errors on `/api/user` immediately after signup
- 500 Internal Server Error with "Failed to create account"
- Console errors mentioning "helium" (despite using Neon database)
- Session cookies not being set/sent in browser

### Browser Console Errors
```
Failed to load resource: the server responded with a status of 401 ()
Signup response status: 500
Error: Failed to create account
```

## Technical Configuration

### Current Express Setup
```javascript
// server/index.ts
const app = express();
app.set("trust proxy", 1);  // Added to trust Replit proxy

app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));
```

### Frontend Fetch Configuration
```javascript
// Both login and signup use credentials: 'include'
const response = await fetch("/api/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: 'include',
  body: JSON.stringify({ email, password, name }),
});
```

## Troubleshooting Steps Taken

1. ✅ Added `credentials: 'include'` to all fetch requests
2. ✅ Added `app.set("trust proxy", 1)` before session configuration
3. ✅ Verified backend works with curl (bypasses proxy)
4. ✅ Confirmed database connection is working
5. ✅ Verified all environment variables are set (SESSION_SECRET, DATABASE_URL, ELEVENLABS_API_KEY)
6. ✅ User performed hard refresh (Cmd+Shift+R)
7. ✅ Restarted workflow multiple times

## Root Cause Analysis

The discrepancy between curl success and browser failure strongly suggests:

1. **Proxy/Cookie Issue**: Despite setting `trust proxy`, session cookies may not be properly transmitted through Replit's proxy infrastructure to the browser
2. **CORS/Security Headers**: Possible issue with how Replit's infrastructure handles session cookies in browser context
3. **Vite Dev Server Proxy**: Potential conflict between Vite's dev server and Express session handling

### Key Observation
The error mentioning "helium" in browser console is suspicious since the backend correctly uses Neon database. This suggests:
- Old cached code in browser (but hard refresh didn't help)
- Or browser is hitting a different/stale instance
- Or there's request routing issues in Replit's infrastructure

## Expected Behavior
1. User submits signup form in browser
2. POST `/api/signup` creates user and establishes session
3. Session cookie is set via Set-Cookie header
4. Browser stores cookie and includes it in subsequent requests
5. GET `/api/user` returns authenticated user data

## Actual Behavior
1. User submits signup form in browser
2. POST `/api/signup` appears to succeed on server (logs show success)
3. Session cookie is NOT received by browser (or not sent back)
4. GET `/api/user` returns 401 because session is not recognized
5. Frontend receives 500 error for signup

## Request for Replit Team

Please investigate:

1. **Session Cookie Transmission**: Why are session cookies set on the server not reaching the browser through Replit's proxy infrastructure?
2. **Proxy Configuration**: Is there additional proxy configuration needed beyond `app.set("trust proxy", 1)` for Replit deployments?
3. **Browser vs Server Requests**: Why does the same endpoint work via curl (server-side) but fail in browser?
4. **Cookie Security Settings**: Are there specific cookie settings required for Replit's production environment?

## Additional Context

### Server Logs (curl test - WORKS)
```
[SIGNUP] Starting signup - SERVER INFO: { pid: 1522, dbType: 'NEON', timestamp: '...' }
[SIGNUP] Checking if user exists
[SIGNUP] Hashing password
[SIGNUP] Creating user in database
[SIGNUP] User created successfully: 1832e1be-39fe-4a9f-8795-0b1eb444d0ee
[SIGNUP] Attempting to log in user
[SIGNUP] Login successful, sending response
POST /api/signup 200 in 1299ms
```

### Server Logs (browser request - FAILS)
No signup logs appear, suggesting request may not be reaching the Express app properly, or failing earlier in the proxy chain.

## Files for Review
- `server/index.ts` - Express and session configuration
- `server/routes.ts` - Authentication endpoints
- `server/auth.ts` - Passport configuration
- `client/src/pages/signup.tsx` - Frontend signup component
- `client/src/pages/login.tsx` - Frontend login component

---

**Urgency**: High - Application is non-functional for end users
**Date**: October 1, 2025
**Repl**: ESSENCE (Voice message application)
