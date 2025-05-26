# 🔧 Google OAuth Setup Guide

The Google sign-in button is currently showing a server error because Google OAuth isn't configured in Supabase yet. Here's how to fix it:

## 🚀 Step 1: Configure Google OAuth in Supabase

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `arpphimkotjvnfoacquj`
3. **Navigate to**: Authentication → Providers
4. **Find Google** in the list and click to configure
5. **Enable the Google provider**

## 🔑 Step 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable the Google+ API**:
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"

## 🌐 Step 3: Configure Redirect URIs

Add these authorized redirect URIs in Google Cloud Console:

**Production:**
```
https://arpphimkotjvnfoacquj.supabase.co/auth/v1/callback
```

**Development:**
```
http://localhost:5175/auth/callback
```

## 📋 Step 4: Add Credentials to Supabase

1. **Copy the Client ID and Client Secret** from Google Cloud Console
2. **Go back to Supabase** → Authentication → Providers → Google
3. **Paste the credentials**:
   - Client ID: `your-google-client-id`
   - Client Secret: `your-google-client-secret`
4. **Save the configuration**

## ✅ Step 5: Test

1. **Restart your app** (if needed)
2. **Try the Google sign-in button**
3. **Should redirect to Google** and back to your app

## 🔄 Alternative: Use Magic Link

Until Google OAuth is set up, users can sign in with magic links:
1. Enter email address
2. Click "Send magic link"
3. Check email and click the link
4. Automatically signed in!

## 🍻 That's it!

Once configured, users will be able to sign in with Google and the server error will be gone!
