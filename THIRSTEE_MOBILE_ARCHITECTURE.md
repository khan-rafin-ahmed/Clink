# 📱 Thirstee Mobile App Architecture

## 🏗️ **Overview**

The Thirstee mobile app is built with **Expo React Native** and **NativeWind** (Tailwind for React Native), sharing ~70% of business logic with the web app through the monorepo's shared packages.

### **Tech Stack**
- **Framework**: Expo SDK 53 + React Native 0.76
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Navigation**: React Navigation v6 (Stack + Tab navigators)
- **State Management**: React Query + Context API
- **Authentication**: Supabase Auth with OAuth
- **Database**: Supabase (shared with web app)
- **Development**: TypeScript + Turborepo

---

## 📁 **Project Structure**

```
apps/mobile/
├── App.tsx                          # Root app component
├── app.json                         # Expo configuration
├── babel.config.js                  # Babel + NativeWind config
├── metro.config.js                  # Metro bundler config
├── tailwind.config.js               # Tailwind config (extends shared)
├── tsconfig.json                    # TypeScript config
├── nativewind-env.d.ts             # NativeWind type definitions
└── src/
    ├── components/                  # Reusable UI components
    │   ├── common/                  # Cross-screen components
    │   ├── forms/                   # Form-specific components
    │   └── ui/                      # Base UI components
    ├── hooks/                       # Mobile-specific hooks
    │   ├── useDeviceInfo.ts         # Device capabilities
    │   ├── useKeyboard.ts           # Keyboard handling
    │   └── useOrientation.ts        # Screen orientation
    ├── lib/                         # Mobile-specific utilities
    │   ├── AuthContext.tsx          # Auth context wrapper
    │   ├── deepLinking.ts           # Deep link handling
    │   ├── notifications.ts         # Push notifications
    │   └── storage.ts               # AsyncStorage utilities
    ├── navigation/                  # Navigation configuration
    │   ├── AppNavigator.tsx         # Main navigator
    │   ├── TabNavigator.tsx         # Bottom tab navigator
    │   └── types.ts                 # Navigation type definitions
    ├── screens/                     # Screen components
    │   ├── auth/                    # Authentication screens
    │   ├── events/                  # Event-related screens
    │   ├── profile/                 # Profile screens
    │   └── discover/                # Discovery screens
    └── utils/                       # Mobile-specific utilities
        ├── dimensions.ts            # Screen dimensions
        ├── haptics.ts              # Haptic feedback
        └── permissions.ts          # Device permissions
```

---

## 🧩 **Core Components**

### **Navigation Structure**
```typescript
// Main App Navigator
AppNavigator
├── AuthStack (when not authenticated)
│   └── LoginScreen
└── MainStack (when authenticated)
    ├── TabNavigator
    │   ├── HomeTab → HomeScreen
    │   ├── DiscoverTab → DiscoverScreen
    │   └── ProfileTab → ProfileScreen
    ├── EventDetailScreen
    ├── CreateEventScreen
    ├── EditProfileScreen
    └── NotificationsScreen
```

### **Screen Components**

#### **Authentication Screens**
- `LoginScreen` - Google OAuth login with shared auth service
- `OnboardingScreen` - First-time user setup (future)

#### **Main Screens**
- `HomeScreen` - Dashboard with upcoming events and quick actions
- `DiscoverScreen` - Event discovery with filters and search
- `EventDetailScreen` - Event details with RSVP functionality
- `CreateEventScreen` - Event creation form with location picker
- `ProfileScreen` - User profile with settings and sign out

#### **Modal Screens**
- `EditProfileModal` - Profile editing form
- `EventFiltersModal` - Event filtering options
- `NotificationSettingsModal` - Push notification preferences

---

## 🎨 **Design System**

### **Thirstee Mobile Design Tokens**
```typescript
// Extended from shared Tailwind config
const mobileTheme = {
  colors: {
    // Thirstee brand colors (inherited)
    'bg-base': '#08090A',           // Main background
    'bg-glass': 'rgba(255,255,255,0.05)', // Glass effect
    'text-primary': '#FFFFFF',      // Primary text
    'text-secondary': '#A1A1AA',    // Secondary text
    'neon-green': '#00FFA3',        // Accent color
    'neon-orange': '#FF5F2E',       // Live badge color
    
    // Mobile-specific additions
    'safe-area-top': '44px',        // iOS safe area
    'safe-area-bottom': '34px',     // iOS home indicator
  },
  
  spacing: {
    // Touch-friendly spacing
    'touch-target': '44px',         // Minimum touch target
    'edge-padding': '16px',         // Screen edge padding
    'section-gap': '24px',          // Between sections
  }
}
```

### **Component Patterns**

#### **Glass Effect Cards**
```typescript
// Standard glass card pattern
<View className="bg-bg-glass rounded-xl p-4 border border-border-default">
  <Text className="text-text-primary">Content</Text>
</View>
```

#### **Touch Targets**
```typescript
// Minimum 44px touch targets
<TouchableOpacity className="min-h-[44px] min-w-[44px] items-center justify-center">
  <Ionicons name="icon-name" size={24} color="#FFFFFF" />
</TouchableOpacity>
```

#### **Safe Area Handling**
```typescript
// Using SafeAreaProvider and SafeAreaView
<SafeAreaView className="flex-1 bg-bg-base">
  <ScrollView className="px-4">
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

---

## 🔗 **Shared Package Integration**

### **Imported Services**
```typescript
// From @shared/lib
import { supabase } from '@shared/lib/supabase'
import { signInWithGoogle, signOut } from '@shared/lib/authService'
import { getUserProfile, updateUserProfile } from '@shared/lib/userService'
import { getCurrentUser, isAuthenticated } from '@shared/lib/authUtils'
import { cn, formatDate, formatTime } from '@shared/lib/utils'

// From @shared/hooks
import { useAuth, useRequiredAuth } from '@shared/hooks/useAuth'
import { useDataFetching, useAuthDataFetching } from '@shared/hooks/useDataFetching'

// From @shared/types
import type { 
  UserProfile, 
  Event, 
  AuthState, 
  EventStatus,
  RSVPStatus 
} from '@shared/types'

// From @shared/constants
import { 
  APP_NAME, 
  APP_TAGLINE, 
  CACHE_TTL, 
  EVENT_STATUS,
  RSVP_STATUS 
} from '@shared/constants'
```

### **Platform-Specific Adaptations**
```typescript
// Mobile-specific auth context
export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useSharedAuth() // From shared package
  
  // Add mobile-specific auth methods
  const value: AuthContextType = {
    ...authState,
    // Mobile-specific methods would go here
    // e.g., biometric auth, deep link handling
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

---

## 🗄️ **Database Schema**

### **Shared Database Structure**
The mobile app uses the **same Supabase database** as the web app. Key tables:

#### **user_profiles**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  nickname TEXT,
  favorite_drink TEXT,
  tagline TEXT,
  email TEXT,
  profile_visibility TEXT DEFAULT 'public',
  show_crews_publicly BOOLEAN DEFAULT true,
  join_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **events**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  place_nickname TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_type TEXT DEFAULT 'specific_time',
  vibe TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  max_attendees INTEGER,
  special_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **event_members**
```sql
CREATE TABLE event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'going', 'maybe', 'not_going'
  role TEXT DEFAULT 'attendee',  -- 'attendee', 'co_host', 'host'
  invited_by UUID REFERENCES auth.users(id),
  invitation_comment TEXT,
  invitation_sent_at TIMESTAMP,
  invitation_responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

### **Mobile-Specific Considerations**
- **Offline Support**: React Query caching for offline data access
- **Real-time Updates**: Supabase real-time subscriptions for live data
- **Image Optimization**: Automatic image resizing for mobile screens
- **Location Services**: GPS integration for event location features

---

## 🔐 **Authentication Flow**

### **OAuth Implementation**
```typescript
// Mobile OAuth flow
const handleGoogleSignIn = async () => {
  try {
    // Uses shared authService with mobile-specific callback
    const result = await signInWithGoogle()
    
    if (result.success) {
      // Handle successful auth
      // Deep link will redirect to thirstee://auth/callback
    } else {
      Alert.alert('Sign In Failed', result.error)
    }
  } catch (error) {
    Alert.alert('Sign In Error', error.message)
  }
}
```

### **Deep Linking Configuration**
```typescript
// app.json configuration
{
  "expo": {
    "scheme": "thirstee",
    "plugins": [
      "expo-secure-store"
    ]
  }
}

// Deep link handling
const linking = {
  prefixes: ['thirstee://'],
  config: {
    screens: {
      AuthCallback: 'auth/callback',
      EventDetail: 'event/:eventId',
      Profile: 'profile/:username'
    }
  }
}
```

---

## 📱 **Mobile-Specific Features**

### **Native Capabilities**
- **Push Notifications**: Expo Notifications for event reminders
- **Camera Integration**: Photo capture for event images
- **Location Services**: GPS for event location and discovery
- **Haptic Feedback**: Touch feedback for interactions
- **Biometric Auth**: Face ID/Touch ID for secure login (future)

### **Performance Optimizations**
- **Image Caching**: Expo Image for optimized image loading
- **Bundle Splitting**: Code splitting for faster app startup
- **Memory Management**: Efficient list rendering with FlatList
- **Network Optimization**: Request deduplication and caching

### **Accessibility**
- **Screen Reader Support**: Proper accessibility labels
- **High Contrast**: Support for system accessibility settings
- **Large Text**: Dynamic type scaling
- **Voice Control**: Voice navigation support

---

## 🧪 **Testing Strategy**

### **Unit Testing**
- **Shared Logic**: Tested in packages/shared
- **Mobile Components**: Jest + React Native Testing Library
- **Navigation**: Navigation testing utilities

### **Integration Testing**
- **Auth Flow**: End-to-end authentication testing
- **Data Flow**: API integration testing
- **Deep Links**: Deep link navigation testing

### **Device Testing**
- **iOS Simulator**: iPhone 14/15 Pro testing
- **Android Emulator**: Pixel 7 testing
- **Physical Devices**: Real device testing via Expo Go

---

## 🚀 **Deployment**

### **Development**
```bash
npm run mobile:dev    # Start Expo development server
# Scan QR code with Expo Go app
```

### **Production Builds**
```bash
# Using EAS Build
eas build --platform ios
eas build --platform android

# App Store submission
eas submit --platform ios
eas submit --platform android
```

### **Environment Configuration**
```typescript
// Environment variables for mobile
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_api_url
```

---

## 📋 **Development Guidelines**

### **Code Organization**
- Keep mobile-specific code in `apps/mobile/src/`
- Use shared packages for business logic
- Follow React Native best practices
- Maintain consistent naming conventions

### **Performance Best Practices**
- Use FlatList for large lists
- Implement proper image optimization
- Minimize bridge calls between JS and native
- Use React.memo for expensive components

### **UI/UX Guidelines**
- Follow iOS and Android design guidelines
- Maintain 44px minimum touch targets
- Use platform-specific navigation patterns
- Implement proper loading and error states

---

## 📚 **Additional Documentation**

### **Related Files**
- `MOBILE_COMPONENTS_LIBRARY.md` - Comprehensive component library documentation
- `DEVELOPER_GUIDE.md` - Development setup and workflow guide
- `MONOREPO_MIGRATION_SUMMARY.md` - Migration implementation details
- `thirstee-monorepo-mobile-prd.md` - Product requirements and completion status

### **Shared Resources**
- `packages/shared/` - Cross-platform business logic
- `packages/config/` - Shared configuration files
- `thirstee-app-prd.md` - Web app architecture (for reference)
- `thirstee-design-system-updated.md` - Complete design system

---

This architecture provides a solid foundation for the Thirstee mobile app while maximizing code reuse with the web application through the shared monorepo structure.
