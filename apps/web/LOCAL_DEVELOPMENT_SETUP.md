# 🚀 Local Development Setup Guide

This guide will help you set up the Thirstee app for consistent local development with proper authentication support.

## 🎯 What This Setup Provides

✅ **Consistent localhost URL**: Always runs on `http://localhost:3000`  
✅ **Google OAuth Support**: Works properly with localhost redirects  
✅ **Magic Link Authentication**: Redirects correctly to your local environment  
✅ **Environment Detection**: Automatically detects local vs production  
✅ **Debug Logging**: Enhanced logging for local development  

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (v18 or later)
- npm or yarn
- Docker Desktop (for local Supabase)
- Supabase CLI

## 🔧 Step 1: Install Supabase CLI

### macOS (using Homebrew)
```bash
brew install supabase/tap/supabase
```

### Other platforms
```bash
npm install -g supabase
```

## 🐳 Step 2: Start Local Supabase

1. **Initialize Supabase** (if not already done):
   ```bash
   supabase init
   ```

2. **Start local Supabase**:
   ```bash
   supabase start
   ```

3. **Get your local credentials**:
   ```bash
   supabase status
   ```

   This will show output like:
   ```
   API URL: http://localhost:54321
   anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## ⚙️ Step 3: Configure Environment

1. **Copy the local environment template**:
   ```bash
   cd frontend
   cp .env.local .env.local.example
   ```

2. **Update `.env.local`** with your local Supabase credentials:
   ```env
   # Local Development Environment Configuration
   VITE_API_URL=http://localhost:3000
   
   # Update these with values from 'supabase status'
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=your_local_anon_key_here
   
   # These remain the same
   VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoicm91Z2hpbiIsImEiOiJjbWJiMWh0a2YwdTVjMmtwcm5ubzI2MnpnIn0.zZ7-Pto8J7YiWZJzxf7kvQ
   VITE_MAPBOX_STYLE_URL=mapbox://styles/roughin/cmbb1ow4o001b01r0aux92662
   VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
   
   # Environment Detection
   VITE_ENVIRONMENT=local
   ```

   **🔐 SECURITY IMPORTANT:**
   - Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual Google Maps API key
   - **NEVER commit actual API keys to version control**
   - Your `.env.local` file is already excluded by `.gitignore`
   - Get your Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)

## 🔐 Step 4: Configure Google OAuth (Optional)

If you want to test Google OAuth locally:

1. **Go to Google Cloud Console**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (or create one)

2. **Configure OAuth Consent Screen**:
   - Go to APIs & Services > OAuth consent screen
   - Add `http://localhost:3000` to authorized domains

3. **Update OAuth Credentials**:
   - Go to APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add to "Authorized redirect URIs":
     - `http://localhost:3000/auth/callback`
     - `http://localhost:54321/auth/v1/callback` (for Supabase)

4. **Configure Supabase Auth**:
   - Open Supabase Studio: `http://localhost:54323`
   - Go to Authentication > Settings
   - Add Google as a provider with your OAuth credentials

## 🚀 Step 5: Start Development Server

```bash
cd frontend
npm install
npm run dev
```

The app will be available at: **http://localhost:3000**

## 🧪 Step 6: Test Authentication

1. **Test Magic Link**:
   - Go to `http://localhost:3000/login`
   - Enter your email
   - Check your email for the magic link
   - Click the link - it should redirect to `http://localhost:3000/auth/callback`

2. **Test Google OAuth** (if configured):
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should redirect back to `http://localhost:3000/auth/callback`

## 🔍 Debugging

The app includes enhanced debugging for local development:

- **Environment Detection**: Check browser console for environment info
- **Authentication URLs**: URLs are logged during auth flows
- **Supabase Debug**: Enabled automatically in local mode

## 📝 Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run dev:local` - Start with explicit local mode
- `npm run build` - Build for production
- `npm run preview` - Preview production build on port 3000

## 🔧 Troubleshooting

### Port 3000 Already in Use
```bash
# Find what's using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### Supabase Connection Issues
```bash
# Restart Supabase
supabase stop
supabase start

# Check status
supabase status
```

### Authentication Redirects to Production
- Verify `.env.local` has `VITE_ENVIRONMENT=local`
- Check browser console for environment detection logs
- Clear browser cache and localStorage

## 🌐 Production vs Local

The app automatically detects the environment:

- **Local**: `localhost:3000` with local Supabase
- **Production**: Your production domain with production Supabase

Environment detection is handled by `src/lib/envUtils.ts`.

## 📚 Next Steps

Once local development is working:

1. Set up your production environment
2. Configure production Google OAuth
3. Update production redirect URLs
4. Deploy to your hosting platform

---

**Need Help?** Check the main README.md or create an issue in the repository.
