# Changelog

All notable changes to the Thirstee project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Build System**: Removed unused `react-spring` dependency causing React 19 peer dependency conflicts
- **Deployment**: Fixed Vercel build errors by resolving package dependency issues
- **Authentication**: Resolved Google OAuth token exposure in browser URLs
- **Database**: Fixed attendee count queries and foreign key constraints
- **Mobile Menu**: Corrected glassmorphism effects and accessibility standards
- **Event Cards**: Fixed clickability and event propagation handling
- **Time Display**: Corrected event timing logic using date-fns for accuracy

### Added
- **Age Gate**: Implemented age verification system per compliance requirements
- **Progress Tracking**: User statistics and event participation analytics
- **Delete Profile**: Secure account deletion with data cleanup
- **Event Ratings**: Star rating system with Google Reviews design pattern

## [0.2.0] - 2025-06-17

### Added
- **Design System**: Complete Apple Liquid Glass design system implementation
- **Mobile Optimization**: Mobile-first responsive design with touch-friendly interactions
- **Event System**: Comprehensive event creation, management, and RSVP functionality
- **Crew System**: Social groups with invite management and visibility controls
- **User Profiles**: Enhanced profile pages with event history and statistics
- **Rating System**: Event rating and review functionality
- **Notification System**: Real-time notifications with badge counters
- **Timeline View**: Lu.ma-style event timeline with date groupings
- **Search & Filters**: Advanced event discovery with location-based search

### Changed
- **Branding**: Evolved from "Clink" to "Thirstee" with new visual identity
- **Color Palette**: Implemented monochromatic white/gray system with neon green accents
- **Typography**: Standardized font weights and color hierarchy
- **Navigation**: Redesigned header with profile dropdown and notification center
- **Cards**: Unified glassmorphism effects across all components
- **Buttons**: Three-tier button system (Primary, Secondary, Glass)

### Technical
- **Frontend**: React 19 with TypeScript and Tailwind CSS
- **Backend**: Supabase with Row Level Security (RLS)
- **Authentication**: Magic links and Google OAuth integration
- **Database**: PostgreSQL with real-time subscriptions
- **Deployment**: Vercel with automated CI/CD
- **Maps**: Mapbox integration for location services
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **State Management**: React Query for server state and caching
- **Form Handling**: React Hook Form with Zod validation

### Performance
- **Bundle Optimization**: Code splitting with manual chunks for vendor libraries
- **Image Optimization**: WebP format for event cover images
- **Caching Strategy**: Implemented to prevent page reloads on navigation
- **Mobile Performance**: Disabled excessive transitions and animations

## [0.1.0] - 2024-12-01

### Added
- **Initial Release**: Basic drinking session management platform
- **Core Features**: User authentication, session creation, RSVP system
- **Database**: Initial Supabase setup with events and RSVPs tables
- **UI Framework**: Shadcn/ui components with Tailwind CSS
- **Local Development**: Docker-based Supabase local environment

### Security
- **Authentication**: Secure user registration and login
- **Data Protection**: Row Level Security policies implemented
- **Environment**: Proper environment variable management

---

## Development Notes

### Version Numbering
- **Major** (X.0.0): Breaking changes, major feature releases
- **Minor** (0.X.0): New features, significant improvements
- **Patch** (0.0.X): Bug fixes, minor improvements

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality  
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
- **Technical**: Infrastructure and development changes

### Recent Focus Areas
- **Design System**: Complete visual overhaul with glassmorphism
- **Mobile Experience**: Touch-optimized interface design
- **Performance**: Build optimization and dependency management
- **User Experience**: Intuitive navigation and interaction patterns
- **Security**: Enhanced authentication and data protection
- **Accessibility**: WCAG compliance and mobile-friendly interactions

### Key Fixes Applied
- **Google OAuth**: Database error resolution and localhost configuration
- **Crew System**: RLS policy fixes and infinite recursion prevention
- **Event Management**: Attendee count accuracy and foreign key constraints
- **UI Consistency**: Design system violations and component standardization
- **Mobile Optimization**: Touch targets, spacing, and responsive behavior

---

## Migration Notes

### From v0.1.0 to v0.2.0
- **Database Schema**: Run migration scripts in `/supabase/migrations/`
- **Environment Variables**: Update `.env.local` with new Mapbox tokens
- **Dependencies**: Clean install recommended due to React 19 upgrade
- **Authentication**: Reconfigure OAuth providers for new redirect URLs

### Breaking Changes
- **API Endpoints**: Some Supabase function signatures changed
- **Component Props**: Updated prop interfaces for design system compliance
- **CSS Classes**: Legacy amber/orange classes removed, replaced with white/gray system

---

*For detailed technical documentation, see the `/frontend` directory documentation files.*
