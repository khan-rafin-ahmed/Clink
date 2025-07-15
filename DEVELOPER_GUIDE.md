# 🚀 Thirstee Monorepo Developer Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm 10+
- Expo CLI (for mobile development)
- Expo Go app (SDK 53 compatible)

### Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd Clink
npm install
```

### Development Commands

#### Web App
```bash
npm run web:dev          # Start web app on localhost:3000
npm run web:build        # Build web app for production
```

#### Mobile App
```bash
npm run mobile:dev       # Start Expo development server
npm run mobile:build     # Build mobile app
```

#### All Apps
```bash
npm run dev              # Start both web and mobile
npm run build            # Build all apps
npm run lint             # Lint all packages
npm run type-check       # Type check all packages
```

---

## 📁 Project Structure

```
/
├── apps/
│   ├── web/                 # React web app
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── mobile/              # Expo React Native app
│       ├── src/
│       ├── App.tsx
│       └── package.json
├── packages/
│   ├── shared/              # Shared business logic
│   │   ├── src/
│   │   │   ├── lib/         # Services (auth, user, etc.)
│   │   │   ├── hooks/       # React hooks
│   │   │   ├── types/       # TypeScript definitions
│   │   │   └── constants/   # App constants
│   │   └── package.json
│   └── config/              # Shared configuration
│       ├── tailwind/        # Base Tailwind config
│       └── typescript/      # Base TypeScript config
├── turbo.json               # Turborepo configuration
└── package.json             # Root workspace
```

---

## 🔧 Working with Shared Code

### Importing Shared Services
```typescript
// In any app (web or mobile)
import { supabase, signInWithGoogle } from '@shared/lib/authService'
import { getUserProfile } from '@shared/lib/userService'
import { useAuth } from '@shared/hooks/useAuth'
import type { UserProfile, Event } from '@shared/types'
```

### Adding New Shared Code
1. Add to `packages/shared/src/`
2. Export from `packages/shared/src/index.ts`
3. Use in apps with `@shared/` import

### Platform-Specific Code
- Web-specific: Keep in `apps/web/src/`
- Mobile-specific: Keep in `apps/mobile/src/`
- Shared: Move to `packages/shared/src/`

---

## 🎨 Design System

### Tailwind Classes
Both apps use the same Tailwind configuration:

```typescript
// Thirstee brand colors
bg-bg-base          // #08090A (main background)
bg-bg-glass         // rgba(255, 255, 255, 0.05) (glass effect)
text-text-primary   // #FFFFFF (primary text)
text-neon-green     // #00FFA3 (accent color)
border-border-default // rgba(255, 255, 255, 0.1)
```

### Adding New Styles
1. Update `packages/config/tailwind/base.js`
2. Both apps automatically inherit changes

---

## 📱 Mobile Development

### Running on Device
```bash
npm run mobile:dev
# Scan QR code with Expo Go app
```

### Running on Simulator
```bash
npm run mobile:dev
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

### NativeWind (Tailwind for React Native)
- Use same Tailwind classes as web
- Automatically converted to React Native styles
- No need for StyleSheet.create()

---

## 🔐 Authentication

### Shared Auth Flow
```typescript
import { useAuth } from '@shared/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <LoginScreen />
  
  return <AuthenticatedContent user={user} />
}
```

### Platform-Specific Auth
- **Web**: OAuth redirects to `/auth/callback`
- **Mobile**: Deep links to `thirstee://auth/callback`

---

## 🧪 Testing

### Type Checking
```bash
npm run type-check       # Check all packages
cd packages/shared && npm run type-check  # Check specific package
```

### Linting
```bash
npm run lint             # Lint all packages
cd apps/web && npm run lint  # Lint specific app
```

---

## 🚀 Deployment

### Web App (Vercel)
1. Update Vercel settings:
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Mobile App (EAS Build)
```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

---

## 🛠 Troubleshooting

### Common Issues

#### "Module not found" errors
- Ensure `npm install` was run in root directory
- Check import paths use `@shared/` prefix
- Verify exports in `packages/shared/src/index.ts`

#### TypeScript errors in mobile
- Ensure `nativewind-env.d.ts` is included in tsconfig
- Check NativeWind is properly configured

#### Metro bundler issues
- Clear cache: `npx expo start --clear`
- Restart Metro: `npx expo start --reset-cache`

### Getting Help
1. Check existing documentation
2. Review error messages carefully
3. Ensure all dependencies are installed
4. Try clearing caches and restarting

---

## 📚 Next Steps

### Immediate Tasks
1. Set up environment variables for mobile
2. Configure deep linking for mobile auth
3. Add more shared services (events, crews)
4. Set up testing infrastructure

### Future Enhancements
1. Add `packages/ui` for shared components
2. Set up CI/CD pipelines
3. Add performance monitoring
4. Implement push notifications

---

Happy coding! 🎉
