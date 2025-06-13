# 🔐 Localhost Authentication Configuration - Complete Setup

This document summarizes the comprehensive localhost authentication configuration implemented for the Thirstee app.

## 🎯 Problems Solved

✅ **Fixed Port Configuration**: App now consistently runs on `http://localhost:3000`  
✅ **Google OAuth Localhost Support**: Proper redirect URL configuration for local development  
✅ **Magic Link Localhost Support**: Magic links redirect to localhost instead of production  
✅ **Environment Detection**: Automatic detection of local vs production environments  
✅ **Enhanced Debugging**: Comprehensive logging for local development  
✅ **Automated Setup**: One-command setup script for new developers  

## 🔧 Changes Made

### 1. Vite Configuration (`frontend/vite.config.ts`)
- **Fixed Port**: Always uses port 3000 with `strictPort: true`
- **Network Access**: Enabled `host: true` for mobile testing
- **Consistent Preview**: Production builds also use port 3000

### 2. Environment Management
- **Environment Detection** (`frontend/src/lib/envUtils.ts`):
  - Automatic detection of local vs production
  - Environment-aware URL generation
  - Centralized configuration management

- **Environment Validation** (`frontend/src/lib/envValidator.ts`):
  - Validates configuration on startup
  - Provides helpful error messages
  - Warns about common misconfigurations

### 3. Authentication Service Updates (`frontend/src/lib/authService.ts`)
- **Dynamic Redirect URLs**: Uses environment-aware callback URLs
- **Enhanced Logging**: Debug information in local development
- **Consistent Behavior**: Same authentication flow across environments

### 4. Supabase Configuration (`frontend/src/lib/supabase.ts`)
- **Environment-Aware Debug**: Enables debug mode in local environments
- **Client Identification**: Different client headers for local vs production
- **Configuration Logging**: Logs setup details in local development

### 5. Package Scripts (`frontend/package.json`)
- **Consistent Port**: All scripts use port 3000
- **Local Mode**: Added `dev:local` script for explicit local mode
- **Start Alias**: Added `start` script for convenience

### 6. Environment Files
- **Local Template** (`.env.local`): Template for local development
- **Production Config** (`.env`): Maintains production settings
- **Environment Variable**: Added `VITE_ENVIRONMENT` for explicit control

### 7. Setup Automation
- **Setup Script** (`setup-local-dev.sh`): One-command setup for new developers
- **Documentation** (`frontend/LOCAL_DEVELOPMENT_SETUP.md`): Comprehensive setup guide
- **Updated README**: Integrated new setup process

## 🚀 How to Use

### For New Developers
```bash
# One-command setup
./setup-local-dev.sh

# Start development
cd frontend
npm run dev
```

### For Existing Developers
```bash
# Update your local environment
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your local Supabase credentials

# Start with consistent port
npm run dev
```

## 🔍 Authentication Flow

### Magic Link Authentication
1. User enters email on login page
2. System detects environment (local vs production)
3. Magic link sent with correct callback URL:
   - **Local**: `http://localhost:3000/auth/callback`
   - **Production**: `https://yourdomain.com/auth/callback`
4. User clicks link and is redirected to correct environment
5. Authentication completes successfully

### Google OAuth Authentication
1. User clicks "Sign in with Google"
2. System detects environment and uses appropriate callback URL
3. Google OAuth configured with both URLs:
   - **Local**: `http://localhost:3000/auth/callback`
   - **Production**: `https://yourdomain.com/auth/callback`
4. OAuth flow completes and redirects to correct environment
5. User profile created and session established

## 🛠️ Configuration Requirements

### Google Cloud Console Setup
For Google OAuth to work in local development:

1. **OAuth Consent Screen**:
   - Add `localhost` to authorized domains (for testing)

2. **OAuth 2.0 Client ID**:
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:54321/auth/v1/callback` (Supabase local)
     - Your production callback URLs

### Supabase Configuration
1. **Local Supabase** (via Supabase Studio at `http://localhost:54323`):
   - Configure Google OAuth provider with your credentials
   - Set up any required database policies

2. **Production Supabase**:
   - Configure Google OAuth provider
   - Ensure redirect URLs include your production domain

## 🔧 Troubleshooting

### Common Issues and Solutions

**Port 3000 already in use:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Authentication redirects to production:**
- Check `.env.local` has `VITE_ENVIRONMENT=local`
- Verify Supabase URL is `http://localhost:54321`
- Clear browser cache and localStorage

**Google OAuth not working:**
- Verify Google Cloud Console has localhost redirect URLs
- Check Supabase local instance has Google provider configured
- Ensure OAuth credentials are correct

**Magic links redirect to production:**
- Verify environment detection is working (check console logs)
- Ensure `.env.local` is being loaded
- Check that `VITE_ENVIRONMENT=local` is set

### Debug Information

The app provides extensive debugging in local development:

- **Environment Detection**: Logged on startup
- **Authentication URLs**: Logged during auth flows
- **Supabase Configuration**: Logged when client initializes
- **Validation Results**: Logged after environment validation

Check browser console for detailed information.

## 📋 Environment Variables Reference

### Local Development (`.env.local`)
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
VITE_ENVIRONMENT=local
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
VITE_MAPBOX_STYLE_URL=your_mapbox_style
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Production (`.env`)
```env
VITE_API_URL=https://yourdomain.com
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_ENVIRONMENT=production
# ... other production variables
```

## 🎉 Benefits

1. **Consistent Development**: All developers use the same localhost URL
2. **Seamless Authentication**: Both Google OAuth and magic links work locally
3. **Easy Setup**: New developers can get started with one command
4. **Better Debugging**: Comprehensive logging and validation
5. **Environment Safety**: Clear separation between local and production
6. **Mobile Testing**: Network access enabled for testing on mobile devices

## 📚 Next Steps

1. **Test the Setup**: Run through the authentication flows
2. **Configure Google OAuth**: Set up OAuth credentials for local development
3. **Team Onboarding**: Share the setup script with your team
4. **Production Deployment**: Ensure production environment variables are correct
5. **Documentation**: Keep this configuration documented for future reference

---

**Need Help?** Check the detailed setup guide in `frontend/LOCAL_DEVELOPMENT_SETUP.md` or create an issue in the repository.
