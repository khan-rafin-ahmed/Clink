# 🔗 Magic Link Localhost Fix - Complete Solution

This document explains how to fix magic link authentication to redirect to localhost during local development.

## 🎯 Problem

When using **production Supabase** with **local development**, magic links redirect to production URLs instead of `http://localhost:3000/auth/callback`.

## ✅ Solution Applied

### 1. Code Changes Made

**Updated `frontend/src/lib/authService.ts`**:
- **Forced localhost URLs** in local development
- **Enhanced logging** to track redirect URLs
- **Explicit `emailRedirectTo`** parameter override

### 2. Supabase Dashboard Configuration

You need to configure your **production Supabase** to allow localhost redirects:

#### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Open your project: `arpphimkotjvnfoacquj`
3. Navigate to **Authentication** → **Settings**

#### Step 2: Configure Redirect URLs
1. Find **"Site URL"** section
2. Add these URLs to **"Redirect URLs"**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   https://your-production-domain.com/auth/callback
   https://your-production-domain.com/**
   ```

#### Step 3: Update Site URL (Optional)
- **Site URL**: Keep your production URL
- **Additional Redirect URLs**: Include localhost URLs

## 🧪 Testing the Fix

### Test Magic Link Authentication

1. **Start your local app**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Go to login page**:
   ```
   http://localhost:3000/login
   ```

3. **Enter your email and send magic link**

4. **Check browser console** - you should see:
   ```
   🔗 Magic Link Callback URL (forced localhost): http://localhost:3000/auth/callback
   ✅ Magic link sent successfully to: your-email@example.com
   📧 Expected redirect URL: http://localhost:3000/auth/callback
   ```

5. **Check your email** - the magic link should now redirect to localhost

6. **Click the magic link** - should redirect to:
   ```
   http://localhost:3000/auth/callback
   ```

## 🔍 Debugging

### If Magic Links Still Redirect to Production

**Check Console Logs**:
- Look for the "Magic Link Callback URL" log
- Verify it shows `http://localhost:3000/auth/callback`

**Verify Environment Detection**:
- Check that environment is detected as "local"
- Look for environment configuration logs

**Clear Browser Cache**:
```bash
# Clear all browser data for localhost:3000
# Or use browser dev tools → Application → Clear Storage
```

**Check Supabase Dashboard**:
- Verify redirect URLs include localhost
- Check that there are no conflicting settings

### Common Issues

**1. Environment Not Detected as Local**
```javascript
// Check in browser console:
console.log('Environment:', import.meta.env.VITE_ENVIRONMENT)
console.log('Is Local:', window.location.hostname === 'localhost')
```

**2. Supabase Dashboard Override**
- Supabase dashboard settings can override code settings
- Make sure localhost URLs are in the allowed redirect URLs

**3. Email Provider Blocking**
- Some email providers block localhost URLs
- Try with different email addresses/providers

## 🔧 Alternative Solutions

### Option 1: Use ngrok for HTTPS Localhost
If magic links still don't work, you can use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, expose localhost:3000
ngrok http 3000
```

Then use the ngrok HTTPS URL in your Supabase settings.

### Option 2: Local Supabase Instance
Switch back to local Supabase for development:

```bash
# Start local Supabase
supabase start

# Update .env.local to use local Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

## 📋 Verification Checklist

- [ ] Code updated with forced localhost URLs
- [ ] Supabase dashboard configured with localhost redirect URLs
- [ ] Environment detected as "local" in browser console
- [ ] Magic link callback URL logged as localhost
- [ ] Email received with localhost magic link
- [ ] Magic link redirects to `http://localhost:3000/auth/callback`
- [ ] Authentication completes successfully

## 🎉 Expected Result

After applying this fix:

1. **Magic links** will redirect to `http://localhost:3000/auth/callback`
2. **Google OAuth** will redirect to `http://localhost:3000/auth/callback`
3. **Authentication flow** completes entirely in localhost
4. **No more redirects** to production during local development

## 📞 Need Help?

If magic links still redirect to production:

1. **Check browser console** for the callback URL logs
2. **Verify Supabase dashboard** redirect URL settings
3. **Try different email providers** (Gmail, Outlook, etc.)
4. **Consider using ngrok** for HTTPS localhost testing

The key is that the `emailRedirectTo` parameter in the code should now override any dashboard settings for local development.
